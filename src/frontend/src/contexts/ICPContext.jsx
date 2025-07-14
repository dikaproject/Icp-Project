import React, { createContext, useContext, useState, useEffect } from 'react'
import { Actor, HttpAgent } from '@dfinity/agent'
import { Ed25519KeyIdentity } from '@dfinity/identity'
import { createActor, PaymentBackendService } from '../services/backend.js'

const ICPContext = createContext()

export const useICP = () => {
  const context = useContext(ICPContext)
  if (!context) {
    throw new Error('useICP must be used within an ICPProvider')
  }
  return context
}

// Fixed development identity for testing
const DEV_IDENTITY_SEED = 'development-seed-12345'

const generateDevIdentity = () => {
  try {
    // Method 1: Generate consistent identity from seed
    const encoder = new TextEncoder()
    const seedString = DEV_IDENTITY_SEED + Date.now().toString().slice(0, 10) // Add some entropy but keep it deterministic for development
    const seedBytes = encoder.encode(seedString)
    
    // Create a proper 32-byte seed using crypto-subtle if available, otherwise use simple hash
    const seed = new Uint8Array(32)
    
    // Fill seed with bytes from our string, cycling if necessary
    for (let i = 0; i < 32; i++) {
      seed[i] = seedBytes[i % seedBytes.length]
    }
    
    // Create identity from seed
    return Ed25519KeyIdentity.fromSecretKey(seed)
  } catch (error) {
    console.error('Failed to generate from seed, using random identity:', error)
    // Fallback: generate random identity
    return Ed25519KeyIdentity.generate()
  }
}

// Alternative: Use a more robust seed generation
const generateDevIdentityFromSeed = async (seedString) => {
  try {
    // Use Web Crypto API for better seed generation
    const encoder = new TextEncoder()
    const data = encoder.encode(seedString)
    
    // Create a hash of the seed
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const seed = new Uint8Array(hashBuffer)
    
    return Ed25519KeyIdentity.fromSecretKey(seed)
  } catch (error) {
    console.error('Web Crypto API not available, using fallback:', error)
    // Fallback to simple method
    return Ed25519KeyIdentity.generate()
  }
}

export const ICPProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [identity, setIdentity] = useState(null)
  const [principal, setPrincipal] = useState(null)
  const [actor, setActor] = useState(null)
  const [backend, setBackend] = useState(null)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const canisterId = import.meta.env.VITE_CANISTER_ID || 'uxrrr-q7777-77774-qaaaq-cai'
  const host = import.meta.env.VITE_IC_HOST || 'http://localhost:4943'

  useEffect(() => {
    initAuth()
  }, [])

  const initAuth = async () => {
    try {
      setError(null)
      // Check if we have stored identity from previous session
      const storedAuth = localStorage.getItem('icp_auth_state')
      const storedIdentity = localStorage.getItem('icp_dev_identity')
      
      if (storedAuth && storedIdentity) {
        // Try to restore previous session
        try {
          const identityData = JSON.parse(storedIdentity)
          const restoredIdentity = Ed25519KeyIdentity.fromSecretKey(new Uint8Array(identityData.secretKey))
          await authenticateWithIdentity(restoredIdentity)
        } catch (err) {
          console.warn('Failed to restore identity, creating new one:', err)
          localStorage.removeItem('icp_auth_state')
          localStorage.removeItem('icp_dev_identity')
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
      const agent = new HttpAgent({ 
        host,
        identity 
      })
      
      // Fetch root key for local development
      if (import.meta.env.VITE_DFX_NETWORK === 'local') {
        await agent.fetchRootKey()
      }

      const actorInstance = createActor(canisterId, { agent })
      const backendService = new PaymentBackendService(actorInstance)

      setActor(actorInstance)
      setBackend(backendService)
      
      return backendService
    } catch (err) {
      console.error('Actor creation error:', err)
      setError('Failed to connect to canister')
      throw err
    }
  }

  const authenticateWithIdentity = async (identity) => {
    const principal = identity.getPrincipal()
    
    setIdentity(identity)
    setPrincipal(principal)
    setIsAuthenticated(true)
    
    const backendService = await createActorConnection(identity)
    
    // Try to load user data
    await loadUserData(backendService)
    
    // Store auth state and identity for next session
    localStorage.setItem('icp_auth_state', 'authenticated')
    localStorage.setItem('icp_dev_identity', JSON.stringify({
      secretKey: Array.from(identity.getKeyPair().secretKey)
    }))
    
    return true
  }

  const login = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // For development: try different methods to generate identity
      let devIdentity
      
      try {
        // Method 1: Use Web Crypto API
        devIdentity = await generateDevIdentityFromSeed(DEV_IDENTITY_SEED)
      } catch (err) {
        console.warn('Web Crypto method failed, using fallback:', err)
        
        try {
          // Method 2: Simple seed method
          devIdentity = generateDevIdentity()
        } catch (err2) {
          console.warn('Seed method failed, using random:', err2)
          // Method 3: Just generate random identity
          devIdentity = Ed25519KeyIdentity.generate()
        }
      }
      
      console.log('🔑 Development Principal:', devIdentity.getPrincipal().toString())
      
      await authenticateWithIdentity(devIdentity)
      
      return true
    } catch (err) {
      console.error('Login error:', err)
      setError('Login failed. Please try again.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      setIsAuthenticated(false)
      setIdentity(null)
      setPrincipal(null)
      setUser(null)
      
      // Clear stored auth state
      localStorage.removeItem('icp_auth_state')
      localStorage.removeItem('icp_dev_identity')
      
      // Create anonymous actor
      await createActorConnection()
    } catch (err) {
      console.error('Logout error:', err)
      setError('Logout failed')
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserData = async (backendService = backend) => {
    try {
      if (!backendService) return null
      
      const userData = await backendService.getUser()
      setUser(userData)
      return userData
    } catch (err) {
      console.error('Load user error:', err)
      return null
    }
  }

  const registerUser = async (walletAddress, username, email) => {
    try {
      if (!backend) {
        throw new Error('Backend not initialized')
      }

      if (!isAuthenticated) {
        throw new Error('Must be authenticated to register')
      }

      console.log('🔄 Registering user with principal:', principal?.toString())
      
      const result = await backend.registerUser(walletAddress, username, email)
      
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

  const value = {
    isAuthenticated,
    identity,
    principal,
    actor,
    backend,
    user,
    isLoading,
    error,
    login,
    logout,
    registerUser,
    loadUserData,
    getUserStats,
    getSystemStats,
    getUserTransactionSummaries,
    getSupportedCurrencies,
    fetchExchangeRate,
    generateQR,
    validateQRCode,
    processPayment,
    canisterId,
    host
  }

  return (
    <ICPContext.Provider value={value}>
      {children}
    </ICPContext.Provider>
  )
}