import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useICP } from '../contexts/ICPContext'
import { 
  Wallet, 
  QrCode, 
  ScanLine, 
  History, 
  Home,
  LogIn,
  LogOut,
  User,
  CreditCard
} from 'lucide-react'

const Layout = ({ children }) => {
  const location = useLocation()
  const { isAuthenticated, principal, login, logout, isLoading } = useICP()

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: Wallet },
    { name: 'Top Up', href: '/topup', icon: CreditCard },
    { name: 'Generate QR', href: '/generate', icon: QrCode },
    { name: 'Scan Payment', href: '/scan', icon: ScanLine },
    { name: 'History', href: '/history', icon: History },
    { name: 'Network Stats', href: '/network', icon: Wallet } // New navigation item
  ]

  const handleAuthAction = async () => {
    if (isAuthenticated) {
      await logout()
    } else {
      await login()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Wallet className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">
                ICP Payment Gateway
              </h1>
            </div>
            
            {/* Auth Status */}
            <div className="flex items-center space-x-4">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">Loading...</span>
                </div>
              ) : isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">
                      {principal?.toString().slice(0, 10)}...
                    </span>
                  </div>
                  <button
                    onClick={handleAuthAction}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAuthAction}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login with Internet Identity</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

export default Layout
