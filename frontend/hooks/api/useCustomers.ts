import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../../services/api/customerService';
import { useUI } from '../useUI';
import { queryKeys } from '../../lib/queryClient';
import { 
  PaginationParams, 
  PaginatedResponse 
} from '../../services/types/api.types';
import { 
  Customer, 
  CreateCustomerRequest, 
  UpdateCustomerRequest, 
  CustomerFilters 
} from '../../services/types/customer.types';

// Get customers with pagination and filters
export const useCustomers = (params?: PaginationParams & CustomerFilters) => {
  return useQuery({
    queryKey: queryKeys.customers.list(params || {}),
    queryFn: () => customerService.getCustomers(params),
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get single customer
export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => customerService.getCustomer(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get customer accounts
export const useCustomerAccounts = (customerId: string) => {
  return useQuery({
    queryKey: queryKeys.customers.accounts(customerId),
    queryFn: () => customerService.getCustomerAccounts(customerId),
    enabled: !!customerId,
    staleTime: 1 * 60 * 1000, // 1 minute (financial data should be fresh)
  });
};

// Get customer transactions
export const useCustomerTransactions = (
  customerId: string, 
  params?: PaginationParams & {
    startDate?: string;
    endDate?: string;
    type?: string;
    status?: string;
  }
) => {
  return useQuery({
    queryKey: queryKeys.customers.transactions(customerId, params),
    queryFn: () => customerService.getCustomerTransactions(customerId, params),
    enabled: !!customerId,
    keepPreviousData: true,
    staleTime: 30 * 1000, // 30 seconds (transaction data should be very fresh)
  });
};

// Get customer statistics
export const useCustomerStats = (customerId: string) => {
  return useQuery({
    queryKey: queryKeys.customers.stats(customerId),
    queryFn: () => customerService.getCustomerStats(customerId),
    enabled: !!customerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get customer documents
export const useCustomerDocuments = (customerId: string) => {
  return useQuery({
    queryKey: queryKeys.customers.documents(customerId),
    queryFn: () => customerService.getCustomerDocuments(customerId),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get customer insights
export const useCustomerInsights = (customerId: string) => {
  return useQuery({
    queryKey: queryKeys.customers.insights(customerId),
    queryFn: () => customerService.getCustomerInsights(customerId),
    enabled: !!customerId,
    staleTime: 10 * 60 * 1000, // 10 minutes (AI insights can be cached longer)
  });
};

// Search customers
export const useSearchCustomers = (query: string, filters?: CustomerFilters) => {
  return useQuery({
    queryKey: ['customers', 'search', query, filters],
    queryFn: () => customerService.searchCustomers(query, filters),
    enabled: query.length >= 2, // Only search with 2+ characters
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Get customers by agent
export const useCustomersByAgent = (agentId: string, params?: PaginationParams) => {
  return useQuery({
    queryKey: ['customers', 'agent', agentId, params],
    queryFn: () => customerService.getCustomersByAgent(agentId, params),
    enabled: !!agentId,
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// MUTATIONS

// Create customer mutation
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useUI();

  return useMutation({
    mutationFn: (data: CreateCustomerRequest) => customerService.createCustomer(data),
    onSuccess: (response) => {
      // Invalidate customers lists
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      
      showNotification('success', 'Customer created successfully');
      
      // Add new customer to cache
      queryClient.setQueryData(
        queryKeys.customers.detail(response.data.id), 
        response
      );
    },
    onError: (error: any) => {
      showNotification('error', error.message || 'Failed to create customer');
    },
  });
};

// Update customer mutation
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useUI();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerRequest }) =>
      customerService.updateCustomer(id, data),
    onSuccess: (response, { id }) => {
      // Update cached customer data
      queryClient.setQueryData(queryKeys.customers.detail(id), response);
      
      // Invalidate customers lists to refresh
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      
      showNotification('success', 'Customer updated successfully');
    },
    onError: (error: any) => {
      showNotification('error', error.message || 'Failed to update customer');
    },
  });
};

// Delete customer mutation
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useUI();

  return useMutation({
    mutationFn: (customerId: string) => customerService.deleteCustomer(customerId),
    onSuccess: (_, customerId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.customers.detail(customerId) });
      
      // Invalidate customers lists
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      
      showNotification('success', 'Customer deleted successfully');
    },
    onError: (error: any) => {
      showNotification('error', error.message || 'Failed to delete customer');
    },
  });
};

// Update customer status mutation
export const useUpdateCustomerStatus = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useUI();

  return useMutation({
    mutationFn: ({ 
      customerId, 
      status 
    }: { 
      customerId: string; 
      status: 'active' | 'inactive' | 'suspended' | 'pending' 
    }) => customerService.updateCustomerStatus(customerId, status),
    onSuccess: (response, { customerId }) => {
      // Update cached customer data
      queryClient.setQueryData(queryKeys.customers.detail(customerId), response);
      
      // Invalidate customers lists
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      
      showNotification('success', 'Customer status updated successfully');
    },
    onError: (error: any) => {
      showNotification('error', error.message || 'Failed to update customer status');
    },
  });
};

// Upload customer document mutation
export const useUploadCustomerDocument = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useUI();

  return useMutation({
    mutationFn: ({ 
      customerId, 
      file, 
      documentType,
      onProgress 
    }: { 
      customerId: string; 
      file: File; 
      documentType: string;
      onProgress?: (progress: number) => void;
    }) => customerService.uploadDocument(customerId, file, documentType, onProgress),
    onSuccess: (response, { customerId }) => {
      // Invalidate customer documents
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.customers.documents(customerId) 
      });
      
      showNotification('success', 'Document uploaded successfully');
    },
    onError: (error: any) => {
      showNotification('error', error.message || 'Failed to upload document');
    },
  });
};

// Verify customer mutation
export const useVerifyCustomer = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useUI();

  return useMutation({
    mutationFn: ({ 
      customerId, 
      verificationData 
    }: { 
      customerId: string; 
      verificationData: {
        documentType: string;
        documentNumber: string;
        verificationMethod: string;
      }
    }) => customerService.verifyCustomer(customerId, verificationData),
    onSuccess: (response, { customerId }) => {
      // Invalidate customer data to refresh verification status
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.customers.detail(customerId) 
      });
      
      showNotification('success', 'Customer verification initiated');
    },
    onError: (error: any) => {
      showNotification('error', error.message || 'Failed to verify customer');
    },
  });
};

// Bulk create customers mutation
export const useBulkCreateCustomers = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useUI();

  return useMutation({
    mutationFn: (customers: CreateCustomerRequest[]) => 
      customerService.bulkCreateCustomers(customers),
    onSuccess: (response) => {
      // Invalidate customers lists
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      
      const { successful, failed, total } = response.data;
      showNotification(
        'success', 
        `Bulk import completed: ${successful}/${total} customers created successfully${failed > 0 ? `, ${failed} failed` : ''}`
      );
    },
    onError: (error: any) => {
      showNotification('error', error.message || 'Failed to bulk create customers');
    },
  });
};

// Export customers mutation
export const useExportCustomers = () => {
  const { showNotification } = useUI();

  return useMutation({
    mutationFn: (filters?: CustomerFilters) => customerService.exportCustomers(filters),
    onSuccess: (response) => {
      // Trigger download
      const { downloadUrl, fileName, recordCount } = response.data;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification('success', `Exported ${recordCount} customers successfully`);
    },
    onError: (error: any) => {
      showNotification('error', error.message || 'Failed to export customers');
    },
  });
};