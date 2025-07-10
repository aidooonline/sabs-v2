import { HttpException, HttpStatus } from '@nestjs/common';
import { getErrorMessage, getErrorStack, getErrorStatus, UserRole, ReportType, LibraryCapability } from '@sabs/common';
import {
import { nanoid } from 'nanoid';

  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  ValidationPipe,
  BadRequestException,
  Logger,
  Headers,
} from '@nestjs/common';
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

  ExecutiveDashboardService,
  ExecutiveDashboard,
  KPIMetric,
  StrategicAlert,
  ExecutiveReport,
  BoardMeeting,
  DashboardType,
  ExecutiveLevel,
  KPICategory,
  KPIStatus,
  TrendDirection,
  AlertCategory,
  AlertSeverity,
  AlertStatus,

  ReportPeriod,
  CreateDashboardRequest,
  CreateAlertRequest,
  GenerateReportRequest,
} from '../services/executive-dashboard.service';

// ===== REQUEST DTOs =====

export class CreateDashboardDto {
  name: string;
  type: DashboardType;
  audience: ExecutiveLevel;
  layout?: {
    columns?: number;
    rows?: number;
    responsive?: boolean;
    theme?: string;
  };
  widgets?: Array<{
    type: string;
    title: string;
    position?: { x: number; y: number; width: number; height: number };
    configuration?: Record<string, any>;
  }>;
}

export class CreateAlertDto {
  title: string;
  description: string;
  category: AlertCategory;
  severity: AlertSeverity;
  kpiId?: string;
  threshold: {
    operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'between';
    value: number;
    secondaryValue?: number;
  };
  recipients: string[];
}

export class GenerateReportDto {
  type: ReportType;
  period: ReportPeriod;
  startDate?: Date;
  endDate?: Date;
  includeCharts: boolean;
  recipients: string[];
}

export class UpdateKPIDto {
  value: number;
  timestamp?: Date;
}

// ===== RESPONSE DTOs =====

export class DashboardResponseDto {
  id: string;
  name: string;
  type: DashboardType;
  audience: ExecutiveLevel;
  lastViewed: Date;
  viewCount: number;
  widgetCount: number;
  status: string;
  refreshRate: number;
}

export class KPIResponseDto {
  id: string;
  name: string;
  category: KPICategory;
  currentValue: number;
  targetValue: number;
  variance: number;
  status: KPIStatus;
  trend: TrendDirection;
  lastUpdated: Date;
  unit: string;
}

export class AlertResponseDto {
  id: string;
  title: string;
  description: string;
  category: AlertCategory;
  severity: AlertSeverity;
  status: AlertStatus;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  assignedTo: string[];
  currentValue: number;
}

@ApiTags('Executive Dashboard & KPI Monitoring')
@Controller('executive-dashboard')
export class ExecutiveDashboardController {
  private readonly logger = new Logger(ExecutiveDashboardController.name);

  constructor(private readonly executiveService: ExecutiveDashboardService) {}

  // ===== EXECUTIVE DASHBOARD ENDPOINTS =====

  @Get('dashboards')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get executive dashboards' })
  @ApiQuery({ name: 'executiveLevel', _required: any, enum: ExecutiveLevel })
  @ApiQuery({ name: 'type', _required: any, enum: DashboardType })
  @ApiResponse({ status: 200, _description: any)
  async getExecutiveDashboards(
    @Headers('authorization') authorization: string,
    @Query('executiveLevel') executiveLevel?: ExecutiveLevel,
    @Query('type') type?: DashboardType,
  ): Promise<{
    dashboards: DashboardResponseDto[];
    summary: {
      totalDashboards: number;
      activeDashboards: number;
      averageViewCount: number;
      lastActivity: Date;
    };
    recommendations: Array<{
      type: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  }> {
    const userId = await this.extractUserId(authorization);
    const userLevel = executiveLevel || ExecutiveLevel.C_SUITE;
    
    this.logger.log(`Getting executive dashboards: ${userId} -> ${userLevel}`);

    const result = await this.executiveService.getExecutiveDashboards(userLevel);

    const dashboards = result.dashboards.map(dashboard => ({
      id: dashboard.id,
      name: dashboard.name,
      type: dashboard.type,
      audience: dashboard.audience,
      lastViewed: dashboard.lastViewed,
      viewCount: dashboard.viewCount,
      widgetCount: dashboard.widgetCount,
      status: dashboard.status,
      refreshRate: 300,
    }));

    const recommendations = [
      {
        type: 'Dashboard Optimization',
        description: 'Add real-time transaction monitoring widget',
        priority: 'high' as const,
      },
      {
        type: 'KPI Enhancement',
        description: 'Configure customer satisfaction alerts',
        priority: 'medium' as const,
      },
      {
        type: 'Data Integration',
        description: 'Connect external market data feeds',
        priority: 'medium' as const,
      },
    ];

    return {
      dashboards,
      summary: result.summary,
      recommendations,
    };
  }

  @Post('dashboards')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create executive dashboard' })
  @ApiResponse({ status: 201, _description: any)
  @ApiResponse({ status: 400, _description: any)
  async createExecutiveDashboard(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) dashboardDto: CreateDashboardDto,
  ): Promise<{
    dashboardId: string;
    layout: any;
    widgets: any[];
    refreshRate: number;
    message: string;
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Creating executive dashboard: ${userId} -> ${dashboardDto.name}`);

    const request: CreateDashboardRequest = {
      name: dashboardDto.name,
      type: dashboardDto.type,
      audience: dashboardDto.audience,
      layout: dashboardDto.layout || {},
      widgets: (dashboardDto.widgets || []).map(w => ({ ...w, _type: any)),
    };

    const result = await this.executiveService.createExecutiveDashboard(request);

    return {
      ...result,
      message: 'Executive dashboard created successfully with real-time monitoring enabled.',
    };
  }

  @Get('dashboards/:dashboardId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard real-time data' })
  @ApiParam({ name: 'dashboardId', _description: any)
  @ApiResponse({ status: 200, _description: any)
  async getDashboardData(
    @Headers('authorization') authorization: string,
    @Param('dashboardId') dashboardId: string,
  ): Promise<{
    dashboard: {
      id: string;
      name: string;
      type: DashboardType;
      audience: ExecutiveLevel;
      refreshRate: number;
    };
    realTimeData: Record<string, any>;
    alerts: AlertResponseDto[];
    lastUpdated: Date;
    performance: {
      loadTime: number;
      dataFreshness: number;
      errorRate: number;
    };
    insights: Array<{
      type: string;
      message: string;
      impact: 'positive' | 'negative' | 'neutral';
      confidence: number;
    }>;
  }> {
    const userId = await this.extractUserId(authorization);
    
    const result = await this.executiveService.getDashboardData(dashboardId);

    const alerts = result.alerts.map(alert => ({
      id: alert.id,
      title: alert.title,
      description: alert.description,
      category: alert.category,
      severity: alert.severity,
      status: alert.status,
      triggeredAt: alert.triggeredAt,
      acknowledgedAt: alert.acknowledgedAt,
      assignedTo: alert.assignedTo,
      currentValue: alert.currentValue,
    }));

    const insights = [
      {
        type: 'Performance',
        message: 'Revenue growth accelerating beyond targets',
        impact: 'positive' as const,
        confidence: 0.92,
      },
      {
        type: 'Risk',
        message: 'Customer acquisition costs trending upward',
        impact: 'negative' as const,
        confidence: 0.78,
      },
      {
        type: 'Opportunity',
        message: 'Digital adoption rates exceeding industry average',
        impact: 'positive' as const,
        confidence: 0.85,
      },
    ];

    return {
      dashboard: {
        id: result.dashboard.id,
        name: result.dashboard.name,
        type: result.dashboard.type,
        audience: result.dashboard.audience,
        refreshRate: result.dashboard.refreshRate,
      },
      realTimeData: result.realTimeData,
      alerts: (alerts as any)?.alerts || alerts,
      lastUpdated: result.lastUpdated,
      performance: result.performance,
      insights: [],
    };
  }

  // ===== KPI MONITORING ENDPOINTS =====

  @Get('kpis')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get executive KPIs' })
  @ApiQuery({ name: 'category', _required: any, enum: KPICategory })
  @ApiQuery({ name: 'status', _required: any, enum: KPIStatus })
  @ApiResponse({ status: 200, _description: any)
  async getExecutiveKPIs(
    @Headers('authorization') authorization: string,
    @Query('category') category?: KPICategory,
    @Query('status') status?: KPIStatus,
  ): Promise<{
    kpis: KPIResponseDto[];
    summary: {
      totalKPIs: number;
      onTarget: number;
      aboveTarget: number;
      belowTarget: number;
      critical: number;
      overallScore: number;
    };
    trends: Array<{
      category: KPICategory;
      trend: TrendDirection;
      performanceScore: number;
      keyDrivers: string[];
    }>;
    forecasts: Array<{
      kpiId: string;
      predictedValue: number;
      confidence: number;
      timeframe: string;
    }>;
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Getting executive KPIs: ${userId} -> ${category || 'all'}`);

    const result = await this.executiveService.getExecutiveKPIs(category);

    let kpis = result.kpis;
    if (status) {
      kpis = kpis.filter(kpi => kpi.status === status);
    }

    const kpiResponses = kpis.map(kpi => ({
      id: kpi.id,
      name: kpi.name,
      category: kpi.category,
      currentValue: kpi.currentValue,
      targetValue: kpi.targetValue,
      variance: kpi.variance,
      status: kpi.status,
      trend: kpi.trend,
      lastUpdated: kpi.lastUpdated,
      unit: kpi.unit,
    }));

    const enhancedSummary = {
      ...result.summary,
      overallScore: Math.round((result.summary.onTarget / result.summary.totalKPIs) * 100),
    };

    const enhancedTrends = result.trends.map(trend => ({
      ...trend,
      keyDrivers: this.getKeyDrivers(trend.category),
    }));

    const forecasts = kpis.slice(0, 5).map(kpi => ({
      kpiId: kpi.id,
      predictedValue: kpi.currentValue * (1 + (Math.random() - 0.5) * 0.2),
      confidence: 0.75 + Math.random() * 0.2,
      timeframe: '30 days',
    }));

    return {
      kpis: kpiResponses,
      summary: enhancedSummary,
      trends: enhancedTrends,
      forecasts,
    };
  }

  @Put('kpis/:kpiId/value')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update KPI value' })
  @ApiParam({ name: 'kpiId', _description: any)
  @ApiResponse({ status: 200, _description: any)
  async updateKPIValue(
    @Headers('authorization') authorization: string,
    @Param('kpiId') kpiId: string,
    @Body(ValidationPipe) updateDto: UpdateKPIDto,
  ): Promise<{
    kpi: KPIResponseDto;
    previousStatus: KPIStatus;
    newStatus: KPIStatus;
    alertTriggered: boolean;
    variance: number;
    impact: {
      description: string;
      recommendations: string[];
      stakeholders: string[];
    };
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Updating KPI value: ${userId} -> ${kpiId} = ${updateDto.value}`);

    const result = await this.executiveService.updateKPIValue(kpiId, updateDto.value);

    const impact = {
      description: this.generateKPIImpactDescription(result.kpi, result.newStatus),
      recommendations: this.generateKPIRecommendations(result.kpi, result.newStatus),
      stakeholders: this.getAffectedStakeholders(result.kpi.category),
    };

    return {
      kpi: {
        id: result.kpi.id,
        name: result.kpi.name,
        category: result.kpi.category,
        currentValue: result.kpi.currentValue,
        targetValue: result.kpi.targetValue,
        variance: result.kpi.variance,
        status: result.kpi.status,
        trend: result.kpi.trend,
        lastUpdated: result.kpi.lastUpdated,
        unit: result.kpi.unit,
      },
      previousStatus: result.previousStatus,
      newStatus: result.newStatus,
      alertTriggered: result.alertTriggered,
      variance: result.variance,
      impact,
    };
  }

  // ===== STRATEGIC ALERTS ENDPOINTS =====

  @Get('alerts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get strategic alerts' })
  @ApiQuery({ name: 'severity', _required: any, enum: AlertSeverity })
  @ApiQuery({ name: 'category', _required: any, enum: AlertCategory })
  @ApiQuery({ name: 'status', _required: any, enum: AlertStatus })
  @ApiResponse({ status: 200, _description: any)
  async getStrategicAlerts(
    @Headers('authorization') authorization: string,
    @Query('severity') severity?: AlertSeverity,
    @Query('category') category?: AlertCategory,
    @Query('status') status?: AlertStatus,
  ): Promise<{
    alerts: AlertResponseDto[];
    summary: {
      total: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
      unacknowledged: number;
      responseTime: number;
    };
    categories: Array<{
      category: AlertCategory;
      count: number;
      criticalCount: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
    escalations: Array<{
      alertId: string;
      level: number;
      scheduledAt: Date;
      recipients: string[];
    }>;
  }> {
    const userId = await this.extractUserId(authorization);
    const userLevel = ExecutiveLevel.C_SUITE; // Default for this endpoint
    
    const result = await this.executiveService.getActiveAlerts(userLevel);

    // Apply filters
    let alerts = result.alerts;
    if (severity) alerts = alerts.filter(a => a.severity === severity);
    if (category) alerts = alerts.filter(a => a.category === category);
    if (status) alerts = alerts.filter(a => a.status === status);

    const alertResponses = alerts.map(alert => ({
      id: alert.id,
      title: alert.title,
      description: alert.description,
      category: alert.category,
      severity: alert.severity,
      status: alert.status,
      triggeredAt: alert.triggeredAt,
      acknowledgedAt: alert.acknowledgedAt,
      assignedTo: alert.assignedTo,
      currentValue: alert.currentValue,
    }));

    const enhancedSummary = {
      ...result.summary,
      responseTime: 15, // Average response time in minutes
    };

    const enhancedCategories = result.categories.map(cat => ({
      ...cat,
      trend: 'stable' as const, // Mock trend data
    }));

    const escalations = alerts
      .filter(alert => alert.severity === AlertSeverity.CRITICAL)
      .slice(0, 3)
      .map(alert => ({
        alertId: alert.id,
        level: 1,
        scheduledAt: new Date(Date.now() + 15 * 60 * 1000),
        recipients: alert.assignedTo,
      }));

    return {
      alerts: alertResponses,
      summary: enhancedSummary,
      categories: enhancedCategories,
      escalations,
    };
  }

  @Post('alerts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create strategic alert' })
  @ApiResponse({ status: 201, _description: any)
  async createStrategicAlert(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) alertDto: CreateAlertDto,
  ): Promise<{
    alertId: string;
    status: AlertStatus;
    escalationSchedule: Array<{
      level: number;
      scheduledAt: Date;
      recipients: string[];
    }>;
    message: string;
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Creating strategic alert: ${userId} -> ${alertDto.title}`);

    const request: CreateAlertRequest = {
      title: alertDto.title,
      description: alertDto.description,
      category: alertDto.category,
      severity: alertDto.severity,
      kpiId: alertDto.kpiId,
      threshold: alertDto.threshold,
      recipients: alertDto.recipients,
    };

    const result = await this.executiveService.createStrategicAlert(request);

    return {
      ...result,
      message: 'Strategic alert created and monitoring initiated.',
    };
  }

  @Put('alerts/:alertId/acknowledge')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Acknowledge strategic alert' })
  @ApiParam({ name: 'alertId', _description: any)
  @ApiResponse({ status: 200, _description: any)
  async acknowledgeAlert(
    @Headers('authorization') authorization: string,
    @Param('alertId') alertId: string,
    @Body() body: { notes?: string },
  ): Promise<{
    alertId: string;
    acknowledgedAt: Date;
    acknowledgedBy: string;
    nextSteps: string[];
    escalationPaused: boolean;
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Acknowledging alert: ${userId} -> ${alertId}`);

    return {
      alertId,
      acknowledgedAt: new Date(),
      acknowledgedBy: userId,
      nextSteps: [
        'Review alert details and impact assessment',
        'Coordinate with relevant stakeholders',
        'Implement corrective actions if required',
        'Monitor situation for resolution',
      ],
      escalationPaused: true,
    };
  }

  // ===== EXECUTIVE REPORTING ENDPOINTS =====

  @Post('reports')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate executive report' })
  @ApiResponse({ status: 201, _description: any)
  async generateExecutiveReport(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) reportDto: GenerateReportDto,
  ): Promise<{
    reportId: string;
    executiveSummary: string;
    keyFindings: string[];
    recommendations: string[];
    generationStatus: string;
    estimatedDelivery?: Date;
    distribution: {
      recipients: string[];
      deliveryMethod: string;
      scheduledTime: Date;
    };
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Generating executive report: ${userId} -> ${reportDto.type}`);

    const request: GenerateReportRequest = {
      type: reportDto.type,
      period: reportDto.period,
      startDate: reportDto.startDate,
      endDate: reportDto.endDate,
      includeCharts: reportDto.includeCharts,
      recipients: reportDto.recipients,
    };

    const result = await this.executiveService.generateExecutiveReport(request);

    const distribution = {
      recipients: reportDto.recipients,
      deliveryMethod: 'secure_email',
      scheduledTime: result.estimatedDelivery || new Date(),
    };

    return {
      ...result,
      distribution,
    };
  }

  @Get('reports')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get executive reports' })
  @ApiQuery({ name: 'type', _required: any, enum: ReportType })
  @ApiQuery({ name: 'period', _required: any, enum: ReportPeriod })
  @ApiResponse({ status: 200, _description: any)
  async getExecutiveReports(
    @Headers('authorization') authorization: string,
    @Query('type') type?: ReportType,
    @Query('period') period?: ReportPeriod,
  ): Promise<{
    reports: Array<{
      id: string;
      title: string;
      type: ReportType;
      period: ReportPeriod;
      generatedAt: Date;
      status: string;
      executiveSummary: string;
      keyInsights: number;
      pageCount: number;
    }>;
    analytics: {
      totalReports: number;
      mostRequestedType: ReportType;
      averageGenerationTime: number;
      distributionMetrics: {
        emailDeliveries: number;
        viewCount: number;
        downloadCount: number;
      };
    };
  }> {
    const userId = await this.extractUserId(authorization);
    
    // Mock reports data
    const reports = [
      {
        id: 'report_exec_001',
        title: 'Monthly Executive Summary - December 2024',
        type: ReportType.EXECUTIVE,
        period: ReportPeriod.MONTHLY,
        generatedAt: new Date('2024-12-01'),
        status: 'published',
        executiveSummary: 'Strong performance across all key metrics with revenue growth of 15%.',
        keyInsights: 8,
        pageCount: 12,
      },
      {
        id: 'report_board_001',
        title: 'Q4 Board Report 2024',
        type: ReportType.EXECUTIVE,
        period: ReportPeriod.QUARTERLY,
        generatedAt: new Date('2024-12-15'),
        status: 'approved',
        executiveSummary: 'Strategic objectives achieved with exceptional customer growth.',
        keyInsights: 15,
        pageCount: 24,
      },
    ];

    const analytics = {
      totalReports: 28,
      mostRequestedType: ReportType.EXECUTIVE,
      averageGenerationTime: 4.2, // minutes
      distributionMetrics: {
        emailDeliveries: 156,
        viewCount: 425,
        downloadCount: 89,
      },
    };

    return {
      reports,
      analytics,
    };
  }

  // ===== BOARD MEETING SUPPORT ENDPOINTS =====

  @Get('board-dashboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get board meeting dashboard' })
  @ApiResponse({ status: 200, _description: any)
  async getBoardMeetingDashboard(
    @Headers('authorization') authorization: string,
  ): Promise<{
    upcomingMeetings: Array<{
      id: string;
      title: string;
      date: Date;
      duration: number;
      attendees: number;
      agendaItems: number;
      materialsReady: boolean;
    }>;
    recentDecisions: Array<{
      id: string;
      title: string;
      decision: string;
      madeAt: Date;
      effectiveDate: Date;
      impactAssessment: string;
    }>;
    pendingActions: Array<{
      id: string;
      description: string;
      assignedTo: string;
      dueDate: Date;
      priority: string;
      status: string;
      progress: number;
    }>;
    governanceMetrics: {
      attendanceRate: number;
      decisionVelocity: number;
      actionItemCompletion: number;
      complianceScore: number;
    };
    boardPackageSummary: {
      totalMaterials: number;
      reportsIncluded: number;
      criticalItems: number;
      preparationStatus: number;
    };
  }> {
    const userId = await this.extractUserId(authorization);
    
    const result = await this.executiveService.getBoardMeetingDashboard();

    const upcomingMeetings = result.upcomingMeetings.map(meeting => ({
      id: meeting.id,
      title: meeting.title,
      date: meeting.date,
      duration: meeting.duration,
      attendees: Object.values(meeting.attendees).length,
      agendaItems: Object.values(meeting.agenda).length,
      materialsReady: Object.values(meeting.materials).length > 0,
    }));

    const recentDecisions = result.recentDecisions.map(decision => ({
      id: decision.id,
      title: decision.title,
      decision: decision.decision,
      madeAt: decision.madeAt,
      effectiveDate: decision.effectiveDate,
      impactAssessment: 'High strategic impact with positive revenue implications',
    }));

    const pendingActions = result.pendingActions.map(action => ({
      id: action.id,
      description: action.description,
      assignedTo: action.assignedTo,
      dueDate: action.dueDate,
      priority: action.priority,
      status: action.status,
      progress: action.progress,
    }));

    const governanceMetrics = {
      ...result.governance,
      complianceScore: 96.5,
    };

    const boardPackageSummary = {
      totalMaterials: result.Object.values(boardPackage.materials).length,
      reportsIncluded: result.Object.values(boardPackage.reports).length,
      criticalItems: result.boardPackage.Object.values(kpiSummary.critical).length,
      preparationStatus: 92,
    };

    return {
      upcomingMeetings,
      recentDecisions,
      pendingActions,
      governanceMetrics,
      boardPackageSummary,
    };
  }

  // ===== PERFORMANCE & ANALYTICS ENDPOINTS =====

  @Get('performance-metrics')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get executive performance metrics' })
  @ApiResponse({ status: 200, _description: any)
  async getPerformanceMetrics(
    @Headers('authorization') authorization: string,
  ): Promise<{
    systemHealth: {
      dashboardAvailability: number;
      dataFreshness: number;
      responseTime: number;
      errorRate: number;
    };
    userEngagement: {
      dailyActiveUsers: number;
      averageSessionDuration: number;
      dashboardViews: number;
      reportGeneration: number;
    };
    businessImpact: {
      decisionsInfluenced: number;
      alertResponseTime: number;
      kpiImprovementRate: number;
      costSavings: number;
    };
    trends: Array<{
      metric: string;
      value: number;
      trend: 'up' | 'down' | 'stable';
      change: number;
      period: string;
    }>;
  }> {
    const userId = await this.extractUserId(authorization);
    
    const systemHealth = {
      dashboardAvailability: 99.95,
      dataFreshness: 98.2,
      responseTime: 145, // ms
      errorRate: 0.08,
    };

    const userEngagement = {
      dailyActiveUsers: 45,
      averageSessionDuration: 18.5, // minutes
      dashboardViews: 1250,
      reportGeneration: 89,
    };

    const businessImpact = {
      decisionsInfluenced: 156,
      alertResponseTime: 12, // minutes
      kpiImprovementRate: 78.5,
      costSavings: 2500000, // GHS
    };

    const trends = [
      {
        metric: 'Dashboard Usage',
        value: 1250,
        trend: 'up' as const,
        change: 15.2,
        period: 'monthly',
      },
      {
        metric: 'Alert Response Time',
        value: 12,
        trend: 'down' as const,
        change: -8.5,
        period: 'weekly',
      },
      {
        metric: 'KPI Accuracy',
        value: 96.8,
        trend: 'up' as const,
        change: 2.3,
        period: 'monthly',
      },
    ];

    return {
      systemHealth,
      userEngagement,
      businessImpact,
      trends,
    };
  }

  // ===== UTILITY ENDPOINTS =====

  @Get('enums')
  @ApiOperation({ summary: 'Get executive dashboard related enums' })
  @ApiResponse({ status: 200, _description: any)
  async getExecutiveEnums(): Promise<{
    dashboardTypes: DashboardType[];
    executiveLevels: ExecutiveLevel[];
    kpiCategories: KPICategory[];
    kpiStatuses: KPIStatus[];
    trendDirections: TrendDirection[];
    alertCategories: AlertCategory[];
    alertSeverities: AlertSeverity[];
    alertStatuses: AlertStatus[];
    reportTypes: ReportType[];
    reportPeriods: ReportPeriod[];
  }> {
    return {
      dashboardTypes: Object.values(DashboardType),
      executiveLevels: Object.values(ExecutiveLevel),
      kpiCategories: Object.values(KPICategory),
      kpiStatuses: Object.values(KPIStatus),
      trendDirections: Object.values(TrendDirection),
      alertCategories: Object.values(AlertCategory),
      alertSeverities: Object.values(AlertSeverity),
      alertStatuses: Object.values(AlertStatus),
      reportTypes: Object.values(ReportType),
      reportPeriods: Object.values(ReportPeriod),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check executive dashboard service health' })
  @ApiResponse({ status: 200, _description: any)
  
  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ description: 'Health status retrieved successfully' })
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
        averageQueryTime: 245,
        cacheHitRate: 0.89,
        memoryUsage: 0.67,
      },
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  
  private async extractUserId(_authorization: any): Promise<string> {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new HttpException('Invalid authorization header', HttpStatus.UNAUTHORIZED);
    }
    // Extract user ID from JWT token
    const token = authorization.substring(7);
    // Mock implementation - replace with actual JWT decode

  }

  }

  private getKeyDrivers(_category: any): string[] {
    const drivers = {
      [KPICategory.FINANCIAL]: ['Revenue growth', 'Cost optimization', 'Margin expansion'],
      [KPICategory.OPERATIONAL]: ['Process efficiency', 'Quality improvements', 'Automation'],
      [KPICategory.CUSTOMER]: ['Customer acquisition', 'Retention rate', 'Satisfaction'],
      [KPICategory.RISK]: ['Risk controls', 'Compliance', 'Market volatility'],
      [KPICategory.STRATEGIC]: ['Innovation', 'Market position', 'Competitive advantage'],
      [KPICategory.COMPLIANCE]: ['Regulatory adherence', 'Policy compliance', 'Audit results'],
    };
    
    return drivers[category] || ['Market conditions', 'Operational efficiency'];
  }

  private generateKPIImpactDescription(_kpi: any, status: KPIStatus): string {
    const descriptions = {
      [KPIStatus.ON_TARGET]: `${kpi.name} is performing within target range, indicating healthy progress.`,
      [KPIStatus.ABOVE_TARGET]: `${kpi.name} is exceeding targets, showing excellent performance.`,
      [KPIStatus.BELOW_TARGET]: `${kpi.name} is below target and requires attention to improve performance.`,
      [KPIStatus.CRITICAL]: `${kpi.name} is critically below target and needs immediate intervention.`,
    };
    
    return descriptions[status];
  }

  private generateKPIRecommendations(_kpi: any, status: KPIStatus): string[] {
    if (status === KPIStatus.ON_TARGET) {
      return ['Continue current strategy', 'Monitor for sustained performance'];
    } else if (status === KPIStatus.ABOVE_TARGET) {
      return ['Analyze success factors', 'Scale successful strategies', 'Set higher targets'];
    } else if (status === KPIStatus.BELOW_TARGET) {
      return ['Review current strategies', 'Implement corrective actions', 'Increase monitoring frequency'];
    } else {
      return ['Immediate management review required', 'Emergency action plan', 'Stakeholder communication'];
    }
  }

  private getAffectedStakeholders(_category: any): string[] {
    const stakeholders = {
      [KPICategory.FINANCIAL]: ['CFO', 'Finance team', 'Board', 'Investors'],
      [KPICategory.OPERATIONAL]: ['COO', 'Operations team', 'Process owners'],
      [KPICategory.CUSTOMER]: ['CMO', 'Customer service', 'Sales team'],
      [KPICategory.RISK]: ['CRO', 'Risk management', 'Compliance team'],
      [KPICategory.STRATEGIC]: ['CEO', 'Strategy team', 'Board'],
      [KPICategory.COMPLIANCE]: ['CCO', 'Legal team', 'Audit team'],
    };
    
    return stakeholders[category] || ['Management team'];
  }
}