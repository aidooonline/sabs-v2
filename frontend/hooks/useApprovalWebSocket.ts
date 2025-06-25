import { useEffect, useRef, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { approvalApi } from '../store/api/approvalApi';
import type { 
  WebSocketMessage,
  WorkflowUpdateMessage,
  ApprovalWorkflow 
} from '../types/approval';

interface UseApprovalWebSocketOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  onWorkflowUpdate?: (workflow: ApprovalWorkflow) => void;
  onNewWorkflow?: (workflow: ApprovalWorkflow) => void;
  onCommentAdded?: (workflowId: string, comment: any) => void;
  onEscalation?: (workflowId: string, escalationData: any) => void;
  onError?: (error: Event) => void;
}

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  lastPingTimestamp: number | null;
  connectionAttempts: number;
  error: string | null;
}

export const useApprovalWebSocket = (options: UseApprovalWebSocketOptions = {}) => {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 5000,
    onWorkflowUpdate,
    onNewWorkflow,
    onCommentAdded,
    onEscalation,
    onError,
  } = options;

  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [socketState, setSocketState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    lastPingTimestamp: null,
    connectionAttempts: 0,
    error: null,
  });

  // Get WebSocket URL - should be configurable via env variables
  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NODE_ENV === 'production' 
      ? window.location.host 
      : 'localhost:3001'; // Development backend port
    return `${protocol}//${host}/api/approval-workflow/ws`;
  }, []);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case 'workflow_update':
          const updateData = message.data as WorkflowUpdateMessage;
          
          // Invalidate and refetch workflow data in RTK Query cache
          dispatch(approvalApi.util.invalidateTags(['ApprovalWorkflow']));
          dispatch(approvalApi.util.invalidateTags([
            { type: 'ApprovalWorkflow', id: updateData.workflowId }
          ]));
          
          // Call custom handler if provided
          if (onWorkflowUpdate && updateData.changes.workflow) {
            onWorkflowUpdate(updateData.changes.workflow);
          }
          break;

        case 'new_workflow':
          const newWorkflow = message.data as ApprovalWorkflow;
          
          // Invalidate workflows list to trigger refetch
          dispatch(approvalApi.util.invalidateTags(['ApprovalWorkflow']));
          dispatch(approvalApi.util.invalidateTags(['DashboardStats']));
          
          // Call custom handler if provided
          if (onNewWorkflow) {
            onNewWorkflow(newWorkflow);
          }
          break;

        case 'comment_added':
          const commentData = message.data;
          
          // Invalidate workflow comments cache
          dispatch(approvalApi.util.invalidateTags([
            { type: 'WorkflowComments', id: commentData.workflowId }
          ]));
          
          // Call custom handler if provided
          if (onCommentAdded) {
            onCommentAdded(commentData.workflowId, commentData.comment);
          }
          break;

        case 'escalation':
          const escalationData = message.data;
          
          // Invalidate relevant caches
          dispatch(approvalApi.util.invalidateTags(['ApprovalWorkflow']));
          dispatch(approvalApi.util.invalidateTags(['DashboardStats']));
          
          // Call custom handler if provided
          if (onEscalation) {
            onEscalation(escalationData.workflowId, escalationData);
          }
          break;

        case 'assignment':
          const assignmentData = message.data;
          
          // Invalidate workflow cache for assignments
          dispatch(approvalApi.util.invalidateTags(['ApprovalWorkflow']));
          dispatch(approvalApi.util.invalidateTags([
            { type: 'ApprovalWorkflow', id: assignmentData.workflowId }
          ]));
          break;

        default:
          console.warn('Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, [dispatch, onWorkflowUpdate, onNewWorkflow, onCommentAdded, onEscalation]);

  // Handle WebSocket connection open
  const handleOpen = useCallback(() => {
    console.log('Approval WebSocket connected');
    
    setSocketState(prev => ({
      ...prev,
      isConnected: true,
      isConnecting: false,
      connectionAttempts: 0,
      error: null,
    }));

    // Send authentication message if token is available
    if (auth?.token && wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'authenticate',
        token: auth.token,
      }));
    }

    // Start ping interval to keep connection alive
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
        setSocketState(prev => ({
          ...prev,
          lastPingTimestamp: Date.now(),
        }));
      }
    }, 30000); // Ping every 30 seconds
  }, [auth?.token]);

  // Handle WebSocket connection close
  const handleClose = useCallback((event: CloseEvent) => {
    console.log('Approval WebSocket disconnected:', event.reason);
    
    setSocketState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
    }));

    // Clear ping interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    // Attempt to reconnect if not manually closed
    if (event.code !== 1000 && socketState.connectionAttempts < reconnectAttempts) {
      setSocketState(prev => ({
        ...prev,
        connectionAttempts: prev.connectionAttempts + 1,
      }));

      reconnectTimeoutRef.current = setTimeout(() => {
        console.log(`Attempting to reconnect... (${socketState.connectionAttempts + 1}/${reconnectAttempts})`);
        connect();
      }, reconnectDelay);
    }
  }, [socketState.connectionAttempts, reconnectAttempts, reconnectDelay]);

  // Handle WebSocket errors
  const handleError = useCallback((event: Event) => {
    console.error('Approval WebSocket error:', event);
    
    setSocketState(prev => ({
      ...prev,
      error: 'WebSocket connection error',
      isConnecting: false,
    }));

    if (onError) {
      onError(event);
    }
  }, [onError]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!auth?.token) {
      console.warn('Cannot connect to WebSocket: No authentication token');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      setSocketState(prev => ({
        ...prev,
        isConnecting: true,
        error: null,
      }));

      const wsUrl = getWebSocketUrl();
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = handleOpen;
      wsRef.current.onmessage = handleMessage;
      wsRef.current.onclose = handleClose;
      wsRef.current.onerror = handleError;

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setSocketState(prev => ({
        ...prev,
        isConnecting: false,
        error: 'Failed to create WebSocket connection',
      }));
    }
  }, [auth?.token, getWebSocketUrl, handleOpen, handleMessage, handleClose, handleError]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setSocketState({
      isConnected: false,
      isConnecting: false,
      lastPingTimestamp: null,
      connectionAttempts: 0,
      error: null,
    });
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('Cannot send message: WebSocket not connected');
    return false;
  }, []);

  // Auto-connect on mount and auth changes
  useEffect(() => {
    if (autoConnect && auth?.token && !wsRef.current) {
      connect();
    }
  }, [autoConnect, auth?.token, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Reconnect when auth token changes
  useEffect(() => {
    if (auth?.token && wsRef.current?.readyState === WebSocket.OPEN) {
      // Re-authenticate with new token
      sendMessage({
        type: 'authenticate',
        token: auth.token,
      });
    }
  }, [auth?.token, sendMessage]);

  return {
    // Connection state
    isConnected: socketState.isConnected,
    isConnecting: socketState.isConnecting,
    connectionAttempts: socketState.connectionAttempts,
    lastPingTimestamp: socketState.lastPingTimestamp,
    error: socketState.error,

    // Connection controls
    connect,
    disconnect,
    sendMessage,

    // Connection info
    isAuthenticated: !!auth?.token,
    maxReconnectAttempts: reconnectAttempts,
  };
};