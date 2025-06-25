'use client';

import React from 'react';
import { QuickAction } from '@/types/dashboard';

interface QuickActionBarProps {
  actions: QuickAction[];
  isLoading?: boolean;
  maxActions?: number;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
  actions,
  isLoading = false,
  maxActions = 6,
}) => {
  const getActionIcon = (icon: string, type: string) => {
    // Use the icon if provided, otherwise use type-based icons
    switch (type) {
      case 'transfer_money':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case 'pay_bill':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'buy_airtime':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'check_balance':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'view_statements':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'request_loan':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'set_budget':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'find_atm':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.997 1.997 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'transfer_money':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
      case 'pay_bill':
        return 'bg-green-100 text-green-700 hover:bg-green-200';
      case 'buy_airtime':
        return 'bg-purple-100 text-purple-700 hover:bg-purple-200';
      case 'check_balance':
        return 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200';
      case 'view_statements':
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
      case 'request_loan':
        return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200';
      case 'set_budget':
        return 'bg-pink-100 text-pink-700 hover:bg-pink-200';
      case 'find_atm':
        return 'bg-red-100 text-red-700 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    }
  };

  const handleActionClick = (action: QuickAction) => {
    if (!action.enabled) return;
    
    if (action.requiresAuth) {
      // Handle authentication if needed
      console.log('Action requires authentication:', action.type);
    }
    
    if (action.endpoint) {
      // Navigate to endpoint
      window.location.href = action.endpoint;
    } else {
      // Handle action based on type
      switch (action.type) {
        case 'transfer_money':
          window.location.href = '/dashboard/transfer';
          break;
        case 'pay_bill':
          window.location.href = '/dashboard/bills';
          break;
        case 'buy_airtime':
          window.location.href = '/dashboard/airtime';
          break;
        case 'check_balance':
          window.location.href = '/dashboard/overview';
          break;
        case 'view_statements':
          window.location.href = '/dashboard/transactions';
          break;
        case 'request_loan':
          window.location.href = '/dashboard/loans';
          break;
        case 'set_budget':
          window.location.href = '/dashboard/budget';
          break;
        case 'find_atm':
          window.location.href = '/dashboard/atm-locator';
          break;
        default:
          console.log('Quick action clicked:', action.type);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="skeleton h-5 w-32 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="flex flex-col items-center space-y-2">
              <div className="skeleton w-12 h-12 rounded-lg"></div>
              <div className="skeleton h-3 w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const enabledActions = actions.filter(action => action.enabled).slice(0, maxActions);

  if (enabledActions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {enabledActions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action)}
            disabled={!action.enabled}
            className={`
              flex flex-col items-center space-y-2 p-4 rounded-lg transition-all duration-200
              ${action.enabled 
                ? `${getActionColor(action.type)} hover:scale-105 active:scale-95 cursor-pointer` 
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }
            `}
            title={action.description}
          >
            <div className="w-12 h-12 rounded-lg flex items-center justify-center">
              {getActionIcon(action.icon, action.type)}
            </div>
            <span className="text-sm font-medium text-center">
              {action.title}
            </span>
          </button>
        ))}
      </div>
      
      {enabledActions.length === maxActions && actions.length > maxActions && (
        <div className="mt-4 text-center">
          <button
            onClick={() => window.location.href = '/dashboard/actions'}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All Actions ({actions.length - maxActions} more)
          </button>
        </div>
      )}
    </div>
  );
};