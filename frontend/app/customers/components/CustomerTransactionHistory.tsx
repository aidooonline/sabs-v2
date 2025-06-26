'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Download, Calendar, ArrowUpRight, ArrowDownLeft, CreditCard, Eye, MoreHorizontal, RefreshCw } from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '../../../utils/customerHelpers';
import type { Account, CustomerTransaction, TransactionType, TransactionStatus } from '../../../types/customer';

interface CustomerTransactionHistoryProps {
  customerId: string;
  accounts: Account[];
}

interface TransactionFilters {
  accountId?: string;
  type?: TransactionType | 'all';
  status?: TransactionStatus | 'all';
  dateRange?: {
    start: string;
    end: string;
  };
  amountRange?: {
    min: number;
    max: number;
  };
}

export const CustomerTransactionHistory: React.FC<CustomerTransactionHistoryProps> = ({
  customerId,
  accounts,
}) => {
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TransactionFilters>({
    accountId: 'all',
    type: 'all',
    status: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        customerId,
        page: page.toString(),
        limit: pageSize.toString(),
      });

      if (filters.accountId && filters.accountId !== 'all') {
        queryParams.append('accountId', filters.accountId);
      }
      if (filters.type && filters.type !== 'all') {
        queryParams.append('type', filters.type);
      }
      if (filters.status && filters.status !== 'all') {
        queryParams.append('status', filters.status);
      }
      if (filters.dateRange?.start) {
        queryParams.append('startDate', filters.dateRange.start);
      }
      if (filters.dateRange?.end) {
        queryParams.append('endDate', filters.dateRange.end);
      }

      const response = await fetch(`/api/transactions?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      } else {
        console.error('Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and refresh when filters change
  useEffect(() => {
    fetchTransactions();
  }, [customerId, filters, page]);

  // Filter transactions based on search query
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;

    const query = searchQuery.toLowerCase();
    return transactions.filter(transaction =>
      transaction.reference.toLowerCase().includes(query) ||
      transaction.description?.toLowerCase().includes(query) ||
      formatCurrency(transaction.amount).toLowerCase().includes(query)
    );
  }, [transactions, searchQuery]);

  // Get transaction type icon and styling
  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'deposit':
        return { icon: ArrowDownLeft, color: 'text-green-600', bg: 'bg-green-100' };
      case 'withdrawal':
        return { icon: ArrowUpRight, color: 'text-red-600', bg: 'bg-red-100' };
      case 'transfer':
        return { icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-100' };
      default:
        return { icon: CreditCard, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  // Get transaction status styling
  const getStatusStyling = (status: TransactionStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof TransactionFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page
  };

  // Handle transaction export
  const handleExport = () => {
    console.log('Export transactions:', filteredTransactions);
    // Implementation for exporting transactions
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      accountId: 'all',
      type: 'all',
      status: 'all',
    });
    setSearchQuery('');
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="customer-transaction-history">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Loading transactions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-transaction-history">
      <div className="space-y-6">
        {/* Header with search and controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
            <p className="text-sm text-gray-600">
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchTransactions()}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg ${showFilters ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              title="Filters"
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={handleExport}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Export"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Search by reference, description, or amount..."
            />
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Account filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account
                  </label>
                  <select
                    value={filters.accountId || 'all'}
                    onChange={(e) => handleFilterChange('accountId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Accounts</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.accountNumber} ({account.accountType.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={filters.type || 'all'}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Types</option>
                    <option value="deposit">Deposit</option>
                    <option value="withdrawal">Withdrawal</option>
                    <option value="transfer">Transfer</option>
                    <option value="fee">Fee</option>
                    <option value="interest">Interest</option>
                    <option value="loan_disbursement">Loan Disbursement</option>
                    <option value="loan_repayment">Loan Repayment</option>
                  </select>
                </div>

                {/* Status filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status || 'all'}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Date range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="date"
                      value={filters.dateRange?.start || ''}
                      onChange={(e) => handleFilterChange('dateRange', { 
                        ...filters.dateRange, 
                        start: e.target.value 
                      })}
                      className="flex-1 px-2 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <input
                      type="date"
                      value={filters.dateRange?.end || ''}
                      onChange={(e) => handleFilterChange('dateRange', { 
                        ...filters.dateRange, 
                        end: e.target.value 
                      })}
                      className="flex-1 px-2 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Filter actions */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-sm text-gray-500">
                  {filteredTransactions.length} result{filteredTransactions.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-500">
              {searchQuery || Object.values(filters).some(f => f && f !== 'all')
                ? 'Try adjusting your search or filters'
                : 'No transactions have been made yet'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => {
              const { icon: TransactionIcon, color, bg } = getTransactionIcon(transaction.type);
              const account = accounts.find(acc => acc.id === transaction.accountId);
              
              return (
                <div
                  key={transaction.id}
                  className={`transaction-card ${selectedTransaction === transaction.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTransaction(
                    selectedTransaction === transaction.id ? null : transaction.id
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Transaction icon */}
                      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                        <TransactionIcon className={`w-5 h-5 ${color}`} />
                      </div>

                      {/* Transaction details */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900 capitalize">
                            {transaction.type.replace('_', ' ')}
                          </h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusStyling(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center space-x-4">
                            <span className="font-mono">{transaction.reference}</span>
                            <span>{account?.accountNumber}</span>
                            <span>{formatRelativeTime(transaction.createdAt)}</span>
                          </div>
                          {transaction.description && (
                            <div className="mt-1 text-gray-500">
                              {transaction.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Amount and actions */}
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className={`text-lg font-semibold ${
                          transaction.type === 'deposit' || transaction.type === 'interest'
                            ? 'text-green-600' 
                            : 'text-gray-900'
                        }`}>
                          {transaction.type === 'deposit' || transaction.type === 'interest' ? '+' : ''}
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <button
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle transaction details view
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {selectedTransaction === transaction.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Transaction ID:</span>
                          <span className="ml-2 font-mono">{transaction.id}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Created:</span>
                          <span className="ml-2">{new Date(transaction.createdAt).toLocaleString()}</span>
                        </div>
                        {transaction.completedAt && (
                          <div>
                            <span className="text-gray-500">Completed:</span>
                            <span className="ml-2">{new Date(transaction.completedAt).toLocaleString()}</span>
                          </div>
                        )}
                        {transaction.agentId && (
                          <div>
                            <span className="text-gray-500">Agent:</span>
                            <span className="ml-2">{transaction.agentId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Load more button */}
        {transactions.length >= pageSize && (
          <div className="text-center">
            <button
              onClick={() => setPage(prev => prev + 1)}
              disabled={loading}
              className="btn-secondary"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};