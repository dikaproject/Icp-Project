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
  Download
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
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'Processing': return 'bg-blue-100 text-blue-800'
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Failed': return 'bg-red-100 text-red-800'
      case 'Expired': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    const statusValue = getStatusText(status)
    
    switch (statusValue) {
      case 'Completed': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'Processing': return <Clock className="w-5 h-5 text-blue-600 animate-spin" />
      case 'Pending': return <Clock className="w-5 h-5 text-yellow-600" />
      case 'Failed': return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'Expired': return <AlertCircle className="w-5 h-5 text-gray-600" />
      default: return <Clock className="w-5 h-5 text-gray-600" />
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
        setSuccess('Copied to clipboard!')
        setTimeout(() => setSuccess(''), 2000)
      })
      .catch(err => {
        console.error('Error copying text:', err)
        setError('Failed to copy text')
        setTimeout(() => setError(''), 2000)
      })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transaction...</p>
        </div>
      </div>
    )
  }

  if (error && !topupData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Transaction Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/topup')}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/topup')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">QRIS Payment</h1>
              <p className="text-sm text-gray-600">Complete your top-up transaction</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Merchant Info */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">ICP Payment Gateway</h2>
                <p className="text-indigo-100">Secure blockchain payment processing</p>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div className="text-center">
              <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${getStatusColor(topupData?.status)}`}>
                {getStatusIcon(topupData?.status)}
                <span className="font-medium">{currentStatus}</span>
              </div>
            </div>

            {/* Amount */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Amount to Pay</p>
              <p className="text-4xl font-bold text-gray-900 mb-2">
                {formatCurrency(topupData?.fiat_amount, topupData?.fiat_currency)}
              </p>
              <p className="text-sm text-gray-500">
                ≈ {(formatAmount(topupData?.amount) / 100000000).toFixed(8)} ICP
              </p>
            </div>

            {/* Transaction Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID</span>
                <span className="font-mono text-sm">{topupData?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method</span>
                <div className="flex items-center space-x-2">
                  <QrCode className="w-4 h-4 text-gray-500" />
                  <span>QRIS</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Merchant</span>
                <span>{qrisData?.merchant_id || 'ICP_PAYMENT_001'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created</span>
                <span>{formatDate(topupData?.created_at)}</span>
              </div>
              
              {qrisData?.expire_time && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Expires</span>
                  <span className={isExpired(qrisData.expire_time) ? 'text-red-600' : 'text-gray-900'}>
                    {formatDate(qrisData.expire_time)}
                  </span>
                </div>
              )}
            </div>

            {/* QR Code Display */}
            {qrisData && (
              <div className="text-center">
                <div className="bg-white p-6 rounded-lg border-2 border-gray-200 mb-4">
                  <QRCode
                    value={qrisData.qr_code_url}
                    size={180}
                    level="M"
                    includeMargin={true}
                    style={{ 
                      height: "auto", 
                      maxWidth: "100%", 
                      width: "180px",
                      margin: "0 auto"
                    }}
                  />
                  <p className="text-gray-600 text-sm mt-4 mb-2">
                    Scan with your QRIS-enabled app
                  </p>
                  <div className="flex justify-center space-x-2 mt-3">
                    <button
                      onClick={() => copyToClipboard(qrisData.qr_code_url)}
                      className="flex items-center space-x-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </button>
                    <a
                      href={qrisData.qr_code_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {currentStatus === 'Pending' && qrisData && !isExpired(qrisData.expire_time) && (
                <button
                  onClick={handleClaim}
                  disabled={processing}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Confirm Payment (Demo)</span>
                    </>
                  )}
                </button>
              )}

              {currentStatus === 'Completed' && (
                <div className="text-center space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-green-800 font-medium">Payment Successful!</p>
                    <p className="text-green-600 text-sm">Your account has been topped up</p>
                  </div>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    View Dashboard
                  </button>
                </div>
              )}

              {(currentStatus === 'Expired' || (qrisData && isExpired(qrisData.expire_time))) && (
                <div className="text-center space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-red-800 font-medium">Payment Expired</p>
                    <p className="text-red-600 text-sm">This transaction has expired</p>
                  </div>
                  <button
                    onClick={() => navigate('/topup')}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Create New Top-up
                  </button>
                </div>
              )}
            </div>

            {/* Demo Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-yellow-800 font-medium text-sm">Demo Mode</p>
                  <p className="text-yellow-700 text-xs mt-1">
                    This is a demo implementation. In production, this would integrate with actual QRIS payment gateways and show real QR codes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClaimQRIS