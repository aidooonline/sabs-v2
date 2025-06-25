import { api } from '../apiClient';

// Company Types
export interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address: string;
  status: CompanyStatus;
  subscriptionPlan: string;
  features: Record<string, any>;
  adminUserId?: string;
  smsCredits: number;
  aiCredits: number;
  createdAt: string;
  updatedAt: string;
}

export enum CompanyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
}

export interface CreateCompanyRequest {
  name: string;
  email: string;
  phone?: string;
  address: string;
  subscriptionPlan: string;
  features?: Record<string, any>;
  adminEmail?: string;
  adminFirstName?: string;
  adminLastName?: string;
  initialSmsCredits?: number;
  initialAiCredits?: number;
}

export interface UpdateCompanyRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  subscriptionPlan?: string;
  features?: Record<string, any>;
  status?: CompanyStatus;
}

export interface CompanyQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CompanyStatus;
  subscriptionPlan?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'status';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CompanyListResponse {
  data: Company[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CompanyStats {
  totalStaff: number;
  activeAgents: number;
  totalTransactions: number;
  monthlyRevenue: number;
  complianceScore: number;
  smsUsageThisMonth: number;
  aiUsageThisMonth: number;
}

export interface DashboardSummary {
  totalCompanies: number;
  activeCompanies: number;
  trialCompanies: number;
  suspendedCompanies: number;
  lowCreditCompanies: number;
  recentSignups: number;
  conversionRate: string;
}

export interface ServiceCreditBalance {
  serviceType: 'sms' | 'ai';
  balance: number;
  companyId: string;
}

export interface AddServiceCreditsRequest {
  serviceType: 'sms' | 'ai';
  amount: number;
  expiryDate?: string;
  notes?: string;
}

export interface BulkOperationRequest {
  companyIds: string[];
  operation: 'activate' | 'deactivate' | 'suspend';
}

export interface BulkOperationResult {
  updated: number;
  failed: string[];
}

export interface LowCreditWarning {
  companyId: string;
  companyName: string;
  serviceType: 'sms' | 'ai';
  currentCredits: number;
  threshold: number;
  severity: 'warning' | 'critical';
}

export interface UsageStats {
  serviceType: 'sms' | 'ai';
  totalUsage: number;
  dailyUsage: Array<{
    date: string;
    usage: number;
  }>;
  averageDailyUsage: number;
  peakUsageDay: string;
  companyId: string;
  period: {
    startDate: string;
    endDate: string;
  };
}

export class CompanyService {
  // Company Management
  async getAllCompanies(params?: CompanyQueryParams): Promise<CompanyListResponse> {
    const response = await api.get<CompanyListResponse>('/companies', params);
    return response.data;
  }

  async getCompanyById(id: string): Promise<Company> {
    const response = await api.get<Company>(`/companies/${id}`);
    return response.data;
  }

  async createCompany(data: CreateCompanyRequest): Promise<Company> {
    const response = await api.post<Company>('/companies', data);
    return response.data;
  }

  async updateCompany(id: string, data: UpdateCompanyRequest): Promise<Company> {
    const response = await api.patch<Company>(`/companies/${id}`, data);
    return response.data;
  }

  async deleteCompany(id: string): Promise<void> {
    await api.delete(`/companies/${id}`);
  }

  async getCompanyStats(id: string): Promise<CompanyStats> {
    const response = await api.get<CompanyStats>(`/companies/${id}/stats`);
    return response.data;
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await api.get<DashboardSummary>('/companies/dashboard');
    return response.data;
  }

  async getExpiringTrials(days: number = 7): Promise<Company[]> {
    const response = await api.get<Company[]>('/companies/expiring-trials', { days });
    return response.data;
  }

  async bulkUpdateStatus(data: BulkOperationRequest): Promise<BulkOperationResult> {
    const response = await api.patch<BulkOperationResult>('/companies/bulk/status', data);
    return response.data;
  }

  // Service Credit Management
  async addServiceCredits(companyId: string, data: AddServiceCreditsRequest): Promise<Company> {
    const response = await api.post<Company>(`/companies/${companyId}/service-credits`, data);
    return response.data;
  }

  async getServiceCreditBalance(companyId: string, serviceType: 'sms' | 'ai'): Promise<ServiceCreditBalance> {
    const response = await api.get<ServiceCreditBalance>(`/companies/${companyId}/service-credits/${serviceType}`);
    return response.data;
  }

  async getAllCreditBalances(companyId: string): Promise<{
    smsCredits: number;
    aiCredits: number;
    totalValue: number;
  }> {
    const response = await api.get(`/service-credits/companies/${companyId}/balances`);
    return response.data;
  }

  async getLowCreditWarnings(): Promise<LowCreditWarning[]> {
    const response = await api.get<LowCreditWarning[]>('/service-credits/warnings/low-credits');
    return response.data;
  }

  async getUsageStats(
    companyId: string,
    serviceType: 'sms' | 'ai',
    startDate: Date,
    endDate: Date
  ): Promise<UsageStats> {
    const params = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
    const response = await api.get<UsageStats>(
      `/service-credits/companies/${companyId}/usage/${serviceType}/stats`,
      params
    );
    return response.data;
  }

  async getMonthlyUsageReport(companyId: string, year: number, month: number): Promise<any> {
    const response = await api.get(`/service-credits/companies/${companyId}/usage/monthly/${year}/${month}`);
    return response.data;
  }

  async getAvailablePackages(): Promise<{
    sms: Array<{ type: string; credits: number; cost: number; description: string }>;
    ai: Array<{ type: string; credits: number; cost: number; description: string }>;
  }> {
    const response = await api.get('/service-credits/packages');
    return response.data;
  }

  // Subscription Management
  async updateSubscription(companyId: string, plan: string, features?: Record<string, any>): Promise<Company> {
    const response = await api.patch<Company>(`/companies/${companyId}/subscription`, {
      plan,
      features,
    });
    return response.data;
  }
}

// Export singleton instance
export const companyService = new CompanyService();