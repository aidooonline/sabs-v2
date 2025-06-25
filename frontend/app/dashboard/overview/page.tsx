'use client';

import React from 'react';
import Link from 'next/link';

// Mock data for demonstration (will be replaced with API calls in Day 2)
const mockDashboardData = {
  totalBalance: 12450.75,
  totalAccounts: 3,
  monthlySpending: 2340.50,
  monthlyIncome: 8500.00,
  accounts: [
    {
      id: '1',
      accountName: 'Savings Account',
      accountType: 'savings',
      currentBalance: 8450.75,
      accountNumber: '****1234',
    },
    {
      id: '2', 
      accountName: 'Current Account',
      accountType: 'current',
      currentBalance: 3200.00,
      accountNumber: '****5678',
    },
    {
      id: '3',
      accountName: 'Mobile Wallet',
      accountType: 'wallet', 
      currentBalance: 800.00,
      accountNumber: '****9012',
    },
  ],
  recentTransactions: [
    {
      id: '1',
      description: 'Grocery Store Payment',
      amount: -45.30,
      date: '2024-12-19',
      category: 'Food & Dining',
      status: 'completed',
    },
    {
      id: '2',
      description: 'Salary Deposit',
      amount: 2500.00,
      date: '2024-12-18',
      category: 'Income',
      status: 'completed',
    },
    {
      id: '3',
      description: 'Mobile Top-up',
      amount: -20.00,
      date: '2024-12-18',
      category: 'Utilities',
      status: 'completed',
    },
  ],
  alerts: [
    {
      id: '1',
      type: 'low_balance',
      message: 'Mobile Wallet balance is below GHS 1,000',
      severity: 'medium',
    },
  ],
};

export default function DashboardOverviewPage() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GH', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard Overview
        </h1>
        <p className="text-gray-600">
          Welcome to your enhanced Sabs v2 dashboard with comprehensive financial insights
        </p>
      </div>

      {/* Day 1 Implementation Status */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-card p-6 mb-8">
        <h2 className="text-xl font-semibold text-primary-900 mb-4">
          🚀 Day 1 Foundation Complete
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <span className="text-sm text-primary-800">Dashboard routing structure</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <span className="text-sm text-primary-800">TypeScript interfaces</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <span className="text-sm text-primary-800">Redux RTK Query setup</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <span className="text-sm text-primary-800">Tailwind CSS enhanced</span>
          </div>
        </div>
      </div>

      {/* Summary Cards Row - Foundation for AC1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Balance</h3>
            <div className="w-8 h-8 bg-primary-100 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {formatCurrency(mockDashboardData.totalBalance)}
          </div>
          <div className="flex items-center text-sm">
            <span className="metric-positive">↗ 12.5%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Monthly Spending</h3>
            <div className="w-8 h-8 bg-warning-100 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {formatCurrency(mockDashboardData.monthlySpending)}
          </div>
          <div className="flex items-center text-sm">
            <span className="metric-negative">↘ 8.2%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Accounts</h3>
            <div className="w-8 h-8 bg-info-100 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {mockDashboardData.totalAccounts}
          </div>
          <div className="flex items-center text-sm">
            <span className="metric-neutral">—</span>
            <span className="text-gray-500 ml-1">no change</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Active Alerts</h3>
            <div className="w-8 h-8 bg-danger-100 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5zm0 0v-3a4 4 0 00-4-4H8m7 7v-3a4 4 0 00-4-4H8" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {mockDashboardData.alerts.length}
          </div>
          <div className="flex items-center text-sm">
            <span className="metric-negative">⚠ Attention needed</span>
          </div>
        </div>
      </div>

      {/* Content Grid - Foundation for remaining ACs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Account Cards Column */}
        <div className="lg:col-span-2">
          <div className="dashboard-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Your Accounts</h2>
              <Link 
                href="/dashboard/accounts"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View all
              </Link>
            </div>
            
            <div className="space-y-4">
              {mockDashboardData.accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-200 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{account.accountName}</h3>
                      <p className="text-sm text-gray-500">{account.accountNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(account.currentBalance)}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">{account.accountType}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions & Quick Actions */}
        <div className="space-y-6">
          {/* Recent Transactions */}
          <div className="dashboard-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              <Link 
                href="/dashboard/transactions"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View all
              </Link>
            </div>
            
            <div className="space-y-3">
              {mockDashboardData.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(transaction.date)} • {transaction.category}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className={`text-sm font-medium ${
                      transaction.amount > 0 ? 'metric-positive' : 'metric-negative'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dashboard-card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-primary-200 hover:bg-primary-50 transition-colors">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700">Transfer</span>
              </button>
              
              <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-primary-200 hover:bg-primary-50 transition-colors">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700">Pay Bills</span>
              </button>
              
              <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-primary-200 hover:bg-primary-50 transition-colors">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700">Buy Airtime</span>
              </button>
              
              <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-primary-200 hover:bg-primary-50 transition-colors">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700">Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation to other dashboard sections */}
      <div className="mt-8 bg-gray-50 rounded-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Explore More Dashboard Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link 
            href="/dashboard/analytics"
            className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-200 hover:shadow-card-hover transition-all"
          >
            <div className="w-10 h-10 bg-info-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Analytics</h3>
              <p className="text-xs text-gray-500">Spending insights</p>
            </div>
          </Link>

          <Link 
            href="/dashboard/alerts"
            className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-200 hover:shadow-card-hover transition-all"
          >
            <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5zm0 0v-3a4 4 0 00-4-4H8m7 7v-3a4 4 0 00-4-4H8" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Alerts</h3>
              <p className="text-xs text-gray-500">Manage notifications</p>
            </div>
          </Link>

          <Link 
            href="/dashboard/transactions"
            className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-200 hover:shadow-card-hover transition-all"
          >
            <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Transactions</h3>
              <p className="text-xs text-gray-500">Search & filter</p>
            </div>
          </Link>

          <Link 
            href="/dashboard/insights"
            className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-200 hover:shadow-card-hover transition-all"
          >
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Insights</h3>
              <p className="text-xs text-gray-500">AI recommendations</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}