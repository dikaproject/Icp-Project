import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useICP } from '../contexts/ICPContext.jsx'
import { 
  DollarSign, 
  TrendingUp, 
  QrCode, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  User,
  AlertCircle,
  Loader,
  Shuffle,
  Wallet,
  Plus,
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  Receipt,
  Zap
} from 'lucide-react'

const Dashboard = () => {
  const { 
    isAuthenticated, 
    user, 
    principal,
    login, 
    registerUser,
    getUserStats,
    getSystemStats,
    getUserTransactionSummaries,
    backend,
    isLoading: authLoading
  } = useICP()

  const [userStats, setUserStats] = useState(null)
  const [systemStats, setSystemStats] = useState(null)
  const [recentTransactions, setRecentTransactions] = useState([])
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showBalance, setShowBalance] = useState(true)

  // Registration form state
  const [registration, setRegistration] = useState({
    walletAddress: '',
    username: '',
    email: ''
  })
  const [registrationLoading, setRegistrationLoading] = useState(false)
  const [registrationError, setRegistrationError] = useState(null)

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData()
    }
  }, [isAuthenticated, user])

  const refreshBalance = async () => {
    try {
      if (backend) {
        const userBalance = await backend.getUserBalance()
        setBalance(userBalance && userBalance.length > 0 ? userBalance[0] : null)
      }
    } catch (err) {
      console.error('Error refreshing balance:', err)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch user balance
      await refreshBalance()
      
      // Fetch user stats
      const userStatsData = await getUserStats()
      setUserStats(userStatsData)
      
      // Fetch system stats
      const systemStatsData = await getSystemStats()
      setSystemStats(systemStatsData)
      
      // Fetch recent transactions
      const transactionsData = await getUserTransactionSummaries()
      setRecentTransactions(transactionsData.slice(0, 5)) // Show last 5 transactions
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleRegistration = async (e) => {
    e.preventDefault()
    setRegistrationLoading(true)
    setRegistrationError(null)

    try {
      const result = await registerUser(
        registration.walletAddress,
        registration.username,
        registration.email
      )

      if (result.success) {
        setRegistration({ walletAddress: '', username: '', email: '' })
      } else {
        setRegistrationError(result.error)
      }
    } catch (err) {
      setRegistrationError('Registration failed: ' + err.message)
    } finally {
      setRegistrationLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setRegistration({
      ...registration,
      [e.target.name]: e.target.value
    })
  }

  const formatICP = (amount) => {
    return (Number(amount) / 100_000_000).toFixed(6)
  }

  const formatBalance = (balance) => {
    if (!balance) return '0.00000000 ICP'
    return balance.formatted_balance
  }

  const formatCurrency = (amount, currency) => {
    return `${amount} ${currency}`
  }

  const getTransactionIcon = (isIncoming) => {
    return isIncoming ? (
      <ArrowDownRight className="w-4 h-4 text-emerald-400" />
    ) : (
      <ArrowUpRight className="w-4 h-4 text-rose-400" />
    )
  }

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-emerald-400" />
      case 'pending':
        return <Clock className="w-3 h-3 text-amber-400" />
      case 'failed':
        return <XCircle className="w-3 h-3 text-rose-400" />
      default:
        return <AlertTriangle className="w-3 h-3 text-slate-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'failed':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  // Auto-generate wallet address from principal
  const generateWalletAddress = () => {
    if (principal) {
      return `icp_${principal.toString().slice(0, 20)}`
    }
    return `wallet_${Math.random().toString(36).substring(2, 15)}`
  }

  // Auto-fill wallet address when component mounts
  useEffect(() => {
    if (isAuthenticated && principal && !registration.walletAddress) {
      setRegistration(prev => ({
        ...prev,
        walletAddress: generateWalletAddress()
      }))
    }
  }, [isAuthenticated, principal])

  // Show loading spinner during authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#181A20]">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] rounded-2xl animate-pulse shadow-2xl shadow-purple-500/25"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] rounded-2xl blur-lg opacity-50 animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-3">
            <Loader className="h-5 w-5 animate-spin text-[#885FFF]" />
            <span className="text-[#F5F6FA] font-medium">Loading your dashboard...</span>
          </div>
        </div>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#181A20] flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-[#222334] backdrop-blur-xl rounded-3xl p-8 border border-[#23253B] shadow-2xl shadow-black/20">
            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/25">
                  <Wallet className="h-10 w-10 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] rounded-2xl blur-2xl opacity-30 mx-auto w-20 h-20"></div>
              </div>
              
              <h1 className="text-3xl font-bold text-[#F5F6FA] mb-3">
                Welcome to Arta
              </h1>
              <p className="text-[#B3B3C2] mb-8 leading-relaxed">
                Connect your wallet to access the most elegant payment gateway on the Internet Computer
              </p>
              
              <button
                onClick={login}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-[#885FFF] to-[#59C1FF] text-white rounded-2xl py-4 px-6 font-semibold shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="flex items-center justify-center space-x-3">
                  <Wallet className="h-5 w-5" />
                  <span>Connect Wallet</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show registration form if user is not registered
  if (!user && isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#181A20] flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          <div className="bg-[#222334] backdrop-blur-xl rounded-3xl p-8 border border-[#23253B] shadow-2xl shadow-black/20">
            <div className="text-center mb-8">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/25">
                  <User className="h-10 w-10 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] rounded-2xl blur-2xl opacity-30 mx-auto w-20 h-20"></div>
              </div>
              
              <h2 className="text-3xl font-bold text-[#F5F6FA] mb-3">
                Complete Your Setup
              </h2>
              <p className="text-[#B3B3C2] leading-relaxed">
                Just a few details to get you started with Arta
              </p>
            </div>
            
            <div className="mb-8 p-6 bg-[#262840] rounded-2xl border border-[#363850]">
              <div className="text-sm text-[#B3B3C2] font-medium mb-2">Your Principal ID</div>
              <div className="text-xs font-mono text-[#885FFF] break-all bg-[#181A20] p-4 rounded-xl border border-[#23253B]">
                {principal?.toString()}
              </div>
            </div>
            
            <form onSubmit={handleRegistration} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#F5F6FA] mb-3">
                  Wallet Address *
                </label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    name="walletAddress"
                    value={registration.walletAddress}
                    onChange={handleInputChange}
                    required
                    className="flex-1 px-4 py-4 bg-[#181A20] border border-[#23253B] rounded-2xl focus:ring-2 focus:ring-[#885FFF] focus:border-[#885FFF] transition-all text-[#F5F6FA] placeholder-[#B3B3C2]"
                    placeholder="Auto-generated wallet address"
                  />
                  <button
                    type="button"
                    onClick={() => setRegistration(prev => ({
                      ...prev,
                      walletAddress: generateWalletAddress()
                    }))}
                    className="px-4 py-4 bg-[#262840] hover:bg-[#363850] border border-[#23253B] rounded-2xl transition-all text-[#B3B3C2] hover:text-[#F5F6FA]"
                    title="Generate new wallet address"
                  >
                    <Shuffle className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-[#B3B3C2] mt-2">
                  This will be used to identify your wallet for transactions
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#F5F6FA] mb-3">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={registration.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-4 bg-[#181A20] border border-[#23253B] rounded-2xl focus:ring-2 focus:ring-[#885FFF] focus:border-[#885FFF] transition-all text-[#F5F6FA] placeholder-[#B3B3C2]"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#F5F6FA] mb-3">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={registration.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-4 bg-[#181A20] border border-[#23253B] rounded-2xl focus:ring-2 focus:ring-[#885FFF] focus:border-[#885FFF] transition-all text-[#F5F6FA] placeholder-[#B3B3C2]"
                  placeholder="Enter your email"
                />
              </div>

              {registrationError && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
                  <span className="text-rose-400 text-sm">{registrationError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={registrationLoading}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-[#885FFF] to-[#59C1FF] text-white rounded-2xl py-4 px-6 font-semibold shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {registrationLoading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-3">
                    <span>Complete Setup</span>
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#181A20] p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-[#F5F6FA] mb-2">
              Welcome back, {user?.username || 'User'} 👋
            </h1>
            <p className="text-[#B3B3C2] text-lg">
              Here's your payment gateway overview
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center space-x-3 px-6 py-3 bg-[#222334] border border-[#23253B] rounded-2xl hover:bg-[#262840] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <RefreshCw className={`w-5 h-5 text-[#B3B3C2] group-hover:text-[#F5F6FA] transition-colors ${loading ? 'animate-spin text-[#885FFF]' : ''}`} />
            <span className="text-[#B3B3C2] group-hover:text-[#F5F6FA] font-medium transition-colors">Refresh</span>
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 flex items-start space-x-4">
            <AlertCircle className="h-6 w-6 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-rose-400 font-semibold text-lg">Error Loading Dashboard</h3>
              <p className="text-rose-300 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Balance Card - Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#262840] via-[#222334] to-[#262840] rounded-2xl lg:rounded-3xl p-6 lg:p-8 border border-[#23253B] shadow-2xl shadow-black/20">
          {/* Gradient Orbs */}
          <div className="absolute top-0 right-0 w-32 h-32 lg:w-40 lg:h-40 bg-gradient-to-br from-[#885FFF]/20 to-[#59C1FF]/20 rounded-full blur-3xl -mr-16 lg:-mr-20 -mt-16 lg:-mt-20"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-tr from-[#59C1FF]/20 to-[#885FFF]/20 rounded-full blur-3xl -ml-12 lg:-ml-16 -mb-12 lg:-mb-16"></div>
          
          <div className="relative">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-6 lg:mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Wallet className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-lg lg:text-xl font-bold text-[#F5F6FA]">Current Balance</h2>
                  <p className="text-sm text-[#B3B3C2]">Your available funds</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-2 lg:p-3 hover:bg-white/5 rounded-xl transition-all duration-200 group"
                >
                  {showBalance ? (
                    <Eye className="w-5 h-5 lg:w-6 lg:h-6 text-[#B3B3C2] group-hover:text-[#F5F6FA] transition-colors" />
                  ) : (
                    <EyeOff className="w-5 h-5 lg:w-6 lg:h-6 text-[#B3B3C2] group-hover:text-[#F5F6FA] transition-colors" />
                  )}
                </button>
                <button
                  onClick={refreshBalance}
                  className="p-2 lg:p-3 hover:bg-white/5 rounded-xl transition-all duration-200 group"
                >
                  <RefreshCw className="w-5 h-5 lg:w-6 lg:h-6 text-[#B3B3C2] group-hover:text-[#F5F6FA] group-hover:rotate-180 transition-all duration-300" />
                </button>
              </div>
            </div>
            
            {/* Balance Display */}
            <div className="mb-6 lg:mb-8">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between lg:space-x-6">
                <div className="mb-4 lg:mb-0">
                  <div className="text-4xl lg:text-6xl font-bold text-[#F5F6FA] mb-2 tracking-tight">
                    {showBalance ? formatBalance(balance) : '••••••••'}
                  </div>
                  <div className="flex items-center space-x-2 text-[#B3B3C2]">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      Last updated: {balance ? new Date(Number(balance.last_updated) / 1000000).toLocaleString() : 'Never'}
                    </span>
                  </div>
                </div>
                
                {/* Balance Status Indicator */}
                <div className="flex items-center space-x-3 bg-[#181A20]/50 backdrop-blur-sm border border-[#23253B] rounded-xl lg:rounded-2xl px-4 lg:px-6 py-3 lg:py-4">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  <div>
                    <div className="text-xs lg:text-sm text-[#B3B3C2] font-medium">Status</div>
                    <div className="text-sm lg:text-base text-emerald-400 font-semibold">Active</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
              <Link
                to="/topup"
                className="flex-1 group relative overflow-hidden bg-gradient-to-r from-[#885FFF] to-[#59C1FF] text-white rounded-xl lg:rounded-2xl py-4 lg:py-5 px-6 lg:px-8 font-bold text-base lg:text-lg shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="flex items-center justify-center space-x-3">
                  <Plus className="w-5 h-5 lg:w-6 lg:h-6" />
                  <span>Top Up Balance</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </Link>
              
              <Link
                to="/generate"
                className="flex-1 sm:flex-none sm:px-6 lg:px-8 flex items-center justify-center space-x-3 bg-[#181A20]/70 border border-[#23253B] text-[#F5F6FA] rounded-xl lg:rounded-2xl py-4 lg:py-5 px-6 font-semibold hover:bg-[#262840] hover:border-[#885FFF]/50 transition-all duration-200 text-base lg:text-lg"
              >
                <QrCode className="w-5 h-5 lg:w-6 lg:h-6" />
                <span className="hidden sm:inline">Request Payment</span>
                <span className="sm:hidden">Generate QR</span>
              </Link>
            </div>
            
            {/* Quick Stats */}
            <div className="mt-6 lg:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#181A20]/50 backdrop-blur-sm border border-[#23253B] rounded-xl p-4 text-center">
                <div className="text-lg lg:text-xl font-bold text-emerald-400 mb-1">
                  {userStats ? Number(userStats.transaction_count) : 0}
                </div>
                <div className="text-xs lg:text-sm text-[#B3B3C2] font-medium">Transactions</div>
              </div>
              
              <div className="bg-[#181A20]/50 backdrop-blur-sm border border-[#23253B] rounded-xl p-4 text-center">
                <div className="text-lg lg:text-xl font-bold text-blue-400 mb-1">
                  {userStats ? Number(userStats.qr_codes_generated) : 0}
                </div>
                <div className="text-xs lg:text-sm text-[#B3B3C2] font-medium">QR Codes</div>
              </div>
              
              <div className="bg-[#181A20]/50 backdrop-blur-sm border border-[#23253B] rounded-xl p-4 text-center">
                <div className="text-lg lg:text-xl font-bold text-rose-400 mb-1">
                  {userStats ? formatICP(userStats.total_sent).split('.')[0] : '0'}
                </div>
                <div className="text-xs lg:text-sm text-[#B3B3C2] font-medium">ICP Sent</div>
              </div>
              
              <div className="bg-[#181A20]/50 backdrop-blur-sm border border-[#23253B] rounded-xl p-4 text-center">
                <div className="text-lg lg:text-xl font-bold text-purple-400 mb-1">
                  {userStats ? formatICP(userStats.total_received).split('.')[0] : '0'}
                </div>
                <div className="text-xs lg:text-sm text-[#B3B3C2] font-medium">ICP Received</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#222334] p-6 rounded-3xl border border-[#23253B] hover:border-[#363850] transition-all duration-300 group hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#B3B3C2] text-sm font-medium mb-2">Total Sent</p>
                <p className="text-3xl font-bold text-[#F5F6FA] mb-1">
                  {userStats ? formatICP(userStats.total_sent) : '0'}
                </p>
                <p className="text-[#885FFF] text-sm font-medium">ICP</p>
              </div>
              <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowUpRight className="w-7 h-7 text-rose-400" />
              </div>
            </div>
          </div>

          <div className="bg-[#222334] p-6 rounded-3xl border border-[#23253B] hover:border-[#363850] transition-all duration-300 group hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#B3B3C2] text-sm font-medium mb-2">Total Received</p>
                <p className="text-3xl font-bold text-[#F5F6FA] mb-1">
                  {userStats ? formatICP(userStats.total_received) : '0'}
                </p>
                <p className="text-[#885FFF] text-sm font-medium">ICP</p>
              </div>
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowDownRight className="w-7 h-7 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-[#222334] p-6 rounded-3xl border border-[#23253B] hover:border-[#363850] transition-all duration-300 group hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#B3B3C2] text-sm font-medium mb-2">Transactions</p>
                <p className="text-3xl font-bold text-[#F5F6FA] mb-1">
                  {userStats ? Number(userStats.transaction_count) : 0}
                </p>
                <p className="text-[#885FFF] text-sm font-medium">All time</p>
              </div>
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="w-7 h-7 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-[#222334] p-6 rounded-3xl border border-[#23253B] hover:border-[#363850] transition-all duration-300 group hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#B3B3C2] text-sm font-medium mb-2">QR Codes</p>
                <p className="text-3xl font-bold text-[#F5F6FA] mb-1">
                  {userStats ? Number(userStats.qr_codes_generated) : 0}
                </p>
                <p className="text-[#885FFF] text-sm font-medium">Generated</p>
              </div>
              <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <QrCode className="w-7 h-7 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/topup" className="group bg-[#222334] p-8 rounded-3xl border border-[#23253B] hover:border-[#885FFF]/50 hover:bg-[#262840] transition-all duration-300 hover:scale-[1.02]">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-purple-500/25">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F6FA] mb-3">Top Up Balance</h3>
              <p className="text-[#B3B3C2] leading-relaxed">Add funds to your wallet securely and instantly</p>
            </div>
          </Link>

          <Link to="/generate" className="group bg-[#222334] p-8 rounded-3xl border border-[#23253B] hover:border-[#885FFF]/50 hover:bg-[#262840] transition-all duration-300 hover:scale-[1.02]">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-emerald-500/25">
                <QrCode className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F6FA] mb-3">Generate QR</h3>
              <p className="text-[#B3B3C2] leading-relaxed">Create payment requests with beautiful QR codes</p>
            </div>
          </Link>

          <Link to="/scan" className="group bg-[#222334] p-8 rounded-3xl border border-[#23253B] hover:border-[#885FFF]/50 hover:bg-[#262840] transition-all duration-300 hover:scale-[1.02]">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-rose-500/25">
                <Send className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F6FA] mb-3">Scan & Pay</h3>
              <p className="text-[#B3B3C2] leading-relaxed">Scan QR codes to make instant payments</p>
            </div>
          </Link>

          <Link to="/history" className="group bg-[#222334] p-8 rounded-3xl border border-[#23253B] hover:border-[#885FFF]/50 hover:bg-[#262840] transition-all duration-300 hover:scale-[1.02]">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-amber-500/25">
                <Receipt className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F6FA] mb-3">Transaction History</h3>
              <p className="text-[#B3B3C2] leading-relaxed">View and analyze all your past transactions</p>
            </div>
          </Link>
        </div>

        {/* Recent Transactions */}
        <div className="bg-[#222334] rounded-2xl lg:rounded-3xl border border-[#23253B] overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-[#23253B]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl lg:text-2xl font-bold text-[#F5F6FA]">Recent Transactions</h2>
              <Link 
                to="/history" 
                className="text-[#885FFF] hover:text-[#59C1FF] font-semibold flex items-center space-x-2 transition-colors group self-start sm:self-auto"
              >
                <span className="text-sm lg:text-base">View All</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="p-4 lg:p-8">
            {loading ? (
              <div className="space-y-3 lg:space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center space-x-3 lg:space-x-4 p-4 lg:p-6 bg-[#181A20] rounded-xl lg:rounded-2xl">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#262840] rounded-xl lg:rounded-2xl flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="h-3 lg:h-4 bg-[#262840] rounded-xl w-3/4 mb-2 lg:mb-3"></div>
                        <div className="h-2 lg:h-3 bg-[#262840] rounded-xl w-1/2"></div>
                      </div>
                      <div className="w-16 lg:w-20">
                        <div className="h-3 lg:h-4 bg-[#262840] rounded-xl mb-1 lg:mb-2"></div>
                        <div className="h-2 lg:h-3 bg-[#262840] rounded-xl"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-12 lg:py-16">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[#262840] rounded-xl lg:rounded-2xl flex items-center justify-center mx-auto mb-4 lg:mb-6">
                  <Activity className="w-8 h-8 lg:w-10 lg:h-10 text-[#B3B3C2]" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-[#F5F6FA] mb-3">No transactions yet</h3>
                <p className="text-[#B3B3C2] mb-6 lg:mb-8 leading-relaxed max-w-md mx-auto text-sm lg:text-base px-4">
                  Start by generating a QR payment code or topping up your balance to get started
                </p>
                <Link
                  to="/generate"
                  className="group relative overflow-hidden bg-gradient-to-r from-[#885FFF] to-[#59C1FF] text-white rounded-xl lg:rounded-2xl py-3 lg:py-4 px-6 lg:px-8 font-semibold shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105 inline-flex items-center space-x-3 text-sm lg:text-base"
                >
                  <QrCode className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="hidden sm:inline">Generate Your First QR Code</span>
                  <span className="sm:hidden">Generate QR</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 lg:space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 lg:p-6 bg-[#181A20] rounded-xl lg:rounded-2xl hover:bg-[#262840] transition-all duration-200 border border-[#23253B] hover:border-[#363850] space-y-4 lg:space-y-0">
                    <div className="flex items-center space-x-3 lg:space-x-4 min-w-0 flex-1">
                      <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        transaction.is_incoming ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                      }`}>
                        {getTransactionIcon(transaction.is_incoming)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[#F5F6FA] text-base lg:text-lg mb-1 truncate">
                          {transaction.is_incoming ? 'Received Payment' : 'Sent Payment'}
                        </div>
                        <div className="text-[#B3B3C2] flex flex-col sm:flex-row sm:items-center sm:space-x-2 text-xs lg:text-sm">
                          <span>{new Date(Number(transaction.timestamp) / 1000000).toLocaleDateString()}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{new Date(Number(transaction.timestamp) / 1000000).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end space-y-3 sm:space-y-0 sm:space-x-4 lg:space-x-6">
                      <div className="text-left lg:text-right">
                        <div className="font-bold text-[#F5F6FA] text-base lg:text-lg">
                          {formatCurrency(transaction.amount_fiat, transaction.currency)}
                        </div>
                        <div className="text-[#B3B3C2] text-sm">
                          {transaction.amount_icp} ICP
                        </div>
                      </div>
                      
                      <div className={`flex items-center space-x-2 px-3 lg:px-4 py-2 rounded-xl text-xs lg:text-sm font-medium border self-start sm:self-auto ${getStatusColor(transaction.status)}`}>
                        {getStatusIcon(transaction.status)}
                        <span>{transaction.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Stats */}
        {systemStats && (
          <div className="bg-[#222334] rounded-3xl border border-[#23253B] p-8">
            <h2 className="text-2xl font-bold text-[#F5F6FA] mb-8">Network Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-[#181A20] rounded-2xl border border-[#23253B]">
                <div className="text-4xl font-bold text-[#885FFF] mb-2">{Number(systemStats.total_users)}</div>
                <div className="text-[#B3B3C2] font-medium">Total Users</div>
              </div>
              <div className="text-center p-6 bg-[#181A20] rounded-2xl border border-[#23253B]">
                <div className="text-4xl font-bold text-emerald-400 mb-2">{Number(systemStats.total_transactions)}</div>
                <div className="text-[#B3B3C2] font-medium">Total Transactions</div>
              </div>
              <div className="text-center p-6 bg-[#181A20] rounded-2xl border border-[#23253B]">
                <div className="text-4xl font-bold text-[#59C1FF] mb-2">{Number(systemStats.completed_transactions)}</div>
                <div className="text-[#B3B3C2] font-medium">Completed</div>
              </div>
              <div className="text-center p-6 bg-[#181A20] rounded-2xl border border-[#23253B]">
                <div className="text-4xl font-bold text-amber-400 mb-2">{Number(systemStats.cached_exchange_rates)}</div>
                <div className="text-[#B3B3C2] font-medium">Cached Rates</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard