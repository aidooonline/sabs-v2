'use client';

import { useState, useEffect, useRef } from 'react';
import type { Customer, CustomerTransaction } from '../../../types/customer';

interface UseCustomerRealTimeReturn {
  customer: Customer | null;
  isConnected: boolean;
  lastUpdate: Date | null;
  updateCustomer: (customer: Customer) => Promise<void>;
  reconnect: () => void;
}

/**
 * Hook for real-time customer data updates using WebSocket connection
 */
export const useCustomerRealTime = (customerId: string): UseCustomerRealTimeReturn => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize WebSocket connection
  const connect = () => {
    try {
      // Use environment variable or fallback to localhost
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';
      const ws = new WebSocket(`${wsUrl}/customers/${customerId}/live`);
      
      ws.onopen = () => {
        console.log(`Connected to customer ${customerId} real-time updates`);
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        // Send initial subscription message
        ws.send(JSON.stringify({
          type: 'subscribe',
          customerId,
          timestamp: new Date().toISOString(),
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'customer_update':
              setCustomer(data.customer);
              setLastUpdate(new Date(data.timestamp));
              break;
              
            case 'account_update':
              // Update customer's account data
              setCustomer(prev => {
                if (!prev) return null;
                const updatedAccounts = prev.accounts?.map(account => 
                  account.id === data.accountId 
                    ? { ...account, ...data.account }
                    : account
                ) || [];
                return { ...prev, accounts: updatedAccounts };
              });
              setLastUpdate(new Date(data.timestamp));
              break;
              
            case 'transaction_update':
              // Add new transaction or update existing one
              setCustomer(prev => {
                if (!prev) return null;
                const existingTransactions = prev.transactions || [];
                const transactionIndex = existingTransactions.findIndex(t => t.id === data.transaction.id);
                
                let updatedTransactions;
                if (transactionIndex >= 0) {
                  updatedTransactions = [...existingTransactions];
                  updatedTransactions[transactionIndex] = data.transaction;
                } else {
                  updatedTransactions = [data.transaction, ...existingTransactions];
                }
                
                return { ...prev, transactions: updatedTransactions };
              });
              setLastUpdate(new Date(data.timestamp));
              break;
              
            case 'balance_update':
              setCustomer(prev => prev ? { ...prev, accountBalance: data.balance } : null);
              setLastUpdate(new Date(data.timestamp));
              break;
              
            case 'status_update':
              setCustomer(prev => prev ? { ...prev, ...data.updates } : null);
              setLastUpdate(new Date(data.timestamp));
              break;
              
            case 'heartbeat':
              // Keep connection alive
              ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
              break;
              
            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log(`Disconnected from customer ${customerId} real-time updates`, event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect unless it was a clean close
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Attempting to reconnect in ${delay}ms... (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      setIsConnected(false);
    }
  };

  // Manual reconnect function
  const reconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectAttempts.current = 0;
    connect();
  };

  // Update customer function for form saves
  const updateCustomer = async (updatedCustomer: Customer): Promise<void> => {
    try {
      // Send update via WebSocket for real-time sync
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'update_customer',
          customerId,
          customer: updatedCustomer,
          timestamp: new Date().toISOString(),
        }));
      }

      // Also make HTTP request to persist changes
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCustomer),
      });

      if (!response.ok) {
        throw new Error(`Failed to update customer: ${response.statusText}`);
      }

      const savedCustomer = await response.json();
      setCustomer(savedCustomer);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error; // Re-throw for error handling in components
    }
  };

  // Fetch initial customer data
  const fetchCustomerData = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}`);
      if (response.ok) {
        const customerData = await response.json();
        setCustomer(customerData);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    }
  };

  // Initialize connection and fetch initial data
  useEffect(() => {
    if (customerId) {
      fetchCustomerData();
      connect();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [customerId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Hook cleanup');
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    customer,
    isConnected,
    lastUpdate,
    updateCustomer,
    reconnect,
  };
};