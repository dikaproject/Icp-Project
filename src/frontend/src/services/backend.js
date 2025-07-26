import { Actor, HttpAgent } from '@dfinity/agent'

// Menggunakan IDL yang sudah ada dari declarations
export const idlFactory = ({ IDL }) => {
  const User = IDL.Record({
    'id': IDL.Principal,
    'wallet_address': IDL.Text,
    'created_at': IDL.Nat64,
    'username': IDL.Opt(IDL.Text),
    'email': IDL.Opt(IDL.Text),
    'balance': IDL.Nat64,
  })

  const UserBalance = IDL.Record({
    'user_id': IDL.Principal,
    'balance': IDL.Nat64,
    'formatted_balance': IDL.Text,
    'last_updated': IDL.Nat64,
  })

  // Add new Balance Change Log types
  const BalanceChangeType = IDL.Variant({
    'TopupCompleted': IDL.Null,
    'PaymentSent': IDL.Null,
    'PaymentReceived': IDL.Null,
    'FeeDeducted': IDL.Null,
    'Refund': IDL.Null,
    'Adjustment': IDL.Null,
  })

  const BalanceChangeLog = IDL.Record({
    'id': IDL.Text,
    'user_id': IDL.Principal,
    'change_type': BalanceChangeType,
    'amount': IDL.Nat64,
    'previous_balance': IDL.Nat64,
    'new_balance': IDL.Nat64,
    'timestamp': IDL.Nat64,
    'reference_id': IDL.Text,
    'description': IDL.Text,
  })

  // Add QR Usage Log types
  const QRUsageType = IDL.Variant({
    'PaymentCompleted': IDL.Null,
    'PaymentFailed': IDL.Null,
    'PaymentExpired': IDL.Null,
  })

  const QRUsageLog = IDL.Record({
    'id': IDL.Text,
    'qr_id': IDL.Text,
    'user_id': IDL.Principal,
    'used_by': IDL.Principal,
    'transaction_id': IDL.Text,
    'timestamp': IDL.Nat64,
    'usage_type': QRUsageType,
  })

  // Add User Preferences types
  const NotificationSettings = IDL.Record({
    'email_notifications': IDL.Bool,
    'push_notifications': IDL.Bool,
    'transaction_alerts': IDL.Bool,
    'marketing_emails': IDL.Bool,
  })

  const UserPreferences = IDL.Record({
    'user_id': IDL.Principal,
    'preferred_currency': IDL.Text,
    'notification_settings': NotificationSettings,
    'ui_theme': IDL.Text,
    'language': IDL.Text,
    'timezone': IDL.Text,
    'updated_at': IDL.Nat64,
  })

  // Add Session types
  const UserSession = IDL.Record({
    'user_id': IDL.Principal,
    'session_id': IDL.Text,
    'created_at': IDL.Nat64,
    'last_activity': IDL.Nat64,
    'ip_address': IDL.Text,
    'user_agent': IDL.Text,
    'is_active': IDL.Bool,
  })

  const TopUpMethod = IDL.Variant({
    'QRIS': IDL.Null,
    'CreditCard': IDL.Null,
    'DebitCard': IDL.Null,
    'Web3Wallet': IDL.Null,
  })

  const TopUpStatus = IDL.Variant({
    'Pending': IDL.Null,
    'Processing': IDL.Null,
    'Completed': IDL.Null,
    'Failed': IDL.Null,
    'Expired': IDL.Null,
  })

  const QRISData = IDL.Record({
    'qr_code_url': IDL.Text,
    'qr_code_data': IDL.Text,
    'merchant_id': IDL.Text,
    'expire_time': IDL.Nat64,
  })

  const CardData = IDL.Record({
    'card_number': IDL.Text,
    'card_type': IDL.Text,
    'payment_gateway': IDL.Text,
    'transaction_id': IDL.Text,
  })

  const Web3Data = IDL.Record({
    'wallet_address': IDL.Text,
    'blockchain_network': IDL.Text,
    'transaction_hash': IDL.Opt(IDL.Text),
    'confirmation_count': IDL.Nat32,
  })

  const TopUpPaymentData = IDL.Record({
    'qris_data': IDL.Vec(QRISData),
    'card_data': IDL.Vec(CardData),
    'web3_data': IDL.Vec(Web3Data),
  })

  const TopUpTransaction = IDL.Record({
    'id': IDL.Text,
    'user_id': IDL.Principal,
    'amount': IDL.Nat64,
    'fiat_amount': IDL.Float64,
    'fiat_currency': IDL.Text,
    'payment_method': TopUpMethod,
    'payment_data': TopUpPaymentData,
    'status': TopUpStatus,
    'created_at': IDL.Nat64,
    'processed_at': IDL.Opt(IDL.Nat64),
    'reference_id': IDL.Text,
  })

  const CardDataInput = IDL.Record({
    'card_number': IDL.Text,
    'expiry_month': IDL.Text,
    'expiry_year': IDL.Text,
    'cvv': IDL.Text,
    'cardholder_name': IDL.Text,
  })

  const UserStats = IDL.Record({
    'total_sent': IDL.Nat64,
    'total_received': IDL.Nat64,
    'transaction_count': IDL.Nat64,
    'qr_codes_generated': IDL.Nat64,
    'total_topup': IDL.Nat64,
    'topup_count': IDL.Nat64,
    'current_balance': IDL.Nat64,
  })

  const SystemStats = IDL.Record({
    'total_users': IDL.Nat64,
    'total_transactions': IDL.Nat64,
    'total_qr_codes': IDL.Nat64,
    'cached_exchange_rates': IDL.Nat64,
    'completed_transactions': IDL.Nat64,
    'pending_transactions': IDL.Nat64,
    'failed_transactions': IDL.Nat64,
    'canister_balance': IDL.Nat64,
  })

  const TransactionSummary = IDL.Record({
    'id': IDL.Text,
    'amount_icp': IDL.Text,
    'amount_fiat': IDL.Text,
    'currency': IDL.Text,
    'status': IDL.Text,
    'timestamp': IDL.Nat64,
    'is_incoming': IDL.Bool,
    'counterpart': IDL.Principal,
  })

  const ExchangeRate = IDL.Record({
    'currency': IDL.Text,
    'rate': IDL.Float64,
    'timestamp': IDL.Nat64,
    'source': IDL.Text,
  })

  const QRCode = IDL.Record({
    'id': IDL.Text,
    'user_id': IDL.Principal,
    'fiat_amount': IDL.Float64,
    'fiat_currency': IDL.Text,
    'icp_amount': IDL.Nat64,
    'expire_time': IDL.Nat64,
    'created_at': IDL.Nat64,
    'is_used': IDL.Bool,
    'description': IDL.Opt(IDL.Text),
  })

  const QRDisplayInfo = IDL.Record({
    'id': IDL.Text,
    'fiat_amount': IDL.Float64,
    'fiat_currency': IDL.Text,
    'icp_amount': IDL.Nat64,
    'formatted_fiat': IDL.Text,
    'formatted_icp': IDL.Text,
    'time_remaining_seconds': IDL.Opt(IDL.Nat64),
    'is_expired': IDL.Bool,
    'is_used': IDL.Bool,
    'description': IDL.Opt(IDL.Text),
  })

  const TransactionStatus = IDL.Variant({
    'Pending': IDL.Null,
    'Processing': IDL.Null,
    'Completed': IDL.Null,
    'Failed': IDL.Null,
    'Expired': IDL.Null,
  })

  const Transaction = IDL.Record({
    'id': IDL.Text,
    'from': IDL.Principal,
    'to': IDL.Principal,
    'amount': IDL.Nat64,
    'fiat_currency': IDL.Text,
    'fiat_amount': IDL.Float64,
    'icp_amount': IDL.Nat64,
    'timestamp': IDL.Nat64,
    'status': TransactionStatus,
    'qr_id': IDL.Text,
    'transaction_hash': IDL.Opt(IDL.Text),
    'fee': IDL.Nat64,
  })

  const CurrencyStatInfo = IDL.Record({
  'currency': IDL.Text,
  'usage_count': IDL.Nat64,
  'total_fiat_volume': IDL.Float64,
  'total_icp_volume': IDL.Nat64,
})

const CurrencyCountryInfo = IDL.Record({
  'currency': IDL.Text,
  'transaction_count': IDL.Nat64,
})

const NetworkStats = IDL.Record({
  'active_countries': IDL.Nat64,
  'active_currencies': IDL.Nat64,
  'total_icp_volume': IDL.Nat64,
  'transactions_24h': IDL.Nat64,
  'transactions_7d': IDL.Nat64,
  'total_transactions': IDL.Nat64,
  'completed_transactions': IDL.Nat64,
  'pending_transactions': IDL.Nat64,
  'failed_transactions': IDL.Nat64,
  'total_users': IDL.Nat64,
  'currency_stats': IDL.Vec(CurrencyStatInfo),
  'currency_countries': IDL.Vec(CurrencyCountryInfo),
})

const EncryptedWalletIdentity = IDL.Record({
    'email': IDL.Text,
    'encrypted_secret_key': IDL.Text,
    'wallet_name': IDL.Text,
    'created_at': IDL.Nat64,
    'last_accessed': IDL.Nat64,
    'access_count': IDL.Nat64,
  })

  const WalletIdentityResult = IDL.Record({
    'secret_key_hex': IDL.Text,
    'wallet_name': IDL.Text,
    'created_at': IDL.Nat64,
    'last_accessed': IDL.Nat64,
    'access_count': IDL.Nat64,
  })

  const NetworkTransactionType = IDL.Variant({
    'Payment': IDL.Null,
    'Topup': IDL.Null,
    'Withdrawal': IDL.Null,
    'Fee': IDL.Null,
  })

  const NetworkTransactionStatus = IDL.Variant({
    'Pending': IDL.Null,
    'Processing': IDL.Null,
    'Completed': IDL.Null,
    'Failed': IDL.Null,
    'Expired': IDL.Null,
  })

  const NetworkTransaction = IDL.Record({
    'id': IDL.Text,
    'transaction_type': NetworkTransactionType,
    'from_user': IDL.Opt(IDL.Principal),
    'to_user': IDL.Opt(IDL.Principal),
    'amount': IDL.Nat64,
    'fiat_amount': IDL.Float64,
    'fiat_currency': IDL.Text,
    'icp_amount': IDL.Nat64,
    'timestamp': IDL.Nat64,
    'status': NetworkTransactionStatus,
    'reference_id': IDL.Text,
    'transaction_hash': IDL.Opt(IDL.Text),
    'fee': IDL.Opt(IDL.Nat64),
    'description': IDL.Text,
  })




  // Define all Result types
  const Result_User = IDL.Variant({ 'Ok': User, 'Err': IDL.Text })
  const Result_UserPreferences = IDL.Variant({ 'Ok': UserPreferences, 'Err': IDL.Text })
  const Result_UserSession = IDL.Variant({ 'Ok': UserSession, 'Err': IDL.Text })
  const Result_String = IDL.Variant({ 'Ok': IDL.Text, 'Err': IDL.Text })
  const Result_ExchangeRate = IDL.Variant({ 'Ok': ExchangeRate, 'Err': IDL.Text })
  const Result_QRCode = IDL.Variant({ 'Ok': QRCode, 'Err': IDL.Text })
  const Result_QRDisplayInfo = IDL.Variant({ 'Ok': QRDisplayInfo, 'Err': IDL.Text })
  const Result_TopUpTransaction = IDL.Variant({ 'Ok': TopUpTransaction, 'Err': IDL.Text })
  const Result_Transaction = IDL.Variant({ 'Ok': Transaction, 'Err': IDL.Text }) 
  const Result_WalletIdentity = IDL.Variant({ 'Ok': WalletIdentityResult, 'Err': IDL.Text })

  return IDL.Service({
    // User management
    'register_user': IDL.Func([IDL.Text, IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)], [Result_User], []),
    'get_user': IDL.Func([], [IDL.Opt(User)], ['query']),
    'get_user_stats': IDL.Func([], [IDL.Opt(UserStats)], ['query']),
    'get_system_stats': IDL.Func([], [SystemStats], ['query']),
    'get_user_transaction_summaries': IDL.Func([], [IDL.Vec(TransactionSummary)], ['query']),
    'get_supported_currencies_list': IDL.Func([], [IDL.Vec(IDL.Text)], ['query']),
    'register_user_by_email': IDL.Func([IDL.Text, IDL.Opt(IDL.Text), IDL.Text], [Result_User], []),
    'check_email_availability': IDL.Func([IDL.Text], [IDL.Bool], ['query']),
    'get_user_by_email': IDL.Func([IDL.Text], [IDL.Opt(User)], ['query']),
    'save_wallet_identity_by_email': IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text], [Result_String], []),
    'get_wallet_identity_by_email': IDL.Func([IDL.Text, IDL.Text], [Result_WalletIdentity], []),
    'check_wallet_identity_exists': IDL.Func([IDL.Text], [IDL.Bool], ['query']),
    'update_wallet_identity_password': IDL.Func([IDL.Text, IDL.Text, IDL.Text], [Result_String], []),
    'debug_get_all_users': IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Text, User))], ['query']),
    'debug_get_user_count': IDL.Func([], [IDL.Nat64], ['query']),
    
    // Exchange rates
    'fetch_exchange_rate': IDL.Func([IDL.Text], [Result_ExchangeRate], []),
    
    // QR code management
    'generate_qr': IDL.Func([IDL.Float64, IDL.Text, IDL.Opt(IDL.Text)], [Result_QRCode], []),
    'validate_qr_code': IDL.Func([IDL.Text], [Result_QRDisplayInfo], []),
    
    // Transaction management - FIX: Use Result_Transaction
    'process_payment': IDL.Func([IDL.Text, IDL.Opt(IDL.Text)], [Result_Transaction], []),
    
    // Balance & Top-up Management
    'get_user_balance': IDL.Func([], [IDL.Opt(UserBalance)], ['query']),
    'create_qris_topup': IDL.Func([IDL.Float64, IDL.Text], [Result_TopUpTransaction], []),
    'create_card_topup': IDL.Func([IDL.Float64, IDL.Text, CardDataInput, IDL.Bool], [Result_TopUpTransaction], []),
    'claim_qris_payment': IDL.Func([IDL.Text], [Result_TopUpTransaction], []),
    'get_topup_transaction': IDL.Func([IDL.Text], [IDL.Opt(TopUpTransaction)], ['query']),
    'get_user_topup_history': IDL.Func([], [IDL.Vec(TopUpTransaction)], ['query']),

    'get_network_stats': IDL.Func([], [NetworkStats], ['query']),
    'get_all_network_transactions': IDL.Func([], [IDL.Vec(NetworkTransaction)], ['query']),
    'get_all_transactions': IDL.Func([], [IDL.Vec(Transaction)], ['query']),

    // Add new balance history methods
    'get_user_balance_history': IDL.Func([], [IDL.Vec(BalanceChangeLog)], ['query']),
    'get_all_balance_changes': IDL.Func([], [IDL.Vec(BalanceChangeLog)], ['query']),
    
    // Add QR usage history methods
    'get_qr_usage_history': IDL.Func([IDL.Text], [IDL.Vec(QRUsageLog)], ['query']),
    'get_all_qr_usage_logs': IDL.Func([], [IDL.Vec(QRUsageLog)], ['query']),
    
    // Add user preferences methods
    'update_user_preferences': IDL.Func([IDL.Opt(IDL.Text), IDL.Opt(NotificationSettings), IDL.Opt(IDL.Text), IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)], [Result_UserPreferences], []),
    'get_user_preferences': IDL.Func([], [IDL.Opt(UserPreferences)], ['query']),
    
    // Add session methods
    'create_user_session': IDL.Func([IDL.Text, IDL.Text], [Result_UserSession], []),
    'update_session_activity': IDL.Func([IDL.Text], [Result_UserSession], []),
    'end_user_session': IDL.Func([IDL.Text], [Result_String], []),
    'get_active_sessions': IDL.Func([], [IDL.Vec(UserSession)], ['query']),
  })
}

export const createActor = (canisterId, options = {}) => {
  const host = options.host || import.meta.env.VITE_IC_HOST || 'http://localhost:4943'
  const agent = options.agent || new HttpAgent({
    host,
    identity: options.identity
  })

  // Fetch root key for local development with better error handling
  if (import.meta.env.VITE_DFX_NETWORK === 'local') {
    agent.fetchRootKey().catch(err => {
      console.warn('Unable to fetch root key:', err)
      // Continue anyway - sometimes this works even without root key
    })
  }

  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
    ...options
  })
}

export class PaymentBackendService {
  constructor(actor) {
    this.actor = actor
  }

  async registerUser(walletAddress, username, email) {
    try {
      const result = await this.actor.register_user(
        walletAddress,
        username ? [username] : [],
        email ? [email] : []
      )
      return result
    } catch (error) {
      console.error('Registration service error:', error)

      // Handle specific certificate errors
      if (error.message.includes('certificate') || error.message.includes('signature')) {
        throw new Error('Connection failed. Please ensure DFX is running and try again.')
      }

      throw new Error(`Registration failed: ${error.message}`)
    }
  }

  async debugGetAllUsers() {
    try {
      const result = await this.actor.debug_get_all_users()
      console.log('🔍 All users in canister:', result)
      return result
    } catch (error) {
      console.error('Debug get all users error:', error)
      return []
    }
  }

  async debugGetUserCount() {
    try {
      const result = await this.actor.debug_get_user_count()
      console.log('📊 Total user count:', result)
      return result
    } catch (error) {
      console.error('Debug get user count error:', error)
      return 0
    }
  }

  async registerUserByEmail(email, username, walletAddress) {
    try {
      return await this.actor.register_user_by_email(email, username ? [username] : [], walletAddress)
    } catch (error) {
      console.error('Register user by email error:', error)
      throw error
    }
  }

  async checkEmailAvailability(email) {
    try {
      return await this.actor.check_email_availability(email)
    } catch (error) {
      console.error('Check email availability error:', error)
      return false
    }
  }

  async saveWalletIdentityByEmail(email, secretKeyHex, password, walletName) {
    try {
      console.log('🔐 Saving wallet identity for email:', email)
      const result = await this.actor.save_wallet_identity_by_email(email, secretKeyHex, password, walletName)
      console.log('💾 Save wallet result:', result)
      return result
    } catch (error) {
      console.error('Save wallet identity error:', error)
      return { Err: error.message }
    }
  }

  async getWalletIdentityByEmail(email, password) {
    try {
      console.log('🔓 Getting wallet identity for email:', email)
      const result = await this.actor.get_wallet_identity_by_email(email, password)
      console.log('🔍 Get wallet result:', result)
      return result
    } catch (error) {
      console.error('Get wallet identity error:', error)
      return { Err: error.message }
    }
  }

  async checkWalletIdentityExists(email) {
    try {
      console.log('🔍 Checking wallet identity exists for:', email)
      const result = await this.actor.check_wallet_identity_exists(email)
      console.log('✅ Wallet exists check result:', result)
      return result
    } catch (error) {
      console.error('Check wallet identity exists error:', error)
      return false
    }
  }

  async updateWalletIdentityPassword(email, oldPassword, newPassword) {
    try {
      console.log('🔄 Updating wallet password for email:', email)
      const result = await this.actor.update_wallet_identity_password(email, oldPassword, newPassword)
      console.log('🔐 Update password result:', result)
      return result
    } catch (error) {
      console.error('Update wallet password error:', error)
      return { Err: error.message }
    }
  }

  async getUserByEmail(email) {
    try {
      console.log('👤 Getting user by email:', email)
      const result = await this.actor.get_user_by_email(email)
      console.log('📋 Get user by email result:', result)
      
      // FIXED: Return null instead of empty array if no user found
      if (!result || (Array.isArray(result) && result.length === 0)) {
        return null
      }
      
      return result
    } catch (error) {
      console.error('Get user by email error:', error)
      return null
    }
  }

  async getUser() {
    try {
      const result = await this.actor.get_user()
      return result.length > 0 ? result[0] : null
    } catch (error) {
      console.error('Failed to get user:', error)

      // Handle specific certificate errors
      if (error.message.includes('certificate') || error.message.includes('signature')) {
        throw new Error('Connection failed. Please ensure DFX is running and try again.')
      }

      return null
    }
  }

  async getUserStats() {
    try {
      const result = await this.actor.get_user_stats()
      return result.length > 0 ? result[0] : null
    } catch (error) {
      console.error('Failed to get user stats:', error)
      return null
    }
  }

  async getSystemStats() {
    try {
      return await this.actor.get_system_stats()
    } catch (error) {
      console.error('Failed to get system stats:', error)
      return null
    }
  }

  async getUserTransactionSummaries() {
    try {
      return await this.actor.get_user_transaction_summaries()
    } catch (error) {
      console.error('Failed to get transaction summaries:', error)
      return []
    }
  }

  async getSupportedCurrencies() {
    try {
      return await this.actor.get_supported_currencies_list()
    } catch (error) {
      console.error('Failed to get supported currencies:', error)
      return ['USD', 'EUR', 'GBP', 'JPY', 'IDR', 'SGD']
    }
  }

  async fetchExchangeRate(currency) {
    try {
      return await this.actor.fetch_exchange_rate(currency)
    } catch (error) {
      console.error('Exchange rate fetch error:', error)
      return { Err: `Exchange rate fetch failed: ${error.message}` }
    }
  }

  async generateQR(fiatAmount, currency, description) {
    try {
      return await this.actor.generate_qr(
        fiatAmount,
        currency,
        description ? [description] : []
      )
    } catch (error) {
      console.error('QR generation error:', error)
      return { Err: `QR generation failed: ${error.message}` }
    }
  }

  async validateQRCode(qrId) {
    try {
      return await this.actor.validate_qr_code(qrId)
    } catch (error) {
      console.error('QR validation error:', error)
      return { Err: `QR validation failed: ${error.message}` }
    }
  }

  async processPayment(qrId, transactionHash) {
    try {
      console.log('Processing payment for QR:', qrId)
      const result = await this.actor.process_payment(
        qrId,
        transactionHash ? [transactionHash] : []
      )
      console.log('Payment result:', result)
      return result
    } catch (error) {
      console.error('Payment processing error:', error)
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      })
      return { Err: `Payment processing failed: ${error.message}` }
    }
  }

  async getUserTopupHistory() {
    try {
      return await this.actor.get_user_topup_history()
    } catch (error) {
      console.error('Get topup history error:', error)
      return []
    }
  }

  async getUserBalance() {
    try {
      return await this.actor.get_user_balance()
    } catch (error) {
      console.error('Get balance error:', error)
      return null
    }
  }

  async createQRISTopup(amount, currency) {
    try {
      console.log('Creating QRIS topup:', { amount, currency })
      const result = await this.actor.create_qris_topup(amount, currency)
      console.log('Raw QRIS result:', result)
      return result
    } catch (error) {
      console.error('QRIS topup error details:', error)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      return { Err: error.message }
    }
  }

  async createCardTopup(amount, currency, cardData, isCredit) {
    try {
      return await this.actor.create_card_topup(
        amount,
        currency,
        cardData,
        isCredit
      )
    } catch (error) {
      console.error('Card topup error:', error)
      return { Err: error.message }
    }
  }

  async getNetworkStats() {
  try {
    return await this.actor.get_network_stats()
  } catch (error) {
    console.error('Get network stats error:', error)
    return null
  }
}

  async claimQRISPayment(topupId) {
    try {
      return await this.actor.claim_qris_payment(topupId)
    } catch (error) {
      console.error('Claim QRIS error:', error)
      return { Err: error.message }
    }
  }

  async getTopupTransaction(topupId) {
    try {
      return await this.actor.get_topup_transaction(topupId)
    } catch (error) {
      console.error('Get topup transaction error:', error)
      return null
    }
  }

  async getAllNetworkTransactions() {
    try {
      const result = await this.actor.get_all_network_transactions()
      console.log('🌐 Network transactions fetched:', result?.length || 0)
      return result || []
    } catch (error) {
      console.error('Get all network transactions error:', error)
      return []
    }
  }

  async getAllTransactions() {
  try {
    const result = await this.actor.get_all_transactions()
    return result
  } catch (error) {
    console.error('Get all transactions error:', error)
    return []
  }
}

  // Add new balance history methods
  async getUserBalanceHistory() {
    try {
      const result = await this.actor.get_user_balance_history()
      return result || []
    } catch (error) {
      console.error('Get balance history error:', error)
      return []
    }
  }

  async getAllBalanceChanges() {
    try {
      const result = await this.actor.get_all_balance_changes()
      return result || []
    } catch (error) {
      console.error('Get all balance changes error:', error)
      return []
    }
  }

  // Add QR usage history methods
  async getQRUsageHistory(qrId) {
    try {
      const result = await this.actor.get_qr_usage_history(qrId)
      return result || []
    } catch (error) {
      console.error('Get QR usage history error:', error)
      return []
    }
  }

  async getAllQRUsageLogs() {
    try {
      const result = await this.actor.get_all_qr_usage_logs()
      return result || []
    } catch (error) {
      console.error('Get all QR usage logs error:', error)
      return []
    }
  }

  // Add user preferences methods
  async updateUserPreferences(preferences) {
    try {
      const result = await this.actor.update_user_preferences(
        preferences.preferred_currency ? [preferences.preferred_currency] : [],
        preferences.notification_settings ? [preferences.notification_settings] : [],
        preferences.ui_theme ? [preferences.ui_theme] : [],
        preferences.language ? [preferences.language] : [],
        preferences.timezone ? [preferences.timezone] : []
      )
      return result
    } catch (error) {
      console.error('Update user preferences error:', error)
      return { Err: error.message }
    }
  }

  async getUserPreferences() {
    try {
      const result = await this.actor.get_user_preferences()
      return result.length > 0 ? result[0] : null
    } catch (error) {
      console.error('Get user preferences error:', error)
      return null
    }
  }

  // Add session methods
  async createUserSession(ipAddress, userAgent) {
    try {
      const result = await this.actor.create_user_session(ipAddress, userAgent)
      return result
    } catch (error) {
      console.error('Create user session error:', error)
      return { Err: error.message }
    }
  }

  async updateSessionActivity(sessionId) {
    try {
      const result = await this.actor.update_session_activity(sessionId)
      return result
    } catch (error) {
      console.error('Update session activity error:', error)
      return { Err: error.message }
    }
  }

  async endUserSession(sessionId) {
    try {
      const result = await this.actor.end_user_session(sessionId)
      return result
    } catch (error) {
      console.error('End user session error:', error)
      return { Err: error.message }
    }
  }

  async getActiveSessions() {
    try {
      const result = await this.actor.get_active_sessions()
      return result || []
    } catch (error) {
      console.error('Get active sessions error:', error)
      return []
    }
  }
}
