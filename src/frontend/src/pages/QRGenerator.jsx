import React, { useState, useEffect } from 'react'
import { useICP } from '../contexts/ICPContext.jsx'
import { QRCodeCanvas } from "qrcode.react"
import { QrCode, DollarSign, Clock, Copy, Check } from 'lucide-react'


const QRGenerator = () => {
  const { backend, isAuthenticated } = useICP()
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [qrCode, setQrCode] = useState(null)
  const [exchangeRate, setExchangeRate] = useState(null)
  const [supportedCurrencies, setSupportedCurrencies] = useState([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (backend && isAuthenticated) {
      fetchSupportedCurrencies()
    }
  }, [backend, isAuthenticated])

  const fetchSupportedCurrencies = async () => {
    if (!backend) return
    
    try {
      const currencies = await backend.getSupportedCurrencies()
      setSupportedCurrencies(currencies)
    } catch (error) {
      console.error('Error fetching supported currencies:', error)
    }
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
                <DollarSign className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10 input"
                  placeholder="Enter amount"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="input"
              >
                {supportedCurrencies.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
                placeholder="Payment description"
              />
            </div>

            {error && (
              <div className="p-3 text-red-700 bg-red-100 border border-red-300 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn btn-icp disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate QR Code'}
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
              {/* ✅ Real QR Code Image */}
              <div className="p-8 text-center bg-slate-100 rounded-xl">
                <QRCodeCanvas
                  value={qrCode.id}
                  size={128}
                  level="H"
                  includeMargin={true}
                  className="mx-auto mb-4"
                />
                <p className="text-sm text-slate-600">
                  Scan this QR code to complete the payment
                </p>
              </div>

              {/* Payment Info */}
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-icp-50">
                  <div className="text-sm font-medium text-icp-600">Payment Amount</div>
                  <div className="text-2xl font-bold text-icp-900">
                    {qrCode.fiat_amount} {qrCode.fiat_currency}
                  </div>
                  <div className="text-sm text-icp-600">
                    ≈ {formatICP(qrCode.icp_amount)} ICP
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">QR ID:</span>
                    <div className="flex items-center space-x-2">
                      <code className="px-2 py-1 text-xs rounded bg-slate-100">
                        {qrCode.id}
                      </code>
                      <button
                        onClick={handleCopyQRId}
                        className="text-icp-600 hover:text-icp-700"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Status:</span>
                    <span className="font-medium text-green-600">Active</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Expires:</span>
                    <div className="flex items-center space-x-1 text-orange-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        {(() => {
                          const time = getTimeRemaining(qrCode.expire_time)
                          return `${time.minutes}m ${time.seconds}s`
                        })()}
                      </span>
                    </div>
                  </div>
                  
                  {qrCode.description && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Description:</span>
                      <span className="text-slate-900">{qrCode.description}</span>
                    </div>
                  )}
                </div>
              </div>

              {exchangeRate && (
                <div className="p-4 rounded-lg bg-slate-50">
                  <div className="mb-2 text-sm text-slate-600">Exchange Rate</div>
                  <div className="text-lg font-semibold text-slate-900">
                    1 ICP = {exchangeRate.rate} {exchangeRate.currency}
                  </div>
                  <div className="text-xs text-slate-500">
                    Source: {exchangeRate.source}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center">
              <QrCode className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">Generate a QR code to see it here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default QRGenerator