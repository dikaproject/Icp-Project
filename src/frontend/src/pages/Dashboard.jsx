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
  Plus
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch user balance
      if (backend) {
        const userBalance = await backend.getUserBalance()
        setBalance(userBalance[0] || null)
      }
      
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
        // Data will be updated automatically through context
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
      <ArrowDownRight className="w-5 h-5 text-green-600" />
    ) : (
      <ArrowUpRight className="w-5 h-5 text-red-600" />
    )
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center space-x-2">
          <Loader className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="text-center py-20">
        <div className="max-w-md mx-auto">
          <User className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-slate-600 mb-8">
            Please connect your wallet to access the dashboard
          </p>
          <button
            onClick={login}
            className="btn btn-primary"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    )
  }

  // Show registration form if user is not registered
  if (!user && isAuthenticated) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            Complete Registration
          </h2>
          <p className="text-slate-600 mb-6 text-center">
            Welcome! Please complete your registration to access the dashboard
          </p>
          
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Your Principal ID:</div>
            <div className="text-xs font-mono text-blue-800 break-all">
              {principal?.toString()}
            </div>
          </div>
          
          <form onSubmit={handleRegistration} className="space-y-4">
            <div>
              <label className="label">Wallet Address *</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  name="walletAddress"
                  value={registration.walletAddress}
                  onChange={handleInputChange}
                  required
                  className="input flex-1"
                  placeholder="Auto-generated wallet address"
                />
                <button
                  type="button"
                  onClick={() => setRegistration(prev => ({
                    ...prev,
                    walletAddress: generateWalletAddress()
                  }))}
                  className="btn btn-secondary px-3"
                  title="Generate new wallet address"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                This will be used to identify your wallet for transactions
              </p>
            </div>

            <div>
              <label className="label">Username</label>
              <input
                type="text"
                name="username"
                value={registration.username}
                onChange={handleInputChange}
                className="input"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                name="email"
                value={registration.email}
                onChange={handleInputChange}
                className="input"
                placeholder="Enter your email"
              />
            </div>

            {registrationError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-red-700 text-sm">{registrationError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={registrationLoading}
              className="btn btn-primary w-full disabled:opacity-50"
            >
              {registrationLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Registering...</span>
                </div>
              ) : (
                'Complete Registration'
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back, {user?.username || 'User'}!
          </h1>
          <p className="text-slate-600 mt-1">
            Here's your payment gateway overview
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="btn btn-secondary inline-flex items-center space-x-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Balance Card - Featured */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1 text-indigo-100">Current Balance</h2>
            <p className="text-3xl font-bold mb-2">
              {formatBalance(balance)}
            </p>
            <p className="text-sm text-indigo-200">
              Last updated: {balance ? new Date(Number(balance.last_updated) / 1000000).toLocaleString() : 'Never'}
            </p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className="bg-white/20 p-3 rounded-lg">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <Link
              to="/topup"
              className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Top Up</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Sent</p>
              <p className="text-2xl font-bold text-slate-900">
                {userStats ? formatICP(userStats.total_sent) : '0'} ICP
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Received</p>
              <p className="text-2xl font-bold text-slate-900">
                {userStats ? formatICP(userStats.total_received) : '0'} ICP
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <ArrowDownRight className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Transactions</p>
              <p className="text-2xl font-bold text-slate-900">
                {userStats ? Number(userStats.transaction_count) : 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">QR Codes Generated</p>
              <p className="text-2xl font-bold text-slate-900">
                {userStats ? Number(userStats.qr_codes_generated) : 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <QrCode className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link to="/topup" className="card hover:shadow-lg transition-shadow group">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200 transition-colors">
              <Plus className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Top Up Balance</h3>
            <p className="text-slate-600">Add funds to your wallet</p>
          </div>
        </Link>

        <Link to="/generate" className="card hover:shadow-lg transition-shadow group">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
              <QrCode className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Generate QR Payment</h3>
            <p className="text-slate-600">Create a new payment request with QR code</p>
          </div>
        </Link>

        <Link to="/scan" className="card hover:shadow-lg transition-shadow group">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Scan & Pay</h3>
            <p className="text-slate-600">Scan QR code to make a payment</p>
          </div>
        </Link>

        <Link to="/history" className="card hover:shadow-lg transition-shadow group">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Transaction History</h3>
            <p className="text-slate-600">View all your past transactions</p>
          </div>
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Recent Transactions</h2>
          <Link to="/history" className="text-blue-600 hover:text-blue-700 font-medium">
            View All
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-4 bg-slate-200 rounded w-1/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500">No transactions yet</p>
            <p className="text-sm text-slate-400 mt-1">Start by generating a QR payment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getTransactionIcon(transaction.is_incoming)}
                  <div>
                    <div className="font-medium text-slate-900">
                      {transaction.is_incoming ? 'Received' : 'Sent'}
                    </div>
                    <div className="text-sm text-slate-500">
                      {new Date(Number(transaction.timestamp) / 1000000).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-slate-900">
                    {formatCurrency(transaction.amount_fiat, transaction.currency)}
                  </div>
                  <div className="text-sm text-slate-500">
                    {transaction.amount_icp} ICP
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                  {transaction.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Stats */}
      {systemStats && (
        <div className="card">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Network Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{Number(systemStats.total_users)}</div>
              <div className="text-sm text-slate-600">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{Number(systemStats.total_transactions)}</div>
              <div className="text-sm text-slate-600">Total Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{Number(systemStats.completed_transactions)}</div>
              <div className="text-sm text-slate-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{Number(systemStats.cached_exchange_rates)}</div>
              <div className="text-sm text-slate-600">Cached Rates</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard