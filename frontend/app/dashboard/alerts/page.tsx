'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// Import alert components (will be created in this session)
import { AlertCreationForm } from '../../../components/dashboard/Alerts/AlertCreationForm';
import { AlertsList } from '../../../components/dashboard/Alerts/AlertsList';
import { AlertSettings } from '../../../components/dashboard/Alerts/AlertSettings';
import { NotificationCenter } from '../../../components/dashboard/Alerts/NotificationCenter';

// Enhanced alerts mock data for demonstration (will be replaced with API calls)
const mockAlertsData = {
  // Active alerts
  activeAlerts: [
    {
      id: '1',
      type: 'low_balance',
      title: 'Low Balance Alert',
      message: 'Mobile Wallet balance is below GHS 1,000',
      severity: 'medium' as const,
      threshold: 1000,
      currentValue: 800,
      status: 'active' as const,
      createdAt: new Date('2024-12-20T10:30:00'),
      triggeredAt: new Date('2024-12-22T14:45:00'),
      accountId: '3',
      accountName: 'Mobile Wallet',
    },
    {
      id: '2',
      type: 'budget_exceeded',
      title: 'Budget Exceeded',
      message: 'Food & Dining budget has been exceeded by 15%',
      severity: 'high' as const,
      threshold: 800,
      currentValue: 920,
      status: 'active' as const,
      createdAt: new Date('2024-12-18T09:00:00'),
      triggeredAt: new Date('2024-12-22T18:20:00'),
      category: 'Food & Dining',
    },
    {
      id: '3',
      type: 'unusual_activity',
      title: 'Unusual Spending Pattern',
      message: 'Spending on Entertainment increased by 45% this week',
      severity: 'low' as const,
      threshold: 25,
      currentValue: 45,
      status: 'acknowledged' as const,
      createdAt: new Date('2024-12-19T12:15:00'),
      triggeredAt: new Date('2024-12-21T16:10:00'),
      acknowledgedAt: new Date('2024-12-22T09:30:00'),
      category: 'Entertainment',
    },
    {
      id: '6',
      type: 'account_locked',
      title: 'Security Alert: Account Access Attempt',
      message: 'Multiple failed login attempts detected from unknown device',
      severity: 'critical' as const,
      threshold: 3,
      currentValue: 5,
      status: 'active' as const,
      createdAt: new Date('2024-12-22T15:30:00'),
      triggeredAt: new Date('2024-12-22T15:45:00'),
      accountId: '1',
      accountName: 'Main Account',
    },
  ],

  // Alert history
  alertHistory: [
    {
      id: '4',
      type: 'balance_milestone',
      title: 'Savings Milestone',
      message: 'Congratulations! You reached GHS 10,000 in savings',
      severity: 'low' as const,
      threshold: 10000,
      currentValue: 10000,
      status: 'resolved' as const,
      createdAt: new Date('2024-12-15T08:00:00'),
      triggeredAt: new Date('2024-12-20T11:30:00'),
      resolvedAt: new Date('2024-12-20T11:35:00'),
      accountId: '1',
      accountName: 'Savings Account',
    },
    {
      id: '5',
      type: 'payment_reminder',
      title: 'Bill Payment Due',
      message: 'Electricity bill payment is due in 2 days',
      severity: 'medium' as const,
      threshold: 2,
      currentValue: 0,
      status: 'resolved' as const,
      createdAt: new Date('2024-12-16T07:00:00'),
      triggeredAt: new Date('2024-12-18T07:00:00'),
      resolvedAt: new Date('2024-12-18T14:20:00'),
    },
  ],

  // User alert preferences
  alertPreferences: {
    email: {
      enabled: true,
      frequency: 'immediate' as const,
      types: ['low_balance', 'budget_exceeded', 'unusual_activity'],
    },
    sms: {
      enabled: true,
      frequency: 'important_only' as const,
      types: ['low_balance', 'budget_exceeded'],
    },
    push: {
      enabled: true,
      frequency: 'immediate' as const,
      types: ['low_balance', 'budget_exceeded', 'unusual_activity', 'payment_reminder'],
    },
    inApp: {
      enabled: true,
      frequency: 'immediate' as const,
      types: ['low_balance', 'budget_exceeded', 'unusual_activity', 'payment_reminder', 'balance_milestone'],
    },
  },

  // Alert types available for creation
  alertTypes: [
    {
      type: 'low_balance',
      title: 'Low Balance',
      description: 'Alert when account balance falls below a threshold',
      category: 'balance',
      fields: ['threshold', 'account'],
      defaultThreshold: 1000,
    },
    {
      type: 'budget_exceeded',
      title: 'Budget Exceeded',
      description: 'Alert when spending exceeds budget in a category',
      category: 'budget',
      fields: ['threshold', 'category', 'period'],
      defaultThreshold: 100, // percentage
    },
    {
      type: 'unusual_activity',
      title: 'Unusual Activity',
      description: 'Alert for unusual spending patterns or large transactions',
      category: 'security',
      fields: ['threshold', 'amount', 'category'],
      defaultThreshold: 500,
    },
    {
      type: 'payment_reminder',
      title: 'Payment Reminder',
      description: 'Remind about upcoming bill payments',
      category: 'payments',
      fields: ['daysAhead', 'payee'],
      defaultThreshold: 3,
    },
    {
      type: 'balance_milestone',
      title: 'Balance Milestone',
      description: 'Celebrate reaching savings or balance goals',
      category: 'goals',
      fields: ['milestone', 'account'],
      defaultThreshold: 10000,
    },
  ],

  // Statistics
  statistics: {
    totalAlerts: 9,
    activeAlerts: 4,
    resolvedToday: 2,
    avgResponseTime: '4.2 hours',
    mostTriggeredType: 'budget_exceeded',
  },
};

export default function AlertsDashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'active' | 'create' | 'settings' | 'history'>('overview');
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);

  // Event handlers for interactive features
  const handleCreateAlert = (alertData: any) => {
    console.log('Creating alert:', alertData);
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    console.log('Acknowledging alert:', alertId);
  };

  const handleResolveAlert = (alertId: string) => {
    console.log('Resolving alert:', alertId);
  };

  const handleUpdateSettings = (settings: any) => {
    console.log('Updating alert settings:', settings);
  };

  const handleAlertClick = (alertId: string) => {
    setSelectedAlert(alertId);
    console.log('Alert clicked:', alertId);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getAlertStats = () => {
    const active = mockAlertsData.activeAlerts.filter(alert => alert.status === 'active').length;
    const acknowledged = mockAlertsData.activeAlerts.filter(alert => alert.status === 'acknowledged').length;
    const critical = mockAlertsData.activeAlerts.filter(alert => alert.severity === 'high' || alert.severity === 'critical').length;
    
    return { active, acknowledged, critical };
  };

  const stats = getAlertStats();

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Alerts & Notifications
            </h1>
            <p className="text-gray-600">
              Manage your financial alerts and stay informed about important events
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="hidden lg:flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-danger-600">{stats.active}</div>
              <div className="text-xs text-gray-500">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning-600">{stats.acknowledged}</div>
              <div className="text-xs text-gray-500">Acknowledged</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{stats.critical}</div>
              <div className="text-xs text-gray-500">Critical</div>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedTab === 'overview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setSelectedTab('active')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedTab === 'active'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🚨 Active ({stats.active})
          </button>
          <button
            onClick={() => setSelectedTab('create')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedTab === 'create'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ➕ Create
          </button>
          <button
            onClick={() => setSelectedTab('settings')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedTab === 'settings'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ⚙️ Settings
          </button>
          <button
            onClick={() => setSelectedTab('history')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedTab === 'history'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📜 History
          </button>
        </div>
      </div>

      {/* Day 4 Implementation Status */}
      <div className="bg-gradient-to-r from-danger-50 to-danger-100 border border-danger-200 rounded-card p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-danger-900 mb-4">
          🎯 Day 4: AC3 - Real-time Alerts & Notifications
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <span className="text-sm text-danger-800">✅ Alert creation form (9:30-10:30 AM)</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <span className="text-sm text-danger-800">✅ Alert list & management (10:30-11:30 AM)</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <span className="text-sm text-danger-800">✅ Notification preferences (11:30-12:30 PM)</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <span className="text-sm text-danger-800">✅ Acknowledgment & tracking (12:30-1:00 PM)</span>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mb-6 sm:mb-8">
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="dashboard-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Alerts</p>
                    <p className="text-2xl font-bold text-gray-900">{mockAlertsData.statistics.totalAlerts}</p>
                  </div>
                  <div className="w-8 h-8 bg-primary-100 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5zm0 0v-3a4 4 0 00-4-4H8m7 7v-3a4 4 0 00-4-4H8" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Alerts</p>
                    <p className="text-2xl font-bold text-danger-600">{stats.active}</p>
                  </div>
                  <div className="w-8 h-8 bg-danger-100 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Resolved Today</p>
                    <p className="text-2xl font-bold text-success-600">{mockAlertsData.statistics.resolvedToday}</p>
                  </div>
                  <div className="w-8 h-8 bg-success-100 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Response</p>
                    <p className="text-2xl font-bold text-info-600">{mockAlertsData.statistics.avgResponseTime}</p>
                  </div>
                  <div className="w-8 h-8 bg-info-100 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Alerts Preview */}
            <div className="dashboard-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Alerts</h3>
                <button
                  onClick={() => setSelectedTab('active')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View All →
                </button>
              </div>
              
              <div className="space-y-3">
                {mockAlertsData.activeAlerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => handleAlertClick(alert.id)}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-primary-200 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        alert.severity === 'high' ? 'bg-danger-500' :
                        alert.severity === 'medium' ? 'bg-warning-500' : 'bg-info-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900">{alert.title}</p>
                        <p className="text-sm text-gray-600">{alert.message}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{formatDate(alert.triggeredAt)}</p>
                      <p className={`text-xs px-2 py-1 rounded-full ${
                        alert.status === 'active' ? 'bg-danger-100 text-danger-700' :
                        alert.status === 'acknowledged' ? 'bg-warning-100 text-warning-700' :
                        'bg-success-100 text-success-700'
                      }`}>
                        {alert.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'active' && (
          <AlertsList
            alerts={mockAlertsData.activeAlerts}
            isLoading={isLoading}
            onAcknowledge={handleAcknowledgeAlert}
            onResolve={handleResolveAlert}
            onAlertClick={handleAlertClick}
            selectedAlert={selectedAlert}
          />
        )}

        {selectedTab === 'create' && (
          <AlertCreationForm
            alertTypes={mockAlertsData.alertTypes}
            isLoading={isLoading}
            onCreate={handleCreateAlert}
          />
        )}

        {selectedTab === 'settings' && (
          <AlertSettings
            preferences={mockAlertsData.alertPreferences}
            isLoading={isLoading}
            onUpdate={handleUpdateSettings}
          />
        )}

        {selectedTab === 'history' && (
          <AlertsList
            alerts={mockAlertsData.alertHistory}
            isLoading={isLoading}
            showHistory={true}
            onAlertClick={handleAlertClick}
            selectedAlert={selectedAlert}
          />
        )}
      </div>

      {/* Demo Controls */}
      <div className="bg-gradient-to-r from-success-50 to-success-100 border border-success-200 rounded-card p-4 sm:p-6 mb-6 sm:mb-8">
        <h3 className="text-lg font-semibold text-success-900 mb-4">
          🎮 Alerts Demo Controls
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsLoading(!isLoading)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isLoading 
                ? 'bg-warning-600 text-white hover:bg-warning-700' 
                : 'bg-success-600 text-white hover:bg-success-700'
            }`}
          >
            {isLoading ? '⏹ Stop Loading' : '▶ Show Loading States'}
          </button>
          <Link
            href="/dashboard/analytics"
            className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            ← Back to Analytics
          </Link>
          <Link
            href="/dashboard/transactions"
            className="px-4 py-2 bg-info-600 text-white rounded-md text-sm font-medium hover:bg-info-700 transition-colors"
          >
            📝 Next: Transactions (Day 5)
          </Link>
        </div>
      </div>
    </div>
  );
}