import React, { useState, useEffect } from 'react'
import { Ed25519KeyIdentity } from '@dfinity/identity'
import { Wallet, Eye, EyeOff, Mail, AlertCircle, CheckCircle, RefreshCw, User, Lock, Loader } from 'lucide-react'

const WalletManager = ({ onWalletConnect, onWalletCreate, backend }) => {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [checkingWallet, setCheckingWallet] = useState(false)

  // Helper function to convert secret key to hex
  const secretKeyToHex = (secretKey) => {
    return Array.from(secretKey).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // Helper function to convert hex to secret key
  const hexToSecretKey = (hex) => {
    const bytes = []
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16))
    }
    return new Uint8Array(bytes)
  }

  // ENHANCED: Check if wallet exists with better debugging
  const checkWalletExists = async (email) => {
    if (!backend) return false
    
    try {
      setCheckingWallet(true)
      
      console.log('🔍 DEBUG: Starting wallet check for:', email)
      
      // Check both wallet identity storage AND user storage
      const walletIdentityExists = await backend.checkWalletIdentityExists(email)
      console.log('🔐 DEBUG: Wallet identity exists:', walletIdentityExists)
      
      const userByEmailResult = await backend.getUserByEmail(email)
      console.log('👤 DEBUG: User by email result:', userByEmailResult)
      
      // FIXED: Properly check if user exists
      // getUserByEmail returns null/undefined if not found, or [] if found but empty, or User object
      const userByEmailExists = userByEmailResult && 
                               userByEmailResult !== null && 
                               userByEmailResult !== undefined &&
                               (Array.isArray(userByEmailResult) ? userByEmailResult.length > 0 : true)
      
      console.log('🔍 Wallet check results:', {
        email,
        walletIdentityExists,
        userByEmailExists,
        userByEmailData: userByEmailResult
      })
      
      // Return true if either exists
      return walletIdentityExists || userByEmailExists
    } catch (err) {
      console.error('Error checking wallet:', err)
      return false
    } finally {
      setCheckingWallet(false)
    }
  }

  // FIXED: Save wallet identity to backend - ensure both storages are used
  const saveWalletToBackend = async (email, identity, password, walletName) => {
    if (!backend) {
      console.warn('Backend not available, skipping wallet save')
      return true
    }

    try {
      const secretKey = identity.getKeyPair().secretKey
      const secretKeyHex = secretKeyToHex(secretKey)
      
      console.log('🔐 Saving wallet identity to backend for:', email)
      
      // Use service method instead of direct actor call
      const result = await backend.saveWalletIdentityByEmail(
        email,
        secretKeyHex,
        password,
        walletName
      )
      
      if (result.Ok) {
        console.log('✅ Wallet identity saved to backend')
        return true
      } else {
        console.error('❌ Failed to save wallet to backend:', result.Err)
        
        // If wallet identity already exists, that's ok - continue
        if (result.Err.includes('already exists')) {
          console.log('⚠️ Wallet identity already exists, continuing...')
          return true
        }
        
        return false
      }
    } catch (err) {
      console.error('Error saving wallet to backend:', err)
      return false
    }
  }

  // FIXED: Restore wallet identity - try multiple sources
  const restoreWalletFromBackend = async (email, password) => {
    if (!backend) {
      throw new Error('Backend not available')
    }

    try {
      console.log('🔄 Restoring wallet from backend for:', email)
      
      // First, try wallet identity storage using service method
      try {
        const result = await backend.getWalletIdentityByEmail(email, password)
        
        if (result.Ok) {
          const { secret_key_hex, wallet_name } = result.Ok
          
          // Restore identity from secret key
          const secretKey = hexToSecretKey(secret_key_hex)
          const identity = Ed25519KeyIdentity.fromSecretKey(secretKey)
          
          console.log('✅ Wallet identity restored from wallet storage')
          console.log('🆔 Principal:', identity.getPrincipal().toString())
          
          return { identity, walletName: wallet_name }
        }
      } catch (walletError) {
        console.log('⚠️ Wallet identity storage failed:', walletError.message)
      }
      
      // Second, try to find user by email and generate new identity
      try {
        const userByEmailResult = await backend.getUserByEmail(email)
        
        // FIXED: Properly check if user exists
        const userExists = userByEmailResult && 
                          userByEmailResult !== null && 
                          userByEmailResult !== undefined &&
                          (Array.isArray(userByEmailResult) ? userByEmailResult.length > 0 : true)
        
        if (userExists) {
          console.log('👤 Found user by email, but no wallet identity stored')
          
          // Extract user data properly
          const userData = Array.isArray(userByEmailResult) ? userByEmailResult[0] : userByEmailResult
          
          // For existing users without wallet identity, we need to create new identity
          // This is a migration scenario
          const newIdentity = Ed25519KeyIdentity.generate()
          const secretKey = newIdentity.getKeyPair().secretKey
          const secretKeyHex = secretKeyToHex(secretKey)
          
          // Save the new identity for future use
          const saveResult = await backend.saveWalletIdentityByEmail(
            email,
            secretKeyHex,
            password,
            userData.username || 'User'
          )
          
          if (saveResult.Ok) {
            console.log('✅ New wallet identity created and saved for existing user')
            return { 
              identity: newIdentity, 
              walletName: userData.username || 'User' 
            }
          }
        }
      } catch (userError) {
        console.log('⚠️ User lookup failed:', userError.message)
      }
      
      throw new Error('No wallet found for this email')
      
    } catch (err) {
      console.error('Error restoring wallet from backend:', err)
      throw err
    }
  }

  // Save session locally (as backup)
  const saveSessionLocally = (email, identity, username, password) => {
    const sessionData = {
      id: Date.now().toString(),
      email,
      username: username || 'User',
      principal: identity.getPrincipal().toString(),
      walletAddress: `icp_${identity.getPrincipal().toString().slice(0, 17)}`,
      privateKey: Array.from(identity.getKeyPair().secretKey),
      password: password,
      created: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    }
    
    // Store current session
    localStorage.setItem('icp_current_session', JSON.stringify({
      principal: sessionData.principal,
      walletName: sessionData.username,
      privateKey: sessionData.privateKey,
      email: sessionData.email
    }))
    
    return sessionData
  }

  // UPDATED: Create account with better error handling
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

    setLoading(true)
    setError('')

    try {
      // Check if wallet already exists
      const walletExists = await checkWalletExists(email)
      if (walletExists) {
        setError('Email already has a wallet. Please use login instead.')
        return
      }

      // Generate new identity
      const identity = Ed25519KeyIdentity.generate()
      const principal = identity.getPrincipal().toString()
      
      console.log('🔄 Creating account with email:', email)
      console.log('🆔 Generated Principal:', principal)
      
      // Save to backend first
      const backendSaved = await saveWalletToBackend(email, identity, password, username)
      
      if (backendSaved) {
        // Save locally as backup
        const sessionData = saveSessionLocally(email, identity, username, password)
        
        setSuccess('Account created successfully! Connecting...')
        
        setTimeout(() => {
          onWalletCreate(identity, username, null, { email, sessionData })
        }, 1000)
      } else {
        setError('Failed to save wallet securely. Please try again.')
      }
      
    } catch (err) {
      setError('Failed to create account: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // UPDATED: Login with better fallback handling
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
      console.log('🔐 Attempting login for:', email)
      
      // Check if any form of wallet/user exists
      const walletExists = await checkWalletExists(email)
      
      if (!walletExists) {
        setError('No account found for this email. Please register first.')
        setLoading(false)
        return
      }

      console.log('✅ Account found, attempting to restore wallet...')

      // Try to restore from backend with fallback handling
      try {
        const { identity, walletName } = await restoreWalletFromBackend(email, password)
        
        // Save session locally for faster future access
        saveSessionLocally(email, identity, walletName, password)
        
        setSuccess('Login successful!')
        setTimeout(() => {
          onWalletConnect(identity, walletName)
        }, 1000)
        
      } catch (backendError) {
        console.error('Backend restore failed:', backendError)
        
        if (backendError.message.includes('Invalid password')) {
          setError('Invalid password')
        } else if (backendError.message.includes('No wallet found')) {
          setError('Account found but wallet access failed. Please try registering again.')
        } else {
          setError('Login failed: ' + backendError.message)
        }
      }
      
    } catch (err) {
      console.error('Login error:', err)
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
          <p className="text-sm text-gray-600">Cross-Device ICP Authentication</p>
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
                {checkingWallet && (
                  <Loader className="w-4 h-4 text-indigo-600 animate-spin absolute right-3 top-1/2 transform -translate-y-1/2" />
                )}
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
                🔐 Your wallet identity is securely stored and can be accessed from any device with your email and password.
              </p>
            </div>
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
                {checkingWallet && (
                  <Loader className="w-4 h-4 text-indigo-600 animate-spin absolute right-3 top-1/2 transform -translate-y-1/2" />
                )}
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

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-700">
                🌐 Your wallet will be securely stored and accessible from any device. Same email can only register once.
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