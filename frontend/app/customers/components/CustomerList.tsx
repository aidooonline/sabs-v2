'use client';

import React, { useState, useCallback } from 'react';
import { CustomerCard } from './CustomerCard';
import { BulkSelectionToolbar, MobileBulkSelectionBar } from './BulkSelectionToolbar';
import { PaginationControls } from './PaginationControls';
import { CustomerLoadingCard } from '../shared/LoadingStates';
import type { Customer, CustomerListProps } from '../../../types/customer';
import { Grid, List, Loader2 } from 'lucide-react';

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  loading = false,
  error = null,
  viewMode = 'cards',
  onCustomerSelect,
  onCustomerAction,
  onBulkAction,
  pagination,
  onPageChange,
  onPageSizeChange,
}) => {
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);

  // Handle individual customer selection
  const handleCustomerSelect = useCallback((customerId: string) => {
    setSelectedCustomers(prev => {
      const isSelected = prev.includes(customerId);
      if (isSelected) {
        const newSelection = prev.filter(id => id !== customerId);
        if (newSelection.length === 0) {
          setBulkMode(false);
        }
        return newSelection;
      } else {
        if (!bulkMode) {
          setBulkMode(true);
        }
        return [...prev, customerId];
      }
    });
    
    onCustomerSelect?.(customerId);
  }, [bulkMode, onCustomerSelect]);

  // Handle bulk actions
  const handleBulkAction = useCallback((action: string, customerIds: string[]) => {
    onBulkAction?.(action, customerIds);
    
    // Clear selection for certain actions
    if (['export', 'email', 'report'].includes(action)) {
      setSelectedCustomers([]);
      setBulkMode(false);
    }
  }, [onBulkAction]);

  // Handle customer actions
  const handleCustomerAction = useCallback((action: string, customerId: string) => {
    onCustomerAction?.(action, customerId);
  }, [onCustomerAction]);

  // Clear all selections
  const handleClearSelection = useCallback(() => {
    setSelectedCustomers([]);
    setBulkMode(false);
  }, []);

  // Select all customers on current page
  const handleSelectAll = useCallback(() => {
    if (selectedCustomers.length === customers.length) {
      handleClearSelection();
    } else {
      setSelectedCustomers(customers.map(customer => customer.id));
      setBulkMode(true);
    }
  }, [customers, selectedCustomers.length, handleClearSelection]);

  // Loading state
  if (loading && customers.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
            <span className="text-sm text-gray-600">Loading customers...</span>
          </div>
        </div>
        <div className={`customer-list-grid ${viewMode}`}>
          {Array.from({ length: 6 }).map((_, index) => (
            <CustomerLoadingCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Customers</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (customers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search or filters to find customers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${bulkMode ? 'bulk-selection-active' : ''}`}>
      {/* List header with selection controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Results count */}
          <span className="text-sm text-gray-600">
            {pagination ? (
              <>
                Showing {((pagination.page - 1) * pagination.pageSize) + 1}-{Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} customers
              </>
            ) : (
              `${customers.length} customers`
            )}
          </span>

          {/* Bulk selection controls */}
          {customers.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSelectAll}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {selectedCustomers.length === customers.length ? 'Deselect All' : 'Select All'}
              </button>
              
              {selectedCustomers.length > 0 && (
                <span className="text-sm text-gray-500">
                  ({selectedCustomers.length} selected)
                </span>
              )}
            </div>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => {/* Handle view mode change */}}
            className={`p-2 rounded-md ${viewMode === 'cards' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            title="Card view"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => {/* Handle view mode change */}}
            className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Customer list/grid */}
      <div className={`customer-list-grid ${viewMode}`}>
        {customers.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            onSelect={handleCustomerSelect}
            onAction={handleCustomerAction}
            isSelected={selectedCustomers.includes(customer.id)}
            showActions={true}
          />
        ))}
      </div>

      {/* Loading more indicator */}
      {loading && customers.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          <span className="ml-2 text-sm text-gray-600">Loading more customers...</span>
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <PaginationControls
          currentPage={pagination.page}
          totalPages={Math.ceil(pagination.total / pagination.pageSize)}
          pageSize={pagination.pageSize}
          totalItems={pagination.total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}

      {/* Bulk selection toolbars */}
      <BulkSelectionToolbar
        selectedCount={selectedCustomers.length}
        selectedCustomers={selectedCustomers}
        onClearSelection={handleClearSelection}
        onBulkAction={handleBulkAction}
        isVisible={bulkMode && selectedCustomers.length > 0}
      />

      <MobileBulkSelectionBar
        selectedCount={selectedCustomers.length}
        selectedCustomers={selectedCustomers}
        onClearSelection={handleClearSelection}
        onBulkAction={handleBulkAction}
        isVisible={bulkMode && selectedCustomers.length > 0}
      />
    </div>
  );
};