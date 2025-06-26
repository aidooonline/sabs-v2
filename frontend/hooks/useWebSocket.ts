'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { WorkflowUpdateMessage } from '../types/approval';

// Extended WebSocket message interface for system-level messages
interface ExtendedWebSocketMessage {
  type: string;
  data?: any;
  timestamp: string;
  userId?: string;
}

interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  messageQueueSize?: number;
  autoConnect?: boolean;
}

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  lastMessage: ExtendedWebSocketMessage | null;
  connectionId: string | null;
  error: string | null;
  retryCount: number;
  latency: number;
}

interface WebSocketHook {
  state: WebSocketState;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: any) => boolean;
  subscribe: (channel: string, callback: (data: any) => void) => () => void;
  unsubscribe: (channel: string) => void;
  clearSubscriptions: () => void;
}

const DEFAULT_CONFIG: Required<WebSocketConfig> = {
  url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws',
  protocols: [],
  reconnectAttempts: 5,
  reconnectInterval: 3000,
  heartbeatInterval: 30000,
  messageQueueSize: 100,
  autoConnect: true
};

export const useWebSocket = (config: Partial<WebSocketConfig> = {}): WebSocketHook => {
  const wsConfig = { ...DEFAULT_CONFIG, ...config };
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<any[]>([]);
  const subscriptionsRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const lastPingRef = useRef<number>(0);

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    isReconnecting: false,
    lastMessage: null,
    connectionId: null,
    error: null,
    retryCount: 0,
    latency: 0
  });

  // Clear reconnect timeout
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Clear heartbeat timeout
  const clearHeartbeatTimeout = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  // Send heartbeat ping
  const sendHeartbeat = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      lastPingRef.current = Date.now();
      wsRef.current.send(JSON.stringify({
        type: 'ping',
        timestamp: lastPingRef.current
      }));
      
      // Schedule next heartbeat
      heartbeatTimeoutRef.current = setTimeout(sendHeartbeat, wsConfig.heartbeatInterval);
    }
  }, [wsConfig.heartbeatInterval]);

  // Handle incoming messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: ExtendedWebSocketMessage = JSON.parse(event.data);
      
      // Handle pong response for latency calculation
      if (message.type === 'pong' && lastPingRef.current > 0) {
        const latency = Date.now() - lastPingRef.current;
        setState(prev => ({ ...prev, latency }));
        return;
      }

      // Handle connection confirmation
      if (message.type === 'connection_confirmed') {
        setState(prev => ({
          ...prev,
          connectionId: (message.data as any)?.connectionId || null,
          error: null
        }));
        
        // Send any queued messages
        if (messageQueueRef.current.length > 0) {
          messageQueueRef.current.forEach(queuedMessage => {
            wsRef.current?.send(JSON.stringify(queuedMessage));
          });
          messageQueueRef.current = [];
        }
        
        return;
      }

      // Update last message
      setState(prev => ({ ...prev, lastMessage: message }));

      // Route message to subscribers
      const channelSubscribers = subscriptionsRef.current.get(message.type);
      if (channelSubscribers) {
        channelSubscribers.forEach(callback => {
          try {
            callback(message.data);
          } catch (error) {
            console.error(`Error in WebSocket subscriber for ${message.type}:`, error);
          }
        });
      }

      // Log message for debugging
      console.log('WebSocket message received:', message);
      
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to parse incoming message' 
      }));
    }
  }, []);

  // Handle WebSocket connection open
  const handleOpen = useCallback(() => {
    console.log('WebSocket connected');
    
    setState(prev => ({
      ...prev,
      isConnected: true,
      isConnecting: false,
      isReconnecting: false,
      error: null,
      retryCount: 0
    }));

    // Start heartbeat
    sendHeartbeat();

    // Send authentication message if user token is available
    const token = localStorage.getItem('authToken');
    if (token) {
      wsRef.current?.send(JSON.stringify({
        type: 'authenticate',
        token,
        timestamp: Date.now()
      }));
    }

  }, [sendHeartbeat]);

  // Handle WebSocket connection close
  const handleClose = useCallback((event: CloseEvent) => {
    console.log('WebSocket disconnected:', event.code, event.reason);
    
    clearHeartbeatTimeout();
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      connectionId: null,
      latency: 0
    }));

    // Attempt reconnection if not a clean close and retries available
    if (!event.wasClean) {
      setState(prev => {
        if (prev.retryCount < wsConfig.reconnectAttempts) {
          const newRetryCount = prev.retryCount + 1;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            // Re-attempt connection
            setState(reconnectPrev => ({ 
              ...reconnectPrev, 
              isConnecting: true, 
              error: null 
            }));

            try {
              if (wsRef.current) {
                wsRef.current.close();
              }

              wsRef.current = new WebSocket(wsConfig.url, wsConfig.protocols);
              wsRef.current.onopen = handleOpen;
              wsRef.current.onmessage = handleMessage;
              wsRef.current.onclose = handleClose;
              wsRef.current.onerror = handleError;
            } catch (error) {
              console.error('Failed to create WebSocket connection during reconnect:', error);
              setState(errorPrev => ({
                ...errorPrev,
                isConnecting: false,
                error: 'Failed to establish WebSocket connection'
              }));
            }
          }, wsConfig.reconnectInterval * Math.pow(2, prev.retryCount));

          return {
            ...prev,
            isReconnecting: true,
            retryCount: newRetryCount,
            error: `Connection lost. Reconnecting... (${newRetryCount}/${wsConfig.reconnectAttempts})`
          };
        } else {
          return {
            ...prev,
            isReconnecting: false,
            error: `Failed to reconnect after ${wsConfig.reconnectAttempts} attempts`
          };
        }
      });
    }
  }, [wsConfig.reconnectAttempts, wsConfig.reconnectInterval, wsConfig.url, wsConfig.protocols, clearHeartbeatTimeout, handleOpen, handleMessage, handleError]);

  // Handle WebSocket errors
  const handleError = useCallback((event: Event) => {
    console.error('WebSocket error:', event);
    setState(prev => ({
      ...prev,
      error: 'WebSocket connection error',
      isConnecting: false
    }));
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      return; // Already connecting
    }

    setState(prev => ({ 
      ...prev, 
      isConnecting: true, 
      error: null 
    }));

    try {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Create new WebSocket connection
      wsRef.current = new WebSocket(wsConfig.url, wsConfig.protocols);
      
      // Set up event listeners
      wsRef.current.onopen = handleOpen;
      wsRef.current.onmessage = handleMessage;
      wsRef.current.onclose = handleClose;
      wsRef.current.onerror = handleError;

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: 'Failed to establish WebSocket connection'
      }));
    }
  }, [wsConfig.url, wsConfig.protocols, handleOpen, handleMessage, handleClose, handleError]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    clearHeartbeatTimeout();
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnecting');
      wsRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      connectionId: null,
      error: null,
      retryCount: 0,
      latency: 0
    }));
  }, [clearReconnectTimeout, clearHeartbeatTimeout]);

  // Send message through WebSocket
  const sendMessage = useCallback((message: any): boolean => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      // Queue message if not connected
      if (messageQueueRef.current.length < wsConfig.messageQueueSize) {
        messageQueueRef.current.push({
          ...message,
          timestamp: Date.now()
        });
        return true;
      } else {
        console.warn('Message queue full, dropping message:', message);
        return false;
      }
    }

    try {
      wsRef.current.send(JSON.stringify({
        ...message,
        timestamp: Date.now()
      }));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }, [wsConfig.messageQueueSize]);

  // Subscribe to message type
  const subscribe = useCallback((channel: string, callback: (data: any) => void) => {
    if (!subscriptionsRef.current.has(channel)) {
      subscriptionsRef.current.set(channel, new Set());
    }
    
    subscriptionsRef.current.get(channel)!.add(callback);

    // Send subscription message to server
    sendMessage({
      type: 'subscribe',
      channel
    });

    // Return unsubscribe function
    return () => {
      const channelSubscribers = subscriptionsRef.current.get(channel);
      if (channelSubscribers) {
        channelSubscribers.delete(callback);
        if (channelSubscribers.size === 0) {
          subscriptionsRef.current.delete(channel);
          
          // Send unsubscription message to server
          sendMessage({
            type: 'unsubscribe',
            channel
          });
        }
      }
    };
  }, [sendMessage]);

  // Unsubscribe from message type
  const unsubscribe = useCallback((channel: string) => {
    subscriptionsRef.current.delete(channel);
    
    // Send unsubscription message to server
    sendMessage({
      type: 'unsubscribe',
      channel
    });
  }, [sendMessage]);

  // Clear all subscriptions
  const clearSubscriptions = useCallback(() => {
    subscriptionsRef.current.clear();
    
    // Send clear subscriptions message to server
    sendMessage({
      type: 'unsubscribe_all'
    });
  }, [sendMessage]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (wsConfig.autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [wsConfig.autoConnect, connect, disconnect]);

  // Handle page visibility changes (reconnect when page becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !state.isConnected && !state.isConnecting) {
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.isConnected, state.isConnecting, connect]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (!state.isConnected && !state.isConnecting) {
        connect();
      }
    };

    const handleOffline = () => {
      setState(prev => ({
        ...prev,
        error: 'Network connection lost'
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.isConnected, state.isConnecting, connect]);

  return {
    state,
    connect,
    disconnect,
    sendMessage,
    subscribe,
    unsubscribe,
    clearSubscriptions
  };
};

// Specialized hook for approval workflow updates
export const useWorkflowUpdates = () => {
  const { state, subscribe, sendMessage } = useWebSocket({
    autoConnect: true
  });

  const subscribeToWorkflow = useCallback((workflowId: string, callback: (update: WorkflowUpdateMessage) => void) => {
    return subscribe(`workflow_${workflowId}`, callback);
  }, [subscribe]);

  const subscribeToUserWorkflows = useCallback((userId: string, callback: (update: WorkflowUpdateMessage) => void) => {
    return subscribe(`user_workflows_${userId}`, callback);
  }, [subscribe]);

  const subscribeToCompanyWorkflows = useCallback((companyId: string, callback: (update: WorkflowUpdateMessage) => void) => {
    return subscribe(`company_workflows_${companyId}`, callback);
  }, [subscribe]);

  const subscribeToGlobalUpdates = useCallback((callback: (update: any) => void) => {
    return subscribe('global_updates', callback);
  }, [subscribe]);

  const requestWorkflowStatus = useCallback((workflowId: string) => {
    return sendMessage({
      type: 'request_workflow_status',
      workflowId
    });
  }, [sendMessage]);

  const joinWorkflowRoom = useCallback((workflowId: string) => {
    return sendMessage({
      type: 'join_workflow_room',
      workflowId
    });
  }, [sendMessage]);

  const leaveWorkflowRoom = useCallback((workflowId: string) => {
    return sendMessage({
      type: 'leave_workflow_room',
      workflowId
    });
  }, [sendMessage]);

  return {
    connectionState: state,
    subscribeToWorkflow,
    subscribeToUserWorkflows,
    subscribeToCompanyWorkflows,
    subscribeToGlobalUpdates,
    requestWorkflowStatus,
    joinWorkflowRoom,
    leaveWorkflowRoom
  };
};

// Hook for real-time dashboard updates
export const useDashboardUpdates = () => {
  const { state, subscribe, sendMessage } = useWebSocket({
    autoConnect: true
  });

  const subscribeToStats = useCallback((callback: (stats: any) => void) => {
    return subscribe('dashboard_stats', callback);
  }, [subscribe]);

  const subscribeToAlerts = useCallback((callback: (alert: any) => void) => {
    return subscribe('system_alerts', callback);
  }, [subscribe]);

  const subscribeToQueueUpdates = useCallback((callback: (update: any) => void) => {
    return subscribe('queue_updates', callback);
  }, [subscribe]);

  const requestDashboardRefresh = useCallback(() => {
    return sendMessage({
      type: 'request_dashboard_refresh'
    });
  }, [sendMessage]);

  return {
    connectionState: state,
    subscribeToStats,
    subscribeToAlerts,
    subscribeToQueueUpdates,
    requestDashboardRefresh
  };
};