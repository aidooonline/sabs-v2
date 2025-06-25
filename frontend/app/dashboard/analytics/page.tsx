'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// Import analytics components (will be created in this session)
import { SpendingBreakdown } from '../../../components/dashboard/Analytics/SpendingBreakdown';
import { SpendingTrends } from '../../../components/dashboard/Analytics/SpendingTrends';
import { SpendingComparison } from '../../../components/dashboard/Analytics/SpendingComparison';

// Enhanced analytics mock data for demonstration (will be replaced with API calls)
const mockAnalyticsData = {
  // Spending breakdown by category
  spendingByCategory: [
    { category: 'Food & Dining', amount: 850.50, percentage: 28.5, color: '#3B82F6' },
    { category: 'Transportation', amount: 620.30, percentage: 20.8, color: '#10B981' },
    { category: 'Utilities', amount: 480.75, percentage: 16.1, color: '#F59E0B' },
    { category: 'Entertainment', amount: 380.90, percentage: 12.8, color: '#EF4444' },
    { category: 'Shopping', amount: 320.25, percentage: 10.7, color: '#8B5CF6' },
    { category: 'Healthcare', amount: 210.40, percentage: 7.1, color: '#06B6D4' },
    { category: 'Other', amount: 120.30, percentage: 4.0, color: '#6B7280' },
  ],
  
  // Spending trends over last 12 months
  spendingTrends: [
    { month: 'Jan', amount: 2450.50, budget: 3000, year: 2024 },
    { month: 'Feb', amount: 2680.30, budget: 3000, year: 2024 },
    { month: 'Mar', amount: 2890.75, budget: 3000, year: 2024 },
    { month: 'Apr', amount: 2320.40, budget: 3000, year: 2024 },
    { month: 'May', amount: 2750.60, budget: 3000, year: 2024 },
    { month: 'Jun', amount: 3120.80, budget: 3000, year: 2024 },
    { month: 'Jul', amount: 2940.25, budget: 3000, year: 2024 },
    { month: 'Aug', amount: 2780.90, budget: 3000, year: 2024 },
    { month: 'Sep', amount: 2650.35, budget: 3000, year: 2024 },
    { month: 'Oct', amount: 2480.70, budget: 3000, year: 2024 },
    { month: 'Nov', amount: 2890.45, budget: 3000, year: 2024 },
    { month: 'Dec', amount: 2983.20, budget: 3000, year: 2024 },
  ],
  
  // Month-over-month comparison
  monthComparison: {
    currentMonth: {
      name: 'December 2024',
      total: 2983.20,
      categories: [
        { category: 'Food & Dining', current: 850.50, previous: 780.20, change: 9.0 },
        { category: 'Transportation', current: 620.30, previous: 590.40, change: 5.1 },
        { category: 'Utilities', current: 480.75, previous: 465.30, change: 3.3 },
        { category: 'Entertainment', current: 380.90, previous: 420.60, change: -9.4 },
        { category: 'Shopping', current: 320.25, previous: 290.80, change: 10.1 },
        { category: 'Healthcare', current: 210.40, previous: 180.90, change: 16.3 },
        { category: 'Other', current: 120.30, previous: 140.25, change: -14.2 },
      ]
    },
    previousMonth: {
      name: 'November 2024',
      total: 2890.45,
    },
    change: 3.2,
  },
  
  // Time period options
  timePeriods: [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 3 Months' },
    { value: '12m', label: 'Last 12 Months' },
    { value: 'ytd', label: 'Year to Date' },
    { value: 'custom', label: 'Custom Range' },
  ],
  
  // Available categories for filtering
  categories: [
    'All Categories',
    'Food & Dining',
    'Transportation', 
    'Utilities',
    'Entertainment',
    'Shopping',
    'Healthcare',
    'Other',
  ],
};

export default function AnalyticsDashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [viewType, setViewType] = useState<'overview' | 'detailed'>('overview');

  // Event handlers for interactive features
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    console.log('Period changed to:', period);
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    console.log('Category filter:', category);
  };

  const handleCategoryDrillDown = (category: string) => {
    console.log('Drilling down into category:', category);
    setSelectedCategory(category);
    setViewType('detailed');
  };

  const handleExportData = (format: 'pdf' | 'csv' | 'excel') => {
    console.log('Exporting data as:', format);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Financial Analytics
            </h1>
            <p className="text-gray-600">
              Comprehensive insights into your spending patterns and financial trends
            </p>
          </div>
          
          {/* Export Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleExportData('pdf')}
              className="hidden sm:inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              📄 Export PDF
            </button>
            <button
              onClick={() => handleExportData('csv')}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-700 bg-primary-100 border border-primary-200 rounded-md hover:bg-primary-200 transition-colors"
            >
              📊 Export Data
            </button>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
          {/* Time Period Selector */}
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">Period:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="block w-auto rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
            >
              {mockAnalyticsData.timePeriods.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Category Filter */}
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryFilter(e.target.value)}
              className="block w-auto rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
            >
              {mockAnalyticsData.categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewType('overview')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewType === 'overview'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewType('detailed')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewType === 'detailed'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Detailed
            </button>
          </div>
        </div>
      </div>

      {/* Day 3 Morning Session Complete */}
      <div className="bg-gradient-to-r from-success-50 to-success-100 border border-success-200 rounded-card p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-success-900 mb-4">
          ✅ Day 3 Morning Session Complete (9:00 AM - 1:00 PM)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <span className="text-sm text-success-800">✅ Spending category breakdown (pie/bar charts)</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <span className="text-sm text-success-800">✅ Spending trends (time series)</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <span className="text-sm text-success-800">✅ Month-over-month comparison</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <span className="text-sm text-success-800">✅ Interactive filtering & drill-down</span>
          </div>
        </div>
      </div>

      {/* Day 3 Afternoon Session Preview */}
      <div className="bg-gradient-to-r from-warning-50 to-warning-100 border border-warning-200 rounded-card p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-warning-900 mb-4">
          🚧 Day 3 Afternoon Session (2:00 PM - 6:00 PM)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-warning-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-warning-800">Balance history charts</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-warning-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-warning-800">Budget tracking & progress</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-warning-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-warning-800">Budget alerts & notifications</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-warning-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-warning-800">Export functionality (PDF/CSV)</span>
          </div>
        </div>
      </div>

      {/* Analytics Grid - Morning Session Implementation */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
        {/* Spending Breakdown - Pie/Bar Charts */}
        <div className="xl:col-span-1">
          <SpendingBreakdown
            data={mockAnalyticsData.spendingByCategory}
            isLoading={isLoading}
            onCategoryClick={handleCategoryDrillDown}
            selectedCategory={selectedCategory}
            timePeriod={selectedPeriod}
          />
        </div>

        {/* Spending Trends - Time Series */}
        <div className="xl:col-span-2">
          <SpendingTrends
            data={mockAnalyticsData.spendingTrends}
            isLoading={isLoading}
            timePeriod={selectedPeriod}
            onPeriodChange={handlePeriodChange}
          />
        </div>
      </div>

      {/* Month-over-Month Comparison */}
      <div className="mb-6 sm:mb-8">
        <SpendingComparison
          data={mockAnalyticsData.monthComparison}
          isLoading={isLoading}
          onCategoryFilter={handleCategoryFilter}
        />
      </div>

      {/* Demo Controls */}
      <div className="bg-gradient-to-r from-success-50 to-success-100 border border-success-200 rounded-card p-4 sm:p-6 mb-6 sm:mb-8">
        <h3 className="text-lg font-semibold text-success-900 mb-4">
          🎮 Analytics Demo Controls
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsLoading(!isLoading)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isLoading 
                ? 'bg-warning-600 text-white hover:bg-warning-700' 
                : 'bg-success-600 text-white hover:bg-success-700'
            }`}
          >
            {isLoading ? '⏹ Stop Loading' : '▶ Show Loading States'}
          </button>
          <Link
            href="/dashboard/overview"
            className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            ← Back to Overview
          </Link>
          <Link
            href="/dashboard/alerts"
            className="px-4 py-2 bg-warning-600 text-white rounded-md text-sm font-medium hover:bg-warning-700 transition-colors"
          >
            🚨 Next: Alerts (Day 4)
          </Link>
        </div>
      </div>

      {/* Navigation to other sections */}
      <div className="bg-gray-50 rounded-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Analytics Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <h3 className="font-medium text-gray-900">Transaction Analysis</h3>
              <p className="text-xs text-gray-500">Detailed transaction insights</p>
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
              <h3 className="font-medium text-gray-900">Financial Insights</h3>
              <p className="text-xs text-gray-500">AI recommendations</p>
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
              <h3 className="font-medium text-gray-900">Budget Alerts</h3>
              <p className="text-xs text-gray-500">Spending notifications</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}