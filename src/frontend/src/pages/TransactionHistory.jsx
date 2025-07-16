import React, { useEffect, useState } from 'react'
import { useICP } from '../contexts/ICPContext.jsx'
import { 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  Filter,
  Search,
  CreditCard,
  QrCode,
  Wallet,
  Plus
} from 'lucide-react'

const TransactionHistory = () => {
  const { backend, isAuthenticated } = useICP()
  const [transactions, setTransactions] = useState([])
  const [topups, setTopups] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('') // 'transactions', 'topups', ''

  const fetchTransactions = async () => {
    if (!backend) return
    
    try {
      setLoading(true)
      
      // Fetch regular transactions
      const transactionsData = await backend.getUserTransactionSummaries()
      setTransactions(transactionsData)
      
      // Fetch topup history
      const topupsData = await backend.getUserTopupHistory()
      setTopups(topupsData)
      
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && backend) {
      fetchTransactions()
    }
  }, [isAuthenticated, backend])

  const getTransactionIcon = (isIncoming) => {
    return isIncoming ? (
      <ArrowDownRight className="w-5 h-5 text-green-600" />
    ) : (
      <ArrowUpRight className="w-5 h-5 text-red-600" />
    )
  }

  const getTopupIcon = (method) => {
    switch (method) {
      case 'QRIS':
        return <QrCode className="w-5 h-5 text-blue-600" />
      case 'CreditCard':
      case 'DebitCard':
        return <CreditCard className="w-5 h-5 text-purple-600" />
      case 'Web3Wallet':
        return <Wallet className="w-5 h-5 text-indigo-600" />
      default:
        return <Plus className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    const statusKey = typeof status === 'object' ? Object.keys(status)[0] : status
    
    switch (statusKey?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'expired':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    if (typeof status === 'object') {
      return Object.keys(status)[0]
    }
    return status
  }

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAmount = (amount) => {
    if (typeof amount === 'string') return parseFloat(amount)
    if (typeof amount === 'bigint') return Number(amount)
    return amount
  }

  const formatICP = (amount) => {
    const numAmount = formatAmount(amount)
    return (numAmount / 100_000_000).toFixed(8)
  }

  // Combine and filter transactions
  const combinedTransactions = [
    ...transactions.map(tx => ({
      ...tx,
      type: 'transaction',
      timestamp: tx.timestamp
    })),
    ...topups.map(topup => ({
      id: topup.id,
      type: 'topup',
      method: getStatusText(topup.payment_method),
      amount_fiat: `${formatAmount(topup.fiat_amount)} ${topup.fiat_currency}`,
      amount_icp: `${formatICP(topup.amount)} ICP`,
      currency: topup.fiat_currency,
      status: getStatusText(topup.status),
      timestamp: topup.created_at,
      is_incoming: true, // Topups are always incoming
    }))
  ].sort((a, b) => Number(b.timestamp) - Number(a.timestamp))

  const filteredTransactions = combinedTransactions.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.currency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.method && item.method.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === '' || 
      item.status.toLowerCase() === statusFilter.toLowerCase()
    
    const matchesType = typeFilter === '' || 
      item.type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Connect Your Wallet
        </h2>
        <p className="text-slate-600">
          Please connect your wallet to view transaction history
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Transaction History</h1>
          <p className="text-slate-600 mt-1">
            View all your payments and top-ups
          </p>
        </div>
        <button
          onClick={fetchTransactions}
          className="btn btn-secondary inline-flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input pl-10"
              >
                <option value="">All Types</option>
                <option value="transaction">Payments</option>
                <option value="topup">Top-ups</option>
              </select>
            </div>
          </div>
          
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input pl-10"
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="card">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-4 bg-slate-200 rounded w-1/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No transactions found
            </h3>
            <p className="text-slate-500">
              {searchTerm || statusFilter || typeFilter ? 'Try adjusting your filters' : 'Start by creating a payment request or topping up your balance'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((item) => (
              <div key={`${item.type}-${item.id}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center space-x-4">
                  {item.type === 'transaction' 
                    ? getTransactionIcon(item.is_incoming)
                    : getTopupIcon(item.method)
                  }
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-slate-900">
                        {item.type === 'transaction' 
                          ? (item.is_incoming ? 'Received' : 'Sent')
                          : `Top-up via ${item.method}`
                        }
                      </span>
                      <span className="text-sm text-slate-500">
                        {item.currency}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500">
                      {formatDate(item.timestamp)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-medium text-slate-900">
                      {item.amount_fiat}
                    </div>
                    <div className="text-sm text-slate-500">
                      {item.amount_icp}
                    </div>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Summary */}
      {filteredTransactions.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <div className="text-2xl font-bold text-green-600">
              {filteredTransactions.filter(tx => tx.type === 'transaction' && tx.is_incoming).length}
            </div>
            <div className="text-sm text-slate-600">Received</div>
          </div>
          
          <div className="card text-center">
            <div className="text-2xl font-bold text-red-600">
              {filteredTransactions.filter(tx => tx.type === 'transaction' && !tx.is_incoming).length}
            </div>
            <div className="text-sm text-slate-600">Sent</div>
          </div>
          
          <div className="card text-center">
            <div className="text-2xl font-bold text-blue-600">
              {filteredTransactions.filter(tx => tx.type === 'topup').length}
            </div>
            <div className="text-sm text-slate-600">Top-ups</div>
          </div>
          
          <div className="card text-center">
            <div className="text-2xl font-bold text-purple-600">
              {filteredTransactions.filter(tx => tx.status.toLowerCase() === 'completed').length}
            </div>
            <div className="text-sm text-slate-600">Completed</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TransactionHistory