'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { StaffTable } from '@/components/organisms/StaffTable';
import { DashboardSummaryCard } from '@/components/molecules/DashboardSummaryCard';
import { 
  Staff, 
  StaffStats,
  RoleSummary,
  staffService 
} from '@/services/api/staffService';

// Icons
const TeamIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ActiveIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AgentIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ClerkIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const PendingIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PerformanceIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export default function StaffManagementPage() {
  const { user } = useAuth();
  
  // State
  const [staffStats, setStaffStats] = useState<StaffStats | null>(null);
  const [roleSummary, setRoleSummary] = useState<RoleSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Get company ID from user context
  const companyId = user?.companyId;

  // Load dashboard data
  const loadDashboardData = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      const [stats, roles] = await Promise.all([
        staffService.getStaffStats(companyId),
        staffService.getRoleSummary(companyId),
      ]);
      
      setStaffStats(stats);
      setRoleSummary(roles);
    } catch (error) {
      console.error('Error loading staff dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      loadDashboardData();
    }
  }, [companyId]);

  // Handle staff selection
  const handleStaffSelect = (staff: Staff) => {
    setSelectedStaff(staff);
    // Navigate to staff details page (future implementation)
    console.log('View staff:', staff);
  };

  // Handle staff creation
  const handleCreateStaff = () => {
    setShowCreateForm(true);
    // Open staff creation modal/form (future implementation)
    console.log('Create new staff member');
  };

  // Handle staff editing
  const handleEditStaff = (staff: Staff) => {
    setSelectedStaff(staff);
    // Open staff edit modal/form (future implementation)
    console.log('Edit staff:', staff);
  };

  // Handle performance view
  const handlePerformanceView = (staff: Staff) => {
    setSelectedStaff(staff);
    // Navigate to performance analytics page (future implementation)
    console.log('View performance for:', staff);
  };

  if (!companyId) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <h1 className="text-xl font-bold text-red-600 mb-2">No Company Context</h1>
          <p className="text-gray-600">
            Unable to load staff management. Company context is required.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <PermissionGuard
      roles={['company_admin']}
      fallback={
        <div className="p-6">
          <Card className="p-8 text-center">
            <h1 className="text-xl font-bold text-red-600 mb-2">Access Denied</h1>
            <p className="text-gray-600">
              This page is only accessible to Company Administrators.
            </p>
          </Card>
        </div>
      }
    >
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-gray-600 mt-1">
              Manage your field agents and clerks
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              variant="primary"
              onClick={handleCreateStaff}
              leftIcon={<AgentIcon />}
            >
              Add Staff Member
            </Button>
          </div>
        </div>

        {/* Dashboard Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <DashboardSummaryCard
            title="Total Staff"
            value={staffStats?.totalStaff || 0}
            subtitle="All team members"
            icon={<TeamIcon />}
            variant="info"
            loading={loading}
          />
          
          <DashboardSummaryCard
            title="Active Staff"
            value={staffStats?.activeStaff || 0}
            subtitle={`${staffStats?.suspendedStaff || 0} suspended`}
            icon={<ActiveIcon />}
            variant="success"
            loading={loading}
          />
          
          <DashboardSummaryCard
            title="Field Agents"
            value={staffStats?.fieldAgents || 0}
            subtitle="In the field"
            icon={<AgentIcon />}
            variant="primary"
            loading={loading}
          />
          
          <DashboardSummaryCard
            title="Clerks"
            value={staffStats?.clerks || 0}
            subtitle="Office staff"
            icon={<ClerkIcon />}
            variant="secondary"
            loading={loading}
          />
          
          <DashboardSummaryCard
            title="Pending"
            value={staffStats?.pendingStaff || 0}
            subtitle="Awaiting onboarding"
            icon={<PendingIcon />}
            variant="warning"
            loading={loading}
          />
        </div>

        {/* Staff Performance Overview */}
        {staffStats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Score</span>
                  <span className="text-sm font-medium text-gray-900">
                    {staffStats.averagePerformanceScore?.toFixed(1) || 'N/A'}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Recent Hires</span>
                  <span className="text-sm font-medium text-gray-900">
                    {staffStats.recentHires || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Location Coverage</span>
                  <span className="text-sm font-medium text-gray-900">
                    {staffStats.locationCoverage || 0}%
                  </span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                fullWidth 
                className="mt-4"
                leftIcon={<PerformanceIcon />}
              >
                View Detailed Analytics
              </Button>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
              <div className="space-y-3">
                {staffStats.topPerformers?.length ? (
                  staffStats.topPerformers.slice(0, 3).map((performer, index) => (
                    <div key={performer.id} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-500 mr-2">
                          #{index + 1}
                        </span>
                        <span className="text-sm text-gray-900">{performer.name}</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        {performer.score}%
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No performance data available yet
                  </p>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Distribution</h3>
              {roleSummary ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Field Agents</span>
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">{roleSummary.fieldAgents}</span>
                      <span className="text-gray-500 ml-1">
                        ({roleSummary.breakdown.field_agent.active} active)
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Clerks</span>
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">{roleSummary.clerks}</span>
                      <span className="text-gray-500 ml-1">
                        ({roleSummary.breakdown.clerk.active} active)
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="text-sm font-medium text-yellow-600">
                      {roleSummary.pendingStaff}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading...</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" size="sm" fullWidth onClick={handleCreateStaff}>
              Add Field Agent
            </Button>
            <Button variant="outline" size="sm" fullWidth onClick={handleCreateStaff}>
              Add Clerk
            </Button>
            <Button variant="outline" size="sm" fullWidth>
              Bulk Operations
            </Button>
            <Button variant="outline" size="sm" fullWidth>
              Export Staff Report
            </Button>
          </div>
        </Card>

        {/* Staff Management Table */}
        <StaffTable
          companyId={companyId}
          onStaffSelect={handleStaffSelect}
          onCreateStaff={handleCreateStaff}
          onEditStaff={handleEditStaff}
          onPerformanceView={handlePerformanceView}
        />

        {/* Selected Staff Preview */}
        {selectedStaff && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Staff Details: {staffService.getStaffDisplayName(selectedStaff)}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Role</p>
                <p className="text-sm text-gray-900 capitalize">
                  {selectedStaff.role.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="text-sm text-gray-900 capitalize">{selectedStaff.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Agent Code</p>
                <p className="text-sm text-gray-900">{selectedStaff.agentCode || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Location</p>
                <p className="text-sm text-gray-900">
                  {staffService.formatLocation(selectedStaff.location)}
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="primary" size="sm">
                View Full Profile
              </Button>
              <Button variant="outline" size="sm">
                Edit Staff
              </Button>
              <Button variant="outline" size="sm">
                View Performance
              </Button>
              <Button variant="outline" size="sm">
                Reset Password
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedStaff(null)}>
                Close
              </Button>
            </div>
          </Card>
        )}
      </div>
    </PermissionGuard>
  );
}