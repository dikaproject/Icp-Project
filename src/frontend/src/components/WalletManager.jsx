import React, { useState, useEffect } from 'react'
import { Ed25519KeyIdentity } from '@dfinity/identity'
import { Wallet, Eye, EyeOff, Mail, AlertCircle, CheckCircle, RefreshCw, User, Lock, Loader, X } from 'lucide-react'

const WalletManager = ({ onWalletConnect, onWalletCreate, backend, onClose }) => {
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#222334] rounded-2xl lg:rounded-3xl shadow-2xl shadow-black/20 border border-[#23253B] my-8 max-h-[90vh] flex flex-col relative">
        
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute -top-4 -right-4 w-10 h-10 bg-[#222334] hover:bg-[#262840] border border-[#23253B] rounded-full flex items-center justify-center text-[#B3B3C2] hover:text-[#F5F6FA] transition-all duration-200 z-10 shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header - Fixed */}
        <div className="px-6 lg:px-8 py-6 lg:py-8 border-b border-[#23253B] bg-gradient-to-r from-[#262840] to-[#222334] rounded-t-2xl lg:rounded-t-3xl flex-shrink-0">
          <div className="text-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] rounded-2xl lg:rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/25">
                <Wallet className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] rounded-2xl lg:rounded-3xl blur-2xl opacity-30 mx-auto w-16 h-16 lg:w-20 lg:h-20"></div>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-[#F5F6FA] mb-2">Arta Wallet</h2>
            <p className="text-[#B3B3C2] text-base lg:text-lg">Cross-Device ICP Authentication</p>
          </div>

          {/* Mode Tabs */}
          <div className="flex space-x-2 bg-[#181A20] p-2 rounded-2xl mt-6 border border-[#23253B]">
            <button
              onClick={() => {
                setMode('login')
                resetForm()
              }}
              className={`flex-1 py-3 lg:py-4 px-4 lg:px-6 rounded-xl text-sm lg:text-base font-semibold transition-all duration-300 ${
                mode === 'login' 
                  ? 'bg-gradient-to-r from-[#885FFF] to-[#59C1FF] text-white shadow-lg shadow-purple-500/25' 
                  : 'text-[#B3B3C2] hover:text-[#F5F6FA] hover:bg-[#262840]'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setMode('register')
                resetForm()
              }}
              className={`flex-1 py-3 lg:py-4 px-4 lg:px-6 rounded-xl text-sm lg:text-base font-semibold transition-all duration-300 ${
                mode === 'register' 
                  ? 'bg-gradient-to-r from-[#885FFF] to-[#59C1FF] text-white shadow-lg shadow-purple-500/25' 
                  : 'text-[#B3B3C2] hover:text-[#F5F6FA] hover:bg-[#262840]'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 lg:py-8">
          {/* Login Mode */}
          {mode === 'login' && (
            <div className="space-y-6">
              <h3 className="text-xl lg:text-2xl font-bold text-[#F5F6FA] mb-6">Login to Account</h3>

              <div>
                <label className="block text-base lg:text-lg font-semibold text-[#F5F6FA] mb-3">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-12 lg:pl-14 pr-12 py-4 lg:py-5 bg-[#181A20] border border-[#23253B] rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-[#885FFF] focus:border-[#885FFF] transition-all text-[#F5F6FA] placeholder-[#B3B3C2] text-base lg:text-lg"
                    required
                  />
                  <Mail className="w-5 h-5 lg:w-6 lg:h-6 text-[#B3B3C2] absolute left-4 lg:left-5 top-1/2 transform -translate-y-1/2" />
                  {checkingWallet && (
                    <Loader className="w-5 h-5 lg:w-6 lg:h-6 text-[#885FFF] animate-spin absolute right-4 lg:right-5 top-1/2 transform -translate-y-1/2" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-base lg:text-lg font-semibold text-[#F5F6FA] mb-3">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-12 lg:pl-14 pr-12 py-4 lg:py-5 bg-[#181A20] border border-[#23253B] rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-[#885FFF] focus:border-[#885FFF] transition-all text-[#F5F6FA] placeholder-[#B3B3C2] text-base lg:text-lg"
                    required
                  />
                  <Lock className="w-5 h-5 lg:w-6 lg:h-6 text-[#B3B3C2] absolute left-4 lg:left-5 top-1/2 transform -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 lg:right-5 top-1/2 transform -translate-y-1/2 text-[#B3B3C2] hover:text-[#F5F6FA] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5 lg:w-6 lg:h-6" /> : <Eye className="w-5 h-5 lg:w-6 lg:h-6" />}
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl lg:rounded-2xl p-4 lg:p-6">
                <p className="text-sm lg:text-base text-blue-400">
                  🔐 Your wallet identity is securely stored and can be accessed from any device with your email and password.
                </p>
              </div>
            </div>
          )}

          {/* Register Mode */}
          {mode === 'register' && (
            <div className="space-y-6">
              <h3 className="text-xl lg:text-2xl font-bold text-[#F5F6FA] mb-6">Create Account</h3>

              <div>
                <label className="block text-base lg:text-lg font-semibold text-[#F5F6FA] mb-3">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-12 lg:pl-14 pr-12 py-4 lg:py-5 bg-[#181A20] border border-[#23253B] rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-[#885FFF] focus:border-[#885FFF] transition-all text-[#F5F6FA] placeholder-[#B3B3C2] text-base lg:text-lg"
                    required
                  />
                  <Mail className="w-5 h-5 lg:w-6 lg:h-6 text-[#B3B3C2] absolute left-4 lg:left-5 top-1/2 transform -translate-y-1/2" />
                  {checkingWallet && (
                    <Loader className="w-5 h-5 lg:w-6 lg:h-6 text-[#885FFF] animate-spin absolute right-4 lg:right-5 top-1/2 transform -translate-y-1/2" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-base lg:text-lg font-semibold text-[#F5F6FA] mb-3">Username</label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your display name"
                    className="w-full pl-12 lg:pl-14 pr-4 py-4 lg:py-5 bg-[#181A20] border border-[#23253B] rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-[#885FFF] focus:border-[#885FFF] transition-all text-[#F5F6FA] placeholder-[#B3B3C2] text-base lg:text-lg"
                    required
                  />
                  <User className="w-5 h-5 lg:w-6 lg:h-6 text-[#B3B3C2] absolute left-4 lg:left-5 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-base lg:text-lg font-semibold text-[#F5F6FA] mb-3">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create secure password (min 6 characters)"
                    className="w-full pl-12 lg:pl-14 pr-12 py-4 lg:py-5 bg-[#181A20] border border-[#23253B] rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-[#885FFF] focus:border-[#885FFF] transition-all text-[#F5F6FA] placeholder-[#B3B3C2] text-base lg:text-lg"
                    required
                    minLength={6}
                  />
                  <Lock className="w-5 h-5 lg:w-6 lg:h-6 text-[#B3B3C2] absolute left-4 lg:left-5 top-1/2 transform -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 lg:right-5 top-1/2 transform -translate-y-1/2 text-[#B3B3C2] hover:text-[#F5F6FA] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5 lg:w-6 lg:h-6" /> : <Eye className="w-5 h-5 lg:w-6 lg:h-6" />}
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl lg:rounded-2xl p-4 lg:p-6">
                <p className="text-sm lg:text-base text-emerald-400">
                  🌐 Your wallet will be securely stored and accessible from any device. Same email can only register once.
                </p>
              </div>
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="mt-6 p-4 lg:p-6 bg-rose-500/10 border border-rose-500/20 rounded-xl lg:rounded-2xl flex items-start space-x-3 lg:space-x-4">
              <AlertCircle className="w-5 h-5 lg:w-6 lg:h-6 text-rose-400 mt-0.5 flex-shrink-0" />
              <span className="text-rose-400 text-sm lg:text-base font-medium break-words">{error}</span>
            </div>
          )}

          {success && (
            <div className="mt-6 p-4 lg:p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl lg:rounded-2xl flex items-start space-x-3 lg:space-x-4">
              <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span className="text-emerald-400 text-sm lg:text-base font-medium break-words">{success}</span>
            </div>
          )}

          {/* Extra spacing for scroll */}
          <div className="h-4"></div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="px-6 lg:px-8 py-6 lg:py-8 border-t border-[#23253B] bg-[#181A20] rounded-b-2xl lg:rounded-b-3xl flex-shrink-0">
          {mode === 'login' && (
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading || !email || !password}
              className="w-full group relative overflow-hidden bg-gradient-to-r from-[#885FFF] to-[#59C1FF] text-white rounded-xl lg:rounded-2xl py-4 lg:py-5 px-6 lg:px-8 font-bold text-base lg:text-lg shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="flex items-center justify-center space-x-3">
                {loading ? <RefreshCw className="w-5 h-5 lg:w-6 lg:h-6 animate-spin" /> : null}
                <span>Login to Wallet</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            </button>
          )}

          {mode === 'register' && (
            <button
              type="button"
              onClick={handleCreateAccount}
              disabled={loading || !email || !username || !password}
              className="w-full group relative overflow-hidden bg-gradient-to-r from-[#885FFF] to-[#59C1FF] text-white rounded-xl lg:rounded-2xl py-4 lg:py-5 px-6 lg:px-8 font-bold text-base lg:text-lg shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="flex items-center justify-center space-x-3">
                {loading ? <RefreshCw className="w-5 h-5 lg:w-6 lg:h-6 animate-spin" /> : null}
                <span>Create Account</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default WalletManager