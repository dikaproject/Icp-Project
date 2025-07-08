use crate::types::*;
use crate::rates::*;
use candid::Principal;
use ic_cdk::api::time;
use sha2::{Digest, Sha256};

// QR Code management functions

pub fn generate_qr_id() -> String {
    let timestamp = time();
    let caller = ic_cdk::caller();
    let combined = format!("{}-{}", timestamp, caller.to_text());
    
    // Create SHA256 hash for shorter, unique ID
    let mut hasher = Sha256::new();
    hasher.update(combined.as_bytes());
    let hash = hasher.finalize();
    
    // Take first 16 characters of hex string
    format!("{:x}", hash)[..16].to_string().to_uppercase()
}

pub async fn create_qr_code(
    user_id: Principal,
    fiat_amount: f64,
    fiat_currency: String,
    description: Option<String>,
) -> Result<QRCode, String> {
    // Validate inputs
    if fiat_amount <= 0.0 {
        return Err("Amount must be greater than 0".to_string());
    }

    if !is_supported_currency(&fiat_currency) {
        return Err(format!("Unsupported currency: {}", fiat_currency));
    }

    // Fetch current exchange rate
    let exchange_rate = fetch_live_exchange_rate(fiat_currency.clone()).await?;
    
    // Calculate ICP amount
    let icp_amount = calculate_icp_amount(fiat_amount, exchange_rate.rate)?;

    let qr_id = generate_qr_id();
    let current_time = time();
    
    // QR codes expire in 30 minutes (30 * 60 * 1_000_000_000 nanoseconds)
    let expire_time = current_time + (30 * 60 * 1_000_000_000);

    let qr_code = QRCode {
        id: qr_id,
        user_id,
        fiat_amount,
        fiat_currency: fiat_currency.to_uppercase(),
        icp_amount,
        expire_time,
        created_at: current_time,
        is_used: false,
        description,
    };

    Ok(qr_code)
}

pub fn is_qr_code_valid(qr_code: &QRCode) -> Result<(), String> {
    let current_time = time();
    
    if qr_code.is_used {
        return Err("QR code has already been used".to_string());
    }
    
    if current_time > qr_code.expire_time {
        return Err("QR code has expired".to_string());
    }
    
    Ok(())
}

pub fn mark_qr_as_used(qr_code: &mut QRCode) {
    qr_code.is_used = true;
}

// Generate QR code data URL (for frontend display)
pub fn generate_qr_data_url(qr_id: &str, frontend_url: &str) -> String {
    format!("{}/pay/{}", frontend_url, qr_id)
}

// Get QR code display info
pub fn get_qr_display_info(qr_code: &QRCode) -> QRDisplayInfo {
    let current_time = time();
    let time_remaining = if current_time < qr_code.expire_time {
        Some((qr_code.expire_time - current_time) / 1_000_000_000) // Convert to seconds
    } else {
        None
    };

    QRDisplayInfo {
        id: qr_code.id.clone(),
        fiat_amount: qr_code.fiat_amount,
        fiat_currency: qr_code.fiat_currency.clone(),
        icp_amount: qr_code.icp_amount,
        formatted_fiat: format_currency_amount(qr_code.fiat_amount, &qr_code.fiat_currency),
        formatted_icp: format!("{:.8} ICP", qr_code.icp_amount as f64 / 100_000_000.0),
        time_remaining_seconds: time_remaining,
        is_expired: current_time > qr_code.expire_time,
        is_used: qr_code.is_used,
        description: qr_code.description.clone(),
    }
}

// Additional helper struct for display
#[derive(candid::CandidType, serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct QRDisplayInfo {
    pub id: String,
    pub fiat_amount: f64,
    pub fiat_currency: String,
    pub icp_amount: u64,
    pub formatted_fiat: String,
    pub formatted_icp: String,
    pub time_remaining_seconds: Option<u64>,
    pub is_expired: bool,
    pub is_used: bool,
    pub description: Option<String>,
}

// Validate QR code format
pub fn validate_qr_id_format(qr_id: &str) -> bool {
    // QR ID should be 16 character uppercase hex string
    qr_id.len() == 16 && qr_id.chars().all(|c| c.is_ascii_hexdigit() && c.is_uppercase())
}

// Clean up expired QR codes (for periodic cleanup)
pub fn is_qr_expired(qr_code: &QRCode) -> bool {
    time() > qr_code.expire_time
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_qr_id() {
        let id1 = generate_qr_id();
        let id2 = generate_qr_id();
        
        assert_eq!(id1.len(), 16);
        assert_eq!(id2.len(), 16);
        assert_ne!(id1, id2); // Should be unique
        assert!(validate_qr_id_format(&id1));
        assert!(validate_qr_id_format(&id2));
    }

    #[test]
    fn test_validate_qr_id_format() {
        assert!(validate_qr_id_format("1234567890ABCDEF"));
        assert!(!validate_qr_id_format("1234567890abcdef")); // lowercase
        assert!(!validate_qr_id_format("1234567890ABCDEG")); // invalid hex
        assert!(!validate_qr_id_format("1234567890ABCDE")); // too short
        assert!(!validate_qr_id_format("1234567890ABCDEF1")); // too long
    }

    #[test]
    fn test_qr_data_url() {
        let url = generate_qr_data_url("ABC123", "https://example.com");
        assert_eq!(url, "https://example.com/pay/ABC123");
    }
}
