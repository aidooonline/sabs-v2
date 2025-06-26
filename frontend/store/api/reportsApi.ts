import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { 
  Report, 
  ScheduledReport, 
  ReportFilters, 
  ReportTemplate,
  ReportMetrics,
  ReportAnalytics,
  ReportExport
} from '../../types/reports';

export const reportsApi = createApi({
  reducerPath: 'reportsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/reports',
    prepareHeaders: (headers, { getState }) => {
      // Add auth token if available
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Report', 'ScheduledReport', 'ReportTemplate', 'ReportMetrics'],
  endpoints: (builder) => ({
    // Get all reports with filters
    getReports: builder.query<Report[], ReportFilters>({
      query: (filters = {}) => ({
        url: '',
        params: filters,
      }),
      providesTags: ['Report'],
    }),

    // Get single report by ID
    getReport: builder.query<Report, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Report', id }],
    }),

    // Create new report
    createReport: builder.mutation<Report, Partial<Report>>({
      query: (report) => ({
        url: '',
        method: 'POST',
        body: report,
      }),
      invalidatesTags: ['Report', 'ReportMetrics'],
    }),

    // Update existing report
    updateReport: builder.mutation<Report, { id: string; updates: Partial<Report> }>({
      query: ({ id, updates }) => ({
        url: `/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Report', id },
        'ReportMetrics',
      ],
    }),

    // Delete report
    deleteReport: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Report', 'ReportMetrics'],
    }),

    // Download report
    downloadReport: builder.mutation<Blob, { id: string; format?: string }>({
      query: ({ id, format = 'pdf' }) => ({
        url: `/${id}/download`,
        method: 'GET',
        params: { format },
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Export report
    exportReport: builder.mutation<Blob, ReportExport>({
      query: (exportConfig) => ({
        url: '/export',
        method: 'POST',
        body: exportConfig,
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Get scheduled reports
    getScheduledReports: builder.query<ScheduledReport[], void>({
      query: () => '/scheduled',
      providesTags: ['ScheduledReport'],
    }),

    // Create scheduled report
    scheduleReport: builder.mutation<ScheduledReport, Partial<ScheduledReport>>({
      query: (scheduledReport) => ({
        url: '/scheduled',
        method: 'POST',
        body: scheduledReport,
      }),
      invalidatesTags: ['ScheduledReport'],
    }),

    // Update scheduled report
    updateScheduledReport: builder.mutation<ScheduledReport, { id: string; updates: Partial<ScheduledReport> }>({
      query: ({ id, updates }) => ({
        url: `/scheduled/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ScheduledReport', id },
      ],
    }),

    // Delete scheduled report
    deleteScheduledReport: builder.mutation<void, string>({
      query: (id) => ({
        url: `/scheduled/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ScheduledReport'],
    }),

    // Get report templates
    getReportTemplates: builder.query<ReportTemplate[], void>({
      query: () => '/templates',
      providesTags: ['ReportTemplate'],
    }),

    // Create report template
    createReportTemplate: builder.mutation<ReportTemplate, Partial<ReportTemplate>>({
      query: (template) => ({
        url: '/templates',
        method: 'POST',
        body: template,
      }),
      invalidatesTags: ['ReportTemplate'],
    }),

    // Get report metrics
    getReportMetrics: builder.query<ReportMetrics, void>({
      query: () => '/metrics',
      providesTags: ['ReportMetrics'],
    }),

    // Get report analytics
    getReportAnalytics: builder.query<ReportAnalytics, { timeRange?: string }>({
      query: ({ timeRange = '30d' } = {}) => ({
        url: '/analytics',
        params: { timeRange },
      }),
    }),

    // Generate report from template
    generateFromTemplate: builder.mutation<Report, { templateId: string; config: any }>({
      query: ({ templateId, config }) => ({
        url: `/templates/${templateId}/generate`,
        method: 'POST',
        body: config,
      }),
      invalidatesTags: ['Report', 'ReportMetrics'],
    }),

    // Duplicate report
    duplicateReport: builder.mutation<Report, string>({
      query: (id) => ({
        url: `/${id}/duplicate`,
        method: 'POST',
      }),
      invalidatesTags: ['Report'],
    }),

    // Share report
    shareReport: builder.mutation<{ shareUrl: string }, { id: string; recipients: string[] }>({
      query: ({ id, recipients }) => ({
        url: `/${id}/share`,
        method: 'POST',
        body: { recipients },
      }),
    }),

    // Get report status
    getReportStatus: builder.query<{ status: string; progress: number }, string>({
      query: (id) => `/${id}/status`,
    }),

    // Cancel report generation
    cancelReport: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Report', id }],
    }),

    // Get user's recent reports
    getUserReports: builder.query<Report[], { userId?: string; limit?: number }>({
      query: ({ userId = 'current', limit = 10 } = {}) => ({
        url: '/user',
        params: { userId, limit },
      }),
      providesTags: ['Report'],
    }),

    // Get system report health
    getReportHealth: builder.query<{
      queueLength: number;
      avgProcessingTime: number;
      errorRate: number;
      systemLoad: number;
    }, void>({
      query: () => '/health',
    }),
  }),
});

export const {
  useGetReportsQuery,
  useGetReportQuery,
  useCreateReportMutation,
  useUpdateReportMutation,
  useDeleteReportMutation,
  useDownloadReportMutation,
  useExportReportMutation,
  useGetScheduledReportsQuery,
  useScheduleReportMutation,
  useUpdateScheduledReportMutation,
  useDeleteScheduledReportMutation,
  useGetReportTemplatesQuery,
  useCreateReportTemplateMutation,
  useGetReportMetricsQuery,
  useGetReportAnalyticsQuery,
  useGenerateFromTemplateMutation,
  useDuplicateReportMutation,
  useShareReportMutation,
  useGetReportStatusQuery,
  useCancelReportMutation,
  useGetUserReportsQuery,
  useGetReportHealthQuery,
} = reportsApi;