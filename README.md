# 🚀 ICP Payment Gateway v1 - Decentralized Global Payment Solution

<div align="center">

![ICP Payment Gateway](https://img.shields.io/badge/ICP-Payment%20Gateway%20v1-blue?style=for-the-badge&logo=internet-computer)
![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Internet Computer](https://img.shields.io/badge/Internet%20Computer-29ABE2?style=for-the-badge&logo=internet-computer&logoColor=white)

**A decentralized payment gateway built on Internet Computer Protocol (ICP) that enables global cross-border payments with automatic fiat-to-ICP conversion through QR code scanning.**

**Gateway pembayaran terdesentralisasi yang dibangun di Internet Computer Protocol (ICP) yang memungkinkan pembayaran lintas batas global dengan konversi otomatis fiat-ke-ICP melalui pemindaian kode QR.**

</div>

---

## 🌟 Overview | Gambaran Umum

### English
ICP Payment Gateway v1 is a **MVP (Minimum Viable Product)** blockchain-based payment solution that demonstrates the core functionality of decentralized payments. This version includes essential features for testing and demonstration purposes, with full production features planned for v2.

**Current Status**: ✅ **Fully functional MVP ready for testing**

### Indonesia
ICP Payment Gateway v1 adalah **MVP (Minimum Viable Product)** solusi pembayaran berbasis blockchain yang mendemonstrasikan fungsionalitas inti dari pembayaran terdesentralisasi. Versi ini mencakup fitur penting untuk pengujian dan demonstrasi, dengan fitur produksi lengkap direncanakan untuk v2.

**Status Saat Ini**: ✅ **MVP yang berfungsi penuh siap untuk pengujian**

---

## 🔥 Current Features v1 | Fitur Saat Ini v1

### ✅ Implemented Features | Fitur yang Telah Diimplementasikan

| Feature | English | Indonesia | Status |
|---------|---------|-----------|---------|
| 👤 **User Management** | Mock wallet authentication & user registration | Autentikasi dompet mock & registrasi pengguna | ✅ |
| 📱 **QR Generation** | Generate payment QR codes with 30-min expiration | Buat kode QR pembayaran dengan kadaluarsa 30 menit | ✅ |
| 💰 **Multi-Currency** | Support IDR, USD, EUR, JPY with flag icons | Dukungan IDR, USD, EUR, JPY dengan ikon bendera | ✅ |
| 🔄 **Exchange Rates** | Real-time rates via CoinGecko HTTPS outcalls | Nilai tukar real-time via panggilan HTTPS CoinGecko | ✅ |
| 💳 **Payment Processing** | Mock payment simulation with transaction recording | Simulasi pembayaran mock dengan pencatatan transaksi | ✅ |
| 📊 **Transaction History** | View complete payment history | Lihat riwayat pembayaran lengkap | ✅ |
| 🏦 **Top-up System** | QRIS top-up (Indonesia), Credit Card & Web3 coming soon | Top-up QRIS (Indonesia), Kartu Kredit & Web3 segera hadir | ✅ |
| 📈 **Network Statistics** | Real-time payment network analytics | Analitik jaringan pembayaran real-time | ✅ |
| 🎨 **Modern UI** | Responsive React frontend with Tailwind CSS | Frontend React responsif dengan Tailwind CSS | ✅ |

### � Coming in v2 | Akan Hadir di v2

- � **Internet Identity** integration
- 🌐 **Real ICP wallet** integration (Plug, Stoic)
- � **Actual ICP transactions**
- 📱 **Mobile app**
- 🏪 **Merchant dashboard**

---

## 🚀 Quick Setup | Pengaturan Cepat

### Prerequisites | Prasyarat

```bash
# English: Required software
# Indonesia: Software yang diperlukan

1. Install DFX v0.27.0+
2. Install Rust with wasm32 target
3. Install Node.js via NVM
4. Git
```

### Installation Steps | Langkah Instalasi

#### 1. Install Dependencies | Instal Dependensi

**English: Install required tools**
```bash
# Install DFX
DFX_VERSION=0.27.0 sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown

# Install NVM and Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

**Indonesia: Instal tools yang diperlukan**
```bash
# Instal DFX
DFX_VERSION=0.27.0 sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Instal Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown

# Instal NVM dan Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

#### 2. Clone Project | Klon Proyek

```bash
# English: Clone the repository
# Indonesia: Klon repositori
git clone https://github.com/your-username/icp-payment-gateway.git
cd icp-payment-gateway
```

#### 3. Setup Environment | Pengaturan Environment

**English: Create environment files BEFORE building**
**Indonesia: Buat file environment SEBELUM build**

Create `/src/frontend/.env`:
```env
VITE_CANISTER_ID=backend_canister_id
VITE_IC_HOST=http://localhost:4943
VITE_DFX_NETWORK=local
```

Create `/src/frontend/.env.local`:
```env
# ICP Environment Configuration
VITE_NETWORK=local
VITE_HOST=http://localhost:4943
VITE_CANISTER_ID_BACKEND=
VITE_CANISTER_ID_FRONTEND=
VITE_REPLICA_HOST=http://localhost:4943
VITE_DEVELOPMENT=true
```

#### 4. Install Frontend Dependencies | Instal Dependensi Frontend

```bash
cd src/frontend
npm install
npm run build
cd ../..
```

#### 5. Run Development | Jalankan Development

**English: Open 3 terminals in VS Code**
**Indonesia: Buka 3 terminal di VS Code**

**Terminal 1** - DFX (logs visible):
```bash
dfx start --clean
```

**Terminal 2** - Deploy Backend:
```bash
dfx deploy backend
# Optional: dfx deploy frontend (for canister mode)
```

**Terminal 3** - Frontend Development:
```bash
cd src/frontend
npm run dev
```

#### 6. Configure Backend URL | Konfigurasi URL Backend

**English: Adjust URL based on your development setup**
**Indonesia: Sesuaikan URL berdasarkan pengaturan development Anda**

Edit `/src/backend/src/topup.rs`:

```rust
fn get_base_url() -> &'static str {
    // DEVELOPMENT MODE (npm run dev - port 5173)
    "http://localhost:5173"
    
    // OR if using port 3000:
    // "http://localhost:3000"
    
    // CANISTER MODE (uncomment line below, comment line above)
    // "http://127.0.0.1:4943" 
    // example: http://uzt4z-lp777-77774-qaabq-cai.localhost:4943/
    
    // PRODUCTION MODE (uncomment line below, comment others)
    // "https://your-production-domain.com" coming soon
}
```

---

## 🎯 Access Your Application | Akses Aplikasi Anda

### Development Mode | Mode Development
```bash
# Frontend (Vite dev server)
http://localhost:5173

# Or if using port 3000:
http://localhost:3000
```

### Canister Mode | Mode Canister
```bash
# Get canister URLs | Dapatkan URL canister
echo "Frontend: http://$(dfx canister id frontend).localhost:4943/"
echo "Backend Candid: http://127.0.0.1:4943/?canisterId=$(dfx canister id __Candid_UI)&id=$(dfx canister id backend)"
```

---

## 🧪 Testing Guide | Panduan Pengujian

### Quick Test Flow | Alur Pengujian Cepat

**English**:
1. **Register User**: Click "Mock" → Generate wallet → "Register User"
2. **Generate QR**: Enter amount → Select currency → "Generate QR Code"
3. **Process Payment**: Copy QR ID → Go to "Pay/Scan" → Enter QR ID → "Pay Now"
4. **View History**: Check "Transaction History" for completed payment

**Indonesia**:
1. **Daftar Pengguna**: Klik "Mock" → Generate wallet → "Register User"
2. **Buat QR**: Masukkan jumlah → Pilih mata uang → "Generate QR Code"
3. **Proses Pembayaran**: Salin QR ID → Pergi ke "Pay/Scan" → Masukkan QR ID → "Pay Now"
4. **Lihat Riwayat**: Periksa "Transaction History" untuk pembayaran yang selesai

### Complete Testing Instructions | Instruksi Pengujian Lengkap
📋 **See TESTING.md for detailed testing procedures**
📋 **Lihat TESTING.md untuk prosedur pengujian terperinci**

---

## 🏗️ Architecture | Arsitektur

### Technology Stack | Stack Teknologi

| Component | Technology | Purpose (EN) | Tujuan (ID) |
|-----------|------------|---------------|-------------|
| 🧠 **Backend** | Rust Canisters | Business logic, data storage | Logika bisnis, penyimpanan data |
| 🌐 **External APIs** | HTTPS Outcalls | Real-time exchange rates | Nilai tukar real-time |
| 🎨 **Frontend** | React + Vite | User interface | Antarmuka pengguna |
| 🔐 **Authentication** | Mock Wallet (v1) | Simplified testing auth | Autentikasi pengujian sederhana |
| 📊 **Storage** | Stable Structures | Persistent blockchain data | Data blockchain persisten |

### System Flow | Alur Sistem

```
User Registration → QR Generation → Exchange Rate Fetch → Payment Processing → Transaction Recording → History Display
```

---

## � API Reference | Referensi API

### Core Functions | Fungsi Inti

#### User Management | Manajemen Pengguna
```rust
register_user(wallet_address: String, username: Option<String>, email: Option<String>) -> Result<User, String>
get_user() -> Option<User>
get_user_stats() -> Option<UserStats>
```

#### Payment Operations | Operasi Pembayaran
```rust
generate_qr(fiat_amount: f64, currency: String, description: Option<String>) -> Result<QRCode, String>
validate_qr_code(qr_id: String) -> Result<QRDisplayInfo, String>
process_payment(qr_id: String, transaction_hash: Option<String>) -> Result<Transaction, String>
```

#### Exchange Rates | Nilai Tukar
```rust
fetch_exchange_rate(currency: String) -> Result<ExchangeRate, String>
get_supported_currencies_list() -> Vec<String>
```

#### Top-up System | Sistem Top-up
```rust
create_qris_topup(amount: f64, currency: String) -> Result<TopUpTransaction, String>
get_user_topup_history() -> Vec<TopUpTransaction>
```

---

## 🔧 Configuration | Konfigurasi

### Supported Currencies | Mata Uang yang Didukung

| Currency | English Name | Indonesian Name | Flag |
|----------|--------------|-----------------|------|
| IDR | Indonesian Rupiah | Rupiah Indonesia | 🇮🇩 |
| USD | US Dollar | Dollar Amerika | 🇺🇸 |
| EUR | Euro | Euro | 🇪🇺 |
| JPY | Japanese Yen | Yen Jepang | 🇯🇵 |

### Environment Modes | Mode Environment

1. **Development Mode**: `npm run dev` (port 5173/3000)
2. **Canister Mode**: Deployed to local IC replica
3. **Production Mode**: IC mainnet (v2 feature)

---

## 🚧 Known Limitations v1 | Keterbatasan yang Diketahui v1

### English
- **Mock Authentication**: Uses simplified wallet generation for testing
- **Simulated Payments**: No real ICP transactions, only simulation
- **Limited Currencies**: Only 4 currencies supported
- **Development Focus**: Optimized for testing and demonstration

### Indonesia
- **Autentikasi Mock**: Menggunakan generasi dompet sederhana untuk pengujian
- **Pembayaran Simulasi**: Tidak ada transaksi ICP nyata, hanya simulasi
- **Mata Uang Terbatas**: Hanya 4 mata uang yang didukung
- **Fokus Pengembangan**: Dioptimalkan untuk pengujian dan demonstrasi

---

## 🆘 Troubleshooting | Pemecahan Masalah

### Common Issues | Masalah Umum

#### Frontend Build Issues | Masalah Build Frontend
```bash
# English: Clean and rebuild
# Indonesia: Bersihkan dan build ulang
cd src/frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### DFX Issues | Masalah DFX
```bash
# English: Reset DFX
# Indonesia: Reset DFX
dfx stop
pkill -f dfx
dfx start --clean
```

#### Environment File Issues | Masalah File Environment
```bash
# English: Ensure .env files exist before building
# Indonesia: Pastikan file .env ada sebelum build
ls -la src/frontend/.env*
```

### Getting Help | Mendapatkan Bantuan

**English**:
- 📖 [IC Developer Docs](https://internetcomputer.org/docs/)
- 💬 [IC Developer Forum](https://forum.dfinity.org/)
- 🐛 [Report Issues](https://github.com/your-username/icp-payment-gateway/issues)

**Indonesia**:
- 📖 [Dokumentasi Developer IC](https://internetcomputer.org/docs/)
- 💬 [Forum Developer IC](https://forum.dfinity.org/)
- 🐛 [Laporkan Masalah](https://github.com/your-username/icp-payment-gateway/issues)

---

## 🗺️ Roadmap

### v1 (Current) - MVP ✅
- [x] Core payment flow
- [x] QR code system
- [x] Mock authentication
- [x] Basic transaction history
- [x] Multi-currency support
- [x] QRIS top-up system

### v2 (Next) - Production Ready
- [ ] Internet Identity integration
- [ ] Real ICP wallet connection
- [ ] Actual ICP transactions
- [ ] Enhanced security
- [ ] all currency support
- [ ] gateway service like midtrans

### v3 (Future) - Advanced Features
- [ ] Merchant dashboard
- [ ] Advanced analytics
- [ ] Multi-signature support
- [ ] Recurring payments

---

## 🎖️ Acknowledgments | Pengakuan

**English**:
- [DFINITY Foundation](https://dfinity.org/) for the Internet Computer Protocol
- [IC Developer Community](https://forum.dfinity.org/) for support and guidance
- [CoinGecko API](https://coingecko.com/api) for real-time exchange rates

**Indonesia**:
- [DFINITY Foundation](https://dfinity.org/) untuk Internet Computer Protocol
- [Komunitas Developer IC](https://forum.dfinity.org/) untuk dukungan dan panduan
- [CoinGecko API](https://coingecko.com/api) untuk nilai tukar real-time

---

<div align="center">

**Built with ❤️ on the Internet Computer**
**Dibangun dengan ❤️ di Internet Computer**

[![Internet Computer](https://img.shields.io/badge/Powered%20by-Internet%20Computer-29ABE2?style=for-the-badge&logo=internet-computer)](https://internetcomputer.org/)

**Version 1.0 - MVP Ready for Testing**
**Versi 1.0 - MVP Siap untuk Pengujian**

</div>