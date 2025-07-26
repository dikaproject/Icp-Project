import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useICP } from '../contexts/ICPContext'
import QRCode from 'react-qr-code'
import { 
  QrCode, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  CreditCard,
  Wallet,
  ArrowLeft,
  ExternalLink,
  Copy,
  Download,
  Timer,
  Receipt,
  Shield,
  Zap,
  Sparkles,
  Loader,
  Check,
  X,
  RefreshCw,
  Eye,
  Info
} from 'lucide-react'

const ClaimQRIS = () => {
  const { topupId } = useParams()
  const navigate = useNavigate()
  const { backend } = useICP()
  
  const [topupData, setTopupData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (topupId && backend) {
      fetchTopupData()
    }
  }, [topupId, backend])

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
    
    // Check if qris_data is an array with data
    if (Array.isArray(paymentData.qris_data) && paymentData.qris_data.length > 0) {
      return paymentData.qris_data[0]
    }
    
    // Check if qris_data is directly the object
    if (typeof paymentData.qris_data === 'object' && paymentData.qris_data.qr_code_url) {
      return paymentData.qris_data
    }
    
    return null
  }

  const fetchTopupData = async () => {
    try {
      setLoading(true)
      const result = await backend.getTopupTransaction(topupId)
      
      if (result && result.length > 0) {
        // Convert BigInt values to strings
        const convertedData = convertBigIntToString(result[0])
        setTopupData(convertedData)
      } else {
        setError('Top-up transaction not found')
      }
    } catch (err) {
      console.error('Error fetching topup data:', err)
      setError('Failed to load transaction data')
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = async () => {
    if (!topupData || getStatusText(topupData.status) !== 'Pending') return
    
    setProcessing(true)
    setError('')
    setSuccess('')

    try {
      const result = await backend.claimQRISPayment(topupId)
      
      if (result.Ok) {
        const convertedData = convertBigIntToString(result.Ok)
        setTopupData(convertedData)
        setSuccess('Payment successfully processed!')
        
        // Refresh balance after successful claim
        if (backend) {
          try {
            await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
            const userBalance = await backend.getUserBalance()
            console.log('Balance refreshed after topup:', userBalance)
          } catch (err) {
            console.error('Error refreshing balance after topup:', err)
          }
        }
        
        // Redirect setelah 3 detik
        setTimeout(() => {
          navigate('/dashboard', { 
            state: { message: 'Top-up completed successfully!' }
          })
        }, 3000)
      } else {
        setError(result.Err || 'Failed to process payment')
      }
    } catch (err) {
      console.error('Error claiming payment:', err)
      setError('Failed to process payment')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusText = (status) => {
    if (!status) return 'Unknown'
    if (status.Pending !== undefined) return 'Pending'
    if (status.Completed !== undefined) return 'Completed'
    if (status.Processing !== undefined) return 'Processing'
    if (status.Failed !== undefined) return 'Failed'
    if (status.Expired !== undefined) return 'Expired'
    return typeof status === 'string' ? status : 'Unknown'
  }

  const getStatusColor = (status) => {
    const statusValue = getStatusText(status)
    
    switch (statusValue) {
      case 'Completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'Processing': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'Pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'Failed': return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      case 'Expired': return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const getStatusIcon = (status) => {
    const statusValue = getStatusText(status)
    
    switch (statusValue) {
      case 'Completed': return <CheckCircle className="w-5 h-5" />
      case 'Processing': return <Loader className="w-5 h-5 animate-spin" />
      case 'Pending': return <Clock className="w-5 h-5" />
      case 'Failed': return <AlertCircle className="w-5 h-5" />
      case 'Expired': return <X className="w-5 h-5" />
      default: return <Clock className="w-5 h-5" />
    }
  }

  const formatCurrency = (amount, currency) => {
    const currencySymbols = {
      IDR: 'Rp ',
      USD: '$',
      EUR: '€',
      JPY: '¥'
    }
    
    // Convert BigInt or string to number
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : 
                      typeof amount === 'bigint' ? Number(amount) : amount
    
    return `${currencySymbols[currency] || ''}${numAmount.toLocaleString()}`
  }

  const formatAmount = (amount) => {
    if (typeof amount === 'string') return parseFloat(amount)
    if (typeof amount === 'bigint') return Number(amount)
    return amount
  }

  const formatDate = (timestamp) => {
    try {
      // Convert BigInt or string to number
      const numTimestamp = typeof timestamp === 'string' ? parseFloat(timestamp) : 
                          typeof timestamp === 'bigint' ? Number(timestamp) : timestamp
      
      const date = new Date(numTimestamp / 1000000)
      return date.toLocaleString()
    } catch (err) {
      return 'Invalid date'
    }
  }

  const isExpired = (expireTime) => {
    try {
      const numExpireTime = typeof expireTime === 'string' ? parseFloat(expireTime) : 
                           typeof expireTime === 'bigint' ? Number(expireTime) : expireTime
      
      return Date.now() > numExpireTime / 1000000
    } catch (err) {
      return false
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true)
        setSuccess('Copied to clipboard!')
        setTimeout(() => {
          setCopied(false)
          setSuccess('')
        }, 2000)
      })
      .catch(err => {
        console.error('Error copying text:', err)
        setError('Failed to copy text')
        setTimeout(() => setError(''), 2000)
      })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#181A20] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#885FFF] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-[#F5F6FA] mb-3">Loading Transaction</h2>
          <p className="text-[#B3B3C2]">Please wait while we fetch your payment details...</p>
        </div>
      </div>
    )
  }

  if (error && !topupData) {
    return (
      <div className="min-h-screen bg-[#181A20] flex items-center justify-center p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-[#222334] rounded-3xl shadow-2xl shadow-black/20 p-8 border border-[#23253B]">
            <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
              <AlertCircle className="w-10 h-10 text-rose-400" />
            </div>
            <h2 className="text-2xl font-bold text-[#F5F6FA] mb-3">Transaction Not Found</h2>
            <p className="text-[#B3B3C2] mb-8 leading-relaxed">{error}</p>
            <button
              onClick={() => navigate('/topup')}
              className="w-full bg-gradient-to-r from-[#885FFF] to-[#59C1FF] text-white py-4 px-6 rounded-2xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02]"
            >
              Create New Top-up
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Extract QRIS data
  const qrisData = extractQRISData(topupData?.payment_data)
  const currentStatus = getStatusText(topupData?.status)

  return (
    <div className="min-h-screen bg-[#181A20]">
      {/* Header */}
      <div className="bg-[#1A1D23] border-b border-[#23253B] backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/topup')}
              className="p-3 hover:bg-[#222334] rounded-2xl transition-all duration-200 group"
            >
              <ArrowLeft className="w-6 h-6 text-[#B3B3C2] group-hover:text-[#F5F6FA]" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#F5F6FA]">QRIS Payment Gateway</h1>
              <p className="text-[#B3B3C2]">Complete your top-up transaction securely</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-[#222334] rounded-3xl shadow-2xl shadow-black/20 overflow-hidden border border-[#23253B]">
          {/* Merchant Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#885FFF] via-[#59C1FF] to-[#885FFF] text-white p-8">
            {/* Gradient Orbs */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -ml-16 -mb-16"></div>
            
            <div className="relative flex items-center space-x-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">ICP Payment Gateway</h2>
                <p className="text-white/80 text-lg">Secure Internet Computer blockchain payment processing</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Shield className="w-5 h-5 text-white/80" />
                  <span className="text-white/80 font-medium">256-bit SSL Encryption</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="p-8 space-y-8">
            {/* Status Section */}
            <div className="text-center">
              <div className={`inline-flex items-center space-x-3 px-6 py-4 rounded-2xl border font-semibold text-lg ${getStatusColor(topupData?.status)}`}>
                {getStatusIcon(topupData?.status)}
                <span>{currentStatus}</span>
              </div>
            </div>

            {/* Payment Amount Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#262840] via-[#222334] to-[#262840] p-8 rounded-3xl border border-[#23253B]">
              {/* Gradient Orbs */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#885FFF]/20 to-[#59C1FF]/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#59C1FF]/20 to-[#885FFF]/20 rounded-full blur-3xl -ml-12 -mb-12"></div>
              
              <div className="relative text-center">
                <div className="flex items-center justify-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/25">
                    <Receipt className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <p className="text-[#B3B3C2] font-medium mb-3">Amount to Pay</p>
                <p className="text-5xl font-bold text-[#F5F6FA] mb-4">
                  {formatCurrency(topupData?.fiat_amount, topupData?.fiat_currency)}
                </p>
                <p className="text-xl text-[#885FFF] font-semibold">
                  ≈ {(formatAmount(topupData?.amount) / 100000000).toFixed(8)} ICP
                </p>
              </div>
            </div>

            {/* Transaction Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-[#181A20] p-6 rounded-2xl border border-[#23253B]">
                  <div className="text-sm font-medium text-[#B3B3C2] mb-3">Transaction ID</div>
                  <div className="font-mono text-[#F5F6FA] text-lg break-all">{topupData?.id}</div>
                </div>
                
                <div className="bg-[#181A20] p-6 rounded-2xl border border-[#23253B]">
                  <div className="text-sm font-medium text-[#B3B3C2] mb-3">Payment Method</div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-[#F5F6FA]">QRIS Payment</div>
                      <div className="text-[#B3B3C2] text-sm">Quick Response Indonesian Standard</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-[#181A20] p-6 rounded-2xl border border-[#23253B]">
                  <div className="text-sm font-medium text-[#B3B3C2] mb-3">Merchant ID</div>
                  <div className="font-mono text-[#F5F6FA] text-lg">{qrisData?.merchant_id || 'ICP_PAYMENT_001'}</div>
                </div>
                
                <div className="bg-[#181A20] p-6 rounded-2xl border border-[#23253B]">
                  <div className="text-sm font-medium text-[#B3B3C2] mb-3">Created</div>
                  <div className="text-[#F5F6FA] font-medium">{formatDate(topupData?.created_at)}</div>
                </div>
              </div>
            </div>

            {/* Expiry Information */}
            {qrisData?.expire_time && (
              <div className={`p-6 rounded-2xl border ${
                isExpired(qrisData.expire_time) 
                  ? 'bg-rose-500/10 border-rose-500/20' 
                  : 'bg-amber-500/10 border-amber-500/20'
              }`}>
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isExpired(qrisData.expire_time) ? 'bg-rose-500/20' : 'bg-amber-500/20'
                  }`}>
                    <Timer className={`w-6 h-6 ${
                      isExpired(qrisData.expire_time) ? 'text-rose-400' : 'text-amber-400'
                    }`} />
                  </div>
                  <div>
                    <div className={`font-semibold text-lg ${
                      isExpired(qrisData.expire_time) ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                      {isExpired(qrisData.expire_time) ? 'Payment Expired' : 'Payment Expires'}
                    </div>
                    <div className={`${
                      isExpired(qrisData.expire_time) ? 'text-rose-300' : 'text-amber-300'
                    }`}>
                      {formatDate(qrisData.expire_time)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* QR Code Section */}
            {qrisData && (
              <div className="bg-[#181A20] p-8 rounded-3xl border border-[#23253B]">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-3 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                      <QrCode className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#F5F6FA]">Payment QR Code</h3>
                  </div>
                  
                  <div className="bg-white p-8 rounded-3xl shadow-xl mx-auto inline-block mb-8">
                    <QRCode
                      value={qrisData.qr_code_url}
                      size={220}
                      level="M"
                      includeMargin={true}
                      style={{ 
                        height: "auto", 
                        maxWidth: "100%", 
                        width: "220px",
                        margin: "0 auto"
                      }}
                    />
                  </div>
                  
                  <h4 className="text-xl font-bold text-[#F5F6FA] mb-3">
                    Scan with QRIS App
                  </h4>
                  <p className="text-[#B3B3C2] mb-8 leading-relaxed max-w-md mx-auto">
                    Use any QRIS-enabled mobile banking or e-wallet app to scan this code and complete your payment
                  </p>
                  
                  {/* QR Code Actions */}
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button
                      onClick={() => copyToClipboard(qrisData.qr_code_url)}
                      className="flex items-center justify-center space-x-3 bg-[#262840] hover:bg-[#363850] text-[#F5F6FA] px-6 py-4 rounded-2xl transition-all duration-200 border border-[#23253B] hover:border-[#885FFF]/50 font-semibold"
                    >
                      {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                      <span>{copied ? 'Copied!' : 'Copy QR Link'}</span>
                    </button>
                    
                    <a
                      href={qrisData.qr_code_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-3 bg-[#262840] hover:bg-[#363850] text-[#F5F6FA] px-6 py-4 rounded-2xl transition-all duration-200 border border-[#23253B] hover:border-[#885FFF]/50 font-semibold"
                    >
                      <ExternalLink className="w-5 h-5" />
                      <span>Open QR Link</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-6">
              {currentStatus === 'Pending' && qrisData && !isExpired(qrisData.expire_time) && (
                <button
                  onClick={handleClaim}
                  disabled={processing}
                  className="w-full group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl py-6 px-8 font-bold text-lg shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {processing ? (
                    <div className="flex items-center justify-center space-x-3">
                      <Loader className="w-6 h-6 animate-spin" />
                      <span>Processing Payment...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-3">
                      <Zap className="w-6 h-6" />
                      <span>Confirm Payment (Demo Mode)</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </button>
              )}

              {currentStatus === 'Completed' && (
                <div className="text-center space-y-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-emerald-400 mb-3">Payment Successful!</h3>
                    <p className="text-emerald-300 leading-relaxed mb-6">
                      Your account has been successfully topped up with ICP tokens. The balance will be reflected in your wallet shortly.
                    </p>
                    <div className="inline-flex items-center space-x-3 bg-emerald-500/10 text-emerald-400 px-6 py-3 rounded-2xl border border-emerald-500/20">
                      <Timer className="w-5 h-5" />
                      <span className="font-medium">Redirecting to dashboard...</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full bg-gradient-to-r from-[#885FFF] to-[#59C1FF] text-white py-6 px-8 rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <Eye className="w-6 h-6" />
                      <span>View Dashboard</span>
                    </div>
                  </button>
                </div>
              )}

              {(currentStatus === 'Expired' || (qrisData && isExpired(qrisData.expire_time))) && (
                <div className="text-center space-y-6">
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-8">
                    <div className="w-20 h-20 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <AlertCircle className="w-10 h-10 text-rose-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-rose-400 mb-3">Payment Expired</h3>
                    <p className="text-rose-300 leading-relaxed">
                      This transaction has expired and can no longer be processed. Please create a new top-up request.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => navigate('/topup')}
                    className="w-full bg-gradient-to-r from-[#885FFF] to-[#59C1FF] text-white py-6 px-8 rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <RefreshCw className="w-6 h-6" />
                      <span>Create New Top-up</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Demo Notice */}
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-3xl p-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Info className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-amber-400 font-bold text-xl mb-4">🚀 Demo Mode Information</h4>
                  <div className="text-[#F5F6FA] space-y-3">
                    <p className="leading-relaxed">
                      This is a demonstration implementation of QRIS payment integration with the Internet Computer Protocol.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10">
                        <div className="font-semibold text-amber-400 mb-2">🔧 Current Features:</div>
                        <ul className="text-sm text-[#B3B3C2] space-y-1">
                          <li>• QR code generation and display</li>
                          <li>• Transaction status tracking</li>
                          <li>• Balance updates simulation</li>
                          <li>• Secure payment processing</li>
                        </ul>
                      </div>
                      <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10">
                        <div className="font-semibold text-amber-400 mb-2">🚀 Production Ready:</div>
                        <ul className="text-sm text-[#B3B3C2] space-y-1">
                          <li>• Real QRIS gateway integration</li>
                          <li>• Live payment processing</li>
                          <li>• Bank confirmation webhooks</li>
                          <li>• Multi-currency support</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 flex items-start space-x-4">
            <AlertCircle className="h-6 w-6 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-rose-400 font-semibold text-lg">Error</h3>
              <p className="text-rose-300 mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex items-start space-x-4">
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

export default ClaimQRIS