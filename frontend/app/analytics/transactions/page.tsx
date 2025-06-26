'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  useGetTransactionAnalyticsQuery, 
  useGetTransactionPatternsQuery,
  useGetFraudMetricsQuery,
  useGetPaymentMethodAnalyticsQuery
} from '../../../store/api/analyticsApi';
import { formatCurrency, formatNumber, formatPercentage } from '../../../utils/formatters';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CreditCard, 
  DollarSign,
  Users,
  Clock,
  Shield,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  MapPin
} from 'lucide-react';
import { MetricCard, ComparisonMetricCard } from '../../components/MetricCard';
import { ChartContainer, ChartContainerWithActions } from '../../components/ChartContainer';
import { RealtimeMetrics } from '../../components/RealtimeMetrics';
import { QuickFilters } from '../../components/QuickFilters';
import { TransactionVolumeChart } from '../../components/charts/TransactionVolumeChart';
import { PaymentMethodChart } from '../../components/charts/PaymentMethodChart';
import { TransactionPatternsChart } from '../../components/charts/TransactionPatternsChart';
import { FraudDetectionChart } from '../../components/charts/FraudDetectionChart';
import { TransactionHeatmapChart } from '../../components/charts/TransactionHeatmapChart';
import type { AnalyticsTimeRange, AnalyticsFilters } from '../../../types/analytics';

export default function TransactionAnalyticsPage() {
  // State management
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('30d');
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'fraud' | 'methods'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // API queries
  const {
    data: transactionData,
    isLoading,
    isFetching,
    error,
    refetch
  } = useGetTransactionAnalyticsQuery({ timeRange, filters }, {
    refetchOnMountOrArgChange: true,
    pollingInterval: autoRefresh ? 60000 : 0, // 1-minute refresh
  });

  const {
    data: patternsData,
    isLoading: patternsLoading
  } = useGetTransactionPatternsQuery({ timeRange, filters });

  const {
    data: fraudData,
    isLoading: fraudLoading
  } = useGetFraudMetricsQuery({ timeRange, filters });

  const {
    data: paymentMethodData,
    isLoading: paymentMethodLoading
  } = useGetPaymentMethodAnalyticsQuery({ timeRange, filters });

  // Handle filter changes
  const handleTimeRangeChange = (newTimeRange: AnalyticsTimeRange) => {
    setTimeRange(newTimeRange);
  };

  const handleFiltersChange = (newFilters: AnalyticsFilters) => {
    setFilters(newFilters);
  };

  // Export functionality
  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log('Exporting transaction analytics as:', format);
    // Implementation for transaction analytics export
  };

  // Manual refresh
  const handleRefresh = () => {
    refetch();
  };

  // Computed metrics
  const metrics = useMemo(() => {
    if (!transactionData) return null;

    return {
      volume: {
        total: transactionData.totalVolume,
        growth: transactionData.volumeGrowthRate,
        average: transactionData.averageTransactionValue,
        trend: transactionData.volumeTrend
      },
      transactions: {
        total: transactionData.totalTransactions,
        growth: transactionData.transactionGrowthRate,
        successRate: transactionData.successRate,
        trend: transactionData.transactionTrend
      },
      performance: {
        averageProcessingTime: transactionData.averageProcessingTime,
        peakHour: transactionData.peakHour,
        failureRate: transactionData.failureRate,
        fraudRate: fraudData?.fraudRate || 0
      }
    };
  }, [transactionData, fraudData]);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Transaction Analytics
          </h2>
          <p className="text-gray-600 mb-4">
            There was an error loading the transaction analytics data.
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
    <div className="transaction-analytics-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Transaction Analytics
            </h1>
            <p className="text-gray-600">
              Comprehensive transaction insights, patterns, and performance metrics
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
              { id: 'patterns', label: 'Patterns', icon: TrendingUp },
              { id: 'fraud', label: 'Fraud Detection', icon: Shield },
              { id: 'methods', label: 'Payment Methods', icon: CreditCard },
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
                title="Transaction Volume"
                value={metrics?.volume.total || 0}
                formatter={formatCurrency}
                trend={metrics?.volume.growth}
                icon={DollarSign}
                color="purple"
                isLoading={isLoading}
              />
              <MetricCard
                title="Total Transactions"
                value={metrics?.transactions.total || 0}
                formatter={formatNumber}
                trend={metrics?.transactions.growth}
                icon={CreditCard}
                color="blue"
                isLoading={isLoading}
              />
              <MetricCard
                title="Success Rate"
                value={metrics?.transactions.successRate || 0}
                formatter={(value) => formatPercentage(value)}
                trend={5.2}
                icon={Zap}
                color="green"
                isLoading={isLoading}
              />
              <MetricCard
                title="Avg Processing Time"
                value={metrics?.performance.averageProcessingTime || 0}
                formatter={(value) => `${value.toFixed(1)}s`}
                trend={-12.3}
                icon={Clock}
                color="orange"
                isLoading={isLoading}
              />
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Transaction Volume Over Time */}
              <ChartContainerWithActions
                title="Transaction Volume Trends"
                subtitle="Daily transaction volume and patterns"
                isLoading={isLoading}
                icon={BarChart3}
                onRefresh={handleRefresh}
                onExport={() => handleExport('pdf')}
                refreshing={isFetching}
              >
                <TransactionVolumeChart
                  data={transactionData?.volumeData}
                  timeRange={timeRange}
                />
              </ChartContainerWithActions>

              {/* Transaction Success Rate */}
              <ChartContainer
                title="Transaction Success Rate"
                subtitle="Success vs failure rate over time"
                isLoading={isLoading}
                icon={Zap}
              >
                <div className="w-full h-64 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-600 font-medium mb-2">Success Rate Chart</div>
                    <div className="text-sm text-gray-500">
                      Current Rate: {formatPercentage(metrics?.transactions.successRate || 0)}
                    </div>
                  </div>
                </div>
              </ChartContainer>
            </div>

            {/* Secondary Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Transaction Heatmap */}
              <div className="lg:col-span-2">
                <ChartContainer
                  title="Transaction Heatmap"
                  subtitle="Peak transaction hours and days"
                  isLoading={isLoading}
                  icon={Activity}
                >
                  <TransactionHeatmapChart
                    data={transactionData?.heatmapData}
                    timeRange={timeRange}
                  />
                </ChartContainer>
              </div>

              {/* Quick Stats */}
              <div className="space-y-6">
                <div className="analytics-stat-card">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Peak Hour</h3>
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics?.performance.peakHour || '--:--'}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Highest activity</div>
                </div>

                <div className="analytics-stat-card">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Failure Rate</h3>
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {formatPercentage(metrics?.performance.failureRate || 0)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Failed transactions</div>
                </div>

                <div className="analytics-stat-card">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Fraud Rate</h3>
                    <Shield className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatPercentage(metrics?.performance.fraudRate || 0)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Detected fraud</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="space-y-8">
            {/* Pattern Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartContainer
                title="Transaction Patterns"
                subtitle="Customer behavior and transaction patterns"
                isLoading={patternsLoading}
                icon={TrendingUp}
              >
                <TransactionPatternsChart
                  data={patternsData?.patternData}
                  timeRange={timeRange}
                />
              </ChartContainer>

              <ChartContainer
                title="Customer Segmentation"
                subtitle="Transaction behavior by customer segments"
                isLoading={patternsLoading}
                icon={Users}
              >
                <div className="w-full h-64 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-600 font-medium mb-2">Segmentation Chart</div>
                    <div className="text-sm text-gray-500">Customer behavior analysis</div>
                  </div>
                </div>
              </ChartContainer>
            </div>
          </div>
        )}

        {activeTab === 'fraud' && (
          <div className="space-y-8">
            {/* Fraud Detection Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Fraud Detections"
                value={fraudData?.totalDetections || 0}
                formatter={formatNumber}
                trend={fraudData?.detectionTrend}
                icon={Shield}
                color="red"
                isLoading={fraudLoading}
              />
              <MetricCard
                title="False Positives"
                value={fraudData?.falsePositives || 0}
                formatter={formatNumber}
                trend={fraudData?.falsePositiveTrend}
                icon={AlertTriangle}
                color="yellow"
                isLoading={fraudLoading}
              />
              <MetricCard
                title="Risk Score"
                value={fraudData?.averageRiskScore || 0}
                formatter={(value) => value.toFixed(2)}
                trend={fraudData?.riskTrend}
                icon={TrendingUp}
                color="orange"
                isLoading={fraudLoading}
              />
            </div>

            {/* Fraud Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartContainer
                title="Fraud Detection Over Time"
                subtitle="Fraud detection trends and patterns"
                isLoading={fraudLoading}
                icon={Shield}
              >
                <FraudDetectionChart
                  data={fraudData?.detectionData}
                  timeRange={timeRange}
                />
              </ChartContainer>

              <ChartContainer
                title="Risk Distribution"
                subtitle="Transaction risk score distribution"
                isLoading={fraudLoading}
                icon={PieChart}
              >
                <div className="w-full h-64 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-600 font-medium mb-2">Risk Distribution</div>
                    <div className="text-sm text-gray-500">Risk score analysis</div>
                  </div>
                </div>
              </ChartContainer>
            </div>
          </div>
        )}

        {activeTab === 'methods' && (
          <div className="space-y-8">
            {/* Payment Method Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartContainer
                title="Payment Method Performance"
                subtitle="Success rates by payment method"
                isLoading={paymentMethodLoading}
                icon={CreditCard}
              >
                <PaymentMethodChart
                  data={paymentMethodData?.methodData}
                  timeRange={timeRange}
                />
              </ChartContainer>

              <ChartContainer
                title="Method Usage Trends"
                subtitle="Payment method adoption over time"
                isLoading={paymentMethodLoading}
                icon={TrendingUp}
              >
                <div className="w-full h-64 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-600 font-medium mb-2">Usage Trends</div>
                    <div className="text-sm text-gray-500">Method adoption analysis</div>
                  </div>
                </div>
              </ChartContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}