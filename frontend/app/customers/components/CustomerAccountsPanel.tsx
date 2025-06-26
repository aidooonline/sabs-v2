'use client';

import React, { useState } from 'react';
import { CreditCard, Plus, Eye, Edit3, Lock, Unlock, AlertCircle } from 'lucide-react';
import type { Account } from '../../../types/customer';
import { formatCurrency } from '../../../utils/customerHelpers';

interface CustomerAccountsPanelProps {
  customerId: string;
  accounts: Account[];
  editMode: boolean;
}

export const CustomerAccountsPanel: React.FC<CustomerAccountsPanelProps> = ({
  customerId,
  accounts,
  editMode,
}) => {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'savings': return 'bg-blue-100 text-blue-800';
      case 'checking': return 'bg-green-100 text-green-800';
      case 'mobile_money': return 'bg-purple-100 text-purple-800';
      case 'loan': return 'bg-orange-100 text-orange-800';
      case 'investment': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'frozen': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="customer-accounts-panel">
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts found</h3>
          <p className="text-gray-500 mb-6">This customer hasn't opened any accounts yet.</p>
          {editMode && (
            <button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Account
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="customer-accounts-panel">
      <div className="space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium">Total Accounts</div>
            <div className="text-2xl font-bold text-blue-900">{accounts.length}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium">Total Balance</div>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(accounts.reduce((sum, acc) => sum + acc.balance, 0))}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-600 font-medium">Active Accounts</div>
            <div className="text-2xl font-bold text-purple-900">
              {accounts.filter(acc => acc.status === 'active').length}
            </div>
          </div>
        </div>

        {/* Accounts list */}
        <div className="space-y-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`account-card ${selectedAccount === account.id ? 'selected' : ''}`}
              onClick={() => setSelectedAccount(account.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {account.accountNumber}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${getAccountTypeColor(account.accountType)}`}>
                        {account.accountType.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{account.currency}</span>
                      <span>Created {new Date(account.createdAt).toLocaleDateString()}</span>
                      {account.lastTransactionAt && (
                        <span>Last activity {new Date(account.lastTransactionAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(account.balance)}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(account.status)}`}>
                      {account.status.toUpperCase()}
                    </span>
                  </div>

                  {editMode && (
                    <div className="flex items-center space-x-1">
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title="Edit account"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {account.status === 'active' ? (
                        <button
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Freeze account"
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          className="p-2 text-green-400 hover:text-green-600 hover:bg-green-50 rounded"
                          title="Activate account"
                        >
                          <Unlock className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded account details */}
              {selectedAccount === account.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Account Details</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Account ID:</span>
                          <span className="font-mono">{account.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Created:</span>
                          <span>{new Date(account.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Updated:</span>
                          <span>{new Date(account.updatedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Quick Actions</h5>
                      <div className="space-y-2">
                        <button className="w-full btn-secondary text-sm">
                          View Transactions
                        </button>
                        <button className="w-full btn-secondary text-sm">
                          Account Statement
                        </button>
                        <button className="w-full btn-secondary text-sm">
                          Account Settings
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add new account button */}
        {editMode && (
          <div className="pt-4 border-t border-gray-200">
            <button className="btn-primary w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add New Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
};