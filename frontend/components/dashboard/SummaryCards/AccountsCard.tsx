'use client';

import React from 'react';

interface Account {
  accountType: string;
  count: number;
}

interface AccountsCardProps {
  totalAccounts: number;
  accountsByType?: Account[];
  isLoading?: boolean;
  onClick?: () => void;
}

export const AccountsCard: React.FC<AccountsCardProps> = ({
  totalAccounts,
  accountsByType = [],
  isLoading = false,
  onClick,
}) => {
  const getAccountTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'savings':
        return (
          <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'current':
        return (
          <svg className="w-3 h-3 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'wallet':
        return (
          <svg className="w-3 h-3 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'loan':
        return (
          <svg className="w-3 h-3 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
    }
  };

  const formatAccountType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (isLoading) {
    return (
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton h-4 w-24"></div>
          <div className="skeleton h-8 w-8 rounded"></div>
        </div>
        <div className="skeleton h-8 w-16 mb-3"></div>
        <div className="space-y-2">
          <div className="skeleton h-3 w-full"></div>
          <div className="skeleton h-3 w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`dashboard-card ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">Total Accounts</h3>
        <div className="w-8 h-8 bg-info-100 rounded flex items-center justify-center">
          <svg className="w-4 h-4 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
            />
          </svg>
        </div>
      </div>
      
      <div className="text-2xl font-bold text-gray-900 mb-3">
        {totalAccounts}
      </div>
      
      {accountsByType.length > 0 ? (
        <div className="space-y-1">
          {accountsByType.slice(0, 3).map((account, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                {getAccountTypeIcon(account.accountType)}
                <span className="text-gray-600">
                  {formatAccountType(account.accountType)}
                </span>
              </div>
              <span className="font-medium text-gray-900">
                {account.count}
              </span>
            </div>
          ))}
          {accountsByType.length > 3 && (
            <div className="text-xs text-gray-400 mt-2">
              +{accountsByType.length - 3} more types
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center text-sm">
          <span className="metric-neutral">—</span>
          <span className="text-gray-500 ml-1">no change</span>
        </div>
      )}
    </div>
  );
};