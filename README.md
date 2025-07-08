# 🚀 ICP Payment Gateway - Decentralized Global Payment Solution

<div align="center">

![ICP Payment Gateway](https://img.shields.io/badge/ICP-Payment%20Gateway-blue?style=for-the-badge&logo=internet-computer)
![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Internet Computer](https://img.shields.io/badge/Internet%20Computer-29ABE2?style=for-the-badge&logo=internet-computer&logoColor=white)

**A fully decentralized payment gateway built on Internet Computer Protocol (ICP) that enables global cross-border payments with automatic fiat-to-ICP conversion through QR code scanning.**

</div>

---

## 🌟 Overview

ICP Payment Gateway is a revolutionary blockchain-based payment solution that allows anyone, anywhere in the world to:

- 💸 **Send & Receive Global Payments** - Cross-border transactions with any fiat currency
- 🔄 **Automatic Currency Conversion** - Real-time fiat to ICP conversion via HTTPS outcalls
- 📱 **Universal QR Code Payments** - Scan to pay from any wallet
- 🔐 **100% Decentralized** - No reliance on traditional payment processors
- 🌐 **Blockchain Transparency** - All transactions recorded on ICP blockchain
- 🏦 **Financial Inclusion** - Banking services for the unbanked

---

## 🏗️ Architecture

### System Flow
```
User Creates Payment Request
        ↓
QR Code Generated (Canister)
        ↓
Real-time ICP Rate Fetched (HTTPS Outcall)
        ↓
User Scans QR & Pays (Plug Wallet)
        ↓
Transaction Recorded (Blockchain)
        ↓
Payment Verified & Completed
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| 🧠 **Smart Contracts** | Rust Canisters | Core business logic, data storage |
| 🌐 **External Data** | HTTPS Outcalls | Real-time exchange rates from CoinGecko |
| 🎨 **Frontend** | Next.js (Static Export) | User interface hosted on ICP |
| 🔐 **Authentication** | Internet Identity | Decentralized user authentication |
| 💰 **Wallet Integration** | Plug Wallet / Stoic | Native ICP wallet support |
| 📊 **Data Storage** | Stable Structures | Persistent on-chain data storage |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ and npm/yarn
- **Rust** with wasm32 target
- **DFX** v0.24.0+
- **Git**

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/icp-payment-gateway.git
   cd icp-payment-gateway
   ```

2. **Install Rust Dependencies**
   ```bash
   # Install Rust (if not already installed)
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   
   # Add wasm32 target
   rustup target add wasm32-unknown-unknown
   ```

3. **Install DFX**
   ```bash
   DFX_VERSION=0.24.1 sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
   ```

4. **Install Frontend Dependencies**
   ```bash
   cd src/frontend
   npm install
   cd ../..
   ```

### 🔧 Development Setup

1. **Start Local ICP Replica**
   ```bash
   dfx start --background --clean
   ```

2. **Deploy Backend Canister**
   ```bash
   dfx deploy backend
   ```

3. **Build & Deploy Frontend**
   ```bash
   cd src/frontend
   npm run build
   cd ../..
   dfx deploy frontend
   ```

4. **Access Your Application**
   ```bash
   # Backend Candid Interface
   echo "Backend: http://localhost:4943?canisterId=$(dfx canister id backend)"
   
   # Frontend Application
   echo "Frontend: http://localhost:4943?canisterId=$(dfx canister id frontend)"
   ```

---

## 📋 Available Scripts

### Backend Commands
```bash
# Build backend only
dfx build backend

# Deploy backend with logs
dfx deploy backend --mode=install

# Check backend status
dfx canister status backend

# View backend logs
dfx canister logs backend
```

### Frontend Commands
```bash
cd src/frontend

# Development server
npm run dev

# Production build
npm run build

# Lint code
npm run lint
```

### Full Project Commands
```bash
# Deploy everything
dfx deploy

# Stop local replica
dfx stop

# Clean and restart
dfx start --clean --background
```

---

## 🎯 Core Features

### 1. **User Management**
- **Internet Identity Integration** - Secure, passwordless authentication
- **Wallet Connection** - Automatic Plug wallet integration
- **User Profiles** - Store user preferences and transaction history

### 2. **Payment Processing**
- **QR Code Generation** - Unique payment requests with expiration
- **Multi-Currency Support** - USD, EUR, IDR, JPY, and more
- **Real-time Exchange Rates** - Live ICP pricing via CoinGecko API
- **Transaction Verification** - Blockchain-based payment confirmation

### 3. **Blockchain Integration**
- **Stable Storage** - Persistent data storage on ICP
- **HTTPS Outcalls** - External API integration for exchange rates
- **Transparent Transactions** - All payments recorded on-chain
- **Smart Contract Logic** - Automated payment processing

---

## 🛠️ API Reference

### Backend Canister Methods

#### User Management
```rust
// Register new user
register_user(wallet_address: String) -> Result<User, String>

// Get current user
get_user() -> Option<User>

// Get user statistics
get_user_stats() -> UserStats
```

#### Payment Operations
```rust
// Generate payment QR code
generate_qr(fiat_amount: f64, currency: String) -> Result<QRCode, String>

// Process payment
process_payment(qr_id: String) -> Result<Transaction, String>

// Get transaction history
get_user_transactions() -> Vec<Transaction>
```

#### Exchange Rates
```rust
// Fetch live exchange rate
fetch_exchange_rate(currency: String) -> Result<ExchangeRate, String>

// Get supported currencies
get_supported_currencies() -> Vec<String>
```

### Data Structures

```rust
// User Profile
struct User {
    id: Principal,
    wallet_address: String,
    username: Option<String>,
    email: Option<String>,
    created_at: u64,
}

// Payment Transaction
struct Transaction {
    id: String,
    from: Principal,
    to: Principal,
    amount: u64,
    fiat_currency: String,
    fiat_amount: f64,
    icp_amount: u64,
    timestamp: u64,
    status: TransactionStatus,
}

// QR Code Payment Request
struct QRCode {
    id: String,
    user_id: Principal,
    fiat_amount: f64,
    fiat_currency: String,
    icp_amount: u64,
    description: Option<String>,
    expire_time: u64,
    created_at: u64,
    is_used: bool,
}
```

---

## 🧪 Testing

### Run Backend Tests
```bash
cd src/backend
cargo test
```

### Test Canister Functions
```bash
# Test user registration
dfx canister call backend register_user '("wallet123")'

# Test QR generation
dfx canister call backend generate_qr '(100.0, "USD")'

# Test exchange rate fetching
dfx canister call backend fetch_exchange_rate '("USD")'
```

### Frontend Testing
```bash
cd src/frontend
npm test
npm run test:e2e
```

---

## 🚢 Deployment

### Local Development
```bash
dfx start --background
dfx deploy
```

### IC Mainnet Deployment
```bash
# Deploy to IC mainnet (requires cycles)
dfx deploy --network ic --with-cycles 1000000000000
```

### Production Checklist
- [ ] Secure environment variables
- [ ] Enable production mode
- [ ] Configure proper CORS
- [ ] Set up monitoring
- [ ] Backup canister state

---

## 🔧 Configuration

### Environment Variables
```bash
# .env file
DFX_NETWORK=local
CANISTER_ID_BACKEND=your-backend-canister-id
CANISTER_ID_FRONTEND=your-frontend-canister-id
```

### Supported Currencies
- USD (US Dollar)
- EUR (Euro)
- IDR (Indonesian Rupiah)
- JPY (Japanese Yen)
- GBP (British Pound)
- SGD (Singapore Dollar)

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Troubleshooting

### Common Issues

**DFX Start Fails**
```bash
# Clean and restart
dfx stop
pkill -f dfx
dfx start --clean --background
```

**Frontend Build Error**
```bash
# Ensure out directory exists
cd src/frontend
npm run build
```

**Canister Deployment Issues**
```bash
# Check canister status
dfx canister status --all
dfx ping
```

### Getting Help

- 📖 [IC Developer Docs](https://internetcomputer.org/docs/)
- 💬 [IC Developer Forum](https://forum.dfinity.org/)
- 🐛 [Report Issues](https://github.com/your-username/icp-payment-gateway/issues)

---

## 🎖️ Acknowledgments

- [DFINITY Foundation](https://dfinity.org/) for the Internet Computer Protocol
- [IC Developer Community](https://forum.dfinity.org/) for support and guidance
- [CoinGecko API](https://coingecko.com/api) for real-time exchange rates

---

<div align="center">

**Built with ❤️ on the Internet Computer**

[![Internet Computer](https://img.shields.io/badge/Powered%20by-Internet%20Computer-29ABE2?style=for-the-badge&logo=internet-computer)](https://internetcomputer.org/)

</div>