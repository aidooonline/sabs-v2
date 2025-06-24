import { apiClient } from '../apiClient';
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerFilters,
  CustomerSummary,
  PaginatedResponse,
  PaginationParams,
  ApiResponse,
} from '../types';

class CustomerService {
  private readonly basePath = '/customers';

  // Get all customers with pagination and filters
  async getCustomers(
    pagination: PaginationParams,
    filters?: CustomerFilters
  ): Promise<PaginatedResponse<Customer>> {
    const params = new URLSearchParams();
    
    // Add pagination params
    params.append('page', pagination.page.toString());
    params.append('limit', pagination.limit.toString());
    
    if (pagination.search) {
      params.append('search', pagination.search);
    }
    
    if (pagination.sortBy) {
      params.append('sortBy', pagination.sortBy);
    }
    
    if (pagination.sortOrder) {
      params.append('sortOrder', pagination.sortOrder);
    }

    // Add filter params
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    return apiClient.get<PaginatedResponse<Customer>>(
      `${this.basePath}?${params.toString()}`
    );
  }

  // Get customer by ID
  async getCustomer(id: string): Promise<Customer> {
    return apiClient.get<Customer>(`${this.basePath}/${id}`);
  }

  // Create new customer
  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    return apiClient.post<Customer>(this.basePath, data);
  }

  // Update customer
  async updateCustomer(id: string, data: UpdateCustomerRequest): Promise<Customer> {
    return apiClient.put<Customer>(`${this.basePath}/${id}`, data);
  }

  // Delete customer
  async deleteCustomer(id: string): Promise<ApiResponse<null>> {
    return apiClient.delete<ApiResponse<null>>(`${this.basePath}/${id}`);
  }

  // Get customer summary/statistics
  async getCustomerSummary(): Promise<CustomerSummary> {
    return apiClient.get<CustomerSummary>(`${this.basePath}/summary`);
  }

  // Search customers by phone or name
  async searchCustomers(query: string): Promise<Customer[]> {
    const params = new URLSearchParams({ search: query });
    return apiClient.get<Customer[]>(`${this.basePath}/search?${params.toString()}`);
  }

  // Verify customer KYC
  async verifyCustomerKyc(id: string, verified: boolean): Promise<Customer> {
    return apiClient.patch<Customer>(`${this.basePath}/${id}/kyc`, { verified });
  }

  // Suspend/unsuspend customer
  async updateCustomerStatus(
    id: string,
    status: 'active' | 'inactive' | 'suspended'
  ): Promise<Customer> {
    return apiClient.patch<Customer>(`${this.basePath}/${id}/status`, { status });
  }

  // Get customer transaction history
  async getCustomerTransactions(
    id: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams();
    params.append('page', pagination.page.toString());
    params.append('limit', pagination.limit.toString());
    
    return apiClient.get<PaginatedResponse<any>>(
      `${this.basePath}/${id}/transactions?${params.toString()}`
    );
  }
}

// Export singleton instance
export const customerService = new CustomerService();
export default customerService;