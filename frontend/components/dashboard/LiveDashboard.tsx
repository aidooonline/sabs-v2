'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useDashboardUpdates } from '../../hooks/useWebSocket';

interface LiveDashboardProps {
  companyId: string;
  refreshInterval?: number;
  enableAutoRefresh?: boolean;
}

interface DashboardStats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  totalEscalated: number;
  averageProcessingTime: number;
  slaCompliance: number;
  highRiskPending: number;
  criticalAlerts: number;
  activeApprovers: number;
  queueTrend: 'increasing' | 'decreasing' | 'stable';
  lastUpdated: string;
}

interface QueueMetrics {
  currentQueueSize: number;
  hourlyThroughput: number;
  averageWaitTime: number;
  peakHours: { hour: number; count: number }[];
  bottlenecks: string[];
  efficiency: number;
}

interface PerformanceMetrics {
  approvalsToday: number;
  approvalsThisWeek: number;
  approvalsThisMonth: number;
  averageApprovalTime: number;
  escalationRate: number;
  errorRate: number;
  userProductivity: UserProductivity[];
}

interface UserProductivity {
  userId: string;
  userName: string;
  tasksCompleted: number;
  averageTime: number;
  efficiency: number;
  status: 'active' | 'idle' | 'offline';
}

interface AlertSummary {
  id: string;
  type: 'sla_breach' | 'high_risk' | 'system_error' | 'capacity_warning';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  count: number;
  timestamp: string;
  acknowledged: boolean;
}

export const LiveDashboard: React.FC<LiveDashboardProps> = ({
  companyId,
  refreshInterval = 30000,
  enableAutoRefresh = true
}) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalEscalated: 0,
    averageProcessingTime: 0,
    slaCompliance: 0,
    highRiskPending: 0,
    criticalAlerts: 0,
    activeApprovers: 0,
    queueTrend: 'stable',
    lastUpdated: new Date().toISOString()
  });

  const [queueMetrics, setQueueMetrics] = useState<QueueMetrics>({
    currentQueueSize: 0,
    hourlyThroughput: 0,
    averageWaitTime: 0,
    peakHours: [],
    bottlenecks: [],
    efficiency: 0
  });

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    approvalsToday: 0,
    approvalsThisWeek: 0,
    approvalsThisMonth: 0,
    averageApprovalTime: 0,
    escalationRate: 0,
    errorRate: 0,
    userProductivity: []
  });

  const [alerts, setAlerts] = useState<AlertSummary[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const { 
    connectionState, 
    subscribeToStats, 
    subscribeToAlerts, 
    subscribeToQueueUpdates,
    requestDashboardRefresh 
  } = useDashboardUpdates();

  // Update timestamp every second
  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdate(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribeStats = subscribeToStats((newStats) => {
      setStats(prev => ({
        ...prev,
        ...newStats,
        lastUpdated: new Date().toISOString()
      }));
    });

    const unsubscribeAlerts = subscribeToAlerts((alert) => {
      setAlerts(prev => {
        const existingAlert = prev.find(a => a.type === alert.type);
        if (existingAlert) {
          return prev.map(a => 
            a.type === alert.type 
              ? { ...a, count: a.count + 1, timestamp: new Date().toISOString() }
              : a
          );
        } else {
          return [alert, ...prev].slice(0, 10); // Keep only latest 10 alerts
        }
      });
    });

    const unsubscribeQueue = subscribeToQueueUpdates((queueUpdate) => {
      setQueueMetrics(prev => ({
        ...prev,
        ...queueUpdate
      }));
    });

    return () => {
      unsubscribeStats();
      unsubscribeAlerts();
      unsubscribeQueue();
    };
  }, [subscribeToStats, subscribeToAlerts, subscribeToQueueUpdates]);

  // Auto-refresh data
  useEffect(() => {
    if (!enableAutoRefresh) return;

    const interval = setInterval(() => {
      requestDashboardRefresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enableAutoRefresh, refreshInterval, requestDashboardRefresh]);

  // Calculate time since last update
  const getTimeSinceUpdate = () => {
    const now = new Date();
    const lastUpdateTime = new Date(stats.lastUpdated);
    const diffInSeconds = Math.floor((now.getTime() - lastUpdateTime.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else {
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    }
  };

  // Acknowledge alert
  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  // Get trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return (
          <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 8v9h-9" />
          </svg>
        );
      case 'decreasing':
        return (
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17l-9.2-9.2M8 8v9h9" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
    }
  };

  // Get alert severity color
  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'error':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Connection Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Live Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            Real-time approval workflow monitoring
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Live Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionState.isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-600">
              {connectionState.isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>

          {/* Last Update */}
          <span className="text-sm text-gray-500">
            Updated {getTimeSinceUpdate()}
          </span>

          {/* Manual Refresh */}
          <button
            onClick={() => requestDashboardRefresh()}
            disabled={!connectionState.isConnected}
            className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Auto-refresh toggle */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              isLive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}
          >
            {isLive ? 'Live' : 'Paused'}
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Pending Workflows */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Workflows</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalPending}</p>
            </div>
            <div className="flex items-center">
              {getTrendIcon(stats.queueTrend)}
              <div className="ml-2 p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span className="text-gray-500">Queue trend:</span>
              <span className={`ml-1 font-medium ${
                stats.queueTrend === 'increasing' ? 'text-red-600' :
                stats.queueTrend === 'decreasing' ? 'text-green-600' :
                'text-gray-600'
              }`}>
                {stats.queueTrend}
              </span>
            </div>
          </div>
        </div>

        {/* Processing Performance */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {Math.round(stats.averageProcessingTime)}m
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span className="text-gray-500">SLA Compliance:</span>
              <span className={`ml-1 font-medium ${
                stats.slaCompliance >= 95 ? 'text-green-600' :
                stats.slaCompliance >= 85 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {stats.slaCompliance}%
              </span>
            </div>
          </div>
        </div>

        {/* High Risk Items */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Risk Pending</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.highRiskPending}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.098 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span className="text-gray-500">Critical alerts:</span>
              <span className="ml-1 font-medium text-red-600">{stats.criticalAlerts}</span>
            </div>
          </div>
        </div>

        {/* Active Team */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Approvers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeApprovers}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span className="text-gray-500">Efficiency:</span>
              <span className="ml-1 font-medium text-green-600">{queueMetrics.efficiency}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Active Alerts</h3>
            <span className="text-sm text-gray-500">{alerts.length} alerts</span>
          </div>
          
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${getAlertColor(alert.severity)} ${
                  alert.acknowledged ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{alert.message}</span>
                    {alert.count > 1 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {alert.count}x
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Queue Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queue Performance */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Queue Performance</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Queue Size</span>
              <span className="text-lg font-semibold text-gray-900">{queueMetrics.currentQueueSize}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Hourly Throughput</span>
              <span className="text-lg font-semibold text-gray-900">{queueMetrics.hourlyThroughput}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Wait Time</span>
              <span className="text-lg font-semibold text-gray-900">{queueMetrics.averageWaitTime}m</span>
            </div>

            {/* Bottlenecks */}
            {queueMetrics.bottlenecks.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Bottlenecks</h4>
                <div className="space-y-1">
                  {queueMetrics.bottlenecks.map((bottleneck, index) => (
                    <div key={index} className="text-sm text-red-600">
                      • {bottleneck}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Team Productivity */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Team Productivity</h3>
          
          <div className="space-y-3">
            {performanceMetrics.userProductivity.slice(0, 5).map((user) => (
              <div key={user.userId} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    user.status === 'active' ? 'bg-green-500' :
                    user.status === 'idle' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-900">{user.userName}</span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{user.tasksCompleted} tasks</span>
                  <span>{Math.round(user.averageTime)}m avg</span>
                  <span className={`font-medium ${
                    user.efficiency >= 90 ? 'text-green-600' :
                    user.efficiency >= 70 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {user.efficiency}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Connection Error */}
      {!connectionState.isConnected && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-900">Real-time connection lost</p>
              <p className="text-sm text-red-800 mt-1">
                {connectionState.error || 'Attempting to reconnect...'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};