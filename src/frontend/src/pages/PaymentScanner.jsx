import React, { useState, useRef } from 'react'
import { useICP } from '../contexts/ICPContext.jsx'
import Webcam from 'react-webcam'
import jsQR from 'jsqr'
import QRScannerModal from '../components/modal/QRScannerModal.jsx'
import {
  ScanLine,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Camera,
  Wallet,
  Timer,
  Shield,
  Receipt,
  Eye,
  Loader,
  Zap,
  ArrowRight,
  Clock,
  CheckSquare,
  XCircle,
  Sparkles
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
      console.log('🔍 BEFORE PAYMENT: Getting current balance...')
      const balanceBefore = await backend.getUserBalance()
      console.log('💰 Balance before payment:', balanceBefore)

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

        // ENHANCED: Debug balance refresh
        if (backend) {
          try {
            // Wait for balance logs to be processed
            await new Promise(resolve => setTimeout(resolve, 3000))
            
            console.log('🔍 AFTER PAYMENT: Getting updated balance...')
            const balanceAfter = await backend.getUserBalance()
            console.log('💰 Balance after payment:', balanceAfter)
            
            // Get balance history for debugging
            const balanceHistory = await backend.getUserBalanceHistory()
            console.log('📜 Balance history:', balanceHistory)
            
            // Trigger balance update event
            window.dispatchEvent(new CustomEvent('balance-updated', { 
              detail: { 
                userBalance: balanceAfter,
                balanceHistory 
              } 
            }))
            
          } catch (err) {
            console.error('Error refreshing balance after payment:', err)
          }
        }

        // Redirect dengan delay
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
      setError('Payment may have been processed. Please check your transaction history.')
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

  const getStatusIcon = (qrInfo) => {
    if (qrInfo.is_expired) return <XCircle className="w-5 h-5 text-rose-400" />
    if (qrInfo.is_used) return <CheckSquare className="w-5 h-5 text-slate-400" />
    return <CheckCircle className="w-5 h-5 text-emerald-400" />
  }

  const getStatusColor = (qrInfo) => {
    if (qrInfo.is_expired) return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    if (qrInfo.is_used) return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  }

  const getStatusText = (qrInfo) => {
    if (qrInfo.is_expired) return 'Expired'
    if (qrInfo.is_used) return 'Used'
    return 'Active'
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#181A20] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-purple-500/25">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-[#F5F6FA] mb-4">Authentication Required</h2>
          <p className="text-[#B3B3C2] mb-8 leading-relaxed">Please connect your wallet to scan and pay for QR codes</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#181A20] p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/25">
              <ScanLine className="w-10 h-10 text-white" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur-2xl opacity-30 mx-auto w-20 h-20"></div>
          </div>
          
          <h1 className="text-4xl font-bold text-[#F5F6FA] mb-4">
            Scan & Pay
          </h1>
          <p className="text-[#B3B3C2] text-lg leading-relaxed max-w-2xl mx-auto">
            Enter QR code ID to validate payment details and process transactions securely on the Internet Computer network.
          </p>
        </div>

        {/* QR Input Form */}
        <div className="bg-[#222334] rounded-3xl border border-[#23253B] p-8 shadow-2xl shadow-black/20">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#F5F6FA]">Enter QR Code ID</h2>
          </div>

          <form onSubmit={handleValidateQR} className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <ScanLine className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-[#B3B3C2] z-10" />
                <input
                  type="text"
                  value={qrId}
                  onChange={(e) => setQrId(e.target.value)}
                  className="w-full pl-16 pr-6 py-6 bg-[#181A20] border border-[#23253B] rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-[#F5F6FA] placeholder-[#B3B3C2] text-lg font-medium"
                  placeholder="Enter QR code ID (e.g., ABC123XYZ456)"
                  required
                />
              </div>
              
              <button
                type="button"
                onClick={() => setShowWebcam(true)}
                className="flex items-center justify-center px-6 py-6 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-200 font-semibold border border-orange-500/30"
                title="Scan via Camera"
              >
                <Camera className="w-6 h-6" />
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl py-6 px-8 font-bold text-lg shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-3">
                  <Loader className="w-6 h-6 animate-spin" />
                  <span>Validating QR Code...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <Shield className="w-6 h-6" />
                  <span>Validate QR Code</span>
                  <ArrowRight className="w-6 h-6" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
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
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 flex items-start space-x-4">
            <AlertCircle className="h-6 w-6 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-rose-400 font-semibold text-lg">Validation Error</h3>
              <p className="text-rose-300 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Payment Success */}
        {paymentSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-emerald-400 mb-3">Payment Successful!</h3>
              <p className="text-emerald-300 leading-relaxed mb-6">
                Your transaction has been processed successfully and will be reflected in your wallet balance.
              </p>
              <div className="inline-flex items-center space-x-3 bg-emerald-500/10 text-emerald-400 px-6 py-3 rounded-2xl border border-emerald-500/20">
                <Timer className="w-5 h-5" />
                <span className="font-medium">Redirecting to dashboard...</span>
              </div>
            </div>
          </div>
        )}

        {/* QR Information */}
        {qrInfo && (
          <div className="bg-[#222334] rounded-3xl border border-[#23253B] p-8 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-[#F5F6FA]">Payment Details</h2>
              </div>
              
              <span className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium border ${getStatusColor(qrInfo)}`}>
                {getStatusIcon(qrInfo)}
                <span>{getStatusText(qrInfo)}</span>
              </span>
            </div>

            <div className="space-y-8">
              {/* Payment Amount Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-[#262840] via-[#222334] to-[#262840] p-8 rounded-3xl border border-[#23253B]">
                {/* Gradient Orbs */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#885FFF]/20 to-[#59C1FF]/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#59C1FF]/20 to-[#885FFF]/20 rounded-full blur-3xl -ml-12 -mb-12"></div>
                
                <div className="relative">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/25">
                      <DollarSign className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#B3B3C2] mb-1">Payment Request</div>
                      <div className="text-4xl font-bold text-[#F5F6FA]">
                        {qrInfo.fiat_amount} {qrInfo.fiat_currency}
                      </div>
                      <div className="text-[#885FFF] font-semibold text-lg">
                        ≈ {formatICP(qrInfo.icp_amount)} ICP
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-[#181A20] p-6 rounded-2xl border border-[#23253B]">
                    <div className="text-sm font-medium text-[#B3B3C2] mb-2">QR Payment ID</div>
                    <div className="font-mono text-[#F5F6FA] text-lg break-all">{qrInfo.id}</div>
                  </div>
                  
                  <div className="bg-[#181A20] p-6 rounded-2xl border border-[#23253B]">
                    <div className="text-sm font-medium text-[#B3B3C2] mb-2">Time Remaining</div>
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-amber-400" />
                      <span className="font-bold text-amber-400 text-lg">
                        {getTimeRemaining(qrInfo.time_remaining_seconds)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-[#181A20] p-6 rounded-2xl border border-[#23253B]">
                    <div className="text-sm font-medium text-[#B3B3C2] mb-2">Payment Status</div>
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(qrInfo)}
                      <span className={`font-bold text-lg ${
                        qrInfo.is_expired ? 'text-rose-400' :
                        qrInfo.is_used ? 'text-slate-400' : 'text-emerald-400'
                      }`}>
                        {getStatusText(qrInfo)}
                      </span>
                    </div>
                  </div>
                  
                  {qrInfo.description && (
                    <div className="bg-[#181A20] p-6 rounded-2xl border border-[#23253B]">
                      <div className="text-sm font-medium text-[#B3B3C2] mb-2">Description</div>
                      <div className="text-[#F5F6FA] font-medium">{qrInfo.description}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Button */}
              {!qrInfo.is_expired && !qrInfo.is_used && (
                <div className="pt-6 border-t border-[#23253B]">
                  <button
                    onClick={handlePayment}
                    disabled={paymentLoading}
                    className="w-full group relative overflow-hidden bg-gradient-to-r from-[#885FFF] to-[#59C1FF] text-white rounded-2xl py-6 px-8 font-bold text-lg shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {paymentLoading ? (
                      <div className="flex items-center justify-center space-x-3">
                        <Loader className="w-6 h-6 animate-spin" />
                        <span>Processing Payment...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-3">
                        <Zap className="w-6 h-6" />
                        <span>Pay {qrInfo.fiat_amount} {qrInfo.fiat_currency} Now</span>
                        <ArrowRight className="w-6 h-6" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-3xl p-8">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-blue-400 font-bold text-xl mb-6">💡 How to scan and pay:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ol className="space-y-4 text-[#F5F6FA]">
                  <li className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-400 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <div className="font-semibold">Get QR Code ID</div>
                      <div className="text-[#B3B3C2] text-sm">Obtain the QR code ID from the payment request</div>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-400 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <div className="font-semibold">Enter or Scan</div>
                      <div className="text-[#B3B3C2] text-sm">Type the ID manually or use camera to scan</div>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-400 font-bold text-sm">3</span>
                    </div>
                    <div>
                      <div className="font-semibold">Validate Details</div>
                      <div className="text-[#B3B3C2] text-sm">Click validate to check payment information</div>
                    </div>
                  </li>
                </ol>
                
                <ol className="space-y-4 text-[#F5F6FA]" start="4">
                  <li className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-400 font-bold text-sm">4</span>
                    </div>
                    <div>
                      <div className="font-semibold">Review Payment</div>
                      <div className="text-[#B3B3C2] text-sm">Check amount, currency, and expiration time</div>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-400 font-bold text-sm">5</span>
                    </div>
                    <div>
                      <div className="font-semibold">Complete Payment</div>
                      <div className="text-[#B3B3C2] text-sm">Click "Pay Now" to process the transaction</div>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-emerald-400">Transaction Complete</div>
                      <div className="text-emerald-300 text-sm">Payment processed and balance updated</div>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentScanner