import React, { useState, useEffect } from 'react'
import { useICP } from '../contexts/ICPContext'
import {
  Globe,
  Activity,
  TrendingUp,
  Search,
  Filter,
  BarChart3,
  RefreshCw,
  MapPin,
  Coins,
  Clock,
  ChevronDown,
  ChevronUp,
  Eye,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpRight 
} from 'lucide-react'

const NetworkStats = () => {
  const { backend } = useICP()
  const [networkStats, setNetworkStats] = useState(null)
  const [allTransactions, setAllTransactions] = useState([]) // Network transactions (payments + topups)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [viewMode, setViewMode] = useState('overview')
  const [transactionFilter, setTransactionFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDetails, setShowDetails] = useState({})

  useEffect(() => {
    if (backend) {
      fetchNetworkStats()
      fetchAllTransactions()
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
  
  // FIXED: Handle arrays properly - keep them as arrays!
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === 'bigint') {
        return Number(item)
      } else if (typeof item === 'object' && item !== null) {
        return convertBigIntInObject(item)
      }
      return item
    })
  }
  
  // Handle regular objects
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'bigint' ? Number(obj) : obj
  }
  
  const converted = { ...obj }
  
  Object.keys(converted).forEach(key => {
    if (typeof converted[key] === 'bigint') {
      converted[key] = Number(converted[key])
    } else if (Array.isArray(converted[key])) {
      // FIXED: Handle Candid Option types properly
      if (key === 'fee' || key === 'transaction_hash' || key === 'from_user' || key === 'to_user') {
        // For Option types: [value] means Some(value), [] means None
        if (converted[key].length > 0) {
          const optionValue = converted[key][0]
          converted[key] = typeof optionValue === 'bigint' ? Number(optionValue) : optionValue
        } else {
          converted[key] = null
        }
      } else {
        // For regular arrays, convert each item but keep as array
        converted[key] = convertBigIntInObject(converted[key])
      }
    } else if (typeof converted[key] === 'object' && converted[key] !== null) {
      // Recursively convert nested objects
      converted[key] = convertBigIntInObject(converted[key])
    }
  })
  
  return converted
}

  const fetchNetworkStats = async () => {
    if (!backend) return

    try {
      setLoading(true)
      setError('')

      const stats = await backend.getNetworkStats()
      console.log('Raw network stats:', stats)

      if (stats) {
        const convertedStats = convertBigIntInObject(stats)
        console.log('Converted network stats:', convertedStats)
        setNetworkStats(convertedStats)
      } else {
        setNetworkStats(null)
      }
    } catch (err) {
      console.error('Error fetching network stats:', err)
      setError('Failed to load network statistics')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllTransactions = async () => {
  if (!backend) return

  try {
    console.log('Fetching all network transactions...')
    
    const transactions = await backend.getAllNetworkTransactions()
    console.log('Raw network transactions:', transactions)
    
    // FIXED: Ensure we have a proper array
    if (Array.isArray(transactions)) {
      const convertedTransactions = convertBigIntInObject(transactions)
      console.log('Converted network transactions:', convertedTransactions)
      
      // FIXED: Verify it's still an array after conversion
      if (Array.isArray(convertedTransactions)) {
        setAllTransactions(convertedTransactions)
        
        // Debug: Check first transaction structure
        if (convertedTransactions.length > 0) {
          console.log('🔍 First converted transaction:', convertedTransactions[0])
          console.log('🔍 Status structure:', convertedTransactions[0].status)
          console.log('🔍 Fee structure:', convertedTransactions[0].fee)
        }
      } else {
        console.error('❌ convertBigIntInObject broke the array structure:', convertedTransactions)
        setAllTransactions([])
      }
    } else {
      console.warn('Network transactions is not an array:', transactions)
      setAllTransactions([])
    }
  } catch (err) {
    console.error('Error fetching all network transactions:', err)
    setAllTransactions([])
  }
}

  const currencyCountryMap = {
    USD: { name: 'United States', flag: '🇺🇸', region: 'Americas' },
    EUR: { name: 'European Union', flag: '🇪🇺', region: 'Europe' },
    GBP: { name: 'United Kingdom', flag: '🇬🇧', region: 'Europe' },
    JPY: { name: 'Japan', flag: '🇯🇵', region: 'Asia' },
    IDR: { name: 'Indonesia', flag: '🇮🇩', region: 'Asia' },
    SGD: { name: 'Singapore', flag: '🇸🇬', region: 'Asia' },
    MYR: { name: 'Malaysia', flag: '🇲🇾', region: 'Asia' },
    PHP: { name: 'Philippines', flag: '🇵🇭', region: 'Asia' },
    THB: { name: 'Thailand', flag: '🇹🇭', region: 'Asia' },
    VND: { name: 'Vietnam', flag: '🇻🇳', region: 'Asia' },
    KRW: { name: 'South Korea', flag: '🇰🇷', region: 'Asia' },
    CNY: { name: 'China', flag: '🇨🇳', region: 'Asia' },
    AUD: { name: 'Australia', flag: '🇦🇺', region: 'Oceania' },
    CAD: { name: 'Canada', flag: '🇨🇦', region: 'Americas' },
    INR: { name: 'India', flag: '🇮🇳', region: 'Asia' }
  }

  const formatICP = (amount) => {
    const numAmount = convertBigIntToNumber(amount)
    if (numAmount === 0 || isNaN(numAmount)) return '0.00000000'
    const icp = numAmount / 100_000_000
    return icp.toFixed(8)
  }

  const formatCurrency = (amount, currency) => {
    const numAmount = typeof amount === 'number' ? amount : convertBigIntToNumber(amount)
    if (numAmount === 0 || isNaN(numAmount)) return '0.00'
    const symbols = {
      USD: '$', EUR: '€', GBP: '£', JPY: '¥', IDR: 'Rp ',
      SGD: 'S$', MYR: 'RM', PHP: '₱', THB: '฿', VND: '₫',
      KRW: '₩', CNY: '¥', AUD: 'A$', CAD: 'C$', INR: '₹'
    }
    const symbol = symbols[currency] || currency + ' '
    return `${symbol}${numAmount.toLocaleString()}`
  }


  const formatNumber = (num) => {
    return convertBigIntToNumber(num).toLocaleString()
  }

  const getStatusIcon = (status) => {
    // Handle both old and new status objects
    let statusStr = status
    if (typeof status === 'object' && status !== null) {
      statusStr = Object.keys(status)[0]
    }

    switch (statusStr?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'pending':
      case 'processing':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    const statusStr = typeof status === 'object' ? Object.keys(status)[0] : status
    switch (statusStr?.toLowerCase()) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'processing':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusText = (status) => {
    if (typeof status === 'object' && status !== null) {
      return Object.keys(status)[0]
    }
    return status || 'Unknown'
  }

  const getTransactionTypeIcon = (type) => {
    const typeStr = typeof type === 'object' ? Object.keys(type)[0] : type
    switch (typeStr?.toLowerCase()) {
      case 'payment':
        return <ArrowUpRight className="w-4 h-4 text-blue-500" />
      case 'topup':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getTransactionTypeText = (type) => {
    if (typeof type === 'object' && type !== null) {
      return Object.keys(type)[0]
    }
    return type || 'Unknown'
  }

  const formatDate = (timestamp) => {
    const date = new Date(Number(timestamp) / 1000000)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Safe filtering with validation
  const filteredTransactions = Array.isArray(allTransactions) ? allTransactions.filter(tx => {
  if (!tx) {
    console.log('🔍 Null transaction found, skipping')
    return false
  }
  
  // Debug log for first transaction
  if (allTransactions.indexOf(tx) === 0) {
    console.log('🔍 First transaction for filtering:', tx)
    console.log('🔍 Status:', tx.status)
    console.log('🔍 Status text:', getStatusText(tx.status))
    console.log('🔍 Transaction filter:', transactionFilter)
    console.log('🔍 Search query:', searchQuery)
  }
  
  const statusStr = getStatusText(tx.status).toLowerCase()
  const matchesStatus = transactionFilter === 'all' || statusStr === transactionFilter.toLowerCase()
  
  const matchesSearch = searchQuery === '' || 
    (tx.id && tx.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (tx.reference_id && tx.reference_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (tx.fiat_currency && tx.fiat_currency.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (tx.description && tx.description.toLowerCase().includes(searchQuery.toLowerCase()))
  
  const result = matchesStatus && matchesSearch
  
  // Debug log for filtering result
  if (allTransactions.indexOf(tx) === 0) {
    console.log('🔍 Filter result for first tx:', {
      matchesStatus,
      matchesSearch,
      result,
      statusStr,
      transactionFilter
    })
  }
  
  return result
}) : []

  const getRegionalStats = () => {
    if (!networkStats?.currency_stats || !Array.isArray(networkStats.currency_stats)) return {}

    const regionStats = {}

    networkStats.currency_stats.forEach(stat => {
      const region = currencyCountryMap[stat.currency]?.region || 'Other'
      if (!regionStats[region]) {
        regionStats[region] = {
          currencies: [],
          totalVolume: 0,
          totalFiatVolume: 0,
          transactionCount: 0
        }
      }

      regionStats[region].currencies.push(stat)
      regionStats[region].totalVolume += convertBigIntToNumber(stat.total_icp_volume)
      regionStats[region].totalFiatVolume += convertBigIntToNumber(stat.total_fiat_volume)
      regionStats[region].transactionCount += convertBigIntToNumber(stat.usage_count)
    })

    return regionStats
  }

  const toggleDetails = (id) => {
    setShowDetails(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <h1 className="text-2xl font-bold text-gray-900">Loading Network Statistics...</h1>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
            <button
              onClick={() => {
                fetchNetworkStats()
                fetchAllTransactions()
              }}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - ICP Dashboard Style */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Globe className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Network</h1>
                <p className="text-sm text-gray-600">Global payment network statistics</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="24h">24H</option>
                <option value="7d">7D</option>
                <option value="30d">30D</option>
                <option value="all">All</option>
              </select>
              <button
                onClick={() => {
                  fetchNetworkStats()
                  fetchAllTransactions()
                }}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'overview'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('transactions')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'transactions'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              All Transactions ({Array.isArray(allTransactions) ? allTransactions.length : 0})
            </button>
            <button
              onClick={() => setViewMode('currencies')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'currencies'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Currencies
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Overview Tab */}
        {viewMode === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics - ICP Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">Countries</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatNumber(networkStats?.active_countries || 0)}
                  </span>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Coins className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-600">Currencies</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatNumber(networkStats?.active_currencies || 0)}
                  </span>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-gray-600">24h TX</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatNumber(networkStats?.transactions_24h || 0)}
                  </span>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-600">Volume</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    {formatICP(networkStats?.total_icp_volume)} ICP
                  </span>
                </div>
              </div>
            </div>

            {/* Regional Volume Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Regional Volume Distribution</h3>
                <div className="space-y-4">
                  {Object.keys(getRegionalStats()).length > 0 ? (
                    Object.entries(getRegionalStats()).map(([region, stats]) => (
                      <div key={region} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{region}</span>
                          <span className="text-sm font-medium text-gray-600">
                            {formatICP(stats.totalVolume)} ICP
                          </span>
                        </div>
                        <div className="space-y-1">
                          {stats.currencies.map(currency => (
                            <div key={currency.currency} className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-2">
                                <span>{currencyCountryMap[currency.currency]?.flag}</span>
                                <span className="text-gray-600">{currency.currency}</span>
                              </div>
                              <div className="flex items-center space-x-4">
                                <span className="text-gray-500">
                                  {formatCurrency(currency.total_fiat_volume, currency.currency)}
                                </span>
                                <span className="text-blue-600">
                                  {formatICP(currency.total_icp_volume)} ICP
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No regional data available
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Health</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(((networkStats?.completed_transactions || 0) / Math.max(networkStats?.total_transactions || 1, 1)) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(networkStats?.total_users || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Users</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {formatNumber(networkStats?.pending_transactions || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {formatNumber(networkStats?.failed_transactions || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {viewMode === 'transactions' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white border rounded-lg p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by Transaction ID, QR ID, or Currency"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
                    />
                  </div>
                  <select
                    value={transactionFilter}
                    onChange={(e) => setTransactionFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div className="text-sm text-gray-600">
                  {filteredTransactions.length} of {allTransactions.length} transactions
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransactions.map((tx) => (
                      <React.Fragment key={tx.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {getTransactionTypeIcon(tx.transaction_type)}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {tx.id}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {getTransactionTypeText(tx.transaction_type)} • {tx.reference_id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {formatCurrency(tx.fiat_amount, tx.fiat_currency)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatICP(tx.amount)} ICP
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(tx.status)}`}>
                              {getStatusIcon(tx.status)}
                              <span className="ml-1">{getStatusText(tx.status)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(tx.timestamp)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => toggleDetails(tx.id)}
                              className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Details</span>
                              {showDetails[tx.id] ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>
                        {showDetails[tx.id] && (
                          <tr>
                            <td colSpan="5" className="px-6 py-4 bg-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-2">Transaction Details</h4>
                                  <div className="space-y-1">
                                    <div><span className="text-gray-500">Type:</span> {getTransactionTypeText(tx.transaction_type)}</div>
                                    <div><span className="text-gray-500">From:</span> {tx.from_user?.toString() || 'System'}</div>
                                    <div><span className="text-gray-500">To:</span> {tx.to_user?.toString() || 'N/A'}</div>
                                    <div><span className="text-gray-500">Fee:</span> {tx.fee ? formatICP(tx.fee) + ' ICP' : 'N/A'}</div>
                                    <div><span className="text-gray-500">Hash:</span> {tx.transaction_hash || 'N/A'}</div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-2">Payment Info</h4>
                                  <div className="space-y-1">
                                    <div><span className="text-gray-500">Description:</span> {tx.description}</div>
                                    <div><span className="text-gray-500">Currency:</span> {tx.fiat_currency}</div>
                                    <div><span className="text-gray-500">Fiat Amount:</span> {formatCurrency(tx.fiat_amount, tx.fiat_currency)}</div>
                                    <div><span className="text-gray-500">ICP Amount:</span> {formatICP(tx.icp_amount)} ICP</div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredTransactions.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-500 text-lg">
                    {allTransactions.length === 0 ? 'No transactions found' : 'No transactions match your search'}
                  </div>
                  <div className="text-gray-400 text-sm mt-2">
                    {allTransactions.length === 0 ?
                      'Make some transactions to see them here' :
                      'Try adjusting your search query or filter'
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Currencies Tab */}
        {viewMode === 'currencies' && (
          <div className="space-y-6">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Currency Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {networkStats?.currency_stats?.length > 0 ? (
                  networkStats.currency_stats.map((stat, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{currencyCountryMap[stat.currency]?.flag}</span>
                          <div>
                            <div className="font-medium text-gray-900">{stat.currency}</div>
                            <div className="text-sm text-gray-500">{currencyCountryMap[stat.currency]?.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">{formatNumber(stat.usage_count)} uses</div>
                          <div className="text-xs text-gray-400">{currencyCountryMap[stat.currency]?.region}</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Fiat Volume</span>
                          <span className="text-sm font-medium">{formatCurrency(stat.total_fiat_volume, stat.currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">ICP Volume</span>
                          <span className="text-sm font-medium text-blue-600">{formatICP(stat.total_icp_volume)} ICP</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No currency statistics available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default NetworkStats