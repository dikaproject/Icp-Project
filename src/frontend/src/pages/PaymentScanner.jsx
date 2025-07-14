import React, { useState } from 'react'
import { useICP } from '../contexts/ICPContext.jsx'
import { ScanLine, AlertCircle, CheckCircle, DollarSign } from 'lucide-react'

const PaymentScanner = () => {
  const { backend, isAuthenticated } = useICP()
  const [qrId, setQrId] = useState('')
  const [qrInfo, setQrInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  const handleValidateQR = async (e) => {
    e.preventDefault()
    
    if (!backend || !qrId.trim()) {
      setError('Please enter a valid QR ID')
      return
    }

    setLoading(true)
    setError('')
    setPaymentSuccess(false)
    
    try {
      const result = await backend.validateQRCode(qrId.trim())
      
      if (result.Err) {
        setError(result.Err)
        setQrInfo(null)
        return
      }
      
      setQrInfo(result.Ok)
      
    } catch (error) {
      setError('Failed to validate QR code')
      console.error('Error validating QR:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!backend || !qrId.trim()) return

    setPaymentLoading(true)
    setError('')
    
    try {
      const result = await backend.processPayment(qrId.trim())
      
      if (result.Err) {
        setError(result.Err)
        return
      }
      
      setPaymentSuccess(true)
      setQrInfo(null)
      setQrId('')
      
    } catch (error) {
      setError('Failed to process payment')
      console.error('Error processing payment:', error)
    } finally {
      setPaymentLoading(false)
    }
  }

  const formatICP = (amount) => {
    return (Number(amount) / 100_000_000).toFixed(6)
  }

  const getTimeRemaining = (seconds) => {
    if (!seconds) return 'Expired'
    const remaining = Number(seconds)
    const minutes = Math.floor(remaining / 60)
    const secs = remaining % 60
    return `${minutes}m ${secs}s`
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Connect Your Wallet
        </h2>
        <p className="text-slate-600">
          Please connect your wallet to scan and pay
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Scan & Pay
        </h1>
        <p className="text-slate-600">
          Enter QR code ID to validate and process payment
        </p>
      </div>

      <div className="space-y-6">
        {/* QR Input Form */}
        <div className="card">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Enter QR Code ID</h2>
          
          <form onSubmit={handleValidateQR} className="space-y-4">
            <div>
              <label className="label">QR Code ID</label>
              <div className="relative">
                <ScanLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={qrId}
                  onChange={(e) => setQrId(e.target.value)}
                  className="input pl-10"
                  placeholder="Enter QR code ID (e.g., ABC123XYZ456)"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Validating...' : 'Validate QR Code'}
            </button>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="card bg-red-50 border-red-200">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="font-medium text-red-900">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Success */}
        {paymentSuccess && (
          <div className="card bg-green-50 border-green-200">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <h3 className="font-medium text-green-900">Payment Successful!</h3>
                <p className="text-green-700">Transaction has been processed successfully</p>
              </div>
            </div>
          </div>
        )}

        {/* QR Information */}
        {qrInfo && (
          <div className="card">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Payment Details</h2>
            
            <div className="space-y-4">
              <div className="bg-icp-50 p-4 rounded-lg">
                <div className="text-sm text-icp-600 font-medium">Payment Amount</div>
                <div className="text-2xl font-bold text-icp-900">
                  {qrInfo.fiat_amount} {qrInfo.fiat_currency}
                </div>
                <div className="text-sm text-icp-600">
                  ≈ {formatICP(qrInfo.icp_amount)} ICP
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">QR ID:</span>
                  <div className="font-mono text-slate-900">{qrInfo.id}</div>
                </div>
                
                <div>
                  <span className="text-slate-600">Status:</span>
                  <div className={`font-medium ${
                    qrInfo.is_expired ? 'text-red-600' : 
                    qrInfo.is_used ? 'text-gray-600' : 'text-green-600'
                  }`}>
                    {qrInfo.is_expired ? 'Expired' : 
                     qrInfo.is_used ? 'Used' : 'Active'}
                  </div>
                </div>
                
                <div>
                  <span className="text-slate-600">Time Remaining:</span>
                  <div className="font-medium text-orange-600">
                    {getTimeRemaining(qrInfo.time_remaining_seconds)}
                  </div>
                </div>
                
                {qrInfo.description && (
                  <div className="col-span-2">
                    <span className="text-slate-600">Description:</span>
                    <div className="font-medium text-slate-900">{qrInfo.description}</div>
                  </div>
                )}
              </div>
              
              {!qrInfo.is_expired && !qrInfo.is_used && (
                <div className="pt-4 border-t">
                  <button
                    onClick={handlePayment}
                    disabled={paymentLoading}
                    className="btn btn-icp w-full disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <DollarSign className="w-5 h-5" />
                    <span>
                      {paymentLoading ? 'Processing Payment...' : 'Pay Now'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="card bg-slate-50">
          <h3 className="font-medium text-slate-900 mb-3">How to use:</h3>
          <ol className="space-y-2 text-sm text-slate-600">
            <li>1. Get the QR code ID from the payment request</li>
            <li>2. Enter the ID in the input field above</li>
            <li>3. Click "Validate QR Code" to check payment details</li>
            <li>4. Review the payment information</li>
            <li>5. Click "Pay Now" to complete the transaction</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default PaymentScanner
