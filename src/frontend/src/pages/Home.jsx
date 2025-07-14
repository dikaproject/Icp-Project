import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useICP } from '../contexts/ICPContext.jsx'
import { 
  Wallet, 
  QrCode, 
  Globe, 
  Shield, 
  Zap, 
  Users,
  ArrowRight,
  LogIn,
  AlertCircle
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
      title: 'QR Code Payments',
      description: 'Generate and scan QR codes for instant payments'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Support for multiple currencies and worldwide transactions'
    },
    {
      icon: Shield,
      title: 'Secure & Decentralized',
      description: 'Built on Internet Computer for maximum security'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Process payments in seconds with minimal fees'
    }
  ]

  const handleGetStarted = async () => {
    if (!isAuthenticated) {
      await login()
    }
  }

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-gray-900">
            Decentralized Payment Gateway
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience the future of payments with our secure, fast, and 
            decentralized payment gateway built on Internet Computer Protocol.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center justify-center space-x-2 px-6 py-3 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        )}

        {/* Auth Status */}
        <div className="flex justify-center">
          {isLoading ? (
            <div className="flex items-center space-x-2 px-8 py-4 bg-blue-50 rounded-lg">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-blue-600 font-medium">Loading...</span>
            </div>
          ) : isAuthenticated ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 px-6 py-3 bg-green-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-700 font-medium">
                  ✅ Connected as {principal?.toString().slice(0, 10)}...
                </span>
              </div>
              
              {userLoading ? (
                <div className="flex items-center space-x-2 px-6 py-3 bg-blue-50 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-blue-600">Loading user data...</span>
                </div>
              ) : user ? (
                <div className="space-y-2">
                  <div className="px-6 py-3 bg-purple-50 rounded-lg">
                    <span className="text-purple-700 font-medium">
                      👋 Welcome back, {user.username || 'User'}!
                    </span>
                  </div>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center space-x-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
                  >
                    <Wallet className="h-5 w-5" />
                    <span>Go to Dashboard</span>
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="px-6 py-3 bg-orange-50 rounded-lg">
                    <span className="text-orange-700 font-medium">
                      📝 Please complete registration
                    </span>
                  </div>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center space-x-2 px-8 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-lg font-medium"
                  >
                    <Users className="h-5 w-5" />
                    <span>Complete Registration</span>
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 px-6 py-3 bg-yellow-50 rounded-lg">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-yellow-700 font-medium">
                  🔐 Login Required
                </span>
              </div>
              <button
                onClick={handleGetStarted}
                disabled={isLoading}
                className="inline-flex items-center space-x-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium disabled:opacity-50"
              >
                <LogIn className="h-5 w-5" />
                <span>Login with Internet Identity</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <div key={index} className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Icon className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      {isAuthenticated && user && (
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Quick Actions
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              to="/generate"
              className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
            >
              <QrCode className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Generate QR</h3>
                <p className="text-sm text-gray-600">Create payment QR codes</p>
              </div>
            </Link>
            
            <Link
              to="/scan"
              className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
            >
              <Shield className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Scan Payment</h3>
                <p className="text-sm text-gray-600">Process QR payments</p>
              </div>
            </Link>
            
            <Link
              to="/history"
              className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
            >
              <Users className="h-6 w-6 text-purple-600" />
              <div>
                <h3 className="font-semibold text-gray-900">View History</h3>
                <p className="text-sm text-gray-600">Check transactions</p>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
