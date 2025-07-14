#!/bin/bash
echo "🧪 Quick Manual Backend Tests"
echo "=============================="

# Setup
dfx identity use default
echo "Identity: $(dfx identity whoami)"
echo "Principal: $(dfx identity get-principal)"

# Test 1: Register User
echo "1. Registering user..."
dfx canister call backend register_user '("manual_wallet_123", opt "manual_user", opt "manual@test.com")'

# Test 2: Get User
echo "2. Getting user..."
dfx canister call backend get_user

# Test 3: Fetch Exchange Rate
echo "3. Fetching USD rate..."
dfx canister call backend fetch_exchange_rate '("USD")'

# Test 4: Generate QR
echo "4. Generating QR code..."
dfx canister call backend generate_qr '(25.0, "USD", opt "Manual test payment")'

# Test 5: Get User QR Codes
echo "5. Getting user QR codes..."
dfx canister call backend get_user_qr_codes

# Test 6: System Stats
echo "6. Getting system stats..."
dfx canister call backend get_system_stats

echo "✅ Manual tests completed!"