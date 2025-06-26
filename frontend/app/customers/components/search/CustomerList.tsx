'use client';

import React, { useState } from 'react';
import type { Customer } from '../../../../types/customer';
import { formatCustomerName, formatPhoneNumber, formatCurrency, formatRelativeTime, getVerificationStatusInfo, getCustomerActivityStatus, calculateCustomerRiskLevel, getRiskLevelInfo } from '../../../../utils/customerHelpers';
import { CustomerCard } from '../CustomerCard';
import { PaginationControls } from './PaginationControls';
import { InfiniteScrollList } from './InfiniteScrollList';
import { CheckSquare, Square, Users, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomerListProps {
  customers: Customer[];
  selectedCustomers: string[];
  onCustomerSelect: (customerId: string) => void;
  onSelectAll: () => void;
  isLoading?: boolean;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCustomers: number;
    limit: number;
    onPageChange: (page: number) => void;
  };
  viewMode?: 'cards' | 'table' | 'infinite';
  onViewModeChange?: (mode: 'cards' | 'table' | 'infinite') => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  selectedCustomers,
  onCustomerSelect,
  onSelectAll,
  isLoading = false,
  pagination,
  viewMode = 'cards',
  onViewModeChange,
}) => {
  const [hoveredCustomer, setHoveredCustomer] = useState<string | null>(null);

  const allSelected = customers.length > 0 && selectedCustomers.length === customers.length;
  const someSelected = selectedCustomers.length > 0 && selectedCustomers.length < customers.length;

  const handleCustomerAction = (action: string, customerId: string) => {
    console.log(`Customer action: ${action} for customer ${customerId}`);
    // TODO: Implement customer actions (view details, edit, etc.)
  };

  if (customers.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
        <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* List header with bulk actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Bulk select */}
          <button
            onClick={onSelectAll}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4 text-primary-600" />
            ) : someSelected ? (
              <div className="w-4 h-4 border-2 border-primary-600 bg-primary-600 rounded-sm flex items-center justify-center">
                <div className="w-2 h-0.5 bg-white"></div>
              </div>
            ) : (
              <Square className="w-4 h-4" />
            )}
            <span>
              {allSelected ? 'Deselect all' : someSelected ? 'Select all' : 'Select all'}
            </span>
          </button>

          {selectedCustomers.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedCustomers.length} selected
              </span>
              <div className="h-4 w-px bg-gray-300"></div>
              <button className="text-sm text-primary-600 hover:text-primary-700">
                Export Selected
              </button>
              <button className="text-sm text-primary-600 hover:text-primary-700">
                Bulk Actions
              </button>
            </div>
          )}
        </div>

        {/* View mode toggle */}
        {onViewModeChange && (
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('cards')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => onViewModeChange('infinite')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                viewMode === 'infinite'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Infinite
            </button>
          </div>
        )}
      </div>

      {/* Customer list content */}
      {viewMode === 'cards' && (
        <div className="customer-grid">
          {customers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              isSelected={selectedCustomers.includes(customer.id)}
              onSelect={() => onCustomerSelect(customer.id)}
              onAction={handleCustomerAction}
              showActions={true}
            />
          ))}
        </div>
      )}

      {viewMode === 'table' && (
        <div className="customer-table-responsive">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={onSelectAll}
                    className="flex items-center"
                  >
                    {allSelected ? (
                      <CheckSquare className="w-4 h-4 text-primary-600" />
                    ) : someSelected ? (
                      <div className="w-4 h-4 border-2 border-primary-600 bg-primary-600 rounded-sm flex items-center justify-center">
                        <div className="w-2 h-0.5 bg-white"></div>
                      </div>
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.map((customer) => {
                const verificationInfo = getVerificationStatusInfo(customer.verificationStatus);
                const activityStatus = getCustomerActivityStatus(customer);
                const riskLevel = calculateCustomerRiskLevel(customer);
                const riskInfo = getRiskLevelInfo(riskLevel);

                return (
                  <tr
                    key={customer.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedCustomers.includes(customer.id) ? 'bg-primary-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onCustomerSelect(customer.id)}
                        className="flex items-center"
                      >
                        {selectedCustomers.includes(customer.id) ? (
                          <CheckSquare className="w-4 h-4 text-primary-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatCustomerName(customer)}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {customer.idNumber || 'Not provided'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {formatPhoneNumber(customer.phone)}
                      </div>
                      {customer.email && (
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(customer.accountBalance)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {customer.accounts?.length || 0} accounts
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${verificationInfo.bgColor} ${verificationInfo.color}`}>
                          {verificationInfo.text}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${riskInfo.indicator}`} title={riskInfo.text}></span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-sm ${activityStatus.color}`}>
                        {activityStatus.text}
                      </div>
                      {customer.lastTransactionAt && (
                        <div className="text-sm text-gray-500">
                          {formatRelativeTime(customer.lastTransactionAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleCustomerAction('view', customer.id)}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleCustomerAction('edit', customer.id)}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'infinite' && (
        <InfiniteScrollList
          customers={customers}
          selectedCustomers={selectedCustomers}
          onCustomerSelect={onCustomerSelect}
          onCustomerAction={handleCustomerAction}
          hasMore={pagination.currentPage < pagination.totalPages}
          onLoadMore={() => pagination.onPageChange(pagination.currentPage + 1)}
          isLoading={isLoading}
        />
      )}

      {/* Pagination controls for cards and table view */}
      {(viewMode === 'cards' || viewMode === 'table') && (
        <PaginationControls
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalCustomers}
          itemsPerPage={pagination.limit}
          onPageChange={pagination.onPageChange}
          isLoading={isLoading}
        />
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">Loading customers...</span>
          </div>
        </div>
      )}
    </div>
  );
};