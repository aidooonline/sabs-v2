'use client';

import React from 'react';
import type { CustomerSortField } from '../../../../types/customer';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface SortingControlsProps {
  sortBy: CustomerSortField;
  sortOrder: 'asc' | 'desc';
  onSort: (field: CustomerSortField, order: 'asc' | 'desc') => void;
}

export const SortingControls: React.FC<SortingControlsProps> = ({
  sortBy,
  sortOrder,
  onSort,
}) => {
  const sortOptions: Array<{ field: CustomerSortField; label: string; description: string }> = [
    { field: 'firstName', label: 'First Name', description: 'Sort by customer first name' },
    { field: 'lastName', label: 'Last Name', description: 'Sort by customer last name' },
    { field: 'createdAt', label: 'Registration', description: 'Sort by registration date' },
    { field: 'lastTransactionAt', label: 'Last Activity', description: 'Sort by last transaction date' },
    { field: 'accountBalance', label: 'Balance', description: 'Sort by account balance' },
    { field: 'phone', label: 'Phone', description: 'Sort by phone number' },
  ];

  const handleSortChange = (field: CustomerSortField) => {
    if (sortBy === field) {
      // Toggle order if same field
      onSort(field, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to ascending for new field
      onSort(field, 'asc');
    }
  };

  const getSortIcon = (field: CustomerSortField) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-primary-600" />
      : <ArrowDown className="w-4 h-4 text-primary-600" />;
  };

  const currentSortOption = sortOptions.find(option => option.field === sortBy);

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600 whitespace-nowrap">Sort by:</span>
      
      {/* Desktop dropdown */}
      <div className="hidden sm:block relative">
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-') as [CustomerSortField, 'asc' | 'desc'];
            onSort(field, order);
          }}
          className="appearance-none bg-white border border-gray-300 rounded px-3 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {sortOptions.map(option => (
            <optgroup key={option.field} label={option.label}>
              <option value={`${option.field}-asc`}>
                {option.label} (A-Z)
              </option>
              <option value={`${option.field}-desc`}>
                {option.label} (Z-A)
              </option>
            </optgroup>
          ))}
        </select>
        
        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Mobile sort buttons */}
      <div className="sm:hidden flex items-center space-x-1">
        {sortOptions.slice(0, 3).map(option => (
          <button
            key={option.field}
            onClick={() => handleSortChange(option.field)}
            className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
              sortBy === option.field
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={option.description}
          >
            <span>{option.label}</span>
            {getSortIcon(option.field)}
          </button>
        ))}
      </div>

      {/* Sort direction indicator for desktop */}
      <div className="hidden sm:flex items-center space-x-1">
        <button
          onClick={() => onSort(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
          className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
        >
          {getSortIcon(sortBy)}
          <span className="capitalize">{sortOrder}</span>
        </button>
      </div>
    </div>
  );
};

/**
 * Compact sorting controls for smaller spaces
 */
export const CompactSortingControls: React.FC<SortingControlsProps> = ({
  sortBy,
  sortOrder,
  onSort,
}) => {
  const sortOptions: Array<{ field: CustomerSortField; label: string }> = [
    { field: 'firstName', label: 'Name' },
    { field: 'createdAt', label: 'Date' },
    { field: 'accountBalance', label: 'Balance' },
    { field: 'lastTransactionAt', label: 'Activity' },
  ];

  return (
    <div className="flex items-center space-x-1">
      {sortOptions.map(option => (
        <button
          key={option.field}
          onClick={() => {
            if (sortBy === option.field) {
              onSort(option.field, sortOrder === 'asc' ? 'desc' : 'asc');
            } else {
              onSort(option.field, 'asc');
            }
          }}
          className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
            sortBy === option.field
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span>{option.label}</span>
          {sortBy === option.field && (
            sortOrder === 'asc' 
              ? <ArrowUp className="w-3 h-3" />
              : <ArrowDown className="w-3 h-3" />
          )}
        </button>
      ))}
    </div>
  );
};

/**
 * Table header sorting component
 */
interface TableSortHeaderProps {
  field: CustomerSortField;
  label: string;
  currentSortBy: CustomerSortField;
  currentSortOrder: 'asc' | 'desc';
  onSort: (field: CustomerSortField, order: 'asc' | 'desc') => void;
  className?: string;
}

export const TableSortHeader: React.FC<TableSortHeaderProps> = ({
  field,
  label,
  currentSortBy,
  currentSortOrder,
  onSort,
  className = "",
}) => {
  const isActive = currentSortBy === field;
  
  const handleClick = () => {
    if (isActive) {
      onSort(field, currentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(field, 'asc');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center space-x-1 text-left font-medium text-gray-900 hover:text-primary-600 transition-colors ${className}`}
    >
      <span>{label}</span>
      <div className="flex flex-col">
        {!isActive && <ArrowUpDown className="w-3 h-3 text-gray-400" />}
        {isActive && currentSortOrder === 'asc' && <ArrowUp className="w-3 h-3 text-primary-600" />}
        {isActive && currentSortOrder === 'desc' && <ArrowDown className="w-3 h-3 text-primary-600" />}
      </div>
    </button>
  );
};