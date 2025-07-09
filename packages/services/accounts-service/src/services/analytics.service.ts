import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { nanoid } from 'nanoid';
import { getErrorMessage, getErrorStack, getErrorStatus, UserRole, ReportType, LibraryCapability } from '@sabs/common';

// ===== ANALYTICS ENTITIES =====

export interface AnalyticsDashboard {
  id: string;
  name: string;
  description: string;
  type: DashboardType;
  category: DashboardCategory;
  owner: string;
  isPublic: boolean;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  filters: DashboardFilter[];
  refreshInterval: number;
  createdAt: Date;
  updatedAt: Date;
  lastRefreshed: Date;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: WidgetType;
  dataSource: string;
  query: AnalyticsQuery;
  visualization: VisualizationConfig;
  position: WidgetPosition;
  size: WidgetSize;
  filters: WidgetFilter[];
  isRealTime: boolean;
  refreshRate: number;
}

export interface AnalyticsQuery {
  metric: string;
  dimensions: string[];
  filters: QueryFilter[];
  timeRange: TimeRange;
  aggregation: AggregationType;
  groupBy: string[];
  orderBy: OrderByClause[];
  limit?: number;
}

export interface AnalyticsMetric {
  id: string;
  name: string;
  description: string;
  category: MetricCategory;
  type: MetricType;
  unit: string;
  formula: string;
  dimensions: string[];
  tags: string[];
  isRealTime: boolean;
  lastCalculated: Date;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: TrendDirection;
}

export interface RealtimeMetrics {
  timestamp: Date;
  systemHealth: SystemHealthMetrics;
  businessMetrics: BusinessMetrics;
  customerMetrics: CustomerMetrics;
  transactionMetrics: TransactionMetrics;
  performanceMetrics: PerformanceMetrics;
}

export interface SystemHealthMetrics {
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  errorRate: number;
  responseTime: number;
  throughput: number;
  activeConnections: number;
}

export interface BusinessMetrics {
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
    change: number;
  };
  customers: {
    total: number;
    active: number;
    new: number;
    churn: number;
    growth: number;
  };
  transactions: {
    count: number;
    volume: number;
    successRate: number;
    averageAmount: number;
    topChannels: Array<{ channel: string; count: number; volume: number }>;
  };
  loans: {
    applications: number;
    approvals: number;
    disbursements: number;
    portfolio: number;
    defaultRate: number;
  };
  investments: {
    assetsUnderManagement: number;
    newInvestments: number;
    returns: number;
    activePortfolios: number;
  };
}

export interface CustomerMetrics {
  demographics: {
    ageGroups: Array<{ range: string; count: number; percentage: number }>;
    genderDistribution: Array<{ gender: string; count: number; percentage: number }>;
    locationDistribution: Array<{ region: string; count: number; percentage: number }>;
  };
  behavior: {
    sessionDuration: number;
    pagesPerSession: number;
    bounceRate: number;
    retentionRate: number;
    engagementScore: number;
  };
  satisfaction: {
    nps: number;
    csat: number;
    ces: number;
    reviews: Array<{ rating: number; count: number }>;
  };
}

export interface TransactionMetrics {
  realTime: {
    tps: number; // transactions per second
    volume: number;
    successRate: number;
    failureRate: number;
    averageResponseTime: number;
  };
  categories: Array<{
    type: string;
    count: number;
    volume: number;
    successRate: number;
  }>;
  channels: Array<{
    channel: string;
    count: number;
    volume: number;
    conversionRate: number;
  }>;
  fraud: {
    detectedCount: number;
    blockedAmount: number;
    falsePositiveRate: number;
    detectionRate: number;
  };
}

export interface PerformanceMetrics {
  api: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
  };
  database: {
    connections: number;
    queriesPerSecond: number;
    averageQueryTime: number;
    slowQueries: number;
    connectionPoolUtilization: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    evictionRate: number;
    memoryUsage: number;
    keyCount: number;
  };
}

// ===== ENUMS =====

export enum DashboardType {
  EXECUTIVE = 'executive',
  OPERATIONAL = 'operational',
  ANALYTICAL = 'analytical',
  CUSTOMER = UserRole.CUSTOMER,
  RISK = 'risk',
  COMPLIANCE = 'compliance',
}

export enum DashboardCategory {
  BUSINESS = 'business',
  TECHNICAL = 'technical',
  CUSTOMER = UserRole.CUSTOMER,
  FINANCIAL = 'financial',
  OPERATIONAL = 'operational',
  RISK = 'risk',
}

export enum WidgetType {
  LINE_CHART = 'line_chart',
  BAR_CHART = 'bar_chart',
  PIE_CHART = 'pie_chart',
  GAUGE = 'gauge',
  KPI_CARD = 'kpi_card',
  TABLE = 'table',
  HEATMAP = 'heatmap',
  SCATTER_PLOT = 'scatter_plot',
  FUNNEL = 'funnel',
  TREEMAP = 'treemap',
}

export enum MetricCategory {
  BUSINESS = 'business',
  TECHNICAL = 'technical',
  CUSTOMER = UserRole.CUSTOMER,
  FINANCIAL = 'financial',
  OPERATIONAL = 'operational',
  RISK = 'risk',
}

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  RATIO = 'ratio',
  PERCENTAGE = 'percentage',
}

export enum AggregationType {
  SUM = 'sum',
  COUNT = 'count',
  AVERAGE = 'average',
  MIN = 'min',
  MAX = 'max',
  MEDIAN = 'median',
  PERCENTILE = 'percentile',
}

export enum TrendDirection {
  UP = 'up',
  DOWN = 'down',
  STABLE = 'stable',
  VOLATILE = 'volatile',
}

// ===== SUPPORTING INTERFACES =====

export interface DashboardLayout {
  columns: number;
  rows: number;
  gap: number;
  autoResize: boolean;
}

export interface DashboardFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'range' | 'in';
  value: any;
  label: string;
}

export interface VisualizationConfig {
  colors: string[];
  title: string;
  xAxis: AxisConfig;
  yAxis: AxisConfig;
  legend: LegendConfig;
  tooltip: TooltipConfig;
  animation: boolean;
}

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface WidgetFilter {
  field: string;
  value: any;
  operator: string;
}

export interface QueryFilter {
  field: string;
  operator: string;
  value: any;
}

export interface TimeRange {
  start: Date;
  end: Date;
  interval: string;
}

export interface OrderByClause {
  field: string;
  direction: 'asc' | 'desc';
}

export interface AxisConfig {
  label: string;
  min?: number;
  max?: number;
  format: string;
}

export interface LegendConfig {
  show: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export interface TooltipConfig {
  show: boolean;
  format: string;
}

// ===== REQUEST INTERFACES =====

export interface CreateDashboardRequest {
  name: string;
  description: string;
  type: DashboardType;
  category: DashboardCategory;
  isPublic: boolean;
  refreshInterval: number;
}

export interface QueryAnalyticsRequest {
  metric: string;
  dimensions?: string[];
  filters?: QueryFilter[];
  timeRange: TimeRange;
  aggregation: AggregationType;
  groupBy?: string[];
  limit?: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  // In-memory storage for analytics data
  private dashboards: Map<string, AnalyticsDashboard> = new Map();
  private metrics: Map<string, AnalyticsMetric> = new Map();
  private realtimeData: Map<string, any> = new Map();

  private readonly analyticsConfig = {
    maxDashboards: 100,
    maxWidgetsPerDashboard: 20,
    defaultRefreshInterval: 60, // seconds
    realtimeBufferSize: 1000,
    metricRetentionDays: 90,
    performanceThresholds: {
      responseTime: 500, // ms
      errorRate: 0.01, // 1%
      uptime: 0.999, // 99.9%
    },
  };

  constructor(
    private eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.initializeMetrics();
    this.startRealtimeDataCollection();
  }

  // ===== DASHBOARD MANAGEMENT =====

  async createDashboard(userId: string, request: CreateDashboardRequest): Promise<{
    dashboardId: string;
    url: string;
    widgets: number;
  }> {
    this.logger.log(`Creating dashboard: ${userId} -> ${request.name}`);

    const dashboardId = `dashboard_${nanoid(12)}`;

    const dashboard: AnalyticsDashboard = {
      id: dashboardId,
      name: request.name,
      description: request.description,
      type: request.type,
      category: request.category,
      owner: userId,
      isPublic: request.isPublic,
      widgets: [],
      layout: {
        columns: 12,
        rows: 8,
        gap: 16,
        autoResize: true,
      },
      filters: [],
      refreshInterval: request.refreshInterval || this.analyticsConfig.defaultRefreshInterval,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastRefreshed: new Date(),
    };

    this.dashboards.set(dashboardId, dashboard);

    this.eventEmitter.emit('analytics.dashboard_created', {
      dashboardId,
      userId,
      name: request.name,
      type: request.type,
    });

    return {
      dashboardId,
      url: `/dashboards/${dashboardId}`,
      widgets: 0,
    };
  }

  async getDashboards(userId: string, filters?: {
    type?: DashboardType;
    category?: DashboardCategory;
    isPublic?: boolean;
  }): Promise<{
    dashboards: Array<AnalyticsDashboard & {
      widgetCount: number;
      lastAccessed: Date;
      performance: {
        loadTime: number;
        refreshRate: number;
      };
    }>;
    summary: {
      total: number;
      byType: Record<string, number>;
      byCategory: Record<string, number>;
    };
  }> {
    let dashboards = Array.from(this.dashboards.values());

    // Filter by ownership and public visibility
    dashboards = dashboards.filter(d => d.owner === userId || d.isPublic);

    // Apply filters
    if (filters?.type) {
      dashboards = dashboards.filter(d => d.type === filters.type);
    }
    if (filters?.category) {
      dashboards = dashboards.filter(d => d.category === filters.category);
    }
    if (filters?.isPublic !== undefined) {
      dashboards = dashboards.filter(d => d.isPublic === filters.isPublic);
    }

    const enhancedDashboards = dashboards.map(dashboard => ({
      ...dashboard,
      widgetCount: Object.values(dashboard.widgets).length,
      lastAccessed: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Mock
      performance: {
        loadTime: 250 + Math.random() * 200, // Mock load time
        refreshRate: dashboard.refreshInterval,
      },
    }));

    const summary = {
      total: Object.values(dashboards).length,
      byType: this.groupByField(dashboards, 'type'),
      byCategory: this.groupByField(dashboards, 'category'),
    };

    return {
      dashboards: enhancedDashboards,
      summary,
    };
  }

  // ===== REAL-TIME METRICS =====

  async getRealtimeMetrics(): Promise<RealtimeMetrics> {
    const timestamp = new Date();

    const systemHealth: SystemHealthMetrics = {
      uptime: 99.95,
      cpuUsage: 45.2,
      memoryUsage: 68.5,
      diskUsage: 32.1,
      networkLatency: 12.5,
      errorRate: 0.02,
      responseTime: 285,
      throughput: 1250,
      activeConnections: 1850,
    };

    const businessMetrics: BusinessMetrics = {
      revenue: {
        today: 125000,
        thisWeek: 780000,
        thisMonth: 3200000,
        thisYear: 32500000,
        change: 12.5,
      },
      customers: {
        total: 125000,
        active: 95000,
        new: 1250,
        churn: 2.1,
        growth: 8.5,
      },
      transactions: {
        count: 45780,
        volume: 12500000,
        successRate: 99.2,
        averageAmount: 273,
        topChannels: [
          { channel: 'Mobile App', count: 28000, volume: 7500000 },
          { channel: 'Web Portal', count: 12000, volume: 3200000 },
          { channel: 'ATM', count: 5780, volume: 1800000 },
        ],
      },
      loans: {
        applications: 450,
        approvals: 380,
        disbursements: 320,
        portfolio: 85000000,
        defaultRate: 3.2,
      },
      investments: {
        assetsUnderManagement: 125000000,
        newInvestments: 2500000,
        returns: 8.5,
        activePortfolios: 12500,
      },
    };

    const customerMetrics: CustomerMetrics = {
      demographics: {
        ageGroups: [
          { range: '18-25', count: 25000, percentage: 20 },
          { range: '26-35', count: 45000, percentage: 36 },
          { range: '36-45', count: 35000, percentage: 28 },
          { range: '46-55', count: 15000, percentage: 12 },
          { range: '56+', count: 5000, percentage: 4 },
        ],
        genderDistribution: [
          { gender: 'Male', count: 68000, percentage: 54.4 },
          { gender: 'Female', count: 57000, percentage: 45.6 },
        ],
        locationDistribution: [
          { region: 'Greater Accra', count: 45000, percentage: 36 },
          { region: 'Ashanti', count: 28000, percentage: 22.4 },
          { region: 'Northern', count: 15000, percentage: 12 },
          { region: 'Western', count: 12000, percentage: 9.6 },
          { region: 'Other', count: 25000, percentage: 20 },
        ],
      },
      behavior: {
        sessionDuration: 8.5,
        pagesPerSession: 4.2,
        bounceRate: 0.25,
        retentionRate: 0.85,
        engagementScore: 7.8,
      },
      satisfaction: {
        nps: 78,
        csat: 4.6,
        ces: 3.2,
        reviews: [
          { rating: 5, count: 8500 },
          { rating: 4, count: 4200 },
          { rating: 3, count: 1800 },
          { rating: 2, count: 650 },
          { rating: 1, count: 350 },
        ],
      },
    };

    const transactionMetrics: TransactionMetrics = {
      realTime: {
        tps: 125.5,
        volume: 2500000,
        successRate: 99.2,
        failureRate: 0.8,
        averageResponseTime: 285,
      },
      categories: [
        { type: 'Transfer', count: 15000, volume: 8500000, successRate: 99.5 },
        { type: 'Bill Payment', count: 12000, volume: 2800000, successRate: 98.8 },
        { type: 'Airtime', count: 8500, volume: 450000, successRate: 99.8 },
        { type: 'Loan Payment', count: 5200, volume: 1200000, successRate: 99.1 },
      ],
      channels: [
        { channel: 'Mobile', count: 28000, volume: 8500000, conversionRate: 0.85 },
        { channel: 'Web', count: 12000, volume: 3200000, conversionRate: 0.78 },
        { channel: 'ATM', count: 5780, volume: 800000, conversionRate: 0.92 },
      ],
      fraud: {
        detectedCount: 45,
        blockedAmount: 125000,
        falsePositiveRate: 0.02,
        detectionRate: 0.98,
      },
    };

    const performanceMetrics: PerformanceMetrics = {
      api: {
        totalRequests: 125000,
        successfulRequests: 123800,
        failedRequests: 1200,
        averageResponseTime: 285,
        p95ResponseTime: 450,
        p99ResponseTime: 750,
        errorRate: 0.96,
      },
      database: {
        connections: 85,
        queriesPerSecond: 2500,
        averageQueryTime: 15.5,
        slowQueries: 12,
        connectionPoolUtilization: 0.68,
      },
      cache: {
        hitRate: 0.92,
        missRate: 0.08,
        evictionRate: 0.015,
        memoryUsage: 0.75,
        keyCount: 125000,
      },
    };

    return {
      timestamp,
      systemHealth,
      businessMetrics,
      customerMetrics,
      transactionMetrics,
      performanceMetrics,
    };
  }

  async queryAnalytics(request: QueryAnalyticsRequest): Promise<{
    data: Array<Record<string, any>>;
    metadata: {
      totalRows: number;
      executionTime: number;
      queryId: string;
      cached: boolean;
    };
    aggregations: Record<string, number>;
  }> {
    this.logger.log(`Executing analytics query: ${request.metric}`);

    const queryId = `query_${nanoid(8)}`;
    const startTime = Date.now();

    // Simulate data based on metric
    const data = this.generateMockAnalyticsData(request);
    
    const executionTime = Date.now() - startTime;

    const aggregations = {
      sum: Object.values(data).reduce((sum, row) => sum + (row.value || 0), 0),
      count: Object.values(data).length,
      average: Object.values(data).reduce((sum, row) => sum + (row.value || 0), 0) / Object.values(data).length,
      min: Math.min(...data.map(row => row.value || 0)),
      max: Math.max(...data.map(row => row.value || 0)),
    };

    return {
      data,
      metadata: {
        totalRows: Object.values(data).length,
        executionTime,
        queryId,
        cached: false,
      },
      aggregations,
    };
  }

  // ===== BUSINESS INTELLIGENCE =====

  async getBusinessInsights(): Promise<{
    insights: Array<{
      id: string;
      title: string;
      description: string;
      category: string;
      impact: 'high' | 'medium' | 'low';
      confidence: number;
      recommendations: string[];
      metrics: Record<string, number>;
      trend: TrendDirection;
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
  }> {
    const insights = [
      {
        id: 'insight_001',
        title: 'Mobile Transaction Growth',
        description: 'Mobile transactions have increased by 45% this month, indicating strong digital adoption',
        category: 'Digital Transformation',
        impact: 'high' as const,
        confidence: 92,
        recommendations: [
          'Invest in mobile app features',
          'Optimize mobile transaction flows',
          'Launch targeted mobile campaigns',
        ],
        metrics: {
          growth: 45,
          volume: 28000,
          conversion: 85,
        },
        trend: TrendDirection.UP,
      },
      {
        id: 'insight_002',
        title: 'Loan Default Risk',
        description: 'Early indicators suggest potential increase in loan defaults for Q1 2025',
        category: 'Risk Management',
        impact: 'medium' as const,
        confidence: 78,
        recommendations: [
          'Strengthen credit assessment criteria',
          'Implement early intervention programs',
          'Review loan pricing models',
        ],
        metrics: {
          riskScore: 68,
          portfolio: 85000000,
          defaultRate: 3.2,
        },
        trend: TrendDirection.UP,
      },
    ];

    const kpis = [
      {
        name: 'Customer Acquisition',
        value: 1250,
        target: 1500,
        performance: 83.3,
        trend: TrendDirection.UP,
        unit: 'customers',
      },
      {
        name: 'Revenue Growth',
        value: 12.5,
        target: 15.0,
        performance: 83.3,
        trend: TrendDirection.UP,
        unit: '%',
      },
      {
        name: 'Customer Satisfaction',
        value: 4.6,
        target: 4.5,
        performance: 102.2,
        trend: TrendDirection.STABLE,
        unit: 'rating',
      },
    ];

    const alerts = [
      {
        id: 'alert_001',
        title: 'High API Error Rate',
        severity: 'warning' as const,
        message: 'API error rate has exceeded 1% threshold in the last hour',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        resolved: false,
      },
      {
        id: 'alert_002',
        title: 'Database Connection Spike',
        severity: 'info' as const,
        message: 'Database connection pool utilization reached 85%',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        resolved: true,
      },
    ];

    return {
      insights: [],
      kpis,
      alerts: (alerts as any)?.alerts || alerts,
    };
  }

  // ===== PERFORMANCE MONITORING =====

  async getPerformanceReport(timeRange: TimeRange): Promise<{
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
  }> {
    // Generate performance data for the time range
    const trends = this.generatePerformanceTrends(timeRange);
    
    const summary = {
      averageResponseTime: Object.values(trends).reduce((sum, t) => sum + t.responseTime, 0) / Object.values(trends).length,
      errorRate: Object.values(trends).reduce((sum, t) => sum + t.errorRate, 0) / Object.values(trends).length,
      throughput: Object.values(trends).reduce((sum, t) => sum + t.throughput, 0) / Object.values(trends).length,
      uptime: 99.95,
    };

    const bottlenecks = [
      {
        component: 'Database',
        metric: 'Query Time',
        value: 45.2,
        threshold: 30,
        severity: 'warning' as const,
      },
      {
        component: 'API Gateway',
        metric: 'Response Time',
        value: 285,
        threshold: 300,
        severity: 'info' as const,
      },
    ];

    const recommendations = [
      'Optimize database queries with high execution time',
      'Consider implementing API response caching',
      'Scale API gateway instances during peak hours',
      'Monitor memory usage patterns for potential optimization',
    ];

    return {
      summary,
      trends,
      bottlenecks,
      recommendations,
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  private initializeMetrics(): void {
    const defaultMetrics: AnalyticsMetric[] = [
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
      },
    ];

    defaultMetrics.forEach(metric => {
      this.metrics.set(metric.id, metric);
    });

    this.logger.log('Analytics metrics initialized');
  }

  private startRealtimeDataCollection(): void {
    // Simulate real-time data collection
    setInterval(() => {
      this.collectRealtimeData();
    }, 5000); // Collect every 5 seconds

    this.logger.log('Real-time data collection started');
  }

  private collectRealtimeData(): void {
    const timestamp = new Date();
    
    // Update metrics with real-time data
    this.metrics.forEach((metric, id) => {
      if (metric.isRealTime) {
        const newValue = this.generateRealtimeValue(metric);
        metric.previousValue = metric.value;
        metric.value = newValue;
        metric.change = newValue - metric.previousValue;
        metric.changePercent = (metric.change / metric.previousValue) * 100;
        metric.trend = metric.change > 0 ? TrendDirection.UP : 
                     metric.change < 0 ? TrendDirection.DOWN : TrendDirection.STABLE;
        metric.lastCalculated = timestamp;
      }
    });

    // Store realtime snapshot
    this.realtimeData.set(timestamp.toISOString(), {
      timestamp,
      metrics: Array.from(this.metrics.values()),
    });

    // Emit real-time update event
    this.eventEmitter.emit('analytics.realtime_update', {
      timestamp,
      metricCount: this.metrics.size,
    });
  }

  private generateRealtimeValue(metric: AnalyticsMetric): number {
    // Simulate realistic value changes
    const baseValue = metric.value;
    const volatility = 0.05; // 5% volatility
    const randomFactor = (Math.random() - 0.5) * 2 * volatility;
    return Math.max(0, baseValue * (1 + randomFactor));
  }

  private generateMockAnalyticsData(request: QueryAnalyticsRequest): Array<Record<string, any>> {
    const data: Array<Record<string, any>> = [];
    const recordCount = Math.min(request.limit || 100, 1000);

    for (let i = 0; i < recordCount; i++) {
      const record: Record<string, any> = {
        timestamp: new Date(Date.now() - i * 60000), // Every minute
        value: Math.floor(Math.random() * 1000) + 100,
      };

      // Add dimensions
      if (request.dimensions) {
        request.dimensions.forEach(dimension => {
          record[dimension] = this.generateDimensionValue(dimension);
        });
      }

      data.push(record);
    }

    return data;
  }

  private generateDimensionValue(dimension: string): any {
    const dimensionValues = {
      channel: ['mobile', 'web', 'atm', 'branch'],
      region: ['Greater Accra', 'Ashanti', 'Northern', 'Western'],
      customer_type: ['individual', 'business', 'premium'],
      transaction_type: ['transfer', 'payment', 'withdrawal', 'deposit'],
      age_group: ['18-25', '26-35', '36-45', '46-55', '56+'],
    };

    const values = dimensionValues[dimension] || ['unknown'];
    return values[Math.floor(Math.random() * Object.values(values).length)];
  }

  private generatePerformanceTrends(timeRange: TimeRange): Array<{
    timestamp: Date;
    responseTime: number;
    errorRate: number;
    throughput: number;
  }> {
    const trends = [];
    const intervalMs = 5 * 60 * 1000; // 5-minute intervals
    
    for (let time = timeRange.start.getTime(); time <= timeRange.end.getTime(); time += intervalMs) {
      trends.push({
        timestamp: new Date(time),
        responseTime: 200 + Math.random() * 200, // 200-400ms
        errorRate: Math.random() * 0.02, // 0-2%
        throughput: 1000 + Math.random() * 500, // 1000-1500 TPS
      });
    }

    return trends;
  }

  private groupByField(items: any[], field: string): Record<string, number> {
    return Object.values(items).reduce((acc, item) => {
      const key = item[field];
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }
}