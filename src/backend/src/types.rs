use candid::{CandidType, Deserialize, Principal};
use ic_stable_structures::{Storable, storable::Bound};
use serde::Serialize;
use std::borrow::Cow;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct User {
    pub id: Principal,
    pub wallet_address: String,
    pub created_at: u64,
    pub username: Option<String>,
    pub email: Option<String>,
}

impl Storable for User {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: 1024,
        is_fixed_size: false,
    };
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Transaction {
    pub id: String,
    pub from: Principal,
    pub to: Principal,
    pub amount: u64,           // Amount dalam ICP (e8s)
    pub fiat_currency: String, // IDR, USD, EUR, etc
    pub fiat_amount: f64,      // Original fiat amount
    pub icp_amount: u64,       // Converted ICP amount
    pub timestamp: u64,
    pub status: TransactionStatus,
    pub qr_id: String,
    pub transaction_hash: Option<String>,
    pub fee: u64,              // Transaction fee in e8s
}

impl Storable for Transaction {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: 2048,
        is_fixed_size: false,
    };
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum TransactionStatus {
    Pending,
    Completed,
    Failed,
    Expired,
    Processing,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct QRCode {
    pub id: String,
    pub user_id: Principal,
    pub fiat_amount: f64,
    pub fiat_currency: String,
    pub icp_amount: u64,
    pub expire_time: u64,
    pub created_at: u64,
    pub is_used: bool,
    pub description: Option<String>,
}

impl Storable for QRCode {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: 1024,
        is_fixed_size: false,
    };
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ExchangeRate {
    pub currency: String,
    pub rate: f64,           // 1 ICP = X currency
    pub timestamp: u64,
    pub source: String,      // "coingecko", "binance", etc
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PaymentRequest {
    pub qr_id: String,
    pub payer: Principal,
    pub amount: u64,
    pub timestamp: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UserStats {
    pub total_sent: u64,
    pub total_received: u64,
    pub transaction_count: u64,
    pub qr_codes_generated: u64,
}

// API Response types for HTTPS outcalls
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CoinGeckoResponse {
    pub internet_computer: std::collections::HashMap<String, f64>,
}