'use client';

import React, { useState, useEffect } from 'react';

// Types for notification preferences
interface NotificationChannel {
  enabled: boolean;
  frequency: 'immediate' | 'daily' | 'weekly' | 'important_only';
  types: string[];
}

interface AlertPreferences {
  email: NotificationChannel;
  sms: NotificationChannel;
  push: NotificationChannel;
  inApp: NotificationChannel;
}

interface AlertSettingsProps {
  preferences: AlertPreferences;
  isLoading: boolean;
  onUpdate: (preferences: AlertPreferences) => void;
}

// Available alert types for configuration
const alertTypeConfigs = [
  {
    type: 'low_balance',
    title: 'Low Balance Alerts',
    description: 'When account balance falls below threshold',
    category: 'Balance',
    icon: '💰',
    defaultEnabled: true,
  },
  {
    type: 'budget_exceeded',
    title: 'Budget Exceeded',
    description: 'When spending exceeds category budgets',
    category: 'Budget',
    icon: '📊',
    defaultEnabled: true,
  },
  {
    type: 'unusual_activity',
    title: 'Unusual Activity',
    description: 'Suspicious or unusual transaction patterns',
    category: 'Security',
    icon: '🔒',
    defaultEnabled: true,
  },
  {
    type: 'payment_reminder',
    title: 'Payment Reminders',
    description: 'Upcoming bill payment notifications',
    category: 'Payments',
    icon: '📅',
    defaultEnabled: false,
  },
  {
    type: 'balance_milestone',
    title: 'Balance Milestones',
    description: 'Celebrating savings and balance goals',
    category: 'Goals',
    icon: '🎯',
    defaultEnabled: false,
  },
  {
    type: 'transaction_failed',
    title: 'Failed Transactions',
    description: 'When transactions fail or are declined',
    category: 'Security',
    icon: '❌',
    defaultEnabled: true,
  },
  {
    type: 'account_locked',
    title: 'Account Security',
    description: 'Account lockouts and security events',
    category: 'Security',
    icon: '🛡️',
    defaultEnabled: true,
  },
  {
    type: 'monthly_summary',
    title: 'Monthly Summary',
    description: 'Monthly spending and account summaries',
    category: 'Reports',
    icon: '📈',
    defaultEnabled: false,
  },
];

// Frequency options
const frequencyOptions = [
  {
    value: 'immediate' as const,
    label: 'Immediate',
    description: 'Get notified instantly when alerts trigger',
    icon: '⚡',
  },
  {
    value: 'important_only' as const,
    label: 'Important Only',
    description: 'Only critical and high-priority alerts',
    icon: '🚨',
  },
  {
    value: 'daily' as const,
    label: 'Daily Digest',
    description: 'Once daily summary of all alerts',
    icon: '📅',
  },
  {
    value: 'weekly' as const,
    label: 'Weekly Summary',
    description: 'Weekly digest of alerts and activities',
    icon: '📊',
  },
];

export function AlertSettings({ preferences, isLoading, onUpdate }: AlertSettingsProps) {
  const [localPreferences, setLocalPreferences] = useState<AlertPreferences>(preferences);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedChannel, setExpandedChannel] = useState<string | null>('email');

  // Update local preferences when props change
  useEffect(() => {
    setLocalPreferences(preferences);
    setHasChanges(false);
  }, [preferences]);

  // Handle channel toggle
  const handleChannelToggle = (channel: keyof AlertPreferences) => {
    const updated = {
      ...localPreferences,
      [channel]: {
        ...localPreferences[channel],
        enabled: !localPreferences[channel].enabled,
      },
    };
    setLocalPreferences(updated);
    setHasChanges(true);
  };

  // Handle frequency change
  const handleFrequencyChange = (channel: keyof AlertPreferences, frequency: NotificationChannel['frequency']) => {
    const updated = {
      ...localPreferences,
      [channel]: {
        ...localPreferences[channel],
        frequency,
      },
    };
    setLocalPreferences(updated);
    setHasChanges(true);
  };

  // Handle alert type toggle for channel
  const handleAlertTypeToggle = (channel: keyof AlertPreferences, alertType: string) => {
    const currentTypes = localPreferences[channel].types;
    const updated = {
      ...localPreferences,
      [channel]: {
        ...localPreferences[channel],
        types: currentTypes.includes(alertType)
          ? currentTypes.filter(type => type !== alertType)
          : [...currentTypes, alertType],
      },
    };
    setLocalPreferences(updated);
    setHasChanges(true);
  };

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      onUpdate(localPreferences);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    setLocalPreferences(preferences);
    setHasChanges(false);
  };

  // Get channel configuration
  const getChannelConfig = (channel: keyof AlertPreferences) => {
    switch (channel) {
      case 'email':
        return {
          title: 'Email Notifications',
          description: 'Receive alerts via email',
          icon: '📧',
          color: 'blue',
        };
      case 'sms':
        return {
          title: 'SMS Notifications',
          description: 'Get text messages for important alerts',
          icon: '📱',
          color: 'green',
        };
      case 'push':
        return {
          title: 'Push Notifications',
          description: 'Browser and mobile push notifications',
          icon: '🔔',
          color: 'purple',
        };
      case 'inApp':
        return {
          title: 'In-App Notifications',
          description: 'Notifications within the dashboard',
          icon: '💬',
          color: 'orange',
        };
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="dashboard-card">
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Notification Settings
            </h2>
            <p className="text-gray-600">
              Customize how and when you receive alert notifications across different channels
            </p>
          </div>
          
          {/* Save/Reset Actions */}
          {hasChanges && (
            <div className="flex items-center space-x-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`px-6 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                  isSaving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {isSaving ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(localPreferences) as Array<keyof AlertPreferences>).map((channel) => {
            const config = getChannelConfig(channel);
            const channelData = localPreferences[channel];
            
            return (
              <div key={channel} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">{config.icon}</span>
                  <span className="text-sm font-medium text-gray-900">{config.title}</span>
                </div>
                <div className="text-xs text-gray-600">
                  {channelData.enabled ? (
                    <span className="text-green-600">
                      ✓ Enabled ({channelData.types.length} types)
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      ✗ Disabled
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notification Channels */}
      <div className="space-y-4">
        {(Object.keys(localPreferences) as Array<keyof AlertPreferences>).map((channel) => {
          const config = getChannelConfig(channel);
          const channelData = localPreferences[channel];
          const isExpanded = expandedChannel === channel;
          
          return (
            <div key={channel} className="dashboard-card">
              {/* Channel Header */}
              <div
                onClick={() => setExpandedChannel(isExpanded ? null : channel)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">{config.icon}</span>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {config.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {config.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Channel Status */}
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      channelData.enabled ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {channelData.enabled ? 'Enabled' : 'Disabled'}
                    </div>
                    {channelData.enabled && (
                      <div className="text-xs text-gray-500">
                        {channelData.frequency.charAt(0).toUpperCase() + channelData.frequency.slice(1).replace('_', ' ')}
                      </div>
                    )}
                  </div>
                  
                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channelData.enabled}
                      onChange={() => handleChannelToggle(channel)}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer transition-colors ${
                      channelData.enabled ? 'bg-primary-600' : 'bg-gray-200'
                    }`}>
                      <div className={`h-5 w-5 bg-white rounded-full shadow transform transition-transform ${
                        channelData.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}></div>
                    </div>
                  </label>
                  
                  {/* Expand/Collapse */}
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg
                      className={`w-5 h-5 transform transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Expanded Channel Settings */}
              {isExpanded && channelData.enabled && (
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
                  {/* Frequency Settings */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Notification Frequency
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {frequencyOptions.map((option) => (
                        <label key={option.value} className="cursor-pointer">
                          <input
                            type="radio"
                            name={`frequency-${channel}`}
                            value={option.value}
                            checked={channelData.frequency === option.value}
                            onChange={() => handleFrequencyChange(channel, option.value)}
                            className="sr-only"
                          />
                          <div className={`p-3 border-2 rounded-lg transition-all ${
                            channelData.frequency === option.value
                              ? 'border-primary-300 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm">{option.icon}</span>
                              <span className="text-sm font-medium text-gray-900">
                                {option.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">
                              {option.description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Alert Types */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Alert Types
                    </h4>
                    <div className="space-y-3">
                      {alertTypeConfigs.map((alertConfig) => {
                        const isEnabled = channelData.types.includes(alertConfig.type);
                        
                        return (
                          <div key={alertConfig.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">{alertConfig.icon}</span>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {alertConfig.title}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {alertConfig.description}
                                </div>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                alertConfig.category === 'Security' ? 'bg-red-100 text-red-700' :
                                alertConfig.category === 'Balance' ? 'bg-blue-100 text-blue-700' :
                                alertConfig.category === 'Budget' ? 'bg-orange-100 text-orange-700' :
                                alertConfig.category === 'Payments' ? 'bg-green-100 text-green-700' :
                                alertConfig.category === 'Goals' ? 'bg-purple-100 text-purple-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {alertConfig.category}
                              </span>
                            </div>
                            
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={() => handleAlertTypeToggle(channel, alertConfig.type)}
                                className="sr-only"
                              />
                              <div className={`w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer transition-colors ${
                                isEnabled ? 'bg-primary-600' : 'bg-gray-200'
                              }`}>
                                <div className={`h-4 w-4 bg-white rounded-full shadow transform transition-transform mt-1 ${
                                  isEnabled ? 'translate-x-5' : 'translate-x-1'
                                }`}></div>
                              </div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Channel-specific Settings */}
                  {channel === 'sms' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="text-yellow-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-yellow-800">SMS Usage Notice</h5>
                          <p className="text-sm text-yellow-700 mt-1">
                            SMS notifications may incur charges from your mobile carrier. We recommend using "Important Only" frequency to minimize costs.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {channel === 'push' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="text-blue-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-blue-800">Push Notification Permission</h5>
                          <p className="text-sm text-blue-700 mt-1">
                            Make sure to allow push notifications in your browser settings to receive real-time alerts.
                          </p>
                          <button className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                            Test Push Notification →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Global Settings */}
      <div className="dashboard-card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Global Settings
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-900">
                Quiet Hours
              </div>
              <div className="text-xs text-gray-600">
                Pause non-critical notifications during specified hours
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer">
                <div className="h-5 w-5 bg-white rounded-full shadow transform transition-transform translate-x-0"></div>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-900">
                Smart Grouping
              </div>
              <div className="text-xs text-gray-600">
                Group similar alerts to reduce notification volume
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only" />
              <div className="w-11 h-6 bg-primary-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer">
                <div className="h-5 w-5 bg-white rounded-full shadow transform transition-transform translate-x-5"></div>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-900">
                Learning Mode
              </div>
              <div className="text-xs text-gray-600">
                Automatically adjust alert frequency based on your behavior
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only" />
              <div className="w-11 h-6 bg-primary-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer">
                <div className="h-5 w-5 bg-white rounded-full shadow transform transition-transform translate-x-5"></div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-info-50 border border-info-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-info-900 mb-2">💡 Notification Tips</h4>
        <ul className="text-sm text-info-800 space-y-1">
          <li>• Enable push notifications for immediate security alerts</li>
          <li>• Use email for detailed summaries and reports</li>
          <li>• SMS works best for critical alerts when away from devices</li>
          <li>• Set different frequencies per channel to avoid duplication</li>
          <li>• Review and adjust settings monthly based on your needs</li>
        </ul>
      </div>
    </div>
  );
}