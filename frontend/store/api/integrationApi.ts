import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface IntegrationConnection {
  id: string;
  name: string;
  type: 'bank_api' | 'payment_processor' | 'crm' | 'accounting' | 'compliance' | 'custom';
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSync: string;
  nextSync?: string;
  config: {
    apiUrl: string;
    authType: 'api_key' | 'oauth2' | 'basic' | 'token';
    credentials: Record<string, string>;
    syncInterval: number; // in minutes
    dataMapping: Record<string, string>;
  };
  metadata: {
    version: string;
    provider: string;
    description: string;
    capabilities: string[];
  };
  healthMetrics: {
    uptime: number;
    latency: number;
    errorRate: number;
    lastError?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationSync {
  id: string;
  connectionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: Array<{
    record: string;
    error: string;
    timestamp: string;
  }>;
}

export interface DataMapping {
  id: string;
  connectionId: string;
  sourceField: string;
  targetField: string;
  transformation?: string;
  required: boolean;
  validation?: string;
}

export interface WebhookConfig {
  id: string;
  connectionId: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  lastTriggered?: string;
  deliveryCount: number;
  successCount: number;
  failureCount: number;
}

export const integrationApi = createApi({
  reducerPath: 'integrationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/integrations',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Integration', 'Sync', 'Mapping', 'Webhook', 'Health'],
  endpoints: (builder) => ({
    // Connection Management
    getConnections: builder.query<IntegrationConnection[], { type?: string; status?: string }>({
      query: (filters = {}) => ({
        url: '/connections',
        params: filters,
      }),
      providesTags: ['Integration'],
    }),

    getConnection: builder.query<IntegrationConnection, string>({
      query: (id) => `/connections/${id}`,
      providesTags: (result, error, id) => [{ type: 'Integration', id }],
    }),

    createConnection: builder.mutation<IntegrationConnection, Partial<IntegrationConnection>>({
      query: (connection) => ({
        url: '/connections',
        method: 'POST',
        body: connection,
      }),
      invalidatesTags: ['Integration'],
    }),

    updateConnection: builder.mutation<IntegrationConnection, { id: string; updates: Partial<IntegrationConnection> }>({
      query: ({ id, updates }) => ({
        url: `/connections/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Integration', id },
        'Health',
      ],
    }),

    deleteConnection: builder.mutation<void, string>({
      query: (id) => ({
        url: `/connections/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Integration'],
    }),

    // Connection Testing
    testConnection: builder.mutation<{ success: boolean; message: string; latency?: number }, string>({
      query: (id) => ({
        url: `/connections/${id}/test`,
        method: 'POST',
      }),
    }),

    // Synchronization
    startSync: builder.mutation<IntegrationSync, { connectionId: string; options?: Record<string, any> }>({
      query: ({ connectionId, options = {} }) => ({
        url: `/connections/${connectionId}/sync`,
        method: 'POST',
        body: options,
      }),
      invalidatesTags: ['Sync'],
    }),

    getSyncHistory: builder.query<IntegrationSync[], { connectionId?: string; limit?: number }>({
      query: ({ connectionId, limit = 50 } = {}) => ({
        url: '/syncs',
        params: { connectionId, limit },
      }),
      providesTags: ['Sync'],
    }),

    getSyncStatus: builder.query<IntegrationSync, string>({
      query: (syncId) => `/syncs/${syncId}`,
      providesTags: (result, error, id) => [{ type: 'Sync', id }],
    }),

    cancelSync: builder.mutation<void, string>({
      query: (syncId) => ({
        url: `/syncs/${syncId}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: ['Sync'],
    }),

    // Data Mapping
    getMappings: builder.query<DataMapping[], string>({
      query: (connectionId) => `/connections/${connectionId}/mappings`,
      providesTags: ['Mapping'],
    }),

    createMapping: builder.mutation<DataMapping, Partial<DataMapping>>({
      query: (mapping) => ({
        url: '/mappings',
        method: 'POST',
        body: mapping,
      }),
      invalidatesTags: ['Mapping'],
    }),

    updateMapping: builder.mutation<DataMapping, { id: string; updates: Partial<DataMapping> }>({
      query: ({ id, updates }) => ({
        url: `/mappings/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['Mapping'],
    }),

    deleteMapping: builder.mutation<void, string>({
      query: (id) => ({
        url: `/mappings/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Mapping'],
    }),

    // Webhook Management
    getWebhooks: builder.query<WebhookConfig[], string>({
      query: (connectionId) => `/connections/${connectionId}/webhooks`,
      providesTags: ['Webhook'],
    }),

    createWebhook: builder.mutation<WebhookConfig, Partial<WebhookConfig>>({
      query: (webhook) => ({
        url: '/webhooks',
        method: 'POST',
        body: webhook,
      }),
      invalidatesTags: ['Webhook'],
    }),

    updateWebhook: builder.mutation<WebhookConfig, { id: string; updates: Partial<WebhookConfig> }>({
      query: ({ id, updates }) => ({
        url: `/webhooks/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['Webhook'],
    }),

    deleteWebhook: builder.mutation<void, string>({
      query: (id) => ({
        url: `/webhooks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Webhook'],
    }),

    testWebhook: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/webhooks/${id}/test`,
        method: 'POST',
      }),
    }),

    // Health Monitoring
    getSystemHealth: builder.query<{
      overallStatus: 'healthy' | 'degraded' | 'down';
      activeConnections: number;
      activeSyncs: number;
      avgLatency: number;
      errorRate: number;
      lastChecked: string;
    }, void>({
      query: () => '/health',
      providesTags: ['Health'],
    }),

    getConnectionHealth: builder.query<{
      status: 'healthy' | 'degraded' | 'down';
      uptime: number;
      latency: number;
      errorRate: number;
      lastSync: string;
      nextSync?: string;
    }, string>({
      query: (connectionId) => `/connections/${connectionId}/health`,
      providesTags: (result, error, id) => [{ type: 'Health', id }],
    }),

    // Data Export/Import
    exportConnectionData: builder.mutation<Blob, { connectionId: string; format: 'json' | 'csv'; filters?: Record<string, any> }>({
      query: ({ connectionId, format, filters = {} }) => ({
        url: `/connections/${connectionId}/export`,
        method: 'POST',
        body: { format, filters },
        responseHandler: (response) => response.blob(),
      }),
    }),

    importConnectionData: builder.mutation<{ imported: number; skipped: number; errors: string[] }, { connectionId: string; file: File }>({
      query: ({ connectionId, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/connections/${connectionId}/import`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Integration', 'Sync'],
    }),

    // Available Integrations Catalog
    getAvailableIntegrations: builder.query<Array<{
      type: string;
      name: string;
      description: string;
      provider: string;
      version: string;
      capabilities: string[];
      authMethods: string[];
      documentation: string;
    }>, void>({
      query: () => '/catalog',
    }),

    // Audit Trail
    getAuditTrail: builder.query<Array<{
      id: string;
      connectionId: string;
      action: string;
      userId: string;
      timestamp: string;
      details: Record<string, any>;
    }>, { connectionId?: string; limit?: number }>({
      query: ({ connectionId, limit = 100 } = {}) => ({
        url: '/audit',
        params: { connectionId, limit },
      }),
    }),
  }),
});

export const {
  useGetConnectionsQuery,
  useGetConnectionQuery,
  useCreateConnectionMutation,
  useUpdateConnectionMutation,
  useDeleteConnectionMutation,
  useTestConnectionMutation,
  useStartSyncMutation,
  useGetSyncHistoryQuery,
  useGetSyncStatusQuery,
  useCancelSyncMutation,
  useGetMappingsQuery,
  useCreateMappingMutation,
  useUpdateMappingMutation,
  useDeleteMappingMutation,
  useGetWebhooksQuery,
  useCreateWebhookMutation,
  useUpdateWebhookMutation,
  useDeleteWebhookMutation,
  useTestWebhookMutation,
  useGetSystemHealthQuery,
  useGetConnectionHealthQuery,
  useExportConnectionDataMutation,
  useImportConnectionDataMutation,
  useGetAvailableIntegrationsQuery,
  useGetAuditTrailQuery,
} = integrationApi;