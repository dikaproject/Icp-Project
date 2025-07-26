import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useICP } from '../contexts/ICPContext'
import { 
  Wallet, 
  QrCode, 
  Globe, 
  Shield, 
  Zap, 
  Users,
  ArrowRight,
  CheckCircle,
  Star,
  Smartphone,
  CreditCard,
  TrendingUp,
  Lock,
  Send,
  Sparkles,
  Calendar,
  Monitor,
  Search,
  DollarSign,
  Banknote,
  RefreshCw,
  Link2,
  Eye,
  Building2,
  Download,
  Code,
  Database,
  Layers,
  Clock,
  Github,
  Twitter,
  Linkedin,
  Mail,
  BarChart3,
  Palette,
  ArrowLeft,
  CheckCircle2,
  Server,
  Activity,
  Cpu,
  HardDrive,
  Network as NetworkIcon,
  MapPin,
  Gauge,
  LineChart,
  PieChart,
  MoreHorizontal,
  ExternalLink,
  ChevronUp,
  Power,
  Flame,
  Loader,
  AlertCircle,
  User
} from 'lucide-react'
import Flag from 'react-world-flags'

const NetworkDashboard = () => {
  const { backend, showWalletModal, setShowWalletModal } = useICP()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [networkStats, setNetworkStats] = useState({
    total_icp_volume: 0,
    total_transactions: 0,
    completed_transactions: 0,
    failed_transactions: 0,
    pending_transactions: 0,
    active_countries: 0,
    total_users: 0,
    currency_stats: []
  })
  const [allTransactions, setAllTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [transactionsPerPage] = useState(10)

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    if (backend) {
      fetchNetworkData()
    }
  }, [backend])

  const convertBigIntToNumber = (value) => {
    if (typeof value === 'bigint') {
      return Number(value)
    }
    return value || 0
  }

  const convertBigIntInObject = (obj) => {
    if (!obj) return obj
    
    if (Array.isArray(obj)) {
      return obj.map(item => convertBigIntInObject(item))
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const converted = {}
      
      Object.keys(obj).forEach(key => {
        const value = obj[key]
        
        if (typeof value === 'bigint') {
          converted[key] = Number(value)
        } else if (Array.isArray(value)) {
          converted[key] = value.map(item => convertBigIntInObject(item))
        } else if (typeof value === 'object' && value !== null) {
          converted[key] = convertBigIntInObject(value)
        } else {
          converted[key] = value
        }
      })
      
      return converted
    }
    
    return typeof obj === 'bigint' ? Number(obj) : obj
  }

  const fetchNetworkData = async () => {
    if (!backend) return

    try {
      setLoading(true)
      setError('')
      
      console.log('Fetching network data...')
      
      const [stats, transactions] = await Promise.all([
        backend.getNetworkStats().catch(err => {
          console.warn('Failed to fetch network stats:', err)
          return null
        }),
        backend.getAllTransactions().catch(err => {
          console.warn('Failed to fetch transactions:', err)
          return []
        })
      ])
      
      console.log('Raw stats:', stats)
      console.log('Raw transactions:', transactions)
      
      if (stats) {
        const convertedStats = convertBigIntInObject(stats)
        console.log('Converted stats:', convertedStats)
        setNetworkStats(prevStats => ({
          ...prevStats,
          ...convertedStats
        }))
      } else {
        console.log('No stats received, keeping current state')
      }
      
      if (Array.isArray(transactions)) {
        const convertedTransactions = convertBigIntInObject(transactions)
        console.log('Converted transactions:', convertedTransactions)
        setAllTransactions(convertedTransactions)
      } else {
        console.warn('Transactions is not an array:', transactions)
        setAllTransactions([])
      }
    } catch (err) {
      console.error('Error fetching network data:', err)
      setError('Failed to load network data: ' + err.message)
      
      // Only set fallback data if we don't have any data at all
      if (!networkStats || (networkStats.total_transactions === 0 && allTransactions.length === 0)) {
        console.log('Setting fallback data due to complete failure')
      }
    } finally {
      setLoading(false)
    }
  }

  const currencyCountryMap = {
    USD: { name: 'United States', code: 'US', region: 'Americas' },
    EUR: { name: 'European Union', code: 'EU', region: 'Europe' },
    GBP: { name: 'United Kingdom', code: 'GB', region: 'Europe' },
    JPY: { name: 'Japan', code: 'JP', region: 'Asia' },
    IDR: { name: 'Indonesia', code: 'ID', region: 'Asia' },
    SGD: { name: 'Singapore', code: 'SG', region: 'Asia' },
    MYR: { name: 'Malaysia', code: 'MY', region: 'Asia' },
    PHP: { name: 'Philippines', code: 'PH', region: 'Asia' },
    THB: { name: 'Thailand', code: 'TH', region: 'Asia' },
    VND: { name: 'Vietnam', code: 'VN', region: 'Asia' },
    KRW: { name: 'South Korea', code: 'KR', region: 'Asia' },
    CNY: { name: 'China', code: 'CN', region: 'Asia' },
    AUD: { name: 'Australia', code: 'AU', region: 'Oceania' },
    CAD: { name: 'Canada', code: 'CA', region: 'Americas' },
    INR: { name: 'India', code: 'IN', region: 'Asia' }
  }

  const formatICP = (amount) => {
    const numAmount = convertBigIntToNumber(amount)
    if (numAmount === 0) return '0.00000000'
    const icp = numAmount / 100_000_000
    return icp.toFixed(8)
  }

  const formatNumber = (num) => {
    return convertBigIntToNumber(num).toLocaleString()
  }

  const formatCurrency = (amount, currency) => {
    const numAmount = convertBigIntToNumber(amount)
    if (numAmount === 0) return '0.00'
    const symbols = {
      USD: '$', EUR: '€', GBP: '£', JPY: '¥', IDR: 'Rp ',
      SGD: 'S$', MYR: 'RM', PHP: '₱', THB: '฿', VND: '₫',
      KRW: '₩', CNY: '¥', AUD: 'A$', CAD: 'C$', INR: '₹'
    }
    const symbol = symbols[currency] || currency + ' '
    return `${symbol}${numAmount.toLocaleString()}`
  }

  const getDynamicNetworkStats = () => {
    const totalVolume = convertBigIntToNumber(networkStats.total_icp_volume || 0)
    const totalTx = convertBigIntToNumber(networkStats.total_transactions || 0)
    const completedTx = convertBigIntToNumber(networkStats.completed_transactions || 0)

    return [
      {
        title: "Total ICP Volume",
        value: formatICP(totalVolume),
        unit: "ICP",
        change: "+8.5%",
        changeType: "positive",
        icon: <Flame className="w-6 h-6" />
      },
      {
        title: "Total Transactions",
        value: formatNumber(totalTx),
        unit: "TXs",
        change: "+12.5%",
        changeType: "positive", 
        icon: <Activity className="w-6 h-6" />
      },
      {
        title: "Success Rate",
        value: Math.round((completedTx / Math.max(totalTx, 1)) * 100).toString(),
        unit: "%",
        change: "+2.1%",
        changeType: "positive",
        icon: <Cpu className="w-6 h-6" />
      }
    ]
  }

  const getRealDecentralizationStats = () => {
    const currencies = networkStats.currency_stats?.length || 0
    const countries = networkStats.active_countries || 0
    const users = networkStats.total_users || 0

    return [
      { label: "Active Countries", value: formatNumber(countries), description: "Global presence" },
      { label: "Supported Currencies", value: formatNumber(currencies), description: "Fiat currencies" },
      { label: "Total Users", value: formatNumber(users), description: "Registered users" },
      { label: "Completed Payments", value: formatNumber(networkStats?.completed_transactions || 0), description: "Successful transactions" },
      { label: "Failed Payments", value: formatNumber(networkStats?.failed_transactions || 0), description: "Failed transactions" },
      { label: "Pending Payments", value: formatNumber(networkStats?.pending_transactions || 0), description: "Processing transactions" }
    ]
  }

  const getRecentTransactions = () => {
    if (!Array.isArray(allTransactions) || allTransactions.length === 0) {
      return []
    }

    // Calculate pagination
    const startIndex = (currentPage - 1) * transactionsPerPage
    const endIndex = startIndex + transactionsPerPage

    return allTransactions.slice(startIndex, endIndex).map((tx, index) => {
      const getStatusText = (status) => {
        if (typeof status === 'object' && status !== null) {
          const statusKeys = Object.keys(status)
          if (statusKeys.length > 0) {
            return statusKeys[0]
          }
        }
        return status || 'Unknown'
      }

      const currency = tx.fiat_currency || 'USD'
      const currencyInfo = currencyCountryMap[currency]
      
      return {
        id: tx.id || `tx-${startIndex + index}`,
        type: getStatusText(tx.status) === 'Completed' ? 'Payment' : 'Processing',
        countryCode: currencyInfo?.code || 'UN',
        countryName: currencyInfo?.name || 'Unknown',
        amount: formatCurrency(tx.fiat_amount || 0, currency),
        status: getStatusText(tx.status),
        icpAmount: formatICP(tx.amount || 0),
        currency: currency
      }
    })
  }

  const getTotalPages = () => {
    return Math.ceil(allTransactions.length / transactionsPerPage)
  }

  const getTransactionRange = () => {
    const start = (currentPage - 1) * transactionsPerPage + 1
    const end = Math.min(currentPage * transactionsPerPage, allTransactions.length)
    return { start, end }
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= getTotalPages()) {
      setCurrentPage(newPage)
    }
  }

  const generatePageNumbers = () => {
    const totalPages = getTotalPages()
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      const start = Math.max(1, currentPage - 2)
      const end = Math.min(totalPages, start + maxVisiblePages - 1)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
    }
    
    return pages
  }

  const getCurrencyDistribution = () => {
    if (!networkStats?.currency_stats || !Array.isArray(networkStats.currency_stats)) {
      return []
    }
    
    return networkStats.currency_stats.slice(0, 5).map(stat => {
      const currencyInfo = currencyCountryMap[stat.currency]
      return {
        name: currencyInfo?.name || stat.currency,
        volume: convertBigIntToNumber(stat.total_icp_volume || 0),
        countryCode: currencyInfo?.code || 'UN',
        currency: stat.currency
      }
    })
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: "easeOut" }
  }

  if (loading) {
    return (
      <div className="min-h-screen text-white overflow-hidden relative" style={{ backgroundColor: '#030014' }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
            <h2 className="text-xl font-aeonik text-white mb-2">Loading Network Data</h2>
            <p className="text-slate-400">Fetching real-time network statistics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen text-white overflow-hidden relative" style={{ backgroundColor: '#030014' }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-aeonik text-white mb-2">Error Loading Data</h2>
            <p className="text-slate-400 mb-4">{error}</p>
            <button
              onClick={fetchNetworkData}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white overflow-hidden relative" style={{
      backgroundColor: '#030014'
    }}>
      <style>{`
        html { scroll-behavior: smooth; }
        body { scroll-behavior: smooth; }
      `}</style>
      
      <div 
        className="fixed inset-0 opacity-5"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(147, 51, 234, 0.1) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 70%)`,
          zIndex: 1
        }}
      />

      <header className="relative z-50 px-6 py-6 border-b border-slate-800/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center space-x-3"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-xl font-aeonik font-semibold text-white">Arta Wallet</span>
          </motion.div>
          
          <motion.nav 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden md:flex items-center space-x-8"
          >
            <Link to="/" className="text-slate-400 hover:text-white transition-colors text-sm">Home</Link>
            <Link to="/about" className="text-slate-400 hover:text-white transition-colors text-sm">About</Link>
            <Link to="/network" className="text-white transition-colors text-sm">Network</Link>
            <a 
              href="https://discord.gg/8bqp5ZWQjG" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              Community
            </a>
          </motion.nav>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center space-x-4 relative"
          >
            <button
              onClick={fetchNetworkData}
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            <div className="relative group">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-300 flex items-center space-x-2"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
                <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Backdrop */}
              {isDropdownOpen && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsDropdownOpen(false)} 
                />
              )}
              
              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-lg shadow-xl z-50">
                  <div className="py-2">
                    <div className="px-4 py-2 text-xs text-slate-400 font-medium uppercase tracking-wide border-b border-slate-700/50 mb-2">
                      Authentication
                    </div>
                    <button 
                      onClick={() => {
                        setIsDropdownOpen(false)
                        setShowWalletModal(true)
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors group"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3 group-hover:scale-105 transition-transform">
                        <Wallet className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Login</div>
                        <div className="text-xs text-slate-400">Connect existing wallet</div>
                      </div>
                    </button>
                    <button 
                      onClick={() => {
                        setIsDropdownOpen(false)
                        setShowWalletModal(true)
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors group"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-3 group-hover:scale-105 transition-transform">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Register</div>
                        <div className="text-xs text-slate-400">Create new account</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </header>

      <div className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Link 
              to="/" 
              className="inline-flex items-center text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className="text-center mb-20"
          >
            <h1 className="text-5xl md:text-6xl font-aeonik font-normal mb-6 text-white">
              Network <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Dashboard</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-4xl mx-auto leading-relaxed">
              Real-time insights into Arta Wallet's payment network infrastructure and transaction data
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
                className="bg-slate-900/30 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6 h-[500px] relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-aeonik font-semibold text-white">Network Topology</h3>
                  <button className="text-slate-400 hover:text-white transition-colors">
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <div 
                    className="w-full h-full relative"
                    style={{
                      height: '100%',
                      filter: 'drop-shadow(0 0 40px rgba(147, 51, 234, 0.3))'
                    }}
                  >
                    <iframe 
                      src='https://my.spline.design/worldplanet-OxUyE8hTcWqVj8GqPELAB6z4/' 
                      frameBorder='0' 
                      width='100%' 
                      height='100%'
                      style={{
                        position: 'relative',
                        transform: 'scale(1.2)',
                        pointerEvents: 'none',
                        userSelect: 'none',
                      }}
                    />
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-4">
                  {getDynamicNetworkStats().map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4"
                    >
                      <div className="flex items-center mb-2">
                        <div className="text-purple-400 mr-2">
                          {stat.icon}
                        </div>
                        <span className="text-xs text-slate-400">{stat.title}</span>
                      </div>
                      <div className="text-2xl font-aeonik font-bold text-white mb-1">
                        {stat.value}
                      </div>
                      <div className="text-xs text-slate-400">
                        {stat.unit} <span className="text-green-400">{stat.change}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            <div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="bg-slate-900/30 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-aeonik font-semibold text-white">Network Statistics</h3>
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                </div>

                <div className="text-center mb-6">
                  <div className="grid grid-cols-6 gap-2 mb-4">
                    {Array.from({ length: Math.min(30, Math.max(1, (networkStats?.active_countries || 0) * 2)) }, (_, i) => (
                      <div key={i} className="w-3 h-3 bg-blue-500 rounded-sm opacity-80"></div>
                    ))}
                  </div>
                  <div className="text-3xl font-aeonik font-bold text-white mb-2">
                    {formatNumber(networkStats?.active_countries || 0)}
                  </div>
                  <div className="text-sm text-slate-400">Countries with Active Users</div>
                </div>

                <div className="space-y-4">
                  {getRealDecentralizationStats().map((stat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="text-slate-300 text-sm">{stat.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">{stat.value}</div>
                        <div className="text-xs text-slate-400">{stat.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          <section className="mb-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <h2 className="text-2xl font-aeonik font-semibold text-white mb-2">Recent Transactions</h2>
              <p className="text-slate-400">Latest payment transactions on the network</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-slate-900/30 backdrop-blur-sm border border-slate-800/50 rounded-2xl overflow-hidden mb-8"
            >
              <div className="p-6 border-b border-slate-800/30">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-aeonik font-semibold text-white">
                    {formatNumber(allTransactions.length)} Total Transactions
                  </h3>
                  <div className="flex items-center space-x-4">
                    {allTransactions.length > 0 && (
                      <span className="text-sm text-slate-400">
                        Showing {getTransactionRange().start}-{getTransactionRange().end} of {allTransactions.length}
                      </span>
                    )}
                    <div className="flex items-center space-x-2">
                      <Link 
                        to="/network"
                        className="text-slate-400 hover:text-white transition-colors text-sm"
                      >
                        View All
                      </Link>
                      <MoreHorizontal className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Transaction</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Currency</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">ICP Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getRecentTransactions().length > 0 ? (
                      getRecentTransactions().map((tx, index) => (
                        <motion.tr
                          key={tx.id || index}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.05 }}
                          viewport={{ once: true }}
                          className="border-t border-slate-800/30 hover:bg-slate-800/20 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-3 ${
                                tx.status === 'Completed' ? 'bg-green-400' : 
                                tx.status === 'Processing' ? 'bg-yellow-400' : 'bg-blue-400'
                              }`}></div>
                              <span className="text-blue-400 text-sm font-mono">
                                {tx.id.length > 20 ? `${tx.id.slice(0, 20)}...` : tx.id}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-slate-300 text-sm font-medium">{tx.amount}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-6 h-4 rounded overflow-hidden border border-slate-600/50">
                                <Flag 
                                  code={tx.countryCode} 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  fallback={<span className="text-xs">🌍</span>}
                                />
                              </div>
                              <div>
                                <div className="text-slate-300 text-sm font-medium">{tx.currency}</div>
                                <div className="text-slate-400 text-xs">{tx.countryName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              tx.status === 'Completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                              tx.status === 'Processing' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                              tx.status === 'Pending' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-slate-300 text-sm font-mono">{tx.icpAmount} ICP</span>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center">
                          <div className="text-slate-400">
                            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-medium mb-2">No Transactions Found</h3>
                            <p className="text-sm">
                              {loading ? 'Loading transactions...' : 'No payment transactions available yet.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {allTransactions.length > transactionsPerPage && (
                <div className="px-6 py-4 border-t border-slate-800/30 bg-slate-900/20">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-400">
                      Showing {getTransactionRange().start} to {getTransactionRange().end} of {allTransactions.length} transactions
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Previous Button */}
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm bg-slate-800/50 text-slate-300 rounded-lg hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>

                      {/* Page Numbers */}
                      <div className="flex space-x-1">
                        {generatePageNumbers().map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                              pageNum === currentPage
                                ? 'bg-purple-500 text-white'
                                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>

                      {/* Next Button */}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === getTotalPages()}
                        className="px-3 py-2 text-sm bg-slate-800/50 text-slate-300 rounded-lg hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </section>

          <section className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="bg-slate-900/30 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-aeonik font-semibold text-white">Top Currencies</h3>
                  <button className="text-slate-400 hover:text-white transition-colors text-sm">View</button>
                </div>
                
                <div className="text-center mb-6">
                  <div className="text-4xl font-aeonik font-bold text-white mb-2">
                    {formatNumber(networkStats?.currency_stats?.length || 0)}
                  </div>
                  <div className="text-sm text-slate-400">Supported Currencies</div>
                </div>

                <div className="space-y-3">
                  {getCurrencyDistribution().map((currency, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-6 rounded overflow-hidden border border-slate-600/50 flex-shrink-0">
                          <Flag 
                            code={currency.countryCode} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            fallback={<span className="text-xs">🌍</span>}
                          />
                        </div>
                        <div>
                          <div className="text-slate-300 text-sm font-medium">{currency.currency}</div>
                          <div className="text-slate-400 text-xs">{currency.name}</div>
                        </div>
                      </div>
                      <span className="text-slate-400 text-sm font-mono">{formatICP(currency.volume)} ICP</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                viewport={{ once: true }}
                className="bg-slate-900/30 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-aeonik font-semibold text-white">Network Health</h3>
                  <button className="text-slate-400 hover:text-white transition-colors text-sm">View</button>
                </div>
                
                <div className="text-center mb-6">
                  <div className="text-4xl font-aeonik font-bold text-green-400 mb-2">
                    {Math.round(((networkStats?.completed_transactions || 0) / Math.max(networkStats?.total_transactions || 1, 1)) * 100)}%
                  </div>
                  <div className="text-sm text-slate-400">Success Rate</div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-300 text-sm">Total Users</span>
                    <span className="text-white font-medium">{formatNumber(networkStats?.total_users || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300 text-sm">Completed</span>
                    <span className="text-green-400 font-medium">{formatNumber(networkStats?.completed_transactions || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300 text-sm">Pending</span>
                    <span className="text-yellow-400 font-medium">{formatNumber(networkStats?.pending_transactions || 0)}</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-slate-900/30 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-aeonik font-semibold text-white">Volume Stats</h3>
                  <button className="text-slate-400 hover:text-white transition-colors text-sm">View</button>
                </div>
                
                <div className="text-center mb-6">
                  <div className="text-4xl font-aeonik font-bold text-white mb-2">
                    {formatICP(networkStats?.total_icp_volume || 0)}
                  </div>
                  <div className="text-sm text-slate-400">Total ICP Volume</div>
                </div>

                <div className="h-20 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                  <LineChart className="w-8 h-8 text-purple-400" />
                </div>
              </motion.div>
            </div>
          </section>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-8">
              <h3 className="text-2xl font-aeonik font-semibold text-white mb-4">
                Powered by Internet Computer Protocol
              </h3>
              <p className="text-slate-400 mb-6">
                Experience the most advanced blockchain infrastructure with true Web3 capabilities
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105"
                >
                  Try Arta Wallet
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link
                  to="/network"
                  className="inline-flex items-center border border-white/30 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all duration-300"
                >
                  View Detailed Stats
                  <ExternalLink className="w-5 h-5 ml-2" />
                </Link>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      <footer className="relative z-10 px-6 py-16 border-t border-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <span className="text-xl font-aeonik font-semibold text-white">Arta Wallet</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                The future of decentralized payments. Built on Internet Computer Protocol for global financial inclusion.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-slate-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="text-slate-400 hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#security" className="text-slate-400 hover:text-white transition-colors">Security</a></li>
                <li><a href="/dashboard" className="text-slate-400 hover:text-white transition-colors">Dashboard</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="text-slate-400 hover:text-white transition-colors">About</Link></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-800/30">
            <div className="text-slate-400 text-sm mb-4 md:mb-0">
              © 2024 Arta Wallet. Built on Internet Computer Protocol. All rights reserved.
            </div>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default NetworkDashboard