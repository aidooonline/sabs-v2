import React, { useState, useEffect } from 'react';
import { Card } from '../../atoms/Card';
import { Button } from '../../atoms/Button';
import { Input } from '../../atoms/Input';
import { Badge } from '../../atoms/Badge';
import { Spinner } from '../../atoms/Spinner';
import { 
  Company, 
  CompanyStatus, 
  CompanyQueryParams, 
  CompanyListResponse,
  companyService 
} from '../../../services/api/companyService';
import { cn } from '../../../utils/helpers';

interface CompanyTableProps {
  onCompanySelect?: (company: Company) => void;
  onCreateCompany?: () => void;
  onEditCompany?: (company: Company) => void;
  className?: string;
}

// Status badge variants
const getStatusBadge = (status: CompanyStatus) => {
  switch (status) {
    case CompanyStatus.ACTIVE:
      return { variant: 'success' as const, label: 'Active' };
    case CompanyStatus.TRIAL:
      return { variant: 'info' as const, label: 'Trial' };
    case CompanyStatus.SUSPENDED:
      return { variant: 'warning' as const, label: 'Suspended' };
    case CompanyStatus.INACTIVE:
      return { variant: 'error' as const, label: 'Inactive' };
    default:
      return { variant: 'default' as const, label: status };
  }
};

// Table action icons
const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const ViewIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export const CompanyTable: React.FC<CompanyTableProps> = ({
  onCompanySelect,
  onCreateCompany,
  onEditCompany,
  className,
}) => {
  // State management
  const [companies, setCompanies] = useState<CompanyListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  
  // Filter and pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CompanyStatus | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Load companies data
  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: CompanyQueryParams = {
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      };

      const response = await companyService.getAllCompanies(params);
      setCompanies(response);
    } catch (err) {
      console.error('Error loading companies:', err);
      setError('Failed to load companies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when filters change
  useEffect(() => {
    loadCompanies();
  }, [currentPage, searchQuery, statusFilter, sortBy, sortOrder]);

  // Handle search input
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page
  };

  // Handle status filter
  const handleStatusFilter = (status: CompanyStatus | '') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  // Handle sort
  const handleSort = (field: typeof sortBy) => {
    if (field === sortBy) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
  };

  // Handle company selection
  const handleSelectCompany = (companyId: string) => {
    const newSelected = new Set(selectedCompanies);
    if (newSelected.has(companyId)) {
      newSelected.delete(companyId);
    } else {
      newSelected.add(companyId);
    }
    setSelectedCompanies(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (companies && selectedCompanies.size === companies.data.length) {
      setSelectedCompanies(new Set());
    } else if (companies) {
      setSelectedCompanies(new Set(companies.data.map(c => c.id)));
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format credits
  const formatCredits = (credits: number) => {
    if (credits >= 1000000) {
      return `${(credits / 1000000).toFixed(1)}M`;
    } else if (credits >= 1000) {
      return `${(credits / 1000).toFixed(1)}K`;
    }
    return credits.toString();
  };

  if (loading && !companies) {
    return (
      <Card className={cn('p-8 text-center', className)}>
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">Loading companies...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('p-8 text-center', className)}>
        <div className="text-red-600 mb-4">
          <p className="font-medium">Error loading companies</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <Button onClick={loadCompanies} variant="outline" size="sm">
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value as CompanyStatus | '')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Status</option>
            <option value={CompanyStatus.ACTIVE}>Active</option>
            <option value={CompanyStatus.TRIAL}>Trial</option>
            <option value={CompanyStatus.SUSPENDED}>Suspended</option>
            <option value={CompanyStatus.INACTIVE}>Inactive</option>
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadCompanies}
            loading={loading}
            leftIcon={<RefreshIcon />}
          >
            Refresh
          </Button>
          
          {onCreateCompany && (
            <Button
              variant="primary"
              size="sm"
              onClick={onCreateCompany}
            >
              Add Company
            </Button>
          )}
        </div>
      </div>

      {/* Bulk actions */}
      {selectedCompanies.size > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {selectedCompanies.size} companies selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Activate
              </Button>
              <Button variant="outline" size="sm">
                Suspend
              </Button>
              <Button variant="danger" size="sm">
                Deactivate
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Companies table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={companies && selectedCompanies.size === companies.data.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Company
                  {sortBy === 'name' && (
                    <span className="ml-1">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  Status
                  {sortBy === 'status' && (
                    <span className="ml-1">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credits
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('createdAt')}
                >
                  Created
                  {sortBy === 'createdAt' && (
                    <span className="ml-1">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companies?.data.map((company) => {
                const statusBadge = getStatusBadge(company.status);
                return (
                  <tr 
                    key={company.id} 
                    className={cn(
                      'hover:bg-gray-50 transition-colors',
                      selectedCompanies.has(company.id) && 'bg-blue-50'
                    )}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedCompanies.has(company.id)}
                        onChange={() => handleSelectCompany(company.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {company.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {company.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={statusBadge.variant}>
                        {statusBadge.label}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="capitalize">
                        {company.subscriptionPlan.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div>SMS: {formatCredits(company.smsCredits)}</div>
                        <div>AI: {formatCredits(company.aiCredits)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(company.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2 justify-end">
                        {onCompanySelect && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCompanySelect(company)}
                            leftIcon={<ViewIcon />}
                          >
                            View
                          </Button>
                        )}
                        {onEditCompany && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditCompany(company)}
                            leftIcon={<EditIcon />}
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {companies && companies.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * pageSize) + 1} to{' '}
              {Math.min(currentPage * pageSize, companies.total)} of{' '}
              {companies.total} companies
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === companies.totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Empty state */}
      {companies && companies.data.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            <h3 className="text-lg font-medium mb-2">No companies found</h3>
            <p className="text-sm mb-4">
              {searchQuery || statusFilter 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first company.'}
            </p>
            {onCreateCompany && !searchQuery && !statusFilter && (
              <Button variant="primary" onClick={onCreateCompany}>
                Create Company
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default CompanyTable;