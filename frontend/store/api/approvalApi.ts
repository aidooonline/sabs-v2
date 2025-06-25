import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';
import type {
  ApprovalWorkflow,
  ApprovalWorkflowQuery,
  ApprovalWorkflowListResponse,
  ApprovalWorkflowResponse,
  ApprovalDecisionRequest,
  ApprovalDecisionResponse,
  BulkApprovalRequest,
  EscalationRequest,
  CommentRequest,
  WorkflowComment,
  DashboardStatsResponse,
  WorkflowPermissions,
} from '../../types/approval';

// Base URL for approval workflow service endpoints
const APPROVAL_WORKFLOW_BASE_URL = '/api/approval-workflow';

export const approvalApi = createApi({
  reducerPath: 'approvalApi',
  baseQuery: fetchBaseQuery({
    baseUrl: APPROVAL_WORKFLOW_BASE_URL,
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
    'ApprovalWorkflow',
    'WorkflowComments',
    'DashboardStats',
    'UserPermissions',
    'AuditLog',
  ],
  endpoints: (builder) => ({
    // ===== WORKFLOW QUEUE MANAGEMENT ENDPOINTS =====
    
    getWorkflows: builder.query<ApprovalWorkflowListResponse, ApprovalWorkflowQuery>({
      query: (params = {}) => ({
        url: '/workflows',
        params: {
          page: 1,
          limit: 20,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
          ...params,
        },
      }),
      providesTags: ['ApprovalWorkflow'],
      // Cache for 2 minutes (workflows change frequently)
      keepUnusedDataFor: 120,
    }),

    getWorkflow: builder.query<ApprovalWorkflowResponse, string>({
      query: (workflowId) => `/workflows/${workflowId}`,
      providesTags: (_result, _error, workflowId) => [
        { type: 'ApprovalWorkflow', id: workflowId },
      ],
      // Cache for 1 minute (individual workflows need fresh data)
      keepUnusedDataFor: 60,
    }),

    getWorkflowPermissions: builder.query<WorkflowPermissions, string>({
      query: (workflowId) => `/workflows/${workflowId}/permissions`,
      providesTags: (_result, _error, workflowId) => [
        { type: 'UserPermissions', id: workflowId },
      ],
      // Cache for 5 minutes (permissions don't change often)
      keepUnusedDataFor: 300,
    }),

    // ===== APPROVAL DECISION ENDPOINTS =====

    approveWorkflow: builder.mutation<ApprovalDecisionResponse, ApprovalDecisionRequest>({
      query: (decisionData) => ({
        url: `/workflows/${decisionData.workflowId}/approve`,
        method: 'POST',
        body: decisionData,
      }),
      invalidatesTags: ['ApprovalWorkflow', 'DashboardStats'],
    }),

    rejectWorkflow: builder.mutation<ApprovalDecisionResponse, ApprovalDecisionRequest>({
      query: (decisionData) => ({
        url: `/workflows/${decisionData.workflowId}/reject`,
        method: 'POST',
        body: decisionData,
      }),
      invalidatesTags: ['ApprovalWorkflow', 'DashboardStats'],
    }),

    escalateWorkflow: builder.mutation<ApprovalDecisionResponse, EscalationRequest>({
      query: (escalationData) => ({
        url: `/workflows/${escalationData.workflowId}/escalate`,
        method: 'POST',
        body: escalationData,
      }),
      invalidatesTags: ['ApprovalWorkflow', 'DashboardStats'],
    }),

    requestAdditionalInfo: builder.mutation<ApprovalDecisionResponse, ApprovalDecisionRequest>({
      query: (requestData) => ({
        url: `/workflows/${requestData.workflowId}/request-info`,
        method: 'POST',
        body: requestData,
      }),
      invalidatesTags: ['ApprovalWorkflow'],
    }),

    conditionalApprove: builder.mutation<ApprovalDecisionResponse, ApprovalDecisionRequest>({
      query: (approvalData) => ({
        url: `/workflows/${approvalData.workflowId}/conditional-approve`,
        method: 'POST',
        body: approvalData,
      }),
      invalidatesTags: ['ApprovalWorkflow', 'DashboardStats'],
    }),

    overrideDecision: builder.mutation<ApprovalDecisionResponse, ApprovalDecisionRequest>({
      query: (overrideData) => ({
        url: `/workflows/${overrideData.workflowId}/override`,
        method: 'POST',
        body: overrideData,
      }),
      invalidatesTags: ['ApprovalWorkflow', 'DashboardStats', 'AuditLog'],
    }),

    // ===== BULK OPERATIONS ENDPOINTS =====

    bulkApprove: builder.mutation<
      { success: boolean; results: ApprovalDecisionResponse[]; errors: any[] },
      BulkApprovalRequest
    >({
      query: (bulkData) => ({
        url: '/workflows/bulk/approve',
        method: 'POST',
        body: bulkData,
      }),
      invalidatesTags: ['ApprovalWorkflow', 'DashboardStats'],
    }),

    bulkReject: builder.mutation<
      { success: boolean; results: ApprovalDecisionResponse[]; errors: any[] },
      BulkApprovalRequest
    >({
      query: (bulkData) => ({
        url: '/workflows/bulk/reject',
        method: 'POST',
        body: bulkData,
      }),
      invalidatesTags: ['ApprovalWorkflow', 'DashboardStats'],
    }),

    bulkEscalate: builder.mutation<
      { success: boolean; results: ApprovalDecisionResponse[]; errors: any[] },
      BulkApprovalRequest & { escalateTo: string; reason: string }
    >({
      query: (bulkData) => ({
        url: '/workflows/bulk/escalate',
        method: 'POST',
        body: bulkData,
      }),
      invalidatesTags: ['ApprovalWorkflow', 'DashboardStats'],
    }),

    // ===== WORKFLOW ASSIGNMENT ENDPOINTS =====

    assignWorkflow: builder.mutation<
      { success: boolean; message: string; workflow: ApprovalWorkflow },
      { workflowId: string; assignTo: string; notes?: string }
    >({
      query: ({ workflowId, ...assignmentData }) => ({
        url: `/workflows/${workflowId}/assign`,
        method: 'POST',
        body: assignmentData,
      }),
      invalidatesTags: ['ApprovalWorkflow'],
    }),

    reassignWorkflow: builder.mutation<
      { success: boolean; message: string; workflow: ApprovalWorkflow },
      { workflowId: string; reassignTo: string; reason: string }
    >({
      query: ({ workflowId, ...reassignData }) => ({
        url: `/workflows/${workflowId}/reassign`,
        method: 'POST',
        body: reassignData,
      }),
      invalidatesTags: ['ApprovalWorkflow'],
    }),

    // ===== WORKFLOW COMMENTS ENDPOINTS =====

    getWorkflowComments: builder.query<WorkflowComment[], string>({
      query: (workflowId) => `/workflows/${workflowId}/comments`,
      providesTags: (_result, _error, workflowId) => [
        { type: 'WorkflowComments', id: workflowId },
      ],
      // Cache for 30 seconds (comments need to be fresh)
      keepUnusedDataFor: 30,
    }),

    addWorkflowComment: builder.mutation<
      { success: boolean; comment: WorkflowComment },
      CommentRequest
    >({
      query: ({ workflowId, ...commentData }) => ({
        url: `/workflows/${workflowId}/comments`,
        method: 'POST',
        body: commentData,
      }),
      invalidatesTags: (_result, _error, { workflowId }) => [
        { type: 'WorkflowComments', id: workflowId },
      ],
    }),

    updateWorkflowComment: builder.mutation<
      { success: boolean; comment: WorkflowComment },
      { workflowId: string; commentId: string; content: string }
    >({
      query: ({ workflowId, commentId, content }) => ({
        url: `/workflows/${workflowId}/comments/${commentId}`,
        method: 'PUT',
        body: { content },
      }),
      invalidatesTags: (_result, _error, { workflowId }) => [
        { type: 'WorkflowComments', id: workflowId },
      ],
    }),

    deleteWorkflowComment: builder.mutation<
      { success: boolean; message: string },
      { workflowId: string; commentId: string }
    >({
      query: ({ workflowId, commentId }) => ({
        url: `/workflows/${workflowId}/comments/${commentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { workflowId }) => [
        { type: 'WorkflowComments', id: workflowId },
      ],
    }),

    // ===== SLA MANAGEMENT ENDPOINTS =====

    extendSLA: builder.mutation<
      { success: boolean; message: string; workflow: ApprovalWorkflow },
      { workflowId: string; extensionHours: number; reason: string }
    >({
      query: ({ workflowId, ...extensionData }) => ({
        url: `/workflows/${workflowId}/extend-sla`,
        method: 'POST',
        body: extensionData,
      }),
      invalidatesTags: ['ApprovalWorkflow'],
    }),

    updatePriority: builder.mutation<
      { success: boolean; message: string; workflow: ApprovalWorkflow },
      { workflowId: string; priority: string; reason: string }
    >({
      query: ({ workflowId, ...priorityData }) => ({
        url: `/workflows/${workflowId}/priority`,
        method: 'PUT',
        body: priorityData,
      }),
      invalidatesTags: ['ApprovalWorkflow'],
    }),

    // ===== DASHBOARD ANALYTICS ENDPOINTS =====

    getDashboardStats: builder.query<DashboardStatsResponse, void>({
      query: () => '/dashboard/stats',
      providesTags: ['DashboardStats'],
      // Cache for 5 minutes
      keepUnusedDataFor: 300,
    }),

    getQueueMetrics: builder.query<{
      totalPending: number;
      totalApproved: number;
      totalRejected: number;
      averageProcessingTime: number;
      slaCompliance: number;
      riskDistribution: Array<{ riskLevel: string; count: number }>;
    }, void>({
      query: () => '/dashboard/queue-metrics',
      providesTags: ['DashboardStats'],
      // Cache for 2 minutes
      keepUnusedDataFor: 120,
    }),

    getPerformanceMetrics: builder.query<{
      approvalsToday: number;
      approvalsThisWeek: number;
      approvalsThisMonth: number;
      averageApprovalTime: number;
      accuracyRate: number;
      workloadDistribution: Array<{ userId: string; userName: string; pendingCount: number }>;
    }, void>({
      query: () => '/dashboard/performance',
      providesTags: ['DashboardStats'],
      // Cache for 10 minutes
      keepUnusedDataFor: 600,
    }),

    // ===== AUDIT AND COMPLIANCE ENDPOINTS =====

    getAuditLog: builder.query<{
      entries: Array<{
        id: string;
        timestamp: string;
        userId: string;
        userName: string;
        action: string;
        details: Record<string, any>;
      }>;
      pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
      };
    }, { workflowId?: string; page?: number; limit?: number }>({
      query: (params) => ({
        url: '/audit-log',
        params,
      }),
      providesTags: ['AuditLog'],
      // Cache for 5 minutes
      keepUnusedDataFor: 300,
    }),

    exportWorkflows: builder.mutation<
      { success: boolean; downloadUrl: string; filename: string },
      { format: 'csv' | 'pdf' | 'excel'; filters?: ApprovalWorkflowQuery }
    >({
      query: (exportData) => ({
        url: '/workflows/export',
        method: 'POST',
        body: exportData,
      }),
    }),

    // ===== AUTHORIZATION CODE ENDPOINTS =====

    generateAuthorizationCode: builder.mutation<
      { success: boolean; authorizationCode: string; expiresAt: string },
      { workflowId: string; action: string }
    >({
      query: (codeData) => ({
        url: '/authorization/generate-code',
        method: 'POST',
        body: codeData,
      }),
    }),

    validateAuthorizationCode: builder.mutation<
      { success: boolean; isValid: boolean; workflow?: ApprovalWorkflow },
      { authorizationCode: string; workflowId: string }
    >({
      query: (validationData) => ({
        url: '/authorization/validate-code',
        method: 'POST',
        body: validationData,
      }),
    }),

    // ===== HEALTH CHECK ENDPOINT =====

    getHealthStatus: builder.query<{
      status: string;
      timestamp: string;
      services: {
        approvalWorkflow: string;
        authorization: string;
        notifications: string;
        auditLog: string;
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
  // Workflow Queue Management
  useGetWorkflowsQuery,
  useGetWorkflowQuery,
  useGetWorkflowPermissionsQuery,
  
  // Approval Decisions
  useApproveWorkflowMutation,
  useRejectWorkflowMutation,
  useEscalateWorkflowMutation,
  useRequestAdditionalInfoMutation,
  useConditionalApproveMutation,
  useOverrideDecisionMutation,
  
  // Bulk Operations
  useBulkApproveMutation,
  useBulkRejectMutation,
  useBulkEscalateMutation,
  
  // Workflow Assignment
  useAssignWorkflowMutation,
  useReassignWorkflowMutation,
  
  // Comments
  useGetWorkflowCommentsQuery,
  useAddWorkflowCommentMutation,
  useUpdateWorkflowCommentMutation,
  useDeleteWorkflowCommentMutation,
  
  // SLA Management
  useExtendSLAMutation,
  useUpdatePriorityMutation,
  
  // Dashboard Analytics
  useGetDashboardStatsQuery,
  useGetQueueMetricsQuery,
  useGetPerformanceMetricsQuery,
  
  // Audit and Compliance
  useGetAuditLogQuery,
  useExportWorkflowsMutation,
  
  // Authorization
  useGenerateAuthorizationCodeMutation,
  useValidateAuthorizationCodeMutation,
  
  // Health Check
  useGetHealthStatusQuery,
  
  // Lazy query hooks for conditional loading
  useLazyGetWorkflowsQuery,
  useLazyGetWorkflowQuery,
  useLazyGetDashboardStatsQuery,
  useLazyGetAuditLogQuery,
} = approvalApi;

// Export the reducer
export const approvalApiReducer = approvalApi.reducer;

// Export middleware for store configuration
export const approvalApiMiddleware = approvalApi.middleware;