import { api } from '../apiClient';

// Staff Types and Interfaces
export interface Staff {
  id: string;
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: StaffRole;
  status: StaffStatus;
  agentCode?: string;
  location?: StaffLocation;
  loginAttempts: number;
  lockedUntil?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  isOnline?: boolean;
}

export enum StaffRole {
  FIELD_AGENT = 'field_agent',
  CLERK = 'clerk',
}

export enum StaffStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export interface StaffLocation {
  lat: number;
  lng: number;
  address?: string;
  accuracy?: number;
  timestamp?: string;
}

export interface CreateStaffRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: StaffRole;
  location?: StaffLocation;
  metadata?: Record<string, any>;
  sendWelcomeEmail?: boolean;
}

export interface UpdateStaffRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: StaffRole;
  status?: StaffStatus;
  location?: StaffLocation;
  metadata?: Record<string, any>;
}

export interface StaffFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: StaffRole;
  status?: StaffStatus;
  agentCode?: string;
  sortBy?: 'firstName' | 'lastName' | 'email' | 'role' | 'status' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}

export interface StaffListResponse {
  data: Staff[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  fieldAgents: number;
  clerks: number;
  pendingStaff: number;
  suspendedStaff: number;
  averagePerformanceScore: number;
  topPerformers: Array<{
    id: string;
    name: string;
    score: number;
  }>;
  recentHires: number;
  locationCoverage: number;
}

export interface StaffPerformance {
  staffId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  transactions: {
    count: number;
    volume: number;
    averageValue: number;
  };
  customers: {
    served: number;
    newCustomers: number;
    repeatCustomers: number;
  };
  commissions: {
    earned: number;
    rate: number;
  };
  activityMetrics: {
    daysActive: number;
    averageSessionDuration: number;
    lastActivity: string;
  };
  performanceScore: number;
  rank: number;
  goals: {
    transactionTarget: number;
    customerTarget: number;
    commissionTarget: number;
    progress: {
      transactions: number;
      customers: number;
      commissions: number;
    };
  };
}

export interface StaffOnboardingRequest {
  staffId: string;
  temporaryPassword?: string;
  forcePasswordChange?: boolean;
  sendOnboardingEmail?: boolean;
  customMessage?: string;
}

export interface LocationUpdateRequest {
  lat: number;
  lng: number;
  address?: string;
  accuracy?: number;
}

export interface PasswordResetRequest {
  staffId: string;
  generateTemporary?: boolean;
  sendEmail?: boolean;
  customMessage?: string;
}

export interface BulkStaffOperationRequest {
  staffIds: string[];
  operation: 'activate' | 'deactivate' | 'suspend' | 'unsuspend';
  reason?: string;
}

export interface BulkStaffOperationResult {
  updated: number;
  failed: string[];
  results: Array<{
    staffId: string;
    success: boolean;
    error?: string;
  }>;
}

export interface RoleSummary {
  fieldAgents: number;
  clerks: number;
  activeStaff: number;
  pendingStaff: number;
  breakdown: {
    field_agent: {
      active: number;
      pending: number;
      inactive: number;
    };
    clerk: {
      active: number;
      pending: number;
      inactive: number;
    };
  };
}

export class StaffService {
  private getCompanyPrefix(companyId: string): string {
    return `/companies/${companyId}/staff`;
  }

  // Staff CRUD Operations
  async getAllStaff(companyId: string, params?: StaffFilterParams): Promise<StaffListResponse> {
    const response = await api.get<StaffListResponse>(this.getCompanyPrefix(companyId), params);
    return response.data;
  }

  async getStaffById(companyId: string, staffId: string): Promise<Staff> {
    const response = await api.get<Staff>(`${this.getCompanyPrefix(companyId)}/${staffId}`);
    return response.data;
  }

  async createStaff(companyId: string, data: CreateStaffRequest): Promise<Staff> {
    const response = await api.post<Staff>(this.getCompanyPrefix(companyId), data);
    return response.data;
  }

  async updateStaff(companyId: string, staffId: string, data: UpdateStaffRequest): Promise<Staff> {
    const response = await api.patch<Staff>(`${this.getCompanyPrefix(companyId)}/${staffId}`, data);
    return response.data;
  }

  async deleteStaff(companyId: string, staffId: string, reason?: string): Promise<void> {
    await api.delete(`${this.getCompanyPrefix(companyId)}/${staffId}`);
  }

  // Staff Statistics and Analytics
  async getStaffStats(companyId: string): Promise<StaffStats> {
    const response = await api.get<StaffStats>(`${this.getCompanyPrefix(companyId)}/stats`);
    return response.data;
  }

  async getStaffPerformance(
    companyId: string,
    staffId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<StaffPerformance> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate.toISOString().split('T')[0];
    if (endDate) params.endDate = endDate.toISOString().split('T')[0];

    const response = await api.get<StaffPerformance>(
      `${this.getCompanyPrefix(companyId)}/${staffId}/performance`,
      params
    );
    return response.data;
  }

  async getRoleSummary(companyId: string): Promise<RoleSummary> {
    const response = await api.get<RoleSummary>(`${this.getCompanyPrefix(companyId)}/roles/summary`);
    return response.data;
  }

  // Staff Account Management
  async onboardStaff(
    companyId: string,
    staffId: string,
    data: StaffOnboardingRequest
  ): Promise<Staff> {
    const response = await api.post<Staff>(
      `${this.getCompanyPrefix(companyId)}/${staffId}/onboard`,
      data
    );
    return response.data;
  }

  async resetPassword(
    companyId: string,
    staffId: string,
    data: PasswordResetRequest
  ): Promise<void> {
    await api.post(`${this.getCompanyPrefix(companyId)}/${staffId}/reset-password`, data);
  }

  async updateLocation(
    companyId: string,
    staffId: string,
    location: LocationUpdateRequest
  ): Promise<Staff> {
    const response = await api.patch<Staff>(
      `${this.getCompanyPrefix(companyId)}/${staffId}/location`,
      location
    );
    return response.data;
  }

  // Bulk Operations
  async bulkUpdateStaff(
    companyId: string,
    operation: BulkStaffOperationRequest
  ): Promise<BulkStaffOperationResult> {
    const response = await api.patch<BulkStaffOperationResult>(
      `${this.getCompanyPrefix(companyId)}/bulk/update`,
      operation
    );
    return response.data;
  }

  // Utility Functions
  async findByAgentCode(companyId: string, agentCode: string): Promise<Staff> {
    const response = await api.get<Staff>(
      `${this.getCompanyPrefix(companyId)}/agent-code/${agentCode}`
    );
    return response.data;
  }

  // Helper Methods for Frontend
  getStaffDisplayName(staff: Staff): string {
    return `${staff.firstName} ${staff.lastName}`;
  }

  getStatusBadgeVariant(status: StaffStatus): 'success' | 'warning' | 'danger' | 'info' {
    switch (status) {
      case StaffStatus.ACTIVE:
        return 'success';
      case StaffStatus.PENDING:
        return 'info';
      case StaffStatus.SUSPENDED:
        return 'warning';
      case StaffStatus.INACTIVE:
        return 'danger';
      default:
        return 'info';
    }
  }

  getRoleBadgeVariant(role: StaffRole): 'primary' | 'secondary' {
    switch (role) {
      case StaffRole.FIELD_AGENT:
        return 'primary';
      case StaffRole.CLERK:
        return 'secondary';
      default:
        return 'secondary';
    }
  }

  formatLocation(location?: StaffLocation): string {
    if (!location) return 'No location';
    return location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
  }

  calculateLocationAccuracy(location?: StaffLocation): string {
    if (!location?.accuracy) return 'Unknown';
    if (location.accuracy < 10) return 'High';
    if (location.accuracy < 50) return 'Medium';
    return 'Low';
  }

  isLocationStale(location?: StaffLocation): boolean {
    if (!location?.timestamp) return true;
    const locationTime = new Date(location.timestamp);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - locationTime.getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate > 24; // Consider location stale after 24 hours
  }

  getPerformanceRating(score: number): { rating: string; color: string } {
    if (score >= 90) return { rating: 'Excellent', color: 'green' };
    if (score >= 80) return { rating: 'Good', color: 'blue' };
    if (score >= 70) return { rating: 'Average', color: 'yellow' };
    if (score >= 60) return { rating: 'Below Average', color: 'orange' };
    return { rating: 'Poor', color: 'red' };
  }
}

// Export singleton instance
export const staffService = new StaffService();