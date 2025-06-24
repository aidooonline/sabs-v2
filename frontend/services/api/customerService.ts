import { BaseService } from '../base/BaseService';
import { 
  Customer, 
  CreateCustomerRequest, 
  UpdateCustomerRequest,
  CustomerFilters 
} from '../types/customer.types';
import { ApiResponse, PaginationParams, PaginatedResponse } from '../types/api.types';

class CustomerService extends BaseService {
  constructor() {
    super('/customers');
  }

  // Get all customers with pagination and filters
  async getCustomers(params?: PaginationParams & CustomerFilters): Promise<PaginatedResponse<Customer>> {
    return this.getPaginated<Customer>('', params);
  }

  // Get customer by ID
  async getCustomer(id: string): Promise<ApiResponse<Customer>> {
    return this.get<Customer>(`/${id}`);
  }

  // Create new customer
  async createCustomer(data: CreateCustomerRequest): Promise<ApiResponse<Customer>> {
    return this.post<Customer>('', data);
  }

  // Update customer
  async updateCustomer(id: string, data: UpdateCustomerRequest): Promise<ApiResponse<Customer>> {
    return this.put<Customer>(`/${id}`, data);
  }

  // Delete customer (soft delete)
  async deleteCustomer(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/${id}`);
  }

  // Search customers
  async searchCustomers(query: string, filters?: CustomerFilters): Promise<ApiResponse<Customer[]>> {
    return this.search<Customer>('', query, filters);
  }

  // Get customer accounts/wallets
  async getCustomerAccounts(customerId: string): Promise<ApiResponse<Array<{
    id: string;
    accountNumber: string;
    balance: number;
    currency: string;
    accountType: string;
    status: string;
    createdAt: string;
  }>>> {
    return this.get(`/${customerId}/accounts`);
  }

  // Get customer transactions
  async getCustomerTransactions(
    customerId: string, 
    params?: PaginationParams & {
      startDate?: string;
      endDate?: string;
      type?: string;
      status?: string;
    }
  ): Promise<PaginatedResponse<any>> {
    return this.getPaginated(`/${customerId}/transactions`, params);
  }

  // Get customer statistics
  async getCustomerStats(customerId: string): Promise<ApiResponse<{
    totalTransactions: number;
    totalDeposits: number;
    totalWithdrawals: number;
    averageTransactionAmount: number;
    lastTransactionDate: string;
    accountBalance: number;
  }>> {
    return this.get(`/${customerId}/stats`);
  }

  // Upload customer documents
  async uploadDocument(
    customerId: string,
    file: File,
    documentType: string,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{
    id: string;
    fileName: string;
    documentType: string;
    uploadUrl: string;
  }>> {
    return this.uploadFile(`/${customerId}/documents?type=${documentType}`, file, onProgress);
  }

  // Get customer documents
  async getCustomerDocuments(customerId: string): Promise<ApiResponse<Array<{
    id: string;
    fileName: string;
    documentType: string;
    uploadDate: string;
    status: string;
    downloadUrl: string;
  }>>> {
    return this.get(`/${customerId}/documents`);
  }

  // Verify customer identity
  async verifyCustomer(customerId: string, verificationData: {
    documentType: string;
    documentNumber: string;
    verificationMethod: string;
  }): Promise<ApiResponse<{
    verificationId: string;
    status: string;
    verifiedAt?: string;
  }>> {
    return this.post(`/${customerId}/verify`, verificationData);
  }

  // Update customer status
  async updateCustomerStatus(customerId: string, status: 'active' | 'inactive' | 'suspended' | 'pending'): Promise<ApiResponse<Customer>> {
    return this.patch<Customer>(`/${customerId}/status`, { status });
  }

  // Get customers by agent
  async getCustomersByAgent(agentId: string, params?: PaginationParams): Promise<PaginatedResponse<Customer>> {
    return this.getPaginated(`/agent/${agentId}`, params);
  }

  // Bulk create customers
  async bulkCreateCustomers(customers: CreateCustomerRequest[]): Promise<ApiResponse<{
    successful: number;
    failed: number;
    total: number;
    errors?: Array<{ index: number; error: string }>;
  }>> {
    return this.bulkCreate('', customers);
  }

  // Export customers to CSV
  async exportCustomers(filters?: CustomerFilters): Promise<ApiResponse<{
    downloadUrl: string;
    fileName: string;
    recordCount: number;
  }>> {
    return this.get('/export', filters);
  }

  // Get customer insights/analytics
  async getCustomerInsights(customerId: string): Promise<ApiResponse<{
    riskScore: number;
    creditworthiness: string;
    transactionPatterns: Array<{
      pattern: string;
      frequency: number;
      lastOccurrence: string;
    }>;
    recommendations: string[];
  }>> {
    return this.get(`/${customerId}/insights`);
  }
}

export const customerService = new CustomerService();