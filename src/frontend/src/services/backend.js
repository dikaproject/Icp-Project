import { Actor, HttpAgent } from '@dfinity/agent'

// Menggunakan IDL yang sudah ada dari declarations
export const idlFactory = ({ IDL }) => {
  const User = IDL.Record({
    'id': IDL.Principal,
    'wallet_address': IDL.Text,
    'created_at': IDL.Nat64,
    'username': IDL.Opt(IDL.Text),
    'email': IDL.Opt(IDL.Text),
  })

  const UserStats = IDL.Record({
    'total_sent': IDL.Nat64,
    'total_received': IDL.Nat64,
    'transaction_count': IDL.Nat64,
    'qr_codes_generated': IDL.Nat64,
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

  const Result = IDL.Variant({ 'Ok': User, 'Err': IDL.Text })
  const Result_1 = IDL.Variant({ 'Ok': ExchangeRate, 'Err': IDL.Text })
  const Result_2 = IDL.Variant({ 'Ok': QRCode, 'Err': IDL.Text })
  const Result_4 = IDL.Variant({ 'Ok': QRDisplayInfo, 'Err': IDL.Text })

  return IDL.Service({
    'register_user': IDL.Func([IDL.Text, IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)], [Result], []),
    'get_user': IDL.Func([], [IDL.Opt(User)], ['query']),
    'get_user_stats': IDL.Func([], [IDL.Opt(UserStats)], ['query']),
    'get_system_stats': IDL.Func([], [SystemStats], ['query']),
    'get_user_transaction_summaries': IDL.Func([], [IDL.Vec(TransactionSummary)], ['query']),
    'get_supported_currencies_list': IDL.Func([], [IDL.Vec(IDL.Text)], ['query']),
    'fetch_exchange_rate': IDL.Func([IDL.Text], [Result_1], []),
    'generate_qr': IDL.Func([IDL.Float64, IDL.Text, IDL.Opt(IDL.Text)], [Result_2], []),
    'validate_qr_code': IDL.Func([IDL.Text], [Result_4], []),
    'process_payment': IDL.Func([IDL.Text, IDL.Opt(IDL.Text)], [Result], []),
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
      return await this.actor.process_payment(
        qrId, 
        transactionHash ? [transactionHash] : []
      )
    } catch (error) {
      console.error('Payment processing error:', error)
      return { Err: `Payment processing failed: ${error.message}` }
    }
  }
}
