'use client';

import React from 'react';
import type { AnalyticsFilters } from '../../types/analytics';

interface QuickFiltersProps {
  filters: AnalyticsFilters;
  onFiltersChange: (filters: AnalyticsFilters) => void;
  onClear: () => void;
}

export const QuickFilters: React.FC<QuickFiltersProps> = ({
  filters,
  onFiltersChange,
  onClear,
}) => {
  // Ghana regions for regional filter
  const ghanaRegions = [
    'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern',
    'Northern', 'Upper East', 'Upper West', 'Volta', 'Brong Ahafo',
    'Western North', 'Ahafo', 'Bono East', 'North East', 'Savannah', 'Oti'
  ];

  // Handle individual filter changes
  const handleFilterChange = (key: keyof AnalyticsFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? undefined : value,
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    onClear();
  };

  return (
    <div className="quick-filters">
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">Filters</h3>
          <button
            onClick={handleClearFilters}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Region Filter */}
          <div className="filter-field">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Region
            </label>
            <select
              value={filters.region || 'all'}
              onChange={(e) => handleFilterChange('region', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Regions</option>
              {ghanaRegions.map((region) => (
                <option key={region} value={region.toLowerCase().replace(/\s+/g, '_')}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Type Filter */}
          <div className="filter-field">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Customer Type
            </label>
            <select
              value={filters.customerType || 'all'}
              onChange={(e) => handleFilterChange('customerType', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="individual">Individual</option>
              <option value="business">Business</option>
            </select>
          </div>

          {/* Account Type Filter */}
          <div className="filter-field">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Account Type
            </label>
            <select
              value={filters.accountType || 'all'}
              onChange={(e) => handleFilterChange('accountType', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Accounts</option>
              <option value="savings">Savings</option>
              <option value="current">Current</option>
              <option value="fixed_deposit">Fixed Deposit</option>
              <option value="loan">Loan</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div className="filter-field">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Risk Level
            </label>
            <select
              value={filters.riskLevel || 'all'}
              onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
              <option value="critical">Critical Risk</option>
            </select>
          </div>

          {/* Age Group Filter */}
          <div className="filter-field">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Age Group
            </label>
            <select
              value={filters.ageGroup || 'all'}
              onChange={(e) => handleFilterChange('ageGroup', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Ages</option>
              <option value="18-25">18-25</option>
              <option value="26-35">26-35</option>
              <option value="36-45">36-45</option>
              <option value="46-55">46-55</option>
              <option value="56+">56+</option>
            </select>
          </div>

          {/* Transaction Type Filter */}
          <div className="filter-field">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Transaction Type
            </label>
            <select
              value={filters.transactionType || 'all'}
              onChange={(e) => handleFilterChange('transactionType', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Transactions</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="transfer">Transfers</option>
              <option value="fee">Fees</option>
              <option value="interest">Interest</option>
            </select>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Custom Date Range
          </label>
          <div className="flex space-x-3">
            <div className="flex-1">
              <input
                type="date"
                value={filters.dateRange?.start || ''}
                onChange={(e) => handleFilterChange('dateRange', {
                  ...filters.dateRange,
                  start: e.target.value
                })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Start date"
              />
            </div>
            <div className="flex-1">
              <input
                type="date"
                value={filters.dateRange?.end || ''}
                onChange={(e) => handleFilterChange('dateRange', {
                  ...filters.dateRange,
                  end: e.target.value
                })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="End date"
              />
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        {Object.values(filters).some(filter => filter !== undefined) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-2">Active Filters:</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => {
                if (!value) return null;
                return (
                  <span
                    key={key}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                  >
                    {key}: {typeof value === 'string' ? value : JSON.stringify(value)}
                    <button
                      onClick={() => handleFilterChange(key as keyof AnalyticsFilters, undefined)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickFilters;