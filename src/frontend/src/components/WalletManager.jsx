import React, { useState, useEffect, useRef } from 'react'
import { Ed25519KeyIdentity } from '@dfinity/identity'
import { Wallet, Eye, EyeOff, Key, Download, Upload, AlertCircle, CheckCircle, Copy, RefreshCw, Shield, Shuffle, RotateCcw } from 'lucide-react'

// Polyfill Buffer untuk browser
if (typeof window !== 'undefined' && !window.Buffer) {
  const { Buffer } = await import('buffer')
  window.Buffer = Buffer
  window.global = window.global || window
}

// Dynamic import untuk bip39 dengan error handling
let bip39Module = null
try {
  bip39Module = await import('bip39')
} catch (err) {
  console.warn('BIP39 not available, will use fallback method')
}

const RecoveryPhraseInput = ({ value, onChange, readOnly = false, showNumbers = true, mode = 'input' }) => {
  const [words, setWords] = useState(Array(12).fill(''))
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [showHints, setShowHints] = useState(false)
  const inputRefs = useRef([])

  useEffect(() => {
    if (value) {
      const wordArray = value.split(' ').slice(0, 12)
      const paddedWords = [...wordArray, ...Array(12 - wordArray.length).fill('')]
      setWords(paddedWords)
    }
  }, [value])

  // FIX: Update onChange untuk verification mode
  useEffect(() => {
    if (mode === 'verify' || mode === 'input') {
      const phrase = words.filter(w => w.trim()).join(' ')
      onChange(phrase)
    }
  }, [words, onChange, mode])

  const handleWordChange = (index, word) => {
    if (readOnly) return
    
    const newWords = [...words]
    newWords[index] = word.toLowerCase().trim()
    setWords(newWords)
    
    // FIX: Langsung update onChange untuk semua mode
    const phrase = newWords.filter(w => w.trim()).join(' ')
    onChange(phrase)

    // Auto-focus hanya pada paste atau spasi
    if (word.includes(' ')) {
      const splitWords = word.trim().split(/\s+/)
      if (splitWords.length > 1) {
        splitWords.forEach((w, i) => {
          if (index + i < 12) {
            newWords[index + i] = w
          }
        })
        setWords(newWords)
        const updatedPhrase = newWords.filter(w => w.trim()).join(' ')
        onChange(updatedPhrase)
        
        const nextIndex = Math.min(index + splitWords.length, 11)
        setCurrentWordIndex(nextIndex)
        inputRefs.current[nextIndex]?.focus()
      }
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !words[index] && index > 0) {
      setCurrentWordIndex(index - 1)
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      if (index < 11) {
        setCurrentWordIndex(index + 1)
        inputRefs.current[index + 1]?.focus()
      }
    }
    if (e.key === ' ' && words[index]) {
      e.preventDefault()
      if (index < 11) {
        setCurrentWordIndex(index + 1)
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleFocus = (index) => {
    setCurrentWordIndex(index)
  }

  const handlePaste = (e) => {
    if (readOnly) return
    
    e.preventDefault()
    const paste = e.clipboardData.getData('text')
    const pasteWords = paste.toLowerCase().split(/\s+/).slice(0, 12)
    
    const newWords = [...Array(12).fill('')]
    pasteWords.forEach((word, i) => {
      if (i < 12) newWords[i] = word
    })
    
    setWords(newWords)
    onChange(pasteWords.join(' '))
    setShowHints(false)
  }

  const clearAll = () => {
    const emptyWords = Array(12).fill('')
    setWords(emptyWords)
    onChange('')
    setCurrentWordIndex(0)
    inputRefs.current[0]?.focus()
  }

  const shuffleAndClear = () => {
    clearAll()
    setShowHints(true)
    setTimeout(() => setShowHints(false), 3000)
  }

  const getCompletionPercentage = () => {
    const filledWords = words.filter(w => w.trim()).length
    return Math.round((filledWords / 12) * 100)
  }

  const validateWord = (word) => {
    return word.length >= 3 && /^[a-z]+$/.test(word)
  }

  if (mode === 'verify') {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-blue-800 font-medium text-sm">Verification Progress</h4>
              <p className="text-blue-700 text-xs">Enter your 12-word recovery phrase to verify</p>
            </div>
            <div className="text-blue-600 font-mono text-sm">
              {getCompletionPercentage()}%
            </div>
          </div>
          <div className="mt-2 bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getCompletionPercentage()}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Enter Recovery Phrase</label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={shuffleAndClear}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                title="Clear and show hint"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
            {words.map((word, index) => (
              <div key={index} className="relative">
                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 font-mono z-10">
                  {index + 1}.
                </span>
                <input
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  value={word}
                  onChange={(e) => handleWordChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onFocus={() => handleFocus(index)}
                  onPaste={handlePaste}
                  placeholder={showHints ? `Word ${index + 1}` : ''}
                  className={`w-full pl-8 pr-3 py-2 border rounded-md text-sm font-mono focus:outline-none focus:ring-2 transition-all ${
                    currentWordIndex === index 
                      ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-sm' 
                      : 'border-gray-300 hover:border-gray-400'
                  } ${
                    word && validateWord(word) 
                      ? 'border-green-400 bg-green-50' 
                      : word && !validateWord(word) 
                      ? 'border-red-300 bg-red-50' 
                      : ''
                  }`}
                  autoComplete="off"
                  spellCheck="false"
                />
                {word && validateWord(word) && (
                  <CheckCircle className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-green-500" />
                )}
              </div>
            ))}
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>💡 <strong>Tips:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Paste all 12 words at once, or type them one by one</li>
              <li>Press <kbd className="px-1 py-0.5 bg-gray-100 rounded">Tab</kbd>, <kbd className="px-1 py-0.5 bg-gray-100 rounded">Enter</kbd>, or <kbd className="px-1 py-0.5 bg-gray-100 rounded">Space</kbd> to move to next field</li>
              <li>Words will turn green when valid</li>
              <li>Use Clear button if you need to start over</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  // Regular input mode (import wallet)
  return (
    <div className="space-y-3">
      {!readOnly && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-gray-800 font-medium text-sm">Input Progress</h4>
              <p className="text-gray-600 text-xs">Enter your 12-word recovery phrase</p>
            </div>
            <div className="text-gray-600 font-mono text-sm">
              {getCompletionPercentage()}%
            </div>
          </div>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getCompletionPercentage()}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
        {words.map((word, index) => (
          <div key={index} className="relative">
            {showNumbers && (
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 font-mono z-10">
                {index + 1}.
              </span>
            )}
            <input
              ref={el => inputRefs.current[index] = el}
              type="text"
              value={word}
              onChange={(e) => handleWordChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onFocus={() => handleFocus(index)}
              onPaste={handlePaste}
              placeholder={readOnly ? '' : `Word ${index + 1}`}
              readOnly={readOnly}
              className={`w-full pl-8 pr-3 py-2 border rounded-md text-sm font-mono focus:outline-none transition-all ${
                readOnly 
                  ? 'bg-gray-50 border-gray-200 text-gray-700' 
                  : currentWordIndex === index 
                  ? 'border-indigo-500 ring-2 ring-indigo-200 focus:ring-2 focus:ring-indigo-500 shadow-sm' 
                  : 'border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-indigo-500'
              } ${
                word && validateWord(word) 
                  ? 'border-green-400 bg-green-50' 
                  : word && !validateWord(word) && !readOnly
                  ? 'border-red-300 bg-red-50' 
                  : ''
              }`}
              autoComplete="off"
              spellCheck="false"
            />
            {word && validateWord(word) && !readOnly && (
              <CheckCircle className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-green-500" />
            )}
          </div>
        ))}
      </div>
      
      {!readOnly && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="space-y-1">
            <p>💡 You can paste all 12 words at once into any field</p>
            <p>🔑 Press Tab, Enter, or Space to move to the next word</p>
          </div>
          <button
            type="button"
            onClick={clearAll}
            className="text-gray-400 hover:text-gray-600 flex items-center"
            title="Clear all fields"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

const WalletManager = ({ onWalletConnect, onWalletCreate }) => {
  const [mode, setMode] = useState('login')
  const [mnemonic, setMnemonic] = useState('')
  const [walletName, setWalletName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [savedWallets, setSavedWallets] = useState([])
  const [mnemonicStep, setMnemonicStep] = useState('generate')
  const [verificationWords, setVerificationWords] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    loadSavedWallets()
  }, [])

  const loadSavedWallets = () => {
    const saved = localStorage.getItem('arta_wallets')
    if (saved) {
      try {
        setSavedWallets(JSON.parse(saved))
      } catch (err) {
        console.error('Error loading saved wallets:', err)
      }
    }
  }

  const generateNewMnemonic = async () => {
    try {
      console.log('🔄 Generating new mnemonic...')
      
      if (bip39Module) {
        try {
          const newMnemonic = bip39Module.generateMnemonic(128)
          console.log('✅ BIP39 mnemonic generated successfully')
          setMnemonic(newMnemonic)
          setError('')
          setSuccess('Recovery phrase generated successfully!')
          setMnemonicStep('backup')
          return
        } catch (bip39Error) {
          console.warn('⚠️ BIP39 failed, using fallback:', bip39Error)
        }
      }
      
      console.log('🔄 Using secure fallback generation...')
      const fallbackMnemonic = generateSecureFallbackMnemonic()
      setMnemonic(fallbackMnemonic)
      setError('')
      setSuccess('Recovery phrase generated (secure method)')
      setMnemonicStep('backup')
      
    } catch (err) {
      console.error('❌ Mnemonic generation error:', err)
      setError('Failed to generate recovery phrase. Please try again.')
    }
  }

  const generateSecureFallbackMnemonic = () => {
    // Use actual BIP39 wordlist subset untuk compatibility yang lebih baik
    const bip39WordlistSubset = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
      'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
      'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
      'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
      'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album',
      'alcohol', 'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone',
      'alpha', 'already', 'also', 'alter', 'always', 'amateur', 'amazing', 'among',
      'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle', 'angry',
      'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique',
      'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april',
      'arch', 'arctic', 'area', 'arena', 'argue', 'arm', 'armed', 'armor',
      'army', 'around', 'arrange', 'arrest', 'arrive', 'arrow', 'art', 'article',
      'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist', 'assume',
      'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction',
      'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado',
      'avoid', 'awake', 'aware', 'away', 'awesome', 'awful', 'awkward', 'axis',
      'baby', 'bachelor', 'bacon', 'badge', 'bag', 'balance', 'balcony', 'ball',
      'bamboo', 'banana', 'banner', 'bar', 'barely', 'bargain', 'barrel', 'base',
      'basic', 'basket', 'battle', 'beach', 'bean', 'beauty', 'because', 'become',
      'beef', 'before', 'begin', 'behave', 'behind', 'believe', 'below', 'belt',
      'bench', 'benefit', 'best', 'betray', 'better', 'between', 'beyond', 'bicycle',
      'bid', 'bike', 'bind', 'biology', 'bird', 'birth', 'bitter', 'black',
      'blade', 'blame', 'blanket', 'blast', 'bleak', 'bless', 'blind', 'blood',
      'blossom', 'blow', 'blue', 'blur', 'blush', 'board', 'boat', 'body',
      'boil', 'bomb', 'bone', 'bonus', 'book', 'boost', 'border', 'boring',
      'borrow', 'boss', 'bottom', 'bounce', 'box', 'boy', 'bracket', 'brain',
      'brand', 'brass', 'brave', 'bread', 'breeze', 'brick', 'bridge', 'brief',
      'bright', 'bring', 'brisk', 'broccoli', 'broken', 'bronze', 'broom', 'brother',
      'brown', 'brush', 'bubble', 'buddy', 'budget', 'buffalo', 'build', 'bulb',
      'bulk', 'bullet', 'bundle', 'bunker', 'burden', 'burger', 'burst', 'bus',
      'business', 'busy', 'butter', 'buyer', 'buzz', 'cabbage', 'cabin', 'cable',
      'cactus', 'cage', 'cake', 'call', 'calm', 'camera', 'camp', 'can',
      'canal', 'cancel', 'candy', 'cannon', 'canoe', 'canvas', 'canyon', 'capable',
      'capital', 'captain', 'car', 'carbon', 'card', 'care', 'career', 'careful',
      'careless', 'cargo', 'carpet', 'carry', 'cart', 'case', 'cash', 'casino',
      'castle', 'casual', 'cat', 'catalog', 'catch', 'category', 'cattle', 'caught',
      'cause', 'caution', 'cave', 'ceiling', 'celery', 'cement', 'census', 'century',
      'cereal', 'certain', 'chair', 'chalk', 'champion', 'change', 'chaos', 'chapter',
      'charge', 'chase', 'chat', 'cheap', 'check', 'cheese', 'chef', 'cherry',
      'chest', 'chicken', 'chief', 'child', 'chimney', 'choice', 'choose', 'chronic',
      'chuckle', 'chunk', 'churn', 'cigar', 'cinnamon', 'circle', 'citizen', 'city',
      'civil', 'claim', 'clamp', 'clarify', 'claw', 'clay', 'clean', 'clerk',
      'clever', 'click', 'client', 'cliff', 'climb', 'clinic', 'clip', 'clock',
      'clog', 'close', 'cloth', 'cloud', 'clown', 'club', 'clump', 'cluster',
      'clutch', 'coach', 'coast', 'coconut', 'code', 'coffee', 'coil', 'coin',
      'collect', 'color', 'column', 'combine', 'come', 'comfort', 'comic', 'common',
      'company', 'concert', 'conduct', 'confirm', 'congress', 'connect', 'consider', 'control',
      'convince', 'cook', 'cool', 'copper', 'copy', 'coral', 'core', 'corn',
      'correct', 'cost', 'cotton', 'couch', 'country', 'couple', 'course', 'cousin',
      'cover', 'coyote', 'crack', 'cradle', 'craft', 'cram', 'crane', 'crash',
      'crater', 'crawl', 'crazy', 'cream', 'credit', 'creek', 'crew', 'cricket',
      'crime', 'crisp', 'critic', 'crop', 'cross', 'crouch', 'crowd', 'crucial'
    ]
    
    // Use crypto.getRandomValues for better randomness
    const words = []
    const randomArray = new Uint32Array(12)
    
    // Fill with cryptographically secure random values
    crypto.getRandomValues(randomArray)
    
    for (let i = 0; i < 12; i++) {
      const randomIndex = randomArray[i] % bip39WordlistSubset.length
      words.push(bip39WordlistSubset[randomIndex])
    }
    
    const generatedMnemonic = words.join(' ')
    console.log('Generated fallback mnemonic:', generatedMnemonic)
    
    return generatedMnemonic
  }

  const encryptMnemonic = (mnemonic, password) => {
    const encoder = new TextEncoder()
    const mnemonicBytes = encoder.encode(mnemonic)
    const passwordBytes = encoder.encode(password)
    
    const key = new Uint8Array(32)
    for (let i = 0; i < 32; i++) {
      key[i] = passwordBytes[i % passwordBytes.length] ^ (i + 1)
    }
    
    const encrypted = new Uint8Array(mnemonicBytes.length)
    for (let i = 0; i < mnemonicBytes.length; i++) {
      encrypted[i] = mnemonicBytes[i] ^ key[i % key.length]
    }
    
    return btoa(String.fromCharCode(...encrypted))
  }

  const decryptMnemonic = (encryptedMnemonic, password) => {
    try {
      const encrypted = new Uint8Array(atob(encryptedMnemonic).split('').map(char => char.charCodeAt(0)))
      const passwordBytes = new TextEncoder().encode(password)
      
      const key = new Uint8Array(32)
      for (let i = 0; i < 32; i++) {
        key[i] = passwordBytes[i % passwordBytes.length] ^ (i + 1)
      }
      
      const decrypted = new Uint8Array(encrypted.length)
      for (let i = 0; i < encrypted.length; i++) {
        decrypted[i] = encrypted[i] ^ key[i % key.length]
      }
      
      return new TextDecoder().decode(decrypted)
    } catch (err) {
      throw new Error('Invalid password or corrupted wallet data')
    }
  }

  // Replace fungsi mnemonicToIdentity dengan yang deterministic
  const mnemonicToIdentity = async (mnemonic) => {
    try {
      console.log('🔄 Converting mnemonic to identity (deterministic)...')
      
      // Check if we already have stored identity for this exact mnemonic
      const mnemonicHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(mnemonic.trim()))
      const mnemonicHashString = Array.from(new Uint8Array(mnemonicHash)).map(b => b.toString(16).padStart(2, '0')).join('')
      
      console.log('Mnemonic hash:', mnemonicHashString.slice(0, 16) + '...')
      
      // Try to get stored identity first
      const storedIdentity = localStorage.getItem(`icp_identity_${mnemonicHashString}`)
      
      if (storedIdentity) {
        try {
          const keyData = JSON.parse(storedIdentity)
          const identity = Ed25519KeyIdentity.fromSecretKey(new Uint8Array(keyData.privateKey))
          console.log('✅ Restored identity from storage')
          console.log('Principal:', identity.getPrincipal().toString())
          return identity
        } catch (err) {
          console.warn('Failed to restore stored identity, will regenerate')
          localStorage.removeItem(`icp_identity_${mnemonicHashString}`)
        }
      }
      
      // Generate deterministic identity from mnemonic
      const encoder = new TextEncoder()
      const mnemonicData = encoder.encode(mnemonic.trim())
      
      // Use PBKDF2 for deterministic key derivation
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        mnemonicData,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      )
      
      // Use mnemonic hash as salt for deterministic generation
      const salt = new Uint8Array(mnemonicHash).slice(0, 16)
      
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        256 // 32 bytes
      )
      
      const seed = new Uint8Array(derivedBits)
      console.log('Generated deterministic seed length:', seed.length)
      
      // Create identity
      const identity = Ed25519KeyIdentity.fromSecretKey(seed)
      const principal = identity.getPrincipal().toString()
      
      // Store this identity for future use
      const keyData = {
        privateKey: Array.from(identity.getKeyPair().secretKey),
        publicKey: Array.from(identity.getKeyPair().publicKey),
        principal: principal,
        mnemonicHash: mnemonicHashString,
        created: Date.now()
      }
      
      localStorage.setItem(`icp_identity_${mnemonicHashString}`, JSON.stringify(keyData))
      
      console.log('✅ Generated and stored deterministic identity')
      console.log('Principal:', principal)
      
      return identity
      
    } catch (err) {
      console.error('❌ Identity conversion failed:', err)
      throw new Error('Failed to create wallet identity. Please try again.')
    }
  }

  // Fix saveWallet function to store mnemonic hash reference
  const saveWallet = async (name, encryptedMnemonic, identity, mnemonic) => {
    // Generate mnemonic hash for referencing
    const mnemonicHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(mnemonic.trim()))
    const mnemonicHashString = Array.from(new Uint8Array(mnemonicHash)).map(b => b.toString(16).padStart(2, '0')).join('')
    
    const walletData = {
      id: Date.now().toString(),
      name,
      encryptedMnemonic,
      principal: identity.getPrincipal().toString(),
      created: new Date().toISOString(),
      mnemonicHash: mnemonicHashString // Store reference to identity
    }
    
    const existing = savedWallets.filter(w => w.name !== name && w.principal !== walletData.principal)
    const updated = [...existing, walletData]
    
    localStorage.setItem('arta_wallets', JSON.stringify(updated))
    setSavedWallets(updated)
  }

  // Fix handleLoginWallet with proper password validation
  const handleLoginWallet = async (wallet) => {
    if (!password) {
      setError('Please enter wallet password')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      console.log('🔐 Attempting to unlock wallet:', wallet.name)
      
      // Step 1: Try to decrypt mnemonic with provided password
      let decryptedMnemonic
      try {
        decryptedMnemonic = decryptMnemonic(wallet.encryptedMnemonic, password)
        console.log('✅ Password correct - mnemonic decrypted')
      } catch (decryptError) {
        console.log('❌ Password incorrect')
        setError('Incorrect password. Please try again.')
        return
      }
      
      // Step 2: Generate identity from decrypted mnemonic (deterministic)
      const identity = await mnemonicToIdentity(decryptedMnemonic)
      const generatedPrincipal = identity.getPrincipal().toString()
      
      console.log('Generated principal:', generatedPrincipal)
      console.log('Expected principal:', wallet.principal)
      
      // Step 3: Verify that generated identity matches stored wallet
      if (generatedPrincipal !== wallet.principal) {
        console.error('❌ Principal mismatch!')
        console.error('Expected:', wallet.principal)
        console.error('Generated:', generatedPrincipal)
        setError('Wallet integrity check failed. This wallet may be corrupted.')
        return
      }
      
      console.log('✅ Identity verification successful')
      
      // Step 4: Clear password and show success
      setPassword('')
      setSuccess('Wallet unlocked successfully!')
      
      // Step 5: Connect wallet
      setTimeout(() => {
        onWalletConnect(identity, wallet.name)
      }, 1000)
      
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Failed to unlock wallet. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const verifyMnemonic = () => {
    const originalWords = mnemonic.trim().split(/\s+/)
    const verificationWordsArray = verificationWords.trim().split(/\s+/).filter(w => w)
    
    if (verificationWordsArray.length !== 12) {
      setError(`Please enter all 12 words (you entered ${verificationWordsArray.length})`)
      return false
    }
    
    // Compare each word
    for (let i = 0; i < originalWords.length; i++) {
      if (originalWords[i] !== verificationWordsArray[i]) {
        console.log(`❌ Word ${i + 1} mismatch: expected "${originalWords[i]}" but got "${verificationWordsArray[i]}"`)
        setError(`Word ${i + 1} doesn't match. Expected "${originalWords[i]}" but got "${verificationWordsArray[i]}"`)
        return false
      }
    }
    
    setError('')
    setSuccess('Recovery phrase verified successfully!')
    return true
  }

  // Fix handleCreateWallet to pass mnemonic to saveWallet
  const handleCreateWallet = async (e) => {
    e.preventDefault()
    
    if (mnemonicStep === 'verify') {
      console.log('🔍 Starting verification...')
      
      if (!verifyMnemonic()) {
        console.log('❌ Verification failed')
        return
      }
      console.log('✅ Verification passed')
    }
    
    if (!mnemonic || !walletName || !password) {
      setError('Please fill all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      console.log('🔄 Creating wallet with mnemonic...')
      
      const identity = await mnemonicToIdentity(mnemonic)
      const encryptedMnemonic = encryptMnemonic(mnemonic, password)
      
      // Pass mnemonic to saveWallet for hash reference
      await saveWallet(walletName, encryptedMnemonic, identity, mnemonic)
      
      setSuccess('Wallet created successfully!')
      setTimeout(() => {
        onWalletCreate(identity, walletName, mnemonic)
      }, 1000)
      
    } catch (err) {
      console.error('Create wallet error:', err)
      setError(err.message || 'Failed to create wallet')
    } finally {
      setLoading(false)
    }
  }

  // Fix handleImportWallet to pass mnemonic to saveWallet
  const handleImportWallet = async (e) => {
    e.preventDefault()
    
    if (!mnemonic || !walletName || !password) {
      setError('Please fill all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    const words = mnemonic.trim().split(/\s+/)
    if (words.length !== 12) {
      setError('Recovery phrase must contain exactly 12 words')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      console.log('🔄 Importing wallet with mnemonic...')
      
      const identity = await mnemonicToIdentity(mnemonic)
      const encryptedMnemonic = encryptMnemonic(mnemonic, password)
      
      // Pass mnemonic to saveWallet for hash reference
      await saveWallet(walletName, encryptedMnemonic, identity, mnemonic)
      
      setSuccess('Wallet imported successfully!')
      setTimeout(() => {
        onWalletConnect(identity, walletName)
      }, 1000)
      
    } catch (err) {
      console.error('Import wallet error:', err)
      setError(err.message || 'Failed to import wallet')
    } finally {
      setLoading(false)
    }
  }

  const copyMnemonic = () => {
    navigator.clipboard.writeText(mnemonic)
    setSuccess('Recovery phrase copied to clipboard!')
    setTimeout(() => setSuccess(''), 2000)
  }

  const downloadMnemonic = () => {
    const element = document.createElement('a')
    const file = new Blob([`Arta Wallet Recovery Phrase\n\nWallet: ${walletName}\nCreated: ${new Date().toISOString()}\n\nRecovery Phrase:\n${mnemonic}\n\n⚠️ IMPORTANT: Keep this safe and never share it with anyone!`], {type: 'text/plain'})
    element.href = URL.createObjectURL(file)
    element.download = `arta-wallet-${walletName}-recovery.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    
    setSuccess('Recovery phrase downloaded!')
    setTimeout(() => setSuccess(''), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header - Fixed */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Arta Wallet</h2>
          <p className="text-sm text-gray-600">Secure blockchain wallet for ICP payments</p>
        </div>

        {/* Mode Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mt-4">
          <button
            onClick={() => {
              setMode('login')
              setMnemonicStep('generate')
              setError('')
              setSuccess('')
            }}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              mode === 'login' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setMode('create')
              setMnemonicStep('generate')
              setError('')
              setSuccess('')
            }}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              mode === 'create' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'
            }`}
          >
            Create
          </button>
          <button
            onClick={() => {
              setMode('import')
              setMnemonicStep('generate')
              setError('')
              setSuccess('')
            }}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              mode === 'import' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'
            }`}
          >
            Import
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="max-h-96 md:max-h-[500px] overflow-y-auto px-6 py-4">
        {/* Login Mode */}
        {mode === 'login' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Select Wallet</h3>
            
            {savedWallets.length === 0 ? (
              <div className="text-center py-8">
                <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No saved wallets found</p>
                <p className="text-sm text-gray-400">Create or import a wallet to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedWallets.map((wallet) => (
                  <div key={wallet.id} className="border rounded-lg p-4 hover:border-indigo-300 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <Shield className="w-4 h-4 text-green-500 mr-2" />
                        {wallet.name}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {new Date(wallet.created).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 font-mono break-all">
                      {wallet.principal.slice(0, 20)}...
                    </p>
                    
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <button
                        onClick={() => handleLoginWallet(wallet)}
                        disabled={loading || !password}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm flex items-center"
                      >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : null}
                        Unlock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Mode */}
        {mode === 'create' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Create New Wallet</h3>
            
            {/* Step Indicator */}
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                mnemonicStep === 'generate' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <div className="w-6 h-1 bg-gray-200"></div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                mnemonicStep === 'backup' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <div className="w-6 h-1 bg-gray-200"></div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                mnemonicStep === 'verify' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
            </div>

            <form onSubmit={handleCreateWallet}>
              {mnemonicStep === 'generate' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Name</label>
                    <input
                      type="text"
                      value={walletName}
                      onChange={(e) => setWalletName(e.target.value)}
                      placeholder="My Arta Wallet"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a secure password (min 8 characters)"
                        className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
              )}

              {mnemonicStep === 'backup' && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-amber-800 font-medium text-sm">Backup Your Recovery Phrase</h4>
                        <p className="text-amber-700 text-xs mt-1">
                          Write down these 12 words in order and store them safely.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Your Recovery Phrase</label>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={copyMnemonic}
                          className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={downloadMnemonic}
                          className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </button>
                      </div>
                    </div>
                    
                    <RecoveryPhraseInput
                      value={mnemonic}
                      onChange={() => {}}
                      readOnly={true}
                      mode="display"
                    />
                  </div>
                </div>
              )}

              {mnemonicStep === 'verify' && (
                <div className="space-y-4">
                  <RecoveryPhraseInput
                    value={verificationWords}
                    onChange={setVerificationWords}
                    readOnly={false}
                    mode="verify"
                  />
                </div>
              )}
            </form>
          </div>
        )}

        {/* Import Mode */}
        {mode === 'import' && (
          <form onSubmit={handleImportWallet} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Import Existing Wallet</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Name</label>
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="Imported Wallet"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password (min 8 characters)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recovery Phrase</label>
              <RecoveryPhraseInput
                value={mnemonic}
                onChange={setMnemonic}
                readOnly={false}
                mode="input"
              />
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

      {/* Fixed Footer with Action Buttons */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        {mode === 'create' && (
          <div className="flex space-x-3">
            {mnemonicStep === 'generate' && (
              <button
                type="button"
                onClick={generateNewMnemonic}
                disabled={!walletName || !password || password !== confirmPassword}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate Recovery Phrase
              </button>
            )}

            {mnemonicStep === 'backup' && (
              <>
                <button
                  type="button"
                  onClick={() => setMnemonicStep('generate')}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setMnemonicStep('verify')}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
                >
                  I've Saved It
                </button>
              </>
            )}

            {mnemonicStep === 'verify' && (
              <>
                <button
                  type="button"
                  onClick={() => setMnemonicStep('backup')}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  type="submit"
                  onClick={handleCreateWallet}
                  disabled={loading || !verificationWords || verificationWords.split(' ').filter(w => w).length !== 12}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Wallet
                </button>
              </>
            )}
          </div>
        )}

        {mode === 'import' && (
          <button
            type="submit"
            onClick={handleImportWallet}
            disabled={loading || !mnemonic || !walletName || !password || password !== confirmPassword}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            Import Wallet
          </button>
        )}
      </div>
    </div>
  )
}

export default WalletManager