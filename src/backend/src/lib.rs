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

use sha2::{Sha256, Digest};
use base64;

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
type WalletIdentityStore = StableBTreeMap<String, EncryptedWalletIdentity, Memory>;

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


    static WALLET_IDENTITIES: RefCell<WalletIdentityStore> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(8))))
    );
    
    static EXCHANGE_RATES: RefCell<HashMap<String, ExchangeRate>> = RefCell::new(HashMap::new());

}

fn simple_encrypt(data: &str, password: &str) -> String {

    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    let key = hasher.finalize();
    
    let data_bytes = data.as_bytes();
    let mut encrypted = Vec::new();
    
    for (i, byte) in data_bytes.iter().enumerate() {
        let key_byte = key[i % 32];
        encrypted.push(byte ^ key_byte);
    }
    
    base64::encode(encrypted)
}

fn simple_decrypt(encrypted_data: &str, password: &str) -> Result<String, String> {
    let encrypted_bytes = base64::decode(encrypted_data)
        .map_err(|_| "Invalid encrypted data format".to_string())?;
    
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    let key = hasher.finalize();
    
    let mut decrypted = Vec::new();
    
    for (i, byte) in encrypted_bytes.iter().enumerate() {
        let key_byte = key[i % 32];
        decrypted.push(byte ^ key_byte);
    }
    
    String::from_utf8(decrypted)
        .map_err(|_| "Failed to decrypt data".to_string())
}

fn generate_balance_log_id() -> String {
    let timestamp = time();
    let caller = caller();
    let random_suffix = timestamp % 1000000; 
    format!("BAL_{}_{}", caller.to_text()[..8].to_string(), timestamp + random_suffix)
}

fn generate_qr_usage_log_id() -> String {
    let timestamp = time();
    let caller = caller();
    format!("QRU_{}_{}", caller.to_text()[..8].to_string(), timestamp)
}

fn get_current_balance(user_id: Principal) -> u64 {

    let current_balance = BALANCE_CHANGE_LOGS.with(|logs| {
        let logs_borrow = logs.borrow();
        
        // Get all balance change logs for this user
        let mut user_logs: Vec<BalanceChangeLog> = logs_borrow
            .iter()
            .filter(|(_, log)| log.user_id == user_id)
            .map(|(_, log)| log.clone())
            .collect();
        

        if user_logs.is_empty() {
            ic_cdk::println!("🔍 No balance logs found for {}, returning 0", 
                user_id.to_text());
            return 0;
        }
        
        // Sort by timestamp (oldest first for sequential calculation)
        user_logs.sort_by(|a, b| a.timestamp.cmp(&b.timestamp));
        

        let mut calculated_balance = 0u64;
        
        ic_cdk::println!("🔍 Calculating balance for {} from {} logs:", 
            user_id.to_text(), user_logs.len());
        
        for (i, log) in user_logs.iter().enumerate() {

            if i == 0 {
                calculated_balance = log.previous_balance;
                ic_cdk::println!("  [{}] Starting balance: {}", i, calculated_balance);
            }
            
            // Apply the balance change
            match log.change_type {
                BalanceChangeType::TopupCompleted | BalanceChangeType::PaymentReceived => {
                    calculated_balance = calculated_balance.saturating_add(log.amount);
                }
                BalanceChangeType::PaymentSent | BalanceChangeType::FeeDeducted => {
                    calculated_balance = calculated_balance.saturating_sub(log.amount);
                }
                BalanceChangeType::Refund => {
                    calculated_balance = calculated_balance.saturating_add(log.amount);
                }
                BalanceChangeType::Adjustment => {
                    calculated_balance = log.new_balance; 
                }
            }
            

            ic_cdk::println!("  [{}] {:?} {} -> balance: {} (expected: {})", 
                i, log.change_type, log.amount, calculated_balance, log.new_balance);
            
            // Verify calculation matches log
            if calculated_balance != log.new_balance {
                ic_cdk::println!("⚠️ Balance mismatch at log {}: calculated={}, logged={}", 
                    i, calculated_balance, log.new_balance);
            }
        }
        
        ic_cdk::println!("🔍 Final calculated balance for {}: {}", 
            user_id.to_text(), calculated_balance);
        
        calculated_balance
    });
    
    current_balance
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
    let log_id = generate_balance_log_id();
    let log = BalanceChangeLog {
        id: log_id.clone(),
        user_id,
        change_type: change_type.clone(),
        amount,
        previous_balance,
        new_balance,
        timestamp: time(),
        reference_id,
        description,
    };
    

    ic_cdk::println!("🔍 Creating balance log: id={}, user={}, type={:?}, amount={}, prev={}, new={}", 
        log.id, user_id.to_text(), change_type, amount, previous_balance, new_balance);
    
    let inserted = BALANCE_CHANGE_LOGS.with(|logs| {
        logs.borrow_mut().insert(log.id.clone(), log.clone());
        

        logs.borrow().get(&log.id).is_some()
    });
    
    if inserted {
        ic_cdk::println!("✅ Balance log successfully inserted: {}", log.id);
    } else {
        ic_cdk::println!("❌ Failed to insert balance log: {}", log.id);
    }
    
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
async fn save_wallet_identity_by_email(
    email: String,
    secret_key_hex: String,
    password: String,
    wallet_name: String,
) -> Result<String, String> {
    // Validate inputs
    if email.is_empty() || !email.contains('@') {
        return Err("Valid email is required".to_string());
    }
    
    if secret_key_hex.is_empty() {
        return Err("Secret key is required".to_string());
    }
    
    if password.len() < 6 {
        return Err("Password must be at least 6 characters".to_string());
    }
    
    // Check if email already has a wallet identity stored
    let email_lower = email.to_lowercase();
    let existing = WALLET_IDENTITIES.with(|identities| {
        identities.borrow().get(&email_lower)
    });
    
    if existing.is_some() {
        return Err("Wallet identity already exists for this email".to_string());
    }
    
    // Encrypt the secret key with password
    let encrypted_secret = simple_encrypt(&secret_key_hex, &password);
    
    // Create wallet identity record
    let wallet_identity = EncryptedWalletIdentity {
        email: email_lower.clone(),
        encrypted_secret_key: encrypted_secret,
        wallet_name,
        created_at: time(),
        last_accessed: time(),
        access_count: 0,
    };
    
    // Store in backend
    WALLET_IDENTITIES.with(|identities| {
        identities.borrow_mut().insert(email_lower.clone(), wallet_identity);
    });
    
    ic_cdk::println!("🔐 Wallet identity saved for email: {}", email);
    Ok("Wallet identity saved successfully".to_string())
}

#[update]
#[candid_method(update)]
async fn get_wallet_identity_by_email(
    email: String,
    password: String,
) -> Result<WalletIdentityResult, String> {

    if email.is_empty() || !email.contains('@') {
        return Err("Valid email is required".to_string());
    }
    
    if password.is_empty() {
        return Err("Password is required".to_string());
    }
    
    let email_lower = email.to_lowercase();
    
    // Get stored wallet identity
    let mut wallet_identity = WALLET_IDENTITIES.with(|identities| {
        identities.borrow().get(&email_lower)
    }).ok_or("No wallet found for this email")?;
    
    // Try to decrypt secret key with provided password
    let secret_key_hex = simple_decrypt(&wallet_identity.encrypted_secret_key, &password)
        .map_err(|_| "Invalid password")?;
    
    // Update access info
    wallet_identity.last_accessed = time();
    wallet_identity.access_count += 1;
    
    WALLET_IDENTITIES.with(|identities| {
        identities.borrow_mut().insert(email_lower.clone(), wallet_identity.clone());
    });
    
    ic_cdk::println!("🔓 Wallet identity retrieved for email: {} (access count: {})", 
        email, wallet_identity.access_count);
    
    Ok(WalletIdentityResult {
        secret_key_hex,
        wallet_name: wallet_identity.wallet_name,
        created_at: wallet_identity.created_at,
        last_accessed: wallet_identity.last_accessed,
        access_count: wallet_identity.access_count,
    })
}

#[query]
#[candid_method(query)]
fn check_wallet_identity_exists(email: String) -> bool {
    let email_lower = email.to_lowercase();
    WALLET_IDENTITIES.with(|identities| {
        identities.borrow().contains_key(&email_lower)
    })
}

#[update]
#[candid_method(update)]
async fn update_wallet_identity_password(
    email: String,
    old_password: String,
    new_password: String,
) -> Result<String, String> {
    if new_password.len() < 6 {
        return Err("New password must be at least 6 characters".to_string());
    }
    
    let email_lower = email.to_lowercase();
    
    // Get existing wallet identity
    let mut wallet_identity = WALLET_IDENTITIES.with(|identities| {
        identities.borrow().get(&email_lower)
    }).ok_or("No wallet found for this email")?;
    
    // Decrypt with old password to verify
    let secret_key_hex = simple_decrypt(&wallet_identity.encrypted_secret_key, &old_password)
        .map_err(|_| "Invalid old password")?;
    
    // Re-encrypt with new password
    let new_encrypted_secret = simple_encrypt(&secret_key_hex, &new_password);
    
    // Update wallet identity
    wallet_identity.encrypted_secret_key = new_encrypted_secret;
    wallet_identity.last_accessed = time();
    
    WALLET_IDENTITIES.with(|identities| {
        identities.borrow_mut().insert(email_lower.clone(), wallet_identity);
    });
    
    ic_cdk::println!("🔄 Password updated for email: {}", email);
    Ok("Password updated successfully".to_string())
}

#[update]
#[candid_method(update)]
async fn register_user_by_email(
    email: String,
    username: Option<String>,
    wallet_address: String,
) -> Result<User, String> {
    let caller = caller();
    if caller == Principal::anonymous() {
        return Err("Anonymous users cannot register".to_string());
    }

    // Validate email format
    if email.is_empty() || !email.contains('@') {
        return Err("Valid email is required".to_string());
    }

    // Check if email already exists
    let email_exists = USERS.with(|users| {
        users.borrow().iter().any(|(_, user)| {
            user.email.as_ref() == Some(&email)
        })
    });

    if email_exists {
        return Err("Email already registered. Please use a different email.".to_string());
    }

    // Check if principal already exists
    let existing_user = USERS.with(|users| users.borrow().get(&caller));
    if existing_user.is_some() {
        return Err("Principal already registered".to_string());
    }

    let user = User {
        id: caller,
        wallet_address,
        created_at: ic_cdk::api::time(),
        username,
        email: Some(email),
        balance: 0,
    };

    USERS.with(|users| {
        users.borrow_mut().insert(caller, user.clone());
    });

    ic_cdk::println!("User registered with email: {} -> {}", user.email.as_ref().unwrap(), caller.to_text());
    Ok(user)
}

#[query]
#[candid_method(query)]
fn check_email_availability(email: String) -> bool {
    USERS.with(|users| {
        !users.borrow().iter().any(|(_, user)| {
            user.email.as_ref() == Some(&email)
        })
    })
}

#[query]
#[candid_method(query)]
fn get_user_by_email(email: String) -> Option<User> {
    ic_cdk::println!("🔍 DEBUG: Searching for email: {}", email);
    
    let result = USERS.with(|users| {
        let users_borrow = users.borrow();
        let total_users = users_borrow.len();
        
        ic_cdk::println!("📊 DEBUG: Total users in storage: {}", total_users);
        

        for (principal, user) in users_borrow.iter() {
            ic_cdk::println!("👤 DEBUG: User {} - email: {:?}", 
                principal.to_text(), user.email);
        }
        
        // Find user by email
        users_borrow.iter()
            .find(|(_, user)| {
                let matches = user.email.as_ref() == Some(&email);
                ic_cdk::println!("🔍 DEBUG: Checking user email {:?} == {} ? {}", 
                    user.email, email, matches);
                matches
            })
            .map(|(_, user)| user.clone())
    });
    
    ic_cdk::println!("📋 DEBUG: Search result for {}: {:?}", email, result.is_some());
    result
}

#[query]
#[candid_method(query)]
fn debug_get_all_users() -> Vec<(String, User)> {
    USERS.with(|users| {
        users.borrow()
            .iter()
            .map(|(principal, user)| (principal.to_text(), user.clone()))
            .collect()
    })
}

#[query]
#[candid_method(query)]
fn debug_get_user_count() -> u64 {
    USERS.with(|users| users.borrow().len() as u64)
}

#[update]
#[candid_method(update)]
async fn save_wallet_identity(encrypted_seed: String, wallet_name: String) -> Result<String, String> {
    let caller = ic_cdk::caller();
    if caller == Principal::anonymous() {
        return Err("Anonymous users cannot save wallet identity".to_string());
    }

    // Save to user preferences
    USER_PREFERENCES.with(|prefs| {
        let mut prefs_map = prefs.borrow_mut();
        let current_prefs = prefs_map.get(&caller).unwrap_or(UserPreferences {
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
            updated_at: ic_cdk::api::time(),
        });

        // Store wallet info in description field (extend struct later)
        let wallet_info = format!("wallet_seed:{};name:{}", encrypted_seed, wallet_name);
        
        let updated_prefs = UserPreferences {
            user_id: caller,
            preferred_currency: current_prefs.preferred_currency,
            notification_settings: current_prefs.notification_settings,
            ui_theme: current_prefs.ui_theme,
            language: current_prefs.language,
            timezone: wallet_info, 
            updated_at: ic_cdk::api::time(),
        };

        prefs_map.insert(caller, updated_prefs);
        Ok("Wallet identity saved successfully".to_string())
    })
}

#[query]
#[candid_method(query)]
fn get_saved_wallet_identity() -> Option<(String, String)> {
    let caller = ic_cdk::caller();
    
    USER_PREFERENCES.with(|prefs| {
        prefs.borrow().get(&caller).and_then(|prefs| {
            if prefs.timezone.starts_with("wallet_seed:") {
                let parts: Vec<&str> = prefs.timezone.split(';').collect();
                if parts.len() >= 2 {
                    let seed = parts[0].strip_prefix("wallet_seed:").unwrap_or("");
                    let name = parts[1].strip_prefix("name:").unwrap_or("");
                    Some((seed.to_string(), name.to_string()))
                } else {
                    None
                }
            } else {
                None
            }
        })
    })
}

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



#[update]
#[candid_method(update)]
async fn create_card_topup(
    amount: f64,
    currency: String,
    card_data: CardDataInput,
    is_credit: bool,
) -> Result<TopUpTransaction, String> {
    let caller = caller();
    

    let user_exists = USERS.with(|users| users.borrow().contains_key(&caller));
    if !user_exists {
        return Err("User not registered".to_string());
    }
    
    if amount <= 0.0 {
        return Err("Amount must be greater than 0".to_string());
    }
    
    let current_time = time();
    

    let pending_topup = topup::create_card_topup(caller, amount, currency, card_data, is_credit).await?;
    
    TOPUP_TRANSACTIONS.with(|topups| {
        topups.borrow_mut().insert(pending_topup.id.clone(), pending_topup.clone());
    });
    
    ic_cdk::println!("📝 Created PENDING card topup: {}", pending_topup.id);
    

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
    

    let success = simulate_card_processing(&processing_topup);
    
    if success {

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

    if !topup.payment_data.card_data.is_empty() {
        let card = &topup.payment_data.card_data[0];
        return !card.card_number.contains("0002"); 
    }
    true 
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


    match fetch_exchange_rate_with_retry_internal(currency_upper.clone(), cached_rate.clone()).await {
        Ok(exchange_rate) => {

            EXCHANGE_RATES.with(|rates| {
                rates.borrow_mut().insert(currency_upper.clone(), exchange_rate.clone());
            });
            
            ic_cdk::println!("✅ Fresh rate fetched and cached for {}", currency_upper);
            Ok(exchange_rate)
        }
        Err(e) => {
            ic_cdk::println!("❌ Failed to fetch fresh rate: {}", e);
            

            if let Some(cached) = cached_rate {
                let age_minutes = (ic_cdk::api::time() - cached.timestamp) / (60 * 1_000_000_000);
                
                let stale_rate = ExchangeRate {
                    currency: cached.currency,
                    rate: cached.rate,
                    timestamp: cached.timestamp,
                    source: format!("coingecko_stale_{}min", age_minutes),
                };
                

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


    let fee_amount = calculate_transaction_fee(qr_code.icp_amount);
    let base_time = time();
    

    let total_deduction = qr_code.icp_amount + fee_amount;
    let payer_new_balance = payer_balance.saturating_sub(total_deduction);
    let recipient_new_balance = recipient_balance.saturating_add(qr_code.icp_amount);
    
    ic_cdk::println!("💰 Payment amounts: payment={}, fee={}, total_deduction={}", 
        qr_code.icp_amount, fee_amount, total_deduction);
    ic_cdk::println!("💰 Balance transitions: payer {} -> {}, recipient {} -> {}", 
        payer_balance, payer_new_balance, recipient_balance, recipient_new_balance);
    

    let payment_sent_log = BalanceChangeLog {
        id: format!("BAL_PAYMENT_{}_{}", processing_tx.id, base_time),
        user_id: caller,
        change_type: BalanceChangeType::PaymentSent,
        amount: qr_code.icp_amount,
        previous_balance: payer_balance,
        new_balance: payer_balance.saturating_sub(qr_code.icp_amount),
        timestamp: base_time,
        reference_id: processing_tx.id.clone(),
        description: format!("Payment sent: {} {}", qr_code.fiat_amount, qr_code.fiat_currency),
    };
    
    BALANCE_CHANGE_LOGS.with(|logs| {
        logs.borrow_mut().insert(payment_sent_log.id.clone(), payment_sent_log.clone());
    });
    
    ic_cdk::println!("📝 Created PaymentSent log: {} (amount={}, prev={}, new={})", 
        payment_sent_log.id, payment_sent_log.amount, payment_sent_log.previous_balance, payment_sent_log.new_balance);
    

    let fee_deducted_log = BalanceChangeLog {
        id: format!("BAL_FEE_{}_{}", processing_tx.id, base_time + 1),
        user_id: caller,
        change_type: BalanceChangeType::FeeDeducted,
        amount: fee_amount,
        previous_balance: payer_balance.saturating_sub(qr_code.icp_amount),
        new_balance: payer_new_balance,
        timestamp: base_time + 1,
        reference_id: processing_tx.id.clone(),
        description: format!("Transaction fee: {:.8} ICP", fee_amount as f64 / 100_000_000.0),
    };
    
    BALANCE_CHANGE_LOGS.with(|logs| {
        logs.borrow_mut().insert(fee_deducted_log.id.clone(), fee_deducted_log.clone());
    });
    
    ic_cdk::println!("📝 Created FeeDeducted log: {} (amount={}, prev={}, new={})", 
        fee_deducted_log.id, fee_deducted_log.amount, fee_deducted_log.previous_balance, fee_deducted_log.new_balance);
    

    let payment_received_log = BalanceChangeLog {
        id: format!("BAL_RECEIVED_{}_{}", processing_tx.id, base_time + 2),
        user_id: qr_code.user_id,
        change_type: BalanceChangeType::PaymentReceived,
        amount: qr_code.icp_amount,
        previous_balance: recipient_balance,
        new_balance: recipient_new_balance,
        timestamp: base_time + 2,
        reference_id: processing_tx.id.clone(),
        description: format!("Payment received: {} {}", qr_code.fiat_amount, qr_code.fiat_currency),
    };
    
    BALANCE_CHANGE_LOGS.with(|logs| {
        logs.borrow_mut().insert(payment_received_log.id.clone(), payment_received_log.clone());
    });
    
    ic_cdk::println!("📝 Created PaymentReceived log: {} (amount={}, prev={}, new={})", 
        payment_received_log.id, payment_received_log.amount, payment_received_log.previous_balance, payment_received_log.new_balance);


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


    create_qr_usage_log(
        qr_id.clone(),
        qr_code.user_id,
        caller,
        completed_tx.id.clone(),
        QRUsageType::PaymentCompleted,
    );

    ic_cdk::println!("✅ Created COMPLETED transaction: {}", completed_tx.id);
    ic_cdk::println!("Payment processed: {} -> {}", caller.to_text(), qr_code.user_id.to_text());


    Ok(completed_tx)
}

#[query]
#[candid_method(query)]
fn get_all_network_transactions() -> Vec<NetworkTransaction> {
    let mut network_transactions = Vec::new();
    

    TRANSACTIONS.with(|transactions| {
        for (_, tx) in transactions.borrow().iter() {
            network_transactions.push(NetworkTransaction {
                id: tx.id.clone(),
                transaction_type: NetworkTransactionType::Payment,
                from_user: Some(tx.from),
                to_user: Some(tx.to),
                amount: tx.amount,
                fiat_amount: tx.fiat_amount,
                fiat_currency: tx.fiat_currency.clone(),
                icp_amount: tx.icp_amount,
                timestamp: tx.timestamp,
                status: NetworkTransactionStatus::from_transaction_status(&tx.status),
                reference_id: tx.qr_id.clone(),
                transaction_hash: tx.transaction_hash.clone(), 
                fee: Some(tx.fee), 
                description: format!("Payment: {} {}", tx.fiat_amount, tx.fiat_currency),
            });
        }
    });
    
    //  topup transactions
    TOPUP_TRANSACTIONS.with(|topups| {
        for (_, topup) in topups.borrow().iter() {
            network_transactions.push(NetworkTransaction {
                id: topup.id.clone(),
                transaction_type: NetworkTransactionType::Topup,
                from_user: None, 
                to_user: Some(topup.user_id),
                amount: topup.amount,
                fiat_amount: topup.fiat_amount,
                fiat_currency: topup.fiat_currency.clone(),
                icp_amount: topup.amount,
                timestamp: topup.created_at,
                status: NetworkTransactionStatus::from_topup_status(&topup.status),
                reference_id: topup.reference_id.clone(),
                transaction_hash: None, 
                fee: None, 
                description: format!("Top-up via {}: {} {}", 
                    get_topup_method_string(&topup.payment_method),
                    topup.fiat_amount, 
                    topup.fiat_currency
                ),
            });
        }
    });
    
    // Sort by timestamp (newest first)
    network_transactions.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    
    ic_cdk::println!("📊 Returning {} network transactions (payments + topups)", network_transactions.len());
    network_transactions
}

// Helper function to convert topup method to string
fn get_topup_method_string(method: &TopUpMethod) -> String {
    match method {
        TopUpMethod::QRIS => "QRIS".to_string(),
        TopUpMethod::CreditCard => "Credit Card".to_string(),
        TopUpMethod::DebitCard => "Debit Card".to_string(),
        TopUpMethod::Web3Wallet => "Web3 Wallet".to_string(),
    }
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
    let twenty_four_hours = 24 * 60 * 60 * 1_000_000_000; 
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
    

    let current_balance = get_current_balance(caller);
    
    ic_cdk::println!("📊 Calculating stats for {}: current_balance={}", 
        caller.to_text(), current_balance);
    

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

}


ic_cdk::export_candid!();

#[query]
#[candid_method(query)]
fn get_supported_currencies_list() -> Vec<String> {
    get_supported_currencies()
}

// ===================
// TESTING HELPER FUNCTIONS
// ===================


#[update]
#[candid_method(update)]
async fn age_cache(currency: String, age_minutes: u64) -> Result<String, String> {
    let currency_upper = currency.to_uppercase();
    
    EXCHANGE_RATES.with(|rates| {
        let mut rates_borrow = rates.borrow_mut();
        
        if let Some(rate) = rates_borrow.get(&currency_upper) {

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


#[update]
#[candid_method(update)]
async fn create_test_stale_cache(currency: String, rate_value: f64) -> Result<String, String> {
    let currency_upper = currency.to_uppercase();
    
    if !is_supported_currency(&currency_upper) {
        return Err(format!("Unsupported currency: {}", currency_upper));
    }
    

    let old_timestamp = ic_cdk::api::time() - (10 * 60 * 1_000_000_000);
    
    let stale_rate = ExchangeRate {
        currency: currency_upper.clone(),
        rate: rate_value,
        timestamp: old_timestamp,
        source: "test_stale".to_string(),
    };
    

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


#[update]
#[candid_method(update)]
async fn create_test_recent_cache(currency: String, rate_value: f64) -> Result<String, String> {
    let currency_upper = currency.to_uppercase();
    
    if !is_supported_currency(&currency_upper) {
        return Err(format!("Unsupported currency: {}", currency_upper));
    }
    

    let recent_timestamp = ic_cdk::api::time() - (3 * 60 * 1_000_000_000);
    
    let recent_rate = ExchangeRate {
        currency: currency_upper.clone(),
        rate: rate_value,
        timestamp: recent_timestamp,
        source: "test_recent".to_string(),
    };
    

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