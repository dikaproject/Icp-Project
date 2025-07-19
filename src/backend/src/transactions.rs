use crate::types::*;
use crate::qr::*;
use candid::Principal;
use ic_cdk::api::time;
use sha2::{Digest, Sha256};

// Transaction management functions

pub fn generate_transaction_id(from: Principal, to: Principal, amount: u64) -> String {
    let timestamp = time();
    let random_part = timestamp % 1000000; // Add randomness
    let data = format!("{}-{}-{}-{}-{}", from.to_text(), to.to_text(), amount, timestamp, random_part);
    
    let mut hasher = Sha256::new();
    hasher.update(data.as_bytes());
    let hash = hasher.finalize();
    
    format!("TX_{:X}", hash)[..32].to_string()
}

pub fn create_transaction(
    qr_code: &QRCode,
    payer: Principal,
    transaction_hash: Option<String>,
) -> Result<Transaction, String> {
    // Validate QR code
    is_qr_code_valid(qr_code)?;
    
    let tx_id = generate_transaction_id(payer, qr_code.user_id, qr_code.icp_amount);
    
    // Calculate transaction fee (1% or minimum 0.0001 ICP)
    let fee = calculate_transaction_fee(qr_code.icp_amount);
    
    let transaction = Transaction {
        id: tx_id,
        from: payer,
        to: qr_code.user_id,
        amount: qr_code.icp_amount,
        fiat_currency: qr_code.fiat_currency.clone(),
        fiat_amount: qr_code.fiat_amount,
        icp_amount: qr_code.icp_amount,
        timestamp: time(),
        status: TransactionStatus::Processing,
        qr_id: qr_code.id.clone(),
        transaction_hash,
        fee,
    };
    
    Ok(transaction)
}

pub fn calculate_transaction_fee(amount: u64) -> u64 {
    // 1% fee with minimum of 0.0001 ICP (10,000 e8s)
    let percentage_fee = amount / 100;
    let minimum_fee = 10_000; // 0.0001 ICP in e8s
    
    std::cmp::max(percentage_fee, minimum_fee)
}

// Transaction validation
pub fn validate_transaction_amount(amount: u64) -> Result<(), String> {
    if amount == 0 {
        return Err("Transaction amount cannot be zero".to_string());
    }
    
    // Minimum transaction: 0.001 ICP (100,000 e8s)
    if amount < 100_000 {
        return Err("Transaction amount too small. Minimum: 0.001 ICP".to_string());
    }
    
    // Maximum transaction: 1000 ICP (100,000,000,000 e8s)
    if amount > 100_000_000_000 {
        return Err("Transaction amount too large. Maximum: 1000 ICP".to_string());
    }
    
    Ok(())
}

// Get user transaction statistics
pub fn calculate_user_stats(transactions: &[Transaction], user_id: Principal) -> UserStats {
    let mut total_sent = 0u64;
    let mut total_received = 0u64;
    let mut transaction_count = 0u64;
    
    for tx in transactions {
        if tx.from == user_id {
            total_sent += tx.amount;
            transaction_count += 1;
        } else if tx.to == user_id {
            total_received += tx.amount;
            transaction_count += 1;
        }
    }
    
    UserStats {
        total_sent,
        total_received,
        transaction_count,
        qr_codes_generated: 0, // This should be calculated separately
        total_topup: 0,        // Add missing field
        topup_count: 0,        // Add missing field
        current_balance: 0,    // Add missing field
    }
}

// Filter transactions by status
pub fn filter_transactions_by_status(
    transactions: &[Transaction],
    status: TransactionStatus,
) -> Vec<Transaction> {
    transactions
        .iter()
        .filter(|tx| matches!(tx.status, ref s if s == &status))
        .cloned()
        .collect()
}

// Get transactions for a specific user
pub fn get_user_transactions(
    transactions: &[Transaction],
    user_id: Principal,
) -> Vec<Transaction> {
    transactions
        .iter()
        .filter(|tx| tx.from == user_id || tx.to == user_id)
        .cloned()
        .collect()
}

// Get recent transactions (last 24 hours)
pub fn get_recent_transactions(transactions: &[Transaction]) -> Vec<Transaction> {
    let current_time = time();
    let twenty_four_hours = 24 * 60 * 60 * 1_000_000_000; // 24 hours in nanoseconds
    let cutoff_time = current_time.saturating_sub(twenty_four_hours);
    
    transactions
        .iter()
        .filter(|tx| tx.timestamp >= cutoff_time)
        .cloned()
        .collect()
}

// Transaction display helpers
pub fn format_transaction_amount(amount: u64) -> String {
    let icp_amount = amount as f64 / 100_000_000.0;
    format!("{:.8} ICP", icp_amount)
}

pub fn get_transaction_display_status(status: &TransactionStatus) -> String {
    match status {
        TransactionStatus::Pending => "⏳ Pending".to_string(),
        TransactionStatus::Processing => "🔄 Processing".to_string(),
        TransactionStatus::Completed => "✅ Completed".to_string(),
        TransactionStatus::Failed => "❌ Failed".to_string(),
        TransactionStatus::Expired => "⏰ Expired".to_string(),
    }
}

// Transaction summary for display
#[derive(candid::CandidType, serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct TransactionSummary {
    pub id: String,
    pub amount_icp: String,
    pub amount_fiat: String,
    pub currency: String,
    pub status: String,
    pub timestamp: u64,
    pub is_incoming: bool,
    pub counterpart: Principal,
}

pub fn create_transaction_summary(
    transaction: &Transaction,
    user_id: Principal,
) -> TransactionSummary {
    let is_incoming = transaction.to == user_id;
    let counterpart = if is_incoming {
        transaction.from
    } else {
        transaction.to
    };
    
    TransactionSummary {
        id: transaction.id.clone(),
        amount_icp: format_transaction_amount(transaction.amount),
        amount_fiat: format!(
            "{:.2} {}",
            transaction.fiat_amount,
            transaction.fiat_currency
        ),
        currency: transaction.fiat_currency.clone(),
        status: get_transaction_display_status(&transaction.status),
        timestamp: transaction.timestamp,
        is_incoming,
        counterpart,
    }
}

pub fn find_expired_transactions(transactions: &[Transaction]) -> Vec<String> {
    let current_time = time();
    let mut expired_ids = Vec::new();
    
    for tx in transactions {
        if matches!(tx.status, TransactionStatus::Pending) {
            // Transactions expire after 1 hour
            let expiry_time = tx.timestamp + (60 * 60 * 1_000_000_000);
            if current_time > expiry_time {
                expired_ids.push(tx.id.clone());
            }
        }
    }
    
    expired_ids
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_transaction_id() {
        let from = Principal::from_text("rdmx6-jaaaa-aaaah-qcaiq-cai").unwrap();
        let to = Principal::from_text("rdmx6-jaaaa-aaaah-qcaiq-cai").unwrap();
        
        let id1 = generate_transaction_id(from, to, 1000000);
        let id2 = generate_transaction_id(from, to, 1000000);
        
        assert!(id1.starts_with("tx_"));
        assert!(id2.starts_with("tx_"));
        assert_ne!(id1, id2); // Should be unique due to timestamp
    }

    #[test]
    fn test_calculate_transaction_fee() {
        assert_eq!(calculate_transaction_fee(1_000_000), 10_000); // 1% of 0.01 ICP = minimum fee
        assert_eq!(calculate_transaction_fee(10_000_000), 100_000); // 1% of 0.1 ICP
        assert_eq!(calculate_transaction_fee(1000), 10_000); // Below minimum, use minimum
    }

    #[test]
    fn test_validate_transaction_amount() {
        assert!(validate_transaction_amount(100_000).is_ok()); // Minimum amount
        assert!(validate_transaction_amount(50_000_000_000).is_ok()); // Normal amount
        assert!(validate_transaction_amount(99_999).is_err()); // Below minimum
        assert!(validate_transaction_amount(0).is_err()); // Zero amount
        assert!(validate_transaction_amount(100_000_000_001).is_err()); // Above maximum
    }

    #[test]
    fn test_format_transaction_amount() {
        assert_eq!(format_transaction_amount(100_000_000), "1.00000000 ICP");
        assert_eq!(format_transaction_amount(50_000_000), "0.50000000 ICP");
        assert_eq!(format_transaction_amount(12_345_678), "0.12345678 ICP");
    }
}