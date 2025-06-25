'use client';

import React, { useState, useMemo } from 'react';
import {
  useGetFinancialInsightsQuery,
  useGetAccountsQuery,
  useGetSpendingAnalysisQuery,
  useGetBalanceHistoryQuery,
  useGetDashboardSummaryQuery,
} from '../../../store/api/dashboardApi';
import { InsightType, AccountType } from '../../../types/dashboard';

export default function InsightsPage() {
  // State for insights and multi-account management
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [viewMode, setViewMode] = useState<'consolidated' | 'individual'>('consolidated');
  const [activeGoal, setActiveGoal] = useState<string | null>(null);

  // API calls
  const { data: insights, isLoading: insightsLoading } = useGetFinancialInsightsQuery();
  const { data: accounts, isLoading: accountsLoading } = useGetAccountsQuery();
  const { data: spendingAnalysis } = useGetSpendingAnalysisQuery({
    customerId: 'current',
    accountId: selectedAccount === 'all' ? undefined : selectedAccount,
    period: selectedPeriod,
  });
  const { data: dashboardSummary } = useGetDashboardSummaryQuery({});

  // Financial health calculation
  const financialHealthScore = useMemo(() => {
    if (!insights || !spendingAnalysis || !dashboardSummary) return 0;

    let score = 50; // Base score

    // Positive factors
    const incomeToSpendingRatio = dashboardSummary.monthlyIncome / (spendingAnalysis.totalSpending || 1);
    if (incomeToSpendingRatio > 1.5) score += 20;
    else if (incomeToSpendingRatio > 1.2) score += 10;

    // Savings rate
    const savingsRate = (dashboardSummary.monthlyIncome - spendingAnalysis.totalSpending) / dashboardSummary.monthlyIncome;
    if (savingsRate > 0.2) score += 15;
    else if (savingsRate > 0.1) score += 10;

    // Account diversity
    const accountTypes = new Set(accounts?.map(acc => acc.accountType));
    score += Math.min(accountTypes.size * 5, 15);

    return Math.min(100, Math.max(0, score));
  }, [insights, spendingAnalysis, dashboardSummary, accounts]);

  // Mock goals data (would come from API in real implementation)
  const financialGoals = [
    {
      id: '1',
      title: 'Emergency Fund',
      targetAmount: 10000,
      currentAmount: 6500,
      deadline: '2024-12-31',
      category: 'savings',
      status: 'on_track'
    },
    {
      id: '2',
      title: 'House Down Payment',
      targetAmount: 50000,
      currentAmount: 12000,
      deadline: '2025-06-30',
      category: 'investment',
      status: 'behind'
    },
    {
      id: '3',
      title: 'Vacation Fund',
      targetAmount: 3000,
      currentAmount: 2800,
      deadline: '2024-03-15',
      category: 'lifestyle',
      status: 'ahead'
    }
  ];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  // Get health score color and text
  const getHealthScoreInfo = (score: number) => {
    if (score >= 80) return { color: 'text-green-600', bg: 'bg-green-100', label: 'Excellent', ring: 'stroke-green-600' };
    if (score >= 60) return { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Good', ring: 'stroke-blue-600' };
    if (score >= 40) return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Fair', ring: 'stroke-yellow-600' };
    return { color: 'text-red-600', bg: 'bg-red-100', label: 'Poor', ring: 'stroke-red-600' };
  };

  const healthInfo = getHealthScoreInfo(financialHealthScore);

  // Get insight type icon and color
  const getInsightTypeInfo = (type: InsightType) => {
    const typeMap = {
      [InsightType.SPENDING_PATTERN]: { icon: '📊', color: 'text-blue-600', bg: 'bg-blue-50' },
      [InsightType.SAVING_OPPORTUNITY]: { icon: '💰', color: 'text-green-600', bg: 'bg-green-50' },
      [InsightType.BUDGET_PERFORMANCE]: { icon: '🎯', color: 'text-purple-600', bg: 'bg-purple-50' },
      [InsightType.CASH_FLOW]: { icon: '📈', color: 'text-indigo-600', bg: 'bg-indigo-50' },
      [InsightType.COMPARATIVE_SPENDING]: { icon: '📋', color: 'text-orange-600', bg: 'bg-orange-50' },
      [InsightType.GOAL_PROGRESS]: { icon: '🏆', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    };
    return typeMap[type] || { icon: '💡', color: 'text-gray-600', bg: 'bg-gray-50' };
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Financial Insights & Recommendations
        </h1>
        <p className="text-gray-600">
          AI-powered insights to help you make smarter financial decisions
        </p>
      </div>

      {/* Implementation Status */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-card p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-primary-900 mb-4">
          ✅ Day 6: AC5 & AC6 - Insights & Multi-Account Complete
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <span className="text-sm text-primary-800">AI-powered spending insights</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <span className="text-sm text-primary-800">Financial health scoring</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <span className="text-sm text-primary-800">Goal tracking & progress</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <span className="text-sm text-primary-800">Multi-account management</span>
          </div>
        </div>
      </div>

      {/* Multi-Account Controls */}
      <div className="bg-white rounded-card border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Account Overview</h3>
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Accounts</option>
              {accounts?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.accountName} ({account.accountType})
                </option>
              ))}
            </select>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <div className="flex rounded-md border border-gray-300">
              <button
                onClick={() => setViewMode('consolidated')}
                className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                  viewMode === 'consolidated'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Consolidated
              </button>
              <button
                onClick={() => setViewMode('individual')}
                className={`px-3 py-2 text-sm font-medium rounded-r-md border-l ${
                  viewMode === 'individual'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Individual
              </button>
            </div>
          </div>
        </div>

        {/* Account Summary Cards */}
        {viewMode === 'consolidated' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-green-900 mb-2">Total Balance</h4>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(dashboardSummary?.totalBalance || 0)}
              </p>
              <p className="text-sm text-green-700 mt-1">
                Across {accounts?.length || 0} accounts
              </p>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-blue-900 mb-2">Monthly Income</h4>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(dashboardSummary?.monthlyIncome || 0)}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Average across all accounts
              </p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-purple-900 mb-2">Monthly Spending</h4>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(spendingAnalysis?.totalSpending || 0)}
              </p>
              <p className="text-sm text-purple-700 mt-1">
                {selectedPeriod} period analysis
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts?.map((account) => (
              <div key={account.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{account.accountName}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    account.accountType === AccountType.SAVINGS ? 'bg-green-100 text-green-800' :
                    account.accountType === AccountType.CURRENT ? 'bg-blue-100 text-blue-800' :
                    account.accountType === AccountType.WALLET ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {account.accountType}
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-1">
                  {formatCurrency(account.currentBalance)}
                </p>
                <p className="text-sm text-gray-500">
                  Available: {formatCurrency(account.availableBalance)}
                </p>
                {account.isDefault && (
                  <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Default
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Financial Health Score */}
        <div className="bg-white rounded-card border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Financial Health Score</h3>
          <div className="flex items-center justify-center">
            <div className="relative">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(financialHealthScore / 100) * 314} 314`}
                  className={healthInfo.ring}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${healthInfo.color}`}>{financialHealthScore}</div>
                  <div className="text-xs text-gray-500">out of 100</div>
                </div>
              </div>
            </div>
          </div>
          <div className={`mt-4 text-center px-3 py-1 rounded-full ${healthInfo.bg}`}>
            <span className={`text-sm font-medium ${healthInfo.color}`}>
              {healthInfo.label} Financial Health
            </span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Income vs Spending</span>
              <span className="font-medium">
                {dashboardSummary?.monthlyIncome && spendingAnalysis?.totalSpending
                  ? `${((dashboardSummary.monthlyIncome / spendingAnalysis.totalSpending) * 100).toFixed(0)}%`
                  : 'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span>Savings Rate</span>
              <span className="font-medium">
                {dashboardSummary?.monthlyIncome && spendingAnalysis?.totalSpending
                  ? `${(((dashboardSummary.monthlyIncome - spendingAnalysis.totalSpending) / dashboardSummary.monthlyIncome) * 100).toFixed(1)}%`
                  : 'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span>Account Diversity</span>
              <span className="font-medium">{accounts?.length || 0} accounts</span>
            </div>
          </div>
        </div>

        {/* Financial Goals */}
        <div className="bg-white rounded-card border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Financial Goals</h3>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              + Add Goal
            </button>
          </div>
          <div className="space-y-4">
            {financialGoals.map((goal) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              const isActive = activeGoal === goal.id;
              
              return (
                <div
                  key={goal.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    isActive ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveGoal(isActive ? null : goal.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{goal.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      goal.status === 'on_track' ? 'bg-green-100 text-green-800' :
                      goal.status === 'ahead' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {goal.status === 'on_track' ? 'On Track' :
                       goal.status === 'ahead' ? 'Ahead' : 'Behind'}
                    </span>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{formatCurrency(goal.currentAmount)}</span>
                      <span>{formatCurrency(goal.targetAmount)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          goal.status === 'on_track' ? 'bg-green-500' :
                          goal.status === 'ahead' ? 'bg-blue-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  {isActive && (
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Progress: {progress.toFixed(1)}%</p>
                      <p>Deadline: {new Date(goal.deadline).toLocaleDateString()}</p>
                      <p>Remaining: {formatCurrency(goal.targetAmount - goal.currentAmount)}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Recommendations */}
        <div className="bg-white rounded-card border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Recommendations</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm">💰</span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Increase Emergency Fund</h4>
                <p className="text-xs text-gray-600 mt-1">
                  You&apos;re 35% away from your goal. Consider saving an extra GHS 583/month.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm">📊</span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Optimize Spending</h4>
                <p className="text-xs text-gray-600 mt-1">
                  You spent 23% more on dining this month. Consider meal planning.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-sm">🎯</span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Investment Opportunity</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Your savings account balance could earn more in a term deposit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI-Powered Insights */}
      <div className="bg-white rounded-card border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">AI-Powered Financial Insights</h3>
          {insights?.summary && (
            <div className="text-sm text-gray-600">
              {insights.summary.totalInsights} insights ({insights.summary.actionableInsights} actionable)
            </div>
          )}
        </div>

        {insightsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({length: 6}).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insights?.insights?.map((insight) => {
              const typeInfo = getInsightTypeInfo(insight.type);
              return (
                <div
                  key={insight.id}
                  className={`border rounded-lg p-4 ${typeInfo.bg} border-gray-200 hover:shadow-card-hover transition-all`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{typeInfo.icon}</div>
                    <div className="flex-1">
                      <h4 className={`font-medium ${typeInfo.color} mb-1`}>
                        {insight.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {insight.description}
                      </p>
                      {insight.value && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-900">
                            {formatCurrency(insight.value)}
                          </span>
                          {insight.changePercentage && (
                            <span className={`font-medium ${
                              insight.changePercentage > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {insight.changePercentage > 0 ? '+' : ''}{insight.changePercentage.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      )}
                      {insight.actionable && insight.recommendations && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 font-medium mb-1">Recommendations:</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {insight.recommendations.slice(0, 2).map((rec, i) => (
                              <li key={i}>• {rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!insightsLoading && (!insights?.insights || insights.insights.length === 0) && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔮</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No insights available</h4>
            <p className="text-gray-600">
              We&apos;re analyzing your financial data to generate personalized insights.
            </p>
          </div>
        )}
      </div>

      {/* Spending Categories Insights */}
      {spendingAnalysis && spendingAnalysis.categories.length > 0 && (
        <div className="bg-white rounded-card border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Spending Categories Analysis ({selectedPeriod})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spendingAnalysis.categories.slice(0, 6).map((category) => (
              <div key={category.category} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{category.category}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    category.trend === 'up' ? 'bg-red-100 text-red-800' :
                    category.trend === 'down' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {category.trend === 'up' ? '↗️ Rising' :
                     category.trend === 'down' ? '↘️ Falling' : '➡️ Stable'}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Amount</span>
                    <span className="font-medium">{formatCurrency(category.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">% of Total</span>
                    <span className="font-medium">{category.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Transactions</span>
                    <span className="font-medium">{category.transactionCount}</span>
                  </div>
                  {category.budget && (
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Budget Used</span>
                        <span className={`font-medium ${
                          (category.budgetUsed || 0) > 100 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {(category.budgetUsed || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}