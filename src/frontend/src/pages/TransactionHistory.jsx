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
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Calendar,
  Receipt,
  BarChart3,
  Loader,
  Zap,
  Activity,
  Award,
  Target
} from 'lucide-react'

const TransactionHistory = () => {
  const { backend, isAuthenticated, getUserBalanceHistory } = useICP()
  const [transactions, setTransactions] = useState([])
  const [topups, setTopups] = useState([])
  const [balanceHistory, setBalanceHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [viewMode, setViewMode] = useState('transactions') 

  const getStatusText = (status) => {
    if (typeof status === 'object' && status !== null) {
      const key = Object.keys(status)[0]
      switch (key) {
        case 'Pending':
          return 'Pending'
        case 'Processing':
          return 'Processing'
        case 'Completed':
          return 'Completed'
        case 'Failed':
          return 'Failed'
        case 'Expired':
          return 'Expired'
        case 'QRIS':
          return 'QRIS'
        case 'CreditCard':
          return 'Credit Card'
        case 'DebitCard':
          return 'Debit Card'
        case 'Web3Wallet':
          return 'Web3 Wallet'
        default:
          return key
      }
    }

    switch (status) {
      case 'Pending':
        return 'Pending'
      case 'Processing':
        return 'Processing'
      case 'Completed':
        return 'Completed'
      case 'Failed':
        return 'Failed'
      case 'Expired':
        return 'Expired'
      case 'QRIS':
        return 'QRIS'
      case 'CreditCard':
        return 'Credit Card'
      case 'DebitCard':
        return 'Debit Card'
      case 'Web3Wallet':
        return 'Web3 Wallet'
      default:
        return status?.toString() || 'Unknown'
    }
  }

  const getStatusColor = (status) => {
    const statusText = getStatusText(status).toLowerCase()

    switch (statusText) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'processing':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'failed':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      case 'expired':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const getStatusIcon = (status) => {
    const statusText = getStatusText(status).toLowerCase()

    switch (statusText) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'processing':
        return <Loader className="w-4 h-4 animate-spin" />
      case 'failed':
        return <XCircle className="w-4 h-4" />
      case 'expired':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const fetchTransactionHistory = async () => {
    if (!backend) return

    try {
      setLoading(true)

      const transactionsData = await backend.getUserTransactionSummaries()
      setTransactions(transactionsData)

      const topupsData = await backend.getUserTopupHistory()
      setTopups(topupsData)

      const balanceData = await getUserBalanceHistory()
      setBalanceHistory(balanceData)

    } catch (error) {
      console.error('Error fetching transaction history:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && backend) {
      fetchTransactionHistory()
    }
  }, [isAuthenticated, backend])

  const getTransactionIcon = (isIncoming) => {
    return isIncoming ? (
      <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
        <ArrowDownRight className="w-6 h-6 text-emerald-400" />
      </div>
    ) : (
      <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center">
        <ArrowUpRight className="w-6 h-6 text-rose-400" />
      </div>
    )
  }

  const getTopupIcon = (method) => {
    const methodText = getStatusText(method).toLowerCase()

    switch (methodText) {
      case 'qris':
        return (
          <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
            <QrCode className="w-6 h-6 text-blue-400" />
          </div>
        )
      case 'credit card':
      case 'debit card':
        return (
          <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-purple-400" />
          </div>
        )
      case 'web3 wallet':
        return (
          <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-indigo-400" />
          </div>
        )
      default:
        return (
          <div className="w-12 h-12 bg-[#262840] rounded-2xl flex items-center justify-center">
            <Plus className="w-6 h-6 text-[#B3B3C2]" />
          </div>
        )
    }
  }

  const getChangeTypeText = (changeType) => {
    if (typeof changeType === 'object' && changeType !== null) {
      const key = Object.keys(changeType)[0]
      switch (key) {
        case 'TopupCompleted':
          return 'Top-up Completed'
        case 'PaymentReceived':
          return 'Payment Received'
        case 'PaymentSent':
          return 'Payment Sent'
        case 'FeeDeducted':
          return 'Fee Deducted'
        case 'Refund':
          return 'Refund'
        case 'Adjustment':
          return 'Adjustment'
        default:
          return key
      }
    }

    switch (changeType) {
      case 'TopupCompleted':
        return 'Top-up Completed'
      case 'PaymentReceived':
        return 'Payment Received'
      case 'PaymentSent':
        return 'Payment Sent'
      case 'FeeDeducted':
        return 'Fee Deducted'
      case 'Refund':
        return 'Refund'
      case 'Adjustment':
        return 'Adjustment'
      default:
        return changeType
    }
  }

  const getBalanceChangeIcon = (changeType) => {
    const key = typeof changeType === 'object' ? Object.keys(changeType)[0] : changeType

    switch (key) {
      case 'TopupCompleted':
        return (
          <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
        )
      case 'PaymentReceived':
        return (
          <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-blue-400" />
          </div>
        )
      case 'PaymentSent':
        return (
          <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center">
            <TrendingDown className="w-6 h-6 text-rose-400" />
          </div>
        )
      case 'FeeDeducted':
        return (
          <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-amber-400" />
          </div>
        )
      case 'Refund':
        return (
          <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-400" />
          </div>
        )
      case 'Adjustment':
        return (
          <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-orange-400" />
          </div>
        )
      default:
        return (
          <div className="w-12 h-12 bg-[#262840] rounded-2xl flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-[#B3B3C2]" />
          </div>
        )
    }
  }

  const getBalanceChangeColor = (changeType) => {
    const key = typeof changeType === 'object' ? Object.keys(changeType)[0] : changeType

    switch (key) {
      case 'TopupCompleted':
      case 'PaymentReceived':
      case 'Refund':
        return 'text-emerald-400'
      case 'PaymentSent':
      case 'FeeDeducted':
        return 'text-rose-400'
      case 'Adjustment':
        return 'text-orange-400'
      default:
        return 'text-[#B3B3C2]'
    }
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

  const formatBalanceChange = (changeType, amount) => {
    const key = typeof changeType === 'object' ? Object.keys(changeType)[0] : changeType

    const sign = ['TopupCompleted', 'PaymentReceived', 'Refund'].includes(key) ? '+' : '-'
    return `${sign}${formatICP(amount)} ICP`
  }

  const combinedTransactions = [
    ...transactions.map(tx => ({
      ...tx,
      type: 'transaction',
      timestamp: tx.timestamp,
      status_history: transactions.filter(t => t.qr_id === tx.qr_id)
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
      is_incoming: true,
      reference_id: topup.reference_id,
      status_history: topups.filter(t => t.reference_id === topup.reference_id)
    }))
  ].sort((a, b) => Number(b.timestamp) - Number(a.timestamp))

  const filteredBalanceHistory = balanceHistory.filter(item => {
    const matchesSearch = searchTerm === '' ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reference_id.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const uniqueTransactions = []
  const seenIds = new Set()

  combinedTransactions.forEach(tx => {
    const uniqueId = `${tx.type}-${tx.id}`
    if (!seenIds.has(uniqueId)) {
      seenIds.add(uniqueId)
      uniqueTransactions.push(tx)
    }
  })

  const filteredTransactions = uniqueTransactions.filter(item => {
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

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, typeFilter])

  const renderBalanceHistory = () => (
    <div className="space-y-3 lg:space-y-4">
      {loading ? (
        <div className="space-y-3 lg:space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3 lg:space-x-4 p-4 lg:p-6 bg-[#222334] rounded-xl lg:rounded-2xl border border-[#23253B]">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#262840] rounded-xl lg:rounded-2xl flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-3 lg:h-4 bg-[#262840] rounded w-3/4 mb-2"></div>
                  <div className="h-2 lg:h-3 bg-[#262840] rounded w-1/2"></div>
                </div>
                <div className="w-16 lg:w-20">
                  <div className="h-3 lg:h-4 bg-[#262840] rounded mb-1"></div>
                  <div className="h-2 lg:h-3 bg-[#262840] rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredBalanceHistory.length === 0 ? (
        <div className="text-center py-12 lg:py-16">
          <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[#262840] rounded-2xl lg:rounded-3xl flex items-center justify-center mx-auto mb-6 lg:mb-8 border border-[#23253B]">
            <Activity className="w-8 h-8 lg:w-10 lg:h-10 text-[#B3B3C2]" />
          </div>
          <h3 className="text-xl lg:text-2xl font-bold text-[#F5F6FA] mb-3 lg:mb-4 px-4">
            No balance changes found
          </h3>
          <p className="text-[#B3B3C2] leading-relaxed text-sm lg:text-base px-4 max-w-md mx-auto">
            Your balance change history will appear here
          </p>
        </div>
      ) : (
        filteredBalanceHistory.map((log) => (
          <div key={log.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 lg:p-6 bg-[#222334] rounded-xl lg:rounded-2xl border border-[#23253B] hover:bg-[#262840] transition-all duration-200 space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3 lg:space-x-4 min-w-0 flex-1">
              <div className="flex-shrink-0">
                {getBalanceChangeIcon(log.change_type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-[#F5F6FA] text-base lg:text-lg mb-1 truncate">
                  {getChangeTypeText(log.change_type)}
                </div>
                <div className="text-[#B3B3C2] text-sm lg:text-base mb-2 break-words">
                  {log.description}
                </div>
                <div className="text-xs lg:text-sm text-[#B3B3C2] flex items-center space-x-2">
                  <Calendar className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                  <span className="truncate">{formatDate(log.timestamp)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-end space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-0 lg:space-y-1">
              <div className="text-left sm:text-right lg:text-right">
                <div className={`font-bold text-lg lg:text-xl mb-1 break-all ${getBalanceChangeColor(log.change_type)}`}>
                  {formatBalanceChange(log.change_type, log.amount)}
                </div>
                <div className="text-[#B3B3C2] text-xs lg:text-sm break-all">
                  Balance: {formatICP(log.new_balance)} ICP
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#181A20] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-purple-500/25">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-[#F5F6FA] mb-4">Authentication Required</h2>
          <p className="text-[#B3B3C2] mb-8 leading-relaxed">Please connect your wallet to view transaction history</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#181A20] p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-[#F5F6FA] mb-2">Transaction History</h1>
            <p className="text-[#B3B3C2] text-lg">View all your payments, top-ups, and balance changes</p>
          </div>
          <button
            onClick={fetchTransactionHistory}
            className="inline-flex items-center space-x-3 px-6 py-3 bg-[#222334] border border-[#23253B] rounded-2xl hover:bg-[#262840] transition-all duration-200 group"
          >
            <RefreshCw className="w-5 h-5 text-[#B3B3C2] group-hover:text-[#F5F6FA] transition-colors" />
            <span className="text-[#B3B3C2] group-hover:text-[#F5F6FA] font-medium transition-colors">Refresh</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#222334] p-2 rounded-2xl border border-[#23253B] shadow-2xl shadow-black/20">
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('transactions')}
              className={`flex-1 px-6 py-4 rounded-xl text-lg font-semibold transition-all duration-200 ${viewMode === 'transactions'
                  ? 'bg-gradient-to-r from-[#885FFF] to-[#59C1FF] text-white shadow-lg shadow-purple-500/25'
                  : 'text-[#B3B3C2] hover:text-[#F5F6FA] hover:bg-[#262840]'
                }`}
            >
              <div className="flex items-center justify-center space-x-3">
                <Receipt className="w-5 h-5" />
                <span>Transactions</span>
              </div>
            </button>
            <button
              onClick={() => setViewMode('balance')}
              className={`flex-1 px-6 py-4 rounded-xl text-lg font-semibold transition-all duration-200 ${viewMode === 'balance'
                  ? 'bg-gradient-to-r from-[#885FFF] to-[#59C1FF] text-white shadow-lg shadow-purple-500/25'
                  : 'text-[#B3B3C2] hover:text-[#F5F6FA] hover:bg-[#262840]'
                }`}
            >
              <div className="flex items-center justify-center space-x-3">
                <BarChart3 className="w-5 h-5" />
                <span>Balance History</span>
              </div>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#222334] rounded-2xl border border-[#23253B] p-4 lg:p-6 shadow-2xl shadow-black/20">
          <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:gap-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 lg:left-6 top-1/2 transform -translate-y-1/2 text-[#B3B3C2] w-5 h-5 lg:w-6 lg:h-6" />
                <input
                  type="text"
                  placeholder={viewMode === 'balance' ? 'Search balance changes...' : 'Search transactions...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 lg:pl-16 pr-4 lg:pr-6 py-3 lg:py-4 bg-[#181A20] border border-[#23253B] rounded-2xl focus:ring-2 focus:ring-[#885FFF] focus:border-[#885FFF] transition-all text-[#F5F6FA] placeholder-[#B3B3C2] text-base lg:text-lg"
                />
              </div>
            </div>

            {viewMode !== 'balance' && (
              <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
                <div className="lg:w-64">
                  <div className="relative">
                    <Filter className="absolute left-4 lg:left-6 top-1/2 transform -translate-y-1/2 text-[#B3B3C2] w-5 h-5 lg:w-6 lg:h-6" />
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full pl-12 lg:pl-16 pr-4 lg:pr-6 py-3 lg:py-4 bg-[#181A20] border border-[#23253B] rounded-2xl focus:ring-2 focus:ring-[#885FFF] focus:border-[#885FFF] transition-all text-[#F5F6FA] text-base lg:text-lg appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-[#181A20]">All Types</option>
                      <option value="transaction" className="bg-[#181A20]">Payments</option>
                      <option value="topup" className="bg-[#181A20]">Top-ups</option>
                    </select>
                  </div>
                </div>

                <div className="lg:w-64">
                  <div className="relative">
                    <Filter className="absolute left-4 lg:left-6 top-1/2 transform -translate-y-1/2 text-[#B3B3C2] w-5 h-5 lg:w-6 lg:h-6" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full pl-12 lg:pl-16 pr-4 lg:pr-6 py-3 lg:py-4 bg-[#181A20] border border-[#23253B] rounded-2xl focus:ring-2 focus:ring-[#885FFF] focus:border-[#885FFF] transition-all text-[#F5F6FA] text-base lg:text-lg appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-[#181A20]">All Status</option>
                      <option value="completed" className="bg-[#181A20]">Completed</option>
                      <option value="pending" className="bg-[#181A20]">Pending</option>
                      <option value="processing" className="bg-[#181A20]">Processing</option>
                      <option value="failed" className="bg-[#181A20]">Failed</option>
                      <option value="expired" className="bg-[#181A20]">Expired</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="bg-[#222334] rounded-3xl border border-[#23253B] shadow-2xl shadow-black/20 overflow-hidden">
          <div className="p-8">
            {viewMode === 'balance' ? (
              renderBalanceHistory()
            ) : (
              <>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-center space-x-4 p-6 bg-[#181A20] rounded-2xl border border-[#23253B]">
                          <div className="w-12 h-12 bg-[#262840] rounded-2xl"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-[#262840] rounded w-1/4 mb-2"></div>
                            <div className="h-3 bg-[#262840] rounded w-1/3"></div>
                          </div>
                          <div className="h-4 bg-[#262840] rounded w-1/6"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-[#262840] rounded-3xl flex items-center justify-center mx-auto mb-8 border border-[#23253B]">
                      <History className="w-10 h-10 text-[#B3B3C2]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#F5F6FA] mb-4">
                      No transactions found
                    </h3>
                    <p className="text-[#B3B3C2] leading-relaxed max-w-md mx-auto">
                      {searchTerm || statusFilter || typeFilter ? 'Try adjusting your filters' : 'Start by creating a payment request or topping up your balance'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Use paginated transactions */}
                    {paginatedTransactions.map((item) => (
                      <div key={`${item.type}-${item.id}`} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 lg:p-6 bg-[#181A20] rounded-2xl border border-[#23253B] hover:bg-[#262840] transition-all duration-200 space-y-4 lg:space-y-0">
                        {/* FIXED: Mobile responsive layout */}
                        <div className="flex items-center space-x-4 min-w-0 flex-1">
                          {item.type === 'transaction'
                            ? getTransactionIcon(item.is_incoming)
                            : getTopupIcon(item.method)
                          }
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-3 mb-2">
                              <span className="font-bold text-[#F5F6FA] text-base lg:text-lg truncate">
                                {item.type === 'transaction'
                                  ? (item.is_incoming ? 'Payment Received' : 'Payment Sent')
                                  : `Top-up via ${item.method}`
                                }
                              </span>
                              <span className="px-3 py-1 bg-[#262840] text-[#B3B3C2] rounded-xl text-sm font-medium border border-[#23253B] self-start lg:self-auto">
                                {item.currency}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-[#B3B3C2] text-sm">
                              <Calendar className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{formatDate(item.timestamp)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-6">
                          <div className="text-left lg:text-right">
                            <div className="font-bold text-[#F5F6FA] text-lg lg:text-xl mb-1">
                              {item.amount_fiat}
                            </div>
                            <div className="text-[#885FFF] font-medium text-sm lg:text-base">
                              {item.amount_icp}
                            </div>
                          </div>

                          <div className={`flex items-center space-x-2 px-3 lg:px-4 py-2 rounded-xl text-sm font-medium border self-start lg:self-auto ${getStatusColor(item.status)}`}>
                            {getStatusIcon(item.status)}
                            <span>{item.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* pagination controls */}
                    {totalPages > 1 && (
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between pt-6 border-t border-[#23253B] space-y-4 lg:space-y-0">
                        <div className="text-[#B3B3C2] text-sm text-center lg:text-left">
                          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
                        </div>
                        
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 bg-[#222334] border border-[#23253B] rounded-xl hover:bg-[#262840] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-[#F5F6FA] text-sm"
                          >
                            Previous
                          </button>
                          
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum
                              if (totalPages <= 5) {
                                pageNum = i + 1
                              } else if (currentPage <= 3) {
                                pageNum = i + 1
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i
                              } else {
                                pageNum = currentPage - 2 + i
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`px-3 py-2 rounded-xl text-sm transition-all ${
                                    currentPage === pageNum
                                      ? 'bg-gradient-to-r from-[#885FFF] to-[#59C1FF] text-white'
                                      : 'bg-[#222334] border border-[#23253B] text-[#F5F6FA] hover:bg-[#262840]'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              )
                            })}
                          </div>
                          
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 bg-[#222334] border border-[#23253B] rounded-xl hover:bg-[#262840] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-[#F5F6FA] text-sm"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Transaction Summary */}
        {filteredTransactions.length > 0 && viewMode !== 'balance' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#222334] rounded-2xl border border-[#23253B] p-6 text-center shadow-2xl shadow-black/20">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-emerald-400 mb-2">
                {filteredTransactions.filter(tx => tx.type === 'transaction' && tx.is_incoming).length}
              </div>
              <div className="text-[#B3B3C2] font-medium">Payments Received</div>
            </div>

            <div className="bg-[#222334] rounded-2xl border border-[#23253B] p-6 text-center shadow-2xl shadow-black/20">
              <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingDown className="w-6 h-6 text-rose-400" />
              </div>
              <div className="text-3xl font-bold text-rose-400 mb-2">
                {filteredTransactions.filter(tx => tx.type === 'transaction' && !tx.is_incoming).length}
              </div>
              <div className="text-[#B3B3C2] font-medium">Payments Sent</div>
            </div>

            <div className="bg-[#222334] rounded-2xl border border-[#23253B] p-6 text-center shadow-2xl shadow-black/20">
              <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {filteredTransactions.filter(tx => tx.type === 'topup').length}
              </div>
              <div className="text-[#B3B3C2] font-medium">Top-ups</div>
            </div>

            <div className="bg-[#222334] rounded-2xl border border-[#23253B] p-6 text-center shadow-2xl shadow-black/20">
              <div className="w-12 h-12 bg-[#885FFF]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-[#885FFF]" />
              </div>
              <div className="text-3xl font-bold text-[#885FFF] mb-2">
                {filteredTransactions.filter(tx => tx.status.toLowerCase() === 'completed').length}
              </div>
              <div className="text-[#B3B3C2] font-medium">Completed</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TransactionHistory