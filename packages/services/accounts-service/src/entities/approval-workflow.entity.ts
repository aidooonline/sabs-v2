import { UserRole } from '@sabs/common';
import { getErrorMessage, getErrorStack, getErrorStatus, UserRole, ReportType, LibraryCapability } from '@sabs/common';

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, BeforeInsert } from 'typeorm';
import { Transaction } from './transaction.entity';
import { nanoid } from 'nanoid';

export enum WorkflowStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ESCALATED = 'escalated',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum ApprovalStage {
  INITIAL_REVIEW = 'initial_review',
  RISK_ASSESSMENT = 'risk_assessment',
  COMPLIANCE_CHECK = 'compliance_check',
  MANAGER_REVIEW = 'manager_review',
  ADMIN_REVIEW = 'admin_review',
  FINAL_APPROVAL = 'final_approval',
}

export enum EscalationReason {
  HIGH_RISK = 'high_risk',
  LARGE_AMOUNT = 'large_amount',
  COMPLIANCE_FLAG = 'compliance_flag',
  CUSTOMER_VIP = 'customer_vip',
  UNUSUAL_PATTERN = 'unusual_pattern',
  MANUAL_ESCALATION = 'manual_escalation',
  SYSTEM_FLAG = 'system_flag',
}

export enum ApprovalPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

@Entity('approval_workflows')
@Index(['companyId', 'workflowNumber'])
@Index(['companyId', 'transactionId'])
@Index(['companyId', 'status'])
@Index(['companyId', 'currentStage'])
@Index(['assignedTo'])
@Index(['priority', 'createdAt'])
@Index(['status', 'expiresAt'])
@Index(['escalated', 'escalationLevel'])
export class ApprovalWorkflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workflow_number', length: 20, unique: true })
  workflowNumber: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'transaction_id' })
  transactionId: string;

  // Workflow Status and Stage
  @Column({ 
    type: 'enum', 
    enum: WorkflowStatus,
    name: 'status',
    default: WorkflowStatus.PENDING
  })
  status: WorkflowStatus;

  @Column({ 
    type: 'enum', 
    enum: ApprovalStage,
    name: 'current_stage',
    default: ApprovalStage.INITIAL_REVIEW
  })
  currentStage: ApprovalStage;

  @Column({ 
    type: 'enum', 
    enum: ApprovalPriority,
    name: 'priority',
    default: ApprovalPriority.NORMAL
  })
  priority: ApprovalPriority;

  // Assignment and Ownership
  @Column({ name: 'assigned_to', nullable: true })
  assignedTo: string; // User ID of assigned approver

  @Column({ name: 'assigned_at', type: 'timestamp', nullable: true })
  assignedAt: Date;

  @Column({ name: 'assigned_by', nullable: true })
  assignedBy: string; // User ID who assigned

  @Column({ name: 'queue_name', length: 50, nullable: true })
  queueName: string; // approval-clerk, approval-manager, approval-admin

  // Timing and SLA
  @Column({ name: 'sla_duration_minutes', default: 60 })
  slaDurationMinutes: number; // SLA in minutes

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date; // When review actually started

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ name: 'response_time_minutes', nullable: true })
  responseTimeMinutes: number;

  // Escalation Management
  @Column({ name: 'escalated', default: false })
  escalated: boolean;

  @Column({ name: 'escalation_level', default: 0 })
  escalationLevel: number; // 0=none, 1=manager, 2=admin, 3=senior_admin

  @Column({ name: 'escalation_reason', type: 'enum', enum: EscalationReason, nullable: true })
  escalationReason: EscalationReason;

  @Column({ name: 'escalated_at', type: 'timestamp', nullable: true })
  escalatedAt: Date;

  @Column({ name: 'escalated_by', nullable: true })
  escalatedBy: string;

  @Column({ name: 'escalation_notes', type: 'text', nullable: true })
  escalationNotes: string;

  @Column({ name: 'auto_escalated', default: false })
  autoEscalated: boolean;

  // Approval Decision
  @Column({ name: 'approved_by', nullable: true })
  approvedBy: string;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ name: 'approval_notes', type: 'text', nullable: true })
  approvalNotes: string;

  @Column({ name: 'approval_conditions', type: 'json', nullable: true })
  approvalConditions: Array<{
    condition: string;
    required: boolean;
    verified: boolean;
    notes?: string;
  }>;

  // Rejection Information
  @Column({ name: 'rejected_by', nullable: true })
  rejectedBy: string;

  @Column({ name: 'rejected_at', type: 'timestamp', nullable: true })
  rejectedAt: Date;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ name: 'rejection_category', length: 50, nullable: true })
  rejectionCategory: string; // insufficient_funds, compliance_issue, documentation_incomplete, etc.

  @Column({ name: 'allow_resubmission', default: true })
  allowResubmission: boolean;

  // Review and Analysis
  @Column({ name: 'risk_review_completed', default: false })
  riskReviewCompleted: boolean;

  @Column({ name: 'compliance_review_completed', default: false })
  complianceReviewCompleted: boolean;

  @Column({ name: 'documentation_review_completed', default: false })
  documentationReviewCompleted: boolean;

  @Column({ name: 'manager_review_required', default: false })
  managerReviewRequired: boolean;

  @Column({ name: 'admin_review_required', default: false })
  adminReviewRequired: boolean;

  // Review Checklist
  @Column({ name: 'checklist_items', type: 'json', nullable: true })
  checklistItems: Array<{
    item: string;
    required: boolean;
    completed: boolean;
    completedBy?: string;
    completedAt?: string;
    notes?: string;
  }>;

  @Column({ name: 'checklist_completion_percentage', default: 0 })
  checklistCompletionPercentage: number;

  // Decision Factors
  @Column({ name: 'decision_factors', type: 'json', nullable: true })
  decisionFactors: Array<{
    factor: string;
    weight: number;
    score: number;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;

  @Column({ name: 'decision_score', default: 0 })
  decisionScore: number; // Aggregate score from decision factors

  @Column({ name: 'confidence_level', default: 0 })
  confidenceLevel: number; // 0-100 confidence in the decision

  // Communication and Collaboration
  @Column({ name: 'comments', type: 'json', default: '[]' })
  comments: Array<{
    id: string;
    commentBy: string;
    commentAt: string;
    comment: string;
    internal: boolean;
    flagged: boolean;
    replies?: Array<{
      id: string;
      replyBy: string;
      replyAt: string;
      reply: string;
    }>;
  }>;

  @Column({ name: 'internal_notes', type: 'text', nullable: true })
  internalNotes: string;

  @Column({ name: 'customer_communication', type: 'json', nullable: true })
  customerCommunication: Array<{
    type: 'sms' | 'email' | 'phone' | 'in_person';
    sentAt: string;
    sentBy: string;
    message: string;
    status: 'sent' | 'delivered' | 'failed';
  }>;

  // Performance and Analytics
  @Column({ name: 'touches_count', default: 0 })
  touchesCount: number; // Number of times workflow was accessed/modified

  @Column({ name: 'reviewers_count', default: 0 })
  reviewersCount: number; // Number of different reviewers

  @Column({ name: 'stage_durations', type: 'json', default: '{}' })
  stageDurations: Record<ApprovalStage, number>; // Duration in each stage (minutes)

  @Column({ name: 'bottleneck_stage', nullable: true })
  bottleneckStage: ApprovalStage; // Stage that took longest

  @Column({ name: 'efficiency_score', default: 0 })
  efficiencyScore: number; // 0-100 based on SLA performance

  // System and Automation
  @Column({ name: 'auto_decision_eligible', default: false })
  autoDecisionEligible: boolean;

  @Column({ name: 'auto_decision_applied', default: false })
  autoDecisionApplied: boolean;

  @Column({ name: 'auto_decision_confidence', default: 0 })
  autoDecisionConfidence: number; // 0-100

  @Column({ name: 'manual_override_required', default: false })
  manualOverrideRequired: boolean;

  @Column({ name: 'override_reason', type: 'text', nullable: true })
  overrideReason: string;

  // Compliance and Audit
  @Column({ name: 'compliance_flags', type: 'json', nullable: true })
  complianceFlags: Array<{
    flag: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    raisedAt: string;
    resolvedAt?: string;
    resolvedBy?: string;
  }>;

  @Column({ name: 'regulatory_requirements', type: 'json', nullable: true })
  regulatoryRequirements: Array<{
    requirement: string;
    applicable: boolean;
    satisfied: boolean;
    evidence?: string;
    verifiedBy?: string;
  }>;

  @Column({ name: 'audit_trail', type: 'json', default: '[]' })
  auditTrail: Array<{
    action: string;
    performedBy: string;
    performedAt: string;
    fromStage?: ApprovalStage;
    toStage?: ApprovalStage;
    details: Record<string, any>;
    ipAddress: string;
    userAgent?: string;
  }>;

  // Additional Information
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'tags', type: 'json', nullable: true })
  tags: string[]; // For categorization and filtering

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Transaction, transaction => transaction.id, { eager: true })
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;

  // Computed Properties
  get isPending(): boolean {
    return this.status === WorkflowStatus.PENDING;
  }

  get isInReview(): boolean {
    return this.status === WorkflowStatus.IN_REVIEW;
  }

  get isCompleted(): boolean {
    return [WorkflowStatus.APPROVED, WorkflowStatus.REJECTED].includes(this.status);
  }

  get isExpired(): boolean {
    return new Date() > this.expiresAt && !this.isCompleted;
  }

  get isOverdue(): boolean {
    return this.isExpired && this.isPending;
  }

  get canBeAssigned(): boolean {
    return this.isPending && !this.assignedTo;
  }

  get canBeStarted(): boolean {
    return this.isPending && this.assignedTo && !this.startedAt;
  }

  get canBeEscalated(): boolean {
    return !this.isCompleted && this.escalationLevel < 3;
  }

  get requiresManagerApproval(): boolean {
    return this.managerReviewRequired || this.escalationLevel >= 1;
  }

  get requiresAdminApproval(): boolean {
    return this.adminReviewRequired || this.escalationLevel >= 2;
  }

  get totalDurationMinutes(): number {
    if (!this.completedAt) return 0;
    return Math.round((this.completedAt.getTime() - this.createdAt.getTime()) / (1000 * 60));
  }

  get reviewDurationMinutes(): number {
    if (!this.startedAt || !this.completedAt) return 0;
    return Math.round((this.completedAt.getTime() - this.startedAt.getTime()) / (1000 * 60));
  }

  get isWithinSLA(): boolean {
    return this.totalDurationMinutes <= this.slaDurationMinutes;
  }

  get slaBreachMinutes(): number {
    if (this.isWithinSLA) return 0;
    return this.totalDurationMinutes - this.slaDurationMinutes;
  }

  get urgencyLevel(): number {
    let urgency = 0;
    
    // Priority factor
    switch (this.priority) {
      case ApprovalPriority.CRITICAL: urgency += 50; break;
      case ApprovalPriority.URGENT: urgency += 40; break;
      case ApprovalPriority.HIGH: urgency += 30; break;
      case ApprovalPriority.NORMAL: urgency += 20; break;
      case ApprovalPriority.LOW: urgency += 10; break;
    }
    
    // Time factor
    const timeElapsed = (new Date().getTime() - this.createdAt.getTime()) / (1000 * 60);
    const timeRatio = timeElapsed / this.slaDurationMinutes;
    urgency += Math.min(timeRatio * 30, 30);
    
    // Escalation factor
    urgency += this.escalationLevel * 10;
    
    return Math.min(urgency, 100);
  }

  get nextReviewerRole(): string {
    switch (this.currentStage) {
      case ApprovalStage.INITIAL_REVIEW:
        return UserRole.CLERK;
      case ApprovalStage.MANAGER_REVIEW:
        return UserRole.COMPANY_ADMIN;
      case ApprovalStage.ADMIN_REVIEW:
        return UserRole.SUPER_ADMIN;
      default:
        return UserRole.CLERK;
    }
  }

  get stageProgress(): number {
    const stages = ApprovalStage;
    const currentIndex = stages.indexOf(this.currentStage);
    return Math.round(((currentIndex + 1) / stages.length) * 100);
  }

  // Business Logic Methods
  assign(assignedTo: string, assignedBy: string, queueName?: string): void {
    if (this.assignedTo) {
      throw new Error('Workflow is already assigned');
    }

    this.assignedTo = assignedTo;
    this.assignedBy = assignedBy;
    this.assignedAt = new Date();
    this.queueName = queueName;
    this.updatedAt = new Date();

    this.addAuditEntry('ASSIGNED', assignedBy, { assignedTo, queueName });
  }

  reassign(newAssignee: string, reassignedBy: string, reason?: string): void {
    const oldAssignee = this.assignedTo;
    
    this.assignedTo = newAssignee;
    this.assignedBy = reassignedBy;
    this.assignedAt = new Date();
    this.updatedAt = new Date();

    this.addAuditEntry('REASSIGNED', reassignedBy, { oldAssignee, newAssignee, reason });
  }

  startReview(reviewerId: string): void {
    if (this.assignedTo !== reviewerId) {
      throw new Error('Only assigned reviewer can start review');
    }

    this.status = WorkflowStatus.IN_REVIEW;
    this.startedAt = new Date();
    this.updatedAt = new Date();

    this.addAuditEntry('REVIEW_STARTED', reviewerId);
  }

  approve(approverId: string, notes?: string, conditions?: Array<any>): void {
    if (!this.canBeApproved(approverId)) {
      throw new Error('Workflow cannot be approved by this user');
    }

    this.status = WorkflowStatus.APPROVED;
    this.approvedBy = approverId;
    this.approvedAt = new Date();
    this.completedAt = new Date();
    this.approvalNotes = notes;
    this.approvalConditions = conditions;
    this.responseTimeMinutes = this.totalDurationMinutes;
    this.updatedAt = new Date();

    this.calculateEfficiencyScore();
    this.addAuditEntry('APPROVED', approverId, { notes, conditions });
  }

  reject(rejecterId: string, reason: string, category?: string, allowResubmission: boolean = true): void {
    if (!this.canBeRejected(rejecterId)) {
      throw new Error('Workflow cannot be rejected by this user');
    }

    this.status = WorkflowStatus.REJECTED;
    this.rejectedBy = rejecterId;
    this.rejectedAt = new Date();
    this.completedAt = new Date();
    this.rejectionReason = reason;
    this.rejectionCategory = category;
    this.allowResubmission = allowResubmission;
    this.responseTimeMinutes = this.totalDurationMinutes;
    this.updatedAt = new Date();

    this.calculateEfficiencyScore();
    this.addAuditEntry('REJECTED', rejecterId, { reason, category, allowResubmission });
  }

  escalate(escalatedBy: string, reason: EscalationReason, notes?: string): void {
    if (!this.canBeEscalated) {
      throw new Error('Workflow cannot be escalated further');
    }

    this.escalated = true;
    this.escalationLevel++;
    this.escalationReason = reason;
    this.escalatedBy = escalatedBy;
    this.escalatedAt = new Date();
    this.escalationNotes = notes;
    this.assignedTo = null; // Clear current assignment
    this.assignedAt = null;
    this.updatedAt = new Date();

    // Update current stage based on escalation level
    if (this.escalationLevel === 1) {
      this.currentStage = ApprovalStage.MANAGER_REVIEW;
      this.queueName = 'approval-manager';
    } else if (this.escalationLevel >= 2) {
      this.currentStage = ApprovalStage.ADMIN_REVIEW;
      this.queueName = 'approval-admin';
    }

    this.addAuditEntry('ESCALATED', escalatedBy, { reason, notes, level: this.escalationLevel });
  }

  autoEscalate(reason: EscalationReason): void {
    this.autoEscalated = true;
    this.escalate('SYSTEM', reason, 'Auto-escalated due to SLA breach or system rules');
  }

  addStageCompletion(stage: ApprovalStage, completedBy: string): void {
    const startTime = this.getStageStartTime(stage);
    const duration = startTime ? Math.round((new Date().getTime() - startTime.getTime()) / (1000 * 60)) : 0;
    
    this.stageDurations[stage] = duration;
    this.currentStage = this.getNextStage(stage);
    this.updatedAt = new Date();

    this.addAuditEntry('STAGE_COMPLETED', completedBy, { stage, duration });
  }

  addChecklistItem(item: string, required: boolean = true): void {
    if (!this.checklistItems) {
      this.checklistItems = [];
    }

    this.checklistItems.push({
      item,
      required,
      completed: false,
    });

    this.updateChecklistCompletion();
  }

  completeChecklistItem(itemIndex: number, completedBy: string, notes?: string): void {
    if (!this.checklistItems || itemIndex >= this.checklistItems.length) {
      throw new Error('Invalid checklist item index');
    }

    this.checklistItems[itemIndex].completed = true;
    this.checklistItems[itemIndex].completedBy = completedBy;
    this.checklistItems[itemIndex].completedAt = new Date().toISOString();
    this.checklistItems[itemIndex].notes = notes;

    this.updateChecklistCompletion();
    this.addAuditEntry('CHECKLIST_ITEM_COMPLETED', completedBy, { itemIndex, item: this.checklistItems[itemIndex].item });
  }

  addComment(commentBy: string, comment: string, internal: boolean = false): string {
    const commentId = nanoid(8);
    
    this.comments.push({
      id: commentId,
      commentBy,
      commentAt: new Date().toISOString(),
      comment,
      internal,
      flagged: false,
    });

    this.touchesCount++;
    this.updatedAt = new Date();

    this.addAuditEntry('COMMENT_ADDED', commentBy, { commentId, internal });
    
    return commentId;
  }

  addComplianceFlag(flag: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', description: string): void {
    if (!this.complianceFlags) {
      this.complianceFlags = [];
    }

    this.complianceFlags.push({
      flag,
      severity,
      description,
      raisedAt: new Date().toISOString(),
    });

    // Auto-escalate for critical flags
    if (severity === 'CRITICAL' && !this.escalated) {
      this.autoEscalate(EscalationReason.COMPLIANCE_FLAG);
    }
  }

  updatePriority(newPriority: ApprovalPriority, updatedBy: string, reason?: string): void {
    const oldPriority = this.priority;
    this.priority = newPriority;
    this.updatedAt = new Date();

    this.addAuditEntry('PRIORITY_UPDATED', updatedBy, { oldPriority, newPriority, reason });
  }

  extendSLA(additionalMinutes: number, extendedBy: string, reason: string): void {
    this.slaDurationMinutes += additionalMinutes;
    this.expiresAt = new Date(this.expiresAt.getTime() + (additionalMinutes * 60 * 1000));
    this.updatedAt = new Date();

    this.addAuditEntry('SLA_EXTENDED', extendedBy, { additionalMinutes, reason });
  }

  cancel(cancelledBy: string, reason: string): void {
    this.status = WorkflowStatus.CANCELLED;
    this.completedAt = new Date();
    this.updatedAt = new Date();

    this.addAuditEntry('CANCELLED', cancelledBy, { reason });
  }

  private canBeApproved(approverId: string): boolean {
    return this.isInReview && (this.assignedTo === approverId || this.requiresManagerApproval || this.requiresAdminApproval);
  }

  private canBeRejected(rejecterId: string): boolean {
    return this.isInReview && (this.assignedTo === rejecterId || this.requiresManagerApproval || this.requiresAdminApproval);
  }

  private getStageStartTime(stage: ApprovalStage): Date | null {
    // Find when this stage started from audit trail
    const stageEntry = this.auditTrail.find(entry => entry.toStage === stage);
    return stageEntry ? new Date(stageEntry.performedAt) : this.createdAt;
  }

  private getNextStage(currentStage: ApprovalStage): ApprovalStage {
    const stages = ApprovalStage;
    const currentIndex = stages.indexOf(currentStage);
    return stages[Math.min(currentIndex + 1, stages.length - 1)];
  }

  private updateChecklistCompletion(): void {
    if (!this.checklistItems || this.checklistItems.length === 0) {
      this.checklistCompletionPercentage = 100;
      return;
    }

    const completedItems = this.checklistItems.filter(item => item.completed).length;
    this.checklistCompletionPercentage = Math.round((completedItems / this.checklistItems.length) * 100);
  }

  private calculateEfficiencyScore(): void {
    let score = 100;
    
    // SLA performance
    if (!this.isWithinSLA) {
      const breachRatio = this.slaBreachMinutes / this.slaDurationMinutes;
      score -= Math.min(breachRatio * 30, 30);
    }
    
    // Escalation penalty
    score -= this.escalationLevel * 10;
    
    // Touch efficiency
    if (this.touchesCount > 5) {
      score -= (this.touchesCount - 5) * 2;
    }
    
    this.efficiencyScore = Math.max(score, 0);
  }

  private addAuditEntry(action: string, performedBy: string, details?: Record<string, any>): void {
    this.auditTrail.push({
      action,
      performedBy,
      performedAt: new Date().toISOString(),
      fromStage: this.currentStage,
      toStage: this.currentStage,
      details: details || {},
      ipAddress: 'unknown', // Will be set by service
    });
  }

  @BeforeInsert()
  generateWorkflowNumber(): void {
    if (!this.workflowNumber) {
      const timestamp = Date.now().toString(36);
      const random = nanoid(4).toUpperCase();
      this.workflowNumber = `AWF${timestamp}${random}`;
    }

    // Set expiry based on SLA
    if (!this.expiresAt) {
      this.expiresAt = new Date();
      this.expiresAt.setMinutes(this.expiresAt.getMinutes() + this.slaDurationMinutes);
    }

    // Initialize empty arrays
    if (!this.comments) this.comments = [];
    if (!this.auditTrail) this.auditTrail = [];
    if (!this.stageDurations) this.stageDurations = {} as Record<ApprovalStage, number>;
  }

  // Static factory methods
  static createForTransaction(data: {
    companyId: string;
    transactionId: string;
    priority?: ApprovalPriority;
    slaDurationMinutes?: number;
    managerReviewRequired?: boolean;
    adminReviewRequired?: boolean;
  }): Partial<ApprovalWorkflow> {
    return {
      ...data,
      status: WorkflowStatus.PENDING,
      currentStage: ApprovalStage.INITIAL_REVIEW,
      priority: data.priority || ApprovalPriority.NORMAL,
      slaDurationMinutes: data.slaDurationMinutes || 60,
      escalated: false,
      escalationLevel: 0,
      touchesCount: 0,
      reviewersCount: 0,
      checklistCompletionPercentage: 0,
      efficiencyScore: 0,
      autoDecisionEligible: false,
      autoDecisionApplied: false,
      manualOverrideRequired: false,
      comments: [],
      auditTrail: [],
      stageDurations: {} as Record<ApprovalStage, number>,
    };
  }
}