import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { 
  AnalyticsData, 
  AnalyticsQuery, 
  AnalyticsResponse, 
  RealtimeMetrics, 
  RealtimeMetricsResponse,
  ActivityFeedItem,
  ComparisonData,
  CustomerSegmentation,
  TransactionAnalytics,
  PerformanceMetrics,
  RiskAnalytics,
  ExportOptions
} from '../../types/analytics';

export const analyticsApi = createApi({
  reducerPath: 'analyticsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/analytics',
    prepareHeaders: (headers, { getState }) => {
      // Add authentication headers if needed
      const token = (getState() as any).auth?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Analytics', 'RealtimeMetrics', 'ActivityFeed', 'Performance'],
  endpoints: (builder) => ({
    // Main analytics dashboard data
    getAnalytics: builder.query<AnalyticsData, AnalyticsQuery>({
      query: ({ timeRange, filters }) => ({
        url: '/dashboard',
        params: {
          timeRange,
          ...filters,
        },
      }),
      transformResponse: (response: AnalyticsResponse) => response.data,
      providesTags: ['Analytics'],
    }),

    // Real-time metrics for live dashboard updates
    getRealtimeMetrics: builder.query<RealtimeMetrics, void>({
      query: () => '/realtime',
      transformResponse: (response: RealtimeMetricsResponse) => response.data,
      providesTags: ['RealtimeMetrics'],
    }),

    // Customer analytics with segmentation
    getCustomerAnalytics: builder.query<CustomerSegmentation, AnalyticsQuery>({
      query: ({ timeRange, filters }) => ({
        url: '/customers',
        params: {
          timeRange,
          ...filters,
        },
      }),
      providesTags: ['Analytics'],
    }),

    // Transaction analytics with detailed breakdown
    getTransactionAnalytics: builder.query<TransactionAnalytics, AnalyticsQuery>({
      query: ({ timeRange, filters }) => ({
        url: '/transactions',
        params: {
          timeRange,
          ...filters,
        },
      }),
      providesTags: ['Analytics'],
    }),

    // Performance metrics for system monitoring
    getPerformanceMetrics: builder.query<PerformanceMetrics, AnalyticsQuery>({
      query: ({ timeRange, filters }) => ({
        url: '/performance',
        params: {
          timeRange,
          ...filters,
        },
      }),
      providesTags: ['Performance'],
    }),

    // Risk analytics for fraud detection and monitoring
    getRiskAnalytics: builder.query<RiskAnalytics, AnalyticsQuery>({
      query: ({ timeRange, filters }) => ({
        url: '/risk',
        params: {
          timeRange,
          ...filters,
        },
      }),
      providesTags: ['Analytics'],
    }),

    // Activity feed for recent events
    getActivityFeed: builder.query<ActivityFeedItem[], { limit?: number; offset?: number }>({
      query: ({ limit = 20, offset = 0 }) => ({
        url: '/activity',
        params: { limit, offset },
      }),
      providesTags: ['ActivityFeed'],
    }),

    // Comparison data for period-over-period analysis
    getComparisonData: builder.query<ComparisonData, {
      current: AnalyticsQuery;
      previous: AnalyticsQuery;
    }>({
      query: ({ current, previous }) => ({
        url: '/comparison',
        method: 'POST',
        body: { current, previous },
      }),
      providesTags: ['Analytics'],
    }),

    // Export analytics data
    exportAnalytics: builder.mutation<{ downloadUrl: string }, ExportOptions>({
      query: (options) => ({
        url: '/export',
        method: 'POST',
        body: options,
      }),
    }),

    // Regional analytics for Ghana-specific data
    getRegionalAnalytics: builder.query<any, AnalyticsQuery>({
      query: ({ timeRange, filters }) => ({
        url: '/regional',
        params: {
          timeRange,
          ...filters,
        },
      }),
      providesTags: ['Analytics'],
    }),

    // Customer lifecycle analytics
    getCustomerLifecycleAnalytics: builder.query<any, AnalyticsQuery>({
      query: ({ timeRange, filters }) => ({
        url: '/customer-lifecycle',
        params: {
          timeRange,
          ...filters,
        },
      }),
      providesTags: ['Analytics'],
    }),

    // Revenue analytics with forecasting
    getRevenueAnalytics: builder.query<any, AnalyticsQuery>({
      query: ({ timeRange, filters }) => ({
        url: '/revenue',
        params: {
          timeRange,
          ...filters,
        },
      }),
      providesTags: ['Analytics'],
    }),

    // Cohort analysis for customer retention
    getCohortAnalysis: builder.query<any, AnalyticsQuery>({
      query: ({ timeRange, filters }) => ({
        url: '/cohort',
        params: {
          timeRange,
          ...filters,
        },
      }),
      providesTags: ['Analytics'],
    }),

    // Funnel analysis for conversion tracking
    getFunnelAnalysis: builder.query<any, AnalyticsQuery>({
      query: ({ timeRange, filters }) => ({
        url: '/funnel',
        params: {
          timeRange,
          ...filters,
        },
      }),
      providesTags: ['Analytics'],
    }),

    // Alerts and notifications for critical metrics
    getAlerts: builder.query<any[], { severity?: string }>({
      query: ({ severity }) => ({
        url: '/alerts',
        params: severity ? { severity } : {},
      }),
      providesTags: ['Analytics'],
    }),

    // Custom query builder for advanced analytics
    runCustomQuery: builder.mutation<any, {
      query: string;
      parameters: Record<string, any>;
    }>({
      query: ({ query, parameters }) => ({
        url: '/custom-query',
        method: 'POST',
        body: { query, parameters },
      }),
    }),

    // Scheduled reports management
    getScheduledReports: builder.query<any[], void>({
      query: () => '/scheduled-reports',
      providesTags: ['Analytics'],
    }),

    createScheduledReport: builder.mutation<any, {
      name: string;
      schedule: string;
      query: AnalyticsQuery;
      recipients: string[];
      format: 'pdf' | 'excel' | 'csv';
    }>({
      query: (report) => ({
        url: '/scheduled-reports',
        method: 'POST',
        body: report,
      }),
      invalidatesTags: ['Analytics'],
    }),

    updateScheduledReport: builder.mutation<any, {
      id: string;
      updates: Partial<any>;
    }>({
      query: ({ id, updates }) => ({
        url: `/scheduled-reports/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['Analytics'],
    }),

    deleteScheduledReport: builder.mutation<void, string>({
      query: (id) => ({
        url: `/scheduled-reports/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Analytics'],
    }),
  }),
});

export const {
  useGetAnalyticsQuery,
  useGetRealtimeMetricsQuery,
  useGetCustomerAnalyticsQuery,
  useGetTransactionAnalyticsQuery,
  useGetPerformanceMetricsQuery,
  useGetRiskAnalyticsQuery,
  useGetActivityFeedQuery,
  useGetComparisonDataQuery,
  useExportAnalyticsMutation,
  useGetRegionalAnalyticsQuery,
  useGetCustomerLifecycleAnalyticsQuery,
  useGetRevenueAnalyticsQuery,
  useGetCohortAnalysisQuery,
  useGetFunnelAnalysisQuery,
  useGetAlertsQuery,
  useRunCustomQueryMutation,
  useGetScheduledReportsQuery,
  useCreateScheduledReportMutation,
  useUpdateScheduledReportMutation,
  useDeleteScheduledReportMutation,
} = analyticsApi;