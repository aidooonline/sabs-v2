'use client';

import React from 'react';

interface Alert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

interface AlertsCardProps {
  activeAlerts: number;
  alerts?: Alert[];
  criticalAlerts?: number;
  isLoading?: boolean;
  onClick?: () => void;
}

export const AlertsCard: React.FC<AlertsCardProps> = ({
  activeAlerts,
  alerts = [],
  criticalAlerts = 0,
  isLoading = false,
  onClick,
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-danger-600 bg-danger-100';
      case 'high':
        return 'text-danger-500 bg-danger-50';
      case 'medium':
        return 'text-warning-600 bg-warning-100';
      case 'low':
        return 'text-info-600 bg-info-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'high':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'low':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5zm0 0v-3a4 4 0 00-4-4H8m7 7v-3a4 4 0 00-4-4H8" />
          </svg>
        );
      default:
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getStatusMessage = () => {
    if (activeAlerts === 0) {
      return 'All systems normal';
    }
    if (criticalAlerts > 0) {
      return 'Immediate attention needed';
    }
    if (activeAlerts === 1) {
      return 'One alert active';
    }
    return `${activeAlerts} alerts active`;
  };

  const getStatusClass = () => {
    if (activeAlerts === 0) return 'metric-positive';
    if (criticalAlerts > 0) return 'metric-negative';
    return 'metric-negative';
  };

  if (isLoading) {
    return (
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton h-4 w-24"></div>
          <div className="skeleton h-8 w-8 rounded"></div>
        </div>
        <div className="skeleton h-8 w-16 mb-3"></div>
        <div className="space-y-2">
          <div className="skeleton h-3 w-full"></div>
          <div className="skeleton h-3 w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`dashboard-card ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">Active Alerts</h3>
        <div className={`w-8 h-8 rounded flex items-center justify-center ${
          criticalAlerts > 0 ? 'bg-danger-100' : 
          activeAlerts > 0 ? 'bg-warning-100' : 'bg-success-100'
        }`}>
          <svg className={`w-4 h-4 ${
            criticalAlerts > 0 ? 'text-danger-600' :
            activeAlerts > 0 ? 'text-warning-600' : 'text-success-600'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 17h5l-5 5-5-5h5zm0 0v-3a4 4 0 00-4-4H8m7 7v-3a4 4 0 00-4-4H8" 
            />
          </svg>
        </div>
      </div>
      
      <div className="text-2xl font-bold text-gray-900 mb-3">
        {activeAlerts}
      </div>
      
      <div className="flex items-center text-sm mb-3">
        <span className={getStatusClass()}>
          {getStatusMessage()}
        </span>
      </div>
      
      {alerts.length > 0 && (
        <div className="space-y-1">
          {alerts.slice(0, 2).map((alert, index) => (
            <div key={alert.id || index} className="flex items-start space-x-2 text-xs">
              <div className={`inline-flex items-center px-1.5 py-0.5 rounded-full ${getSeverityColor(alert.severity)}`}>
                {getSeverityIcon(alert.severity)}
                <span className="ml-1 font-medium capitalize">
                  {alert.severity}
                </span>
              </div>
              <span className="text-gray-600 flex-1 leading-tight">
                {alert.message}
              </span>
            </div>
          ))}
          {alerts.length > 2 && (
            <div className="text-xs text-gray-400 mt-2">
              +{alerts.length - 2} more alerts
            </div>
          )}
        </div>
      )}
    </div>
  );
};