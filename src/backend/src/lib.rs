use candid::{candid_method, Principal};
use ic_cdk::api::management_canister::http_request::{
    HttpResponse, TransformArgs,
};
use ic_cdk::{caller, query, update};
use ic_cdk_macros::{heartbeat, init, post_upgrade, pre_upgrade};
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap};
use std::cell::RefCell;
use std::collections::HashMap;

mod types;
mod rates;
mod qr;
mod transactions;

use types::*;
use rates::*;
use qr::*;
use transactions::*;

type Memory = VirtualMemory<DefaultMemoryImpl>;
type UserStore = StableBTreeMap<Principal, User, Memory>;
type TransactionStore = StableBTreeMap<String, Transaction, Memory>;
type QRStore = StableBTreeMap<String, QRCode, Memory>;

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
    
    static USERS: RefCell<UserStore> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0))),
        )
    );
    
    static TRANSACTIONS: RefCell<TransactionStore> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1))),
        )
    );
    
    static QR_CODES: RefCell<QRStore> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2))),
        )
    );
    
    static EXCHANGE_RATES: RefCell<HashMap<String, ExchangeRate>> = RefCell::new(HashMap::new());
}

// ===================
// USER MANAGEMENT
// ===================

#[update]
#[candid_method(update)]
async fn register_user(wallet_address: String, username: Option<String>, email: Option<String>) -> Result<User, String> {
    let caller = caller();
    if caller == Principal::anonymous() {
        return Err("Anonymous users cannot register".to_string());
    }

    // Check if user already exists
    let existing_user = USERS.with(|users| users.borrow().get(&caller));
    if existing_user.is_some() {
        return Err("User already registered".to_string());
    }

    // Validate wallet address (basic validation)
    if wallet_address.is_empty() {
        return Err("Wallet address cannot be empty".to_string());
    }

    let user = User {
        id: caller,
        wallet_address,
        created_at: ic_cdk::api::time(),
        username,
        email,
    };

    USERS.with(|users| {
        users.borrow_mut().insert(caller, user.clone());
    });

    ic_cdk::println!("User registered: {}", caller.to_text());
    Ok(user)
}

#[update]
#[candid_method(update)]
async fn update_user_profile(username: Option<String>, email: Option<String>) -> Result<User, String> {
    let caller = caller();
    if caller == Principal::anonymous() {
        return Err("Anonymous users cannot update profile".to_string());
    }

    USERS.with(|users| {
        let mut users_borrow = users.borrow_mut();
        match users_borrow.get(&caller) {
            Some(mut user) => {
                user.username = username;
                user.email = email;
                users_borrow.insert(caller, user.clone());
                Ok(user)
            }
            None => Err("User not found. Please register first".to_string()),
        }
    })
}

#[query]
#[candid_method(query)]
fn get_user() -> Option<User> {
    let caller = caller();
    USERS.with(|users| users.borrow().get(&caller))
}

#[query]
#[candid_method(query)]
fn get_user_by_id(user_id: Principal) -> Option<User> {
    USERS.with(|users| users.borrow().get(&user_id))
}

// ===================
// EXCHANGE RATE MANAGEMENT
// ===================

#[update]
#[candid_method(update)]
async fn fetch_exchange_rate(currency: String) -> Result<ExchangeRate, String> {
    let currency_upper = currency.to_uppercase();
    
    if !is_supported_currency(&currency_upper) {
        return Err(format!("Unsupported currency: {}", currency_upper));
    }

    let exchange_rate = fetch_live_exchange_rate(currency_upper.clone()).await?;

    // Cache the rate
    EXCHANGE_RATES.with(|rates| {
        rates.borrow_mut().insert(currency_upper, exchange_rate.clone());
    });

    Ok(exchange_rate)
}

#[query]
#[candid_method(query)]
fn get_cached_exchange_rate(currency: String) -> Option<ExchangeRate> {
    let currency_upper = currency.to_uppercase();
    EXCHANGE_RATES.with(|rates| rates.borrow().get(&currency_upper).cloned())
}

#[query]
#[candid_method(query)]
fn get_supported_currencies_list() -> Vec<String> {
    get_supported_currencies()
}

// ===================
// QR CODE MANAGEMENT
// ===================

#[update]
#[candid_method(update)]
async fn generate_qr(
    fiat_amount: f64,
    fiat_currency: String,
    description: Option<String>,
) -> Result<QRCode, String> {
    let caller = caller();
    if caller == Principal::anonymous() {
        return Err("Anonymous users cannot generate QR codes".to_string());
    }

    // Check if user is registered
    let user = USERS.with(|users| users.borrow().get(&caller));
    if user.is_none() {
        return Err("User not registered. Please register first".to_string());
    }

    let qr_code = create_qr_code(caller, fiat_amount, fiat_currency, description).await?;

    QR_CODES.with(|qr_codes| {
        qr_codes.borrow_mut().insert(qr_code.id.clone(), qr_code.clone());
    });

    ic_cdk::println!("QR code generated: {}", qr_code.id);
    Ok(qr_code)
}

#[query]
#[candid_method(query)]
fn get_qr(qr_id: String) -> Option<QRCode> {
    QR_CODES.with(|qr_codes| qr_codes.borrow().get(&qr_id))
}

#[query]
#[candid_method(query)]
fn get_qr_display_info_by_id(qr_id: String) -> Option<QRDisplayInfo> {
    QR_CODES.with(|qr_codes| {
        qr_codes.borrow().get(&qr_id).map(|qr| get_qr_display_info(&qr))
    })
}

#[query]
#[candid_method(query)]
fn get_user_qr_codes() -> Vec<QRCode> {
    let caller = caller();
    QR_CODES.with(|qr_codes| {
        qr_codes
            .borrow()
            .iter()
            .filter(|(_, qr)| qr.user_id == caller)
            .map(|(_, qr)| qr.clone())
            .collect()
    })
}

#[update]
#[candid_method(update)]
async fn validate_qr_code(qr_id: String) -> Result<QRDisplayInfo, String> {
    let qr_code = QR_CODES.with(|qr_codes| qr_codes.borrow().get(&qr_id))
        .ok_or("QR code not found")?;

    is_qr_code_valid(&qr_code)?;
    Ok(get_qr_display_info(&qr_code))
}

// ===================
// TRANSACTION MANAGEMENT
// ===================

#[update]
#[candid_method(update)]
async fn process_payment(qr_id: String, transaction_hash: Option<String>) -> Result<Transaction, String> {
    let caller = caller();
    if caller == Principal::anonymous() {
        return Err("Anonymous users cannot make payments".to_string());
    }

    // Get and validate QR code
    let mut qr_code = QR_CODES.with(|qr_codes| qr_codes.borrow().get(&qr_id))
        .ok_or("QR code not found")?;

    // Validate QR code
    is_qr_code_valid(&qr_code)?;

    // Check if payer is different from payee
    if caller == qr_code.user_id {
        return Err("Cannot pay to yourself".to_string());
    }

    // Validate transaction amount
    validate_transaction_amount(qr_code.icp_amount)?;

    // Create transaction
    let transaction = create_transaction(&qr_code, caller, transaction_hash)?;

    // Mark QR code as used
    mark_qr_as_used(&mut qr_code);
    QR_CODES.with(|qr_codes| {
        qr_codes.borrow_mut().insert(qr_id.clone(), qr_code);
    });

    // Store transaction
    TRANSACTIONS.with(|transactions| {
        transactions.borrow_mut().insert(transaction.id.clone(), transaction.clone());
    });

    ic_cdk::println!("Payment processed: {} -> {}", caller.to_text(), transaction.to.to_text());
    Ok(transaction)
}

#[update]
#[candid_method(update)]
async fn update_transaction_status_endpoint(
    transaction_id: String,
    status: TransactionStatus,
    hash: Option<String>,
) -> Result<Transaction, String> {
    let caller = caller();
    
    TRANSACTIONS.with(|transactions| {
        let mut transactions_borrow = transactions.borrow_mut();
        match transactions_borrow.get(&transaction_id) {
            Some(mut transaction) => {
                // Only allow the parties involved to update status
                if transaction.from != caller && transaction.to != caller {
                    return Err("Unauthorized to update this transaction".to_string());
                }
                
                update_transaction_status(&mut transaction, status, hash);
                transactions_borrow.insert(transaction_id, transaction.clone());
                Ok(transaction)
            }
            None => Err("Transaction not found".to_string()),
        }
    })
}

#[query]
#[candid_method(query)]
fn get_transaction(transaction_id: String) -> Option<Transaction> {
    TRANSACTIONS.with(|transactions| transactions.borrow().get(&transaction_id))
}

#[query]
#[candid_method(query)]
fn get_user_transactions() -> Vec<Transaction> {
    let caller = caller();
    TRANSACTIONS.with(|transactions| {
        transactions
            .borrow()
            .iter()
            .filter(|(_, tx)| tx.from == caller || tx.to == caller)
            .map(|(_, tx)| tx.clone())
            .collect()
    })
}

#[query]
#[candid_method(query)]
fn get_user_transaction_summaries() -> Vec<TransactionSummary> {
    let caller = caller();
    TRANSACTIONS.with(|transactions| {
        transactions
            .borrow()
            .iter()
            .filter(|(_, tx)| tx.from == caller || tx.to == caller)
            .map(|(_, tx)| create_transaction_summary(&tx, caller))
            .collect()
    })
}

#[query]
#[candid_method(query)]
fn get_recent_transactions_public() -> Vec<Transaction> {
    let current_time = ic_cdk::api::time();
    let twenty_four_hours = 24 * 60 * 60 * 1_000_000_000; // 24 hours in nanoseconds
    let cutoff_time = current_time.saturating_sub(twenty_four_hours);
    
    TRANSACTIONS.with(|transactions| {
        transactions
            .borrow()
            .iter()
            .filter(|(_, tx)| tx.timestamp >= cutoff_time)
            .map(|(_, tx)| tx.clone())
            .collect()
    })
}

#[query]
#[candid_method(query)]
fn get_user_stats() -> Option<UserStats> {
    let caller = caller();
    USERS.with(|users| {
        if users.borrow().get(&caller).is_none() {
            return None;
        }
        
        // Calculate transaction stats
        let (total_sent, total_received, transaction_count) = TRANSACTIONS.with(|transactions| {
            let mut sent = 0u64;
            let mut received = 0u64;
            let mut count = 0u64;
            
            for (_, tx) in transactions.borrow().iter() {
                if tx.from == caller {
                    sent += tx.amount;
                    count += 1;
                } else if tx.to == caller {
                    received += tx.amount;
                    count += 1;
                }
            }
            
            (sent, received, count)
        });
        
        // Calculate QR codes generated
        let qr_codes_generated = QR_CODES.with(|qr_codes| {
            qr_codes
                .borrow()
                .iter()
                .filter(|(_, qr)| qr.user_id == caller)
                .count() as u64
        });
        
        Some(UserStats {
            total_sent,
            total_received,
            transaction_count,
            qr_codes_generated,
        })
    })
}

// ===================
// ADMIN & SYSTEM FUNCTIONS
// ===================

#[update]
#[candid_method(update)]
async fn cleanup_expired_qr_codes() -> u64 {
    let current_time = ic_cdk::api::time();
    let mut cleaned_count = 0;
    
    QR_CODES.with(|qr_codes| {
        let mut qr_borrow = qr_codes.borrow_mut();
        let mut expired_ids = Vec::new();
        
        for (id, qr) in qr_borrow.iter() {
            if current_time > qr.expire_time {
                expired_ids.push(id.clone());
            }
        }
        
        for id in expired_ids {
            qr_borrow.remove(&id);
            cleaned_count += 1;
        }
    });
    
    ic_cdk::println!("Cleaned up {} expired QR codes", cleaned_count);
    cleaned_count
}

#[update]
#[candid_method(update)]
async fn cleanup_expired_transactions() -> u64 {
    let current_time = ic_cdk::api::time();
    let mut expired_count = 0;
    
    TRANSACTIONS.with(|transactions| {
        let mut tx_borrow = transactions.borrow_mut();
        let mut to_update = Vec::new();
        
        for (id, tx) in tx_borrow.iter() {
            if matches!(tx.status, TransactionStatus::Pending) {
                // Transactions expire after 1 hour
                let expiry_time = tx.timestamp + (60 * 60 * 1_000_000_000);
                if current_time > expiry_time {
                    let mut updated_tx = tx.clone();
                    updated_tx.status = TransactionStatus::Expired;
                    to_update.push((id.clone(), updated_tx));
                    expired_count += 1;
                }
            }
        }
        
        // Update expired transactions
        for (id, tx) in to_update {
            tx_borrow.insert(id, tx);
        }
    });
    
    ic_cdk::println!("Marked {} transactions as expired", expired_count);
    expired_count
}

#[query]
#[candid_method(query)]
fn get_system_stats() -> SystemStats {
    let total_users = USERS.with(|users| users.borrow().len() as u64);
    let total_transactions = TRANSACTIONS.with(|tx| tx.borrow().len() as u64);
    let total_qr_codes = QR_CODES.with(|qr| qr.borrow().len() as u64);
    let cached_rates = EXCHANGE_RATES.with(|rates| rates.borrow().len() as u64);
    
    // Count transactions by status
    let (completed_tx, pending_tx, failed_tx) = TRANSACTIONS.with(|transactions| {
        let mut completed = 0;
        let mut pending = 0;
        let mut failed = 0;
        
        for (_, tx) in transactions.borrow().iter() {
            match tx.status {
                TransactionStatus::Completed => completed += 1,
                TransactionStatus::Pending | TransactionStatus::Processing => pending += 1,
                TransactionStatus::Failed | TransactionStatus::Expired => failed += 1,
            }
        }
        
        (completed, pending, failed)
    });
    
    SystemStats {
        total_users,
        total_transactions,
        total_qr_codes,
        cached_exchange_rates: cached_rates,
        completed_transactions: completed_tx,
        pending_transactions: pending_tx,
        failed_transactions: failed_tx,
        canister_balance: 0, // This would need IC management canister call
    }
}

// Additional helper struct
#[derive(candid::CandidType, serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct SystemStats {
    pub total_users: u64,
    pub total_transactions: u64,
    pub total_qr_codes: u64,
    pub cached_exchange_rates: u64,
    pub completed_transactions: u64,
    pub pending_transactions: u64,
    pub failed_transactions: u64,
    pub canister_balance: u64,
}

// ===================
// HTTP TRANSFORM FUNCTION
// ===================

#[query]
#[candid_method(query)]
fn transform_response(raw: TransformArgs) -> HttpResponse {
    HttpResponse {
        status: raw.response.status.clone(),
        body: raw.response.body,
        headers: vec![],
    }
}

// ===================
// CANISTER LIFECYCLE
// ===================

#[init]
fn init() {
    ic_cdk::println!("🚀 ICP Payment Gateway Canister initialized");
    ic_cdk::println!("📊 System ready for payments and QR code generation");
}

#[pre_upgrade]
fn pre_upgrade() {
    ic_cdk::println!("🔄 Preparing for canister upgrade...");
}

#[post_upgrade]
fn post_upgrade() {
    ic_cdk::println!("✅ Canister upgrade completed");
}

#[heartbeat]
fn heartbeat() {
    // Periodic cleanup can be added here
    // For now, just a simple heartbeat
}

// Export candid interface
ic_cdk::export_candid!();