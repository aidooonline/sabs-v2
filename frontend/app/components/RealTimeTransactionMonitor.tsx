'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency, formatRelativeTime } from '../../utils/formatters';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  DollarSign,
  Eye,
  MoreHorizontal
} from 'lucide-react';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  status: 'completed' | 'processing' | 'failed';
  timestamp: string;
  customerName: string;
  reference: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface RealTimeTransactionMonitorProps {
  maxTransactions?: number;
}

export const RealTimeTransactionMonitor: React.FC<RealTimeTransactionMonitorProps> = ({
  maxTransactions = 10,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [stats, setStats] = useState({
    totalToday: 0,
    volumeToday: 0,
    successRate: 98.5,
    avgProcessingTime: 2.3,
  });

  // Simulate real-time transaction updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate new transaction
      const newTransaction: Transaction = {
        id: `txn_${Date.now()}`,
        type: ['deposit', 'withdrawal', 'transfer'][Math.floor(Math.random() * 3)] as Transaction['type'],
        amount: Math.floor(Math.random() * 10000) + 100,
        status: Math.random() > 0.1 ? 'completed' : Math.random() > 0.5 ? 'processing' : 'failed',
        timestamp: new Date().toISOString(),
        customerName: `Customer ${Math.floor(Math.random() * 1000)}`,
        reference: `REF${Math.floor(Math.random() * 100000)}`,
        riskLevel: Math.random() > 0.8 ? 'high' : Math.random() > 0.6 ? 'medium' : 'low',
      };

      setTransactions(prev => [newTransaction, ...prev.slice(0, maxTransactions - 1)]);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalToday: prev.totalToday + 1,
        volumeToday: prev.volumeToday + newTransaction.amount,
      }));
    }, 3000 + Math.random() * 5000); // Random interval between 3-8 seconds

    return () => clearInterval(interval);
  }, [maxTransactions]);

  // Get transaction type styling
  const getTransactionTypeStyle = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return 'text-green-600 bg-green-100';
      case 'withdrawal':
        return 'text-red-600 bg-red-100';
      case 'transfer':
        return 'text-blue-600 bg-blue-100';
    }
  };

  // Get status styling
  const getStatusStyle = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
    }
  };

  // Get risk level styling
  const getRiskStyle = (risk: Transaction['riskLevel']) => {
    switch (risk) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
    }
  };

  // Get status icon
  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-600 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <div className="realtime-transaction-monitor">
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <h3 className="text-lg font-semibold text-gray-900">
              Live Transaction Monitor
            </h3>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Today's Total</div>
              <div className="text-lg font-bold text-gray-900">{stats.totalToday.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Volume</div>
              <div className="text-lg font-bold text-green-600">{formatCurrency(stats.volumeToday)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Success Rate</div>
              <div className="text-lg font-bold text-blue-600">{stats.successRate}%</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Avg Time</div>
              <div className="text-lg font-bold text-purple-600">{stats.avgProcessingTime}s</div>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="max-h-96 overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <div>Waiting for transactions...</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        {getStatusIcon(transaction.status)}
                      </div>

                      {/* Transaction Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTransactionTypeStyle(transaction.type)}`}>
                            {transaction.type}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(transaction.status)}`}>
                            {transaction.status}
                          </span>
                          {transaction.riskLevel === 'high' && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full text-red-600 bg-red-100">
                              High Risk
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-900 font-medium">
                          {transaction.customerName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {transaction.reference} • {formatRelativeTime(transaction.timestamp)}
                        </div>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className={`text-lg font-semibold ${
                          transaction.type === 'deposit' ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {transaction.type === 'deposit' ? '+' : ''}
                          {formatCurrency(transaction.amount)}
                        </div>
                      </div>
                      <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Live updates every 3-8 seconds</span>
            </div>
            <div>
              Last update: {formatRelativeTime(new Date())}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Compact version for smaller displays
export const CompactTransactionMonitor: React.FC<{ transactionCount?: number }> = ({
  transactionCount = 5,
}) => {
  const [recentCount, setRecentCount] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRecentCount(prev => prev + Math.floor(Math.random() * 3) + 1);
      setTotalVolume(prev => prev + Math.floor(Math.random() * 5000) + 1000);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="compact-transaction-monitor">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">Live Activity</h4>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500">Recent</div>
            <div className="text-lg font-bold text-blue-600">{recentCount}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Volume</div>
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(totalVolume)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeTransactionMonitor;