'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWorkflowUpdates } from '../../hooks/useWebSocket';

interface Notification {
  id: string;
  type: 'workflow_update' | 'system_alert' | 'approval_required' | 'sla_warning' | 'escalation' | 'comment_added';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
  category: 'workflow' | 'system' | 'user' | 'company';
  source: string;
  relatedWorkflowId?: string;
  expiresAt?: string;
}

interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  action: () => void;
  loading?: boolean;
}

interface NotificationCenterProps {
  userId: string;
  companyId: string;
  maxNotifications?: number;
  autoMarkReadDelay?: number;
  enableSounds?: boolean;
  enableDesktopNotifications?: boolean;
}

interface NotificationSound {
  name: string;
  url: string;
  volume: number;
}

const NOTIFICATION_SOUNDS: Record<string, NotificationSound> = {
  default: { name: 'Default', url: '/sounds/notification.mp3', volume: 0.5 },
  urgent: { name: 'Urgent', url: '/sounds/urgent.mp3', volume: 0.8 },
  success: { name: 'Success', url: '/sounds/success.mp3', volume: 0.4 },
  warning: { name: 'Warning', url: '/sounds/warning.mp3', volume: 0.6 }
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  userId,
  companyId,
  maxNotifications = 50,
  autoMarkReadDelay = 5000,
  enableSounds = true,
  enableDesktopNotifications = true
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'workflow' | 'system'>('all');
  const [soundEnabled, setSoundEnabled] = useState(enableSounds);
  const [desktopEnabled, setDesktopEnabled] = useState(enableDesktopNotifications);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const { connectionState, subscribeToUserWorkflows, subscribeToGlobalUpdates } = useWorkflowUpdates();

  // Request notification permissions
  useEffect(() => {
    if ('Notification' in window && desktopEnabled) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setPermissionGranted(permission === 'granted');
        });
      } else {
        setPermissionGranted(Notification.permission === 'granted');
      }
    }
  }, [desktopEnabled]);

  // Play notification sound
  const playNotificationSound = useCallback((priority: string) => {
    try {
      const soundKey = priority === 'critical' ? 'urgent' : 
                       priority === 'high' ? 'warning' : 'default';
      const sound = NOTIFICATION_SOUNDS[soundKey];
      
      const audio = new Audio(sound.url);
      audio.volume = sound.volume;
      audio.play().catch(error => {
        // Log error if sound fails to play, but don't disrupt user
        // console.warn('Failed to play notification sound:', error);
      });
    } catch (error) {
      // console.warn('Notification sound error:', error);
    }
  }, []);

  // Show desktop notification
  const showDesktopNotification = useCallback((notification: Notification) => {
    try {
      const desktopNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/icons/notification-icon.png',
        badge: '/icons/badge-icon.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'critical',
        silent: !soundEnabled
      });

      desktopNotification.onclick = () => {
        window.focus();
        setIsOpen(true);
        markAsRead(notification.id);
        desktopNotification.close();
      };

      // Auto-close after 5 seconds for non-critical notifications
      if (notification.priority !== 'critical') {
        setTimeout(() => {
          desktopNotification.close();
        }, 5000);
      }
    } catch (error) {
      // console.warn('Desktop notification error:', error);
    }
  }, [soundEnabled]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  // Add new notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      
      // Limit notifications
      if (updated.length > maxNotifications) {
        return updated.slice(0, maxNotifications);
      }
      
      return updated;
    });

    // Play sound
    if (soundEnabled) {
      playNotificationSound(notification.priority);
    }

    // Show desktop notification
    if (desktopEnabled && permissionGranted) {
      showDesktopNotification(newNotification);
    }

    // Auto-mark as read after delay
    if (autoMarkReadDelay > 0) {
      setTimeout(() => {
        markAsRead(newNotification.id);
      }, autoMarkReadDelay);
    }

    return newNotification.id;
  }, [maxNotifications, soundEnabled, desktopEnabled, permissionGranted, autoMarkReadDelay, playNotificationSound, showDesktopNotification, markAsRead]);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  }, []);

  // Remove notification
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    );
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Subscribe to workflow updates
  useEffect(() => {
    const unsubscribeUser = subscribeToUserWorkflows(userId, (update) => {
      addNotification({
        type: 'workflow_update',
        priority: 'medium',
        title: 'Workflow Update',
        message: `Workflow ${update.workflowId} has been ${update.status}`,
        category: 'workflow',
        source: 'workflow_system',
        relatedWorkflowId: update.workflowId,
        metadata: { update }
      });
    });

    const unsubscribeGlobal = subscribeToGlobalUpdates((update) => {
      if (update.type === 'system_alert') {
        addNotification({
          type: 'system_alert',
          priority: update.priority || 'medium',
          title: update.title || 'System Alert',
          message: update.message,
          category: 'system',
          source: 'system',
          metadata: { update }
        });
      }
    });

    return () => {
      unsubscribeUser();
      unsubscribeGlobal();
    };
  }, [userId, subscribeToUserWorkflows, subscribeToGlobalUpdates, addNotification]);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'workflow':
        return notification.category === 'workflow';
      case 'system':
        return notification.category === 'system';
      default:
        return true;
    }
  });

  // Get notification counts
  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.priority === 'critical' && !n.read).length;

  // Get priority icon
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return (
          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'high':
        return (
          <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'workflow_update':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'approval_required':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'sla_warning':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'escalation':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
        );
      case 'comment_added':
        return (
          <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h10a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h10a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>

        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 rounded-full ${
            criticalCount > 0 ? 'bg-red-600' : 'bg-blue-600'
          }`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Connection Status Indicator */}
        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
          connectionState.isConnected ? 'bg-green-500' : 
          connectionState.isConnecting ? 'bg-yellow-500' : 'bg-red-500'
        }`}></div>
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                {/* Settings */}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-1 rounded ${soundEnabled ? 'text-blue-600' : 'text-gray-400'}`}
                  title="Toggle sounds"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {soundEnabled ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4l5 5v5" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    )}
                  </svg>
                </button>

                {/* Close */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex space-x-2 mt-3">
              {['all', 'unread', 'workflow', 'system'].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption as any)}
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    filter === filterOption
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filterOption}
                </button>
              ))}
            </div>

            {/* Actions */}
            {unreadCount > 0 && (
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
                <button
                  onClick={clearAllNotifications}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filter === 'unread' ? 'All caught up!' : 'You have no notifications yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer border-l-4 ${
                      !notification.read ? 'bg-blue-50 border-l-blue-500' : 'border-l-transparent'
                    }`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 pt-1">
                        {getTypeIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-1">
                            {getPriorityIcon(notification.priority)}
                            <span className="text-xs text-gray-500">
                              {new Date(notification.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>

                        {/* Actions */}
                        {notification.actions && notification.actions.length > 0 && (
                          <div className="flex space-x-2 mt-3">
                            {notification.actions.map((action) => (
                              <button
                                key={action.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  action.action();
                                }}
                                disabled={action.loading}
                                className={`px-3 py-1 text-xs font-medium rounded ${
                                  action.type === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                                  action.type === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' :
                                  'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                } disabled:opacity-50`}
                              >
                                {action.loading ? 'Loading...' : action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};