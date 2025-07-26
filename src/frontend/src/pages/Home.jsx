import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useICP } from '../contexts/ICPContext.jsx'
import { 
  Wallet, 
  QrCode, 
  Shield, 
  Zap, 
  ArrowRight,
  LogIn,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Users,
  Globe
} from 'lucide-react'

const Home = () => {
  const { isAuthenticated, login, isLoading, error, getUser, principal } = useICP()
  const [user, setUser] = useState(null)
  const [userLoading, setUserLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      loadUser()
    }
  }, [isAuthenticated])

  const loadUser = async () => {
    setUserLoading(true)
    try {
      const userData = await getUser()
      setUser(userData)
    } catch (err) {
      console.error('Failed to load user:', err)
    } finally {
      setUserLoading(false)
    }
  }

  const features = [
    {
      icon: QrCode,
      title: 'QR Payments',
      description: 'Instant QR code payments',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Shield,
      title: 'Secure',
      description: 'Blockchain security',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Zap,
      title: 'Fast',
      description: 'Lightning transactions',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      icon: Globe,
      title: 'Global',
      description: 'Worldwide access',
      color: 'from-purple-500 to-purple-600'
    }
  ]

  const stats = [
    { label: 'Total Users', value: '12,547', icon: Users },
    { label: 'Transactions', value: '89.2K', icon: TrendingUp },
    { label: 'Success Rate', value: '99.9%', icon: Shield }
  ]

  const handleGetStarted = async () => {
    if (!isAuthenticated) {
      await login()
    }
  }

  if (isAuthenticated && user) {
    return (
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 text-white">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="space-y-4 lg:w-2/3">
              <h1 className="text-3xl lg:text-4xl font-bold">
                Welcome back, {user.username || 'User'}! 👋
              </h1>
              <p className="text-slate-300 text-lg">
                Ready to manage your payments? Access all your tools from the dashboard.
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-medium"
              >
                <Wallet className="h-5 w-5" />
                <span>Go to Dashboard</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
            <div className="lg:w-1/3 mt-6 lg:mt-0">
              <div className="w-32 h-32 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto">
                <Wallet className="h-16 w-16 text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/generate"
            className="group p-6 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <QrCode className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Generate QR</h3>
                <p className="text-sm text-slate-600">Create payment codes</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
            </div>
          </Link>
          
          <Link
            to="/scan"
            className="group p-6 bg-white rounded-xl border border-slate-200 hover:border-green-300 hover:shadow-lg transition-all"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Scan Payment</h3>
                <p className="text-sm text-slate-600">Process payments</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
            </div>
          </Link>
          
          <Link
            to="/history"
            className="group p-6 bg-white rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">View History</h3>
                <p className="text-sm text-slate-600">Transaction logs</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
            </div>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-8">
        <div className="space-y-6">
          <div className="inline-flex items-center px-4 py-2 bg-slate-100 rounded-full text-sm text-slate-600">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Powered by Internet Computer
          </div>
          
          <h1 className="text-4xl lg:text-6xl font-bold text-slate-900">
            Decentralized Payment
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent block">
              Gateway
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Experience secure, fast, and decentralized payments built on Internet Computer Protocol. 
            The future of finance is here.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center justify-center space-x-2 px-6 py-3 bg-red-50 border border-red-200 rounded-xl max-w-md mx-auto">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        )}

        {/* Auth CTA */}
        <div className="flex justify-center">
          {isLoading ? (
            <div className="flex items-center space-x-3 px-8 py-4 bg-slate-100 rounded-xl">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-600"></div>
              <span className="text-slate-600 font-medium">Connecting...</span>
            </div>
          ) : !isAuthenticated ? (
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg text-lg font-medium"
            >
              <LogIn className="h-5 w-5" />
              <span>Get Started</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          ) : userLoading ? (
            <div className="flex items-center space-x-3 px-8 py-4 bg-blue-50 rounded-xl">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-blue-600 font-medium">Loading...</span>
            </div>
          ) : (
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg text-lg font-medium"
            >
              <Wallet className="h-5 w-5" />
              <span>Enter Dashboard</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white p-6 rounded-xl border border-slate-200 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <Icon className="h-6 w-6 text-slate-600" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-600">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <div key={index} className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-all group">
              <div className="space-y-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900 group-hover:text-slate-700">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 lg:p-12 text-center text-white">
        <div className="space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold">
            Ready to get started?
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Join thousands of users who trust our platform for secure, fast payments.
          </p>
          {!isAuthenticated && (
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center space-x-3 px-8 py-4 bg-white text-slate-900 rounded-xl hover:bg-slate-100 transition-all font-medium"
            >
              <LogIn className="h-5 w-5" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home