use crate::types::*;
use crate::rates::*;
use candid::Principal;
use ic_cdk::api::time;
use sha2::{Digest, Sha256};

// Generate unique top-up transaction ID
pub fn generate_topup_id() -> String {
    let timestamp = time();
    let caller = ic_cdk::caller();
    let combined = format!("topup-{}-{}", timestamp, caller.to_text());
    
    let mut hasher = Sha256::new();
    hasher.update(combined.as_bytes());
    let hash = hasher.finalize();
    
    format!("TU{:X}", hash)[..16].to_string()
}

// Create QRIS top-up transaction
pub async fn create_qris_topup(
    user_id: Principal,
    fiat_amount: f64,
    currency: String,
) -> Result<TopUpTransaction, String> {
    let exchange_rate = fetch_live_exchange_rate(currency.clone()).await?;
    let icp_amount = calculate_icp_amount(fiat_amount, exchange_rate.rate)?;
    
    let topup_id = generate_topup_id();
    let current_time = time();
    let expire_time = current_time + (15 * 60 * 1_000_000_000); // 15 minutes
    
    // Get base URL from environment or use default
    let base_url = if cfg!(debug_assertions) {
        "http://localhost:3000"
    } else {
        "https://your-production-domain.com"
    };
    
    let qris_data = QRISData {
        qr_code_url: format!("{}/qris/{}", base_url, topup_id),
        qr_code_data: format!(
            "00020101021226580014ID.CO.QRIS.WWW0114ID.CO.QRIS.WWW02150000000000000000303ID.CO.QRIS.WWW540{:.2}5303360540{:.2}5802ID5914ICP Payment6015Jakarta Selatan61051240062070703A0163046D4F", 
            fiat_amount, fiat_amount
        ),
        merchant_id: "ICP_PAYMENT_001".to_string(),
        expire_time,
    };
    
    let payment_data = TopUpPaymentData {
        qris_data: vec![qris_data],
        card_data: vec![],
        web3_data: vec![],
    };
    
    let topup_transaction = TopUpTransaction {
        id: topup_id.clone(),
        user_id,
        amount: icp_amount,
        fiat_amount,
        fiat_currency: currency,
        payment_method: TopUpMethod::QRIS,
        payment_data,
        status: TopUpStatus::Pending,
        created_at: current_time,
        processed_at: None,
        reference_id: topup_id,
    };
    
    Ok(topup_transaction)
}

pub fn check_payment_expiration(topup: &TopUpTransaction) -> bool {
    let current_time = time();
    
    match topup.payment_method {
        TopUpMethod::QRIS => {
            // QRIS expires after 15 minutes
            if !topup.payment_data.qris_data.is_empty() {
                let qris = &topup.payment_data.qris_data[0];
                current_time > qris.expire_time
            } else {
                false
            }
        },
        TopUpMethod::CreditCard | TopUpMethod::DebitCard => {
            // Cards expire after 1 hour if not processed
            let one_hour = 60 * 60 * 1_000_000_000u64;
            current_time > topup.created_at + one_hour
        },
        TopUpMethod::Web3Wallet => {
            // Web3 transactions expire after 30 minutes
            let thirty_minutes = 30 * 60 * 1_000_000_000u64;
            current_time > topup.created_at + thirty_minutes
        },
    }
}

// Create card top-up transaction
pub async fn create_card_topup(
    user_id: Principal,
    fiat_amount: f64,
    currency: String,
    card_input: CardDataInput,
    is_credit: bool,
) -> Result<TopUpTransaction, String> {
    // Validate card data (MVP - hardcoded validation)
    validate_card_data(&card_input)?;
    
    let exchange_rate = fetch_live_exchange_rate(currency.clone()).await?;
    let icp_amount = calculate_icp_amount(fiat_amount, exchange_rate.rate)?;
    
    let topup_id = generate_topup_id();
    let current_time = time();
    
    // Mask card number for security
    let masked_card = mask_card_number(&card_input.card_number);
    let card_type = detect_card_type(&card_input.card_number);
    
    let card_data = CardData {
        card_number: masked_card,
        card_type,
        payment_gateway: "ICP_GATEWAY".to_string(),
        transaction_id: format!("TXN_{}", topup_id),
    };
    
    let payment_data = TopUpPaymentData {
        qris_data: vec![],           // FIX: Empty Vec
        card_data: vec![card_data],  // FIX: Wrap in Vec
        web3_data: vec![],           // FIX: Empty Vec
    };
    
    let method = if is_credit { TopUpMethod::CreditCard } else { TopUpMethod::DebitCard };
    
    let topup_transaction = TopUpTransaction {
        id: topup_id.clone(),
        user_id,
        amount: icp_amount,
        fiat_amount,
        fiat_currency: currency,
        payment_method: method,
        payment_data,
        status: TopUpStatus::Processing,
        created_at: current_time,
        processed_at: None,
        reference_id: topup_id,
    };
    
    Ok(topup_transaction)
}

// MVP Card validation (hardcoded for demo)
fn validate_card_data(card_input: &CardDataInput) -> Result<(), String> {
    // Hardcoded valid cards for MVP
    let valid_cards = vec![
        "4111111111111111", // Visa Test
        "5555555555554444", // Mastercard Test
        "4000000000000002", // Visa Declined Test
        "1234567890123456", // Demo Card
    ];
    
    if !valid_cards.contains(&card_input.card_number.as_str()) {
        return Err("Invalid card number for MVP demo".to_string());
    }
    
    // Basic validation
    if card_input.cvv.len() != 3 {
        return Err("CVV must be 3 digits".to_string());
    }
    
    if card_input.cardholder_name.len() < 3 {
        return Err("Cardholder name too short".to_string());
    }
    
    Ok(())
}

fn mask_card_number(card_number: &str) -> String {
    if card_number.len() >= 16 {
        format!("{}****{}", &card_number[..4], &card_number[card_number.len()-4..])
    } else {
        "****".to_string()
    }
}

fn detect_card_type(card_number: &str) -> String {
    match card_number.chars().next() {
        Some('4') => "Visa".to_string(),
        Some('5') => "Mastercard".to_string(),
        Some('1') => "Demo Card".to_string(),
        _ => "Unknown".to_string(),
    }
}

pub async fn create_web3_topup(
    user_id: Principal,
    fiat_amount: f64,
    currency: String,
    wallet_address: String,
) -> Result<TopUpTransaction, String> {
    let exchange_rate = fetch_live_exchange_rate(currency.clone()).await?;
    let icp_amount = calculate_icp_amount(fiat_amount, exchange_rate.rate)?;
    
    let topup_id = generate_topup_id();
    let current_time = time();
    
    let web3_data = Web3Data {
        wallet_address,
        blockchain_network: "Internet Computer".to_string(), // Fixed field name
        transaction_hash: None,                              // Fixed field name
        confirmation_count: 0,                               // Added field
    };
    
    let payment_data = TopUpPaymentData {
        qris_data: vec![],
        card_data: vec![],
        web3_data: vec![web3_data],
    };
    
    let topup_transaction = TopUpTransaction {
        id: topup_id.clone(),
        user_id,
        amount: icp_amount,
        fiat_amount,
        fiat_currency: currency,
        payment_method: TopUpMethod::Web3Wallet,
        payment_data,
        status: TopUpStatus::Pending,
        created_at: current_time,
        processed_at: None,
        reference_id: topup_id,
    };
    
    Ok(topup_transaction)
}

// Process top-up payment
pub fn process_topup_payment(
    topup: &mut TopUpTransaction,
    success: bool,
) -> Result<(), String> {
    let current_time = time();
    
    if success {
        topup.status = TopUpStatus::Completed;
        topup.processed_at = Some(current_time);
    } else {
        topup.status = TopUpStatus::Failed;
        topup.processed_at = Some(current_time);
    }
    
    Ok(())
}

// Update user balance
pub fn update_user_balance(user: &mut User, amount: u64) {
    user.balance += amount;
}

// Check if top-up is expired
pub fn is_topup_expired(topup: &TopUpTransaction) -> bool {
    check_payment_expiration(topup)
}

// Format balance for display
pub fn format_balance(balance: u64) -> String {
    let icp_amount = balance as f64 / 100_000_000.0;
    format!("{:.8} ICP", icp_amount)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_mask_card_number() {
        assert_eq!(mask_card_number("4111111111111111"), "4111****1111");
        assert_eq!(mask_card_number("123"), "****");
    }
    
    #[test]
    fn test_detect_card_type() {
        assert_eq!(detect_card_type("4111111111111111"), "Visa");
        assert_eq!(detect_card_type("5555555555554444"), "Mastercard");
    }
}