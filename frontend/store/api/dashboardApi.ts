import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';
import type {
  DashboardSummary,
  CustomerAccount,
  TransactionSearchResponse,
  SpendingAnalysisResponse,
  BalanceHistoryResponse,
  InsightResponse,
  AlertResponse,
  AccountDetailsResponse,
  QuickAction,
  DashboardRequest,
  TransactionSearchRequest,
  SpendingAnalysisRequest,
  BalanceHistoryRequest,
  AlertConfigRequest,
} from '../../types/dashboard';

// Base URL for mobile dashboard service endpoints
const MOBILE_DASHBOARD_BASE_URL = '/api/mobile-dashboard';

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: fetchBaseQuery({
    baseUrl: MOBILE_DASHBOARD_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      // Add authorization header from auth state
      const state = getState() as RootState;
      const token = state.auth?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: [
    'DashboardSummary',
    'Accounts', 
    'Transactions',
    'Analytics',
    'Insights',
    'Alerts',
    'QuickActions',
  ],
  endpoints: (builder) => ({
    // ===== DASHBOARD OVERVIEW ENDPOINTS =====
    
    getDashboardSummary: builder.query<DashboardSummary, Partial<DashboardRequest>>({
      query: (params = {}) => ({
        url: '/summary',
        params: {
          includeInsights: true,
          includeAlerts: true,
          transactionLimit: 10,
          period: 'month',
          ...params,
        },
      }),
      providesTags: ['DashboardSummary'],
      // Cache for 5 minutes
      keepUnusedDataFor: 300,
    }),

    getAccounts: builder.query<CustomerAccount[], void>({
      query: () => '/accounts',
      providesTags: ['Accounts'],
      // Cache for 10 minutes
      keepUnusedDataFor: 600,
    }),

    getAccountDetails: builder.query<AccountDetailsResponse, string>({
      query: (accountId) => `/accounts/${accountId}`,
      providesTags: (_result, _error, accountId) => [
        { type: 'Accounts', id: accountId },
      ],
      // Cache for 5 minutes
      keepUnusedDataFor: 300,
    }),

    getQuickActions: builder.query<QuickAction[], void>({
      query: () => '/quick-actions',
      providesTags: ['QuickActions'],
      // Cache for 30 minutes (quick actions don't change often)
      keepUnusedDataFor: 1800,
    }),

    // ===== TRANSACTION ENDPOINTS =====

    searchTransactions: builder.query<TransactionSearchResponse, TransactionSearchRequest>({
      query: (params) => ({
        url: '/transactions',
        params: {
          page: 1,
          limit: 20,
          ...params,
          startDate: params.startDate?.toISOString(),
          endDate: params.endDate?.toISOString(),
        },
      }),
      providesTags: ['Transactions'],
      // Cache for 2 minutes (transactions change frequently)
      keepUnusedDataFor: 120,
    }),

    getTransactionCategories: builder.query<
      Array<{ category: string; count: number; totalAmount: number }>,
      void
    >({
      query: () => '/transactions/categories',
      providesTags: ['Transactions'],
      // Cache for 10 minutes
      keepUnusedDataFor: 600,
    }),

    // ===== BALANCE & ANALYTICS ENDPOINTS =====

    getBalanceHistory: builder.query<BalanceHistoryResponse, BalanceHistoryRequest>({
      query: (params) => ({
        url: '/balance/history',
        params: {
          period: 'month',
          ...params,
          startDate: params.startDate?.toISOString(),
          endDate: params.endDate?.toISOString(),
        },
      }),
      providesTags: ['Analytics'],
      // Cache for 5 minutes
      keepUnusedDataFor: 300,
    }),

    getSpendingAnalysis: builder.query<SpendingAnalysisResponse, SpendingAnalysisRequest>({
      query: (params) => ({
        url: '/spending/analysis',
        params: {
          period: 'month',
          groupBy: 'category',
          ...params,
        },
      }),
      providesTags: ['Analytics'],
      // Cache for 5 minutes
      keepUnusedDataFor: 300,
    }),

    getFinancialInsights: builder.query<InsightResponse, void>({
      query: () => '/insights',
      providesTags: ['Insights'],
      // Cache for 1 hour (insights are computationally expensive)
      keepUnusedDataFor: 3600,
    }),

    // ===== ALERT MANAGEMENT ENDPOINTS =====

    getAlerts: builder.query<AlertResponse, void>({
      query: () => '/alerts',
      providesTags: ['Alerts'],
      // Cache for 2 minutes (alerts need to be fresh)
      keepUnusedDataFor: 120,
    }),

    createAlert: builder.mutation<
      { success: boolean; alertId: string; message: string },
      AlertConfigRequest
    >({
      query: (alertConfig) => ({
        url: '/alerts',
        method: 'POST',
        body: alertConfig,
      }),
      invalidatesTags: ['Alerts'],
    }),

    acknowledgeAlert: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (alertId) => ({
        url: `/alerts/${alertId}/acknowledge`,
        method: 'PUT',
      }),
      invalidatesTags: ['Alerts'],
    }),

    // ===== BUDGET MANAGEMENT ENDPOINTS =====

    getBudgets: builder.query<{
      budgets: Array<{
        id: string;
        category: string;
        amount: number;
        spent: number;
        remaining: number;
        period: string;
        status: 'on_track' | 'warning' | 'exceeded';
      }>;
      totalBudget: number;
      totalSpent: number;
      totalRemaining: number;
    }, void>({
      query: () => '/budgets',
      providesTags: ['Analytics'],
      // Cache for 10 minutes
      keepUnusedDataFor: 600,
    }),

    setBudget: builder.mutation<
      { success: boolean; budgetId: string; message: string },
      {
        category: string;
        amount: number;
        period: 'week' | 'month' | 'quarter' | 'year';
        startDate?: string;
        endDate?: string;
      }
    >({
      query: (budgetData) => ({
        url: '/budgets',
        method: 'POST',
        body: budgetData,
      }),
      invalidatesTags: ['Analytics'],
    }),

    // ===== DASHBOARD STATS & HEALTH ENDPOINTS =====

    getDashboardStats: builder.query<{
      accountStats: {
        totalAccounts: number;
        activeAccounts: number;
        totalBalance: number;
        averageBalance: number;
      };
      transactionStats: {
        thisMonth: { count: number; volume: number };
        lastMonth: { count: number; volume: number };
        thisYear: { count: number; volume: number };
      };
      alertStats: {
        totalAlerts: number;
        activeAlerts: number;
        acknowledgedAlerts: number;
      };
    }, void>({
      query: () => '/stats',
      providesTags: ['DashboardSummary'],
      // Cache for 10 minutes
      keepUnusedDataFor: 600,
    }),

    getHealthStatus: builder.query<{
      status: string;
      timestamp: string;
      services: {
        dashboard: string;
        analytics: string;
        alerts: string;
        insights: string;
      };
    }, void>({
      query: () => '/health',
      // Cache for 1 minute (health checks should be frequent)
      keepUnusedDataFor: 60,
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  // Dashboard Overview
  useGetDashboardSummaryQuery,
  useGetAccountsQuery,
  useGetAccountDetailsQuery,
  useGetQuickActionsQuery,
  
  // Transactions
  useSearchTransactionsQuery,
  useGetTransactionCategoriesQuery,
  
  // Analytics
  useGetBalanceHistoryQuery,
  useGetSpendingAnalysisQuery,
  useGetFinancialInsightsQuery,
  
  // Alerts
  useGetAlertsQuery,
  useCreateAlertMutation,
  useAcknowledgeAlertMutation,
  
  // Budgets
  useGetBudgetsQuery,
  useSetBudgetMutation,
  
  // Stats & Health
  useGetDashboardStatsQuery,
  useGetHealthStatusQuery,
  
  // Utility hooks
  useLazyGetDashboardSummaryQuery,
  useLazySearchTransactionsQuery,
  useLazyGetBalanceHistoryQuery,
  useLazyGetSpendingAnalysisQuery,
} = dashboardApi;

// Export the reducer
export const dashboardApiReducer = dashboardApi.reducer;

// Export middleware for store configuration
export const dashboardApiMiddleware = dashboardApi.middleware;