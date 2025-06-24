import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Don't retry on validation errors
        if (error?.status === 422) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false, // Disable refetch on window focus for better UX
      refetchOnReconnect: true, // Refetch when reconnecting to network
    },
    mutations: {
      retry: false, // Don't retry mutations by default
      onError: (error: any) => {
        // Global mutation error handling can be added here
        console.error('Mutation error:', error);
      },
    },
  },
});

// Query key factory for consistent query key generation
export const queryKeys = {
  // Auth keys
  auth: {
    all: ['auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
    profile: () => [...queryKeys.auth.all, 'profile'] as const,
    permissions: () => [...queryKeys.auth.all, 'permissions'] as const,
    sessions: () => [...queryKeys.auth.all, 'sessions'] as const,
  },
  
  // Customer keys
  customers: {
    all: ['customers'] as const,
    lists: () => [...queryKeys.customers.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.customers.lists(), filters] as const,
    details: () => [...queryKeys.customers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
    accounts: (id: string) => [...queryKeys.customers.detail(id), 'accounts'] as const,
    transactions: (id: string, filters?: Record<string, any>) => 
      [...queryKeys.customers.detail(id), 'transactions', filters] as const,
    stats: (id: string) => [...queryKeys.customers.detail(id), 'stats'] as const,
    documents: (id: string) => [...queryKeys.customers.detail(id), 'documents'] as const,
    insights: (id: string) => [...queryKeys.customers.detail(id), 'insights'] as const,
  },
  
  // User keys
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  
  // Transaction keys
  transactions: {
    all: ['transactions'] as const,
    lists: () => [...queryKeys.transactions.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.transactions.lists(), filters] as const,
    details: () => [...queryKeys.transactions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.transactions.details(), id] as const,
  },
} as const;

// Utility functions for cache management
export const cacheUtils = {
  // Invalidate all queries for a specific entity
  invalidateEntity: (entity: keyof typeof queryKeys) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys[entity].all });
  },
  
  // Clear all cached data
  clearAll: () => {
    return queryClient.clear();
  },
  
  // Remove cached data for a specific query
  removeQuery: (queryKey: any[]) => {
    return queryClient.removeQueries({ queryKey });
  },
  
  // Set cached data for a query
  setQueryData: <T>(queryKey: any[], data: T) => {
    return queryClient.setQueryData(queryKey, data);
  },
  
  // Get cached data for a query
  getQueryData: <T>(queryKey: any[]): T | undefined => {
    return queryClient.getQueryData<T>(queryKey);
  },
  
  // Prefetch data for a query
  prefetchQuery: async (queryKey: any[], queryFn: () => Promise<any>) => {
    return queryClient.prefetchQuery({
      queryKey,
      queryFn,
    });
  },
};