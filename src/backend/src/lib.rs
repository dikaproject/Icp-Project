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
use ic_cdk::api::time;

mod types;
mod rates;
mod qr;
mod transactions;
mod topup;

use types::*;
use rates::*;
use qr::*;
use transactions::*;
use topup::*;

type Memory = VirtualMemory<DefaultMemoryImpl>;
type UserStore = StableBTreeMap<Principal, User, Memory>;
type TransactionStore = StableBTreeMap<String, Transaction, Memory>;
type QRStore = StableBTreeMap<String, QRCode, Memory>;
type TopUpStore = StableBTreeMap<String, TopUpTransaction, Memory>;

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );
    
    static USERS: RefCell<UserStore> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0))))
    );
    
    static TRANSACTIONS: RefCell<TransactionStore> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1))))
    );
    
    static QR_CODES: RefCell<QRStore> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2))))
    );
    
    static TOPUP_TRANSACTIONS: RefCell<TopUpStore> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(3))))
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
        balance: 0, 
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
// BALANCE & TOP-UP MANAGEMENT
// ===================

#[query]
#[candid_method(query)]
fn get_user_balance() -> Option<UserBalance> {
    let caller = caller();
    
    USERS.with(|users| {
        users.borrow().get(&caller).map(|user| {
            UserBalance {
                user_id: user.id,
                balance: user.balance,
                formatted_balance: format_balance(user.balance),
                last_updated: time(),
            }
        })
    })
}

#[update]
#[candid_method(update)]
async fn create_qris_topup(
    amount: f64,
    currency: String,
) -> Result<TopUpTransaction, String> {
    let caller = caller();
    
    // Debug print
    ic_cdk::print(format!("Creating QRIS topup: amount={}, currency={}, caller={}", amount, currency, caller));
    
    let user_exists = USERS.with(|users| users.borrow().contains_key(&caller));
    if !user_exists {
        return Err("User not registered".to_string());
    }
    
    if amount <= 0.0 {
        return Err("Amount must be greater than 0".to_string());
    }
    
    let topup = topup::create_qris_topup(caller, amount, currency).await?;
    
    // Debug print
    ic_cdk::print(format!("QRIS topup created: id={}, method={:?}", topup.id, topup.payment_method));
    
    TOPUP_TRANSACTIONS.with(|topups| {
        topups.borrow_mut().insert(topup.id.clone(), topup.clone());
    });
    
    Ok(topup)
}

// Update fungsi create_card_topup untuk avoid double borrowing

#[update]
#[candid_method(update)]
async fn create_card_topup(
    amount: f64,
    currency: String,
    card_data: CardDataInput,
    is_credit: bool,
) -> Result<TopUpTransaction, String> {
    let caller = caller();
    
    // Validate user exists - gunakan scope terpisah
    let user_exists = USERS.with(|users| users.borrow().contains_key(&caller));
    if !user_exists {
        return Err("User not registered".to_string());
    }
    
    if amount <= 0.0 {
        return Err("Amount must be greater than 0".to_string());
    }
    
    // Create topup transaction
    let mut topup = topup::create_card_topup(caller, amount, currency, card_data, is_credit).await?;
    
    // Simulate card processing
    let success = simulate_card_processing(&topup);
    
    // Process payment result
    if success {
        topup.status = TopUpStatus::Completed;
        topup.processed_at = Some(time());
        
        // Update user balance in separate scope
        let balance_updated = USERS.with(|users| {
            let mut users_borrow = users.borrow_mut();
            if let Some(mut user) = users_borrow.get(&caller) {
                user.balance = user.balance.saturating_add(topup.amount);
                users_borrow.insert(caller, user);
                true
            } else {
                false
            }
        });
        
        if !balance_updated {
            return Err("Failed to update user balance".to_string());
        }
    } else {
        topup.status = TopUpStatus::Failed;
        topup.processed_at = Some(time());
    }
    
    // Store transaction
    TOPUP_TRANSACTIONS.with(|topups| {
        topups.borrow_mut().insert(topup.id.clone(), topup.clone());
    });
    
    Ok(topup)
}

// Simulate QRIS payment claim
#[update]
#[candid_method(update)]
async fn claim_qris_payment(topup_id: String) -> Result<TopUpTransaction, String> {
    // Get topup in separate scope
    let mut topup = TOPUP_TRANSACTIONS.with(|topups| {
        topups.borrow().get(&topup_id).ok_or("Top-up not found".to_string())
    })?;
    
    if topup.status != TopUpStatus::Pending {
        return Err("Top-up already processed".to_string());
    }
    
    if is_topup_expired(&topup) {
        // Update to expired in separate scope
        topup.status = TopUpStatus::Expired;
        TOPUP_TRANSACTIONS.with(|topups| {
            topups.borrow_mut().insert(topup_id.clone(), topup.clone());
        });
        return Err("Top-up expired".to_string());
    }
    
    // Process successful payment
    topup.status = TopUpStatus::Completed;
    topup.processed_at = Some(time());
    
    // Update user balance in separate scope
    let balance_updated = USERS.with(|users| {
        let mut users_borrow = users.borrow_mut();
        if let Some(mut user) = users_borrow.get(&topup.user_id) {
            user.balance = user.balance.saturating_add(topup.amount);
            users_borrow.insert(topup.user_id, user);
            true
        } else {
            false
        }
    });
    
    if !balance_updated {
        return Err("Failed to update user balance".to_string());
    }
    
    // Update stored transaction in separate scope
    TOPUP_TRANSACTIONS.with(|topups| {
        topups.borrow_mut().insert(topup_id, topup.clone());
    });
    
    Ok(topup)
}

#[query]
#[candid_method(query)]
fn get_topup_transaction(topup_id: String) -> Option<TopUpTransaction> {
    TOPUP_TRANSACTIONS.with(|topups| {
        topups.borrow().get(&topup_id)
    })
}

#[query]
#[candid_method(query)]
fn get_user_topup_history() -> Vec<TopUpTransaction> {
    let caller = caller();
    
    TOPUP_TRANSACTIONS.with(|topups| {
        topups.borrow()
            .iter()
            .filter(|(_, topup)| topup.user_id == caller)
            .map(|(_, topup)| topup)
            .collect()
    })
}

// MVP Card processing simulation
fn simulate_card_processing(topup: &TopUpTransaction) -> bool {
    // Simulate different outcomes based on card data
    if !topup.payment_data.card_data.is_empty() {
        let card = &topup.payment_data.card_data[0];
        return !card.card_number.contains("0002"); // Decline test card
    }
    true // Default success
}

// ===================
// ENHANCED EXCHANGE RATE MANAGEMENT
// ===================

#[update]
#[candid_method(update)]
async fn fetch_exchange_rate(currency: String) -> Result<ExchangeRate, String> {
    let currency_upper = currency.to_uppercase();
    
    if !is_supported_currency(&currency_upper) {
        return Err(format!("Unsupported currency: {}", currency_upper));
    }

    // Check if we have a valid cached rate first
    let cached_rate = EXCHANGE_RATES.with(|rates| {
        rates.borrow().get(&currency_upper).cloned()
    });
    
    if let Some(rate) = cached_rate.as_ref() {
        if is_rate_cache_valid(rate) {
            ic_cdk::println!("✅ Using valid cached rate for {}", currency_upper);
            return Ok(rate.clone());
        }
    }

    // Try to fetch fresh rate with retry logic
    match fetch_exchange_rate_with_retry_internal(currency_upper.clone(), cached_rate.clone()).await {
        Ok(exchange_rate) => {
            // Cache the fresh rate
            EXCHANGE_RATES.with(|rates| {
                rates.borrow_mut().insert(currency_upper.clone(), exchange_rate.clone());
            });
            
            ic_cdk::println!("✅ Fresh rate fetched and cached for {}", currency_upper);
            Ok(exchange_rate)
        }
        Err(e) => {
            ic_cdk::println!("❌ Failed to fetch fresh rate: {}", e);
            
            // Gunakan cache stale jika ada
            if let Some(cached) = cached_rate {
                let age_minutes = (ic_cdk::api::time() - cached.timestamp) / (60 * 1_000_000_000);
                
                let stale_rate = ExchangeRate {
                    currency: cached.currency,
                    rate: cached.rate,
                    timestamp: cached.timestamp,
                    source: format!("coingecko_stale_{}min", age_minutes),
                };
                
                // Update cache with disclaimer
                EXCHANGE_RATES.with(|rates| {
                    rates.borrow_mut().insert(currency_upper.clone(), stale_rate.clone());
                });
                
                ic_cdk::println!("⚠️ Using stale cache for {} ({}min old)", currency_upper, age_minutes);
                return Ok(stale_rate);
            }
            
            Err(format!("Could not fetch current rate for {}: {}", currency_upper, e))
        }
    }
}

#[query]
#[candid_method(query)]
fn get_cached_exchange_rate(currency: String) -> Option<ExchangeRate> {
    let currency_upper = currency.to_uppercase();
    EXCHANGE_RATES.with(|rates| rates.borrow().get(&currency_upper).cloned())
}

#[query]
#[candid_method(query)]
fn get_cached_exchange_rate_with_validity(currency: String) -> Option<(ExchangeRate, bool)> {
    let currency_upper = currency.to_uppercase();
    EXCHANGE_RATES.with(|rates| {
        rates.borrow().get(&currency_upper).map(|rate| {
            let is_valid = is_rate_cache_valid(rate);
            (rate.clone(), is_valid)
        })
    })
}

// Add new function to force refresh rate (for testing)
#[update]
#[candid_method(update)]
async fn force_refresh_exchange_rate(currency: String) -> Result<ExchangeRate, String> {
    let currency_upper = currency.to_uppercase();
    
    if !is_supported_currency(&currency_upper) {
        return Err(format!("Unsupported currency: {}", currency_upper));
    }

    // Force fresh fetch
    match fetch_live_exchange_rate(currency_upper.clone()).await {
        Ok(exchange_rate) => {
            // Cache the fresh rate
            EXCHANGE_RATES.with(|rates| {
                rates.borrow_mut().insert(currency_upper.clone(), exchange_rate.clone());
            });
            
            ic_cdk::println!("✅ Force refreshed rate for {}", currency_upper);
            Ok(exchange_rate)
        }
        Err(e) => {
            ic_cdk::println!("❌ Force refresh failed: {}", e);
            Err(format!("Force refresh failed for {}: {}", currency_upper, e))
        }
    }
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

    // Check if payer is registered
    let payer_exists = USERS.with(|users| users.borrow().contains_key(&caller));
    if !payer_exists {
        return Err("Payer not registered".to_string());
    }

    // Get and validate QR code
    let qr_code = QR_CODES.with(|qr_codes| {
        qr_codes.borrow().get(&qr_id)
    }).ok_or("QR code not found")?;

    // Validate QR code
    is_qr_code_valid(&qr_code)?;

    // Check if payer is different from payee
    if caller == qr_code.user_id {
        return Err("Cannot pay to yourself".to_string());
    }

    // Check if recipient is registered
    let recipient_exists = USERS.with(|users| users.borrow().contains_key(&qr_code.user_id));
    if !recipient_exists {
        return Err("Recipient not registered".to_string());
    }

    // Validate transaction amount
    validate_transaction_amount(qr_code.icp_amount)?;

    // Check payer has sufficient balance
    let payer_balance = USERS.with(|users| {
        users.borrow().get(&caller).map(|u| u.balance).unwrap_or(0)
    });

    let total_cost = qr_code.icp_amount + calculate_transaction_fee(qr_code.icp_amount);
    if payer_balance < total_cost {
        return Err("Insufficient balance".to_string());
    }

    // Create transaction
    let transaction = create_transaction(&qr_code, caller, transaction_hash)?;

    // Process the payment (update balances)
    let payment_success = USERS.with(|users| {
        let mut users_borrow = users.borrow_mut();
        
        // Get both users
        let mut payer = users_borrow.get(&caller).ok_or("Payer not found")?;
        let mut recipient = users_borrow.get(&qr_code.user_id).ok_or("Recipient not found")?;
        
        // Update balances
        payer.balance = payer.balance.saturating_sub(total_cost);
        recipient.balance = recipient.balance.saturating_add(qr_code.icp_amount);
        
        // Save updated users
        users_borrow.insert(caller, payer);
        users_borrow.insert(qr_code.user_id, recipient);
        
        Ok::<(), String>(())
    });

    match payment_success {
        Ok(_) => {
            // Mark QR code as used
            QR_CODES.with(|qr_codes| {
                let mut qr_borrow = qr_codes.borrow_mut();
                if let Some(mut qr) = qr_borrow.get(&qr_id) {
                    qr.is_used = true;
                    qr_borrow.insert(qr_id.clone(), qr);
                }
            });

            // Update transaction status to completed
            let mut completed_transaction = transaction;
            completed_transaction.status = TransactionStatus::Completed;

            // Store transaction
            TRANSACTIONS.with(|transactions| {
                transactions.borrow_mut().insert(completed_transaction.id.clone(), completed_transaction.clone());
            });

            ic_cdk::println!("Payment processed: {} -> {}", caller.to_text(), qr_code.user_id.to_text());
            Ok(completed_transaction)
        },
        Err(e) => {
            // Create failed transaction
            let mut failed_transaction = transaction;
            failed_transaction.status = TransactionStatus::Failed;
            
            TRANSACTIONS.with(|transactions| {
                transactions.borrow_mut().insert(failed_transaction.id.clone(), failed_transaction.clone());
            });
            
            Err(e)
        }
    }
}

#[update]
#[candid_method(update)]
async fn update_transaction_status_endpoint(
    transaction_id: String,
    status: TransactionStatus,
    hash: Option<String>,
) -> Result<Transaction, String> {
    let caller = caller();
    
    // Get transaction first
    let transaction = TRANSACTIONS.with(|transactions| {
        transactions.borrow().get(&transaction_id)
    }).ok_or("Transaction not found".to_string())?;
    
    // Check authorization
    if transaction.from != caller && transaction.to != caller {
        return Err("Unauthorized to update this transaction".to_string());
    }
    
    // Update transaction
    let mut updated_transaction = transaction;
    updated_transaction.status = status;
    if let Some(h) = hash {
        updated_transaction.transaction_hash = Some(h); // FIX: hash -> transaction_hash
    }
    
    // Store updated transaction
    TRANSACTIONS.with(|transactions| {
        transactions.borrow_mut().insert(transaction_id, updated_transaction.clone());
    });
    
    Ok(updated_transaction)
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
    
    // Get user info first
    let user_info = USERS.with(|users| {
        users.borrow().get(&caller).map(|u| (u.balance, true))
    });
    
    if user_info.is_none() {
        return None;
    }
    
    let (current_balance, _) = user_info.unwrap();
    
    // Calculate transaction stats in separate scope
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
    
    // Calculate QR codes generated in separate scope
    let qr_codes_generated = QR_CODES.with(|qr_codes| {
        qr_codes
            .borrow()
            .iter()
            .filter(|(_, qr)| qr.user_id == caller)
            .count() as u64
    });
    
    // Calculate topup stats in separate scope
    let (total_topup, topup_count) = TOPUP_TRANSACTIONS.with(|topups| {
        let mut total = 0u64;
        let mut count = 0u64;
        
        for (_, topup) in topups.borrow().iter() {
            if topup.user_id == caller && topup.status == TopUpStatus::Completed {
                total += topup.amount;
                count += 1;
            }
        }
        
        (total, count)
    });

    Some(UserStats {
        total_sent,
        total_received,
        transaction_count,
        qr_codes_generated,
        current_balance,
        topup_count,
        total_topup,
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
    
    // Enhanced rate cache info
    let (cached_rates, valid_rates, expired_rates) = EXCHANGE_RATES.with(|rates| {
        let mut total = 0;
        let mut valid = 0;
        let mut expired = 0;
        
        for (_, rate) in rates.borrow().iter() {
            total += 1;
            if is_rate_cache_valid(rate) {
                valid += 1;
            } else {
                expired += 1;
            }
        }
        
        (total, valid, expired)
    });
    
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
        valid_exchange_rates: valid_rates,
        expired_exchange_rates: expired_rates,
        completed_transactions: completed_tx,
        pending_transactions: pending_tx,
        failed_transactions: failed_tx,
        canister_balance: 0,
    }
}

// Additional helper struct
#[derive(candid::CandidType, serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct SystemStats {
    pub total_users: u64,
    pub total_transactions: u64,
    pub total_qr_codes: u64,
    pub cached_exchange_rates: u64,
    pub valid_exchange_rates: u64,
    pub expired_exchange_rates: u64,
    pub completed_transactions: u64,
    pub pending_transactions: u64,
    pub failed_transactions: u64,
    pub canister_balance: u64,
}

// Rate cache cleanup function
#[update]
#[candid_method(update)]
async fn cleanup_expired_rates() -> u64 {
    let mut cleaned_count = 0;
    
    EXCHANGE_RATES.with(|rates| {
        let mut rates_borrow = rates.borrow_mut();
        let mut expired_currencies = Vec::new();
        
        for (currency, rate) in rates_borrow.iter() {
            if !is_rate_cache_valid(&rate) {
                expired_currencies.push(currency.clone());
            }
        }
        
        for currency in expired_currencies {
            rates_borrow.remove(&currency);
            cleaned_count += 1;
        }
    });
    
    ic_cdk::println!("🧹 Cleaned up {} expired exchange rates", cleaned_count);
    cleaned_count
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

#[query]
#[candid_method(query)]
fn get_supported_currencies_list() -> Vec<String> {
    get_supported_currencies()
}

// ===================
// TESTING HELPER FUNCTIONS
// ===================

// Helper function to age existing cache using existing rates.rs functions
#[update]
#[candid_method(update)]
async fn age_cache(currency: String, age_minutes: u64) -> Result<String, String> {
    let currency_upper = currency.to_uppercase();
    
    EXCHANGE_RATES.with(|rates| {
        let mut rates_borrow = rates.borrow_mut();
        
        if let Some(rate) = rates_borrow.get(&currency_upper) {
            // Create new rate with older timestamp
            let new_timestamp = ic_cdk::api::time() - (age_minutes * 60 * 1_000_000_000);
            
            let aged_rate = ExchangeRate {
                currency: rate.currency.clone(),
                rate: rate.rate,
                timestamp: new_timestamp,
                source: format!("test_aged_{}min", age_minutes),
            };
            
            rates_borrow.insert(currency_upper.clone(), aged_rate);
            Ok(format!("Aged {} cache to {} minutes old", currency_upper, age_minutes))
        } else {
            Err("No cache found to age".to_string())
        }
    })
}

// Helper to check cache status using existing rates.rs functions
#[query]
#[candid_method(query)]
fn get_cache_status(currency: String) -> String {
    let currency_upper = currency.to_uppercase();
    
    EXCHANGE_RATES.with(|rates| {
        match rates.borrow().get(&currency_upper) {
            Some(rate) => {
                // Use the existing functions from rates.rs
                let age_minutes = get_cache_age_minutes(rate);
                let is_valid = is_rate_cache_valid(rate);
                
                format!(
                    "Cache: rate={}, age={}min, valid={}, source='{}', timestamp={}", 
                    rate.rate, age_minutes, is_valid, rate.source, rate.timestamp
                )
            }
            None => "No cache found".to_string()
        }
    })
}

// Create test stale cache using existing validation
#[update]
#[candid_method(update)]
async fn create_test_stale_cache(currency: String, rate_value: f64) -> Result<String, String> {
    let currency_upper = currency.to_uppercase();
    
    if !is_supported_currency(&currency_upper) {
        return Err(format!("Unsupported currency: {}", currency_upper));
    }
    
    // Create cache that's 10 minutes old (definitely stale)
    let old_timestamp = ic_cdk::api::time() - (10 * 60 * 1_000_000_000);
    
    let stale_rate = ExchangeRate {
        currency: currency_upper.clone(),
        rate: rate_value,
        timestamp: old_timestamp,
        source: "test_stale".to_string(),
    };
    
    // Verify it's actually stale using existing function
    let is_valid = is_rate_cache_valid(&stale_rate);
    let age_minutes = get_cache_age_minutes(&stale_rate);
    
    EXCHANGE_RATES.with(|rates| {
        rates.borrow_mut().insert(currency_upper.clone(), stale_rate);
    });
    
    Ok(format!(
        "Created stale cache for {} (rate={}, age={}min, valid={})", 
        currency_upper, rate_value, age_minutes, is_valid
    ))
}

// Create test recent cache (within 5 minutes)
#[update]
#[candid_method(update)]
async fn create_test_recent_cache(currency: String, rate_value: f64) -> Result<String, String> {
    let currency_upper = currency.to_uppercase();
    
    if !is_supported_currency(&currency_upper) {
        return Err(format!("Unsupported currency: {}", currency_upper));
    }
    
    // Create cache that's 3 minutes old (recent)
    let recent_timestamp = ic_cdk::api::time() - (3 * 60 * 1_000_000_000);
    
    let recent_rate = ExchangeRate {
        currency: currency_upper.clone(),
        rate: rate_value,
        timestamp: recent_timestamp,
        source: "test_recent".to_string(),
    };
    
    // Verify it's valid using existing function
    let is_valid = is_rate_cache_valid(&recent_rate);
    let age_minutes = get_cache_age_minutes(&recent_rate);
    
    EXCHANGE_RATES.with(|rates| {
        rates.borrow_mut().insert(currency_upper.clone(), recent_rate);
    });
    
    Ok(format!(
        "Created recent cache for {} (rate={}, age={}min, valid={})", 
        currency_upper, rate_value, age_minutes, is_valid
    ))
}

// Clear cache for testing
#[update]
#[candid_method(update)]
async fn clear_cache(currency: String) -> Result<String, String> {
    let currency_upper = currency.to_uppercase();
    
    EXCHANGE_RATES.with(|rates| {
        rates.borrow_mut().remove(&currency_upper);
    });
    
    Ok(format!("Cache cleared for {}", currency_upper))
}

// Clear all cache
#[update]
#[candid_method(update)]
async fn clear_all_cache() -> Result<String, String> {
    EXCHANGE_RATES.with(|rates| {
        rates.borrow_mut().clear();
    });
    
    Ok("All cache cleared".to_string())
}