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
  Calendar
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

  // UPDATED: Currency list dengan country codes untuk flags
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
        borderRadius: '3px',
        objectFit: 'cover',
        border: '1px solid rgba(0,0,0,0.1)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
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
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'Processing': return 'bg-blue-100 text-blue-800'
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Failed': return 'bg-red-100 text-red-800'
      case 'Expired': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
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
        <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg p-8" style={{ width: size, height: size }}>
          <QrCode className="w-16 h-16 text-gray-400 mb-4" />
          <p className="text-gray-500 text-sm text-center mb-4">
            QR Code failed to load
          </p>
          <button
            onClick={() => setHasError(false)}
            className="flex items-center space-x-1 bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      )
    }

    return (
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
    )
  }

  // Coming Soon Component
  const ComingSoonTab = ({ icon: Icon, title, description }) => (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
        <Construction className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-medium">Available in next update</span>
      </div>
    </div>
  )

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access top-up features</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Top Up Balance</h1>
          <p className="text-gray-600">Add funds to your ICP Payment account</p>
        </div>

        {/* Current Balance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Current Balance</h2>
              <p className="text-3xl font-bold text-indigo-600">{formatBalance(balance)}</p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-lg">
              <Wallet className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('qris')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'qris'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <QrCode className="w-5 h-5 inline mr-2" />
                QRIS
              </button>
              <button
                onClick={() => setActiveTab('credit')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'credit'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <CreditCard className="w-5 h-5 inline mr-2" />
                Credit Card
                <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  Soon
                </span>
              </button>
              <button
                onClick={() => setActiveTab('wallet')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'wallet'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Wallet className="w-5 h-5 inline mr-2" />
                Web3 Wallet
                <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  Soon
                </span>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* QRIS Tab - Active */}
            {activeTab === 'qris' && (
              <div>
                {/* Amount Input with Flag */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <div className="flex space-x-4">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium">
                        {getCurrencyInfo(currency).symbol}
                      </span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full pl-8 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        step={currency === 'JPY' || currency === 'IDR' ? '1' : '0.01'}
                        min="0"
                      />
                    </div>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[200px]"
                    >
                      {currencies.map(curr => (
                        <option key={curr.code} value={curr.code}>
                          {curr.code} - {curr.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Currency Preview with Flag */}
                  {amount && (
                    <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FlagIcon 
                          countryCode={getCurrencyInfo(currency).countryCode} 
                          size={24} 
                        />
                        <div>
                          <div className="font-semibold text-indigo-900">
                            {getCurrencyInfo(currency).symbol}{parseFloat(amount || 0).toLocaleString()} {currency}
                          </div>
                          <div className="text-sm text-indigo-600">
                            {getCurrencyInfo(currency).country}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleQRISTopup}>
                  <button
                    type="submit"
                    disabled={loading || !amount}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    ) : (
                      <QrCode className="w-5 h-5 mr-2" />
                    )}
                    Generate QRIS
                  </button>
                </form>

                {/* QRIS Result */}
                {currentTopup && activeTab === 'qris' && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">QRIS Payment</h3>
                      <span className={`px-2 py-1 rounded text-sm ${getStatusColor(currentTopup.status)}`}>
                        {getStatusText(currentTopup.status)}
                      </span>
                    </div>
                    
                    {(() => {
                      const qrisData = extractQRISData(currentTopup.payment_data)
                      
                      if (qrisData) {
                        return (
                          <div className="space-y-4">
                            {/* QR Code Display */}
                            <div className="text-center bg-white p-6 rounded-lg border-2 border-dashed border-gray-300">
                              <div className="mb-4">
                                <QRCodeWithFallback 
                                  value={qrisData.qr_code_url}
                                  size={200}
                                />
                              </div>
                              <p className="text-gray-600 text-sm mb-2">
                                Scan this QR code with your QRIS-enabled app
                              </p>
                              <p className="text-xs text-gray-500 mb-4">
                                Or use the link below to open payment page
                              </p>
                              
                              {/* QR Actions */}
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => copyToClipboard(qrisData.qr_code_url)}
                                  className="flex items-center space-x-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                                >
                                  <Copy className="w-4 h-4" />
                                  <span>Copy</span>
                                </button>
                              </div>
                            </div>
                            
                            {/* Payment Details with Flag */}
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-semibold mb-3">Payment Details</h4>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center space-x-2">
                                  <FlagIcon 
                                    countryCode={getCurrencyInfo(currentTopup.fiat_currency).countryCode} 
                                    size={16} 
                                  />
                                  <span className="text-gray-600">Amount:</span>
                                  <span className="font-semibold">
                                    {formatAmount(currentTopup.fiat_amount).toLocaleString()} {currentTopup.fiat_currency}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">ICP Amount:</span>
                                  <span className="font-semibold ml-2">
                                    {(formatAmount(currentTopup.amount) / 100000000).toFixed(8)} ICP
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Merchant ID:</span>
                                  <span className="font-mono ml-2">{qrisData.merchant_id}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Transaction ID:</span>
                                  <span className="font-mono ml-2">{currentTopup.id}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Created:</span>
                                  <span className="ml-2">{formatDate(currentTopup.created_at)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Expires:</span>
                                  <span className="ml-2">{formatDate(qrisData.expire_time)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      } else {
                        return (
                          <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <p className="text-red-800 font-medium">No QRIS data found</p>
                            <p className="text-red-600 text-sm mt-2">
                              The payment was created but QRIS data is missing. Please try again.
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
                description="Credit card top-up integration is currently in development. You'll be able to add funds using major credit cards."
              />
            )}

            {/* Web3 Wallet Tab - Coming Soon */}
            {activeTab === 'wallet' && (
              <ComingSoonTab
                icon={Wallet}
                title="Web3 Wallet Integration"
                description="Direct wallet integration for seamless crypto-to-ICP conversion. Connect your favorite Web3 wallet to top up instantly."
              />
            )}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-800">{success}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default TopUp