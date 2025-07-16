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
    pub balance: u64,
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
    pub total_topup: u64,        
    pub topup_count: u64,        
    pub current_balance: u64,    
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct SystemStats {
    pub total_users: u64,
    pub total_transactions: u64,
    pub total_qr_codes: u64,
    pub cached_exchange_rates: u64,
    pub completed_transactions: u64,
    pub pending_transactions: u64,
    pub failed_transactions: u64,
    pub canister_balance: u64,
    pub total_topup_volume: u64,  
    pub pending_topups: u64,      
}

// API Response types for HTTPS outcalls
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CoinGeckoResponse {
    pub internet_computer: std::collections::HashMap<String, f64>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct TopUpTransaction {
    pub id: String,
    pub user_id: Principal,
    pub amount: u64,           // Amount in e8s
    pub fiat_amount: f64,      // Original fiat amount
    pub fiat_currency: String,
    pub payment_method: TopUpMethod,
    pub payment_data: TopUpPaymentData,
    pub status: TopUpStatus,
    pub created_at: u64,
    pub processed_at: Option<u64>,
    pub reference_id: String,  // External reference ID
}

impl Storable for TopUpTransaction {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(&self).unwrap())
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
pub enum TopUpMethod {
    QRIS,
    CreditCard,
    DebitCard,
    Web3Wallet,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum TopUpStatus {
    Pending,
    Processing,
    Completed,
    Failed,
    Expired,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct TopUpPaymentData {
    pub qris_data: Vec<QRISData>,      
    pub card_data: Vec<CardData>,        
    pub web3_data: Vec<Web3Data>,      
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct QRISData {
    pub qr_code_url: String,
    pub qr_code_data: String,
    pub merchant_id: String,
    pub expire_time: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct CardData {
    pub card_number: String,  // Masked for security
    pub card_type: String,    // visa, mastercard, etc
    pub payment_gateway: String,
    pub transaction_id: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Web3Data {
    pub wallet_address: String,
    pub blockchain_network: String,     // Changed from 'network'
    pub transaction_hash: Option<String>, // Changed from 'tx_hash'
    pub confirmation_count: u32,        // Add missing field
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UserBalance {
    pub user_id: Principal,
    pub balance: u64,
    pub formatted_balance: String,
    pub last_updated: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TopUpRequest {
    pub amount: f64,
    pub currency: String,
    pub payment_method: TopUpMethod,
    pub card_data: Option<CardDataInput>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CardDataInput {
    pub card_number: String,
    pub expiry_month: String,
    pub expiry_year: String,
    pub cvv: String,
    pub cardholder_name: String,
}