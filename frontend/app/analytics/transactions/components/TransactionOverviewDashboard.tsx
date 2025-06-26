'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency, formatNumber, formatPercentage } from '../../../../utils/formatters';
import { MetricCard } from '../../../components/MetricCard';
import { RealTimeTransactionMonitor, CompactTransactionMonitor } from '../../../components/RealTimeTransactionMonitor';
import FraudAlertSystem from '../../../components/FraudAlertSystem';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Shield, 
  Clock,
  AlertTriangle,
  Activity,
  Users,
  BarChart3,
  Eye,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface TransactionOverviewProps {
  timeRange: string;
  isLoading?: boolean;
}

interface OverviewMetrics {
  totalVolume: number;
  totalTransactions: number;
  successRate: number;
  averageTransactionValue: number;
  fraudDetected: number;
  processingTime: number;
  activeCustomers: number;
  peakHour: string;
  trends: {
    volume: number;
    transactions: number;
    successRate: number;
    fraud: number;
  };
}

export const TransactionOverviewDashboard: React.FC<TransactionOverviewProps> = ({
  timeRange,
  isLoading = false,
}) => {
  const [metrics, setMetrics] = useState<OverviewMetrics>({
    totalVolume: 12450000,
    totalTransactions: 8420,
    successRate: 98.5,
    averageTransactionValue: 1479,
    fraudDetected: 12,
    processingTime: 2.3,
    activeCustomers: 2847,
    peakHour: '14:00',
    trends: {
      volume: 8.2,
      transactions: 12.5,
      successRate: 1.2,
      fraud: -5.3,
    },
  });

  const [expandedView, setExpandedView] = useState<'monitor' | 'fraud' | null>(null);
  const [alertCount, setAlertCount] = useState(0);

  // Simulate real-time metrics updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        totalVolume: prev.totalVolume + Math.floor(Math.random() * 10000) + 1000,
        totalTransactions: prev.totalTransactions + Math.floor(Math.random() * 5) + 1,
        activeCustomers: prev.activeCustomers + Math.floor(Math.random() * 10) - 5,
      }));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Calculate derived metrics
  const derivedMetrics = {
    failureRate: 100 - metrics.successRate,
    fraudRate: (metrics.fraudDetected / metrics.totalTransactions) * 100,
    volumePerCustomer: metrics.totalVolume / metrics.activeCustomers,
    transactionsPerMinute: metrics.totalTransactions / (24 * 60), // Assuming 24-hour period
  };

  if (isLoading) {
    return (
      <div className="transaction-overview-dashboard">
        <div className="space-y-6">
          {/* Loading skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-overview-dashboard">
      <div className="space-y-8">
        {/* Primary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Volume"
            value={metrics.totalVolume}
            formatter={formatCurrency}
            trend={metrics.trends.volume}
            icon={DollarSign}
            color="green"
            subtitle={`Avg: ${formatCurrency(metrics.averageTransactionValue)}`}
          />
          <MetricCard
            title="Total Transactions"
            value={metrics.totalTransactions}
            formatter={formatNumber}
            trend={metrics.trends.transactions}
            icon={CreditCard}
            color="blue"
            subtitle={`${formatNumber(Math.round(derivedMetrics.transactionsPerMinute))}/min`}
          />
          <MetricCard
            title="Success Rate"
            value={metrics.successRate}
            formatter={(value) => formatPercentage(value)}
            trend={metrics.trends.successRate}
            icon={TrendingUp}
            color="green"
            subtitle={`${formatPercentage(derivedMetrics.failureRate)} failure rate`}
          />
          <MetricCard
            title="Fraud Detected"
            value={metrics.fraudDetected}
            formatter={formatNumber}
            trend={metrics.trends.fraud}
            icon={Shield}
            color="red"
            subtitle={`${formatPercentage(derivedMetrics.fraudRate)} fraud rate`}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Processing Time"
            value={metrics.processingTime}
            formatter={(value) => `${value.toFixed(1)}s`}
            trend={-8.5}
            icon={Clock}
            color="orange"
            subtitle={`Peak at ${metrics.peakHour}`}
          />
          <MetricCard
            title="Active Customers"
            value={metrics.activeCustomers}
            formatter={formatNumber}
            trend={15.8}
            icon={Users}
            color="purple"
            subtitle={`${formatCurrency(derivedMetrics.volumePerCustomer)} avg/customer`}
          />
          <MetricCard
            title="System Health"
            value={99.8}
            formatter={(value) => formatPercentage(value)}
            trend={0.2}
            icon={Activity}
            color="green"
            subtitle="All systems operational"
          />
          <MetricCard
            title="Alert Level"
            value={alertCount}
            formatter={formatNumber}
            trend={alertCount > 5 ? 25.0 : -12.5}
            icon={AlertTriangle}
            color={alertCount > 5 ? "red" : "yellow"}
            subtitle={alertCount > 5 ? "High alert volume" : "Normal levels"}
          />
        </div>

        {/* Real-time Components Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Real-time Transaction Monitor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-600" />
                Live Transaction Feed
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setExpandedView(expandedView === 'monitor' ? null : 'monitor')}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  {expandedView === 'monitor' ? 
                    <Minimize2 className="w-4 h-4" /> : 
                    <Maximize2 className="w-4 h-4" />
                  }
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {expandedView === 'monitor' ? (
              <RealTimeTransactionMonitor maxTransactions={15} />
            ) : (
              <CompactTransactionMonitor transactionCount={5} />
            )}
          </div>

          {/* Fraud Alert System */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-red-600" />
                Fraud Detection System
                {alertCount > 0 && (
                  <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                    {alertCount} active
                  </span>
                )}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setExpandedView(expandedView === 'fraud' ? null : 'fraud')}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  {expandedView === 'fraud' ? 
                    <Minimize2 className="w-4 h-4" /> : 
                    <Maximize2 className="w-4 h-4" />
                  }
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <FraudAlertSystem 
              maxAlerts={expandedView === 'fraud' ? 20 : 8}
              showResolved={expandedView === 'fraud'}
            />
          </div>
        </div>

        {/* Quick Insights */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
              Quick Insights
            </h3>
            <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="insight-card">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Volume Growth</div>
                  <div className="text-xs text-gray-500">Compared to last period</div>
                </div>
              </div>
              <div className="text-lg font-bold text-green-600">+{formatPercentage(metrics.trends.volume)}</div>
              <div className="text-sm text-gray-600 mt-1">
                Highest growth in deposits (+{formatPercentage(metrics.trends.volume + 2.3)})
              </div>
            </div>

            <div className="insight-card">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Customer Activity</div>
                  <div className="text-xs text-gray-500">Peak transaction hours</div>
                </div>
              </div>
              <div className="text-lg font-bold text-blue-600">{metrics.peakHour} Peak</div>
              <div className="text-sm text-gray-600 mt-1">
                {formatNumber(Math.round(derivedMetrics.transactionsPerMinute * 3))} transactions/min
              </div>
            </div>

            <div className="insight-card">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Security Status</div>
                  <div className="text-xs text-gray-500">Fraud prevention</div>
                </div>
              </div>
              <div className="text-lg font-bold text-purple-600">
                {formatPercentage(100 - derivedMetrics.fraudRate)} Clean
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {metrics.fraudDetected} threats blocked today
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionOverviewDashboard;