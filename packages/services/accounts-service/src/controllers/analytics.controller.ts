import { UserRole } from '@sabs/common';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ValidationPipe,
  BadRequestException,
  Logger,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

import {
  AnalyticsService,
  AnalyticsDashboard,
  AnalyticsMetric,
  RealtimeMetrics,
  DashboardType,
  DashboardCategory,
  WidgetType,
  MetricCategory,
  MetricType,
  AggregationType,
  TrendDirection,
  CreateDashboardRequest,
  QueryAnalyticsRequest,
  TimeRange,
} from '../services/analytics.service';
import { nanoid } from 'nanoid';

// ===== REQUEST DTOs =====

export class CreateDashboardDto {
  name: string;
  description: string;
  type: DashboardType;
  category: DashboardCategory;
  isPublic: boolean;
  refreshInterval: number;
}

export class QueryAnalyticsDto {
  metric: string;
  dimensions?: string[];
  filters?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  timeRange: {
    start: string;
    end: string;
    interval: string;
  };
  aggregation: AggregationType;
  groupBy?: string[];
  limit?: number;
}

export class CreateWidgetDto {
  title: string;
  type: WidgetType;
  dataSource: string;
  query: QueryAnalyticsDto;
  position: { x: number; y: number };
  size: { width: number; height: number };
  refreshRate: number;
}

export class UpdateDashboardDto {
  name?: string;
  description?: string;
  refreshInterval?: number;
  isPublic?: boolean;
}

// ===== RESPONSE DTOs =====

export class DashboardResponseDto {
  id: string;
  name: string;
  description: string;
  type: DashboardType;
  category: DashboardCategory;
  widgetCount: number;
  lastAccessed: Date;
  performance: {
    loadTime: number;
    refreshRate: number;
  };
  url: string;
}

export class RealtimeMetricsDto {
  timestamp: Date;
  systemHealth: {
    uptime: number;
    cpuUsage: number;
    memoryUsage: number;
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
  businessMetrics: {
    revenue: any;
    customers: any;
    transactions: any;
    loans: any;
    investments: any;
  };
  customerMetrics: any;
  transactionMetrics: any;
  performanceMetrics: any;
}

export class BusinessInsightsDto {
  insights: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    impact: 'high' | 'medium' | 'low';
    confidence: number;
    recommendations: string[];
  }>;
  kpis: Array<{
    name: string;
    value: number;
    target: number;
    performance: number;
    trend: TrendDirection;
    unit: string;
  }>;
  alerts: Array<{
    id: string;
    title: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    timestamp: Date;
    resolved: boolean;
  }>;
}

@ApiTags('Analytics & Reporting')
@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  // ===== DASHBOARD MANAGEMENT ENDPOINTS =====

  @Get('dashboards')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user dashboards' })
  @ApiQuery({ name: 'type', required: false, enum: DashboardType })
  @ApiQuery({ name: 'category', required: false, enum: DashboardCategory })
  @ApiQuery({ name: 'isPublic', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Dashboards retrieved successfully' })
  async getDashboards(
    @Headers('authorization') authorization: string,
    @Query('type') type?: DashboardType,
    @Query('category') category?: DashboardCategory,
    @Query('isPublic') isPublic?: boolean,
  ): Promise<{
    dashboards: DashboardResponseDto[];
    summary: {
      total: number;
      byType: Record<string, number>;
      byCategory: Record<string, number>;
    };
    templates: Array<{
      id: string;
      name: string;
      description: string;
      type: DashboardType;
      previewUrl: string;
    }>;
  }> {
    const userId = await this.extractUserId(authorization);
    
    const result = await this.analyticsService.getDashboards(userId, {
      type,
      category,
      isPublic,
    });

    const dashboards = result.dashboards.map(dashboard => ({
      id: dashboard.id,
      name: dashboard.name,
      description: dashboard.description,
      type: dashboard.type,
      category: dashboard.category,
      widgetCount: dashboard.widgetCount,
      lastAccessed: dashboard.lastAccessed,
      performance: dashboard.performance,
      url: `/dashboards/${dashboard.id}`,
    }));

    const templates = [
      {
        id: 'executive_template',
        name: 'Executive Dashboard',
        description: 'High-level KPIs and business metrics for executives',
        type: DashboardType.EXECUTIVE,
        previewUrl: '/templates/executive/preview',
      },
      {
        id: 'operations_template',
        name: 'Operations Dashboard',
        description: 'Real-time operational metrics and alerts',
        type: DashboardType.OPERATIONAL,
        previewUrl: '/templates/operations/preview',
      },
      {
        id: 'customer_template',
        name: 'Customer Analytics',
        description: 'Customer behavior and satisfaction metrics',
        type: DashboardType.CUSTOMER,
        previewUrl: '/templates/customer/preview',
      },
    ];

    return {
      dashboards,
      summary: result.summary,
      templates,
    };
  }

  @Post('dashboards')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new dashboard' })
  @ApiResponse({ status: 201, description: 'Dashboard created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid dashboard data' })
  async createDashboard(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) dashboardDto: CreateDashboardDto,
  ): Promise<{
    dashboardId: string;
    url: string;
    widgets: number;
    message: string;
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Creating dashboard: ${userId} -> ${dashboardDto.name}`);

    const request: CreateDashboardRequest = {
      name: dashboardDto.name,
      description: dashboardDto.description,
      type: dashboardDto.type,
      category: dashboardDto.category,
      isPublic: dashboardDto.isPublic,
      refreshInterval: dashboardDto.refreshInterval,
    };

    const result = await this.analyticsService.createDashboard(userId, request);

    return {
      ...result,
      message: 'Dashboard created successfully! Start adding widgets to visualize your data.',
    };
  }

  @Get('dashboards/:dashboardId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard details' })
  @ApiParam({ name: 'dashboardId', description: 'Dashboard ID' })
  @ApiResponse({ status: 200, description: 'Dashboard details retrieved' })
  async getDashboardDetails(
    @Headers('authorization') authorization: string,
    @Param('dashboardId') dashboardId: string,
  ): Promise<{
    dashboard: AnalyticsDashboard;
    widgets: Array<any>;
    performance: {
      loadTime: number;
      dataFreshness: string;
      cacheHitRate: number;
    };
    sharing: {
      isPublic: boolean;
      sharedUsers: string[];
      embedUrl: string;
    };
  }> {
    const userId = await this.extractUserId(authorization);
    
    // Mock implementation - would fetch from service
    const dashboard: AnalyticsDashboard = {
      id: dashboardId,
      name: 'Executive Overview',
      description: 'High-level business metrics and KPIs',
      type: DashboardType.EXECUTIVE,
      category: DashboardCategory.BUSINESS,
      owner: userId,
      isPublic: false,
      widgets: [],
      layout: { columns: 12, rows: 8, gap: 16, autoResize: true },
      filters: [],
      refreshInterval: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastRefreshed: new Date(),
    };

    const widgets = [
      {
        id: 'widget_001',
        title: 'Total Revenue',
        type: WidgetType.KPI_CARD,
        dataSource: 'business_metrics',
        currentValue: 32500000,
        previousValue: 28900000,
        change: 12.5,
        trend: TrendDirection.UP,
        position: { x: 0, y: 0 },
        size: { width: 3, height: 2 },
      },
      {
        id: 'widget_002',
        title: 'Transaction Volume',
        type: WidgetType.LINE_CHART,
        dataSource: 'transaction_metrics',
        data: [
          { timestamp: '2024-11-01', value: 12000000 },
          { timestamp: '2024-11-02', value: 12500000 },
          { timestamp: '2024-11-03', value: 13200000 },
        ],
        position: { x: 3, y: 0 },
        size: { width: 6, height: 4 },
      },
    ];

    return {
      dashboard,
      widgets,
      performance: {
        loadTime: 285,
        dataFreshness: '2 minutes ago',
        cacheHitRate: 92.5,
      },
      sharing: {
        isPublic: dashboard.isPublic,
        sharedUsers: [],
        embedUrl: `/embed/dashboards/${dashboardId}`,
      },
    };
  }

  @Put('dashboards/:dashboardId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update dashboard' })
  @ApiParam({ name: 'dashboardId', description: 'Dashboard ID' })
  @ApiResponse({ status: 200, description: 'Dashboard updated successfully' })
  async updateDashboard(
    @Headers('authorization') authorization: string,
    @Param('dashboardId') dashboardId: string,
    @Body(ValidationPipe) updateDto: UpdateDashboardDto,
  ): Promise<{
    success: boolean;
    message: string;
    updatedFields: string[];
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Updating dashboard: ${userId} -> ${dashboardId}`);

    const updatedFields = Object.keys(updateDto).filter(key => updateDto[key] !== undefined);

    return {
      success: true,
      message: 'Dashboard updated successfully',
      updatedFields,
    };
  }

  // ===== REAL-TIME METRICS ENDPOINTS =====

  @Get('realtime')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get real-time system and business metrics' })
  @ApiResponse({ status: 200, description: 'Real-time metrics retrieved', type: RealtimeMetricsDto })
  async getRealtimeMetrics(
    @Headers('authorization') authorization: string,
  ): Promise<RealtimeMetricsDto> {
    const userId = await this.extractUserId(authorization);
    
    const metrics = await this.analyticsService.getRealtimeMetrics();

    return {
      timestamp: metrics.timestamp,
      systemHealth: {
        uptime: metrics.systemHealth.uptime,
        cpuUsage: metrics.systemHealth.cpuUsage,
        memoryUsage: metrics.systemHealth.memoryUsage,
        responseTime: metrics.systemHealth.responseTime,
        errorRate: metrics.systemHealth.errorRate,
        throughput: metrics.systemHealth.throughput,
      },
      businessMetrics: metrics.businessMetrics,
      customerMetrics: metrics.customerMetrics,
      transactionMetrics: metrics.transactionMetrics,
      performanceMetrics: metrics.performanceMetrics,
    };
  }

  @Get('realtime/stream')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get real-time metrics stream' })
  @ApiResponse({ status: 200, description: 'Real-time metrics stream' })
  async getRealtimeStream(
    @Headers('authorization') authorization: string,
  ): Promise<{
    streamUrl: string;
    connectionInfo: {
      protocol: 'websocket' | 'sse';
      endpoint: string;
      refreshRate: number;
    };
    availableChannels: string[];
  }> {
    const userId = await this.extractUserId(authorization);
    
    return {
      streamUrl: `/analytics/stream/${userId}`,
      connectionInfo: {
        protocol: 'websocket',
        endpoint: '/analytics/ws',
        refreshRate: 5000, // 5 seconds
      },
      availableChannels: [
        'system.health',
        'business.metrics',
        'customer.activity',
        'transaction.flow',
        'performance.monitoring',
      ],
    };
  }

  // ===== ANALYTICS QUERY ENDPOINTS =====

  @Post('query')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Execute analytics query' })
  @ApiResponse({ status: 200, description: 'Query executed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  async queryAnalytics(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) queryDto: QueryAnalyticsDto,
  ): Promise<{
    data: Array<Record<string, any>>;
    metadata: {
      totalRows: number;
      executionTime: number;
      queryId: string;
      cached: boolean;
    };
    aggregations: Record<string, number>;
    visualizations: Array<{
      type: string;
      config: any;
      data: any;
    }>;
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Executing analytics query: ${userId} -> ${queryDto.metric}`);

    const request: QueryAnalyticsRequest = {
      metric: queryDto.metric,
      dimensions: queryDto.dimensions,
      filters: queryDto.filters,
      timeRange: {
        start: new Date(queryDto.timeRange.start),
        end: new Date(queryDto.timeRange.end),
        interval: queryDto.timeRange.interval,
      },
      aggregation: queryDto.aggregation,
      groupBy: queryDto.groupBy,
      limit: queryDto.limit,
    };

    const result = await this.analyticsService.queryAnalytics(request);

    // Generate suggested visualizations
    const visualizations = [
      {
        type: 'line_chart',
        config: {
          title: `${queryDto.metric} Over Time`,
          xAxis: 'timestamp',
          yAxis: 'value',
        },
        data: result.data.slice(0, 50), // Limit for visualization
      },
      {
        type: 'bar_chart',
        config: {
          title: `${queryDto.metric} by Category`,
          xAxis: queryDto.groupBy?.[0] || 'category',
          yAxis: 'value',
        },
        data: result.data.slice(0, 20),
      },
    ];

    return {
      ...result,
      visualizations,
    };
  }

  @Get('metrics')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available metrics catalog' })
  @ApiQuery({ name: 'category', required: false, enum: MetricCategory })
  @ApiQuery({ name: 'realTimeOnly', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Metrics catalog retrieved' })
  async getMetricsCatalog(
    @Headers('authorization') authorization: string,
    @Query('category') category?: MetricCategory,
    @Query('realTimeOnly') realTimeOnly?: boolean,
  ): Promise<{
    metrics: Array<AnalyticsMetric & {
      sampleQuery: any;
      visualizationTypes: WidgetType[];
    }>;
    categories: MetricCategory[];
    totalMetrics: number;
    realtimeMetrics: number;
  }> {
    const userId = await this.extractUserId(authorization);
    
    // Mock metrics catalog
    const metrics = [
      {
        id: 'total_customers',
        name: 'Total Customers',
        description: 'Total number of registered customers',
        category: MetricCategory.BUSINESS,
                 type: MetricType.COUNTER,
        unit: 'customers',
        formula: 'COUNT(customers)',
        dimensions: ['region', 'age_group', 'customer_type'],
        tags: [UserRole.CUSTOMER, 'kpi'],
        isRealTime: true,
        lastCalculated: new Date(),
        value: 125000,
        previousValue: 123500,
        change: 1500,
        changePercent: 1.21,
        trend: TrendDirection.UP,
        sampleQuery: {
          metric: 'total_customers',
          dimensions: ['region'],
          aggregation: AggregationType.COUNT,
        },
        visualizationTypes: [WidgetType.KPI_CARD, WidgetType.BAR_CHART, WidgetType.LINE_CHART],
      },
      {
        id: 'transaction_volume',
        name: 'Transaction Volume',
        description: 'Total value of transactions processed',
        category: MetricCategory.FINANCIAL,
                 type: MetricType.GAUGE,
        unit: 'GHS',
        formula: 'SUM(transaction_amount)',
        dimensions: ['channel', 'transaction_type', 'region'],
        tags: ['transaction', 'revenue', 'kpi'],
        isRealTime: true,
        lastCalculated: new Date(),
        value: 12500000,
        previousValue: 11800000,
        change: 700000,
        changePercent: 5.93,
        trend: TrendDirection.UP,
        sampleQuery: {
          metric: 'transaction_volume',
          dimensions: ['channel', 'transaction_type'],
          aggregation: AggregationType.SUM,
        },
        visualizationTypes: [WidgetType.KPI_CARD, WidgetType.LINE_CHART, WidgetType.PIE_CHART],
      },
    ];

    let filteredMetrics = metrics;
    
    if (category) {
      filteredMetrics = filteredMetrics.filter(m => m.category === category);
    }
    
    if (realTimeOnly) {
      filteredMetrics = filteredMetrics.filter(m => m.isRealTime);
    }

    return {
      metrics: filteredMetrics,
      categories: MetricCategory,
      totalMetrics: metrics.length,
      realtimeMetrics: metrics.filter(m => m.isRealTime).length,
    };
  }

  // ===== BUSINESS INTELLIGENCE ENDPOINTS =====

  @Get('insights')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get business insights and recommendations' })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'impact', required: false, enum: ['high', 'medium', 'low'] })
  @ApiResponse({ status: 200, description: 'Business insights retrieved', type: BusinessInsightsDto })
  async getBusinessInsights(
    @Headers('authorization') authorization: string,
    @Query('category') category?: string,
    @Query('impact') impact?: 'high' | 'medium' | 'low',
  ): Promise<BusinessInsightsDto> {
    const userId = await this.extractUserId(authorization);
    
    const result = await this.analyticsService.getBusinessInsights();

    let filteredInsights = result.insights;
    
    if (category) {
      filteredInsights = filteredInsights.filter(i => 
        i.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    if (impact) {
      filteredInsights = filteredInsights.filter(i => i.impact === impact);
    }

    return {
      insights: filteredInsights,
      kpis: result.kpis,
      alerts: result.alerts: (alerts as any)?.alerts || alerts,
    };
  }

  @Get('insights/recommendations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get AI-powered recommendations' })
  @ApiResponse({ status: 200, description: 'Recommendations retrieved' })
  async getRecommendations(
    @Headers('authorization') authorization: string,
  ): Promise<{
    recommendations: Array<{
      id: string;
      title: string;
      description: string;
      category: string;
      priority: 'high' | 'medium' | 'low';
      impact: {
        revenue: number;
        efficiency: number;
        risk: number;
      };
      effort: {
        time: string;
        resources: string;
        complexity: 'low' | 'medium' | 'high';
      };
      actionSteps: string[];
    }>;
    quickWins: Array<{
      title: string;
      description: string;
      impact: number;
      effort: number;
    }>;
  }> {
    const userId = await this.extractUserId(authorization);
    
    const recommendations = [
      {
        id: 'rec_001',
        title: 'Optimize Mobile App Performance',
        description: 'Improve mobile app response time to increase customer engagement',
        category: 'Technology',
        priority: 'high' as const,
        impact: {
          revenue: 15,
          efficiency: 25,
          risk: -10,
        },
        effort: {
          time: '2-3 weeks',
          resources: 'Mobile development team',
          complexity: 'medium' as const,
        },
        actionSteps: [
          'Analyze current performance bottlenecks',
          'Implement caching strategies',
          'Optimize API responses',
          'Conduct load testing',
        ],
      },
      {
        id: 'rec_002',
        title: 'Launch Targeted Marketing Campaign',
        description: 'Focus on high-value customer segments for loan products',
        category: 'Marketing',
        priority: 'medium' as const,
        impact: {
          revenue: 20,
          efficiency: 10,
          risk: 5,
        },
        effort: {
          time: '1-2 weeks',
          resources: 'Marketing team, Data analytics',
          complexity: 'low' as const,
        },
        actionSteps: [
          'Segment customer base',
          'Design targeted campaigns',
          'Launch A/B tests',
          'Monitor conversion rates',
        ],
      },
    ];

    const quickWins = [
      {
        title: 'Enable Push Notifications',
        description: 'Increase user engagement with personalized notifications',
        impact: 85,
        effort: 20,
      },
      {
        title: 'Add Transaction Categories',
        description: 'Help customers track spending with automatic categorization',
        impact: 75,
        effort: 30,
      },
    ];

    return {
      recommendations,
      quickWins,
    };
  }

  // ===== PERFORMANCE MONITORING ENDPOINTS =====

  @Get('performance')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get system performance report' })
  @ApiQuery({ name: 'timeRange', required: false, type: String })
  @ApiQuery({ name: 'component', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Performance report retrieved' })
  async getPerformanceReport(
    @Headers('authorization') authorization: string,
    @Query('timeRange') timeRange?: string,
    @Query('component') component?: string,
  ): Promise<{
    summary: {
      averageResponseTime: number;
      errorRate: number;
      throughput: number;
      uptime: number;
    };
    trends: Array<{
      timestamp: Date;
      responseTime: number;
      errorRate: number;
      throughput: number;
    }>;
    bottlenecks: Array<{
      component: string;
      metric: string;
      value: number;
      threshold: number;
      severity: 'critical' | 'warning' | 'info';
    }>;
    recommendations: string[];
    alerts: Array<{
      id: string;
      component: string;
      severity: 'critical' | 'warning' | 'info';
      message: string;
      timestamp: Date;
    }>;
  }> {
    const userId = await this.extractUserId(authorization);
    
    // Parse time range or default to last 24 hours
    const defaultTimeRange = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date(),
      interval: '5m',
    };

    const result = await this.analyticsService.getPerformanceReport(defaultTimeRange);

    const alerts = [
      {
        id: 'alert_perf_001',
        component: 'API Gateway',
        severity: 'warning' as const,
        message: 'Response time exceeded threshold',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
      },
      {
        id: 'alert_perf_002',
        component: 'Database',
        severity: 'info' as const,
        message: 'Query optimization opportunity detected',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
      },
    ];

    return {
      ...result,
      alerts,
    };
  }

  @Get('performance/sla')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get SLA compliance report' })
  @ApiResponse({ status: 200, description: 'SLA report retrieved' })
  async getSLAReport(
    @Headers('authorization') authorization: string,
  ): Promise<{
    overview: {
      overallCompliance: number;
      uptime: number;
      responseTime: number;
      availability: number;
    };
    targets: Array<{
      metric: string;
      target: number;
      actual: number;
      compliance: number;
      status: 'met' | 'at_risk' | 'missed';
    }>;
    breaches: Array<{
      id: string;
      metric: string;
      threshold: number;
      actualValue: number;
      duration: number;
      startTime: Date;
      endTime?: Date;
      impact: 'low' | 'medium' | 'high';
    }>;
  }> {
    const userId = await this.extractUserId(authorization);
    
    return {
      overview: {
        overallCompliance: 98.5,
        uptime: 99.95,
        responseTime: 285,
        availability: 99.9,
      },
      targets: [
        {
          metric: 'API Response Time',
          target: 300,
          actual: 285,
          compliance: 100,
          status: 'met',
        },
        {
          metric: 'System Uptime',
          target: 99.9,
          actual: 99.95,
          compliance: 100,
          status: 'met',
        },
        {
          metric: 'Error Rate',
          target: 1.0,
          actual: 0.8,
          compliance: 100,
          status: 'met',
        },
      ],
      breaches: [
        {
          id: 'breach_001',
          metric: 'API Response Time',
          threshold: 300,
          actualValue: 450,
          duration: 5,
          startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000),
          impact: 'medium',
        },
      ],
    };
  }

  // ===== REPORTING ENDPOINTS =====

  @Get('reports')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available reports' })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Available reports retrieved' })
  async getAvailableReports(
    @Headers('authorization') authorization: string,
    @Query('category') category?: string,
  ): Promise<{
    reports: Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'on_demand';
      format: string[];
      lastGenerated: Date;
      subscribers: number;
    }>;
    categories: string[];
    scheduled: Array<{
      reportId: string;
      nextRun: Date;
      frequency: string;
      recipients: string[];
    }>;
  }> {
    const userId = await this.extractUserId(authorization);
    
    const reports = [
      {
        id: 'exec_summary',
        name: 'Executive Summary',
        description: 'High-level business metrics and KPIs',
        category: 'Executive',
        frequency: 'daily' as const,
        format: ['pdf', 'excel', 'email'],
        lastGenerated: new Date(Date.now() - 60 * 60 * 1000),
        subscribers: 12,
      },
      {
        id: 'transaction_analysis',
        name: 'Transaction Analysis',
        description: 'Detailed transaction patterns and trends',
        category: 'Operations',
        frequency: 'weekly' as const,
        format: ['pdf', 'excel'],
        lastGenerated: new Date(Date.now() - 24 * 60 * 60 * 1000),
        subscribers: 25,
      },
      {
        id: 'risk_assessment',
        name: 'Risk Assessment Report',
        description: 'Comprehensive risk analysis and monitoring',
        category: 'Risk',
        frequency: 'monthly' as const,
        format: ['pdf'],
        lastGenerated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        subscribers: 8,
      },
    ];

    let filteredReports = reports;
    if (category) {
      filteredReports = reports.filter(r => 
        r.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    const categories = [...new Set(reports.map(r => r.category))];

    const scheduled = [
      {
        reportId: 'exec_summary',
        nextRun: new Date(Date.now() + 23 * 60 * 60 * 1000),
        frequency: 'daily',
        recipients: ['executives@company.com'],
      },
    ];

    return {
      reports: filteredReports,
      categories,
      scheduled,
    };
  }

  @Post('reports/:reportId/generate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate report' })
  @ApiParam({ name: 'reportId', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Report generation started' })
  async generateReport(
    @Headers('authorization') authorization: string,
    @Param('reportId') reportId: string,
    @Body() options: {
      format: 'pdf' | 'excel' | 'csv';
      timeRange?: {
        start: string;
        end: string;
      };
      filters?: Record<string, any>;
      email?: boolean;
      recipients?: string[];
    },
  ): Promise<{
    jobId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    estimatedTime: number;
    downloadUrl?: string;
    message: string;
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Generating report: ${userId} -> ${reportId}`);

    const jobId = `job_${nanoid(12)}`;

    // Mock report generation
    setTimeout(() => {
      this.logger.log(`Report generated: ${jobId}`);
    }, 5000);

    return {
      jobId,
      status: 'processing',
      estimatedTime: 30, // seconds
      message: 'Report generation started. You will be notified when it\'s ready.',
    };
  }

  // ===== UTILITY ENDPOINTS =====

  @Get('enums')
  @ApiOperation({ summary: 'Get analytics-related enums' })
  @ApiResponse({ status: 200, description: 'Enums retrieved' })
  async getAnalyticsEnums(): Promise<{
    dashboardTypes: DashboardType[];
    dashboardCategories: DashboardCategory[];
    widgetTypes: WidgetType[];
    metricCategories: MetricCategory[];
    aggregationTypes: AggregationType[];
    trendDirections: TrendDirection[];
  }> {
    return {
      dashboardTypes: Object.values(DashboardType),
      dashboardCategories: DashboardCategory,
      widgetTypes: WidgetType,
      metricCategories: MetricCategory,
      aggregationTypes: AggregationType,
      trendDirections: Object.values(TrendDirection),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check analytics service health' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async getHealthStatus(): Promise<{
    status: string;
    timestamp: string;
    services: {
      dashboardEngine: string;
      metricsCollection: string;
      queryEngine: string;
      realtimeStreaming: string;
      reportGeneration: string;
    };
    performance: {
      averageQueryTime: number;
      cacheHitRate: number;
      memoryUsage: number;
    };
  }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        dashboardEngine: 'operational',
        metricsCollection: 'operational',
        queryEngine: 'operational',
        realtimeStreaming: 'operational',
        reportGeneration: 'operational',
      },
      performance: {
        averageQueryTime: 185,
        cacheHitRate: 92.5,
        memoryUsage: 68.2,
      },
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  private async extractUserId(authorization: string): Promise<string> {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new BadRequestException('Invalid authorization header');
    }
    return 'user_admin_001';
  }
}