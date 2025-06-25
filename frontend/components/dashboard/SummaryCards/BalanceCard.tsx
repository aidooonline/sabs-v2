'use client';

import React from 'react';

interface BalanceCardProps {
  totalBalance: number;
  currency?: string;
  changeAmount?: number;
  changePercentage?: number;
  period?: string;
  isLoading?: boolean;
  onClick?: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  totalBalance,
  currency = 'GHS',
  changeAmount = 0,
  changePercentage = 0,
  period = 'last month',
  isLoading = false,
  onClick,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatChange = (amount: number) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}${formatCurrency(Math.abs(amount))}`;
  };

  const getTrendIcon = () => {
    if (changePercentage > 0) {
      return (
        <svg className="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    } else if (changePercentage < 0) {
      return (
        <svg className="w-4 h-4 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01" />
        </svg>
      );
    }
  };

  const getTrendClass = () => {
    if (changePercentage > 0) return 'metric-positive';
    if (changePercentage < 0) return 'metric-negative';
    return 'metric-neutral';
  };

  if (isLoading) {
    return (
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton h-4 w-24"></div>
          <div className="skeleton h-8 w-8 rounded"></div>
        </div>
        <div className="skeleton h-8 w-32 mb-2"></div>
        <div className="flex items-center space-x-2">
          <div className="skeleton h-3 w-16"></div>
          <div className="skeleton h-3 w-20"></div>
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
        <h3 className="text-sm font-medium text-gray-600">Total Balance</h3>
        <div className="w-8 h-8 bg-primary-100 rounded flex items-center justify-center">
          <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" 
            />
          </svg>
        </div>
      </div>
      
      <div className="text-2xl font-bold text-gray-900 mb-2">
        {formatCurrency(totalBalance)}
      </div>
      
      <div className="flex items-center space-x-2 text-sm">
        <div className="flex items-center space-x-1">
          {getTrendIcon()}
          <span className={getTrendClass()}>
            {changePercentage !== 0 ? `${Math.abs(changePercentage).toFixed(1)}%` : '—'}
          </span>
        </div>
        <span className="text-gray-500">
          from {period}
        </span>
      </div>
      
      {changeAmount !== 0 && (
        <div className="mt-1 text-xs text-gray-400">
          {formatChange(changeAmount)} change
        </div>
      )}
    </div>
  );
};