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

const CustomerSearchPage: React.FC = () => {
  // Search state management
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [sortBy, setSortBy] = useState<CustomerSortField>('firstName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

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
    setSelectedCustomers(prev => 
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
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

  // Computed values
  const hasResults = customerData && customerData.customers.length > 0;
  const hasSearch = searchQuery.trim().length > 0 || Object.keys(filters).length > 0;
  const totalCustomers = customerData?.pagination.total || 0;
  const totalPages = customerData?.pagination.totalPages || 0;

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
        </div>
      </div>
    </CustomerErrorBoundary>
  );
};

export default CustomerSearchPage;