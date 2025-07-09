import { getErrorMessage, getErrorStack, getErrorStatus, UserRole, ReportType, LibraryCapability } from '@sabs/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { nanoid } from 'nanoid';
import { Transaction } from '../entities/transaction.entity';
import { Customer } from '../entities/customer.entity';
import { Account } from '../entities/account.entity';
import { ApprovalWorkflow } from '../entities/approval-workflow.entity';



// Audit Entity Interfaces
export interface AuditLog {
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

export interface ComplianceCheck {
  id: string;
  companyId: string;
  checkType: ComplianceCheckType;
  entityType: string;
  entityId: string;
  ruleId: string;
  ruleName: string;
  status: ComplianceStatus;
  result: ComplianceResult;
  findings: ComplianceFinding[];
  score: number;
  riskLevel: RiskLevel;
  remediationActions?: string[];
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: ComplianceCategory;
  ruleType: ComplianceRuleType;
  isActive: boolean;
  severity: ComplianceSeverity;
  conditions: ComplianceCondition[];
  actions: ComplianceAction[];
  schedule?: ComplianceSchedule;
  createdAt: Date;
  updatedAt: Date;
}

export enum AuditEventType {
  USER_ACTION = 'user_action',
  SYSTEM_EVENT = 'system_event',
  TRANSACTION_EVENT = 'transaction_event',
  APPROVAL_EVENT = 'approval_event',
  COMPLIANCE_EVENT = 'compliance_event',
  SECURITY_EVENT = 'security_event',
  DATA_CHANGE = 'data_change',
  ACCESS_EVENT = 'access_event',
  ERROR_EVENT = 'error_event',
  ADMIN_ACTION = 'admin_action',
}

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  APPROVE = 'approve',
  REJECT = 'reject',
  SUBMIT = 'submit',
  PROCESS = 'process',
  CANCEL = 'cancel',
  REVERSE = 'reverse',
  EXPORT = 'export',
  IMPORT = 'import',
  CONFIGURE = 'configure',
}

export enum ComplianceCheckType {
  KYC_VERIFICATION = 'kyc_verification',
  AML_SCREENING = 'aml_screening',
  TRANSACTION_LIMIT = 'transaction_limit',
  VELOCITY_CHECK = 'velocity_check',
  RISK_ASSESSMENT = 'risk_assessment',
  DATA_RETENTION = 'data_retention',
  SEGREGATION_DUTIES = 'segregation_duties',
  APPROVAL_WORKFLOW = 'approval_workflow',
  AUDIT_TRAIL = 'audit_trail',
  REGULATORY_REPORTING = 'regulatory_reporting',
}

export enum ComplianceStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  OVERRIDDEN = 'overridden',
}

export enum ComplianceResult {
  PASS = 'pass',
  FAIL = 'fail',
  WARNING = 'warning',
  MANUAL_REVIEW = 'manual_review',
  EXCEPTION = 'exception',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ComplianceCategory {
  REGULATORY = 'regulatory',
  OPERATIONAL = 'operational',
  SECURITY = 'security',
  FINANCIAL = 'financial',
  DATA_PROTECTION = 'data_protection',
}

export enum ComplianceRuleType {
  VALIDATION = 'validation',
  MONITORING = 'monitoring',
  REPORTING = 'reporting',
  PREVENTIVE = 'preventive',
  DETECTIVE = 'detective',
}

export enum ComplianceSeverity {
  INFO = 'info',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ComplianceFinding {
  id: string;
  type: string;
  description: string;
  severity: ComplianceSeverity;
  recommendation: string;
  impact: string;
  evidence?: Record<string, any>;
}

export interface ComplianceCondition {
  field: string;
  operator: string;
  value: any;
  description: string;
}

export interface ComplianceAction {
  type: string;
  description: string;
  parameters: Record<string, any>;
}

export interface ComplianceSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time?: string;
}

export interface AuditSearchFilters {
  eventTypes?: AuditEventType[];
  actions?: AuditAction[];
  entityTypes?: string[];
  userIds?: string[];
  userRoles?: string[];
  startDate?: Date;
  endDate?: Date;
  riskScoreMin?: number;
  riskScoreMax?: number;
  complianceFlags?: string[];
  limit?: number;
  offset?: number;
}

export interface ComplianceSearchFilters {
  checkTypes?: ComplianceCheckType[];
  statuses?: ComplianceStatus[];
  results?: ComplianceResult[];
  riskLevels?: RiskLevel[];
  startDate?: Date;
  endDate?: Date;
  entityTypes?: string[];
  limit?: number;
  offset?: number;
}

@Injectable()
export class AuditComplianceService {
  private readonly logger = new Logger(AuditComplianceService.name);

  // In-memory storage (would use database tables in production)
  private auditLogs: Map<string, AuditLog> = new Map();
  private complianceChecks: Map<string, ComplianceCheck> = new Map();
  private complianceRules: Map<string, ComplianceRule> = new Map();

  // Compliance rule configurations
  private readonly defaultRules: Record<string, Partial<ComplianceRule>> = {
    kyc_verification: {
      name: 'KYC Verification Required',
      description: 'Ensure all customers complete KYC verification',
      category: ComplianceCategory.REGULATORY,
      ruleType: ComplianceRuleType.VALIDATION,
      severity: ComplianceSeverity.HIGH,
      conditions: [
        { field: 'customer.kycStatus', operator: 'equals', value: 'completed', description: 'KYC must be completed' }
      ],
      actions: [
        { type: 'block_transaction', description: 'Block transaction if KYC incomplete', parameters: { reason: 'KYC verification required' } }
      ],
    },
    transaction_limit: {
      name: 'Daily Transaction Limit',
      description: 'Monitor daily transaction limits',
      category: ComplianceCategory.OPERATIONAL,
      ruleType: ComplianceRuleType.MONITORING,
      severity: ComplianceSeverity.MEDIUM,
      conditions: [
        { field: 'transaction.dailyTotal', operator: 'lessThan', value: 50000, description: 'Daily limit GHS 50,000' }
      ],
      actions: [
        { type: 'require_approval', description: 'Require approval for exceeding limit', parameters: { approvalLevel: UserRole.COMPANY_ADMIN } }
      ],
    },
    aml_screening: {
      name: 'AML Screening',
      description: 'Screen transactions for AML compliance',
      category: ComplianceCategory.REGULATORY,
      ruleType: ComplianceRuleType.DETECTIVE,
      severity: ComplianceSeverity.CRITICAL,
      conditions: [
        { field: 'transaction.amount', operator: 'greaterThan', value: 10000, description: 'Transactions over GHS 10,000' }
      ],
      actions: [
        { type: 'flag_review', description: 'Flag for manual AML review', parameters: { priority: 'high' } }
      ],
    },
  };

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,

    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,

    @InjectRepository(Account)
    private accountRepository: Repository<Account>,

    @InjectRepository(ApprovalWorkflow)
    private approvalRepository: Repository<ApprovalWorkflow>,

    private eventEmitter: EventEmitter2,

    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {
    this.initializeDefaultRules();
  }

  // ===== EVENT LISTENERS =====

  @OnEvent('transaction.created')
  async handleTransactionCreated(event: any): Promise<void> {
    await this.logAuditEvent({
      eventType: AuditEventType.TRANSACTION_EVENT,
      entityType: 'transaction',
      entityId: event.transactionId,
      userId: event.userId,
      userRole: event.userRole,
      action: AuditAction.CREATE,
      description: 'Transaction created',
      newData: event.transactionData,
      metadata: { amount: event.amount, type: event.type },
    });

    // Run compliance checks
    await this.runComplianceChecks('transaction', event.transactionId);
  }

  @OnEvent('transaction.approved')
  async handleTransactionApproved(event: any): Promise<void> {
    await this.logAuditEvent({
      eventType: AuditEventType.APPROVAL_EVENT,
      entityType: 'transaction',
      entityId: event.transactionId,
      userId: event.approvedBy,
      userRole: event.approverRole,
      action: AuditAction.APPROVE,
      description: 'Transaction approved',
      metadata: { approvalLevel: event.approvalLevel, reason: event.reason },
    });
  }

  @OnEvent('customer.created')
  async handleCustomerCreated(event: any): Promise<void> {
    await this.logAuditEvent({
      eventType: AuditEventType.USER_ACTION,
      entityType: UserRole.CUSTOMER,
      entityId: event.customerId,
      userId: event.createdBy,
      userRole: event.creatorRole,
      action: AuditAction.CREATE,
      description: 'Customer account created',
      newData: event.customerData,
      metadata: { onboardingType: event.onboardingType },
    });

    // Run KYC compliance check
    await this.runComplianceChecks(UserRole.CUSTOMER, event.customerId);
  }

  @OnEvent('user.login')
  async handleUserLogin(event: any): Promise<void> {
    await this.logAuditEvent({
      eventType: AuditEventType.ACCESS_EVENT,
      entityType: 'user',
      entityId: event.userId,
      userId: event.userId,
      userRole: event.userRole,
      action: AuditAction.LOGIN,
      description: 'User logged in',
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      sessionId: event.sessionId,
      metadata: { loginMethod: event.method },
    });
  }

  // ===== AUDIT LOGGING METHODS =====

  async logAuditEvent(eventData: Partial<AuditLog>): Promise<string> {
    const auditId = `audit_${nanoid(8)}`;
    
    const auditLog: AuditLog = {
      id: auditId,
      companyId: eventData.companyId || 'default',
      eventType: eventData.eventType,
      entityType: eventData.entityType,
      entityId: eventData.entityId,
      userId: eventData.userId,
      userRole: eventData.userRole,
      action: eventData.action,
      description: eventData.description,
      previousData: eventData.previousData,
      newData: eventData.newData,
      metadata: eventData.metadata || {},
      ipAddress: eventData.ipAddress,
      userAgent: eventData.userAgent,
      sessionId: eventData.sessionId,
      riskScore: eventData.riskScore || this.calculateRiskScore(eventData),
      complianceFlags: eventData.complianceFlags || [],
      timestamp: new Date(),
      createdAt: new Date(),
    };

    this.auditLogs.set(auditId, auditLog);
    
    // Cache recent audit logs
    await this.cacheManager.set(`audit_${auditId}`, auditLog, 3600); // 1 hour

    this.logger.log(`Audit event logged: ${auditLog.eventType} - ${auditLog.action} by ${auditLog.userId}`);

    // Emit event for notifications
    this.eventEmitter.emit('audit.logged', {
      auditId,
      eventType: auditLog.eventType,
      action: auditLog.action,
      riskScore: auditLog.riskScore,
    });

    return auditId;
  }

  async searchAuditLogs(filters: AuditSearchFilters): Promise<{
    logs: AuditLog[];
    total: number;
    hasMore: boolean;
  }> {
    let logs = Array.from(this.auditLogs.values());

    // Apply filters
    if (filters.eventTypes?.length) {
      logs = logs.filter(log => filters.eventTypes.includes(log.eventType));
    }

    if (filters.actions?.length) {
      logs = logs.filter(log => filters.actions.includes(log.action));
    }

    if (filters.entityTypes?.length) {
      logs = logs.filter(log => filters.entityTypes.includes(log.entityType));
    }

    if (filters.userIds?.length) {
      logs = logs.filter(log => filters.userIds.includes(log.userId));
    }

    if (filters.userRoles?.length) {
      logs = logs.filter(log => filters.userRoles.includes(log.userRole));
    }

    if (filters.startDate) {
      logs = logs.filter(log => log.timestamp >= filters.startDate);
    }

    if (filters.endDate) {
      logs = logs.filter(log => log.timestamp <= filters.endDate);
    }

    if (filters.riskScoreMin !== undefined) {
      logs = logs.filter(log => (log.riskScore || 0) >= filters.riskScoreMin);
    }

    if (filters.riskScoreMax !== undefined) {
      logs = logs.filter(log => (log.riskScore || 0) <= filters.riskScoreMax);
    }

    if (filters.complianceFlags?.length) {
      logs = logs.filter(log => 
        filters.complianceFlags.some(flag => log.complianceFlags?.includes(flag))
      );
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const total = Object.values(logs).length;
    const offset = filters.offset || 0;
    const limit = filters.limit || 100;

    const paginatedLogs = logs.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      logs: paginatedLogs,
      total,
      hasMore,
    };
  }

  async getAuditLog(auditId: string): Promise<AuditLog | null> {
    // Try cache first
    const cached = await this.cacheManager.get<AuditLog>(`audit_${auditId}`);
    if (cached) {
      return cached;
    }

    return this.auditLogs.get(auditId) || null;
  }

  // ===== COMPLIANCE METHODS =====

  async runComplianceChecks(entityType: string, entityId: string): Promise<ComplianceCheck[]> {
    const checks: ComplianceCheck[] = [];
    const applicableRules = this.getApplicableRules(entityType);

    for (const rule of applicableRules) {
      const check = await this.executeComplianceCheck(rule, entityType, entityId);
      checks.push(check);
      this.complianceChecks.set(check.id, check);
    }

    return checks;
  }

  async executeComplianceCheck(
    rule: ComplianceRule,
    entityType: string,
    entityId: string
  ): Promise<ComplianceCheck> {
    const checkId = `check_${nanoid(8)}`;
    
    const check: ComplianceCheck = {
      id: checkId,
      companyId: 'default',
      checkType: this.mapRuleToCheckType(rule),
      entityType,
      entityId,
      ruleId: rule.id,
      ruleName: rule.name,
      status: ComplianceStatus.IN_PROGRESS,
      result: ComplianceResult.PASS,
      findings: [],
      score: 0,
      riskLevel: RiskLevel.LOW,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      // Execute rule conditions
      const entity = await this.getEntity(entityType, entityId);
      const conditionResults = await this.evaluateConditions(rule.conditions, entity);

      // Determine result
      const passedConditions = conditionResults.filter(r => r.passed).length;
      const totalConditions = Object.values(conditionResults).length;
      const passRate = totalConditions > 0 ? passedConditions / totalConditions : 1;

      check.score = Math.round(passRate * 100);
      check.result = passRate >= 1 ? ComplianceResult.PASS : ComplianceResult.FAIL;
      check.riskLevel = this.calculateRiskLevel(check.score, rule.severity);

      // Generate findings for failed conditions
      check.findings = conditionResults
        .filter(r => !r.passed)
        .map(r => ({
          id: `finding_${nanoid(6)}`,
          type: 'condition_failure',
          description: r.description,
          severity: rule.severity,
          recommendation: r.recommendation,
          impact: this.getImpactDescription(rule.severity),
          evidence: r.evidence,
        }));

      // Execute actions if needed
      if (check.result === ComplianceResult.FAIL) {
        await this.executeComplianceActions(rule.actions, check);
      }

      check.status = ComplianceStatus.COMPLETED;
      check.completedAt = new Date();

    } catch (error) {
      check.status = ComplianceStatus.FAILED;
      check.result = ComplianceResult.EXCEPTION;
      check.findings = [{
        id: `finding_${nanoid(6)}`,
        type: 'execution_error',
        description: `Compliance check failed: ${(error as Error).message}`,
        severity: ComplianceSeverity.HIGH,
        recommendation: 'Review compliance rule configuration',
        impact: 'Unable to verify compliance',
      }];
    }

    check.updatedAt = new Date();

    // Log compliance check
    await this.logAuditEvent({
      eventType: AuditEventType.COMPLIANCE_EVENT,
      entityType,
      entityId,
      userId: UserRole.SYSTEM,
      userRole: UserRole.SYSTEM,
      action: AuditAction.PROCESS,
      description: `Compliance check: ${rule.name}`,
      metadata: {
        ruleId: rule.id,
        result: check.result,
        score: check.score,
        riskLevel: check.riskLevel,
      },
    });

    return check;
  }

  async searchComplianceChecks(filters: ComplianceSearchFilters): Promise<{
    checks: ComplianceCheck[];
    total: number;
    hasMore: boolean;
  }> {
    let checks = Array.from(this.complianceChecks.values());

    // Apply filters
    if (filters.checkTypes?.length) {
      checks = checks.filter(check => filters.checkTypes.includes(check.checkType));
    }

    if (filters.statuses?.length) {
      checks = checks.filter(check => filters.statuses.includes(check.status));
    }

    if (filters.results?.length) {
      checks = checks.filter(check => filters.results.includes(check.result));
    }

    if (filters.riskLevels?.length) {
      checks = checks.filter(check => filters.riskLevels.includes(check.riskLevel));
    }

    if (filters.startDate) {
      checks = checks.filter(check => check.createdAt >= filters.startDate);
    }

    if (filters.endDate) {
      checks = checks.filter(check => check.createdAt <= filters.endDate);
    }

    if (filters.entityTypes?.length) {
      checks = checks.filter(check => filters.entityTypes.includes(check.entityType));
    }

    // Sort by creation date (newest first)
    checks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = Object.values(checks).length;
    const offset = filters.offset || 0;
    const limit = filters.limit || 100;

    const paginatedChecks = checks.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      checks: paginatedChecks,
      total,
      hasMore,
    };
  }

  async getComplianceCheck(checkId: string): Promise<ComplianceCheck | null> {
    return this.complianceChecks.get(checkId) || null;
  }

  // ===== COMPLIANCE RULE MANAGEMENT =====

  async createComplianceRule(ruleData: Partial<ComplianceRule>): Promise<string> {
    const ruleId = `rule_${nanoid(8)}`;
    
    const rule: ComplianceRule = {
      id: ruleId,
      name: ruleData.name,
      description: ruleData.description,
      category: ruleData.category,
      ruleType: ruleData.ruleType,
      isActive: ruleData.isActive !== false,
      severity: ruleData.severity,
      conditions: ruleData.conditions || [],
      actions: ruleData.actions || [],
      schedule: ruleData.schedule,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.complianceRules.set(ruleId, rule);
    
    await this.logAuditEvent({
      eventType: AuditEventType.ADMIN_ACTION,
      entityType: 'compliance_rule',
      entityId: ruleId,
      userId: UserRole.SUPER_ADMIN,
      userRole: UserRole.SUPER_ADMIN,
      action: AuditAction.CREATE,
      description: 'Compliance rule created',
      newData: rule,
      metadata: { category: rule.category, severity: rule.severity },
    });

    return ruleId;
  }

  async updateComplianceRule(ruleId: string, updates: Partial<ComplianceRule>): Promise<void> {
    const rule = this.complianceRules.get(ruleId);
    if (!rule) {
      throw new Error('Compliance rule not found');
    }

    const previousData = { ...rule };
    
    const updatedRule: ComplianceRule = {
      ...rule,
      ...updates,
      id: ruleId,
      updatedAt: new Date(),
    };

    this.complianceRules.set(ruleId, updatedRule);

    await this.logAuditEvent({
      eventType: AuditEventType.ADMIN_ACTION,
      entityType: 'compliance_rule',
      entityId: ruleId,
      userId: UserRole.SUPER_ADMIN,
      userRole: UserRole.SUPER_ADMIN,
      action: AuditAction.UPDATE,
      description: 'Compliance rule updated',
      previousData,
      newData: updatedRule,
      metadata: { changes: Object.keys(updates) },
    });
  }

  async getComplianceRules(filters?: {
    categories?: ComplianceCategory[];
    ruleTypes?: ComplianceRuleType[];
    active?: boolean;
  }): Promise<ComplianceRule[]> {
    let rules = Array.from(this.complianceRules.values());

    if (filters) {
      if (filters.categories?.length) {
        rules = rules.filter(rule => filters.categories.includes(rule.category));
      }
      if (filters.ruleTypes?.length) {
        rules = rules.filter(rule => filters.ruleTypes.includes(rule.ruleType));
      }
      if (filters.active !== undefined) {
        rules = rules.filter(rule => rule.isActive === filters.active);
      }
    }

    return rules.sort((a, b) => a.name.localeCompare(b.name));
  }

  // ===== REPORTING METHODS =====

  async generateComplianceReport(
    companyId: string,
    timeRange: { startDate: Date; endDate: Date }
  ): Promise<{
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
  }> {
    // This would typically query from a database
    // For demo purposes, return mock compliance report
    return {
      summary: {
        totalChecks: 2456,
        passedChecks: 2398,
        failedChecks: 58,
        complianceRate: 97.6,
        averageScore: 94.2,
        criticalFindings: 12,
      },
      byCategory: {
        [ComplianceCategory.REGULATORY]: { total: 1200, passed: 1185, failed: 15, complianceRate: 98.7 },
        [ComplianceCategory.OPERATIONAL]: { total: 800, passed: 782, failed: 18, complianceRate: 97.7 },
        [ComplianceCategory.SECURITY]: { total: 300, passed: 285, failed: 15, complianceRate: 95.0 },
        [ComplianceCategory.FINANCIAL]: { total: 120, passed: 112, failed: 8, complianceRate: 93.3 },
        [ComplianceCategory.DATA_PROTECTION]: { total: 36, passed: 34, failed: 2, complianceRate: 94.4 },
      },
      byRiskLevel: {
        [RiskLevel.LOW]: { count: 1856, percentage: 75.6 },
        [RiskLevel.MEDIUM]: { count: 456, percentage: 18.6 },
        [RiskLevel.HIGH]: { count: 120, percentage: 4.9 },
        [RiskLevel.CRITICAL]: { count: 24, percentage: 0.9 },
      },
      trends: [
        { date: '2024-01-01', total: 85, passed: 82, failed: 3, complianceRate: 96.5 },
        { date: '2024-01-02', total: 92, passed: 89, failed: 3, complianceRate: 96.7 },
        // ... more trend data
      ],
      topFindings: [
        { type: 'KYC Incomplete', count: 15, impact: 'High', recommendation: 'Complete KYC verification' },
        { type: 'Transaction Limit Exceeded', count: 12, impact: 'Medium', recommendation: 'Implement approval workflow' },
        { type: 'AML Screening Required', count: 8, impact: 'Critical', recommendation: 'Immediate AML review' },
      ],
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  private calculateRiskScore(eventData: Partial<AuditLog>): number {
    let score = 0;

    // Base score by event type
    switch (eventData.eventType) {
      case AuditEventType.SECURITY_EVENT:
        score += 30;
        break;
      case AuditEventType.COMPLIANCE_EVENT:
        score += 20;
        break;
      case AuditEventType.TRANSACTION_EVENT:
        score += 10;
        break;
      default:
        score += 5;
    }

    // Additional score by action
    switch (eventData.action) {
      case AuditAction.DELETE:
        score += 20;
        break;
      case AuditAction.UPDATE:
        score += 10;
        break;
      case AuditAction.CREATE:
        score += 5;
        break;
    }

    // High-value transaction adjustments
    if (eventData.metadata?.amount && eventData.metadata.amount > 10000) {
      score += 15;
    }

    return Math.min(score, 100);
  }

  private getApplicableRules(entityType: string): ComplianceRule[] {
    const rules = Array.from(this.complianceRules.values());
    return rules.filter(rule => rule.isActive);
  }

  private mapRuleToCheckType(rule: ComplianceRule): ComplianceCheckType {
    if (rule.name.toLowerCase().includes('kyc')) {
      return ComplianceCheckType.KYC_VERIFICATION;
    }
    if (rule.name.toLowerCase().includes('aml')) {
      return ComplianceCheckType.AML_SCREENING;
    }
    if (rule.name.toLowerCase().includes('limit')) {
      return ComplianceCheckType.TRANSACTION_LIMIT;
    }
    return ComplianceCheckType.RISK_ASSESSMENT;
  }

  private async getEntity(entityType: string, entityId: string): Promise<any> {
    switch (entityType) {
      case 'transaction':
        return this.transactionRepository.findOne({ where: { id: entityId }, relations: ["customer", 'account'] });
      case UserRole.CUSTOMER:
        return this.customerRepository.findOne({ where: { id: entityId } });
      case 'account':
        return this.accountRepository.findOne({ where: { id: entityId }, relations: ["customer"] });
      default:
        return null;
    }
  }

  private async evaluateConditions(conditions: ComplianceCondition[], entity: any): Promise<Array<{
    passed: boolean;
    description: string;
    recommendation: string;
    evidence?: any;
  }>> {
    const results = [];

    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(entity, condition.field);
      const passed = this.evaluateCondition(fieldValue, condition.operator, condition.value);
      
      results.push({
        passed,
        description: condition.description,
        recommendation: passed ? 'No action required' : `Ensure ${condition.description}`,
        evidence: { fieldValue, expectedValue: condition.value, operator: condition.operator },
      });
    }

    return results;
  }

  private getFieldValue(entity: any, fieldPath: string): any {
    const parts = fieldPath.split('.');
    let value = entity;

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private evaluateCondition(fieldValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === expectedValue;
      case 'notEquals':
        return fieldValue !== expectedValue;
      case 'greaterThan':
        return fieldValue > expectedValue;
      case 'lessThan':
        return fieldValue < expectedValue;
      case 'greaterThanOrEqual':
        return fieldValue >= expectedValue;
      case 'lessThanOrEqual':
        return fieldValue <= expectedValue;
      case 'contains':
        return fieldValue && fieldValue.toString().includes(expectedValue);
      case 'notContains':
        return !fieldValue || !fieldValue.toString().includes(expectedValue);
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(fieldValue);
      case 'notIn':
        return !Array.isArray(expectedValue) || !expectedValue.includes(fieldValue);
      default:
        return false;
    }
  }

  private calculateRiskLevel(score: number, severity: ComplianceSeverity): RiskLevel {
    if (severity === ComplianceSeverity.CRITICAL) {
      return RiskLevel.CRITICAL;
    }
    if (score >= 80) {
      return RiskLevel.LOW;
    }
    if (score >= 60) {
      return RiskLevel.MEDIUM;
    }
    if (score >= 40) {
      return RiskLevel.HIGH;
    }
    return RiskLevel.CRITICAL;
  }

  private getImpactDescription(severity: ComplianceSeverity): string {
    switch (severity) {
      case ComplianceSeverity.CRITICAL:

      case ComplianceSeverity.HIGH:

      case ComplianceSeverity.MEDIUM:

      case ComplianceSeverity.LOW:

      default:

    }
  }

  private async executeComplianceActions(actions: ComplianceAction[], check: ComplianceCheck): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'block_transaction':
            this.eventEmitter.emit('compliance.block_transaction', {
              entityId: check.entityId,
              reason: action.parameters.reason,
              checkId: check.id,
            });
            break;
          case 'require_approval':
            this.eventEmitter.emit('compliance.require_approval', {
              entityId: check.entityId,
              approvalLevel: action.parameters.approvalLevel,
              checkId: check.id,
            });
            break;
          case 'flag_review':
            this.eventEmitter.emit('compliance.flag_review', {
              entityId: check.entityId,
              priority: action.parameters.priority,
              checkId: check.id,
            });
            break;
        }
      } catch (error) {
        this.logger.error(`Failed to execute compliance action ${action.type}: ${(error as Error).message}`);
      }
    }
  }

  private initializeDefaultRules(): void {
    Object.entries(this.defaultRules).forEach(([key, rule]) => {
      const ruleId = `rule_${key}`;
      this.complianceRules.set(ruleId, {
        id: ruleId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...rule,
      } as ComplianceRule);
    });

    this.logger.log(`Initialized ${Object.keys(this.defaultRules).length} default compliance rules`);
  }
}