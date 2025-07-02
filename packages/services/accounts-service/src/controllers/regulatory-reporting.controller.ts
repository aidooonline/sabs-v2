import { getErrorMessage, getErrorStack, getErrorStatus, UserRole, ReportType, LibraryCapability } from '@sabs/common';

import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Headers,
  ValidationPipe,
  BadRequestException,
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

import {
  RegulatoryReportingService,
  RegulatoryReport,
  ComplianceRule,
  ComplianceAssessment,
  AuditTrail,

  RegulatorType,
  ReportingFrequency,
  ReportStatus,
  ComplianceCategory,
  RuleSeverity,
  RiskLevel,
  AuditAction,
  GenerateReportRequest,
  ComplianceCheckRequest,
  ReportingPeriod,
} from '../services/regulatory-reporting.service';
import { nanoid } from 'nanoid';

// ===== REQUEST DTOs =====

export class GenerateReportDto {
  type: ReportType;
  regulator: RegulatorType;
  period: {
    startDate: string;
    endDate: string;
    quarter?: number;
    year: number;
  };
  includeValidation: boolean;
}

export class ComplianceCheckDto {
  categories: ComplianceCategory[];
  period: {
    startDate: string;
    endDate: string;
    year: number;
  };
  includeRecommendations: boolean;
}

export class SubmitReportDto {
  submissionMethod: 'electronic' | 'manual';
  contactPerson: string;
  notes?: string;
}

export class CreateAuditDto {
  entityType: string;
  entityId: string;
  action: AuditAction;
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
}

// ===== RESPONSE DTOs =====

export class RegulatoryReportDto {
  id: string;
  name: string;
  type: ReportType;
  regulator: RegulatorType;
  status: ReportStatus;
  dueDate: Date;
  submittedDate?: Date;
  complianceScore: number;
}

export class ComplianceViolationDto {
  id: string;
  ruleId: string;
  severity: RuleSeverity;
  description: string;
  detectedDate: Date;
  status: string;
}

@ApiTags('Regulatory Reporting & Compliance')
@Controller('regulatory-reporting')
export class RegulatoryReportingController {
  private readonly logger = new Logger(RegulatoryReportingController.name);

  constructor(private readonly regulatoryService: RegulatoryReportingService) {}

  // ===== REGULATORY REPORTING ENDPOINTS =====

  @Get('reports')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get regulatory reports' })
  @ApiQuery({ name: 'regulator', required: false, enum: RegulatorType })
  @ApiQuery({ name: 'status', required: false, enum: ReportStatus })
  @ApiQuery({ name: 'type', required: false, enum: ReportType })
  @ApiResponse({ status: 200, description: 'Regulatory reports retrieved successfully' })
  async getRegulatoryReports(
    @Headers('authorization') authorization: string,
    @Query('regulator') regulator?: RegulatorType,
    @Query('status') status?: ReportStatus,
    @Query('type') type?: ReportType,
  ): Promise<{
    reports: RegulatoryReportDto[];
    summary: {
      total: number;
      byStatus: Record<ReportStatus, number>;
      byRegulator: Record<RegulatorType, number>;
      overdue: number;
      dueThisWeek: number;
    };
    calendar: {
      upcoming: Array<{
        reportType: ReportType;
        regulator: RegulatorType;
        dueDate: Date;
        priority: string;
      }>;
      overdue: Array<{
        reportType: ReportType;
        overdueDays: number;
        penalties: string[];
      }>;
    };
    compliance: {
      overallScore: number;
      riskLevel: string;
      lastAssessment: Date;
    };
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Getting regulatory reports: ${userId}`);

    // Mock reports data with filtering
    const allReports: RegulatoryReportDto[] = [
      {
        id: 'reg_001',
        name: 'Prudential Report - Q4 2024',
        type: ReportType.COMPLIANCE,
        regulator: RegulatorType.BANK_OF_GHANA,
        status: ReportStatus.DRAFT,
        dueDate: new Date('2024-12-15'),
        complianceScore: 87.5,
      },
      {
        id: 'reg_002',
        name: 'AML/CFT Report - Q4 2024',
        type: ReportType.COMPLIANCE,
        regulator: RegulatorType.FINANCIAL_INTELLIGENCE_CENTRE,
        status: ReportStatus.SUBMITTED,
        dueDate: new Date('2024-12-20'),
        submittedDate: new Date('2024-12-18'),
        complianceScore: 92.1,
      },
      {
        id: 'reg_003',
        name: 'Consumer Protection Report - Q4 2024',
        type: ReportType.COMPLIANCE,
        regulator: RegulatorType.BANK_OF_GHANA,
        status: ReportStatus.PENDING_VALIDATION,
        dueDate: new Date('2024-12-31'),
        complianceScore: 85.3,
      },
    ];

    // Apply filters
    let filteredReports = allReports;
    if (regulator) filteredReports = filteredReports.filter(r => r.regulator === regulator);
    if (status) filteredReports = filteredReports.filter(r => r.status === status);
    if (type) filteredReports = filteredReports.filter(r => r.type === type);

    // Generate summary
    const byStatus = {} as Record<ReportStatus, number>;
    const byRegulator = {} as Record<RegulatorType, number>;
    
    allReports.forEach(report => {
      byStatus[report.status] = (byStatus[report.status] || 0) + 1;
      byRegulator[report.regulator] = (byRegulator[report.regulator] || 0) + 1;
    });

    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const summary = {
      total: allReports.length,
      byStatus,
      byRegulator,
      overdue: allReports.filter(r => r.dueDate < now && r.status !== ReportStatus.SUBMITTED).length,
      dueThisWeek: allReports.filter(r => r.dueDate <= oneWeekFromNow && r.dueDate > now).length,
    };

    const calendar = await this.regulatoryService.getRegulatoryCalen();

    const compliance = {
      overallScore: 88.3,
      riskLevel: 'Low',
      lastAssessment: new Date('2024-11-25'),
    };

    return {
      reports: filteredReports,
      summary,
      calendar,
      compliance,
    };
  }

  @Post('reports/generate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate regulatory report' })
  @ApiResponse({ status: 201, description: 'Regulatory report generated successfully' })
  async generateRegulatoryReport(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) reportDto: GenerateReportDto,
  ): Promise<{
    reportId: string;
    name: string;
    type: ReportType;
    regulator: RegulatorType;
    status: ReportStatus;
    dueDate: Date;
    validation: {
      valid: boolean;
      errors: number;
      warnings: number;
      completeness: number;
    };
    timeline: {
      dueDate: Date;
      reminderDates: Date[];
      submissionWindow: number;
    };
    compliance: {
      score: number;
      riskLevel: string;
      violations: number;
    };
    nextSteps: Array<{
      step: string;
      description: string;
      dueDate: Date;
    }>;
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Generating regulatory report: ${userId} -> ${reportDto.type}`);

    const request: GenerateReportRequest = {
      type: reportDto.type,
      regulator: reportDto.regulator,
      period: {
        startDate: new Date(reportDto.period.startDate),
        endDate: new Date(reportDto.period.endDate),
        quarter: reportDto.period.quarter,
        year: reportDto.period.year,
      },
      includeValidation: reportDto.includeValidation,
    };

    const result = await this.regulatoryService.generateRegulatoryReport(request);

    const nextSteps = [
      {
        step: 'Data Validation',
        description: 'Complete data validation and resolve any errors',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        step: 'Internal Review',
        description: 'Conduct internal compliance review',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        step: 'Final Submission',
        description: 'Submit report to regulator',
        dueDate: result.submissionTimeline.dueDate,
      },
    ];

    return {
      reportId: result.reportId,
      name: result.report.name,
      type: result.report.type,
      regulator: result.report.regulator,
      status: result.report.status,
      dueDate: result.report.dueDate,
      validation: {
        valid: result.validation.valid,
        errors: result.validation.errors.length,
        warnings: result.validation.warnings.length,
        completeness: result.validation.completeness,
      },
      timeline: {
        dueDate: result.submissionTimeline.dueDate,
        reminderDates: result.submissionTimeline.reminderDates,
        submissionWindow: result.submissionTimeline.submissionWindow,
      },
      compliance: {
        score: result.complianceImpact.score,
        riskLevel: result.complianceImpact.riskLevel,
        violations: result.complianceImpact.violations.length,
      },
      nextSteps,
    };
  }

  @Get('reports/:reportId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get regulatory report details' })
  @ApiParam({ name: 'reportId', description: 'Regulatory report ID' })
  @ApiResponse({ status: 200, description: 'Report details retrieved successfully' })
  async getRegulatoryReportDetails(
    @Headers('authorization') authorization: string,
    @Param('reportId') reportId: string,
  ): Promise<{
    report: {
      id: string;
      name: string;
      type: ReportType;
      regulator: RegulatorType;
      status: ReportStatus;
      period: ReportingPeriod;
      dueDate: Date;
      submittedDate?: Date;
    };
    data: {
      financial: any;
      operational: any;
      compliance: any;
      risk: any;
    };
    validation: {
      valid: boolean;
      errors: Array<{
        field: string;
        message: string;
        severity: string;
      }>;
      warnings: Array<{
        field: string;
        message: string;
        severity: string;
      }>;
      completeness: number;
      accuracy: number;
    };
    auditTrail: Array<{
      timestamp: Date;
      action: string;
      user: string;
      details: string;
    }>;
    actions: Array<{
      action: string;
      label: string;
      enabled: boolean;
    }>;
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Getting report details: ${userId} -> ${reportId}`);

    // Mock detailed report data
    const report = {
      id: reportId,
      name: 'Prudential Report - Q4 2024',
      type: ReportType.COMPLIANCE,
      regulator: RegulatorType.BANK_OF_GHANA,
      status: ReportStatus.DRAFT,
      period: {
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-12-31'),
        quarter: 4,
        year: 2024,
      },
      dueDate: new Date('2024-12-15'),
    };

    const data = {
      financial: {
        totalAssets: 125000000,
        totalLiabilities: 98000000,
        equity: 27000000,
        revenue: 15600000,
        netIncome: 4200000,
      },
      operational: {
        totalTransactions: 1250000,
        customerCount: 125000,
        branchCount: 45,
        atmCount: 120,
        employeeCount: 850,
      },
      compliance: {
        amlCases: 156,
        suspiciousTransactions: 23,
        complianceScore: 87.5,
        policyUpdates: 12,
        trainingCompleted: 98.2,
      },
      risk: {
        creditRisk: 2.1,
        operationalRisk: 1.8,
        marketRisk: 1.2,
        liquidityRatio: 15.6,
        capitalAdequacyRatio: 18.2,
      },
    };

    const validation = {
      valid: true,
      errors: [],
      warnings: [
        {
          field: 'capitalAdequacyRatio',
          message: 'Capital adequacy ratio slightly below optimal range',
          severity: 'warning',
        },
      ],
      completeness: 95.5,
      accuracy: 98.2,
    };

    const auditTrail = [
      {
        timestamp: new Date('2024-12-01T10:30:00Z'),
        action: 'created',
        user: 'compliance_officer',
        details: 'Report generated automatically',
      },
      {
        timestamp: new Date('2024-12-01T14:15:00Z'),
        action: 'updated',
        user: 'senior_analyst',
        details: 'Updated financial data section',
      },
      {
        timestamp: new Date('2024-12-02T09:45:00Z'),
        action: 'validated',
        user: 'compliance_manager',
        details: 'Data validation completed',
      },
    ];

    const actions = [
      {
        action: 'validate',
        label: 'Validate Report',
        enabled: report.status === ReportStatus.DRAFT,
      },
      {
        action: 'submit',
        label: 'Submit to Regulator',
        enabled: report.status === ReportStatus.VALIDATED,
      },
      {
        action: 'export',
        label: 'Export Report',
        enabled: true,
      },
      {
        action: 'audit',
        label: 'View Audit Trail',
        enabled: true,
      },
    ];

    return {
      report,
      data,
      validation,
      auditTrail,
      actions,
    };
  }

  @Post('reports/:reportId/submit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit regulatory report' })
  @ApiParam({ name: 'reportId', description: 'Regulatory report ID' })
  @ApiResponse({ status: 200, description: 'Report submitted successfully' })
  async submitRegulatoryReport(
    @Headers('authorization') authorization: string,
    @Param('reportId') reportId: string,
    @Body(ValidationPipe) submitDto: SubmitReportDto,
  ): Promise<{
    submissionId: string;
    status: ReportStatus;
    submittedDate: Date;
    acknowledgment: {
      reference: string;
      regulator: RegulatorType;
      expectedResponse: Date;
      submissionMethod: string;
    };
    compliance: {
      scoreImpact: number;
      newScore: number;
      riskLevel: string;
    };
    followUp: Array<{
      action: string;
      dueDate: Date;
      responsible: string;
    }>;
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Submitting regulatory report: ${userId} -> ${reportId}`);

    const result = await this.regulatoryService.submitRegulatoryReport(reportId);

    const followUp = [
      {
        action: 'Monitor regulator response',
        dueDate: result.acknowledgment.expectedResponse,
        responsible: 'Compliance Team',
      },
      {
        action: 'Prepare next period report',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        responsible: 'Financial Reporting Team',
      },
      {
        action: 'Update compliance metrics',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        responsible: 'Compliance Analyst',
      },
    ];

    return {
      submissionId: result.submissionId,
      status: result.status,
      submittedDate: result.submittedDate,
      acknowledgment: {
        reference: result.acknowledgment.reference,
        regulator: result.acknowledgment.regulator,
        expectedResponse: result.acknowledgment.expectedResponse,
        submissionMethod: submitDto.submissionMethod,
      },
      compliance: {
        scoreImpact: result.complianceUpdate.newScore - 85, // Mock previous score
        newScore: result.complianceUpdate.newScore,
        riskLevel: 'Low',
      },
      followUp,
    };
  }

  // ===== COMPLIANCE MONITORING ENDPOINTS =====

  @Post('compliance/check')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perform compliance check' })
  @ApiResponse({ status: 200, description: 'Compliance check completed successfully' })
  async performComplianceCheck(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) checkDto: ComplianceCheckDto,
  ): Promise<{
    assessmentId: string;
    overallScore: number;
    riskLevel: string;
    categories: Array<{
      category: ComplianceCategory;
      score: number;
      riskLevel: string;
      violations: number;
      status: string;
    }>;
    violations: ComplianceViolationDto[];
    recommendations: Array<{
      category: string;
      priority: string;
      description: string;
      impact: string;
      effort: string;
    }>;
    trend: {
      direction: string;
      change: number;
      period: string;
      comparison: string;
    };
    actionPlan: Array<{
      priority: string;
      action: string;
      owner: string;
      dueDate: Date;
    }>;
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Performing compliance check: ${userId}`);

    const request: ComplianceCheckRequest = {
      categories: checkDto.categories,
      period: {
        startDate: new Date(checkDto.period.startDate),
        endDate: new Date(checkDto.period.endDate),
        year: checkDto.period.year,
      },
      includeRecommendations: checkDto.includeRecommendations,
    };

    const result = await this.regulatoryService.performComplianceCheck(request);

    const categories = result.categories.map(cat => ({
      category: cat.category,
      score: cat.score,
      riskLevel: cat.riskLevel,
      violations: cat.violations,
      status: cat.score >= 85 ? 'compliant' : cat.score >= 70 ? 'warning' : 'non_compliant',
    }));

    const violations = result.violations.map(v => ({
      id: v.id,
      ruleId: v.ruleId,
      severity: v.severity,
      description: v.description,
      detectedDate: v.detectedDate,
      status: v.resolvedDate ? 'resolved' : 'active',
    }));

    const recommendations = result.recommendations.map(rec => ({
      category: rec.category,
      priority: rec.priority,
      description: rec.description,
      impact: rec.impact.compliance_improvement,
      effort: rec.implementation.timeline,
    }));

    const trend = {
      direction: result.trend.direction,
      change: result.trend.change,
      period: result.trend.period,
      comparison: `${result.trend.change > 0 ? '+' : ''}${result.trend.change}% vs previous period`,
    };

    const actionPlan = [
      {
        priority: 'high',
        action: 'Address critical compliance violations',
        owner: 'Compliance Manager',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        priority: 'medium',
        action: 'Implement recommended process improvements',
        owner: 'Operations Team',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        priority: 'low',
        action: 'Conduct compliance training',
        owner: 'HR Department',
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    ];

    return {
      assessmentId: result.assessmentId,
      overallScore: result.overallScore,
      riskLevel: result.riskLevel,
      categories,
      violations,
      recommendations,
      trend,
      actionPlan: {
      immediate: [],
      shortTerm: [],
      longTerm: []
    },
    };
  }

  @Get('compliance/dashboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get compliance dashboard' })
  @ApiResponse({ status: 200, description: 'Compliance dashboard retrieved successfully' })
  async getComplianceDashboard(
    @Headers('authorization') authorization: string,
  ): Promise<{
    overview: {
      overallScore: number;
      riskLevel: string;
      totalViolations: number;
      activeViolations: number;
      resolvedThisMonth: number;
      lastAssessment: Date;
    };
    categories: Array<{
      category: ComplianceCategory;
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
      timestamp: Date;
      status: string;
    }>;
    upcomingTasks: Array<{
      task: string;
      dueDate: Date;
      category: string;
      priority: string;
    }>;
    metrics: {
      complianceScore: {
        current: number;
        target: number;
        trend: number;
      };
      violationRate: {
        current: number;
        target: number;
        trend: number;
      };
      auditReadiness: {
        score: number;
        lastAudit: Date;
        nextAudit: Date;
      };
    };
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Getting compliance dashboard: ${userId}`);

    const overview = {
      overallScore: 88.3,
      riskLevel: 'Low',
      totalViolations: 15,
      activeViolations: 3,
      resolvedThisMonth: 8,
      lastAssessment: new Date('2024-11-25'),
    };

    const categories = Object.values(ComplianceCategory).map(category => ({
      category,
      score: 85 + Math.random() * 10,
      status: 'compliant',
      trend: Math.random() > 0.5 ? 'improving' : 'stable',
      violations: Math.floor(Math.random() * 3),
    }));

    const alerts = [
      {
        id: 'alert_001',
        severity: 'medium',
        message: 'AML transaction threshold exceeded for large corporate client',
        category: 'AML/CFT',
        timestamp: new Date('2024-12-01T14:30:00Z'),
        status: 'active',
      },
      {
        id: 'alert_002',
        severity: 'low',
        message: 'Quarterly compliance training due for 15 staff members',
        category: 'Training',
        timestamp: new Date('2024-12-01T10:15:00Z'),
        status: 'pending',
      },
    ];

    const upcomingTasks = [
      {
        task: 'Submit monthly AML report to FIC',
        dueDate: new Date('2024-12-05'),
        category: 'Regulatory Reporting',
        priority: 'high',
      },
      {
        task: 'Complete Q4 risk assessment',
        dueDate: new Date('2024-12-10'),
        category: 'Risk Management',
        priority: 'medium',
      },
      {
        task: 'Review and update data protection policies',
        dueDate: new Date('2024-12-15'),
        category: 'Data Governance',
        priority: 'medium',
      },
    ];

    const metrics = {
      complianceScore: {
        current: 88.3,
        target: 90.0,
        trend: 2.1,
      },
      violationRate: {
        current: 0.8, // violations per 1000 transactions
        target: 0.5,
        trend: -0.2,
      },
      auditReadiness: {
        score: 92.5,
        lastAudit: new Date('2024-06-15'),
        nextAudit: new Date('2025-06-15'),
      },
    };

    return {
      overview,
      categories,
      alerts: (alerts as any)?.alerts || alerts,
      upcomingTasks,
      metrics,
    };
  }

  @Get('compliance/rules')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get compliance rules' })
  @ApiQuery({ name: 'category', required: false, enum: ComplianceCategory })
  @ApiQuery({ name: 'severity', required: false, enum: RuleSeverity })
  @ApiResponse({ status: 200, description: 'Compliance rules retrieved successfully' })
  async getComplianceRules(
    @Headers('authorization') authorization: string,
    @Query('category') category?: ComplianceCategory,
    @Query('severity') severity?: RuleSeverity,
  ): Promise<{
    rules: Array<{
      id: string;
      name: string;
      category: ComplianceCategory;
      severity: RuleSeverity;
      status: string;
      violations: number;
      lastChecked: Date;
      effectiveness: number;
    }>;
    summary: {
      total: number;
      active: number;
      bySeverity: Record<RuleSeverity, number>;
      byCategory: Record<ComplianceCategory, number>;
    };
    recommendations: Array<{
      type: string;
      description: string;
      ruleId: string;
      priority: string;
    }>;
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Getting compliance rules: ${userId}`);

    const allRules = [
      {
        id: 'rule_aml_001',
        name: 'Large Transaction Monitoring',
        category: ComplianceCategory.AML_CFT,
        severity: RuleSeverity.HIGH,
        status: 'active',
        violations: 2,
        lastChecked: new Date('2024-12-01'),
        effectiveness: 94.5,
      },
      {
        id: 'rule_capital_001',
        name: 'Capital Adequacy Ratio Monitoring',
        category: ComplianceCategory.CAPITAL_ADEQUACY,
        severity: RuleSeverity.CRITICAL,
        status: 'active',
        violations: 0,
        lastChecked: new Date('2024-12-01'),
        effectiveness: 98.2,
      },
      {
        id: 'rule_liquidity_001',
        name: 'Liquidity Coverage Ratio',
        category: ComplianceCategory.LIQUIDITY_MANAGEMENT,
        severity: RuleSeverity.HIGH,
        status: 'active',
        violations: 1,
        lastChecked: new Date('2024-11-30'),
        effectiveness: 96.7,
      },
    ];

    // Apply filters
    let filteredRules = allRules;
    if (category) filteredRules = filteredRules.filter(r => r.category === category);
    if (severity) filteredRules = filteredRules.filter(r => r.severity === severity);

    const bySeverity = {} as Record<RuleSeverity, number>;
    const byCategory = {} as Record<ComplianceCategory, number>;

    allRules.forEach(rule => {
      bySeverity[rule.severity] = (bySeverity[rule.severity] || 0) + 1;
      byCategory[rule.category] = (byCategory[rule.category] || 0) + 1;
    });

    const summary = {
      total: allRules.length,
      active: allRules.filter(r => r.status === 'active').length,
      bySeverity,
      byCategory,
    };

    const recommendations = [
      {
        type: 'Threshold Adjustment',
        description: 'Consider lowering AML monitoring threshold',
        ruleId: 'rule_aml_001',
        priority: 'medium',
      },
      {
        type: 'Automation',
        description: 'Implement automated compliance checking',
        ruleId: 'rule_capital_001',
        priority: 'high',
      },
    ];

    return {
      rules: filteredRules,
      summary,
      recommendations,
    };
  }

  // ===== AUDIT TRAIL ENDPOINTS =====

  @Post('audit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create audit trail entry' })
  @ApiResponse({ status: 201, description: 'Audit trail entry created successfully' })
  async createAuditTrail(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) auditDto: CreateAuditDto,
  ): Promise<{
    auditId: string;
    timestamp: Date;
    status: string;
    retention: {
      required: boolean;
      period: string;
      classification: string;
    };
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Creating audit trail: ${userId} -> ${auditDto.entityType}:${auditDto.entityId}`);

    const changes = auditDto.changes?.map(change => ({
      field: change.field,
      oldValue: change.oldValue,
      newValue: change.newValue,
      timestamp: new Date(),
    }));

    const result = await this.regulatoryService.createAuditTrail(
      auditDto.entityType,
      auditDto.entityId,
      auditDto.action,
      userId,
      changes,
    );

    const retention = {
      required: result.compliance.retention_required,
      period: '7 years',
      classification: result.compliance.regulatory_significance,
    };

    return {
      auditId: result.auditId,
      timestamp: result.timestamp,
      status: 'created',
      retention,
    };
  }

  @Get('audit/:entityId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get audit history' })
  @ApiParam({ name: 'entityId', description: 'Entity ID' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Audit history retrieved successfully' })
  async getAuditHistory(
    @Headers('authorization') authorization: string,
    @Param('entityId') entityId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    entries: Array<{
      id: string;
      action: AuditAction;
      timestamp: Date;
      userId: string;
      changes: Array<{
        field: string;
        oldValue: any;
        newValue: any;
      }>;
      significance: string;
    }>;
    summary: {
      totalEntries: number;
      actionBreakdown: Record<AuditAction, number>;
      users: string[];
      timeRange: {
        earliest: Date;
        latest: Date;
      };
    };
    compliance: {
      retentionStatus: string;
      completeness: number;
      integrity: boolean;
      nextReview: Date;
    };
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Getting audit history: ${userId} -> ${entityId}`);

    const period = startDate && endDate ? {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      year: new Date(startDate).getFullYear(),
    } : undefined;

    const result = await this.regulatoryService.getAuditHistory(entityId, period);

    const entries = result.entries.map(entry => ({
      id: entry.id,
      action: entry.action,
      timestamp: entry.timestamp,
      userId: entry.userId,
      changes: entry.changes.map(change => ({
        field: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
      })),
      significance: entry.compliance.regulatory_significance,
    }));

    const compliance = {
      retentionStatus: result.compliance.retentionStatus,
      completeness: result.compliance.completeness,
      integrity: result.compliance.integrity,
      nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    };

         return {
       entries,
       summary: {
         ...result.summary,
         actionBreakdown: result.summary.actions,
       },
       compliance,
     };
  }

  // ===== UTILITY ENDPOINTS =====

  @Get('enums')
  @ApiOperation({ summary: 'Get regulatory reporting related enums' })
  @ApiResponse({ status: 200, description: 'Enums retrieved successfully' })
  async getRegulatoryEnums(): Promise<{
    reportTypes: ReportType[];
    regulatorTypes: RegulatorType[];
    reportingFrequencies: ReportingFrequency[];
    reportStatuses: ReportStatus[];
    complianceCategories: ComplianceCategory[];
    ruleSeverities: RuleSeverity[];
    riskLevels: RiskLevel[];
    auditActions: AuditAction[];
  }> {
    return {
      reportTypes: Object.values(ReportType),
      regulatorTypes: Object.values(RegulatorType),
      reportingFrequencies: Object.values(ReportingFrequency),
      reportStatuses: Object.values(ReportStatus),
      complianceCategories: Object.values(ComplianceCategory),
      ruleSeverities: Object.values(RuleSeverity),
      riskLevels: Object.values(RiskLevel),
      auditActions: Object.values(AuditAction),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check regulatory reporting service health' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async getHealthStatus(): Promise<{
    status: string;
    timestamp: string;
    services: {
      report_generator: string;
      compliance_monitor: string;
      audit_tracker: string;
      validation_engine: string;
      submission_gateway: string;
    };
    performance: {
      active_reports: number;
      pending_submissions: number;
      compliance_violations: number;
      audit_entries: number;
      average_processing_time: number;
    };
    compliance: {
      overall_score: number;
      last_assessment: Date;
      next_assessment: Date;
      regulatory_updates: number;
    };
  }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        report_generator: 'operational',
        compliance_monitor: 'operational',
        audit_tracker: 'operational',
        validation_engine: 'operational',
        submission_gateway: 'operational',
      },
      performance: {
        active_reports: 12,
        pending_submissions: 3,
        compliance_violations: 5,
        audit_entries: 1247,
        average_processing_time: 2.3, // seconds
      },
      compliance: {
        overall_score: 88.3,
        last_assessment: new Date('2024-11-25'),
        next_assessment: new Date('2024-12-25'),
        regulatory_updates: 8,
      },
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  private async extractUserId(authorization: string): Promise<string> {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new BadRequestException('Invalid authorization header');
    }
    return 'user_regulatory_001';
  }
}