'use client';

import React from 'react';

interface SpendingCardProps {
  monthlySpending: number;
  previousMonthSpending?: number;
  currency?: string;
  changePercentage?: number;
  period?: string;
  isLoading?: boolean;
  onClick?: () => void;
}

export const SpendingCard: React.FC<SpendingCardProps> = ({
  monthlySpending,
  previousMonthSpending = 0,
  currency = 'GHS',
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

  const getTrendIcon = () => {
    if (changePercentage > 0) {
      return (
        <svg className="w-4 h-4 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      );
    } else if (changePercentage < 0) {
      return (
        <svg className="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
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
    // For spending, less is better (positive trend)
    if (changePercentage > 0) return 'metric-negative'; // Spending increased
    if (changePercentage < 0) return 'metric-positive'; // Spending decreased
    return 'metric-neutral';
  };

  const getTrendLabel = () => {
    if (changePercentage > 0) return 'increase';
    if (changePercentage < 0) return 'decrease';
    return 'no change';
  };

  if (isLoading) {
    return (
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton h-4 w-28"></div>
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
        <h3 className="text-sm font-medium text-gray-600">Monthly Spending</h3>
        <div className="w-8 h-8 bg-warning-100 rounded flex items-center justify-center">
          <svg className="w-4 h-4 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" 
            />
          </svg>
        </div>
      </div>
      
      <div className="text-2xl font-bold text-gray-900 mb-2">
        {formatCurrency(monthlySpending)}
      </div>
      
      <div className="flex items-center space-x-2 text-sm">
        <div className="flex items-center space-x-1">
          {getTrendIcon()}
          <span className={getTrendClass()}>
            {changePercentage !== 0 ? `${Math.abs(changePercentage).toFixed(1)}%` : '—'}
          </span>
        </div>
        <span className="text-gray-500">
          {getTrendLabel()} from {period}
        </span>
      </div>
      
      {previousMonthSpending > 0 && (
        <div className="mt-1 text-xs text-gray-400">
          Previous: {formatCurrency(previousMonthSpending)}
        </div>
      )}
    </div>
  );
};