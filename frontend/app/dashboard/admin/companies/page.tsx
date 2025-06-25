'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ShowForSuperAdmin } from '@/components/auth/PermissionGuard';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { CompanyTable } from '@/components/organisms/CompanyTable';
import { DashboardSummaryCard } from '@/components/molecules/DashboardSummaryCard';
import { 
  Company, 
  DashboardSummary, 
  LowCreditWarning,
  companyService 
} from '@/services/api/companyService';

// Icons
const CompanyIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const ActiveIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrialIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const WarningIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L5.098 18.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

export default function CompaniesPage() {
  const { user } = useAuth();
  
  // State
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [lowCreditWarnings, setLowCreditWarnings] = useState<LowCreditWarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [summary, warnings] = await Promise.all([
        companyService.getDashboardSummary(),
        companyService.getLowCreditWarnings(),
      ]);
      
      setDashboardSummary(summary);
      setLowCreditWarnings(warnings);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Calculate conversion rate as percentage
  const conversionRate = dashboardSummary?.conversionRate 
    ? `${parseFloat(dashboardSummary.conversionRate).toFixed(1)}%`
    : '0%';

  // Handle company selection
  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    // Navigate to company details page (future implementation)
    console.log('View company:', company);
  };

  // Handle company creation
  const handleCreateCompany = () => {
    setShowCreateForm(true);
    // Open company creation modal/form (future implementation)
    console.log('Create new company');
  };

  // Handle company editing
  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    // Open company edit modal/form (future implementation)
    console.log('Edit company:', company);
  };

  return (
    <ShowForSuperAdmin
      fallback={
        <div className="p-6">
          <Card className="p-8 text-center">
            <h1 className="text-xl font-bold text-red-600 mb-2">Access Denied</h1>
            <p className="text-gray-600">
              This page is only accessible to Super Administrators.
            </p>
          </Card>
        </div>
      }
    >
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Company Management</h1>
            <p className="text-gray-600 mt-1">
              Manage agent companies and their service credits
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              variant="primary"
              onClick={handleCreateCompany}
              leftIcon={<CompanyIcon />}
            >
              Add New Company
            </Button>
          </div>
        </div>

        {/* Dashboard Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardSummaryCard
            title="Total Companies"
            value={dashboardSummary?.totalCompanies || 0}
            subtitle="All registered companies"
            icon={<CompanyIcon />}
            variant="info"
            loading={loading}
          />
          
          <DashboardSummaryCard
            title="Active Companies"
            value={dashboardSummary?.activeCompanies || 0}
            subtitle={`${dashboardSummary?.suspendedCompanies || 0} suspended`}
            icon={<ActiveIcon />}
            variant="success"
            loading={loading}
          />
          
          <DashboardSummaryCard
            title="Trial Companies"
            value={dashboardSummary?.trialCompanies || 0}
            subtitle={`${conversionRate} conversion rate`}
            icon={<TrialIcon />}
            variant="warning"
            loading={loading}
          />
          
          <DashboardSummaryCard
            title="Low Credit Alerts"
            value={dashboardSummary?.lowCreditCompanies || 0}
            subtitle={`${lowCreditWarnings.length} warnings`}
            icon={<WarningIcon />}
            variant={dashboardSummary?.lowCreditCompanies ? 'danger' : 'success'}
            loading={loading}
          />
        </div>

        {/* Low Credit Warnings */}
        {lowCreditWarnings.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Low Credit Warnings
            </h3>
            <div className="space-y-3">
              {lowCreditWarnings.slice(0, 5).map((warning) => (
                <div 
                  key={`${warning.companyId}-${warning.serviceType}`}
                  className={`p-3 rounded-lg border ${
                    warning.severity === 'critical'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{warning.companyName}</p>
                      <p className="text-sm opacity-75">
                        {warning.serviceType.toUpperCase()} Credits: {warning.currentCredits} 
                        (threshold: {warning.threshold})
                      </p>
                    </div>
                    <Button
                      variant={warning.severity === 'critical' ? 'danger' : 'warning'}
                      size="sm"
                    >
                      Add Credits
                    </Button>
                  </div>
                </div>
              ))}
              {lowCreditWarnings.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  + {lowCreditWarnings.length - 5} more warnings
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button variant="outline" size="sm" fullWidth onClick={handleCreateCompany}>
                Create New Company
              </Button>
              <Button variant="outline" size="sm" fullWidth>
                Bulk Credit Allocation
              </Button>
              <Button variant="outline" size="sm" fullWidth>
                Export Company Report
              </Button>
              <Button variant="outline" size="sm" fullWidth>
                View Usage Analytics
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Signups</h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {dashboardSummary?.recentSignups || 0}
              </div>
              <p className="text-sm text-gray-500 mt-1">in the last 30 days</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Company Service</span>
                <span className="text-sm font-medium text-green-600">Operational</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Credit System</span>
                <span className="text-sm font-medium text-green-600">Healthy</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">SMS Provider</span>
                <span className="text-sm font-medium text-green-600">Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">AI Service</span>
                <span className="text-sm font-medium text-green-600">Available</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Company Management Table */}
        <CompanyTable
          onCompanySelect={handleCompanySelect}
          onCreateCompany={handleCreateCompany}
          onEditCompany={handleEditCompany}
        />

        {/* Selected Company Preview */}
        {selectedCompany && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Company Details: {selectedCompany.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="text-sm text-gray-900 capitalize">{selectedCompany.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Plan</p>
                <p className="text-sm text-gray-900 capitalize">
                  {selectedCompany.subscriptionPlan.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">SMS Credits</p>
                <p className="text-sm text-gray-900">{selectedCompany.smsCredits.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">AI Credits</p>
                <p className="text-sm text-gray-900">{selectedCompany.aiCredits.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="primary" size="sm">
                View Full Details
              </Button>
              <Button variant="outline" size="sm">
                Add Credits
              </Button>
              <Button variant="outline" size="sm">
                View Usage
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCompany(null)}>
                Close
              </Button>
            </div>
          </Card>
        )}
      </div>
    </ShowForSuperAdmin>
  );
}