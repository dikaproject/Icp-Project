import React, { useState, useRef } from 'react'
import { useICP } from '../contexts/ICPContext.jsx'
import Webcam from 'react-webcam'
import jsQR from 'jsqr'
import QRScannerModal from '../components/modal/QRScannerModal.jsx'
import {
  ScanLine,
  AlertCircle,
  CheckCircle,
  DollarSign
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const PaymentScanner = () => {
  const { backend, isAuthenticated } = useICP()
  const [qrId, setQrId] = useState('')
  const [qrInfo, setQrInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [showWebcam, setShowWebcam] = useState(false)
  const navigate = useNavigate()

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

  // Update handlePayment untuk refresh balance yang lebih reliable
  const handlePayment = async () => {
    if (!backend || !qrId.trim()) return

    setPaymentLoading(true)
    setError('')

    try {
      console.log('Processing payment for QR ID:', qrId.trim())
      const result = await backend.processPayment(qrId.trim())
      console.log('Payment result:', result)

      if (result.Err) {
        setError(result.Err)
        return
      }

      if (result.Ok) {
        console.log('Payment successful! Transaction:', result.Ok)
        setPaymentSuccess(true)
        setQrInfo(null)
        setQrId('')

        // Refresh balance setelah payment sukses dengan multiple attempts
        if (backend) {
          try {
            // Wait 2 seconds untuk memastikan balance logs sudah diupdate
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            // Refresh balance menggunakan balance logs
            const userBalance = await backend.getUserBalance()
            console.log('Balance refreshed after payment:', userBalance)
            
            // Trigger custom event untuk refresh dashboard
            window.dispatchEvent(new CustomEvent('balance-updated', { 
              detail: { userBalance } 
            }))
            
            // Refresh user stats juga
            const userStats = await backend.getUserStats()
            console.log('Stats refreshed after payment:', userStats)
            
          } catch (err) {
            console.error('Error refreshing balance after payment:', err)
          }
        }

        // Redirect dengan delay lebih lama
        setTimeout(() => {
          navigate('/dashboard', { 
            state: { message: 'Payment completed successfully!' }
          })
        }, 3000)
      } else {
        setError('Unexpected response format')
      }
    } catch (error) {
      console.error('Payment processing error:', error)
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      })

      // Handle specific errors
      if (error.message.includes('type mismatch')) {
        setError('Payment processed but response format error. Please refresh the page.')
      } else if (error.message.includes('principal')) {
        setError('Authentication error. Please reconnect your wallet.')
      } else {
        setError('Payment may have been processed. Please check your transaction history.')
      }
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
      <div className="max-w-md py-20 mx-auto text-center">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">
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
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">
          Scan & Pay
        </h1>
        <p className="text-slate-600">
          Enter QR code ID to validate and process payment
        </p>
      </div>

      <div className="space-y-6">
        {/* QR Input Form */}
        <div className="card">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Enter QR Code ID</h2>

          <form onSubmit={handleValidateQR} className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative w-11/12">
                <ScanLine className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                <input
                  type="text"
                  value={qrId}
                  onChange={(e) => setQrId(e.target.value)}
                  className="w-full pl-10 input"
                  placeholder="Enter QR code ID (e.g., ABC123XYZ456)"
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => setShowWebcam(true)}
                title="Scan via Camera"
                className="flex items-center justify-center w-1/12 p-2 btn btn-secondary"
              >
                📷
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary disabled:opacity-50"
            >
              {loading ? 'Validating...' : 'Validate QR Code'}
            </button>
          </form>
        </div>

        {/* Webcam Scanner */}
        {showWebcam && (
          <QRScannerModal
            onClose={() => setShowWebcam(false)}
            onScan={(scannedData) => {
              setQrId(scannedData)
              // Do not auto-validate, just fill the field
            }}
          />
        )}

        {/* Error Display */}
        {error && (
          <div className="border-red-200 card bg-red-50">
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
          <div className="border-green-200 card bg-green-50">
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
            <h2 className="mb-6 text-xl font-bold text-slate-900">Payment Details</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-icp-50">
                <div className="text-sm font-medium text-icp-600">Payment Amount</div>
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
                  <div className={`font-medium ${qrInfo.is_expired ? 'text-red-600' :
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
                    className="flex items-center justify-center w-full space-x-2 btn btn-icp disabled:opacity-50"
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
          <h3 className="mb-3 font-medium text-slate-900">How to use:</h3>
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