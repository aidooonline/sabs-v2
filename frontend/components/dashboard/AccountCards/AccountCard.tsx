'use client';

import React from 'react';

interface Account {
  id: string;
  accountName: string;
  accountNumber: string;
  accountType: 'savings' | 'current' | 'wallet' | 'loan' | 'fixed_deposit';
  currentBalance: number;
  availableBalance?: number;
  currency?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'closed';
  isDefault?: boolean;
  lastTransactionAt?: Date;
}

interface AccountCardProps {
  account: Account;
  isLoading?: boolean;
  onViewDetails?: (accountId: string) => void;
  onQuickTransfer?: (accountId: string) => void;
  onCheckBalance?: (accountId: string) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  isLoading = false,
  onViewDetails,
  onQuickTransfer,
  onCheckBalance,
}) => {
  const formatCurrency = (amount: number, currency = 'GHS') => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    return `****${accountNumber.slice(-4)}`;
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'savings':
        return (
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'current':
        return (
          <svg className="w-5 h-5 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'wallet':
        return (
          <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'loan':
        return (
          <svg className="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'fixed_deposit':
        return (
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'savings':
        return 'bg-primary-100';
      case 'current':
        return 'bg-info-100';
      case 'wallet':
        return 'bg-success-100';
      case 'loan':
        return 'bg-warning-100';
      case 'fixed_deposit':
        return 'bg-purple-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
            Active
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Inactive
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
            Suspended
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-danger-100 text-danger-800">
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  const formatAccountType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="dashboard-card">
        <div className="flex items-center space-x-4 mb-4">
          <div className="skeleton w-12 h-12 rounded-full"></div>
          <div className="flex-1">
            <div className="skeleton h-4 w-3/4 mb-2"></div>
            <div className="skeleton h-3 w-1/2"></div>
          </div>
        </div>
        <div className="skeleton h-6 w-32 mb-4"></div>
        <div className="flex space-x-2">
          <div className="skeleton h-8 w-20"></div>
          <div className="skeleton h-8 w-20"></div>
          <div className="skeleton h-8 w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card hover:shadow-card-hover transition-all duration-200">
      {/* Account Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getAccountTypeColor(account.accountType)}`}>
            {getAccountTypeIcon(account.accountType)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900">{account.accountName}</h3>
              {account.isDefault && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                  Default
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{formatAccountNumber(account.accountNumber)}</p>
          </div>
        </div>
        {account.status && getStatusBadge(account.status)}
      </div>

      {/* Balance Information */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-sm text-gray-600">Current Balance</span>
          <span className="text-lg font-semibold text-gray-900">
            {formatCurrency(account.currentBalance, account.currency)}
          </span>
        </div>
        {account.availableBalance !== undefined && account.availableBalance !== account.currentBalance && (
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-gray-500">Available Balance</span>
            <span className="text-sm text-gray-700">
              {formatCurrency(account.availableBalance, account.currency)}
            </span>
          </div>
        )}
      </div>

      {/* Account Type and Last Activity */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span className="capitalize">{formatAccountType(account.accountType)}</span>
        {account.lastTransactionAt && (
          <span>
            Last activity: {new Date(account.lastTransactionAt).toLocaleDateString('en-GH', {
              month: 'short',
              day: 'numeric'
            })}
          </span>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-2">
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(account.id)}
            className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            View Details
          </button>
        )}
        {onQuickTransfer && account.status === 'active' && (
          <button
            onClick={() => onQuickTransfer(account.id)}
            className="flex-1 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-100 rounded-md hover:bg-primary-200 transition-colors"
          >
            Transfer
          </button>
        )}
        {onCheckBalance && (
          <button
            onClick={() => onCheckBalance(account.id)}
            className="px-3 py-2 text-sm font-medium text-info-700 bg-info-100 rounded-md hover:bg-info-200 transition-colors"
          >
            Balance
          </button>
        )}
      </div>
    </div>
  );
};