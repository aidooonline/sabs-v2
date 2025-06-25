'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { 
  ShowForAdmins, 
  ShowForClerks, 
  ShowForAuthenticated 
} from '@/components/auth/PermissionGuard';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { TimeFilter, TimeRange } from '../../components/atoms/TimeFilter';
import { DashboardSummaryCard } from '../../components/molecules/DashboardSummaryCard';
import { dashboardService, DashboardMetrics } from '../../services/api/dashboardService';

// Mock icons using SVG components
const TransactionIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const UsersIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const AgentsIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const RevenueIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ComplianceIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RefreshIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export default function DashboardPage() {
  const { user, getFullName } = useAuth();

  // Dashboard state
  const [timeRange, setTimeRange] = useState<TimeRange>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
    endDate: new Date(),
    label: 'This Month'
  });
  
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dashboardData = await dashboardService.getDashboardOverview({
        timeRange,
        companyId: user?.companyId,
      });
      
      setMetrics(dashboardData.metrics);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      
      // Fallback to mock data for demo purposes
      setMetrics({
        transactions: {
          total: 1250,
          volume: 2500000,
          change: 12.5,
          period: 'last month'
        },
        customers: {
          total: 8450,
          active: 6230,
          change: 8.2,
          period: 'last month'
        },
        agents: {
          total: 45,
          active: 38,
          change: -2.1,
          period: 'last month'
        },
        revenue: {
          total: 125000,
          change: 15.8,
          period: 'last month'
        },
        compliance: {
          score: 88.5,
          alerts: 3,
          violations: 1,
          lastAssessment: new Date().toISOString()
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when time range changes
  useEffect(() => {
    loadDashboardData();
  }, [timeRange, user]);

  const handleRefresh = () => {
    loadDashboardData();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {getFullName()}
            </h1>
            <p className="text-gray-600 mt-1">
              {user?.role && (
                <span className="capitalize">{user.role.replace('_', ' ')}</span>
              )} Dashboard - Sabs v2
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <TimeFilter
              value={timeRange}
              onChange={setTimeRange}
              showCompare={false}
              className="min-w-[240px]"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              loading={loading}
              leftIcon={<RefreshIcon />}
            >
              Refresh
            </Button>
          </div>
        </div>
        
        {lastRefresh && (
          <p className="text-xs text-gray-500 mt-2">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardSummaryCard
          title="Total Transactions"
          value={metrics?.transactions.total || 0}
          subtitle={`Volume: ${formatCurrency(metrics?.transactions.volume || 0)}`}
          change={{
            value: metrics?.transactions.change || 0,
            percentage: true,
            period: metrics?.transactions.period || 'last month'
          }}
          icon={<TransactionIcon />}
          variant="info"
          loading={loading}
        />
        
        <DashboardSummaryCard
          title="Active Customers"
          value={metrics?.customers.active || 0}
          subtitle={`Total: ${metrics?.customers.total.toLocaleString() || 0}`}
          change={{
            value: metrics?.customers.change || 0,
            percentage: true,
            period: metrics?.customers.period || 'last month'
          }}
          icon={<UsersIcon />}
          variant="success"
          loading={loading}
        />
        
        <DashboardSummaryCard
          title="Active Agents"
          value={metrics?.agents.active || 0}
          subtitle={`Total: ${metrics?.agents.total || 0}`}
          change={{
            value: metrics?.agents.change || 0,
            percentage: true,
            period: metrics?.agents.period || 'last month'
          }}
          icon={<AgentsIcon />}
          variant={metrics?.agents.change && metrics.agents.change < 0 ? 'warning' : 'default'}
          loading={loading}
        />
        
        <DashboardSummaryCard
          title="Revenue"
          value={formatCurrency(metrics?.revenue.total || 0)}
          change={{
            value: metrics?.revenue.change || 0,
            percentage: true,
            period: metrics?.revenue.period || 'last month'
          }}
          icon={<RevenueIcon />}
          variant="success"
          loading={loading}
        />
      </div>

      {/* Compliance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <DashboardSummaryCard
          title="Compliance Score"
          value={`${metrics?.compliance.score || 0}%`}
          subtitle={`${metrics?.compliance.violations || 0} violations, ${metrics?.compliance.alerts || 0} alerts`}
          icon={<ComplianceIcon />}
          variant={
            (metrics?.compliance.score || 0) >= 90 ? 'success' :
            (metrics?.compliance.score || 0) >= 75 ? 'warning' : 'danger'
          }
          loading={loading}
          onClick={() => window.location.href = '/dashboard/compliance'}
        />

        {/* Quick Actions */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ShowForClerks>
              <Link href="/dashboard/transactions">
                <Button variant="outline" size="sm" fullWidth>
                  View Transactions
                </Button>
              </Link>
              <Link href="/dashboard/customers">
                <Button variant="outline" size="sm" fullWidth>
                  Manage Customers
                </Button>
              </Link>
            </ShowForClerks>
            
            <ShowForAdmins>
              <Link href="/dashboard/admin">
                <Button variant="primary" size="sm" fullWidth>
                  Admin Panel
                </Button>
              </Link>
              <Link href="/dashboard/agents">
                <Button variant="outline" size="sm" fullWidth>
                  Manage Agents
                </Button>
              </Link>
              <Link href="/dashboard/reports">
                <Button variant="outline" size="sm" fullWidth>
                  View Reports
                </Button>
              </Link>
            </ShowForAdmins>
            
            <ShowForAuthenticated>
              <Link href="/dashboard/profile">
                <Button variant="ghost" size="sm" fullWidth>
                  My Profile
                </Button>
              </Link>
            </ShowForAuthenticated>
          </div>
        </Card>
      </div>

      {/* Role-specific sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            System Status
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">API Health</span>
              <span className="text-sm font-medium text-green-600">Operational</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Database</span>
              <span className="text-sm font-medium text-green-600">Healthy</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Payment Gateway</span>
              <span className="text-sm font-medium text-green-600">Connected</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">SMS Service</span>
              <span className="text-sm font-medium text-yellow-600">Limited</span>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">New customer registration</span>
              <span className="text-xs text-gray-400 ml-auto">2 min ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Transaction processed</span>
              <span className="text-xs text-gray-400 ml-auto">5 min ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Compliance alert resolved</span>
              <span className="text-xs text-gray-400 ml-auto">1 hour ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Agent performance report</span>
              <span className="text-xs text-gray-400 ml-auto">3 hours ago</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}