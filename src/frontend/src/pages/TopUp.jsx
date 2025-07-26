import React, { useState, useEffect } from 'react'
import { useICP } from '../contexts/ICPContext'
import QRCode from 'react-qr-code'
import Flag from 'react-world-flags'
import { 
  CreditCard, 
  QrCode, 
  Wallet, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Copy,
  ExternalLink,
  Download,
  RefreshCw,
  Construction,
  Calendar,
  Zap,
  ArrowRight,
  Eye,
  EyeOff,
  Timer,
  Receipt,
  ChevronDown,
  Loader
} from 'lucide-react'

const TopUp = () => {
  const { backend, isAuthenticated, user } = useICP()
  const [activeTab, setActiveTab] = useState('qris')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('IDR')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentTopup, setCurrentTopup] = useState(null)
  const [balance, setBalance] = useState(null)
  const [qrError, setQrError] = useState(false)
  const [showBalance, setShowBalance] = useState(true)

  // Currency list dengan country codes untuk flags
  const currencies = [
    { 
      code: 'IDR', 
      symbol: 'Rp', 
      name: 'Indonesian Rupiah',
      country: 'Indonesia',
      countryCode: 'ID'
    },
    { 
      code: 'USD', 
      symbol: '$', 
      name: 'US Dollar',
      country: 'United States',
      countryCode: 'US'
    },
    { 
      code: 'EUR', 
      symbol: '€', 
      name: 'Euro',
      country: 'European Union',
      countryCode: 'EU'
    },
    { 
      code: 'JPY', 
      symbol: '¥', 
      name: 'Japanese Yen',
      country: 'Japan',
      countryCode: 'JP'
    }
  ]

  // Get currency info helper
  const getCurrencyInfo = (code) => {
    return currencies.find(curr => curr.code === code) || currencies[0]
  }

  // Flag component with styling
  const FlagIcon = ({ countryCode, size = 24, className = '' }) => (
    <Flag 
      code={countryCode} 
      style={{ 
        width: size, 
        height: size * 0.67, 
        borderRadius: '6px',
        objectFit: 'cover',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}
      className={className}
    />
  )

  useEffect(() => {
    if (isAuthenticated && backend) {
      fetchBalance()
    }
  }, [isAuthenticated, backend])

  const fetchBalance = async () => {
    try {
      const userBalance = await backend.getUserBalance()
      setBalance(userBalance && userBalance.length > 0 ? userBalance[0] : null)
    } catch (err) {
      console.error('Error fetching balance:', err)
    }
  }

  // Helper function untuk mengkonversi BigInt
  const convertBigIntToString = (obj) => {
    if (typeof obj === 'bigint') {
      return obj.toString()
    }
    if (Array.isArray(obj)) {
      return obj.map(convertBigIntToString)
    }
    if (obj && typeof obj === 'object') {
      const converted = {}
      for (const [key, value] of Object.entries(obj)) {
        converted[key] = convertBigIntToString(value)
      }
      return converted
    }
    return obj
  }

  // Helper function untuk extract QRIS data
  const extractQRISData = (paymentData) => {
    if (!paymentData || !paymentData.qris_data) return null
    
    if (Array.isArray(paymentData.qris_data) && paymentData.qris_data.length > 0) {
      return paymentData.qris_data[0]
    }
    
    if (typeof paymentData.qris_data === 'object' && paymentData.qris_data.qr_code_url) {
      return paymentData.qris_data
    }
    
    return null
  }

  const handleQRISTopup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    setQrError(false)
    setCurrentTopup(null)

    try {
      console.log('Sending QRIS request:', { amount: parseFloat(amount), currency })
      const result = await backend.createQRISTopup(parseFloat(amount), currency)
      console.log('QRIS response received:', result)
      
      if (result.Ok) {
        const convertedTopup = convertBigIntToString(result.Ok)
        console.log('Converted topup data:', convertedTopup)
        
        setCurrentTopup(convertedTopup)
        setSuccess('QRIS payment created successfully!')
        setAmount('')
      } else {
        console.error('QRIS creation failed:', result.Err)
        setError(result.Err || 'Failed to create QRIS payment')
      }
    } catch (err) {
      console.error('QRIS topup exception:', err)
      setError(err.message || 'Failed to create QRIS payment')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setSuccess('Copied to clipboard!')
    setTimeout(() => setSuccess(''), 2000)
  }

  const getStatusColor = (status) => {
    const statusValue = status?.Pending ? 'Pending' : 
                      status?.Completed ? 'Completed' : 
                      status?.Processing ? 'Processing' : 
                      status?.Failed ? 'Failed' : 
                      status?.Expired ? 'Expired' : 'Unknown'
    
    switch (statusValue) {
      case 'Completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'Processing': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'Pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'Failed': return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      case 'Expired': return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const getStatusText = (status) => {
    if (status?.Pending !== undefined) return 'Pending'
    if (status?.Completed !== undefined) return 'Completed'
    if (status?.Processing !== undefined) return 'Processing'
    if (status?.Failed !== undefined) return 'Failed'
    if (status?.Expired !== undefined) return 'Expired'
    return 'Unknown'
  }

  const formatBalance = (balance) => {
    if (!balance) return '0.00000000 ICP'
    return balance.formatted_balance
  }

  const formatAmount = (amount) => {
    if (typeof amount === 'string') return parseFloat(amount)
    if (typeof amount === 'bigint') return Number(amount)
    return amount
  }

  const formatDate = (timestamp) => {
    try {
      const date = new Date(Number(timestamp) / 1000000)
      return date.toLocaleString()
    } catch (err) {
      return 'Invalid date'
    }
  }

  // QR Code Component dengan Error Handling
  const QRCodeWithFallback = ({ value, size = 200 }) => {
    const [hasError, setHasError] = useState(false)

    if (hasError || qrError) {
      return (
        <div className="flex flex-col items-center justify-center bg-[#262840] rounded-2xl p-8 border border-[#23253B]" style={{ width: size, height: size }}>
          <QrCode className="w-16 h-16 text-[#B3B3C2] mb-4" />
          <p className="text-[#B3B3C2] text-sm text-center mb-4">
            QR Code failed to load
          </p>
          <button
            onClick={() => setHasError(false)}
            className="flex items-center space-x-2 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] text-white px-4 py-2 rounded-xl text-sm hover:shadow-lg transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      )
    }

    return (
      <div className="bg-white p-4 rounded-2xl shadow-xl">
        <QRCode
          value={value}
          size={size}
          level="M"
          includeMargin={true}
          onError={() => setHasError(true)}
          style={{ 
            height: "auto", 
            maxWidth: "100%", 
            width: `${size}px`,
            margin: "0 auto"
          }}
        />
      </div>
    )
  }

  // Coming Soon Component
  const ComingSoonTab = ({ icon: Icon, title, description }) => (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-[#262840] rounded-3xl flex items-center justify-center mx-auto mb-8 border border-[#23253B]">
        <Construction className="w-10 h-10 text-[#B3B3C2]" />
      </div>
      <h3 className="text-2xl font-bold text-[#F5F6FA] mb-4">Coming Soon</h3>
      <p className="text-[#B3B3C2] mb-8 leading-relaxed max-w-md mx-auto">{description}</p>
      <div className="inline-flex items-center space-x-3 bg-blue-500/10 text-blue-400 px-6 py-4 rounded-2xl border border-blue-500/20">
        <Calendar className="w-5 h-5" />
        <span className="font-medium">Available in next update</span>
      </div>
    </div>
  )

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#181A20] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-purple-500/25">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-[#F5F6FA] mb-4">Authentication Required</h2>
          <p className="text-[#B3B3C2] mb-8 leading-relaxed">Please connect your wallet to access top-up features</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#181A20] p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-[#F5F6FA] mb-2">Top Up Balance</h1>
            <p className="text-[#B3B3C2] text-lg">Add funds to your Arta Wallet securely</p>
          </div>
          <button
            onClick={fetchBalance}
            className="inline-flex items-center space-x-3 px-6 py-3 bg-[#222334] border border-[#23253B] rounded-2xl hover:bg-[#262840] transition-all duration-200 group"
          >
            <RefreshCw className="w-5 h-5 text-[#B3B3C2] group-hover:text-[#F5F6FA] transition-colors" />
            <span className="text-[#B3B3C2] group-hover:text-[#F5F6FA] font-medium transition-colors">Refresh Balance</span>
          </button>
        </div>

        {/* Current Balance Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#262840] via-[#222334] to-[#262840] rounded-3xl p-8 border border-[#23253B] shadow-2xl shadow-black/20">
          {/* Gradient Orbs */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#885FFF]/20 to-[#59C1FF]/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#59C1FF]/20 to-[#885FFF]/20 rounded-full blur-3xl -ml-16 -mb-16"></div>
          
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <h2 className="text-xl font-semibold text-[#B3B3C2]">Current Balance</h2>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all duration-200 group"
                >
                  {showBalance ? (
                    <Eye className="w-5 h-5 text-[#B3B3C2] group-hover:text-[#F5F6FA] transition-colors" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-[#B3B3C2] group-hover:text-[#F5F6FA] transition-colors" />
                  )}
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-5xl font-bold text-[#F5F6FA] mb-2">
                  {showBalance ? formatBalance(balance) : '••••••••'}
                </p>
                <p className="text-[#B3B3C2]">
                  Last updated: {balance ? new Date(Number(balance.last_updated) / 1000000).toLocaleString() : 'Never'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/25">
                  <Wallet className="w-10 h-10 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] rounded-2xl blur-xl opacity-50"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-[#222334] rounded-3xl border border-[#23253B] overflow-hidden shadow-2xl shadow-black/20">
          {/* Tabs */}
          <div className="border-b border-[#23253B] p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
              <button
                onClick={() => setActiveTab('qris')}
                className={`flex items-center justify-center space-x-3 px-4 lg:px-6 py-3 lg:py-4 rounded-2xl font-semibold transition-all duration-300 text-sm lg:text-base ${
                  activeTab === 'qris'
                    ? 'bg-gradient-to-r from-[#885FFF] to-[#59C1FF] text-white shadow-lg shadow-purple-500/25 scale-105'
                    : 'bg-[#262840] border border-[#23253B] text-[#B3B3C2] hover:text-[#F5F6FA] hover:bg-[#363850] hover:border-[#885FFF]/30 hover:scale-105'
                }`}
              >
                <QrCode className="w-4 h-4 lg:w-5 lg:h-5" />
                <span>QRIS Payment</span>
                {activeTab === 'qris' && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('credit')}
                className={`flex items-center justify-center space-x-3 px-4 lg:px-6 py-3 lg:py-4 rounded-2xl font-semibold transition-all duration-300 text-sm lg:text-base relative ${
                  activeTab === 'credit'
                    ? 'bg-gradient-to-r from-[#885FFF] to-[#59C1FF] text-white shadow-lg shadow-purple-500/25 scale-105'
                    : 'bg-[#262840] border border-[#23253B] text-[#B3B3C2] hover:text-[#F5F6FA] hover:bg-[#363850] hover:border-[#885FFF]/30 hover:scale-105'
                }`}
              >
                <CreditCard className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="hidden sm:inline">Credit Card</span>
                <span className="sm:hidden">Card</span>
                <span className="px-2 py-1 text-xs bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 animate-pulse">
                  Soon
                </span>
              </button>
              
              <button
                onClick={() => setActiveTab('wallet')}
                className={`flex items-center justify-center space-x-3 px-4 lg:px-6 py-3 lg:py-4 rounded-2xl font-semibold transition-all duration-300 text-sm lg:text-base relative ${
                  activeTab === 'wallet'
                    ? 'bg-gradient-to-r from-[#885FFF] to-[#59C1FF] text-white shadow-lg shadow-purple-500/25 scale-105'
                    : 'bg-[#262840] border border-[#23253B] text-[#B3B3C2] hover:text-[#F5F6FA] hover:bg-[#363850] hover:border-[#885FFF]/30 hover:scale-105'
                }`}
              >
                <Wallet className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="hidden sm:inline">Web3 Wallet</span>
                <span className="sm:hidden">Web3</span>
                <span className="px-2 py-1 text-xs bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 animate-pulse">
                  Soon
                </span>
              </button>
            </div>
          </div>

          <div className="p-8">
            {/* QRIS Tab - Active */}
            {activeTab === 'qris' && (
              <div className="space-y-8">
                {/* Amount Input */}
                <div>
                  <label className="block text-lg font-semibold text-[#F5F6FA] mb-6">
                    Enter Amount
                  </label>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Amount Input */}
                    <div className="space-y-4">
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-[#B3B3C2] font-semibold text-lg z-10">
                          {getCurrencyInfo(currency).symbol}
                        </span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-12 pr-6 py-6 bg-[#181A20] border border-[#23253B] rounded-2xl focus:ring-2 focus:ring-[#885FFF] focus:border-[#885FFF] transition-all text-[#F5F6FA] placeholder-[#B3B3C2] text-2xl font-bold"
                          step={currency === 'JPY' || currency === 'IDR' ? '1' : '0.01'}
                          min="0"
                        />
                      </div>
                    </div>
                    
                    {/* Currency Selector */}
                    <div className="space-y-4">
                      <div className="relative group">
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full px-6 py-6 bg-[#181A20] border border-[#23253B] rounded-2xl focus:ring-2 focus:ring-[#885FFF] focus:border-[#885FFF] transition-all text-[#F5F6FA] text-lg font-semibold appearance-none cursor-pointer hover:bg-[#1A1C22] hover:border-[#885FFF]/50 pr-16"
                        >
                          {currencies.map(curr => (
                            <option key={curr.code} value={curr.code} className="bg-[#181A20] text-[#F5F6FA] py-3 px-4">
                              {curr.code} - {curr.name} ({curr.symbol})
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-6 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <ChevronDown className="w-6 h-6 text-[#B3B3C2] transition-transform group-hover:rotate-180" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Currency Preview */}
                  {amount && (
                    <div className="mt-6 p-6 bg-gradient-to-r from-[#885FFF]/10 to-[#59C1FF]/10 border border-[#885FFF]/20 rounded-2xl">
                      <div className="flex items-center space-x-4">
                        <FlagIcon 
                          countryCode={getCurrencyInfo(currency).countryCode} 
                          size={32} 
                        />
                        <div>
                          <div className="text-2xl font-bold text-[#F5F6FA]">
                            {getCurrencyInfo(currency).symbol}{parseFloat(amount || 0).toLocaleString()} {currency}
                          </div>
                          <div className="text-[#B3B3C2]">
                            {getCurrencyInfo(currency).country}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Generate Button */}
                <form onSubmit={handleQRISTopup}>
                  <button
                    type="submit"
                    disabled={loading || !amount}
                    className="w-full group relative overflow-hidden bg-gradient-to-r from-[#885FFF] to-[#59C1FF] text-white rounded-2xl py-6 px-8 font-bold text-lg shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-3">
                        <Loader className="w-6 h-6 animate-spin" />
                        <span>Generating QRIS...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-3">
                        <Zap className="w-6 h-6" />
                        <span>Generate QRIS Payment</span>
                        <ArrowRight className="w-6 h-6" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  </button>
                </form>

                {/* QRIS Result */}
                {currentTopup && activeTab === 'qris' && (
                  <div className="bg-[#181A20] rounded-3xl p-8 border border-[#23253B] space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-[#F5F6FA]">QRIS Payment Ready</h3>
                      <span className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium border ${getStatusColor(currentTopup.status)}`}>
                        <Timer className="w-4 h-4" />
                        <span>{getStatusText(currentTopup.status)}</span>
                      </span>
                    </div>
                    
                    {(() => {
                      const qrisData = extractQRISData(currentTopup.payment_data)
                      
                      if (qrisData) {
                        return (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* QR Code Display */}
                            <div className="space-y-6">
                              <div className="text-center bg-[#262840] p-8 rounded-3xl border border-[#23253B]">
                                <div className="mb-6">
                                  <QRCodeWithFallback 
                                    value={qrisData.qr_code_url}
                                    size={240}
                                  />
                                </div>
                                <h4 className="text-xl font-bold text-[#F5F6FA] mb-3">
                                  Scan to Pay
                                </h4>
                                <p className="text-[#B3B3C2] mb-6 leading-relaxed">
                                  Use any QRIS-enabled app to scan this code and complete your payment
                                </p>
                                
                                {/* QR Actions */}
                                <div className="flex justify-center space-x-4">
                                  <button
                                    onClick={() => copyToClipboard(qrisData.qr_code_url)}
                                    className="flex items-center space-x-2 bg-[#222334] hover:bg-[#363850] text-[#F5F6FA] px-6 py-3 rounded-2xl transition-all duration-200 border border-[#23253B] hover:border-[#885FFF]/50"
                                  >
                                    <Copy className="w-5 h-5" />
                                    <span>Copy Link</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Payment Details */}
                            <div className="space-y-6">
                              <div className="bg-[#262840] p-6 rounded-2xl border border-[#23253B]">
                                <h4 className="text-xl font-bold text-[#F5F6FA] mb-6 flex items-center space-x-3">
                                  <Receipt className="w-6 h-6 text-[#885FFF]" />
                                  <span>Payment Details</span>
                                </h4>
                                
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between p-4 bg-[#181A20] rounded-2xl border border-[#23253B]">
                                    <div className="flex items-center space-x-3">
                                      <FlagIcon 
                                        countryCode={getCurrencyInfo(currentTopup.fiat_currency).countryCode} 
                                        size={24} 
                                      />
                                      <span className="text-[#B3B3C2]">Amount:</span>
                                    </div>
                                    <span className="text-2xl font-bold text-[#F5F6FA]">
                                      {formatAmount(currentTopup.fiat_amount).toLocaleString()} {currentTopup.fiat_currency}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center justify-between p-4 bg-[#181A20] rounded-2xl border border-[#23253B]">
                                    <span className="text-[#B3B3C2]">ICP Amount:</span>
                                    <span className="text-lg font-bold text-[#885FFF]">
                                      {(formatAmount(currentTopup.amount) / 100000000).toFixed(8)} ICP
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center justify-between p-4 bg-[#181A20] rounded-2xl border border-[#23253B]">
                                    <span className="text-[#B3B3C2]">Merchant ID:</span>
                                    <span className="font-mono text-[#F5F6FA] text-sm">{qrisData.merchant_id}</span>
                                  </div>
                                  
                                  <div className="flex items-center justify-between p-4 bg-[#181A20] rounded-2xl border border-[#23253B]">
                                    <span className="text-[#B3B3C2]">Transaction ID:</span>
                                    <span className="font-mono text-[#F5F6FA] text-sm">{currentTopup.id}</span>
                                  </div>
                                  
                                  <div className="flex items-center justify-between p-4 bg-[#181A20] rounded-2xl border border-[#23253B]">
                                    <span className="text-[#B3B3C2]">Created:</span>
                                    <span className="text-[#F5F6FA]">{formatDate(currentTopup.created_at)}</span>
                                  </div>
                                  
                                  <div className="flex items-center justify-between p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                                    <span className="text-rose-400 flex items-center space-x-2">
                                      <Clock className="w-4 h-4" />
                                      <span>Expires:</span>
                                    </span>
                                    <span className="text-rose-400 font-semibold">{formatDate(qrisData.expire_time)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      } else {
                        return (
                          <div className="text-center p-12 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
                            <AlertCircle className="w-16 h-16 text-rose-400 mx-auto mb-6" />
                            <h4 className="text-2xl font-bold text-rose-400 mb-3">QRIS Data Missing</h4>
                            <p className="text-rose-300 leading-relaxed">
                              The payment was created but QRIS data is missing. Please try generating a new payment.
                            </p>
                          </div>
                        )
                      }
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Credit Card Tab - Coming Soon */}
            {activeTab === 'credit' && (
              <ComingSoonTab
                icon={CreditCard}
                title="Credit Card Payment"
                description="Credit card top-up integration is currently in development. You'll be able to add funds using major credit cards securely and instantly."
              />
            )}

            {/* Web3 Wallet Tab - Coming Soon */}
            {activeTab === 'wallet' && (
              <ComingSoonTab
                icon={Wallet}
                title="Web3 Wallet Integration"
                description="Direct wallet integration for seamless crypto-to-ICP conversion. Connect your favorite Web3 wallet to top up instantly with minimal fees."
              />
            )}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 flex items-start space-x-4">
            <AlertCircle className="h-6 w-6 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-rose-400 font-semibold text-lg">Error</h3>
              <p className="text-rose-300 mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex items-start space-x-4">
            <CheckCircle className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-emerald-400 font-semibold text-lg">Success</h3>
              <p className="text-emerald-300 mt-1">{success}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TopUp