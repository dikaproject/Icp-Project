import React, { useState, useEffect } from 'react'
import Flag from 'react-world-flags'
import { useICP } from '../contexts/ICPContext.jsx'
import { QRCodeCanvas } from "qrcode.react"
import { 
  QrCode, 
  DollarSign, 
  Clock, 
  Copy, 
  Check, 
  Globe,
  Wallet,
  ArrowRight,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Timer,
  Zap,
  Receipt,
  Download,
  Share2,
  Eye,
  ChevronDown,
  Sparkles,
  Loader
} from 'lucide-react'

const QRGenerator = () => {
  const { backend, isAuthenticated } = useICP()
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [qrCode, setQrCode] = useState(null)
  const [exchangeRate, setExchangeRate] = useState(null)
  const [copied, setCopied] = useState(false)

  // UPDATED: Hardcode supported currencies dengan info lengkap
  const supportedCurrencies = [
    { 
      code: 'IDR', 
      symbol: 'Rp', 
      name: 'Indonesian Rupiah',
      country: 'Indonesia',
      countryCode: 'ID' // ISO country code for flag
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

  // Updated flag component
  const FlagIcon = ({ countryCode, size = 24 }) => (
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
    />
  )

  // Get currency info helper
  const getCurrencyInfo = (code) => {
    return supportedCurrencies.find(curr => curr.code === code) || supportedCurrencies[0]
  }

  const handleGenerateQR = async (e) => {
    e.preventDefault()
    
    if (!backend || !amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const rateResult = await backend.fetchExchangeRate(currency)
      if (rateResult.Err) {
        setError(rateResult.Err)
        return
      }
      setExchangeRate(rateResult.Ok)

      const qrResult = await backend.generateQR(
        parseFloat(amount),
        currency,
        description || undefined
      )
      if (qrResult.Err) {
        setError(qrResult.Err)
        return
      }

      setQrCode(qrResult.Ok)
    } catch (error) {
      setError('Failed to generate QR code')
      console.error('Error generating QR:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyQRId = async () => {
    if (!qrCode) return
    
    try {
      await navigator.clipboard.writeText(qrCode.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy QR ID:', error)
    }
  }

  const resetForm = () => {
    setQrCode(null)
    setExchangeRate(null)
    setAmount('')
    setDescription('')
    setError('')
  }

  const formatICP = (amount) => {
    return (Number(amount) / 100_000_000).toFixed(6)
  }

  // UPDATED: Better currency formatting
  const formatCurrency = (amount, currencyCode) => {
    const currInfo = getCurrencyInfo(currencyCode)
    const numAmount = parseFloat(amount)
    
    // Format based on currency
    switch (currencyCode) {
      case 'IDR':
        return `${currInfo.symbol}${numAmount.toLocaleString('id-ID')}`
      case 'JPY':
        return `${currInfo.symbol}${Math.round(numAmount).toLocaleString('ja-JP')}`
      case 'USD':
        return `${currInfo.symbol}${numAmount.toFixed(2)}`
      case 'EUR':
        return `${currInfo.symbol}${numAmount.toFixed(2)}`
      default:
        return `${currInfo.symbol}${numAmount.toFixed(2)}`
    }
  }

  const getTimeRemaining = (expireTime) => {
    const now = Date.now() * 1_000_000
    const remaining = Number(expireTime) - now
    const minutes = Math.floor(remaining / (60 * 1_000_000_000))
    const seconds = Math.floor((remaining % (60 * 1_000_000_000)) / 1_000_000_000)
    return { minutes, seconds }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#181A20] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-purple-500/25">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-[#F5F6FA] mb-4">Authentication Required</h2>
          <p className="text-[#B3B3C2] mb-8 leading-relaxed">Please connect your wallet to generate QR payment codes</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#181A20] p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="text-center px-2">
          <div className="relative mb-6 lg:mb-8">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] rounded-2xl lg:rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/25">
              <QrCode className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] rounded-2xl lg:rounded-3xl blur-2xl opacity-30 mx-auto w-16 h-16 lg:w-20 lg:h-20"></div>
          </div>
          
          <h1 className="text-2xl lg:text-4xl font-bold text-[#F5F6FA] mb-3 lg:mb-4 px-4">
            Generate QR Payment
          </h1>
          <p className="text-[#B3B3C2] text-base lg:text-lg leading-relaxed max-w-2xl mx-auto px-4">
            Create beautiful payment requests with QR codes for instant transactions. Support for multiple currencies with real-time exchange rates.
          </p>
        </div>

        <div className="grid gap-6 lg:gap-8 lg:grid-cols-2">
          {/* Form */}
          <div className="bg-[#222334] rounded-2xl lg:rounded-3xl border border-[#23253B] p-4 lg:p-8 shadow-2xl shadow-black/20">
            <div className="flex items-center space-x-3 mb-6 lg:mb-8">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Receipt className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <h2 className="text-xl lg:text-2xl font-bold text-[#F5F6FA]">Payment Details</h2>
            </div>
            
            <form onSubmit={handleGenerateQR} className="space-y-6 lg:space-y-8">
              {/* Amount Input */}
              <div>
                <label className="block text-base lg:text-lg font-semibold text-[#F5F6FA] mb-3 lg:mb-4">
                  Payment Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-4 lg:left-6 top-1/2 transform -translate-y-1/2 text-[#B3B3C2] font-semibold text-lg lg:text-xl z-10">
                    {getCurrencyInfo(currency).symbol}
                  </span>
                  <input
                    type="number"
                    step={currency === 'JPY' || currency === 'IDR' ? '1' : '0.01'}
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 lg:pl-12 pr-4 lg:pr-6 py-4 lg:py-6 bg-[#181A20] border border-[#23253B] rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-[#885FFF] focus:border-[#885FFF] transition-all text-[#F5F6FA] placeholder-[#B3B3C2] text-xl lg:text-2xl font-bold"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Currency Selector */}
              <div>
                <label className="block text-base lg:text-lg font-semibold text-[#F5F6FA] mb-3 lg:mb-4">
                  Currency
                </label>
                <div className="relative group">
                  <Globe className="absolute left-4 lg:left-6 top-1/2 transform -translate-y-1/2 w-5 h-5 lg:w-6 lg:h-6 text-[#B3B3C2] z-10" />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full pl-12 lg:pl-16 pr-12 lg:pr-16 py-4 lg:py-6 bg-[#181A20] border border-[#23253B] rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-[#885FFF] focus:border-[#885FFF] transition-all text-[#F5F6FA] text-base lg:text-lg font-semibold appearance-none cursor-pointer hover:bg-[#1A1C22] hover:border-[#885FFF]/50"
                  >
                    {supportedCurrencies.map((curr) => (
                      <option key={curr.code} value={curr.code} className="bg-[#181A20] text-[#F5F6FA] py-2 lg:py-3 px-3 lg:px-4">
                        {curr.code} - {curr.name} ({curr.symbol})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 lg:right-6 top-1/2 transform -translate-y-1/2 w-5 h-5 lg:w-6 lg:h-6 text-[#B3B3C2] pointer-events-none transition-transform group-hover:rotate-180" />
                </div>
                
                {/* Enhanced Currency Preview with Flag */}
                <div className="mt-3 lg:mt-4 p-4 lg:p-6 bg-gradient-to-r from-[#885FFF]/10 to-[#59C1FF]/10 border border-[#885FFF]/20 rounded-xl lg:rounded-2xl hover:border-[#885FFF]/40 transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <FlagIcon 
                          countryCode={getCurrencyInfo(currency).countryCode} 
                          size={32} 
                        />
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#885FFF]/30 to-[#59C1FF]/30 rounded-lg blur opacity-75"></div>
                      </div>
                      <div className="sm:hidden">
                        <div className="text-lg lg:text-xl font-bold text-[#F5F6FA] mb-1">
                          {getCurrencyInfo(currency).name}
                        </div>
                        <div className="text-sm text-[#B3B3C2]">
                          {getCurrencyInfo(currency).country}
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:block flex-1">
                      <div className="text-lg lg:text-xl font-bold text-[#F5F6FA] mb-1">
                        {getCurrencyInfo(currency).name}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 text-[#B3B3C2] text-sm lg:text-base">
                        <span>{getCurrencyInfo(currency).country}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="font-semibold text-[#885FFF]">Symbol: {getCurrencyInfo(currency).symbol}</span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-xs lg:text-sm text-[#B3B3C2]">Selected</div>
                      <div className="text-xl lg:text-2xl font-bold text-[#885FFF]">{currency}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-base lg:text-lg font-semibold text-[#F5F6FA] mb-3 lg:mb-4">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 lg:px-6 py-3 lg:py-4 bg-[#181A20] border border-[#23253B] rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-[#885FFF] focus:border-[#885FFF] transition-all text-[#F5F6FA] placeholder-[#B3B3C2] text-base lg:text-lg"
                  placeholder="What is this payment for?"
                  maxLength={100}
                />
                <p className="text-xs lg:text-sm text-[#B3B3C2] mt-2">
                  Add a note to help identify this payment request
                </p>
              </div>

              {/* Amount Preview */}
              {amount && (
                <div className="p-4 lg:p-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl lg:rounded-2xl">
                  <div className="flex items-center space-x-3 lg:space-x-4">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-500/20 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs lg:text-sm text-blue-400 font-medium mb-1">Payment Request Amount</div>
                      <div className="text-xl lg:text-3xl font-bold text-[#F5F6FA] truncate">
                        {formatCurrency(amount, currency)}
                      </div>
                      <div className="text-sm lg:text-base text-blue-400 truncate">
                        {getCurrencyInfo(currency).name}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl lg:rounded-2xl p-4 lg:p-6 flex items-start space-x-3 lg:space-x-4">
                  <AlertCircle className="h-5 w-5 lg:h-6 lg:w-6 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-rose-400 font-semibold text-base lg:text-lg">Error</h3>
                    <p className="text-rose-300 mt-1 text-sm lg:text-base">{error}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col space-y-3 lg:space-y-0 lg:flex-row lg:gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 group relative overflow-hidden bg-gradient-to-r from-[#885FFF] to-[#59C1FF] text-white rounded-xl lg:rounded-2xl py-4 lg:py-6 px-6 lg:px-8 font-bold text-base lg:text-lg shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-3">
                      <Loader className="w-5 h-5 lg:w-6 lg:h-6 animate-spin" />
                      <span>Generating QR...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-3">
                      <Sparkles className="w-5 h-5 lg:w-6 lg:h-6" />
                      <span>Generate QR Code</span>
                      <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </button>
                
                {qrCode && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 lg:px-8 py-4 lg:py-6 bg-[#262840] border border-[#23253B] text-[#F5F6FA] rounded-xl lg:rounded-2xl hover:bg-[#363850] transition-all duration-200 font-semibold text-base lg:text-lg"
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <RefreshCw className="w-4 h-4 lg:w-5 lg:h-5" />
                      <span>Reset Form</span>
                    </div>
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* QR Code Display */}
          <div className="bg-[#222334] rounded-2xl lg:rounded-3xl border border-[#23253B] p-4 lg:p-8 shadow-2xl shadow-black/20">
            <div className="flex items-center space-x-3 mb-6 lg:mb-8">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <QrCode className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <h2 className="text-xl lg:text-2xl font-bold text-[#F5F6FA]">QR Code</h2>
            </div>
            
            {qrCode ? (
              <div className="space-y-6 lg:space-y-8">
                {/* QR Code Display */}
                <div className="text-center bg-[#181A20] p-6 lg:p-8 rounded-2xl lg:rounded-3xl border border-[#23253B]">
                  <div className="bg-white p-4 lg:p-6 rounded-xl lg:rounded-2xl shadow-xl mx-auto inline-block mb-4 lg:mb-6">
                    <QRCodeCanvas
                      value={qrCode.id}
                      size={window.innerWidth < 768 ? 180 : 200}
                      level="H"
                      includeMargin={true}
                      className="mx-auto"
                    />
                  </div>
                  
                  <h3 className="text-xl lg:text-2xl font-bold text-[#F5F6FA] mb-2 lg:mb-3">
                    Payment QR Ready
                  </h3>
                  <p className="text-[#B3B3C2] mb-4 lg:mb-6 leading-relaxed text-sm lg:text-base px-2">
                    Share this QR code with the payer to complete the transaction
                  </p>
                  
                  {/* Timer */}
                  <div className="inline-flex items-center space-x-2 lg:space-x-3 bg-amber-500/10 text-amber-400 px-4 lg:px-6 py-2 lg:py-3 rounded-xl lg:rounded-2xl border border-amber-500/20">
                    <Timer className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span className="font-semibold text-sm lg:text-base">
                      Expires in {(() => {
                        const time = getTimeRemaining(qrCode.expire_time)
                        return `${time.minutes}m ${time.seconds}s`
                      })()}
                    </span>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-gradient-to-r from-[#262840] via-[#222334] to-[#262840] p-4 lg:p-6 rounded-xl lg:rounded-2xl border border-[#23253B]">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <FlagIcon 
                        countryCode={getCurrencyInfo(qrCode.fiat_currency).countryCode} 
                        size={window.innerWidth < 768 ? 40 : 48} 
                      />
                      <div className="sm:hidden">
                        <div className="text-xs font-medium text-[#B3B3C2] mb-1">Payment Amount</div>
                        <div className="text-xl font-bold text-[#F5F6FA]">
                          {formatCurrency(qrCode.fiat_amount, qrCode.fiat_currency)}
                        </div>
                        <div className="text-[#885FFF] font-medium text-sm">
                          ≈ {formatICP(qrCode.icp_amount)} ICP
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:block flex-1">
                      <div className="text-xs lg:text-sm font-medium text-[#B3B3C2] mb-1">Payment Amount</div>
                      <div className="text-2xl lg:text-3xl font-bold text-[#F5F6FA]">
                        {formatCurrency(qrCode.fiat_amount, qrCode.fiat_currency)}
                      </div>
                      <div className="text-[#885FFF] font-medium text-sm lg:text-base">
                        ≈ {formatICP(qrCode.icp_amount)} ICP
                      </div>
                      <div className="text-xs lg:text-sm text-[#B3B3C2]">
                        {getCurrencyInfo(qrCode.fiat_currency).country}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Payment Details */}
                <div className="space-y-3 lg:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 lg:p-4 bg-[#181A20] rounded-xl lg:rounded-2xl border border-[#23253B] space-y-2 sm:space-y-0">
                    <span className="text-[#B3B3C2] font-medium text-sm lg:text-base">QR Payment ID:</span>
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      <code className="px-2 lg:px-3 py-1 lg:py-2 text-xs lg:text-sm rounded-lg lg:rounded-xl bg-[#262840] border border-[#23253B] font-mono text-[#F5F6FA] break-all">
                        {qrCode.id.length > 20 && window.innerWidth < 768 
                          ? `${qrCode.id.substring(0, 20)}...`
                          : qrCode.id
                        }
                      </code>
                      <button
                        onClick={handleCopyQRId}
                        className="p-1.5 lg:p-2 text-[#B3B3C2] hover:text-[#F5F6FA] hover:bg-[#262840] rounded-lg lg:rounded-xl transition-all duration-200 flex-shrink-0"
                        title="Copy QR ID"
                      >
                        {copied ? <Check className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-400" /> : <Copy className="w-4 h-4 lg:w-5 lg:h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 lg:p-4 bg-[#181A20] rounded-xl lg:rounded-2xl border border-[#23253B]">
                    <span className="text-[#B3B3C2] font-medium text-sm lg:text-base">Status:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 lg:w-3 lg:h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-emerald-400 font-semibold text-sm lg:text-base">Active</span>
                    </div>
                  </div>
                  
                  {qrCode.description && (
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 lg:p-4 bg-[#181A20] rounded-xl lg:rounded-2xl border border-[#23253B] space-y-2 sm:space-y-0">
                      <span className="text-[#B3B3C2] font-medium text-sm lg:text-base">Description:</span>
                      <span className="text-[#F5F6FA] font-medium text-sm lg:text-base break-words">{qrCode.description}</span>
                    </div>
                  )}
                </div>

                {/* Exchange Rate Info */}
                {exchangeRate && (
                  <div className="bg-[#181A20] p-4 lg:p-6 rounded-xl lg:rounded-2xl border border-[#23253B]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <div>
                        <div className="text-xs lg:text-sm text-[#B3B3C2] font-medium mb-1 lg:mb-2">Real-time Exchange Rate</div>
                        <div className="text-lg lg:text-2xl font-bold text-[#F5F6FA]">
                          1 ICP = {formatCurrency(exchangeRate.rate, exchangeRate.currency)}
                        </div>
                        <div className="text-[#885FFF] font-medium text-sm lg:text-base">Source: {exchangeRate.source}</div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-xs text-[#B3B3C2]">Last Updated</div>
                        <div className="text-xs lg:text-sm text-[#F5F6FA] font-medium">
                          {new Date(Number(exchangeRate.timestamp) / 1_000_000).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col space-y-3 lg:space-y-0 lg:flex-row lg:gap-4">
                  <button
                    onClick={handleCopyQRId}
                    className="flex-1 flex items-center justify-center space-x-3 bg-[#262840] hover:bg-[#363850] text-[#F5F6FA] px-4 lg:px-6 py-3 lg:py-4 rounded-xl lg:rounded-2xl transition-all duration-200 border border-[#23253B] hover:border-[#885FFF]/50 font-semibold text-sm lg:text-base"
                  >
                    <Share2 className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span>Share QR Code</span>
                  </button>
                </div>

                {/* Usage Info */}
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl lg:rounded-2xl p-4 lg:p-6">
                  <div className="flex items-start space-x-3 lg:space-x-4">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-amber-500/20 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Eye className="w-4 h-4 lg:w-5 lg:h-5 text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-amber-400 font-bold text-base lg:text-lg mb-2 lg:mb-3">💡 How to use this QR code:</div>
                      <ul className="text-[#F5F6FA] space-y-1.5 lg:space-y-2 text-xs lg:text-sm leading-relaxed">
                        <li className="flex items-start space-x-2">
                          <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span>Share this QR code with the person who needs to pay</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span>They can scan it with any QR scanner or Arta Wallet app</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span>Payment will be processed automatically once confirmed</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span>You'll receive the funds directly to your wallet</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 lg:py-16">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[#262840] rounded-2xl lg:rounded-3xl flex items-center justify-center mx-auto mb-6 lg:mb-8 border border-[#23253B]">
                  <QrCode className="w-8 h-8 lg:w-10 lg:h-10 text-[#B3B3C2]" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-[#F5F6FA] mb-3 lg:mb-4">Ready to Generate</h3>
                <p className="text-[#B3B3C2] mb-4 lg:mb-6 leading-relaxed max-w-md mx-auto text-sm lg:text-base px-4">
                  Fill in the payment details on the left to generate your QR code
                </p>
                <div className="inline-flex items-center space-x-2 lg:space-x-3 bg-blue-500/10 text-blue-400 px-4 lg:px-6 py-2 lg:py-3 rounded-xl lg:rounded-2xl border border-blue-500/20">
                  <Sparkles className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="font-medium text-xs lg:text-sm">Supports {supportedCurrencies.map(c => c.code).join(' • ')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QRGenerator