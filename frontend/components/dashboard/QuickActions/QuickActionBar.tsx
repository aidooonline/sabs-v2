'use client';

import React from 'react';

interface QuickAction {
  id: string;
  type: 'transfer_money' | 'pay_bill' | 'buy_airtime' | 'check_balance' | 'view_statements' | 'request_loan' | 'set_budget' | 'find_atm';
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
  requiresAuth: boolean;
  endpoint?: string;
}

interface QuickActionBarProps {
  actions?: QuickAction[];
  isLoading?: boolean;
  onActionClick?: (actionType: string, actionId: string) => void;
  showDescriptions?: boolean;
  layout?: 'grid' | 'list';
  columns?: 2 | 3 | 4;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
  actions = [],
  isLoading = false,
  onActionClick,
  showDescriptions = false,
  layout = 'grid',
  columns = 2,
}) => {
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'transfer_money':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case 'pay_bill':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'buy_airtime':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'check_balance':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
          </svg>
        );
      case 'view_statements':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'request_loan':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'set_budget':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'find_atm':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        );
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'transfer_money':
        return 'text-primary-600 bg-primary-100 hover:bg-primary-200';
      case 'pay_bill':
        return 'text-info-600 bg-info-100 hover:bg-info-200';
      case 'buy_airtime':
        return 'text-success-600 bg-success-100 hover:bg-success-200';
      case 'check_balance':
        return 'text-warning-600 bg-warning-100 hover:bg-warning-200';
      case 'view_statements':
        return 'text-purple-600 bg-purple-100 hover:bg-purple-200';
      case 'request_loan':
        return 'text-orange-600 bg-orange-100 hover:bg-orange-200';
      case 'set_budget':
        return 'text-teal-600 bg-teal-100 hover:bg-teal-200';
      case 'find_atm':
        return 'text-indigo-600 bg-indigo-100 hover:bg-indigo-200';
      default:
        return 'text-gray-600 bg-gray-100 hover:bg-gray-200';
    }
  };

  const defaultActions: QuickAction[] = [
    {
      id: 'transfer',
      type: 'transfer_money',
      title: 'Transfer',
      description: 'Send money to another account',
      icon: 'transfer',
      enabled: true,
      requiresAuth: true,
    },
    {
      id: 'pay_bills',
      type: 'pay_bill',
      title: 'Pay Bills',
      description: 'Pay utilities and services',
      icon: 'bill',
      enabled: true,
      requiresAuth: true,
    },
    {
      id: 'buy_airtime',
      type: 'buy_airtime',
      title: 'Buy Airtime',
      description: 'Top up mobile phone',
      icon: 'phone',
      enabled: true,
      requiresAuth: true,
    },
    {
      id: 'check_balance',
      type: 'check_balance',
      title: 'Check Balance',
      description: 'View account balances',
      icon: 'balance',
      enabled: true,
      requiresAuth: true,
    },
  ];

  const displayActions = actions.length > 0 ? actions : defaultActions;

  const handleActionClick = (action: QuickAction) => {
    if (!action.enabled) return;
    if (onActionClick) {
      onActionClick(action.type, action.id);
    }
  };

  const getGridCols = () => {
    switch (columns) {
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-3';
      case 4:
        return 'grid-cols-4';
      default:
        return 'grid-cols-2';
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-card">
        <div className="skeleton h-6 w-32 mb-6"></div>
        <div className={`grid ${getGridCols()} gap-3`}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex flex-col items-center p-4 border border-gray-200 rounded-lg">
              <div className="skeleton w-8 h-8 rounded-full mb-2"></div>
              <div className="skeleton h-3 w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (layout === 'list') {
    return (
      <div className="dashboard-card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="space-y-2">
          {displayActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              disabled={!action.enabled}
              className={`w-full flex items-center space-x-4 p-4 rounded-lg border transition-all duration-200 ${
                action.enabled
                  ? `border-gray-200 hover:border-primary-200 hover:shadow-sm ${getActionColor(action.type)}`
                  : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                action.enabled ? getActionColor(action.type) : 'bg-gray-200 text-gray-400'
              }`}>
                {getActionIcon(action.type)}
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-medium text-gray-900">{action.title}</h3>
                {showDescriptions && (
                  <p className="text-sm text-gray-600">{action.description}</p>
                )}
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
      
      <div className={`grid ${getGridCols()} gap-3`}>
        {displayActions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action)}
            disabled={!action.enabled}
            className={`flex flex-col items-center p-4 rounded-lg border transition-all duration-200 ${
              action.enabled
                ? 'border-gray-200 hover:border-primary-200 hover:shadow-sm hover:scale-105'
                : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors ${
              action.enabled ? getActionColor(action.type) : 'bg-gray-200 text-gray-400'
            }`}>
              {getActionIcon(action.type)}
            </div>
            <span className={`text-xs font-medium text-center leading-tight ${
              action.enabled ? 'text-gray-700' : 'text-gray-400'
            }`}>
              {action.title}
            </span>
            {showDescriptions && (
              <span className="text-xs text-gray-500 text-center mt-1 leading-tight">
                {action.description}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};