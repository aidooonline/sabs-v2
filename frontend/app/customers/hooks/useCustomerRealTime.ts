import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { customerApi } from '../../../store/api/customerApi';
import type { Customer, CustomerTransaction } from '../../../types/customer';

interface CustomerRealTimeUpdate {
  type: 'customer_updated' | 'customer_created' | 'transaction_completed' | 'verification_status_changed';
  data: Customer | CustomerTransaction | any;
  customerId: string;
  timestamp: string;
}

/**
 * Hook for real-time customer data updates using WebSocket connection
 */
export const useCustomerRealTime = (customerId?: string) => {
  const dispatch = useDispatch();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    // Don't establish connection without a customer ID or in development without WebSocket server
    if (!customerId && process.env.NODE_ENV === 'development') {
      return;
    }

    const connectWebSocket = () => {
      try {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
        const url = customerId 
          ? `${wsUrl}/customers/${customerId}/updates`
          : `${wsUrl}/customers/updates`;
        
        wsRef.current = new WebSocket(url);

        wsRef.current.onopen = () => {
          console.log('Customer real-time connection established');
          reconnectAttempts.current = 0;
          
          // Send authentication if token is available
          const token = localStorage.getItem('auth_token');
          if (token) {
            wsRef.current?.send(JSON.stringify({
              type: 'auth',
              token: token
            }));
          }
        };

        wsRef.current.onmessage = (event) => {
          try {
            const update: CustomerRealTimeUpdate = JSON.parse(event.data);
            handleRealTimeUpdate(update);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        wsRef.current.onclose = (event) => {
          console.log('Customer real-time connection closed:', event.code, event.reason);
          
          // Attempt to reconnect if not a clean close
          if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
            const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts.current++;
              console.log(`Attempting to reconnect (attempt ${reconnectAttempts.current})`);
              connectWebSocket();
            }, delay);
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('Customer real-time WebSocket error:', error);
        };

      } catch (error) {
        console.error('Error establishing WebSocket connection:', error);
      }
    };

    const handleRealTimeUpdate = (update: CustomerRealTimeUpdate) => {
      switch (update.type) {
        case 'customer_updated':
          // Invalidate customer cache to trigger refetch
          dispatch(customerApi.util.invalidateTags([
            { type: 'Customer', id: update.customerId },
            { type: 'Customer', id: 'LIST' }
          ]));
          break;

        case 'customer_created':
          // Invalidate customer list to include new customer
          dispatch(customerApi.util.invalidateTags([
            { type: 'Customer', id: 'LIST' }
          ]));
          break;

        case 'transaction_completed':
          // Invalidate customer transactions and stats
          dispatch(customerApi.util.invalidateTags([
            { type: 'CustomerTransaction', id: update.customerId },
            { type: 'CustomerStats', id: update.customerId },
            { type: 'Customer', id: update.customerId }
          ]));
          break;

        case 'verification_status_changed':
          // Invalidate customer data as verification status affects customer info
          dispatch(customerApi.util.invalidateTags([
            { type: 'Customer', id: update.customerId },
            { type: 'Customer', id: 'LIST' }
          ]));
          break;

        default:
          console.log('Unknown real-time update type:', update.type);
      }
    };

    // Establish initial connection
    connectWebSocket();

    // Cleanup function
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [customerId, dispatch]);

  // Return connection status and manual reconnect function
  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    reconnect: () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      reconnectAttempts.current = 0;
    }
  };
};

/**
 * Hook for listening to global customer updates (for customer list views)
 */
export const useGlobalCustomerRealTime = () => {
  return useCustomerRealTime(); // No specific customer ID
};

/**
 * Hook for customer-specific real-time updates (for detail views)
 */
export const useSpecificCustomerRealTime = (customerId: string) => {
  return useCustomerRealTime(customerId);
};

/**
 * Hook for real-time customer search updates
 */
export const useCustomerSearchRealTime = (searchQuery?: string, filters?: any) => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Set up real-time updates that might affect search results
    const handleSearchRelevantUpdate = (update: CustomerRealTimeUpdate) => {
      // If update might affect current search, invalidate search cache
      if (update.type === 'customer_created' || update.type === 'customer_updated') {
        dispatch(customerApi.util.invalidateTags([
          { type: 'Customer', id: 'SEARCH' },
          { type: 'Customer', id: 'LIST' }
        ]));
      }
    };

    // This would typically connect to a search-specific WebSocket channel
    // For now, we'll rely on the global customer updates
    
  }, [searchQuery, filters, dispatch]);
};

/**
 * Hook for real-time customer statistics updates
 */
export const useCustomerStatsRealTime = (customerId: string) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const intervalId = setInterval(() => {
      // Periodically invalidate stats to ensure freshness
      dispatch(customerApi.util.invalidateTags([
        { type: 'CustomerStats', id: customerId }
      ]));
    }, 30000); // Every 30 seconds

    return () => clearInterval(intervalId);
  }, [customerId, dispatch]);
};

/**
 * Enhanced hook with offline support
 */
export const useOfflineAwareCustomerRealTime = (customerId?: string) => {
  const { isConnected, reconnect } = useCustomerRealTime(customerId);
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  useEffect(() => {
    const handleOnline = () => {
      // Reconnect when coming back online
      if (!isConnected) {
        reconnect();
      }
    };

    const handleOffline = () => {
      console.log('Going offline - real-time updates will be paused');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isConnected, reconnect]);

  return {
    isConnected: isConnected && isOnline,
    isOnline,
    reconnect
  };
};