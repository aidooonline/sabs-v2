'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useGetAnalyticsQuery, useGetRealtimeMetricsQuery } from '../../store/api/analyticsApi';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Download,
  Calendar,
  MapPin,
  Clock,
  Eye,
  Filter
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { ChartContainer } from '../components/ChartContainer';
import { CustomerGrowthChart } from '../components/charts/CustomerGrowthChart';
import { TransactionVolumeChart } from '../components/charts/TransactionVolumeChart';
import { RegionalDistributionMap } from '../components/charts/RegionalDistributionMap';
import { RealtimeMetrics } from '../components/RealtimeMetrics';
import { QuickFilters } from '../components/QuickFilters';
import type { AnalyticsTimeRange, AnalyticsFilters } from '../../types/analytics';

interface AnalyticsDashboardProps {}

export default function AnalyticsDashboard({}: AnalyticsDashboardProps) {
  // State management
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('30d');
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // API queries
  const {
    data: analyticsData,
    isLoading,
    isFetching,
    error,
    refetch
  } = useGetAnalyticsQuery({ timeRange, filters }, {
    refetchOnMountOrArgChange: true,
    pollingInterval: autoRefresh ? refreshInterval : 0,
  });

  const {
    data: realtimeData,
    isLoading: realtimeLoading
  } = useGetRealtimeMetricsQuery(undefined, {
    pollingInterval: 5000, // Update every 5 seconds
  });

  // Auto-refresh management
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetch();
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refetch]);

  // Handle filter changes
  const handleTimeRangeChange = (newTimeRange: AnalyticsTimeRange) => {
    setTimeRange(newTimeRange);
  };

  const handleFiltersChange = (newFilters: AnalyticsFilters) => {
    setFilters(newFilters);
  };

  // Manual refresh
  const handleRefresh = () => {
    refetch();
  };

  // Export functionality
  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log('Exporting analytics data as:', format);
    // Implementation for exporting analytics data
  };

  // Computed metrics
  const metrics = useMemo(() => {
    if (!analyticsData) return null;

    const {
      totalCustomers,
      newCustomers,
      activeCustomers,
      totalTransactions,
      transactionVolume,
      averageTransactionValue,
      customerGrowthRate,
      transactionGrowthRate,
      churnRate,
      revenueGrowthRate
    } = analyticsData;

    return {
      customers: {
        total: totalCustomers,
        new: newCustomers,
        active: activeCustomers,
        growthRate: customerGrowthRate,
        churnRate: churnRate
      },
      transactions: {
        total: totalTransactions,
        volume: transactionVolume,
        averageValue: averageTransactionValue,
        growthRate: transactionGrowthRate
      },
      revenue: {
        total: transactionVolume,
        growthRate: revenueGrowthRate
      }
    };
  }, [analyticsData]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Analytics
          </h2>
          <p className="text-gray-600 mb-4">
            There was an error loading the analytics dashboard.
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
    <div className="analytics-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600">
                Real-time insights and performance metrics for your financial services platform
              </p>
            </div>

            {/* Dashboard Controls */}
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
                  <option value="custom">Custom Range</option>
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
                title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
              >
                <Activity className={`w-4 h-4 ${autoRefresh ? 'animate-pulse' : ''}`} />
              </button>

              {/* Manual Refresh */}
              <button
                onClick={handleRefresh}
                className="dashboard-action-btn"
                disabled={isFetching}
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              </button>

              {/* Export Menu */}
              <div className="relative">
                <button className="dashboard-action-btn">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
                {/* Export dropdown implementation */}
              </div>
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
        </div>

        {/* Real-time Status Bar */}
        <div className="realtime-status-bar mb-8">
          <RealtimeMetrics
            data={realtimeData}
            isLoading={realtimeLoading}
            lastUpdated={new Date()}
          />
        </div>

        {/* Key Performance Indicators */}
        <div className="kpi-grid mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Customers */}
            <MetricCard
              title="Total Customers"
              value={metrics?.customers.total || 0}
              formatter={formatNumber}
              trend={metrics?.customers.growthRate}
              icon={Users}
              color="blue"
              isLoading={isLoading}
            />

            {/* Active Customers */}
            <MetricCard
              title="Active Customers"
              value={metrics?.customers.active || 0}
              formatter={formatNumber}
              trend={metrics?.customers.growthRate}
              icon={Activity}
              color="green"
              isLoading={isLoading}
            />

            {/* Transaction Volume */}
            <MetricCard
              title="Transaction Volume"
              value={metrics?.transactions.volume || 0}
              formatter={formatCurrency}
              trend={metrics?.transactions.growthRate}
              icon={DollarSign}
              color="purple"
              isLoading={isLoading}
            />

            {/* Total Transactions */}
            <MetricCard
              title="Total Transactions"
              value={metrics?.transactions.total || 0}
              formatter={formatNumber}
              trend={metrics?.transactions.growthRate}
              icon={CreditCard}
              color="orange"
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Main Analytics Grid */}
        <div className="analytics-grid">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Customer Growth Chart */}
            <ChartContainer
              title="Customer Growth"
              subtitle="New customer acquisitions over time"
              isLoading={isLoading}
              icon={TrendingUp}
            >
              <CustomerGrowthChart
                data={analyticsData?.customerGrowthData}
                timeRange={timeRange}
              />
            </ChartContainer>

            {/* Transaction Volume Chart */}
            <ChartContainer
              title="Transaction Volume"
              subtitle="Daily transaction volume and trends"
              isLoading={isLoading}
              icon={BarChart3}
            >
              <TransactionVolumeChart
                data={analyticsData?.transactionVolumeData}
                timeRange={timeRange}
              />
            </ChartContainer>
          </div>

          {/* Secondary Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Regional Distribution */}
            <div className="lg:col-span-2">
              <ChartContainer
                title="Regional Distribution"
                subtitle="Customer distribution across Ghana regions"
                isLoading={isLoading}
                icon={MapPin}
              >
                <RegionalDistributionMap
                  data={analyticsData?.regionalData}
                />
              </ChartContainer>
            </div>

            {/* Quick Stats */}
            <div className="space-y-6">
              {/* Average Transaction Value */}
              <div className="analytics-stat-card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">
                    Avg Transaction Value
                  </h3>
                  <DollarSign className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics?.transactions.averageValue || 0)}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Per transaction
                </div>
              </div>

              {/* Customer Churn Rate */}
              <div className="analytics-stat-card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">
                    Churn Rate
                  </h3>
                  <TrendingDown className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatPercentage(metrics?.customers.churnRate || 0)}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  This {timeRange}
                </div>
              </div>

              {/* Revenue Growth */}
              <div className="analytics-stat-card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">
                    Revenue Growth
                  </h3>
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatPercentage(metrics?.revenue.growthRate || 0)}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  vs previous period
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="recent-activity-section">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                <Eye className="w-4 h-4 mr-1 inline" />
                View All
              </button>
            </div>
            
            {/* Activity feed will be implemented */}
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Activity className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      New customer registration
                    </div>
                    <div className="text-xs text-gray-500">
                      2 minutes ago
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}