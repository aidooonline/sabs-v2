import {
  Controller,
  Get,
  Query,
  Headers,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { nanoid } from 'nanoid';

// Dashboard DTOs
export class DashboardMetricsDto {
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

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  @Get('overview')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard overview with key metrics' })
  @ApiQuery({ name: 'startDate', required: true, type: 'string' })
  @ApiQuery({ name: 'endDate', required: true, type: 'string' })
  @ApiQuery({ name: 'companyId', required: false, type: 'string' })
  @ApiQuery({ name: 'agentId', required: false, type: 'string' })
  @ApiQuery({ name: 'includeComparison', required: false, type: 'boolean' })
  @ApiResponse({ status: 200, description: 'Dashboard overview retrieved successfully' })
  async getDashboardOverview(
    @Headers('authorization') authorization: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('companyId') companyId?: string,
    @Query('agentId') agentId?: string,
    @Query('includeComparison') includeComparison?: boolean,
  ): Promise<{
    metrics: DashboardMetricsDto;
    trends: {
      transactionVolume: Array<{ date: string; value: number }>;
      customerGrowth: Array<{ date: string; value: number }>;
      complianceScore: Array<{ date: string; score: number }>;
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
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Getting dashboard overview: ${userId} from ${startDate} to ${endDate}`);

    // Calculate mock data based on date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Generate realistic mock metrics
    const metrics: DashboardMetricsDto = {
      transactions: {
        total: Math.floor(1000 + Math.random() * 2000),
        volume: Math.floor(1500000 + Math.random() * 3000000),
        change: Math.floor(Math.random() * 30) - 10, // -10% to +20%
        period: 'previous period',
      },
      customers: {
        total: Math.floor(8000 + Math.random() * 2000),
        active: Math.floor(6000 + Math.random() * 1500),
        change: Math.floor(Math.random() * 25) - 5, // -5% to +20%
        period: 'previous period',
      },
      agents: {
        total: Math.floor(40 + Math.random() * 20),
        active: Math.floor(30 + Math.random() * 15),
        change: Math.floor(Math.random() * 20) - 10, // -10% to +10%
        period: 'previous period',
      },
      revenue: {
        total: Math.floor(100000 + Math.random() * 200000),
        change: Math.floor(Math.random() * 35) - 5, // -5% to +30%
        period: 'previous period',
      },
      compliance: {
        score: Math.floor(80 + Math.random() * 20), // 80-100%
        alerts: Math.floor(Math.random() * 5),
        violations: Math.floor(Math.random() * 3),
        lastAssessment: new Date().toISOString(),
      },
    };

    // Generate trend data
    const trends = {
      transactionVolume: this.generateTrendData(daysDiff, 1000, 3000),
      customerGrowth: this.generateTrendData(daysDiff, 8000, 10000),
      complianceScore: this.generateTrendData(daysDiff, 85, 95).map(item => ({ 
        date: item.date, 
        score: item.value 
      })),
    };

    // Generate mock alerts
    const alerts = [
      {
        id: `alert_${nanoid(8)}`,
        type: 'warning' as const,
        message: 'SMS credit balance is running low',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        resolved: false,
      },
      {
        id: `alert_${nanoid(8)}`,
        type: 'info' as const,
        message: 'Weekly compliance report is ready',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        resolved: false,
      },
      {
        id: `alert_${nanoid(8)}`,
        type: 'error' as const,
        message: 'Failed transaction detected and flagged',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        resolved: true,
      },
    ];

    // Generate recent activity
    const recentActivity = [
      {
        id: `activity_${nanoid(8)}`,
        type: 'transaction',
        description: 'Customer withdrawal processed',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        user: 'Agent John Doe',
      },
      {
        id: `activity_${nanoid(8)}`,
        type: 'customer',
        description: 'New customer registration',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        user: 'Agent Jane Smith',
      },
      {
        id: `activity_${nanoid(8)}`,
        type: 'compliance',
        description: 'Compliance alert resolved',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        user: 'System Admin',
      },
      {
        id: `activity_${nanoid(8)}`,
        type: 'report',
        description: 'Agent performance report generated',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        user: 'Automated System',
      },
    ];

    return {
      metrics,
      trends,
      alerts,
      recentActivity,
    };
  }

  @Get('metrics')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed dashboard metrics' })
  @ApiQuery({ name: 'startDate', required: true, type: 'string' })
  @ApiQuery({ name: 'endDate', required: true, type: 'string' })
  @ApiQuery({ name: 'companyId', required: false, type: 'string' })
  @ApiQuery({ name: 'agentId', required: false, type: 'string' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics retrieved successfully' })
  async getMetrics(
    @Headers('authorization') authorization: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('companyId') companyId?: string,
    @Query('agentId') agentId?: string,
  ): Promise<{ metrics: DashboardMetricsDto }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Getting dashboard metrics: ${userId} from ${startDate} to ${endDate}`);

    // Reuse the overview logic for metrics
    const overview = await this.getDashboardOverview(
      authorization,
      startDate,
      endDate,
      companyId,
      agentId,
      false
    );

    return {
      metrics: overview.metrics,
    };
  }

  @Get('analytics/transactions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get transaction analytics' })
  @ApiQuery({ name: 'startDate', required: true, type: 'string' })
  @ApiQuery({ name: 'endDate', required: true, type: 'string' })
  @ApiQuery({ name: 'companyId', required: false, type: 'string' })
  @ApiResponse({ status: 200, description: 'Transaction analytics retrieved successfully' })
  async getTransactionAnalytics(
    @Headers('authorization') authorization: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('companyId') companyId?: string,
  ): Promise<{
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
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Getting transaction analytics: ${userId}`);

    const totalCount = Math.floor(800 + Math.random() * 1200);
    const totalVolume = Math.floor(1200000 + Math.random() * 2000000);

    const summary = {
      totalVolume,
      totalCount,
      averageTransaction: Math.floor(totalVolume / totalCount),
      topAgent: 'Agent John Doe',
      growthRate: Math.floor(Math.random() * 25) - 5,
    };

    const breakdown = {
      byType: [
        { type: 'deposit', count: Math.floor(totalCount * 0.6), volume: Math.floor(totalVolume * 0.7) },
        { type: 'withdrawal', count: Math.floor(totalCount * 0.35), volume: Math.floor(totalVolume * 0.25) },
        { type: 'transfer', count: Math.floor(totalCount * 0.05), volume: Math.floor(totalVolume * 0.05) },
      ],
      byAgent: [
        { agentId: 'agent_1', name: 'John Doe', count: Math.floor(totalCount * 0.3), volume: Math.floor(totalVolume * 0.35) },
        { agentId: 'agent_2', name: 'Jane Smith', count: Math.floor(totalCount * 0.25), volume: Math.floor(totalVolume * 0.28) },
        { agentId: 'agent_3', name: 'Mike Johnson', count: Math.floor(totalCount * 0.2), volume: Math.floor(totalVolume * 0.22) },
        { agentId: 'agent_4', name: 'Sarah Wilson', count: Math.floor(totalCount * 0.15), volume: Math.floor(totalVolume * 0.1) },
        { agentId: 'others', name: 'Others', count: Math.floor(totalCount * 0.1), volume: Math.floor(totalVolume * 0.05) },
      ],
      byTimeOfDay: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: Math.floor(Math.random() * (totalCount / 10)),
        volume: Math.floor(Math.random() * (totalVolume / 10)),
      })),
    };

    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const trends = Array.from({ length: Math.min(daysDiff, 30) }, (_, index) => {
      const date = new Date(start.getTime() + index * 24 * 60 * 60 * 1000);
      return {
        date: date.toISOString().split('T')[0],
        count: Math.floor(10 + Math.random() * 100),
        volume: Math.floor(15000 + Math.random() * 85000),
      };
    });

    return {
      summary,
      breakdown,
      trends,
    };
  }

  @Get('analytics/agents')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get agent performance analytics' })
  @ApiQuery({ name: 'startDate', required: true, type: 'string' })
  @ApiQuery({ name: 'endDate', required: true, type: 'string' })
  @ApiQuery({ name: 'companyId', required: false, type: 'string' })
  @ApiResponse({ status: 200, description: 'Agent analytics retrieved successfully' })
  async getAgentPerformance(
    @Headers('authorization') authorization: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('companyId') companyId?: string,
  ): Promise<{
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
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Getting agent performance: ${userId}`);

    const totalAgents = Math.floor(40 + Math.random() * 20);
    const activeAgents = Math.floor(totalAgents * 0.8);

    const summary = {
      totalAgents,
      activeAgents,
      topPerformer: 'John Doe',
      averageTransactions: Math.floor(25 + Math.random() * 50),
    };

    const leaderboard = [
      {
        agentId: 'agent_1',
        name: 'John Doe',
        transactions: Math.floor(80 + Math.random() * 40),
        volume: Math.floor(150000 + Math.random() * 100000),
        commissions: Math.floor(2500 + Math.random() * 1500),
        rating: 4.8,
      },
      {
        agentId: 'agent_2',
        name: 'Jane Smith',
        transactions: Math.floor(70 + Math.random() * 35),
        volume: Math.floor(130000 + Math.random() * 80000),
        commissions: Math.floor(2200 + Math.random() * 1200),
        rating: 4.6,
      },
      {
        agentId: 'agent_3',
        name: 'Mike Johnson',
        transactions: Math.floor(60 + Math.random() * 30),
        volume: Math.floor(110000 + Math.random() * 70000),
        commissions: Math.floor(1900 + Math.random() * 1000),
        rating: 4.4,
      },
      {
        agentId: 'agent_4',
        name: 'Sarah Wilson',
        transactions: Math.floor(50 + Math.random() * 25),
        volume: Math.floor(95000 + Math.random() * 60000),
        commissions: Math.floor(1600 + Math.random() * 800),
        rating: 4.2,
      },
      {
        agentId: 'agent_5',
        name: 'David Brown',
        transactions: Math.floor(45 + Math.random() * 20),
        volume: Math.floor(85000 + Math.random() * 50000),
        commissions: Math.floor(1400 + Math.random() * 700),
        rating: 4.0,
      },
    ];

    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const trends = Array.from({ length: Math.min(daysDiff, 30) }, (_, index) => {
      const date = new Date(start.getTime() + index * 24 * 60 * 60 * 1000);
      return {
        date: date.toISOString().split('T')[0],
        activeAgents: Math.floor(25 + Math.random() * 15),
        totalTransactions: Math.floor(150 + Math.random() * 200),
      };
    });

    return {
      summary,
      leaderboard,
      trends,
    };
  }

  @Get('realtime')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get real-time dashboard updates' })
  @ApiResponse({ status: 200, description: 'Real-time updates retrieved successfully' })
  async getRealTimeUpdates(
    @Headers('authorization') authorization: string,
  ): Promise<{
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
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Getting real-time updates: ${userId}`);

    const metrics = {
      activeUsers: Math.floor(15 + Math.random() * 25),
      ongoingTransactions: Math.floor(Math.random() * 10),
      systemHealth: 'healthy',
      alertCount: Math.floor(Math.random() * 5),
    };

    const notifications = [
      {
        id: `notif_${nanoid(8)}`,
        type: 'transaction',
        message: 'Large transaction flagged for review',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        priority: 'high' as const,
      },
      {
        id: `notif_${nanoid(8)}`,
        type: 'system',
        message: 'SMS service maintenance scheduled',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        priority: 'medium' as const,
      },
    ];

    return {
      lastUpdate: new Date().toISOString(),
      metrics,
      notifications,
    };
  }

  // Helper methods
  private generateTrendData(days: number, min: number, max: number): Array<{ date: string; value: number }> {
    return Array.from({ length: Math.min(days, 30) }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - index - 1));
      
      return {
        date: date.toISOString().split('T')[0],
        value: Math.floor(min + Math.random() * (max - min)),
      };
    });
  }

  private async extractUserId(authorization: string): Promise<string> {
    // Mock user extraction - in real implementation, decode JWT
    return authorization?.replace('Bearer ', '').slice(0, 10) || 'unknown_user';
  }
}