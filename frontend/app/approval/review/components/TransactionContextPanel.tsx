'use client';

import { ApprovalWorkflow } from '../../../../types/approval';

interface TransactionContextPanelProps {
  workflow: ApprovalWorkflow;
  customer: any;
  transactionHistory: any[];
  isLoading: boolean;
  showFullHistory?: boolean;
}

export const TransactionContextPanel = ({ 
  workflow, 
  customer, 
  transactionHistory, 
  isLoading,
  showFullHistory = false 
}: TransactionContextPanelProps) => {
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const customerTransactions = workflow.withdrawalRequest?.customer?.recentTransactions || transactionHistory;
  const displayTransactions = showFullHistory ? customerTransactions : customerTransactions?.slice(0, 5);

  return (
    <div>
      <h4 className="text-lg font-medium text-gray-900 mb-4">
        {showFullHistory ? 'Full Transaction History' : 'Recent Transaction Activity'}
      </h4>
      
      {/* Account Activity Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <dt className="text-sm font-medium text-blue-600">Account Balance</dt>
          <dd className="mt-1 text-lg font-semibold text-blue-900">
            GHS {workflow.withdrawalRequest?.customer?.accountBalance?.toLocaleString() || '0.00'}
          </dd>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <dt className="text-sm font-medium text-green-600">Total Transactions</dt>
          <dd className="mt-1 text-lg font-semibold text-green-900">
            {customerTransactions?.length || 0}
          </dd>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <dt className="text-sm font-medium text-purple-600">Account Status</dt>
          <dd className="mt-1 text-lg font-semibold text-purple-900">
            {workflow.withdrawalRequest?.customer?.accountStatus || 'Active'}
          </dd>
        </div>
      </div>

      {/* Transaction List */}
      {displayTransactions && displayTransactions.length > 0 ? (
        <div className="space-y-3">
          {displayTransactions.map((transaction, index) => (
            <div key={transaction.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${
                  transaction.type === 'deposit' ? 'bg-green-500' :
                  transaction.type === 'withdrawal' ? 'bg-red-500' :
                  'bg-blue-500'
                }`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {transaction.type?.charAt(0).toUpperCase() + transaction.type?.slice(1) || 'Transaction'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {transaction.timestamp ? new Date(transaction.timestamp).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${
                  transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'deposit' ? '+' : '-'}GHS {transaction.amount?.toLocaleString() || '0.00'}
                </p>
                <p className={`text-xs ${
                  transaction.status === 'completed' ? 'text-green-600' :
                  transaction.status === 'pending' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {transaction.status || 'Unknown'}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mt-2">No transaction history available</p>
        </div>
      )}
    </div>
  );
};