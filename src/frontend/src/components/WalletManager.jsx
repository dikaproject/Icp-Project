import React, { useState, useEffect } from 'react'
import { Ed25519KeyIdentity } from '@dfinity/identity'
import { Wallet, Eye, EyeOff, Mail, AlertCircle, CheckCircle, RefreshCw, User, Lock } from 'lucide-react'

const WalletManager = ({ onWalletConnect, onWalletCreate }) => {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [savedSessions, setSavedSessions] = useState([])
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    loadSavedSessions()
  }, [])

  const loadSavedSessions = () => {
    const saved = localStorage.getItem('arta_sessions')
    if (saved) {
      try {
        setSavedSessions(JSON.parse(saved))
      } catch (err) {
        console.error('Error loading saved sessions:', err)
        setSavedSessions([])
      }
    }
  }

  // SIMPLE: Generate identity (random each time, but store mapping)
  const generateIdentity = () => {
    return Ed25519KeyIdentity.generate()
  }

  // SIMPLE: Save session with email mapping
  const saveSession = (email, identity, username, password) => {
    const sessionData = {
      id: Date.now().toString(),
      email,
      username: username || 'User',
      principal: identity.getPrincipal().toString(),
      walletAddress: `icp_${identity.getPrincipal().toString().slice(0, 17)}`,
      privateKey: Array.from(identity.getKeyPair().secretKey),
      password: password, // Store password (in production, hash this)
      created: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    }
    
    // Remove existing session with same email
    const existing = savedSessions.filter(s => s.email !== email)
    const updated = [...existing, sessionData]
    
    localStorage.setItem('arta_sessions', JSON.stringify(updated))
    setSavedSessions(updated)
    
    // Store current session
    localStorage.setItem('icp_current_session', JSON.stringify({
      principal: sessionData.principal,
      walletName: sessionData.username,
      privateKey: sessionData.privateKey,
      email: sessionData.email
    }))
    
    return sessionData
  }

  // SIMPLE: Find session by email
  const findSessionByEmail = (email) => {
    return savedSessions.find(s => s.email === email)
  }

  // SIMPLE: Clear all sessions
  const clearAllSessions = () => {
    if (!confirm('Delete ALL sessions? This cannot be undone!')) return
    
    localStorage.removeItem('arta_sessions')
    localStorage.removeItem('icp_current_session')
    localStorage.removeItem('icp_auth_state')
    setSavedSessions([])
    setSuccess('All sessions cleared!')
  }

  // SIMPLE: Create account
  const handleCreateAccount = async (e) => {
    e.preventDefault()
    
    if (!email || !username || !password) {
      setError('Please fill all fields')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    // Check if email already exists
    const existingSession = findSessionByEmail(email)
    if (existingSession) {
      setError('Email already registered. Please use login instead.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Generate new identity
      const identity = generateIdentity()
      const principal = identity.getPrincipal().toString()
      
      console.log('🔄 Creating account with email:', email)
      console.log('🆔 Generated Principal:', principal)
      
      // Save session locally first
      const sessionData = saveSession(email, identity, username, password)
      
      setSuccess('Account created successfully! Connecting...')
      
      setTimeout(() => {
        onWalletCreate(identity, username, null, { email, sessionData })
      }, 1000)
      
    } catch (err) {
      setError('Failed to create account: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // UPDATED: Login with email and password
  const handleLogin = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('Please enter email and password')
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Find session by email
      const session = findSessionByEmail(email)
      
      if (!session) {
        setError('Account not found. Please register first.')
        setLoading(false)
        return
      }

      // Check password
      if (session.password !== password) {
        setError('Invalid password')
        setLoading(false)
        return
      }

      // Restore identity from stored private key
      const identity = Ed25519KeyIdentity.fromSecretKey(new Uint8Array(session.privateKey))
      
      // Update last login
      const updatedSession = { ...session, lastLogin: new Date().toISOString() }
      const updatedSessions = savedSessions.map(s => s.id === session.id ? updatedSession : s)
      localStorage.setItem('arta_sessions', JSON.stringify(updatedSessions))
      setSavedSessions(updatedSessions)
      
      // Store current session
      localStorage.setItem('icp_current_session', JSON.stringify({
        principal: session.principal,
        walletName: session.username,
        privateKey: session.privateKey,
        email: session.email
      }))
      
      setSuccess('Login successful!')
      setTimeout(() => {
        onWalletConnect(identity, session.username)
      }, 1000)
      
    } catch (err) {
      setError('Login failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Reset form when changing modes
  const resetForm = () => {
    setEmail('')
    setUsername('')
    setPassword('')
    setError('')
    setSuccess('')
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Arta Wallet</h2>
          <p className="text-sm text-gray-600">Email-Based ICP Authentication</p>
        </div>

        {/* Mode Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mt-4">
          <button
            onClick={() => {
              setMode('login')
              resetForm()
            }}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              mode === 'login' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setMode('register')
              resetForm()
            }}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              mode === 'register' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'
            }`}
          >
            Register
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {/* Login Mode */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Login to Account</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                💡 Enter the email and password you used to register your account.
              </p>
            </div>

            {/* Show saved accounts info */}
            {savedSessions.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-700">Saved Accounts:</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {savedSessions.map(s => s.email).join(', ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearAllSessions}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {/* Register Mode */}
        {mode === 'register' && (
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Create Account</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your display name"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create secure password (min 6 characters)"
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  minLength={6}
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                🔐 Your wallet will be automatically generated and linked to your email.
                Each email can only have one account.
              </p>
            </div>
          </form>
        )}

        {/* Messages */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-green-700 text-sm">{success}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        {mode === 'login' && (
          <button
            type="submit"
            onClick={handleLogin}
            disabled={loading || !email || !password}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
            Login
          </button>
        )}

        {mode === 'register' && (
          <button
            type="submit"
            onClick={handleCreateAccount}
            disabled={loading || !email || !username || !password}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
            Create Account
          </button>
        )}
      </div>
    </div>
  )
}

export default WalletManager