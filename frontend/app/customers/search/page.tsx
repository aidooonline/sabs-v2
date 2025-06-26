'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useGetCustomersQuery } from '../../../store/api/customerApi';
import { CustomerErrorBoundary } from '../shared/ErrorBoundary';
import { CustomerListSkeleton, SearchResultsSkeleton, EmptyStateWithLoading } from '../shared/LoadingStates';
import { useCustomerSearchRealTime } from '../hooks/useCustomerRealTime';
import type { CustomerQuery, CustomerFilters, CustomerSortField } from '../../../types/customer';
import { RealTimeSearch } from '../components/search/RealTimeSearch';
import { AdvancedFilters } from '../components/search/AdvancedFilters';
import { CustomerList } from '../components/search/CustomerList';
import { SortingControls } from '../components/search/SortingControls';
import { ExportManager } from '../components/search/ExportManager';
import { Search, Filter, Users, Download } from 'lucide-react';
import { CustomerDetailModal } from '../modals/CustomerDetailModal';
import { TransactionModal } from '../modals/TransactionModal';
import { BulkSelectionToolbar, MobileBulkSelectionBar } from '../components/BulkSelectionToolbar';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import type { Customer, Account, CustomerTransaction } from '../../../types/customer';
import { PaginationControls } from '../components/PaginationControls';

const CustomerSearchPage: React.FC = () => {
  // Search state management
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [sortBy, setSortBy] = useState<CustomerSortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalMode, setDetailModalMode] = useState<'view' | 'edit'>('view');
  
  // Transaction modal state
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal' | 'transfer'>('deposit');
  const [selectedAccount, setSelectedAccount] = useState<Account | undefined>(undefined);

  // Build query object
  const queryParams = useMemo((): CustomerQuery => ({
    search: searchQuery.trim() || undefined,
    sortBy,
    sortOrder,
    page,
    limit,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
  }), [searchQuery, sortBy, sortOrder, page, limit, filters]);

  // API query with real-time updates
  const {
    data: customerData,
    isLoading,
    isFetching,
    error,
    refetch
  } = useGetCustomersQuery(queryParams, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  // Real-time search updates
  useCustomerSearchRealTime(searchQuery, filters);

  // Event handlers
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page on new search
  }, []);

  const handleFiltersChange = useCallback((newFilters: CustomerFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  }, []);

  const handleSort = useCallback((field: CustomerSortField, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setPage(1); // Reset to first page on sort change
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page on limit change
  }, []);

  const handleCustomerSelect = useCallback((customerId: string) => {
    setSelectedCustomers(prev => {
      const isSelected = prev.includes(customerId);
      if (isSelected) {
        return prev.filter(id => id !== customerId);
      } else {
        return [...prev, customerId];
      }
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const customerIds = customerData?.customers.map(c => c.id) || [];
    setSelectedCustomers(prev => 
      prev.length === customerIds.length ? [] : customerIds
    );
  }, [customerData]);

  const handleClearSelection = useCallback(() => {
    setSelectedCustomers([]);
  }, []);

  // Handle individual customer actions (enhanced for transactions)
  const handleCustomerAction = useCallback((action: string, customerId: string) => {
    const customer = customerData?.customers.find(c => c.id === customerId);
    if (!customer) return;

    switch (action) {
      case 'info':
      case 'details':
        setSelectedCustomerId(customerId);
        setDetailModalMode('view');
        setDetailModalOpen(true);
        break;
      case 'edit':
        setSelectedCustomerId(customerId);
        setDetailModalMode('edit');
        setDetailModalOpen(true);
        break;
      case 'deposit':
        setSelectedCustomerId(customerId);
        setTransactionType('deposit');
        setSelectedAccount(customer.accounts?.[0]); // Default to first account
        setTransactionModalOpen(true);
        break;
      case 'withdraw':
        setSelectedCustomerId(customerId);
        setTransactionType('withdrawal');
        setSelectedAccount(customer.accounts?.[0]);
        setTransactionModalOpen(true);
        break;
      case 'transfer':
        setSelectedCustomerId(customerId);
        setTransactionType('transfer');
        setSelectedAccount(customer.accounts?.[0]);
        setTransactionModalOpen(true);
        break;
      case 'accounts':
        setSelectedCustomerId(customerId);
        setDetailModalMode('view');
        setDetailModalOpen(true);
        // Could set a specific tab here
        break;
      case 'history':
        setSelectedCustomerId(customerId);
        setDetailModalMode('view');
        setDetailModalOpen(true);
        // Could set transactions tab here
        break;
      default:
        console.log('Unknown action:', action, 'for customer:', customerId);
    }
  }, [customerData]);

  // Handle bulk actions
  const handleBulkAction = useCallback((action: string, customerIds: string[]) => {
    console.log('Bulk action:', action, 'for customers:', customerIds);
    
    switch (action) {
      case 'export':
        // Handle export
        handleExportCustomers(customerIds);
        break;
      case 'email':
        // Handle email
        handleEmailCustomers(customerIds);
        break;
      case 'assign-group':
        // Handle group assignment
        handleAssignGroup(customerIds);
        break;
      case 'report':
        // Handle report generation
        handleGenerateReport(customerIds);
        break;
      case 'archive':
        // Handle archive
        handleArchiveCustomers(customerIds);
        break;
      case 'risk-assessment':
        // Handle risk assessment
        handleRiskAssessment(customerIds);
        break;
      default:
        console.log('Unknown bulk action:', action);
    }
  }, []);

  // Bulk action handlers
  const handleExportCustomers = useCallback((customerIds: string[]) => {
    // Implementation for customer export
    console.log('Exporting customers:', customerIds);
  }, []);

  const handleEmailCustomers = useCallback((customerIds: string[]) => {
    // Implementation for sending emails
    console.log('Sending emails to customers:', customerIds);
  }, []);

  const handleAssignGroup = useCallback((customerIds: string[]) => {
    // Implementation for group assignment
    console.log('Assigning customers to group:', customerIds);
  }, []);

  const handleGenerateReport = useCallback((customerIds: string[]) => {
    // Implementation for report generation
    console.log('Generating report for customers:', customerIds);
  }, []);

  const handleArchiveCustomers = useCallback((customerIds: string[]) => {
    // Implementation for archiving customers
    console.log('Archiving customers:', customerIds);
  }, []);

  const handleRiskAssessment = useCallback((customerIds: string[]) => {
    // Implementation for risk assessment
    console.log('Running risk assessment for customers:', customerIds);
  }, []);

  // Handle customer update from detail modal
  const handleCustomerUpdate = useCallback((updatedCustomer: Customer) => {
    // Refresh the customer list
    refetch();
    console.log('Customer updated:', updatedCustomer);
  }, [refetch]);

  // Handle detail modal close
  const handleDetailModalClose = useCallback(() => {
    setDetailModalOpen(false);
    setSelectedCustomerId(null);
    setDetailModalMode('view');
  }, []);

  // Handle transaction completion
  const handleTransactionComplete = useCallback((transaction: CustomerTransaction) => {
    console.log('Transaction completed:', transaction);
    
    // Refresh customer data to reflect balance changes
    refetch();
    
    // Close transaction modal
    setTransactionModalOpen(false);
    setSelectedCustomerId(null);
    setSelectedAccount(undefined);
    
    // Show success notification
    // toast.success(`${transaction.type} completed successfully!`);
  }, [refetch]);

  // Handle transaction modal close
  const handleTransactionModalClose = useCallback(() => {
    setTransactionModalOpen(false);
    setSelectedCustomerId(null);
    setSelectedAccount(undefined);
  }, []);

  // Quick transaction handlers for bulk actions
  const handleQuickDeposit = useCallback((customerIds: string[]) => {
    if (customerIds.length === 1) {
      const customer = customerData?.customers.find(c => c.id === customerIds[0]);
      if (customer) {
        setSelectedCustomerId(customerIds[0]);
        setTransactionType('deposit');
        setSelectedAccount(customer.accounts?.[0]);
        setTransactionModalOpen(true);
      }
    } else {
      // Handle bulk deposits - could open a bulk transaction modal
      console.log('Bulk deposit for customers:', customerIds);
    }
  }, [customerData]);

  const handleQuickWithdrawal = useCallback((customerIds: string[]) => {
    if (customerIds.length === 1) {
      const customer = customerData?.customers.find(c => c.id === customerIds[0]);
      if (customer) {
        setSelectedCustomerId(customerIds[0]);
        setTransactionType('withdrawal');
        setSelectedAccount(customer.accounts?.[0]);
        setTransactionModalOpen(true);
      }
    } else {
      // Handle bulk withdrawals
      console.log('Bulk withdrawal for customers:', customerIds);
    }
  }, [customerData]);

  // Extract customer IDs for keyboard navigation
  const customerIds = customerData?.customers.map(customer => customer.id) || [];

  // Keyboard navigation (after all handlers are defined)
  const { focusedIndex, navigationMode } = useKeyboardNavigation({
    customerIds,
    selectedCustomers,
    onCustomerSelect: handleCustomerSelect,
    onCustomerAction: handleCustomerAction,
    onBulkAction: handleBulkAction,
  });

  // Computed values
  const hasResults = customerData && customerData.customers.length > 0;
  const hasSearch = searchQuery.trim().length > 0 || Object.keys(filters).length > 0;
  const totalCustomers = customerData?.pagination.total || 0;
  const totalPages = customerData?.pagination.totalPages || 0;

  // Get selected customer for modals
  const selectedCustomer = selectedCustomerId 
    ? customerData?.customers.find(c => c.id === selectedCustomerId) 
    : null;

  return (
    <CustomerErrorBoundary>
      <div className="min-h-screen bg-customer-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Customer Search
                </h1>
                <p className="text-gray-600">
                  Find and manage your customers with advanced search and filtering
                </p>
              </div>
              
              {/* Quick stats */}
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600">
                  {totalCustomers.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Total Customers</div>
              </div>
            </div>

            {/* Search and filter controls */}
            <div className="customer-search">
                              <div className="flex-1">
                 <RealTimeSearch
                   value={searchQuery}
                   onSearch={handleSearch}
                   placeholder="Search by name, phone, email, or ID..."
                   isLoading={isFetching}
                 />
                </div>
              
              <div className="flex items-center space-x-2">
                {/* Filter toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`customer-action-button ${showFilters ? 'primary' : ''}`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {Object.keys(filters).length > 0 && (
                    <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
                      {Object.keys(filters).length}
                    </span>
                  )}
                </button>

                {/* Export button */}
                <ExportManager
                  customers={customerData?.customers || []}
                  filters={filters}
                  searchQuery={searchQuery}
                  selectedCustomers={selectedCustomers}
                />
              </div>
            </div>

            {/* Advanced filters panel */}
            {showFilters && (
              <div className="mt-4">
                <AdvancedFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onClear={() => setFilters({})}
                />
              </div>
            )}
          </div>

          {/* Results section */}
          <div className="space-y-6">
            {/* Results header with sorting and pagination info */}
            {(hasResults || isLoading) && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    {isLoading ? (
                      'Searching...'
                    ) : (
                      <>
                        Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, totalCustomers)} of {totalCustomers} customers
                        {hasSearch && ' for your search'}
                      </>
                    )}
                  </div>
                  
                  {selectedCustomers.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-primary-600 font-medium">
                        {selectedCustomers.length} selected
                      </span>
                      <button
                        onClick={handleClearSelection}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <SortingControls
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  
                  {/* Page size selector */}
                  <select
                    value={limit}
                    onChange={(e) => handleLimitChange(Number(e.target.value))}
                    className="text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </div>
              </div>
            )}

            {/* Loading state */}
            {isLoading && !customerData && (
              <CustomerListSkeleton count={limit} />
            )}

            {/* Results */}
            {customerData && (
              <CustomerList
                customers={customerData.customers}
                selectedCustomers={selectedCustomers}
                onCustomerSelect={handleCustomerSelect}
                onSelectAll={handleSelectAll}
                isLoading={isFetching}
                pagination={{
                  currentPage: page,
                  totalPages,
                  totalCustomers,
                  limit,
                  onPageChange: handlePageChange,
                }}
              />
            )}

            {/* Empty states */}
            {!isLoading && customerData && customerData.customers.length === 0 && (
              <EmptyStateWithLoading
                icon={hasSearch ? <Search className="w-12 h-12 text-gray-400" /> : <Users className="w-12 h-12 text-gray-400" />}
                title={hasSearch ? "No customers found" : "No customers yet"}
                description={
                  hasSearch 
                    ? "Try adjusting your search criteria or filters to find what you're looking for."
                    : "When customers are added to the system, they'll appear here."
                }
                action={
                  hasSearch ? (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilters({});
                      }}
                      className="customer-action-button primary"
                    >
                      Clear search
                    </button>
                  ) : (
                    <div className="customer-action-button opacity-50">
                      <Users className="w-4 h-4 mr-2" />
                      Add Customer (Coming Soon)
                    </div>
                  )
                }
              />
            )}

            {/* Error state */}
            {error && (
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.876c1.341 0 2.458-1.035 2.532-2.368.078-1.414-.866-2.632-2.268-2.632H18L16.5 6l-3 4-3-4L9 11.5H7.732c-1.402 0-2.346 1.218-2.268 2.632C5.538 15.465 6.655 16.5 7.996 16.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Failed to load customers
                </h3>
                <p className="text-gray-600 mb-4">
                  There was an error loading the customer data. Please try again.
                </p>
                <button
                  onClick={() => refetch()}
                  className="customer-action-button primary"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Bulk Selection Toolbars */}
          <BulkSelectionToolbar
            selectedCount={selectedCustomers.length}
            selectedCustomers={selectedCustomers}
            onClearSelection={handleClearSelection}
            onBulkAction={handleBulkAction}
            isVisible={selectedCustomers.length > 0}
          />

          <MobileBulkSelectionBar
            selectedCount={selectedCustomers.length}
            selectedCustomers={selectedCustomers}
            onClearSelection={handleClearSelection}
            onBulkAction={handleBulkAction}
            isVisible={selectedCustomers.length > 0}
          />

          {/* Customer Detail Modal */}
          {selectedCustomer && (
            <CustomerDetailModal
              customer={selectedCustomer}
              isOpen={detailModalOpen}
              onClose={handleDetailModalClose}
              onCustomerUpdate={handleCustomerUpdate}
              mode={detailModalMode}
            />
          )}

          {/* Transaction Modal */}
          {selectedCustomer && (
            <TransactionModal
              isOpen={transactionModalOpen}
              onClose={handleTransactionModalClose}
              customer={selectedCustomer}
              transactionType={transactionType}
              selectedAccount={selectedAccount}
              onTransactionComplete={handleTransactionComplete}
            />
          )}
        </div>
      </div>
    </CustomerErrorBoundary>
  );
};

export default CustomerSearchPage;