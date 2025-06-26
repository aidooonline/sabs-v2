import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { 
  Customer,
  CustomerListResponse,
  CustomerQuery,
  CustomerTransaction,
  CustomerStats,
  CustomerDocument,
  CustomerRiskAssessment,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerExportOptions,
  BulkCustomerOperation,
  Account
} from '../../types/customer';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export const customerApi = createApi({
  reducerPath: 'customerApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/customers`,
    prepareHeaders: (headers, { getState }) => {
      // Get token from auth state
      const token = (getState() as any)?.auth?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Customer', 'CustomerTransaction', 'CustomerDocument', 'CustomerStats'],
  endpoints: (builder) => ({
    // Get customers with pagination and filters
    getCustomers: builder.query<CustomerListResponse, CustomerQuery>({
      query: (params) => ({
        url: '',
        params: {
          ...params,
          ...(params.filters && Object.keys(params.filters).length > 0 && { ...params.filters }),
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.customers.map(({ id }) => ({ type: 'Customer' as const, id })),
              { type: 'Customer', id: 'LIST' },
            ]
          : [{ type: 'Customer', id: 'LIST' }],
    }),

    // Get customer by ID
    getCustomerById: builder.query<Customer, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Customer', id }],
    }),

    // Create new customer
    createCustomer: builder.mutation<Customer, CreateCustomerRequest>({
      query: (data) => ({
        url: '',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Customer', id: 'LIST' }],
    }),

    // Update customer
    updateCustomer: builder.mutation<Customer, { id: string; data: UpdateCustomerRequest }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Customer', id },
        { type: 'Customer', id: 'LIST' },
      ],
    }),

    // Delete customer (soft delete)
    deleteCustomer: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Customer', id },
        { type: 'Customer', id: 'LIST' },
      ],
    }),

    // Search customers
    searchCustomers: builder.query<Customer[], { query: string; filters?: any }>({
      query: ({ query, filters }) => ({
        url: '/search',
        params: { q: query, ...filters },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Customer' as const, id })),
              { type: 'Customer', id: 'SEARCH' },
            ]
          : [{ type: 'Customer', id: 'SEARCH' }],
    }),

    // Get customer accounts
    getCustomerAccounts: builder.query<Account[], string>({
      query: (customerId) => `/${customerId}/accounts`,
      providesTags: (result, error, customerId) => [
        { type: 'Customer', id: `${customerId}-accounts` },
      ],
    }),

    // Get customer transactions
    getCustomerTransactions: builder.query<
      { transactions: CustomerTransaction[]; pagination: any },
      {
        customerId: string;
        page?: number;
        limit?: number;
        startDate?: string;
        endDate?: string;
        type?: string;
        status?: string;
      }
    >({
      query: ({ customerId, ...params }) => ({
        url: `/${customerId}/transactions`,
        params,
      }),
      providesTags: (result, error, { customerId }) => [
        { type: 'CustomerTransaction', id: customerId },
      ],
    }),

    // Get customer statistics
    getCustomerStats: builder.query<CustomerStats, string>({
      query: (customerId) => `/${customerId}/stats`,
      providesTags: (result, error, customerId) => [
        { type: 'CustomerStats', id: customerId },
      ],
    }),

    // Upload customer document
    uploadCustomerDocument: builder.mutation<
      CustomerDocument,
      { customerId: string; file: File; documentType: string }
    >({
      query: ({ customerId, file, documentType }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);
        
        return {
          url: `/${customerId}/documents`,
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: (result, error, { customerId }) => [
        { type: 'CustomerDocument', id: customerId },
        { type: 'Customer', id: customerId },
      ],
    }),

    // Get customer documents
    getCustomerDocuments: builder.query<CustomerDocument[], string>({
      query: (customerId) => `/${customerId}/documents`,
      providesTags: (result, error, customerId) => [
        { type: 'CustomerDocument', id: customerId },
      ],
    }),

    // Verify customer identity
    verifyCustomer: builder.mutation<
      { verificationId: string; status: string; verifiedAt?: string },
      { 
        customerId: string;
        verificationData: {
          documentType: string;
          documentNumber: string;
          verificationMethod: string;
        };
      }
    >({
      query: ({ customerId, verificationData }) => ({
        url: `/${customerId}/verify`,
        method: 'POST',
        body: verificationData,
      }),
      invalidatesTags: (result, error, { customerId }) => [
        { type: 'Customer', id: customerId },
        { type: 'Customer', id: 'LIST' },
      ],
    }),

    // Update customer status
    updateCustomerStatus: builder.mutation<
      Customer,
      { customerId: string; status: 'active' | 'inactive' | 'suspended' | 'pending' }
    >({
      query: ({ customerId, status }) => ({
        url: `/${customerId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { customerId }) => [
        { type: 'Customer', id: customerId },
        { type: 'Customer', id: 'LIST' },
      ],
    }),

    // Get customers by agent
    getCustomersByAgent: builder.query<
      CustomerListResponse,
      { agentId: string; page?: number; limit?: number }
    >({
      query: ({ agentId, ...params }) => ({
        url: `/agent/${agentId}`,
        params,
      }),
      providesTags: (result, error, { agentId }) => [
        { type: 'Customer', id: `agent-${agentId}` },
      ],
    }),

    // Bulk create customers
    bulkCreateCustomers: builder.mutation<
      {
        successful: number;
        failed: number;
        total: number;
        errors?: Array<{ index: number; error: string }>;
      },
      CreateCustomerRequest[]
    >({
      query: (customers) => ({
        url: '/bulk',
        method: 'POST',
        body: { customers },
      }),
      invalidatesTags: [{ type: 'Customer', id: 'LIST' }],
    }),

    // Export customers
    exportCustomers: builder.mutation<
      { downloadUrl: string; fileName: string; recordCount: number },
      CustomerExportOptions
    >({
      query: (options) => ({
        url: '/export',
        method: 'POST',
        body: options,
      }),
    }),

    // Get customer insights/analytics
    getCustomerInsights: builder.query<
      {
        riskScore: number;
        creditworthiness: string;
        transactionPatterns: Array<{
          pattern: string;
          frequency: number;
          lastOccurrence: string;
        }>;
        recommendations: string[];
      },
      string
    >({
      query: (customerId) => `/${customerId}/insights`,
      providesTags: (result, error, customerId) => [
        { type: 'Customer', id: `${customerId}-insights` },
      ],
    }),

    // Get customer risk assessment
    getCustomerRiskAssessment: builder.query<CustomerRiskAssessment, string>({
      query: (customerId) => `/${customerId}/risk-assessment`,
      providesTags: (result, error, customerId) => [
        { type: 'Customer', id: `${customerId}-risk` },
      ],
    }),

    // Bulk operations
    bulkCustomerOperation: builder.mutation<
      { success: boolean; message: string; affected: number },
      BulkCustomerOperation
    >({
      query: (operation) => ({
        url: '/bulk-operation',
        method: 'POST',
        body: operation,
      }),
      invalidatesTags: (result, error, { customerIds }) => [
        ...customerIds.map((id) => ({ type: 'Customer' as const, id })),
        { type: 'Customer', id: 'LIST' },
      ],
    }),
  }),
});

// Export hooks for components to use
export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useSearchCustomersQuery,
  useLazySearchCustomersQuery,
  useGetCustomerAccountsQuery,
  useGetCustomerTransactionsQuery,
  useGetCustomerStatsQuery,
  useUploadCustomerDocumentMutation,
  useGetCustomerDocumentsQuery,
  useVerifyCustomerMutation,
  useUpdateCustomerStatusMutation,
  useGetCustomersByAgentQuery,
  useBulkCreateCustomersMutation,
  useExportCustomersMutation,
  useGetCustomerInsightsQuery,
  useGetCustomerRiskAssessmentQuery,
  useBulkCustomerOperationMutation,
} = customerApi;

// Export middleware for store configuration
export const customerApiMiddleware = customerApi.middleware;