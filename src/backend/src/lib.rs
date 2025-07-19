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
    
    static BALANCE_CHANGE_LOGS: RefCell<StableBTreeMap<String, BalanceChangeLog, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(4))))
    );
    
    static QR_USAGE_LOGS: RefCell<StableBTreeMap<String, QRUsageLog, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(5))))
    );
    
    static USER_PREFERENCES: RefCell<StableBTreeMap<Principal, UserPreferences, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(6))))
    );
    
    static USER_SESSIONS: RefCell<StableBTreeMap<String, UserSession, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(7))))
    );
    
    static EXCHANGE_RATES: RefCell<HashMap<String, ExchangeRate>> = RefCell::new(HashMap::new());

}

fn generate_balance_log_id() -> String {
    let timestamp = time();
    let caller = caller();
    format!("BAL_{}_{}", caller.to_text()[..8].to_string(), timestamp)
}

fn generate_qr_usage_log_id() -> String {
    let timestamp = time();
    let caller = caller();
    format!("QRU_{}_{}", caller.to_text()[..8].to_string(), timestamp)
}

fn get_current_balance(user_id: Principal) -> u64 {
    // Get initial balance from user record
    let initial_balance = USERS.with(|users| {
        users.borrow().get(&user_id).map(|u| u.balance).unwrap_or(0)
    });
    
    // Get latest balance from balance change logs
    let latest_balance_from_logs = BALANCE_CHANGE_LOGS.with(|logs| {
        logs.borrow()
            .iter()
            .filter(|(_, log)| log.user_id == user_id)
            .map(|(_, log)| log.new_balance)
            .max()
            .unwrap_or(initial_balance)
    });
    
    ic_cdk::println!("🔍 Balance calculation for {}: initial={}, from_logs={}", 
        user_id.to_text(), initial_balance, latest_balance_from_logs);
    
    latest_balance_from_logs
}

fn create_balance_change_log(
    user_id: Principal,
    change_type: BalanceChangeType,
    amount: u64,
    previous_balance: u64,
    new_balance: u64,
    reference_id: String,
    description: String,
) -> BalanceChangeLog {
    let log = BalanceChangeLog {
        id: generate_balance_log_id(),
        user_id,
        change_type,
        amount,
        previous_balance,
        new_balance,
        timestamp: time(),
        reference_id,
        description,
    };
    
    BALANCE_CHANGE_LOGS.with(|logs| {
        logs.borrow_mut().insert(log.id.clone(), log.clone());
    });
    
    log
}

fn create_qr_usage_log(
    qr_id: String,
    user_id: Principal,
    used_by: Principal,
    transaction_id: String,
    usage_type: QRUsageType,
) -> QRUsageLog {
    let log = QRUsageLog {
        id: generate_qr_usage_log_id(),
        qr_id,
        user_id,
        used_by,
        transaction_id,
        timestamp: time(),
        usage_type,
    };
    
    QR_USAGE_LOGS.with(|logs| {
        logs.borrow_mut().insert(log.id.clone(), log.clone());
    });
    
    log
}

fn is_qr_already_used(qr_id: &str) -> bool {
    QR_USAGE_LOGS.with(|logs| {
        logs.borrow()
            .iter()
            .any(|(_, log)| log.qr_id == qr_id && matches!(log.usage_type, QRUsageType::PaymentCompleted))
    })
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
                // MUTABLE update for profile data
                user.username = username;
                user.email = email;
                users_borrow.insert(caller, user.clone());
                Ok(user)
            }
            None => Err("User not found. Please register first".to_string()),
        }
    })
}

#[update]
#[candid_method(update)]
async fn update_user_preferences(
    preferred_currency: Option<String>,
    notification_settings: Option<NotificationSettings>,
    ui_theme: Option<String>,
    language: Option<String>,
    timezone: Option<String>,
) -> Result<UserPreferences, String> {
    let caller = caller();
    if caller == Principal::anonymous() {
        return Err("Anonymous users cannot update preferences".to_string());
    }

    USER_PREFERENCES.with(|prefs| {
        let mut prefs_borrow = prefs.borrow_mut();
        
        let mut preferences = prefs_borrow.get(&caller).unwrap_or_else(|| {
            // Create default preferences if not exists
            UserPreferences {
                user_id: caller,
                preferred_currency: "USD".to_string(),
                notification_settings: NotificationSettings {
                    email_notifications: true,
                    push_notifications: true,
                    transaction_alerts: true,
                    marketing_emails: false,
                },
                ui_theme: "light".to_string(),
                language: "en".to_string(),
                timezone: "UTC".to_string(),
                updated_at: time(),
            }
        });

        // MUTABLE update for preferences
        if let Some(currency) = preferred_currency {
            preferences.preferred_currency = currency;
        }
        if let Some(settings) = notification_settings {
            preferences.notification_settings = settings;
        }
        if let Some(theme) = ui_theme {
            preferences.ui_theme = theme;
        }
        if let Some(lang) = language {
            preferences.language = lang;
        }
        if let Some(tz) = timezone {
            preferences.timezone = tz;
        }
        
        preferences.updated_at = time();
        prefs_borrow.insert(caller, preferences.clone());
        
        Ok(preferences)
    })
}

#[query]
#[candid_method(query)]
fn get_user_preferences() -> Option<UserPreferences> {
    let caller = caller();
    USER_PREFERENCES.with(|prefs| prefs.borrow().get(&caller))
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
    let current_balance = get_current_balance(caller);
    
    Some(UserBalance {
        user_id: caller,
        balance: current_balance,
        formatted_balance: format_balance(current_balance),
        last_updated: time(),
    })
}

#[query]
#[candid_method(query)]
fn get_user_balance_history() -> Vec<BalanceChangeLog> {
    let caller = caller();
    
    BALANCE_CHANGE_LOGS.with(|logs| {
        let mut user_logs: Vec<BalanceChangeLog> = logs.borrow()
            .iter()
            .filter(|(_, log)| log.user_id == caller)
            .map(|(_, log)| log.clone())
            .collect();
        
        // Sort by timestamp (newest first)
        user_logs.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        user_logs
    })
}

#[query]
#[candid_method(query)]
fn get_qr_usage_history(qr_id: String) -> Vec<QRUsageLog> {
    QR_USAGE_LOGS.with(|logs| {
        let mut qr_logs: Vec<QRUsageLog> = logs.borrow()
            .iter()
            .filter(|(_, log)| log.qr_id == qr_id)
            .map(|(_, log)| log.clone())
            .collect();
        
        // Sort by timestamp (newest first)
        qr_logs.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        qr_logs
    })
}

#[query]
#[candid_method(query)]
fn get_all_balance_changes() -> Vec<BalanceChangeLog> {
    BALANCE_CHANGE_LOGS.with(|logs| {
        let mut all_logs: Vec<BalanceChangeLog> = logs.borrow()
            .iter()
            .map(|(_, log)| log.clone())
            .collect();
        
        // Sort by timestamp (newest first)
        all_logs.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        all_logs
    })
}

#[query]
#[candid_method(query)]
fn get_all_qr_usage_logs() -> Vec<QRUsageLog> {
    QR_USAGE_LOGS.with(|logs| {
        let mut all_logs: Vec<QRUsageLog> = logs.borrow()
            .iter()
            .map(|(_, log)| log.clone())
            .collect();
        
        // Sort by timestamp (newest first)
        all_logs.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        all_logs
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
    
    // Validate user exists
    let user_exists = USERS.with(|users| users.borrow().contains_key(&caller));
    if !user_exists {
        return Err("User not registered".to_string());
    }
    
    if amount <= 0.0 {
        return Err("Amount must be greater than 0".to_string());
    }
    
    let current_time = time();
    
    // Create initial PENDING topup transaction
    let pending_topup = topup::create_card_topup(caller, amount, currency, card_data, is_credit).await?;
    
    TOPUP_TRANSACTIONS.with(|topups| {
        topups.borrow_mut().insert(pending_topup.id.clone(), pending_topup.clone());
    });
    
    ic_cdk::println!("📝 Created PENDING card topup: {}", pending_topup.id);
    
    // Create PROCESSING topup record (NEW ID)
    let processing_topup = TopUpTransaction {
        id: format!("{}_PROCESSING_{}", pending_topup.id, current_time),
        user_id: pending_topup.user_id,
        amount: pending_topup.amount,
        fiat_amount: pending_topup.fiat_amount,
        fiat_currency: pending_topup.fiat_currency.clone(),
        payment_method: pending_topup.payment_method.clone(),
        payment_data: pending_topup.payment_data.clone(),
        status: TopUpStatus::Processing,
        created_at: current_time,
        processed_at: None,
        reference_id: pending_topup.reference_id.clone(),
    };
    
    TOPUP_TRANSACTIONS.with(|topups| {
        topups.borrow_mut().insert(processing_topup.id.clone(), processing_topup.clone());
    });
    
    ic_cdk::println!("⚙️ Created PROCESSING card topup: {}", processing_topup.id);
    
    // Simulate card processing
    let success = simulate_card_processing(&processing_topup);
    
    if success {
        // Update user balance (create new user record)
        let balance_updated = USERS.with(|users| {
            let mut users_borrow = users.borrow_mut();
            if let Some(user) = users_borrow.get(&caller) {
                let updated_user = User {
                    id: user.id,
                    wallet_address: user.wallet_address.clone(),
                    created_at: user.created_at,
                    username: user.username.clone(),
                    email: user.email.clone(),
                    balance: user.balance.saturating_add(pending_topup.amount),
                };
                
                users_borrow.insert(caller, updated_user);
                true
            } else {
                false
            }
        });
        
        if !balance_updated {
            // Create FAILED topup record (NEW ID)
            let failed_topup = TopUpTransaction {
                id: format!("{}_FAILED_{}", pending_topup.id, current_time + 1),
                user_id: pending_topup.user_id,
                amount: pending_topup.amount,
                fiat_amount: pending_topup.fiat_amount,
                fiat_currency: pending_topup.fiat_currency.clone(),
                payment_method: pending_topup.payment_method.clone(),
                payment_data: pending_topup.payment_data.clone(),
                status: TopUpStatus::Failed,
                created_at: current_time + 1,
                processed_at: Some(current_time + 1),
                reference_id: pending_topup.reference_id.clone(),
            };
            
            TOPUP_TRANSACTIONS.with(|topups| {
                topups.borrow_mut().insert(failed_topup.id.clone(), failed_topup.clone());
            });
            
            ic_cdk::println!("❌ Created FAILED card topup: {}", failed_topup.id);
            return Err("Failed to update user balance".to_string());
        }
        
        // Create COMPLETED topup record (NEW ID)
        let completed_topup = TopUpTransaction {
            id: format!("{}_COMPLETED_{}", pending_topup.id, current_time + 2),
            user_id: pending_topup.user_id,
            amount: pending_topup.amount,
            fiat_amount: pending_topup.fiat_amount,
            fiat_currency: pending_topup.fiat_currency.clone(),
            payment_method: pending_topup.payment_method.clone(),
            payment_data: pending_topup.payment_data.clone(),
            status: TopUpStatus::Completed,
            created_at: current_time + 2,
            processed_at: Some(current_time + 2),
            reference_id: pending_topup.reference_id.clone(),
        };
        
        TOPUP_TRANSACTIONS.with(|topups| {
            topups.borrow_mut().insert(completed_topup.id.clone(), completed_topup.clone());
        });
        
        ic_cdk::println!("✅ Created COMPLETED card topup: {}", completed_topup.id);
        Ok(completed_topup)
    } else {
        // Create FAILED topup record (NEW ID)
        let failed_topup = TopUpTransaction {
            id: format!("{}_FAILED_{}", pending_topup.id, current_time + 1),
            user_id: pending_topup.user_id,
            amount: pending_topup.amount,
            fiat_amount: pending_topup.fiat_amount,
            fiat_currency: pending_topup.fiat_currency.clone(),
            payment_method: pending_topup.payment_method.clone(),
            payment_data: pending_topup.payment_data.clone(),
            status: TopUpStatus::Failed,
            created_at: current_time + 1,
            processed_at: Some(current_time + 1),
            reference_id: pending_topup.reference_id.clone(),
        };
        
        TOPUP_TRANSACTIONS.with(|topups| {
            topups.borrow_mut().insert(failed_topup.id.clone(), failed_topup.clone());
        });
        
        ic_cdk::println!("❌ Created FAILED card topup: {}", failed_topup.id);
        Ok(failed_topup)
    }
}

// Simulate QRIS payment claim
#[update]
#[candid_method(update)]
async fn claim_qris_payment(topup_id: String) -> Result<TopUpTransaction, String> {
    // Get topup in separate scope
    let original_topup = TOPUP_TRANSACTIONS.with(|topups| {
        topups.borrow().get(&topup_id).ok_or("Top-up not found".to_string())
    })?;
    
    if original_topup.status != TopUpStatus::Pending {
        return Err("Top-up already processed".to_string());
    }
    
    let current_time = time();
    
    if is_topup_expired(&original_topup) {
        // Create EXPIRED topup record (NEW ID)
        let expired_topup = TopUpTransaction {
            id: format!("{}_EXPIRED_{}", original_topup.id, current_time),
            user_id: original_topup.user_id,
            amount: original_topup.amount,
            fiat_amount: original_topup.fiat_amount,
            fiat_currency: original_topup.fiat_currency.clone(),
            payment_method: original_topup.payment_method.clone(),
            payment_data: original_topup.payment_data.clone(),
            status: TopUpStatus::Expired,
            created_at: current_time,
            processed_at: Some(current_time),
            reference_id: original_topup.reference_id.clone(),
        };
        
        TOPUP_TRANSACTIONS.with(|topups| {
            topups.borrow_mut().insert(expired_topup.id.clone(), expired_topup.clone());
        });
        
        ic_cdk::println!("⏰ Created EXPIRED topup: {}", expired_topup.id);
        return Err("Top-up expired".to_string());
    }
    
    // Create PROCESSING topup record (NEW ID)
    let processing_topup = TopUpTransaction {
        id: format!("{}_PROCESSING_{}", original_topup.id, current_time),
        user_id: original_topup.user_id,
        amount: original_topup.amount,
        fiat_amount: original_topup.fiat_amount,
        fiat_currency: original_topup.fiat_currency.clone(),
        payment_method: original_topup.payment_method.clone(),
        payment_data: original_topup.payment_data.clone(),
        status: TopUpStatus::Processing,
        created_at: current_time,
        processed_at: None,
        reference_id: original_topup.reference_id.clone(),
    };
    
    TOPUP_TRANSACTIONS.with(|topups| {
        topups.borrow_mut().insert(processing_topup.id.clone(), processing_topup.clone());
    });
    
    ic_cdk::println!("⚙️ Created PROCESSING topup: {}", processing_topup.id);
    
    // Create IMMUTABLE balance change log instead of updating user balance
    let current_balance = get_current_balance(original_topup.user_id);
    let new_balance = current_balance.saturating_add(original_topup.amount);
    
    create_balance_change_log(
        original_topup.user_id,
        BalanceChangeType::TopupCompleted,
        original_topup.amount,
        current_balance,
        new_balance,
        processing_topup.id.clone(),
        format!("QRIS topup completed: {} {}", original_topup.fiat_amount, original_topup.fiat_currency),
    );
    
    // Create COMPLETED topup record (NEW ID)
    let completed_topup = TopUpTransaction {
        id: format!("{}_COMPLETED_{}", original_topup.id, current_time + 2),
        user_id: original_topup.user_id,
        amount: original_topup.amount,
        fiat_amount: original_topup.fiat_amount,
        fiat_currency: original_topup.fiat_currency.clone(),
        payment_method: original_topup.payment_method.clone(),
        payment_data: original_topup.payment_data.clone(),
        status: TopUpStatus::Completed,
        created_at: current_time + 2,
        processed_at: Some(current_time + 2),
        reference_id: original_topup.reference_id.clone(),
    };
    
    TOPUP_TRANSACTIONS.with(|topups| {
        topups.borrow_mut().insert(completed_topup.id.clone(), completed_topup.clone());
    });
    
    ic_cdk::println!("✅ Created COMPLETED topup: {}", completed_topup.id);
    Ok(completed_topup)
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
        let mut user_topups: Vec<TopUpTransaction> = topups.borrow()
            .iter()
            .filter(|(_, topup)| topup.user_id == caller)
            .map(|(_, topup)| topup.clone())
            .collect();
        
        // Sort by timestamp (newest first)
        user_topups.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        
        ic_cdk::println!("📊 Returning {} topup records for {}", user_topups.len(), caller.to_text());
        user_topups
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

    // Check if QR already used via immutable logs
    if is_qr_already_used(&qr_id) {
        return Err("QR code has already been used".to_string());
    }

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

    // Get current balances from balance logs
    let payer_balance = get_current_balance(caller);
    let recipient_balance = get_current_balance(qr_code.user_id);

    let total_cost = qr_code.icp_amount + calculate_transaction_fee(qr_code.icp_amount);
    if payer_balance < total_cost {
        return Err("Insufficient balance".to_string());
    }

    // Generate unique transaction ID for this payment flow
    let base_tx_id = generate_transaction_id(caller, qr_code.user_id, qr_code.icp_amount);
    let current_time = time();

    // Step 1: Create PENDING transaction
    let pending_tx = Transaction {
        id: format!("{}_PENDING_{}", base_tx_id, current_time),
        from: caller,
        to: qr_code.user_id,
        amount: qr_code.icp_amount,
        fiat_currency: qr_code.fiat_currency.clone(),
        fiat_amount: qr_code.fiat_amount,
        icp_amount: qr_code.icp_amount,
        timestamp: current_time,
        status: TransactionStatus::Pending,
        qr_id: qr_code.id.clone(),
        transaction_hash: transaction_hash.clone(),
        fee: calculate_transaction_fee(qr_code.icp_amount),
    };

    TRANSACTIONS.with(|transactions| {
        transactions.borrow_mut().insert(pending_tx.id.clone(), pending_tx.clone());
    });

    ic_cdk::println!("📝 Created PENDING transaction: {}", pending_tx.id);

    // Step 2: Create PROCESSING transaction  
    let processing_tx = Transaction {
        id: format!("{}_PROCESSING_{}", base_tx_id, current_time + 1),
        from: caller,
        to: qr_code.user_id,
        amount: qr_code.icp_amount,
        fiat_currency: qr_code.fiat_currency.clone(),
        fiat_amount: qr_code.fiat_amount,
        icp_amount: qr_code.icp_amount,
        timestamp: current_time + 1,
        status: TransactionStatus::Processing,
        qr_id: qr_code.id.clone(),
        transaction_hash: transaction_hash.clone(),
        fee: calculate_transaction_fee(qr_code.icp_amount),
    };

    TRANSACTIONS.with(|transactions| {
        transactions.borrow_mut().insert(processing_tx.id.clone(), processing_tx.clone());
    });

    ic_cdk::println!("⚙️ Created PROCESSING transaction: {}", processing_tx.id);

    // Step 3: Create IMMUTABLE balance change logs
    let fee_amount = calculate_transaction_fee(qr_code.icp_amount);
    
    // Log: Payer's balance decrease
    let payer_new_balance = payer_balance.saturating_sub(total_cost);
    create_balance_change_log(
        caller,
        BalanceChangeType::PaymentSent,
        qr_code.icp_amount,
        payer_balance,
        payer_new_balance,
        processing_tx.id.clone(),
        format!("Payment sent to {}", qr_code.user_id.to_text()),
    );
    
    // Log: Fee deduction
    create_balance_change_log(
        caller,
        BalanceChangeType::FeeDeducted,
        fee_amount,
        payer_balance,
        payer_new_balance,
        processing_tx.id.clone(),
        format!("Transaction fee for payment {}", processing_tx.id),
    );
    
    // Log: Recipient's balance increase
    let recipient_new_balance = recipient_balance.saturating_add(qr_code.icp_amount);
    create_balance_change_log(
        qr_code.user_id,
        BalanceChangeType::PaymentReceived,
        qr_code.icp_amount,
        recipient_balance,
        recipient_new_balance,
        processing_tx.id.clone(),
        format!("Payment received from {}", caller.to_text()),
    );

    // Step 4: Create COMPLETED transaction
    let completed_tx = Transaction {
        id: format!("{}_COMPLETED_{}", base_tx_id, current_time + 2),
        from: caller,
        to: qr_code.user_id,
        amount: qr_code.icp_amount,
        fiat_currency: qr_code.fiat_currency.clone(),
        fiat_amount: qr_code.fiat_amount,
        icp_amount: qr_code.icp_amount,
        timestamp: current_time + 2,
        status: TransactionStatus::Completed,
        qr_id: qr_code.id.clone(),
        transaction_hash: transaction_hash.clone(),
        fee: calculate_transaction_fee(qr_code.icp_amount),
    };

    TRANSACTIONS.with(|transactions| {
        transactions.borrow_mut().insert(completed_tx.id.clone(), completed_tx.clone());
    });

    // Step 5: Create IMMUTABLE QR usage log
    create_qr_usage_log(
        qr_id.clone(),
        qr_code.user_id,
        caller,
        completed_tx.id.clone(),
        QRUsageType::PaymentCompleted,
    );

    ic_cdk::println!("✅ Created COMPLETED transaction: {}", completed_tx.id);
    ic_cdk::println!("Payment processed: {} -> {}", caller.to_text(), qr_code.user_id.to_text());

    // Return the final transaction (COMPLETED)
    Ok(completed_tx)
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
        let mut user_transactions: Vec<Transaction> = transactions
            .borrow()
            .iter()
            .filter(|(_, tx)| tx.from == caller || tx.to == caller)
            .map(|(_, tx)| tx.clone())
            .collect();
        
        // Sort by timestamp (newest first)
        user_transactions.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        
        ic_cdk::println!("📊 Returning {} user transactions for {}", user_transactions.len(), caller.to_text());
        user_transactions
    })
}

#[query]
#[candid_method(query)]
fn get_user_transaction_summaries() -> Vec<TransactionSummary> {
    let caller = caller();
    TRANSACTIONS.with(|transactions| {
        let mut summaries: Vec<TransactionSummary> = transactions
            .borrow()
            .iter()
            .filter(|(_, tx)| tx.from == caller || tx.to == caller)
            .map(|(_, tx)| create_transaction_summary(&tx, caller))
            .collect();
        
        // Sort by timestamp (newest first)
        summaries.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        
        ic_cdk::println!("📊 Returning {} transaction summaries for {}", summaries.len(), caller.to_text());
        summaries
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
    
    // Calculate current balance from logs
    let current_balance = get_current_balance(caller);
    
    ic_cdk::println!("📊 Calculating stats for {}: current_balance={}", 
        caller.to_text(), current_balance);
    
    // Calculate transaction stats from balance logs
    let (total_sent, total_received, total_topup, topup_count) = BALANCE_CHANGE_LOGS.with(|logs| {
        let mut sent = 0u64;
        let mut received = 0u64;
        let mut topup = 0u64;
        let mut topup_cnt = 0u64;
        
        for (_, log) in logs.borrow().iter() {
            if log.user_id == caller {
                match log.change_type {
                    BalanceChangeType::PaymentSent => sent += log.amount,
                    BalanceChangeType::PaymentReceived => received += log.amount,
                    BalanceChangeType::TopupCompleted => {
                        topup += log.amount;
                        topup_cnt += 1;
                    }
                    _ => {}
                }
            }
        }
        
        ic_cdk::println!("💰 Balance changes for {}: sent={}, received={}, topup={}", 
            caller.to_text(), sent, received, topup);
        
        (sent, received, topup, topup_cnt)
    });
    
    // Calculate transaction count
    let transaction_count = TRANSACTIONS.with(|transactions| {
        transactions.borrow()
            .iter()
            .filter(|(_, tx)| tx.from == caller || tx.to == caller)
            .count() as u64
    });
    
    // Calculate QR codes generated
    let qr_codes_generated = QR_CODES.with(|qr_codes| {
        qr_codes.borrow()
            .iter()
            .filter(|(_, qr)| qr.user_id == caller)
            .count() as u64
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

#[query]
#[candid_method(query)]
fn get_network_stats() -> NetworkStats {
    let current_time = time();
    let twenty_four_hours = 24 * 60 * 60 * 1_000_000_000;
    let seven_days = 7 * twenty_four_hours;
    let cutoff_24h = current_time.saturating_sub(twenty_four_hours);
    let cutoff_7d = current_time.saturating_sub(seven_days);

    // Get all transactions stats
    let (tx_stats, currency_stats) = TRANSACTIONS.with(|transactions| {
        let mut total_tx = 0u64;
        let mut completed_tx = 0u64;
        let mut pending_tx = 0u64;
        let mut failed_tx = 0u64;
        let mut tx_24h = 0u64;
        let mut tx_7d = 0u64;
        let mut total_icp_volume = 0u64;
        
        // Currency statistics
        let mut currency_map: std::collections::HashMap<String, CurrencyStatInfo> = std::collections::HashMap::new();
        
        for (_, tx) in transactions.borrow().iter() {
            total_tx += 1;
            
            // Count by status
            match tx.status {
                TransactionStatus::Completed => completed_tx += 1,
                TransactionStatus::Pending | TransactionStatus::Processing => pending_tx += 1,
                TransactionStatus::Failed | TransactionStatus::Expired => failed_tx += 1,
            }
            
            // Count by time
            if tx.timestamp >= cutoff_24h {
                tx_24h += 1;
            }
            if tx.timestamp >= cutoff_7d {
                tx_7d += 1;
            }
            
            // Only count completed transactions for volume
            if matches!(tx.status, TransactionStatus::Completed) {
                total_icp_volume += tx.amount;
                
                // Update currency stats
                let currency_stat = currency_map.entry(tx.fiat_currency.clone()).or_insert(CurrencyStatInfo {
                    currency: tx.fiat_currency.clone(),
                    usage_count: 0,
                    total_fiat_volume: 0.0,
                    total_icp_volume: 0,
                });
                
                currency_stat.usage_count += 1;
                currency_stat.total_fiat_volume += tx.fiat_amount;
                currency_stat.total_icp_volume += tx.amount;
            }
        }
        
        let tx_stats = TransactionStatsInfo {
            total_transactions: total_tx,
            completed_transactions: completed_tx,
            pending_transactions: pending_tx,
            failed_transactions: failed_tx,
            transactions_24h: tx_24h,
            transactions_7d: tx_7d,
            total_icp_volume,
        };
        
        let currency_stats: Vec<CurrencyStatInfo> = currency_map.into_values().collect();
        
        (tx_stats, currency_stats)
    });
    
    // Get user count
    let total_users = USERS.with(|users| users.borrow().len() as u64);
    
    // Calculate active countries from currency stats
    let active_currencies = currency_stats.len() as u64;
    let active_countries = active_currencies; // For MVP, 1 currency = 1 country
    
    // Create currency countries mapping
    let currency_countries: Vec<CurrencyCountryInfo> = currency_stats.iter().map(|stat| {
        CurrencyCountryInfo {
            currency: stat.currency.clone(),
            transaction_count: stat.usage_count,
        }
    }).collect();
    
    NetworkStats {
        active_countries,
        active_currencies,
        total_icp_volume: tx_stats.total_icp_volume,
        transactions_24h: tx_stats.transactions_24h,
        transactions_7d: tx_stats.transactions_7d,
        total_transactions: tx_stats.total_transactions,
        completed_transactions: tx_stats.completed_transactions,
        pending_transactions: tx_stats.pending_transactions,
        failed_transactions: tx_stats.failed_transactions,
        total_users,
        currency_stats,
        currency_countries,
    }
}

// Helper structs for network stats
#[derive(candid::CandidType, serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct NetworkStats {
    pub active_countries: u64,
    pub active_currencies: u64,
    pub total_icp_volume: u64,
    pub transactions_24h: u64,
    pub transactions_7d: u64,
    pub total_transactions: u64,
    pub completed_transactions: u64,
    pub pending_transactions: u64,
    pub failed_transactions: u64,
    pub total_users: u64,
    pub currency_stats: Vec<CurrencyStatInfo>,
    pub currency_countries: Vec<CurrencyCountryInfo>,
}

#[derive(candid::CandidType, serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct CurrencyStatInfo {
    pub currency: String,
    pub usage_count: u64,
    pub total_fiat_volume: f64,
    pub total_icp_volume: u64,
}

#[derive(candid::CandidType, serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct CurrencyCountryInfo {
    pub currency: String,
    pub transaction_count: u64,
}

#[derive(Clone, Debug)]
struct TransactionStatsInfo {
    pub total_transactions: u64,
    pub completed_transactions: u64,
    pub pending_transactions: u64,
    pub failed_transactions: u64,
    pub transactions_24h: u64,
    pub transactions_7d: u64,
    pub total_icp_volume: u64,
}

#[query]
#[candid_method(query)]
fn get_all_transactions() -> Vec<Transaction> {
    TRANSACTIONS.with(|transactions| {
        let mut all_transactions: Vec<Transaction> = transactions
            .borrow()
            .iter()
            .map(|(_, tx)| tx.clone())
            .collect();
        
        // Sort by timestamp (newest first)
        all_transactions.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        
        ic_cdk::println!("📊 Returning {} transactions", all_transactions.len());
        all_transactions
    })
}

// Add to candid export
#[query]
#[candid_method(query)]
fn get_all_transactions_public() -> Vec<Transaction> {
    get_all_transactions()
}

// ===================
// SESSION MANAGEMENT (MUTABLE)
// ===================

#[update]
#[candid_method(update)]
async fn create_user_session(ip_address: String, user_agent: String) -> Result<UserSession, String> {
    let caller = caller();
    if caller == Principal::anonymous() {
        return Err("Anonymous users cannot create sessions".to_string());
    }

    let session_id = format!("SES_{}_{}", caller.to_text()[..8].to_string(), time());
    let session = UserSession {
        user_id: caller,
        session_id: session_id.clone(),
        created_at: time(),
        last_activity: time(),
        ip_address,
        user_agent,
        is_active: true,
    };

    USER_SESSIONS.with(|sessions| {
        sessions.borrow_mut().insert(session_id.clone(), session.clone());
    });

    Ok(session)
}

#[update]
#[candid_method(update)]
async fn update_session_activity(session_id: String) -> Result<UserSession, String> {
    USER_SESSIONS.with(|sessions| {
        let mut sessions_borrow = sessions.borrow_mut();
        match sessions_borrow.get(&session_id) {
            Some(mut session) => {
                // MUTABLE update for session data
                session.last_activity = time();
                sessions_borrow.insert(session_id.clone(), session.clone());
                Ok(session)
            }
            None => Err("Session not found".to_string()),
        }
    })
}

#[update]
#[candid_method(update)]
async fn end_user_session(session_id: String) -> Result<String, String> {
    USER_SESSIONS.with(|sessions| {
        let mut sessions_borrow = sessions.borrow_mut();
        match sessions_borrow.get(&session_id) {
            Some(mut session) => {
                // MUTABLE update for session data
                session.is_active = false;
                sessions_borrow.insert(session_id.clone(), session);
                Ok("Session ended".to_string())
            }
            None => Err("Session not found".to_string()),
        }
    })
}

#[query]
#[candid_method(query)]
fn get_active_sessions() -> Vec<UserSession> {
    let caller = caller();
    USER_SESSIONS.with(|sessions| {
        sessions.borrow()
            .iter()
            .filter(|(_, session)| session.user_id == caller && session.is_active)
            .map(|(_, session)| session.clone())
            .collect()
    })
}