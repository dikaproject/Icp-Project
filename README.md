# 🚀 ICP Payment Gateway - Decentralized Global Payment Solution

<div align="center">

![ICP Payment Gateway](https://img.shields.io/badge/ICP-Payment%20Gateway-blue?style=for-the-badge&logo=internet-computer)
![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
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
User Scans QR & Pays (Mock Wallet)
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
| 🎨 **Frontend** | React + Vite | User interface hosted on ICP |
| 🔐 **Authentication** | Mock Wallet (v1) | Simplified authentication for testing |
| 💰 **Wallet Integration** | Mock Implementation | Will integrate Plug/Stoic in v2 |
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
   # Get canister URLs
   echo "Frontend: http://$(dfx canister id frontend).localhost:4943/"
   echo "Backend Candid: http://127.0.0.1:4943/?canisterId=$(dfx canister id __Candid_UI)&id=$(dfx canister id backend)"
   ```

---

## 📋 Available Scripts

### Backend Commands
```bash
# Build backend only
dfx build backend

# Deploy backend with logs
dfx deploy backend

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

# Preview build
npm run preview
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

## 🎯 Core Features (v1 Implementation)

### ✅ **User Management**
- **Mock Wallet Authentication** - Simplified user registration for testing
- **User Profiles** - Store user preferences and transaction history
- **Wallet Address Management** - Generate and manage user identities

### ✅ **Payment Processing**
- **QR Code Generation** - Unique payment requests with 30-minute expiration
- **Multi-Currency Support** - USD, EUR, IDR, JPY, GBP, SGD
- **Real-time Exchange Rates** - Live ICP pricing via CoinGecko API
- **Transaction Simulation** - Mock payment processing for testing

### ✅ **Blockchain Integration**
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
register_user(wallet_address: String, username: Option<String>, email: Option<String>) -> Result<User, String>

// Update user profile
update_user_profile(username: Option<String>, email: Option<String>) -> Result<User, String>

// Get current user
get_user() -> Option<User>

// Get user by ID
get_user_by_id(user_id: Principal) -> Option<User>

// Get user statistics
get_user_stats() -> Option<UserStats>
```

#### Payment Operations
```rust
// Generate payment QR code
generate_qr(fiat_amount: f64, currency: String, description: Option<String>) -> Result<QRCode, String>

// Validate QR code
validate_qr_code(qr_id: String) -> Result<QRDisplayInfo, String>

// Process payment
process_payment(qr_id: String, transaction_hash: Option<String>) -> Result<Transaction, String>

// Get transaction
get_transaction(transaction_id: String) -> Option<Transaction>

// Get user transactions
get_user_transactions() -> Vec<Transaction>

// Get user transaction summaries
get_user_transaction_summaries() -> Vec<TransactionSummary>
```

#### Exchange Rates
```rust
// Fetch live exchange rate
fetch_exchange_rate(currency: String) -> Result<ExchangeRate, String>

// Get cached exchange rate
get_cached_exchange_rate(currency: String) -> Option<ExchangeRate>

// Get supported currencies
get_supported_currencies_list() -> Vec<String>
```

#### System Functions
```rust
// Get system statistics
get_system_stats() -> SystemStats

// Cleanup expired QR codes
cleanup_expired_qr_codes() -> u64

// Cleanup expired transactions
cleanup_expired_transactions() -> u64
```

---

## 🧪 Testing

### Complete Testing Flow

1. **Access the Application**
   ```bash
   # After deployment, open in browser
   http://$(dfx canister id frontend).localhost:4943/
   ```

2. **Test User Registration**
   - Click "Mock" button to generate wallet address
   - Click "Register User" to create account
   - Wait for "✅ Connected" status

3. **Test QR Generation**
   - Go to "📱 Generate QR" tab
   - Enter amount (e.g., 100)
   - Select currency (e.g., USD)
   - Click "Fetch Exchange Rate"
   - Click "Generate QR Code"
   - View QR code and copy QR ID

4. **Test Payment Processing**
   - Go to "💳 Pay/Scan" tab
   - Paste QR ID
   - Click "Lookup QR"
   - Click "Pay Now"
   - View payment confirmation

5. **Test Transaction History**
   - Go to "📋 History" tab
   - View completed transaction
   - Check transaction details

### Backend Testing via Candid UI
```bash
# Open Candid UI
http://127.0.0.1:4943/?canisterId=$(dfx canister id __Candid_UI)&id=$(dfx canister id backend)

# Test key functions:
register_user("wallet123", null, null)
fetch_exchange_rate("USD")
generate_qr(100.0, "USD", null)
get_user_transactions()
```

### Frontend Development Testing
```bash
cd src/frontend
npm run dev  # Development server with hot reload
npm run build  # Production build
npm run preview  # Preview production build
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
- [ ] Update environment variables
- [ ] Test all API endpoints
- [ ] Verify exchange rate integration
- [ ] Test QR code generation/validation
- [ ] Verify transaction processing
- [ ] Test frontend responsiveness

---

## 🔧 Configuration

### Environment Variables
```bash
# Frontend .env.local
VITE_NETWORK=local
VITE_HOST=http://localhost:4943
VITE_CANISTER_ID_BACKEND=your-backend-canister-id
VITE_REPLICA_HOST=http://localhost:4943
VITE_DEVELOPMENT=true
```

### Supported Currencies
- USD (US Dollar)
- EUR (Euro)
- IDR (Indonesian Rupiah)
- JPY (Japanese Yen)
- GBP (British Pound)
- SGD (Singapore Dollar)

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
# Ensure dependencies are installed
cd src/frontend
npm install
npm run build
```

**Canister Deployment Issues**
```bash
# Check canister status
dfx canister status --all
dfx ping
```

**Exchange Rate Fetch Fails**
```bash
# Check backend logs
dfx canister logs backend
```

### Getting Help

- 📖 [IC Developer Docs](https://internetcomputer.org/docs/)
- 💬 [IC Developer Forum](https://forum.dfinity.org/)
- 🐛 [Report Issues](https://github.com/your-username/icp-payment-gateway/issues)

---

## 🗺️ Roadmap

### v1 (Current) - Core Payment System ✅
- [x] User registration and management
- [x] QR code generation and validation
- [x] Real-time exchange rate integration
- [x] Mock payment processing
- [x] Transaction history
- [x] Modern React frontend

### v2 (Next) - Wallet Integration
- [ ] Internet Identity integration
- [ ] Plug Wallet connection
- [ ] Stoic Wallet support
- [ ] Real ICP transactions
- [ ] Enhanced security features

### v3 (Future) - Advanced Features
- [ ] Mobile app (React Native)
- [ ] Recurring payments
- [ ] Multi-signature support
- [ ] Advanced analytics
- [ ] Merchant dashboard

---

## 🎖️ Acknowledgments

- [DFINITY Foundation](https://dfinity.org/) for the Internet Computer Protocol
- [IC Developer Community](https://forum.dfinity.org/) for support and guidance
- [CoinGecko API](https://coingecko.com/api) for real-time exchange rates
- [Vite](https://vitejs.dev/) for fast frontend development
- [Tailwind CSS](https://tailwindcss.com/) for styling

---

<div align="center">

**Built with ❤️ on the Internet Computer**

[![Internet Computer](https://img.shields.io/badge/Powered%20by-Internet%20Computer-29ABE2?style=for-the-badge&logo=internet-computer)](https://internetcomputer.org/)

</div>