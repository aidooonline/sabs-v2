import React, { useState, useEffect } from 'react';
import { Card } from '../../atoms/Card';
import { Button } from '../../atoms/Button';
import { Input } from '../../atoms/Input';
import { Badge } from '../../atoms/Badge';
import { Spinner } from '../../atoms/Spinner';
import { 
  Staff, 
  StaffRole,
  StaffStatus,
  StaffFilterParams, 
  StaffListResponse,
  staffService 
} from '../../../services/api/staffService';
import { cn } from '../../../utils/helpers';

interface StaffTableProps {
  companyId: string;
  onStaffSelect?: (staff: Staff) => void;
  onCreateStaff?: () => void;
  onEditStaff?: (staff: Staff) => void;
  onPerformanceView?: (staff: Staff) => void;
  className?: string;
}

// Status and role badge helpers
const getStatusBadge = (status: StaffStatus) => {
  const variant = staffService.getStatusBadgeVariant(status);
  const labels = {
    [StaffStatus.ACTIVE]: 'Active',
    [StaffStatus.PENDING]: 'Pending',
    [StaffStatus.SUSPENDED]: 'Suspended',
    [StaffStatus.INACTIVE]: 'Inactive',
  };
  return { variant, label: labels[status] };
};

const getRoleBadge = (role: StaffRole) => {
  const variant = staffService.getRoleBadgeVariant(role);
  const labels = {
    [StaffRole.FIELD_AGENT]: 'Field Agent',
    [StaffRole.CLERK]: 'Clerk',
  };
  return { variant, label: labels[role] };
};

// Icons
const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PerformanceIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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

export const StaffTable: React.FC<StaffTableProps> = ({
  companyId,
  onStaffSelect,
  onCreateStaff,
  onEditStaff,
  onPerformanceView,
  className,
}) => {
  // State management
  const [staff, setStaff] = useState<StaffListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  
  // Filter and pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<StaffStatus | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState<'firstName' | 'lastName' | 'email' | 'role' | 'status' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Load staff data
  const loadStaff = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: StaffFilterParams = {
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      };

      const response = await staffService.getAllStaff(companyId, params);
      setStaff(response);
    } catch (err) {
      console.error('Error loading staff:', err);
      setError('Failed to load staff. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when filters change
  useEffect(() => {
    if (companyId) {
      loadStaff();
    }
  }, [companyId, currentPage, searchQuery, roleFilter, statusFilter, sortBy, sortOrder]);

  // Handle search input
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page
  };

  // Handle filter changes
  const handleRoleFilter = (role: StaffRole | '') => {
    setRoleFilter(role);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: StaffStatus | '') => {
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

  // Handle staff selection
  const handleSelectStaff = (staffId: string) => {
    const newSelected = new Set(selectedStaff);
    if (newSelected.has(staffId)) {
      newSelected.delete(staffId);
    } else {
      newSelected.add(staffId);
    }
    setSelectedStaff(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (staff && selectedStaff.size === staff.data.length) {
      setSelectedStaff(new Set());
    } else if (staff) {
      setSelectedStaff(new Set(staff.data.map(s => s.id)));
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

  // Format last login
  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Never';
    const date = new Date(lastLogin);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(lastLogin);
  };

  if (loading && !staff) {
    return (
      <Card className={cn('p-8 text-center', className)}>
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">Loading staff...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('p-8 text-center', className)}>
        <div className="text-red-600 mb-4">
          <p className="font-medium">Error loading staff</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <Button onClick={loadStaff} variant="outline" size="sm">
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
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => handleRoleFilter(e.target.value as StaffRole | '')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Roles</option>
            <option value={StaffRole.FIELD_AGENT}>Field Agent</option>
            <option value={StaffRole.CLERK}>Clerk</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value as StaffStatus | '')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Status</option>
            <option value={StaffStatus.ACTIVE}>Active</option>
            <option value={StaffStatus.PENDING}>Pending</option>
            <option value={StaffStatus.SUSPENDED}>Suspended</option>
            <option value={StaffStatus.INACTIVE}>Inactive</option>
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadStaff}
            loading={loading}
            leftIcon={<RefreshIcon />}
          >
            Refresh
          </Button>
          
          {onCreateStaff && (
            <Button
              variant="primary"
              size="sm"
              onClick={onCreateStaff}
              leftIcon={<UserIcon />}
            >
              Add Staff
            </Button>
          )}
        </div>
      </div>

      {/* Bulk actions */}
      {selectedStaff.size > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {selectedStaff.size} staff selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Activate
              </Button>
              <Button variant="outline" size="sm">
                Suspend
              </Button>
              <Button variant="outline" size="sm">
                Reset Password
              </Button>
              <Button variant="danger" size="sm">
                Deactivate
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Staff table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={staff && selectedStaff.size === staff.data.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('firstName')}
                >
                  Staff Member
                  {sortBy === 'firstName' && (
                    <span className="ml-1">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('role')}
                >
                  Role
                  {sortBy === 'role' && (
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
                  Agent Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staff?.data.map((staffMember) => {
                const statusBadge = getStatusBadge(staffMember.status);
                const roleBadge = getRoleBadge(staffMember.role);
                return (
                  <tr 
                    key={staffMember.id} 
                    className={cn(
                      'hover:bg-gray-50 transition-colors',
                      selectedStaff.has(staffMember.id) && 'bg-blue-50'
                    )}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedStaff.has(staffMember.id)}
                        onChange={() => handleSelectStaff(staffMember.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {staffService.getStaffDisplayName(staffMember)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {staffMember.email}
                          </div>
                          {staffMember.phone && (
                            <div className="text-sm text-gray-500">
                              {staffMember.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={roleBadge.variant}>
                        {roleBadge.label}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Badge variant={statusBadge.variant}>
                          {statusBadge.label}
                        </Badge>
                        {staffMember.isOnline && (
                          <div className="ml-2 h-2 w-2 bg-green-400 rounded-full"></div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {staffMember.agentCode || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <LocationIcon className="h-4 w-4 mr-1" />
                        <span>
                          {staffService.formatLocation(staffMember.location)}
                        </span>
                        {staffMember.location && staffService.isLocationStale(staffMember.location) && (
                          <span className="ml-1 text-yellow-500">⚠</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatLastLogin(staffMember.lastLogin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-1 justify-end">
                        {onPerformanceView && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPerformanceView(staffMember)}
                            leftIcon={<PerformanceIcon />}
                            title="View Performance"
                          />
                        )}
                        {onStaffSelect && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onStaffSelect(staffMember)}
                            leftIcon={<UserIcon />}
                            title="View Details"
                          />
                        )}
                        {onEditStaff && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditStaff(staffMember)}
                            leftIcon={<EditIcon />}
                            title="Edit Staff"
                          />
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
        {staff && staff.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * pageSize) + 1} to{' '}
              {Math.min(currentPage * pageSize, staff.total)} of{' '}
              {staff.total} staff members
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
                disabled={currentPage === staff.totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Empty state */}
      {staff && staff.data.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No staff found</h3>
            <p className="text-sm mb-4">
              {searchQuery || roleFilter || statusFilter
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first staff member.'}
            </p>
            {onCreateStaff && !searchQuery && !roleFilter && !statusFilter && (
              <Button variant="primary" onClick={onCreateStaff}>
                Add Staff Member
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default StaffTable;