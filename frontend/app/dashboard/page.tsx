'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ShowForAuthenticated } from '@/components/auth/PermissionGuard';
import { 
  useGetDashboardSummaryQuery,
  useGetAccountsQuery,
  useSearchTransactionsQuery,
  useGetQuickActionsQuery 
} from '@/store/api/dashboardApi';
import { BalanceCard, SpendingCard, AccountsCard, AlertsCard } from '@/components/dashboard/SummaryCards';
import { AccountCard } from '@/components/dashboard/AccountCards/AccountCard';
import { QuickActionBar } from '@/components/dashboard/QuickActions/QuickActionBar';
import { RecentTransactions } from '@/components/dashboard/Transactions/RecentTransactions';
import { SkeletonCard } from '@/components/dashboard/LoadingStates/SkeletonCard';
import { ErrorBoundary, ApiErrorCard } from '@/components/dashboard/ErrorStates/ErrorBoundary';

export default function DashboardPage() {
  const { user, getFullName } = useAuth();

  // Fetch dashboard data using RTK Query hooks
  const { 
    data: dashboardSummary, 
    isLoading: summaryLoading, 
    error: summaryError 
  } = useGetDashboardSummaryQuery({
    includeInsights: true,
    includeAlerts: true,
    transactionLimit: 10,
    period: 'month'
  });

  const { 
    data: accounts, 
    isLoading: accountsLoading, 
    error: accountsError 
  } = useGetAccountsQuery();

  const { 
    data: recentTransactions, 
    isLoading: transactionsLoading, 
    error: transactionsError 
  } = useSearchTransactionsQuery({
    customerId: user?.id || '',
    limit: 5,
    page: 1
  });

  const { 
    data: quickActions, 
    isLoading: actionsLoading 
  } = useGetQuickActionsQuery();

  // Show loading state for critical data
  if (summaryLoading || accountsLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded-md w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded-md w-48 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SkeletonCard />
          </div>
          <div>
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  // Show error state for critical failures
  if (summaryError || accountsError) {
    return (
      <ErrorBoundary>
        <ApiErrorCard 
          error={{
            status: (summaryError as any)?.status || (accountsError as any)?.status || 500,
            message: (summaryError as any)?.message || (accountsError as any)?.message || 'Failed to load dashboard data'
          }}
          onRetry={() => window.location.reload()} 
        />
      </ErrorBoundary>
    );
  }

  return (
    <ShowForAuthenticated>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {getFullName()}
          </h1>
          <p className="text-gray-600">
            Here&apos;s your financial overview for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Summary Cards Section - AC1 Requirement */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <BalanceCard 
            totalBalance={dashboardSummary?.totalBalance || 0}
            isLoading={summaryLoading}
          />
          <SpendingCard 
            monthlySpending={dashboardSummary?.monthlySpending || 0}
            isLoading={summaryLoading}
          />
          <AccountsCard 
            totalAccounts={dashboardSummary?.totalAccounts || 0}
            isLoading={accountsLoading}
          />
          <AlertsCard 
            activeAlerts={dashboardSummary?.alerts?.filter(alert => alert.isActive).length || 0}
            alerts={dashboardSummary?.alerts?.map(alert => ({
              id: alert.id,
              type: alert.type,
              severity: alert.severity,
              message: alert.message
            })) || []}
            criticalAlerts={dashboardSummary?.alerts?.filter(alert => alert.severity === 'critical' && alert.isActive).length || 0}
            isLoading={summaryLoading}
          />
        </div>

        {/* Quick Actions Bar - AC1 Requirement */}
        <div className="mb-8">
          <QuickActionBar 
            actions={quickActions || []}
            isLoading={actionsLoading}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Account Cards & Recent Transactions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Cards - AC1 Requirement */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Accounts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accountsLoading ? (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                ) : accounts?.slice(0, 4).map((account) => (
                  <AccountCard 
                    key={account.id}
                    account={{
                      id: account.id,
                      accountName: account.accountName,
                      accountNumber: account.accountNumber,
                      accountType: account.accountType,
                      currentBalance: account.currentBalance,
                      availableBalance: account.availableBalance,
                      currency: account.currency,
                      status: account.status.toLowerCase() as 'active' | 'inactive' | 'suspended' | 'closed',
                      isDefault: account.isDefault,
                      lastTransactionAt: account.lastTransactionAt
                    }}
                    onViewDetails={(accountId) => {
                      window.location.href = `/dashboard/overview/account/${accountId}`;
                    }}
                  />
                ))}
              </div>
              
              {accounts && accounts.length > 4 && (
                <div className="mt-4 text-center">
                  <button 
                    className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
                    onClick={() => window.location.href = '/dashboard/overview/accounts'}
                  >
                    View All Accounts ({accounts.length})
                  </button>
                </div>
              )}
            </div>

            {/* Recent Transactions - AC1 Requirement */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Transactions</h2>
              <RecentTransactions 
                transactions={recentTransactions?.transactions || dashboardSummary?.recentTransactions || []}
                loading={transactionsLoading}
                error={transactionsError}
                onViewAll={() => window.location.href = '/dashboard/transactions'}
              />
            </div>
          </div>

          {/* Right Column - Insights & Alerts */}
          <div className="space-y-6">
            {/* Financial Insights */}
            {dashboardSummary?.insights && dashboardSummary.insights.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Insights</h3>
                <div className="space-y-4">
                  {dashboardSummary.insights.slice(0, 3).map((insight) => (
                    <div key={insight.id} className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium text-gray-900">{insight.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                      {insight.actionable && insight.recommendations && (
                        <div className="mt-2">
                          <p className="text-xs text-blue-600 font-medium">Recommended Action:</p>
                          <p className="text-xs text-gray-600">{insight.recommendations[0]}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button 
                  className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => window.location.href = '/dashboard/insights'}
                >
                  View All Insights
                </button>
              </div>
            )}

            {/* Active Alerts */}
            {dashboardSummary?.alerts && dashboardSummary.alerts.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h3>
                <div className="space-y-3">
                  {dashboardSummary.alerts.slice(0, 3).map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`p-3 rounded-lg border-l-4 ${
                        alert.severity === 'critical' 
                          ? 'border-red-500 bg-red-50' 
                          : alert.severity === 'high'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-yellow-500 bg-yellow-50'
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
                <button 
                  className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => window.location.href = '/dashboard/alerts'}
                >
                  Manage All Alerts
                </button>
              </div>
            )}

            {/* Performance Stats */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Income</span>
                  <span className="font-semibold text-green-600">
                    +GHS {(dashboardSummary?.monthlyIncome || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Spending</span>
                  <span className="font-semibold text-red-600">
                    -GHS {(dashboardSummary?.monthlySpending || 0).toLocaleString()}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-medium text-gray-900">Net</span>
                  <span className={`font-bold ${
                    (dashboardSummary?.monthlyIncome || 0) - (dashboardSummary?.monthlySpending || 0) >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {(dashboardSummary?.monthlyIncome || 0) - (dashboardSummary?.monthlySpending || 0) >= 0 ? '+' : ''}
                    GHS {((dashboardSummary?.monthlyIncome || 0) - (dashboardSummary?.monthlySpending || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
          Last updated: {dashboardSummary?.lastUpdated ? new Date(dashboardSummary.lastUpdated).toLocaleString() : 'Just now'}
        </div>
      </div>
    </ShowForAuthenticated>
  );
}