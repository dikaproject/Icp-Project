import React, { useState, useEffect } from 'react'
import Flag from 'react-world-flags'
import { useICP } from '../contexts/ICPContext.jsx'
import { QRCodeCanvas } from "qrcode.react"
import { QrCode, DollarSign, Clock, Copy, Check, Globe } from 'lucide-react'


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
        height: size * 0.75, 
        borderRadius: '2px',
        objectFit: 'cover'
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
      <div className="max-w-md py-20 mx-auto text-center">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">
          Connect Your Wallet
        </h2>
        <p className="text-slate-600">
          Please connect your wallet to generate QR payments
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">
          Generate QR Payment
        </h1>
        <p className="text-slate-600">
          Create a payment request with QR code for easy scanning
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Form */}
        <div className="card">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Payment Details</h2>
          
          <form onSubmit={handleGenerateQR} className="space-y-6">
            <div>
              <label className="label">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600 font-medium">
                  {getCurrencyInfo(currency).symbol}
                </span>
                <input
                  type="number"
                  step={currency === 'JPY' || currency === 'IDR' ? '1' : '0.01'}
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 input"
                  placeholder="Enter amount"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Currency</label>
              <div className="relative">
                <Globe className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="pl-10 input"
                >
                  {supportedCurrencies.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code} - {curr.name} ({curr.country})
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Currency Preview with Flag */}
              <div className="mt-2 p-3 bg-slate-50 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <FlagIcon 
                    countryCode={getCurrencyInfo(currency).countryCode} 
                    size={32} 
                  />
                  <div>
                    <div className="font-semibold text-slate-900">
                      {getCurrencyInfo(currency).name}
                    </div>
                    <div className="text-sm text-slate-600">
                      {getCurrencyInfo(currency).country} • Symbol: {getCurrencyInfo(currency).symbol}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="label">Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
                placeholder="Payment description"
                maxLength={100}
              />
            </div>

            {/* Amount Preview */}
            {amount && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-600 font-medium mb-1">Payment Amount</div>
                <div className="text-2xl font-bold text-blue-900">
                  {formatCurrency(amount, currency)}
                </div>
                <div className="text-sm text-blue-600">
                  {getCurrencyInfo(currency).name}
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 text-red-700 bg-red-100 border border-red-300 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn btn-icp disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="w-5 h-5 mr-2" />
                    Generate QR Code
                  </>
                )}
              </button>
              
              {qrCode && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary"
                >
                  Reset
                </button>
              )}
            </div>
          </form>
        </div>

        {/* QR Code Display */}
        <div className="card">
          <h2 className="mb-6 text-xl font-bold text-slate-900">QR Code</h2>
          
          {qrCode ? (
            <div className="space-y-6">
              {/* QR Code Image */}
              <div className="p-8 text-center bg-slate-100 rounded-xl border-2 border-dashed border-slate-300">
                <QRCodeCanvas
                  value={qrCode.id}
                  size={160}
                  level="H"
                  includeMargin={true}
                  className="mx-auto mb-4"
                />
                <p className="text-sm text-slate-600 mb-2">
                  Scan this QR code to complete the payment
                </p>
                <div className="flex items-center justify-center space-x-2 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>
                    Expires in {(() => {
                      const time = getTimeRemaining(qrCode.expire_time)
                      return `${time.minutes}m ${time.seconds}s`
                    })()}
                  </span>
                </div>
              </div>

              {/* Payment Info with Flag */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200">
                <div className="flex items-center space-x-3 mb-3">
                  <FlagIcon 
                    countryCode={getCurrencyInfo(qrCode.fiat_currency).countryCode} 
                    size={40} 
                  />
                  <div>
                    <div className="text-sm font-medium text-indigo-600">Payment Amount</div>
                    <div className="text-2xl font-bold text-indigo-900">
                      {formatCurrency(qrCode.fiat_amount, qrCode.fiat_currency)}
                    </div>
                    <div className="text-sm text-indigo-600">
                      {getCurrencyInfo(qrCode.fiat_currency).country}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-indigo-600">
                  ≈ {formatICP(qrCode.icp_amount)} ICP
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">QR ID:</span>
                  <div className="flex items-center space-x-2">
                    <code className="px-2 py-1 text-xs rounded bg-slate-100 font-mono">
                      {qrCode.id}
                    </code>
                    <button
                      onClick={handleCopyQRId}
                      className="text-indigo-600 hover:text-indigo-700 transition-colors"
                      title="Copy QR ID"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Status:</span>
                  <span className="font-medium text-green-600 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    Active
                  </span>
                </div>
                
                {qrCode.description && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Description:</span>
                    <span className="text-slate-900 font-medium">{qrCode.description}</span>
                  </div>
                )}
              </div>

              {exchangeRate && (
                <div className="p-4 rounded-lg bg-slate-50 border">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-600 mb-1">Exchange Rate</div>
                      <div className="text-lg font-semibold text-slate-900">
                        1 ICP = {formatCurrency(exchangeRate.rate, exchangeRate.currency)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Source: {exchangeRate.source}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(Number(exchangeRate.timestamp) / 1_000_000).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Usage Info */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="text-sm text-amber-800">
                  <div className="font-medium mb-1">💡 How to use:</div>
                  <ul className="text-xs space-y-1 list-disc list-inside">
                    <li>Share this QR code with the payer</li>
                    <li>They can scan it or enter the QR ID manually</li>
                    <li>Payment will be processed automatically</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center">
              <QrCode className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 mb-2">Generate a QR code to see it here</p>
              <p className="text-sm text-slate-400">
                Supports {supportedCurrencies.map(c => c.code).join(' • ')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default QRGenerator