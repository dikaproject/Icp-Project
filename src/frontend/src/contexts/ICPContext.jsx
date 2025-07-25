import React, { createContext, useContext, useState, useEffect } from 'react'
import { Actor, HttpAgent } from '@dfinity/agent'
import { Ed25519KeyIdentity } from '@dfinity/identity'
import { createActor, PaymentBackendService } from '../services/backend.js'
import WalletManager from '../components/WalletManager.jsx'

const ICPContext = createContext()

export const useICP = () => {
  const context = useContext(ICPContext)
  if (!context) {
    throw new Error('useICP must be used within an ICPProvider')
  }
  return context
}

export const ICPProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [identity, setIdentity] = useState(null)
  const [principal, setPrincipal] = useState(null)
  const [actor, setActor] = useState(null)
  const [backend, setBackend] = useState(null)
  const [user, setUser] = useState(null)
  const [userPreferences, setUserPreferences] = useState(null)
  const [activeSession, setActiveSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [currentWallet, setCurrentWallet] = useState(null)

  const canisterId = import.meta.env.VITE_CANISTER_ID || 'uxrrr-q7777-77774-qaaaq-cai'
  const host = import.meta.env.VITE_IC_HOST || 'http://localhost:4943'
  const isDevelopment = import.meta.env.VITE_DFX_NETWORK === 'local' || import.meta.env.NODE_ENV === 'development'

  useEffect(() => {
    initAuth()
  }, [])

  const initAuth = async () => {
    try {
      setError(null)
      
      // Check if we have a current session
      const currentSession = localStorage.getItem('icp_current_session')
      
      if (currentSession) {
        try {
          const sessionData = JSON.parse(currentSession)
          const restoredIdentity = Ed25519KeyIdentity.fromSecretKey(new Uint8Array(sessionData.privateKey))
          
          console.log('🔄 Restoring session for:', sessionData.walletName)
          console.log('🆔 Principal:', sessionData.principal)
          
          setCurrentWallet({ 
            identity: restoredIdentity, 
            name: sessionData.walletName 
          })
          
          await authenticateWithIdentity(restoredIdentity)
          
          console.log('✅ Session restored successfully')
          
        } catch (err) {
          console.warn('Failed to restore session, clearing stored data')
          localStorage.removeItem('icp_current_session')
          localStorage.removeItem('icp_auth_state')
          await createActorConnection()
        }
      } else {
        // Create anonymous actor for initial connection
        await createActorConnection()
      }
    } catch (err) {
      console.error('Auth initialization error:', err)
      setError('Failed to initialize connection')
    } finally {
      setIsLoading(false)
    }
  }

  const createActorConnection = async (identity = null) => {
    try {
      console.log('🔗 Creating actor connection with host:', host)
      
      const agent = new HttpAgent({ 
        host,
        identity 
      })
      
      // Fetch root key for local development - with better error handling
      if (isDevelopment) {
        try {
          console.log('🔑 Fetching root key for local development...')
          await agent.fetchRootKey()
          console.log('✅ Root key fetched successfully')
        } catch (rootKeyError) {
          console.warn('⚠️ Failed to fetch root key:', rootKeyError)
          // Continue anyway - sometimes this works even without root key
        }
      }

      const actorInstance = createActor(canisterId, { agent })
      const backendService = new PaymentBackendService(actorInstance)

      setActor(actorInstance)
      setBackend(backendService)
      
      return backendService
    } catch (err) {
      console.error('Actor creation error:', err)
      setError(`Failed to connect to canister: ${err.message}`)
      throw err
    }
  }

 const authenticateWithIdentity = async (identity) => {
  const principal = identity.getPrincipal()
  
  console.log('🔐 Authenticating with Principal:', principal.toString())
  
  setIdentity(identity)
  setPrincipal(principal)
  setIsAuthenticated(true)
  
  const backendService = await createActorConnection(identity)
  
  // Try to load existing user - but don't block if it fails
  try {
    const existingUser = await backendService.getUser()
    if (existingUser) {
      setUser(existingUser)
      console.log('👤 Existing user found')
    } else {
      console.log('📝 New user - registration required')
    }
  } catch (err) {
    console.warn('Could not load user data:', err)
    // Continue anyway
  }
  
  // Store auth state
  localStorage.setItem('icp_auth_state', 'authenticated')
  
  return true
}

  const login = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Show wallet selection modal instead of auto-generating
      setShowWalletModal(true)
      
      return true
    } catch (err) {
      console.error('Login error:', err)
      setError('Login failed. Please try again.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

    // Update handleWalletConnect in ICPContext.jsx
  const handleWalletConnect = async (identity, walletName) => {
  try {
    console.log('🔗 Connecting wallet:', walletName)
    console.log('🆔 Principal:', identity.getPrincipal().toString())
    
    setShowWalletModal(false)
    setCurrentWallet({ identity, name: walletName })
    
    await authenticateWithIdentity(identity)
    
    return true
  } catch (err) {
    console.error('Wallet connection error:', err)
    setError('Failed to connect wallet')
    return false
  }
}

  // Update handleWalletCreate function
  const handleWalletCreate = async (identity, walletName, mnemonic, extraData) => {
    try {
      setShowWalletModal(false)
      setCurrentWallet({ identity, name: walletName })
      
      await authenticateWithIdentity(identity)
      
      // If we have email data, trigger registration
      if (extraData?.email) {
        console.log('🔄 Registering user with email:', extraData.email)
        
        const principal = identity.getPrincipal().toString()
        const walletAddress = `icp_${principal.slice(0, 17)}`
        
        // Register user in backend
        const result = await registerUser(walletAddress, walletName, extraData.email)
        
        if (result.success) {
          console.log('✅ User registered successfully:', result.data)
        } else {
          // If registration fails but it's because user exists, that's ok
          if (!result.error.includes('already registered')) {
            console.error('❌ Registration failed:', result.error)
          }
        }
      }
      
      return true
    } catch (err) {
      console.error('Wallet creation error:', err)
      setError('Failed to create wallet')
      return false
    }
  }

  // Update logout to clear session
  const logout = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // End active session
      if (activeSession && backend) {
        try {
          await backend.endUserSession(activeSession.session_id)
        } catch (err) {
          console.warn('Failed to end session:', err)
        }
      }
      
      // Clear all state
      setIsAuthenticated(false)
      setIdentity(null)
      setPrincipal(null)
      setUser(null)
      setUserPreferences(null)
      setActiveSession(null)
      setCurrentWallet(null)
      
      // Clear stored session data
      localStorage.removeItem('icp_auth_state')
      localStorage.removeItem('icp_current_session')
      
      // Create anonymous actor
      await createActorConnection()
      
      console.log('✅ Logout successful')
      
    } catch (err) {
      console.error('Logout error:', err)
      setError('Logout failed')
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserData = async (backendService = backend) => {
  try {
    if (!backendService || !principal) return null
    
    console.log('🔄 Loading user data for principal:', principal.toString())
    
    const userData = await backendService.getUser()
    
    if (userData) {
      console.log('✅ User data found:', userData)
      setUser(userData)
      return userData
    } else {
      console.log('⚠️ No user data found - new user needs registration')
      setUser(null)
      return null
    }
  } catch (err) {
    console.error('Load user error:', err)
    
    // Don't show error for user not found - this is normal for new users
    if (!err.message.includes('not found')) {
      console.warn('Failed to load user data:', err.message)
    }
    
    return null
  }
}

  const loadUserPreferences = async (backendService = backend) => {
    try {
      if (!backendService) return null
      
      const preferences = await backendService.getUserPreferences()
      setUserPreferences(preferences)
      return preferences
    } catch (err) {
      console.error('Load preferences error:', err)
      return null
    }
  }

  const createUserSession = async (backendService = backend) => {
    try {
      if (!backendService) return null
      
      // Get user's IP and user agent
      const ipAddress = '127.0.0.1' // In production, get from server
      const userAgent = navigator.userAgent
      
      const sessionResult = await backendService.createUserSession(ipAddress, userAgent)
      if (sessionResult.Ok) {
        setActiveSession(sessionResult.Ok)
        return sessionResult.Ok
      }
      
      return null
    } catch (err) {
      console.error('Session creation error:', err)
      return null
    }
  }

  // Update registerUser to use email-based registration
  const registerUser = async (walletAddress, username, email) => {
    try {
      if (!backend) {
        throw new Error('Backend not initialized')
      }

      if (!isAuthenticated) {
        throw new Error('Must be authenticated to register')
      }

      console.log('🔄 Registering user with email:', email)
      
      // Try email-based registration first
      const result = await backend.registerUserByEmail(email, username, walletAddress)
      
      if (result.Ok) {
        setUser(result.Ok)
        console.log('✅ User registered successfully:', result.Ok)
        return { success: true, data: result.Ok }
      } else {
        console.error('❌ Registration failed:', result.Err)
        return { success: false, error: result.Err }
      }
    } catch (err) {
      console.error('Registration error:', err)
      return { success: false, error: err.message }
    }
  }

  const updateUserPreferences = async (preferences) => {
    try {
      if (!backend) {
        throw new Error('Backend not initialized')
      }
      
      const result = await backend.updateUserPreferences(preferences)
      
      if (result.Ok) {
        setUserPreferences(result.Ok)
        return { success: true, preferences: result.Ok }
      } else {
        return { success: false, error: result.Err }
      }
    } catch (err) {
      console.error('Update preferences error:', err)
      return { success: false, error: err.message }
    }
  }

  // Balance history functions
  const getUserBalanceHistory = async () => {
    try {
      if (!backend) return []
      return await backend.getUserBalanceHistory()
    } catch (err) {
      console.error('Get balance history error:', err)
      return []
    }
  }

  const getAllBalanceChanges = async () => {
    try {
      if (!backend) return []
      return await backend.getAllBalanceChanges()
    } catch (err) {
      console.error('Get all balance changes error:', err)
      return []
    }
  }

  // QR usage history functions
  const getQRUsageHistory = async (qrId) => {
    try {
      if (!backend) return []
      return await backend.getQRUsageHistory(qrId)
    } catch (err) {
      console.error('Get QR usage history error:', err)
      return []
    }
  }

  const getAllQRUsageLogs = async () => {
    try {
      if (!backend) return []
      return await backend.getAllQRUsageLogs()
    } catch (err) {
      console.error('Get all QR usage logs error:', err)
      return []
    }
  }

  // Session management functions
  const getActiveSessions = async () => {
    try {
      if (!backend) return []
      return await backend.getActiveSessions()
    } catch (err) {
      console.error('Get active sessions error:', err)
      return []
    }
  }

  const updateSessionActivity = async () => {
    try {
      if (!backend || !activeSession) return
      
      const result = await backend.updateSessionActivity(activeSession.session_id)
      if (result.Ok) {
        setActiveSession(result.Ok)
      }
    } catch (err) {
      console.error('Update session activity error:', err)
    }
  }

  const getUserStats = async () => {
    try {
      if (!backend) return null
      return await backend.getUserStats()
    } catch (err) {
      console.error('Get user stats error:', err)
      return null
    }
  }

  const getSystemStats = async () => {
    try {
      if (!backend) return null
      return await backend.getSystemStats()
    } catch (err) {
      console.error('System stats error:', err)
      return null
    }
  }

  const getUserTransactionSummaries = async () => {
    try {
      if (!backend) return []
      return await backend.getUserTransactionSummaries()
    } catch (err) {
      console.error('Get transaction summaries error:', err)
      return []
    }
  }

  const getSupportedCurrencies = async () => {
    try {
      if (!backend) return ['USD', 'EUR', 'GBP', 'JPY', 'IDR', 'SGD']
      return await backend.getSupportedCurrencies()
    } catch (err) {
      console.error('Get supported currencies error:', err)
      return ['USD', 'EUR', 'GBP', 'JPY', 'IDR', 'SGD']
    }
  }

  const fetchExchangeRate = async (currency) => {
    try {
      if (!backend) {
        throw new Error('Backend not initialized')
      }
      return await backend.fetchExchangeRate(currency)
    } catch (err) {
      console.error('Exchange rate error:', err)
      return { Err: err.message }
    }
  }

  const generateQR = async (amount, currency, description) => {
    try {
      if (!backend) {
        throw new Error('Backend not initialized')
      }

      if (!isAuthenticated) {
        throw new Error('Must be authenticated to generate QR')
      }

      return await backend.generateQR(amount, currency, description)
    } catch (err) {
      console.error('QR generation error:', err)
      return { Err: err.message }
    }
  }

  const validateQRCode = async (qrId) => {
    try {
      if (!backend) {
        throw new Error('Backend not initialized')
      }
      return await backend.validateQRCode(qrId)
    } catch (err) {
      console.error('QR validation error:', err)
      return { Err: err.message }
    }
  }

  const processPayment = async (qrId, transactionHash) => {
    try {
      if (!backend) {
        throw new Error('Backend not initialized')
      }

      if (!isAuthenticated) {
        throw new Error('Must be authenticated to process payment')
      }

      return await backend.processPayment(qrId, transactionHash)
    } catch (err) {
      console.error('Payment processing error:', err)
      return { Err: err.message }
    }
  }

  // Auto-refresh session activity
  useEffect(() => {
    if (isAuthenticated && activeSession) {
      const interval = setInterval(updateSessionActivity, 5 * 60 * 1000) // 5 minutes
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, activeSession])

  const value = {
    isAuthenticated,
    identity,
    principal,
    actor,
    backend,
    user,
    userPreferences,
    activeSession,
    isLoading,
    error,
    login,
    logout,
    registerUser,
    updateUserPreferences,
    loadUserData,
    getUserBalanceHistory,
    getAllBalanceChanges,
    getQRUsageHistory,
    getAllQRUsageLogs,
    getActiveSessions,
    getUserStats,
    getSystemStats,
    getUserTransactionSummaries,
    getSupportedCurrencies,
    fetchExchangeRate,
    generateQR,
    validateQRCode,
    processPayment,
    canisterId,
    host,
    currentWallet,
    showWalletModal,
    setShowWalletModal,
    handleWalletConnect,
    handleWalletCreate,
  }

  return (
    <ICPContext.Provider value={value}>
      {children}
      
      {/* Wallet Manager Modal */}
      {showWalletModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col">
      <button
        onClick={() => setShowWalletModal(false)}
        className="absolute -top-10 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 z-10"
      >
        ✕
      </button>
      <WalletManager
        onWalletConnect={handleWalletConnect}
        onWalletCreate={handleWalletCreate}
      />
    </div>
  </div>
)}
    </ICPContext.Provider>
  )
}