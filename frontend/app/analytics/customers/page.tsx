'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  useGetCustomerLifecycleAnalyticsQuery,
  useGetCohortAnalysisQuery,
  useGetCustomerRetentionQuery,
  useGetPredictiveInsightsQuery
} from '../../../store/api/analyticsApi';
import { formatCurrency, formatNumber, formatPercentage } from '../../../utils/formatters';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  Target,
  Heart,
  Brain,
  Zap,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Eye,
  Settings
} from 'lucide-react';
import { MetricCard, ComparisonMetricCard } from '../../components/MetricCard';
import { ChartContainer, ChartContainerWithActions } from '../../components/ChartContainer';
import { QuickFilters } from '../../components/QuickFilters';
import { CustomerLifecycleChart } from '../../components/charts/CustomerLifecycleChart';
import { CohortAnalysisChart } from '../../components/charts/CohortAnalysisChart';
import { RetentionChart } from '../../components/charts/RetentionChart';
import { PredictiveInsightsChart } from '../../components/charts/PredictiveInsightsChart';
import { CustomerJourneyFlow } from '../../components/CustomerJourneyFlow';
import { LifecycleStageBreakdown } from '../../components/LifecycleStageBreakdown';
import type { AnalyticsTimeRange, AnalyticsFilters } from '../../../types/analytics';

export default function CustomerLifecycleAnalyticsPage() {
  // State management
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('30d');
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'lifecycle' | 'retention' | 'predictive'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);

  // API queries
  const {
    data: lifecycleData,
    isLoading,
    isFetching,
    error,
    refetch
  } = useGetCustomerLifecycleAnalyticsQuery({ timeRange, filters }, {
    refetchOnMountOrArgChange: true,
    pollingInterval: autoRefresh ? 300000 : 0, // 5-minute refresh for lifecycle data
  });

  const {
    data: cohortData,
    isLoading: cohortLoading
  } = useGetCohortAnalysisQuery({ timeRange, filters });

  const {
    data: retentionData,
    isLoading: retentionLoading
  } = useGetCustomerRetentionQuery({ timeRange, filters });

  const {
    data: predictiveData,
    isLoading: predictiveLoading
  } = useGetPredictiveInsightsQuery({ timeRange, filters });

  // Handle filter changes
  const handleTimeRangeChange = (newTimeRange: AnalyticsTimeRange) => {
    setTimeRange(newTimeRange);
  };

  const handleFiltersChange = (newFilters: AnalyticsFilters) => {
    setFilters(newFilters);
  };

  // Export functionality
  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log('Exporting customer lifecycle analytics as:', format);
    // Implementation for customer lifecycle analytics export
  };

  // Manual refresh
  const handleRefresh = () => {
    refetch();
  };

  // Computed metrics
  const metrics = useMemo(() => {
    if (!lifecycleData) return null;

    return {
      overview: {
        totalCustomers: lifecycleData.totalCustomers,
        newCustomers: lifecycleData.newCustomers,
        activeCustomers: lifecycleData.activeCustomers,
        churnedCustomers: lifecycleData.churnedCustomers,
        reactivatedCustomers: lifecycleData.reactivatedCustomers,
        averageLifetimeValue: lifecycleData.averageLifetimeValue,
        retentionRate: lifecycleData.retentionRate,
        churnRate: lifecycleData.churnRate
      },
      trends: {
        customerGrowth: lifecycleData.customerGrowthRate,
        activationRate: lifecycleData.activationRate,
        retentionTrend: lifecycleData.retentionTrend,
        churnTrend: lifecycleData.churnTrend,
        clvTrend: lifecycleData.clvTrend
      },
      lifecycle: {
        onboarding: lifecycleData.lifecycleStages?.onboarding || 0,
        active: lifecycleData.lifecycleStages?.active || 0,
        engaged: lifecycleData.lifecycleStages?.engaged || 0,
        atRisk: lifecycleData.lifecycleStages?.atRisk || 0,
        churned: lifecycleData.lifecycleStages?.churned || 0
      }
    };
  }, [lifecycleData]);

  // Predictive insights summary
  const insights = useMemo(() => {
    if (!predictiveData) return [];

    return [
      {
        type: 'churn_risk',
        title: 'High Churn Risk Customers',
        value: predictiveData.highChurnRiskCustomers || 0,
        trend: predictiveData.churnRiskTrend || 0,
        severity: 'high',
        action: 'Implement retention campaigns'
      },
      {
        type: 'upsell_opportunity',
        title: 'Upsell Opportunities',
        value: predictiveData.upsellOpportunities || 0,
        trend: predictiveData.upsellTrend || 0,
        severity: 'medium',
        action: 'Target with premium offerings'
      },
      {
        type: 'reactivation_potential',
        title: 'Reactivation Candidates',
        value: predictiveData.reactivationCandidates || 0,
        trend: predictiveData.reactivationTrend || 0,
        severity: 'low',
        action: 'Launch win-back campaigns'
      }
    ];
  }, [predictiveData]);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Customer Analytics
          </h2>
          <p className="text-gray-600 mb-4">
            There was an error loading the customer lifecycle analytics data.
          </p>
          <button
            onClick={handleRefresh}
            className="btn-primary"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-lifecycle-analytics-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Customer Lifecycle Analytics
            </h1>
            <p className="text-gray-600">
              Comprehensive customer journey analysis, retention insights, and predictive modeling
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-3">
            {/* Time Range Selector */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={timeRange}
                onChange={(e) => handleTimeRangeChange(e.target.value as AnalyticsTimeRange)}
                className="dashboard-select"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
            </div>

            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`dashboard-filter-btn ${showFilters ? 'active' : ''}`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>

            {/* Auto-refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`dashboard-refresh-btn ${autoRefresh ? 'active' : ''}`}
            >
              <Activity className={`w-4 h-4 ${autoRefresh ? 'animate-pulse' : ''}`} />
            </button>

            {/* Manual Refresh */}
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="dashboard-action-btn"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>

            {/* Export */}
            <button
              onClick={() => handleExport('pdf')}
              className="dashboard-action-btn"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Quick Filters */}
        {showFilters && (
          <div className="mb-6">
            <QuickFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClear={() => setFilters({})}
            />
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'lifecycle', label: 'Lifecycle Stages', icon: Users },
              { id: 'retention', label: 'Retention Analysis', icon: Heart },
              { id: 'predictive', label: 'Predictive Insights', icon: Brain },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Customers"
                value={metrics?.overview.totalCustomers || 0}
                formatter={formatNumber}
                trend={metrics?.trends.customerGrowth}
                icon={Users}
                color="blue"
                isLoading={isLoading}
              />
              <MetricCard
                title="New Customers"
                value={metrics?.overview.newCustomers || 0}
                formatter={formatNumber}
                trend={metrics?.trends.activationRate}
                icon={TrendingUp}
                color="green"
                isLoading={isLoading}
              />
              <MetricCard
                title="Retention Rate"
                value={metrics?.overview.retentionRate || 0}
                formatter={(value) => formatPercentage(value)}
                trend={metrics?.trends.retentionTrend}
                icon={Heart}
                color="purple"
                isLoading={isLoading}
              />
              <MetricCard
                title="Avg Lifetime Value"
                value={metrics?.overview.averageLifetimeValue || 0}
                formatter={formatCurrency}
                trend={metrics?.trends.clvTrend}
                icon={Target}
                color="orange"
                isLoading={isLoading}
              />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Active Customers"
                value={metrics?.overview.activeCustomers || 0}
                formatter={formatNumber}
                trend={8.2}
                icon={Activity}
                color="green"
                isLoading={isLoading}
              />
              <MetricCard
                title="Churn Rate"
                value={metrics?.overview.churnRate || 0}
                formatter={(value) => formatPercentage(value)}
                trend={metrics?.trends.churnTrend}
                icon={TrendingDown}
                color="red"
                isLoading={isLoading}
              />
              <MetricCard
                title="Reactivated"
                value={metrics?.overview.reactivatedCustomers || 0}
                formatter={formatNumber}
                trend={15.3}
                icon={Zap}
                color="yellow"
                isLoading={isLoading}
              />
              <MetricCard
                title="At Risk"
                value={metrics?.lifecycle.atRisk || 0}
                formatter={formatNumber}
                trend={-5.7}
                icon={AlertTriangle}
                color="orange"
                isLoading={isLoading}
              />
            </div>

            {/* Main Overview Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Journey Flow */}
              <ChartContainerWithActions
                title="Customer Journey Flow"
                subtitle="Customer progression through lifecycle stages"
                isLoading={isLoading}
                icon={Users}
                onRefresh={handleRefresh}
                onExport={() => handleExport('pdf')}
                refreshing={isFetching}
              >
                <CustomerJourneyFlow
                  data={lifecycleData?.journeyFlow}
                  timeRange={timeRange}
                />
              </ChartContainerWithActions>

              {/* Lifecycle Stage Breakdown */}
              <ChartContainer
                title="Lifecycle Stage Distribution"
                subtitle="Current customer distribution across stages"
                isLoading={isLoading}
                icon={PieChart}
              >
                <LifecycleStageBreakdown
                  data={metrics?.lifecycle}
                  total={metrics?.overview.totalCustomers || 0}
                />
              </ChartContainer>
            </div>

            {/* Predictive Insights Panel */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-purple-600" />
                  AI-Powered Insights
                </h3>
                <div className="text-sm text-gray-500">Updated in real-time</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {insights.map((insight) => (
                  <div key={insight.type} className="insight-card">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-3 h-3 rounded-full ${
                        insight.severity === 'high' ? 'bg-red-500' :
                        insight.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></div>
                      <div className={`text-sm font-medium ${
                        insight.trend > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {insight.trend > 0 ? '↗' : '↘'} {Math.abs(insight.trend)}%
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {formatNumber(insight.value)}
                    </div>
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      {insight.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {insight.action}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lifecycle' && (
          <div className="space-y-8">
            {/* Lifecycle Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartContainer
                title="Customer Lifecycle Progression"
                subtitle="Customer movement through lifecycle stages over time"
                isLoading={isLoading}
                icon={Activity}
              >
                <CustomerLifecycleChart
                  data={lifecycleData?.lifecycleProgression}
                  timeRange={timeRange}
                />
              </ChartContainer>

              <ChartContainer
                title="Stage Duration Analysis"
                subtitle="Average time spent in each lifecycle stage"
                isLoading={isLoading}
                icon={Clock}
              >
                <div className="w-full h-64 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-600 font-medium mb-2">Stage Duration Chart</div>
                    <div className="text-sm text-gray-500">Average time analysis</div>
                  </div>
                </div>
              </ChartContainer>
            </div>
          </div>
        )}

        {activeTab === 'retention' && (
          <div className="space-y-8">
            {/* Retention Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartContainer
                title="Customer Retention Curves"
                subtitle="Retention rates over customer lifetime"
                isLoading={retentionLoading}
                icon={Heart}
              >
                <RetentionChart
                  data={retentionData?.retentionCurves}
                  timeRange={timeRange}
                />
              </ChartContainer>

              <ChartContainer
                title="Cohort Analysis"
                subtitle="Customer behavior by acquisition cohort"
                isLoading={cohortLoading}
                icon={Users}
              >
                <CohortAnalysisChart
                  data={cohortData?.cohortMatrix}
                  timeRange={timeRange}
                  onCohortSelect={setSelectedCohort}
                />
              </ChartContainer>
            </div>
          </div>
        )}

        {activeTab === 'predictive' && (
          <div className="space-y-8">
            {/* Predictive Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartContainer
                title="Churn Prediction Model"
                subtitle="Customer churn probability over next 90 days"
                isLoading={predictiveLoading}
                icon={Brain}
              >
                <PredictiveInsightsChart
                  data={predictiveData?.churnPrediction}
                  type="churn"
                  timeRange={timeRange}
                />
              </ChartContainer>

              <ChartContainer
                title="Lifetime Value Prediction"
                subtitle="Predicted customer lifetime value distribution"
                isLoading={predictiveLoading}
                icon={Target}
              >
                <PredictiveInsightsChart
                  data={predictiveData?.clvPrediction}
                  type="clv"
                  timeRange={timeRange}
                />
              </ChartContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}