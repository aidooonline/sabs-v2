import { api } from '../apiClient';
import { TimeRange } from '../../components/atoms/TimeFilter';

// Dashboard Data Types
export interface DashboardMetrics {
  transactions: {
    total: number;
    volume: number;
    change: number;
    period: string;
  };
  customers: {
    total: number;
    active: number;
    change: number;
    period: string;
  };
  agents: {
    total: number;
    active: number;
    change: number;
    period: string;
  };
  revenue: {
    total: number;
    change: number;
    period: string;
  };
  compliance: {
    score: number;
    alerts: number;
    violations: number;
    lastAssessment: string;
  };
}

export interface DashboardOverview {
  metrics: DashboardMetrics;
  trends: {
    transactionVolume: Array<{
      date: string;
      value: number;
    }>;
    customerGrowth: Array<{
      date: string;
      value: number;
    }>;
    complianceScore: Array<{
      date: string;
      score: number;
    }>;
  };
  alerts: Array<{
    id: string;
    type: 'info' | 'warning' | 'error';
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user: string;
  }>;
}

export interface DashboardFilters {
  timeRange: TimeRange;
  companyId?: string;
  agentId?: string;
  includeComparison?: boolean;
}

export class DashboardService {
  private filterParams(params: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const key in params) {
      if (params[key] !== undefined) {
        result[key] = params[key];
      }
    }
    return result;
  }

  // Get dashboard overview with metrics
  async getDashboardOverview(filters: DashboardFilters): Promise<DashboardOverview> {
    const params = {
      startDate: filters.timeRange.startDate.toISOString(),
      endDate: filters.timeRange.endDate.toISOString(),
      companyId: filters.companyId,
      agentId: filters.agentId,
      includeComparison: filters.includeComparison,
    };

    const cleanParams = this.filterParams(params);
    const response = await api.get<DashboardOverview>('/dashboard/overview', cleanParams);
    return response.data;
  }

  // Get detailed metrics for specific time range
  async getMetrics(filters: DashboardFilters): Promise<DashboardMetrics> {
    const params = {
      startDate: filters.timeRange.startDate.toISOString(),
      endDate: filters.timeRange.endDate.toISOString(),
      companyId: filters.companyId,
      agentId: filters.agentId,
    };

    const cleanParams = this.filterParams(params);
    const response = await api.get<{ metrics: DashboardMetrics }>('/dashboard/metrics', cleanParams);
    return response.data.metrics;
  }

  // Get transaction analytics
  async getTransactionAnalytics(filters: DashboardFilters): Promise<{
    summary: {
      totalVolume: number;
      totalCount: number;
      averageTransaction: number;
      topAgent: string;
      growthRate: number;
    };
    breakdown: {
      byType: Array<{ type: string; count: number; volume: number }>;
      byAgent: Array<{ agentId: string; name: string; count: number; volume: number }>;
      byTimeOfDay: Array<{ hour: number; count: number; volume: number }>;
    };
    trends: Array<{ date: string; count: number; volume: number }>;
  }> {
    const params = {
      startDate: filters.timeRange.startDate.toISOString(),
      endDate: filters.timeRange.endDate.toISOString(),
      companyId: filters.companyId,
    };

    const cleanParams = this.filterParams(params);
    const response = await api.get('/dashboard/analytics/transactions', cleanParams);
    return response.data;
  }

  // Get compliance dashboard data (using existing regulatory reporting API)
  async getComplianceMetrics(): Promise<{
    overview: {
      overallScore: number;
      riskLevel: string;
      totalViolations: number;
      activeViolations: number;
      resolvedThisMonth: number;
      lastAssessment: string;
    };
    categories: Array<{
      category: string;
      score: number;
      status: string;
      trend: string;
      violations: number;
    }>;
    alerts: Array<{
      id: string;
      severity: string;
      message: string;
      category: string;
      timestamp: string;
      status: string;
    }>;
  }> {
    // This uses the existing regulatory reporting API
    const response = await api.get('/regulatory-reporting/dashboard');
    return response.data;
  }

  // Get agent performance metrics
  async getAgentPerformance(filters: DashboardFilters): Promise<{
    summary: {
      totalAgents: number;
      activeAgents: number;
      topPerformer: string;
      averageTransactions: number;
    };
    leaderboard: Array<{
      agentId: string;
      name: string;
      transactions: number;
      volume: number;
      commissions: number;
      rating: number;
    }>;
    trends: Array<{
      date: string;
      activeAgents: number;
      totalTransactions: number;
    }>;
  }> {
    const params = {
      startDate: filters.timeRange.startDate.toISOString(),
      endDate: filters.timeRange.endDate.toISOString(),
      companyId: filters.companyId,
    };

    const cleanParams = this.filterParams(params);
    const response = await api.get('/dashboard/analytics/agents', cleanParams);
    return response.data;
  }

  // Export dashboard data
  async exportDashboardData(
    filters: DashboardFilters,
    format: 'csv' | 'excel' | 'pdf'
  ): Promise<Blob> {
    const params = {
      startDate: filters.timeRange.startDate.toISOString(),
      endDate: filters.timeRange.endDate.toISOString(),
      companyId: filters.companyId,
      format,
    };

    const cleanParams = this.filterParams(params);
    const response = await api.get('/dashboard/export', cleanParams, {
      timeout: 60000, // 1 minute timeout for exports
    });

    return new Blob([response.data], {
      type: format === 'pdf' ? 'application/pdf' : 
            format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
            'text/csv'
    });
  }

  // Get real-time dashboard updates
  async getRealTimeUpdates(): Promise<{
    lastUpdate: string;
    metrics: {
      activeUsers: number;
      ongoingTransactions: number;
      systemHealth: string;
      alertCount: number;
    };
    notifications: Array<{
      id: string;
      type: string;
      message: string;
      timestamp: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
    }>;
  }> {
    const response = await api.get('/dashboard/realtime');
    return response.data;
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();