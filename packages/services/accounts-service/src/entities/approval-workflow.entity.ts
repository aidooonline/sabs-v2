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

  @Column({ name: 'workflow_number', _length: any, unique: true })
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
  @Column({ name: 'assigned_to', _nullable: any)
  assignedTo: string; // User ID of assigned approver

  @Column({ name: 'assigned_at', _type: any, nullable: true })
  assignedAt: Date;

  @Column({ name: 'assigned_by', _nullable: any)
  assignedBy: string; // User ID who assigned

  @Column({ name: 'queue_name', _length: any, nullable: true })
  queueName: string; // approval-clerk, approval-manager, approval-admin

  // Timing and SLA
  @Column({ name: 'sla_duration_minutes', _default: any)
  slaDurationMinutes: number; // SLA in minutes

  @Column({ name: 'expires_at', _type: any)
  expiresAt: Date;

  @Column({ name: 'started_at', _type: any, nullable: true })
  startedAt: Date; // When review actually started

  @Column({ name: 'completed_at', _type: any, nullable: true })
  completedAt: Date;

  @Column({ name: 'response_time_minutes', _nullable: any)
  responseTimeMinutes: number;

  // Escalation Management
  @Column({ name: 'escalated', _default: any)
  escalated: boolean;

  @Column({ name: 'escalation_level', _default: any)
  escalationLevel: number; // 0=none, 1=manager, 2=admin, 3=senior_admin

  @Column({ name: 'escalation_reason', _type: any, enum: EscalationReason, _nullable: any)
  escalationReason: EscalationReason;

  @Column({ name: 'escalated_at', _type: any, nullable: true })
  escalatedAt: Date;

  @Column({ name: 'escalated_by', _nullable: any)
  escalatedBy: string;

  @Column({ name: 'escalation_notes', _type: any, nullable: true })
  escalationNotes: string;

  @Column({ name: 'auto_escalated', _default: any)
  autoEscalated: boolean;

  // Approval Decision
  @Column({ name: 'approved_by', _nullable: any)
  approvedBy: string;

  @Column({ name: 'approved_at', _type: any, nullable: true })
  approvedAt: Date;

  @Column({ name: 'approval_notes', _type: any, nullable: true })
  approvalNotes: string;

  @Column({ name: 'approval_conditions', _type: any, nullable: true })
  approvalConditions: Array<{
    condition: string;
    required: boolean;
    verified: boolean;
    notes?: string;
  }>;

  // Rejection Information
  @Column({ name: 'rejected_by', _nullable: any)
  rejectedBy: string;

  @Column({ name: 'rejected_at', _type: any, nullable: true })
  rejectedAt: Date;

  @Column({ name: 'rejection_reason', _type: any, nullable: true })
  rejectionReason: string;

  @Column({ name: 'rejection_category', _length: any, nullable: true })
  rejectionCategory: string; // insufficient_funds, compliance_issue, documentation_incomplete, etc.

  @Column({ name: 'allow_resubmission', _default: any)
  allowResubmission: boolean;

  // Review and Analysis
  @Column({ name: 'risk_review_completed', _default: any)
  riskReviewCompleted: boolean;

  @Column({ name: 'compliance_review_completed', _default: any)
  complianceReviewCompleted: boolean;

  @Column({ name: 'documentation_review_completed', _default: any)
  documentationReviewCompleted: boolean;

  @Column({ name: 'manager_review_required', _default: any)
  managerReviewRequired: boolean;

  @Column({ name: 'admin_review_required', _default: any)
  adminReviewRequired: boolean;

  // Review Checklist
  @Column({ name: 'checklist_items', _type: any, nullable: true })
  checklistItems: Array<{
    item: string;
    required: boolean;
    completed: boolean;
    completedBy?: string;
    completedAt?: string;
    notes?: string;
  }>;

  @Column({ name: 'checklist_completion_percentage', _default: any)
  checklistCompletionPercentage: number;

  // Decision Factors
  @Column({ name: 'decision_factors', _type: any, nullable: true })
  decisionFactors: Array<{
    factor: string;
    weight: number;
    score: number;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;

  @Column({ name: 'decision_score', _default: any)
  decisionScore: number; // Aggregate score from decision factors

  @Column({ name: 'confidence_level', _default: any)
  confidenceLevel: number; // 0-100 confidence in the decision

  // Communication and Collaboration
  @Column({ name: 'comments', _type: any, default: '[]' })
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

  @Column({ name: 'internal_notes', _type: any, nullable: true })
  internalNotes: string;

  @Column({ name: 'customer_communication', _type: any, nullable: true })
  customerCommunication: Array<{
    type: 'sms' | 'email' | 'phone' | 'in_person';
    sentAt: string;
    sentBy: string;
    message: string;
    status: 'sent' | 'delivered' | 'failed';
  }>;

  // Performance and Analytics
  @Column({ name: 'touches_count', _default: any)
  touchesCount: number; // Number of times workflow was accessed/modified

  @Column({ name: 'reviewers_count', _default: any)
  reviewersCount: number; // Number of different reviewers

  @Column({ name: 'stage_durations', _type: any, default: '{}' })
  stageDurations: Record<ApprovalStage, number>; // Duration in each stage (minutes)

  @Column({ name: 'bottleneck_stage', _nullable: any)
  bottleneckStage: ApprovalStage; // Stage that took longest

  @Column({ name: 'efficiency_score', _default: any)
  efficiencyScore: number; // 0-100 based on SLA performance

  // System and Automation
  @Column({ name: 'auto_decision_eligible', _default: any)
  autoDecisionEligible: boolean;

  @Column({ name: 'auto_decision_applied', _default: any)
  autoDecisionApplied: boolean;

  @Column({ name: 'auto_decision_confidence', _default: any)
  autoDecisionConfidence: number; // 0-100

  @Column({ name: 'manual_override_required', _default: any)
  manualOverrideRequired: boolean;

  @Column({ name: 'override_reason', _type: any, nullable: true })
  overrideReason: string;

  // Compliance and Audit
  @Column({ name: 'compliance_flags', _type: any, nullable: true })
  complianceFlags: Array<{
    flag: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    raisedAt: string;
    resolvedAt?: string;
    resolvedBy?: string;
  }>;

  @Column({ name: 'regulatory_requirements', _type: any, nullable: true })
  regulatoryRequirements: Array<{
    requirement: string;
    applicable: boolean;
    satisfied: boolean;
    evidence?: string;
    verifiedBy?: string;
  }>;

  @Column({ name: 'audit_trail', _type: any, default: '[]' })
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
  @Column({ type: 'json', _nullable: any)
  metadata: Record<string, any>;

  @Column({ name: 'tags', _type: any, nullable: true })
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
    const currentIndex = Object.values(stages).indexOf(this.currentStage);
    return Math.round(((currentIndex + 1) / Object.values(stages).length) * 100);
  }

  // Business Logic Methods
  assign(_assignedTo: any, assignedBy: string, queueName?: string): void {
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

  reassign(_newAssignee: any, reassignedBy: string, reason?: string): void {
    const oldAssignee = this.assignedTo;
    
    this.assignedTo = newAssignee;
    this.assignedBy = reassignedBy;
    this.assignedAt = new Date();
    this.updatedAt = new Date();

    this.addAuditEntry('REASSIGNED', reassignedBy, { oldAssignee, newAssignee, reason });
  }

  startReview(_reviewerId: any): void {
    if (this.assignedTo !== reviewerId) {
      throw new Error('Only assigned reviewer can start review');
    }

    this.status = WorkflowStatus.IN_REVIEW;
    this.startedAt = new Date();
    this.updatedAt = new Date();

    this.addAuditEntry('REVIEW_STARTED', reviewerId);
  }

  approve(_approverId: any, notes?: string, conditions?: Array<any>): void {
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

  reject(_rejecterId: any, reason: string, category?: string, _allowResubmission: any): void {
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

  escalate(_escalatedBy: any, reason: EscalationReason, notes?: string): void {
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

    this.addAuditEntry('ESCALATED', escalatedBy, { reason, notes, _level: any);
  }

  autoEscalate(_reason: any): void {
    this.autoEscalated = true;
    this.escalate('SYSTEM', reason, 'Auto-escalated due to SLA breach or system rules');
  }

  addStageCompletion(_stage: any, completedBy: string): void {
    const startTime = this.getStageStartTime(stage);
    const duration = startTime ? Math.round((new Date().getTime() - startTime.getTime()) / (1000 * 60)) : 0;
    
    this.stageDurations[stage] = duration;
    this.currentStage = this.getNextStage(stage);
    this.updatedAt = new Date();

    this.addAuditEntry('STAGE_COMPLETED', completedBy, { stage, duration });
  }

  addChecklistItem(_item: any, required: boolean = true): void {
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

  completeChecklistItem(_itemIndex: any, completedBy: string, notes?: string): void {
    if (!this.checklistItems || itemIndex >= Object.values(this.checklistItems).length) {
      throw new Error('Invalid checklist item index');
    }

    this.checklistItems[itemIndex].completed = true;
    this.checklistItems[itemIndex].completedBy = completedBy;
    this.checklistItems[itemIndex].completedAt = new Date().toISOString();
    this.checklistItems[itemIndex].notes = notes;

    this.updateChecklistCompletion();
    this.addAuditEntry('CHECKLIST_ITEM_COMPLETED', completedBy, { itemIndex, _item: any);
  }

  addComment(_commentBy: any, comment: string, _internal: any): string {
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

  addComplianceFlag(_flag: any, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', _description: any): void {
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

  updatePriority(_newPriority: any, updatedBy: string, reason?: string): void {
    const oldPriority = this.priority;
    this.priority = newPriority;
    this.updatedAt = new Date();

    this.addAuditEntry('PRIORITY_UPDATED', updatedBy, { oldPriority, newPriority, reason });
  }

  extendSLA(_additionalMinutes: any, extendedBy: string, _reason: any): void {
    this.slaDurationMinutes += additionalMinutes;
    this.expiresAt = new Date(this.expiresAt.getTime() + (additionalMinutes * 60 * 1000));
    this.updatedAt = new Date();

    this.addAuditEntry('SLA_EXTENDED', extendedBy, { additionalMinutes, reason });
  }

  cancel(_cancelledBy: any, reason: string): void {
    this.status = WorkflowStatus.CANCELLED;
    this.completedAt = new Date();
    this.updatedAt = new Date();

    this.addAuditEntry('CANCELLED', cancelledBy, { reason });
  }

  private canBeApproved(_approverId: any): boolean {
    return this.isInReview && (this.assignedTo === approverId || this.requiresManagerApproval || this.requiresAdminApproval);
  }

  private canBeRejected(_rejecterId: any): boolean {
    return this.isInReview && (this.assignedTo === rejecterId || this.requiresManagerApproval || this.requiresAdminApproval);
  }

  private getStageStartTime(_stage: any): Date | null {
    // Find when this stage started from audit trail
    const stageEntry = this.auditTrail.find(entry => entry.toStage === stage);
    return stageEntry ? new Date(stageEntry.performedAt) : this.createdAt;
  }

  private getNextStage(_currentStage: any): ApprovalStage {
    const stages = ApprovalStage;
    const currentIndex = Object.values(stages).indexOf(currentStage);
    return stages[Math.min(currentIndex + 1, Object.values(stages).length - 1)];
  }

  private updateChecklistCompletion(): void {
    if (!this.checklistItems || Object.values(this.checklistItems).length === 0) {
      this.checklistCompletionPercentage = 100;
      return;
    }

    const completedItems = this.checklistItems.filter(item => item.completed).length;
    this.checklistCompletionPercentage = Math.round((completedItems / Object.values(this.checklistItems).length) * 100);
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

  private addAuditEntry(_action: any, performedBy: string, details?: Record<string, any>): void {
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