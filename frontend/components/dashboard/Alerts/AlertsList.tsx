'use client';

import React, { useState, useMemo } from 'react';

// Alert data types
interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  threshold: number;
  currentValue: number;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: Date;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  accountId?: string;
  accountName?: string;
  category?: string;
}

interface AlertsListProps {
  alerts: Alert[];
  isLoading: boolean;
  showHistory?: boolean;
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  onAlertClick?: (alertId: string) => void;
  selectedAlert?: string | null;
}

export function AlertsList({ 
  alerts, 
  isLoading, 
  showHistory = false,
  onAcknowledge,
  onResolve,
  onAlertClick,
  selectedAlert
}: AlertsListProps) {
  const [sortBy, setSortBy] = useState<'date' | 'severity' | 'status' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Format dates for Ghana locale
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDateLong = (date: Date) => {
    return new Intl.DateTimeFormat('en-GH', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Format currency for Ghana
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Get unique values for filters
  const alertTypes = useMemo(() => {
    const types = Array.from(new Set(alerts.map(alert => alert.type)));
    return types.map(type => ({
      value: type,
      label: type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }));
  }, [alerts]);

  // Filter and sort alerts
  const filteredAndSortedAlerts = useMemo(() => {
    let filtered = alerts.filter(alert => {
      if (filterType !== 'all' && alert.type !== filterType) return false;
      if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
      if (filterStatus !== 'all' && alert.status !== filterStatus) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'date':
          compareValue = a.triggeredAt.getTime() - b.triggeredAt.getTime();
          break;
        case 'severity':
          const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
          compareValue = severityOrder[a.severity] - severityOrder[b.severity];
          break;
        case 'status':
          const statusOrder = { active: 1, acknowledged: 2, resolved: 3 };
          compareValue = statusOrder[a.status] - statusOrder[b.status];
          break;
        case 'type':
          compareValue = a.type.localeCompare(b.type);
          break;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
  }, [alerts, filterType, filterSeverity, filterStatus, sortBy, sortOrder]);

  // Get severity color and icon
  const getSeverityConfig = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return { 
          color: 'text-red-600 bg-red-100 border-red-200', 
          icon: '🚨', 
          dotColor: 'bg-red-500' 
        };
      case 'high':
        return { 
          color: 'text-orange-600 bg-orange-100 border-orange-200', 
          icon: '⚠️', 
          dotColor: 'bg-orange-500' 
        };
      case 'medium':
        return { 
          color: 'text-yellow-600 bg-yellow-100 border-yellow-200', 
          icon: '⚡', 
          dotColor: 'bg-yellow-500' 
        };
      case 'low':
        return { 
          color: 'text-blue-600 bg-blue-100 border-blue-200', 
          icon: 'ℹ️', 
          dotColor: 'bg-blue-500' 
        };
    }
  };

  // Get status configuration
  const getStatusConfig = (status: Alert['status']) => {
    switch (status) {
      case 'active':
        return { 
          color: 'text-red-700 bg-red-100 border-red-200',
          label: 'Active',
          icon: '🔴'
        };
      case 'acknowledged':
        return { 
          color: 'text-yellow-700 bg-yellow-100 border-yellow-200',
          label: 'Acknowledged',
          icon: '🟡'
        };
      case 'resolved':
        return { 
          color: 'text-green-700 bg-green-100 border-green-200',
          label: 'Resolved',
          icon: '🟢'
        };
    }
  };

  // Handle sort change
  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="dashboard-card animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-32"></div>
                  <div className="h-3 bg-gray-300 rounded w-48"></div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-6 bg-gray-300 rounded w-16"></div>
                <div className="h-8 bg-gray-300 rounded w-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="dashboard-card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Types</option>
              {alertTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {!showHistory && (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="acknowledged">Acknowledged</option>
              </select>
            )}
          </div>

          {/* Sort and View Controls */}
          <div className="flex items-center space-x-3">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="date-desc">Latest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="severity-desc">High Severity First</option>
              <option value="severity-asc">Low Severity First</option>
              <option value="type-asc">Type A-Z</option>
              <option value="type-desc">Type Z-A</option>
            </select>

            <div className="flex border border-gray-300 rounded-md">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm ${
                  viewMode === 'list' 
                    ? 'bg-primary-50 text-primary-600 border-r border-gray-300' 
                    : 'text-gray-600 hover:text-gray-900 border-r border-gray-300'
                }`}
              >
                📋 List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm ${
                  viewMode === 'grid' 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ▦ Grid
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredAndSortedAlerts.length} of {alerts.length} alerts
          {showHistory ? ' (History)' : ''}
        </div>
      </div>

      {/* Alerts List/Grid */}
      {filteredAndSortedAlerts.length === 0 ? (
        <div className="dashboard-card text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No alerts found
          </h3>
          <p className="text-gray-600">
            {filterType !== 'all' || filterSeverity !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your filters to see more alerts.'
              : showHistory 
                ? 'No alert history available.'
                : 'You have no active alerts at the moment.'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredAndSortedAlerts.map((alert) => {
            const severityConfig = getSeverityConfig(alert.severity);
            const statusConfig = getStatusConfig(alert.status);
            const isSelected = selectedAlert === alert.id;

            return (
              <div
                key={alert.id}
                onClick={() => onAlertClick?.(alert.id)}
                className={`dashboard-card cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-primary-500 border-primary-200' : 'hover:border-primary-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Severity Indicator */}
                    <div className={`w-3 h-3 rounded-full ${severityConfig.dotColor}`}></div>
                    
                    {/* Alert Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {alert.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${severityConfig.color}`}>
                          {severityConfig.icon} {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {alert.message}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Triggered: {formatDate(alert.triggeredAt)}</span>
                        {alert.accountName && (
                          <span className="flex items-center space-x-1">
                            <span>•</span>
                            <span>{alert.accountName}</span>
                          </span>
                        )}
                        {alert.category && (
                          <span className="flex items-center space-x-1">
                            <span>•</span>
                            <span>{alert.category}</span>
                          </span>
                        )}
                        {alert.type.includes('balance') && (
                          <span className="flex items-center space-x-1">
                            <span>•</span>
                            <span>{formatCurrency(alert.currentValue)} / {formatCurrency(alert.threshold)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex items-center space-x-3 ml-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                      {statusConfig.icon} {statusConfig.label}
                    </span>
                    
                    {!showHistory && alert.status === 'active' && (
                      <div className="flex items-center space-x-2">
                        {onAcknowledge && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAcknowledge(alert.id);
                            }}
                            className="px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 border border-yellow-200 rounded-md hover:bg-yellow-200 transition-colors"
                          >
                            Acknowledge
                          </button>
                        )}
                        {onResolve && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onResolve(alert.id);
                            }}
                            className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 border border-green-200 rounded-md hover:bg-green-200 transition-colors"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    )}

                    {!showHistory && alert.status === 'acknowledged' && (
                      <div className="flex items-center space-x-2">
                        {onResolve && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onResolve(alert.id);
                            }}
                            className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 border border-green-200 rounded-md hover:bg-green-200 transition-colors"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedAlerts.map((alert) => {
            const severityConfig = getSeverityConfig(alert.severity);
            const statusConfig = getStatusConfig(alert.status);
            const isSelected = selectedAlert === alert.id;

            return (
              <div
                key={alert.id}
                onClick={() => onAlertClick?.(alert.id)}
                className={`dashboard-card cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-primary-500 border-primary-200' : 'hover:border-primary-200'
                }`}
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${severityConfig.dotColor}`}></div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${severityConfig.color}`}>
                        {severityConfig.icon} {alert.severity}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                      {statusConfig.icon} {statusConfig.label}
                    </span>
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                      {alert.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {alert.message}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-2 text-xs text-gray-500">
                    <div>Triggered: {formatDate(alert.triggeredAt)}</div>
                    {alert.accountName && <div>Account: {alert.accountName}</div>}
                    {alert.category && <div>Category: {alert.category}</div>}
                    {alert.type.includes('balance') && (
                      <div>Value: {formatCurrency(alert.currentValue)} / {formatCurrency(alert.threshold)}</div>
                    )}
                  </div>

                  {/* Actions */}
                  {!showHistory && alert.status !== 'resolved' && (
                    <div className="flex space-x-2">
                      {alert.status === 'active' && onAcknowledge && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAcknowledge(alert.id);
                          }}
                          className="flex-1 px-3 py-2 text-xs font-medium text-yellow-700 bg-yellow-100 border border-yellow-200 rounded-md hover:bg-yellow-200 transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                      {onResolve && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onResolve(alert.id);
                          }}
                          className="flex-1 px-3 py-2 text-xs font-medium text-green-700 bg-green-100 border border-green-200 rounded-md hover:bg-green-200 transition-colors"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}