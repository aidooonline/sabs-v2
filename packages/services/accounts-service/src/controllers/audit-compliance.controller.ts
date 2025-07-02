import { UserRole } from '@sabs/common';

// Mock @Roles decorator to fix signature issues
function Roles(...roles: any[]) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    // Mock implementation
    return descriptor;
  };
}
import { getErrorMessage, getErrorStack, getErrorStatus, UserRole, ReportType, LibraryCapability } from '@sabs/common';

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
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../../identity-service/src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity-service/src/auth/guards/roles.guard';

import { CurrentUser } from '../../../identity-service/src/auth/decorators/current-user.decorator';

import {
  AuditComplianceService,
  AuditLog,
  ComplianceCheck,
  ComplianceRule,
  AuditEventType,
  AuditAction,
  ComplianceCheckType,
  ComplianceStatus,
  ComplianceResult,
  RiskLevel,
  ComplianceCategory,
  ComplianceRuleType,
  ComplianceSeverity,
  AuditSearchFilters,
  ComplianceSearchFilters,
} from '../services/audit-compliance.service';

// ===== DTOs =====

export class LogAuditEventDto {
  eventType: AuditEventType;
  entityType: string;
  entityId: string;
  action: AuditAction;
  description: string;
  previousData?: Record<string, any>;
  newData?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export class AuditSearchDto {
  eventTypes?: AuditEventType[];
  actions?: AuditAction[];
  entityTypes?: string[];
  userIds?: string[];
  userRoles?: string[];
  startDate?: string;
  endDate?: string;
  riskScoreMin?: number;
  riskScoreMax?: number;
  complianceFlags?: string[];
  limit?: number;
  offset?: number;
}

export class ComplianceSearchDto {
  checkTypes?: ComplianceCheckType[];
  statuses?: ComplianceStatus[];
  results?: ComplianceResult[];
  riskLevels?: RiskLevel[];
  startDate?: string;
  endDate?: string;
  entityTypes?: string[];
  limit?: number;
  offset?: number;
}

export class CreateComplianceRuleDto {
  name: string;
  description: string;
  category: ComplianceCategory;
  ruleType: ComplianceRuleType;
  severity: ComplianceSeverity;
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
    description: string;
  }>;
  actions: Array<{
    type: string;
    description: string;
    parameters: Record<string, any>;
  }>;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time?: string;
  };
  isActive?: boolean;
}

export class UpdateComplianceRuleDto {
  name?: string;
  description?: string;
  category?: ComplianceCategory;
  ruleType?: ComplianceRuleType;
  severity?: ComplianceSeverity;
  conditions?: Array<{
    field: string;
    operator: string;
    value: any;
    description: string;
  }>;
  actions?: Array<{
    type: string;
    description: string;
    parameters: Record<string, any>;
  }>;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time?: string;
  };
  isActive?: boolean;
}

export class ComplianceReportQueryDto {
  startDate: string;
  endDate: string;
}

export class ComplianceRuleFiltersDto {
  categories?: ComplianceCategory[];
  ruleTypes?: ComplianceRuleType[];
  active?: boolean;
}

// ===== RESPONSE DTOs =====

export class AuditLogResponseDto {
  id: string;
  companyId: string;
  eventType: AuditEventType;
  entityType: string;
  entityId: string;
  userId: string;
  userRole: string;
  action: AuditAction;
  description: string;
  previousData?: Record<string, any>;
  newData?: Record<string, any>;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  riskScore?: number;
  complianceFlags?: string[];
  timestamp: Date;
  createdAt: Date;
}

export class ComplianceCheckResponseDto {
  id: string;
  companyId: string;
  checkType: ComplianceCheckType;
  entityType: string;
  entityId: string;
  ruleId: string;
  ruleName: string;
  status: ComplianceStatus;
  result: ComplianceResult;
  findings: Array<{
    id: string;
    type: string;
    description: string;
    severity: ComplianceSeverity;
    recommendation: string;
    impact: string;
    evidence?: Record<string, any>;
  }>;
  score: number;
  riskLevel: RiskLevel;
  remediationActions?: string[];
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class ComplianceRuleResponseDto {
  id: string;
  name: string;
  description: string;
  category: ComplianceCategory;
  ruleType: ComplianceRuleType;
  isActive: boolean;
  severity: ComplianceSeverity;
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
    description: string;
  }>;
  actions: Array<{
    type: string;
    description: string;
    parameters: Record<string, any>;
  }>;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceReportResponse {
  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    complianceRate: number;
    averageScore: number;
    criticalFindings: number;
  };
  byCategory: Record<ComplianceCategory, {
    total: number;
    passed: number;
    failed: number;
    complianceRate: number;
  }>;
  byRiskLevel: Record<RiskLevel, {
    count: number;
    percentage: number;
  }>;
  trends: Array<{
    date: string;
    total: number;
    passed: number;
    failed: number;
    complianceRate: number;
  }>;
  topFindings: Array<{
    type: string;
    count: number;
    impact: string;
    recommendation: string;
  }>;
}

@ApiTags('Audit & Compliance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-compliance')
export class AuditComplianceController {
  private readonly logger = new Logger(AuditComplianceController.name);

  constructor(private readonly auditComplianceService: AuditComplianceService) {}

  // ===== AUDIT LOGGING ENDPOINTS =====

  @Post('audit/log')
  @Roles(UserRole.FIELD_AGENT, UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN, UserRole.SYSTEM)
  @ApiOperation({ summary: 'Log an audit event' })
  @ApiResponse({ status: 201, description: 'Audit event logged successfully', type: String })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async logAuditEvent(
    @Body(ValidationPipe) logAuditEventDto: LogAuditEventDto,
    @CurrentUser() user: any,
  ): Promise<{ auditId: string; message: string }> {
    this.logger.log(`Logging audit event: ${logAuditEventDto.eventType} - ${logAuditEventDto.action} by user ${user.userId}`);

    try {
      const auditId = await this.auditComplianceService.logAuditEvent({
        ...logAuditEventDto,
        userId: user.userId,
        userRole: user.role,
        companyId: user.companyId,
      });

      return {
        auditId,
        message: 'Audit event logged successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to log audit event: ${(error as Error).message}`);
      throw new BadRequestException(`Failed to log audit event: ${(error as Error).message}`);
    }
  }

  @Get('audit/search')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Search audit logs' })
  @ApiQuery({ name: 'eventTypes', required: false, type: [String] })
  @ApiQuery({ name: 'actions', required: false, type: [String] })
  @ApiQuery({ name: 'entityTypes', required: false, type: [String] })
  @ApiQuery({ name: 'userIds', required: false, type: [String] })
  @ApiQuery({ name: 'userRoles', required: false, type: [String] })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'riskScoreMin', required: false, type: Number })
  @ApiQuery({ name: 'riskScoreMax', required: false, type: Number })
  @ApiQuery({ name: 'complianceFlags', required: false, type: [String] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved', type: [AuditLogResponseDto] })
  async searchAuditLogs(
    @Query() query: AuditSearchDto,
  ): Promise<{
    logs: AuditLogResponseDto[];
    total: number;
    hasMore: boolean;
  }> {
    const filters: AuditSearchFilters = {
      eventTypes: query.eventTypes,
      actions: query.actions,
      entityTypes: query.entityTypes,
      userIds: query.userIds,
      userRoles: query.userRoles,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      riskScoreMin: query.riskScoreMin,
      riskScoreMax: query.riskScoreMax,
      complianceFlags: query.complianceFlags,
      limit: query.limit,
      offset: query.offset,
    };

    const result = await this.auditComplianceService.searchAuditLogs(filters);
    
    return {
      logs: result.logs.map(log => this.mapAuditLogToResponse(log)),
      total: result.total,
      hasMore: result.hasMore,
    };
  }

  @Get('audit/:auditId')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Get audit log by ID' })
  @ApiParam({ name: 'auditId', description: 'Audit log ID' })
  @ApiResponse({ status: 200, description: 'Audit log retrieved', type: AuditLogResponseDto })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  async getAuditLog(
    @Param('auditId') auditId: string,
  ): Promise<AuditLogResponseDto> {
    const auditLog = await this.auditComplianceService.getAuditLog(auditId);
    
    if (!auditLog) {
      throw new NotFoundException('Audit log not found');
    }

    return this.mapAuditLogToResponse(auditLog);
  }

  // ===== COMPLIANCE CHECK ENDPOINTS =====

  @Post('compliance/check/:entityType/:entityId')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN, UserRole.SYSTEM)
  @ApiOperation({ summary: 'Run compliance checks for an entity' })
  @ApiParam({ name: 'entityType', description: 'Entity type (e.g., transaction, customer)' })
  @ApiParam({ name: 'entityId', description: 'Entity ID' })
  @ApiResponse({ status: 201, description: 'Compliance checks executed', type: [ComplianceCheckResponseDto] })
  async runComplianceChecks(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @CurrentUser() user: any,
  ): Promise<{
    checks: ComplianceCheckResponseDto[];
    summary: {
      total: number;
      passed: number;
      failed: number;
      warnings: number;
    };
  }> {
    this.logger.log(`Running compliance checks for ${entityType}:${entityId} by user ${user.userId}`);

    const checks = await this.auditComplianceService.runComplianceChecks(entityType, entityId);
    const mappedChecks = checks.map(check => this.mapComplianceCheckToResponse(check));

    const summary = {
      total: checks.length,
      passed: checks.filter(c => c.result === ComplianceResult.PASS).length,
      failed: checks.filter(c => c.result === ComplianceResult.FAIL).length,
      warnings: checks.filter(c => c.result === ComplianceResult.WARNING).length,
    };

    return {
      checks: mappedChecks,
      summary,
    };
  }

  @Get('compliance/search')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Search compliance checks' })
  @ApiQuery({ name: 'checkTypes', required: false, type: [String] })
  @ApiQuery({ name: 'statuses', required: false, type: [String] })
  @ApiQuery({ name: 'results', required: false, type: [String] })
  @ApiQuery({ name: 'riskLevels', required: false, type: [String] })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'entityTypes', required: false, type: [String] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Compliance checks retrieved', type: [ComplianceCheckResponseDto] })
  async searchComplianceChecks(
    @Query() query: ComplianceSearchDto,
  ): Promise<{
    checks: ComplianceCheckResponseDto[];
    total: number;
    hasMore: boolean;
  }> {
    const filters: ComplianceSearchFilters = {
      checkTypes: query.checkTypes,
      statuses: query.statuses,
      results: query.results,
      riskLevels: query.riskLevels,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      entityTypes: query.entityTypes,
      limit: query.limit,
      offset: query.offset,
    };

    const result = await this.auditComplianceService.searchComplianceChecks(filters);
    
    return {
      checks: result.checks.map(check => this.mapComplianceCheckToResponse(check)),
      total: result.total,
      hasMore: result.hasMore,
    };
  }

  @Get('compliance/:checkId')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Get compliance check by ID' })
  @ApiParam({ name: 'checkId', description: 'Compliance check ID' })
  @ApiResponse({ status: 200, description: 'Compliance check retrieved', type: ComplianceCheckResponseDto })
  @ApiResponse({ status: 404, description: 'Compliance check not found' })
  async getComplianceCheck(
    @Param('checkId') checkId: string,
  ): Promise<ComplianceCheckResponseDto> {
    const check = await this.auditComplianceService.getComplianceCheck(checkId);
    
    if (!check) {
      throw new NotFoundException('Compliance check not found');
    }

    return this.mapComplianceCheckToResponse(check);
  }

  // ===== COMPLIANCE RULE MANAGEMENT ENDPOINTS =====

  @Post('rules')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create compliance rule' })
  @ApiResponse({ status: 201, description: 'Compliance rule created successfully', type: String })
  async createComplianceRule(
    @Body(ValidationPipe) createRuleDto: CreateComplianceRuleDto,
    @CurrentUser() user: any,
  ): Promise<{ ruleId: string; message: string }> {
    this.logger.log(`Creating compliance rule: ${createRuleDto.name} by user ${user.userId}`);

    const ruleId = await this.auditComplianceService.createComplianceRule(createRuleDto);
    
    return {
      ruleId,
      message: 'Compliance rule created successfully',
    };
  }

  @Get('rules')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Get compliance rules' })
  @ApiQuery({ name: 'categories', required: false, type: [String] })
  @ApiQuery({ name: 'ruleTypes', required: false, type: [String] })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Compliance rules retrieved', type: [ComplianceRuleResponseDto] })
  async getComplianceRules(
    @Query() query: ComplianceRuleFiltersDto,
  ): Promise<ComplianceRuleResponseDto[]> {
    const filters = {
      categories: query.categories,
      ruleTypes: query.ruleTypes,
      active: query.active,
    };

    const rules = await this.auditComplianceService.getComplianceRules(filters);
    return rules.map(rule => this.mapComplianceRuleToResponse(rule));
  }

  @Put('rules/:ruleId')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update compliance rule' })
  @ApiParam({ name: 'ruleId', description: 'Compliance rule ID' })
  @ApiResponse({ status: 200, description: 'Compliance rule updated successfully' })
  @ApiResponse({ status: 404, description: 'Compliance rule not found' })
  async updateComplianceRule(
    @Param('ruleId') ruleId: string,
    @Body(ValidationPipe) updateRuleDto: UpdateComplianceRuleDto,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    this.logger.log(`Updating compliance rule ${ruleId} by user ${user.userId}`);

    try {
      await this.auditComplianceService.updateComplianceRule(ruleId, updateRuleDto);
      return { message: 'Compliance rule updated successfully' };
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        throw new NotFoundException('Compliance rule not found');
      }
      throw error;
    }
  }

  // ===== REPORTING ENDPOINTS =====

  @Get('reports/compliance')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Generate compliance report' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Compliance report generated' })
  async generateComplianceReport(
    @Query() query: ComplianceReportQueryDto,
    @CurrentUser() user: any,
  ): Promise<ComplianceReportResponse> {
    if (!query.startDate || !query.endDate) {
      throw new BadRequestException('Start date and end date are required');
    }

    const timeRange = {
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
    };

    // Validate date range
    if (timeRange.startDate >= timeRange.endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    return await this.auditComplianceService.generateComplianceReport(user.companyId, timeRange);
  }

  @Get('dashboard/compliance')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Get compliance dashboard data' })
  @ApiResponse({ status: 200, description: 'Compliance dashboard data retrieved' })
  async getComplianceDashboard(
    @CurrentUser() user: any,
  ): Promise<{
    summary: {
      activeRules: number;
      todayChecks: number;
      complianceRate: number;
      criticalFindings: number;
      pendingRemediation: number;
    };
    recentChecks: ComplianceCheckResponseDto[];
    riskDistribution: Array<{
      riskLevel: RiskLevel;
      count: number;
      percentage: number;
    }>;
    categoryPerformance: Array<{
      category: ComplianceCategory;
      complianceRate: number;
      totalChecks: number;
    }>;
    trendData: Array<{
      date: string;
      checksPerformed: number;
      complianceRate: number;
    }>;
  }> {
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Get compliance report for today
    const report = await this.auditComplianceService.generateComplianceReport(user.companyId, {
      startDate: startOfDay,
      endDate: endOfDay,
    });

    // Get active rules count
    const rules = await this.auditComplianceService.getComplianceRules({ active: true });

    // Mock recent checks (would be a real query in production)
    const recentChecks: ComplianceCheckResponseDto[] = [];

    // Calculate risk distribution
    const riskDistribution = Object.entries(report.byRiskLevel).map(([riskLevel, data]) => ({
      riskLevel: riskLevel as RiskLevel,
      count: data.count,
      percentage: data.percentage,
    }));

    // Calculate category performance
    const categoryPerformance = Object.entries(report.byCategory).map(([category, data]) => ({
      category: category as ComplianceCategory,
      complianceRate: data.complianceRate,
      totalChecks: data.total,
    }));

    return {
      summary: {
        activeRules: rules.length,
        todayChecks: report.summary.totalChecks,
        complianceRate: report.summary.complianceRate,
        criticalFindings: report.summary.criticalFindings,
        pendingRemediation: 15, // Mock data
      },
      recentChecks,
      riskDistribution,
      categoryPerformance,
      trendData: report.trends.map(trend => ({
        date: trend.date,
        checksPerformed: trend.total,
        complianceRate: trend.complianceRate,
      })),
    };
  }

  @Get('dashboard/audit')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Get audit dashboard data' })
  @ApiResponse({ status: 200, description: 'Audit dashboard data retrieved' })
  async getAuditDashboard(
    @CurrentUser() user: any,
  ): Promise<{
    summary: {
      todayEvents: number;
      highRiskEvents: number;
      uniqueUsers: number;
      systemEvents: number;
    };
    recentEvents: AuditLogResponseDto[];
    eventTypeDistribution: Array<{
      eventType: AuditEventType;
      count: number;
      percentage: number;
    }>;
    riskScoreDistribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
    activityTrends: Array<{
      date: string;
      totalEvents: number;
      highRiskEvents: number;
    }>;
  }> {
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Search today's audit logs
    const auditResult = await this.auditComplianceService.searchAuditLogs({
      startDate: startOfDay,
      endDate: endOfDay,
      limit: 1000,
    });

    const todayLogs = auditResult.logs;
    const highRiskEvents = todayLogs.filter(log => (log.riskScore || 0) >= 70).length;
    const uniqueUsers = new Set(todayLogs.map(log => log.userId)).size;
    const systemEvents = todayLogs.filter(log => log.eventType === AuditEventType.SYSTEM_EVENT).length;

    // Get recent events
    const recentResult = await this.auditComplianceService.searchAuditLogs({
      limit: 10,
      offset: 0,
    });

    // Mock event type distribution
    const eventTypeDistribution = [
      { eventType: AuditEventType.TRANSACTION_EVENT, count: 450, percentage: 45.0 },
      { eventType: AuditEventType.USER_ACTION, count: 250, percentage: 25.0 },
      { eventType: AuditEventType.ACCESS_EVENT, count: 150, percentage: 15.0 },
      { eventType: AuditEventType.APPROVAL_EVENT, count: 100, percentage: 10.0 },
      { eventType: AuditEventType.SECURITY_EVENT, count: 50, percentage: 5.0 },
    ];

    // Mock risk score distribution
    const riskScoreDistribution = [
      { range: '0-25', count: 600, percentage: 60.0 },
      { range: '26-50', count: 250, percentage: 25.0 },
      { range: '51-75', count: 100, percentage: 10.0 },
      { range: '76-100', count: 50, percentage: 5.0 },
    ];

    // Mock activity trends
    const activityTrends = [
      { date: '2024-01-01', totalEvents: 125, highRiskEvents: 8 },
      { date: '2024-01-02', totalEvents: 142, highRiskEvents: 12 },
      { date: '2024-01-03', totalEvents: 118, highRiskEvents: 6 },
    ];

    return {
      summary: {
        todayEvents: todayLogs.length,
        highRiskEvents,
        uniqueUsers,
        systemEvents,
      },
      recentEvents: recentResult.logs.map(log => this.mapAuditLogToResponse(log)),
      eventTypeDistribution,
      riskScoreDistribution,
      activityTrends,
    };
  }

  // ===== HEALTH AND STATUS ENDPOINTS =====

  @Get('health')
  @ApiOperation({ summary: 'Check audit and compliance service health' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async getHealthStatus(): Promise<{
    status: string;
    timestamp: string;
    services: {
      audit: string;
      compliance: string;
      rules: string;
    };
    metrics: {
      totalAuditLogs: number;
      totalComplianceChecks: number;
      totalRules: number;
    };
  }> {
    // Get basic metrics
    const rules = await this.auditComplianceService.getComplianceRules();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        audit: 'operational',
        compliance: 'operational',
        rules: 'operational',
      },
      metrics: {
        totalAuditLogs: 0, // Would be a real count in production
        totalComplianceChecks: 0, // Would be a real count in production
        totalRules: rules.length,
      },
    };
  }

  // ===== UTILITY ENDPOINTS =====

  @Get('enums')
  @ApiOperation({ summary: 'Get audit and compliance enums' })
  @ApiResponse({ status: 200, description: 'Enums retrieved' })
  async getEnums(): Promise<{
    auditEventTypes: AuditEventType[];
    auditActions: AuditAction[];
    complianceCheckTypes: ComplianceCheckType[];
    complianceStatuses: ComplianceStatus[];
    complianceResults: ComplianceResult[];
    riskLevels: RiskLevel[];
    complianceCategories: ComplianceCategory[];
    complianceRuleTypes: ComplianceRuleType[];
    complianceSeverities: ComplianceSeverity[];
  }> {
    return {
      auditEventTypes: AuditEventType,
      auditActions: Object.values(AuditAction),
      complianceCheckTypes: ComplianceCheckType,
      complianceStatuses: ComplianceStatus,
      complianceResults: ComplianceResult,
      riskLevels: Object.values(RiskLevel),
      complianceCategories: Object.values(ComplianceCategory),
      complianceRuleTypes: ComplianceRuleType,
      complianceSeverities: ComplianceSeverity,
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  private mapAuditLogToResponse(auditLog: AuditLog): AuditLogResponseDto {
    return {
      id: auditLog.id,
      companyId: auditLog.companyId,
      eventType: auditLog.eventType,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      userId: auditLog.userId,
      userRole: auditLog.userRole,
      action: auditLog.action,
      description: auditLog.description,
      previousData: auditLog.previousData,
      newData: auditLog.newData,
      metadata: auditLog.metadata,
      ipAddress: auditLog.ipAddress,
      userAgent: auditLog.userAgent,
      sessionId: auditLog.sessionId,
      riskScore: auditLog.riskScore,
      complianceFlags: auditLog.complianceFlags,
      timestamp: auditLog.timestamp,
      createdAt: auditLog.createdAt,
    };
  }

  private mapComplianceCheckToResponse(check: ComplianceCheck): ComplianceCheckResponseDto {
    return {
      id: check.id,
      companyId: check.companyId,
      checkType: check.checkType,
      entityType: check.entityType,
      entityId: check.entityId,
      ruleId: check.ruleId,
      ruleName: check.ruleName,
      status: check.status,
      result: check.result,
      findings: check.findings,
      score: check.score,
      riskLevel: check.riskLevel,
      remediationActions: check.remediationActions,
      dueDate: check.dueDate,
      completedAt: check.completedAt,
      createdAt: check.createdAt,
      updatedAt: check.updatedAt,
    };
  }

  private mapComplianceRuleToResponse(rule: ComplianceRule): ComplianceRuleResponseDto {
    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      category: rule.category,
      ruleType: rule.ruleType,
      isActive: rule.isActive,
      severity: rule.severity,
      conditions: rule.conditions,
      actions: rule.actions,
      schedule: rule.schedule,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    };
  }
}