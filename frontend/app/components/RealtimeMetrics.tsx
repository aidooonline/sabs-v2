'use client';

import React from 'react';
import { formatNumber, formatDuration, formatRelativeTime } from '../../utils/formatters';
import type { RealtimeMetrics as RealtimeMetricsType } from '../../types/analytics';

interface RealtimeMetricsProps {
  data: RealtimeMetricsType | undefined;
  isLoading: boolean;
  lastUpdated: Date;
}

export const RealtimeMetrics: React.FC<RealtimeMetricsProps> = ({
  data,
  isLoading,
  lastUpdated,
}) => {
  // Loading state
  if (isLoading || !data) {
    return (
      <div className="realtime-metrics">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // System status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'down':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Health status color mapping
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="realtime-metrics">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Left side - Live metrics */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {/* System Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${data.systemStatus === 'operational' ? 'bg-green-500' : data.systemStatus === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'} animate-pulse`}></div>
              <span className="text-sm font-medium text-gray-700">
                System Status:
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(data.systemStatus)}`}>
                {data.systemStatus.charAt(0).toUpperCase() + data.systemStatus.slice(1)}
              </span>
            </div>

            {/* Active Users */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Active Users:</span>
              <span className="text-sm font-bold text-gray-900">
                {formatNumber(data.activeUsers)}
              </span>
            </div>

            {/* Pending Transactions */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Pending:</span>
              <span className="text-sm font-bold text-blue-600">
                {formatNumber(data.pendingTransactions)}
              </span>
            </div>

            {/* Response Time */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Response Time:</span>
              <span className={`text-sm font-bold ${data.responseTime < 1000 ? 'text-green-600' : data.responseTime < 2000 ? 'text-yellow-600' : 'text-red-600'}`}>
                {data.responseTime}ms
              </span>
            </div>
          </div>

          {/* Right side - System health and last updated */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {/* System Health Indicators */}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">Health:</span>
              <div className="flex items-center space-x-2">
                {Object.entries(data.systemHealth).map(([service, health]) => (
                  <div key={service} className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${getHealthColor(health)}`}></div>
                    <span className="text-xs text-gray-500 capitalize">
                      {service}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-xs text-gray-500">
              Last updated: {formatRelativeTime(lastUpdated)}
            </div>
          </div>
        </div>

        {/* Today's counters - expandable section */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {formatNumber(data.counters.newCustomersToday)}
              </div>
              <div className="text-xs text-gray-500">New Customers Today</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {formatNumber(data.counters.transactionsToday)}
              </div>
              <div className="text-xs text-gray-500">Transactions Today</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                GHS {(data.counters.volumeToday / 1000).toFixed(1)}K
              </div>
              <div className="text-xs text-gray-500">Volume Today</div>
            </div>
          </div>
        </div>

        {/* Performance indicators */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Uptime: {formatDuration(data.uptime)}</span>
            <span>Load: {data.currentLoad.toFixed(1)}%</span>
          </div>
          <div>
            Last transaction: {formatRelativeTime(data.lastTransactionTime)}
          </div>
        </div>
      </div>
    </div>
  );
};

// Compact realtime metrics for smaller displays
export const CompactRealtimeMetrics: React.FC<RealtimeMetricsProps> = ({
  data,
  isLoading,
  lastUpdated,
}) => {
  if (isLoading || !data) {
    return (
      <div className="compact-realtime-metrics">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="compact-realtime-metrics">
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${data.systemStatus === 'operational' ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
            <span className="text-xs font-medium text-gray-700">
              {formatNumber(data.activeUsers)} active
            </span>
            <span className="text-xs text-gray-500">
              {data.responseTime}ms
            </span>
          </div>
          <div className="text-xs text-gray-400">
            {formatRelativeTime(lastUpdated)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeMetrics;