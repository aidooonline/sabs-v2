'use client';

import React, { useState, useEffect } from 'react';
import type { CustomerFilters, CustomerStatus, KycStatus, VerificationStatus, AccountType, RiskLevel } from '../../../../types/customer';
import { Calendar, DollarSign, Shield, User, X } from 'lucide-react';

interface AdvancedFiltersProps {
  filters: CustomerFilters;
  onFiltersChange: (filters: CustomerFilters) => void;
  onClear: () => void;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  onClear,
}) => {
  // Local state for form inputs
  const [localFilters, setLocalFilters] = useState<CustomerFilters>(filters);

  // Sync with external filters
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Apply filters
  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setLocalFilters({});
    onClear();
  };

  // Update local filter state
  const updateFilter = <K extends keyof CustomerFilters>(
    key: K,
    value: CustomerFilters[K]
  ) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Date range handlers
  const updateDateRange = (field: 'start' | 'end', value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        start: field === 'start' ? value : prev.dateRange?.start || '',
        end: field === 'end' ? value : prev.dateRange?.end || '',
      },
    }));
  };

  // Balance range handlers
  const updateBalanceRange = (field: 'min' | 'max', value: number) => {
    setLocalFilters(prev => ({
      ...prev,
      balanceRange: {
        ...prev.balanceRange,
        min: field === 'min' ? value : prev.balanceRange?.min || 0,
        max: field === 'max' ? value : prev.balanceRange?.max || 0,
      },
    }));
  };

  // Multi-select handlers
  const toggleAccountType = (value: AccountType) => {
    const currentArray = localFilters.accountTypes || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    updateFilter('accountTypes', newArray.length > 0 ? newArray : undefined);
  };

  const toggleRiskLevel = (value: RiskLevel) => {
    const currentArray = localFilters.riskLevel || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    updateFilter('riskLevel', newArray.length > 0 ? newArray : undefined);
  };

  const hasActiveFilters = Object.keys(localFilters).some(key => {
    const value = localFilters[key as keyof CustomerFilters];
    return value !== undefined && value !== null && 
           (Array.isArray(value) ? value.length > 0 : true);
  });

  return (
    <div className="customer-search-filters">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={applyFilters}
            className="customer-action-button primary"
          >
            Apply Filters
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="customer-action-button"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Customer Status Filter */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <User className="w-4 h-4 mr-2" />
            Customer Status
          </label>
          <div className="space-y-2">
                         {(['active', 'inactive', 'suspended', 'pending'] as CustomerStatus[]).map(status => (
               <label key={status} className="flex items-center">
                 <input
                   type="checkbox"
                   checked={false} // TODO: Add customer status filter properly
                   onChange={() => {}} // TODO: Implement customer status toggle
                   className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                 />
                 <span className="text-sm text-gray-600 capitalize">{status}</span>
               </label>
             ))}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Calendar className="w-4 h-4 mr-2" />
            Registration Date
          </label>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">From</label>
              <input
                type="date"
                value={localFilters.dateRange?.start || ''}
                onChange={(e) => updateDateRange('start', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To</label>
              <input
                type="date"
                value={localFilters.dateRange?.end || ''}
                onChange={(e) => updateDateRange('end', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Balance Range Filter */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <DollarSign className="w-4 h-4 mr-2" />
            Account Balance (GHS)
          </label>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Minimum</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={localFilters.balanceRange?.min || ''}
                onChange={(e) => updateBalanceRange('min', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Maximum</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={localFilters.balanceRange?.max || ''}
                onChange={(e) => updateBalanceRange('max', parseFloat(e.target.value) || 0)}
                placeholder="No limit"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Account Types Filter */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Shield className="w-4 h-4 mr-2" />
            Account Types
          </label>
          <div className="space-y-2">
                         {(['savings', 'checking', 'mobile_money', 'loan', 'investment'] as AccountType[]).map(type => (
               <label key={type} className="flex items-center">
                 <input
                   type="checkbox"
                   checked={localFilters.accountTypes?.includes(type) || false}
                   onChange={() => toggleAccountType(type)}
                   className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                 />
                 <span className="text-sm text-gray-600 capitalize">
                   {type.replace('_', ' ')}
                 </span>
               </label>
             ))}
          </div>
        </div>

        {/* Risk Level Filter */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Shield className="w-4 h-4 mr-2" />
            Risk Level
          </label>
          <div className="space-y-2">
                         {(['low', 'medium', 'high', 'critical'] as RiskLevel[]).map(level => (
               <label key={level} className="flex items-center">
                 <input
                   type="checkbox"
                   checked={localFilters.riskLevel?.includes(level) || false}
                   onChange={() => toggleRiskLevel(level)}
                   className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                 />
                 <span className="text-sm text-gray-600 capitalize flex items-center">
                   <span className={`risk-indicator-${level} mr-2`}></span>
                   {level} Risk
                 </span>
               </label>
             ))}
          </div>
        </div>

        {/* Has Transactions Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Transaction Activity</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="hasTransactions"
                checked={localFilters.hasTransactions === undefined}
                onChange={() => updateFilter('hasTransactions', undefined)}
                className="mr-2 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">All customers</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="hasTransactions"
                checked={localFilters.hasTransactions === true}
                onChange={() => updateFilter('hasTransactions', true)}
                className="mr-2 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">With transactions</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="hasTransactions"
                checked={localFilters.hasTransactions === false}
                onChange={() => updateFilter('hasTransactions', false)}
                className="mr-2 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">Without transactions</span>
            </label>
          </div>
        </div>
      </div>

      {/* Quick filter presets */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <label className="text-sm font-medium text-gray-700 mb-2 block">Quick Filters</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setLocalFilters({
                dateRange: {
                  start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  end: new Date().toISOString().split('T')[0],
                },
              });
              applyFilters();
            }}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            New this week
          </button>
          <button
            onClick={() => {
              setLocalFilters({
                hasTransactions: true,
                riskLevel: ['low'],
              });
              applyFilters();
            }}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            Active & Low Risk
          </button>
          <button
            onClick={() => {
              setLocalFilters({
                riskLevel: ['high', 'critical'],
              });
              applyFilters();
            }}
            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            High Risk
          </button>
          <button
            onClick={() => {
              setLocalFilters({
                hasTransactions: false,
                dateRange: {
                  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  end: new Date().toISOString().split('T')[0],
                },
              });
              applyFilters();
            }}
            className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
          >
            Inactive customers
          </button>
        </div>
      </div>
    </div>
  );
};