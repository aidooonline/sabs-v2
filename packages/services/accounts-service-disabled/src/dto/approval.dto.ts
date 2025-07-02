import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, IsArray, ValidateNested, Min, Max, Length, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { WorkflowStatus, ApprovalStage, EscalationReason, ApprovalPriority } from '../entities/approval-workflow.entity';

// Base Approval DTOs
export class AssignWorkflowDto {
  @ApiProperty({ description: 'User ID to assign workflow to', example: 'uuid-string' })
  @IsString()
  assignedTo: string;

  @ApiPropertyOptional({ description: 'Queue name for assignment', example: 'approval-clerk' })
  @IsString()
  @IsOptional()
  @Length(1, 50)
  queueName?: string;

  @ApiPropertyOptional({ description: 'Assignment reason or notes', example: 'Assigning to specialist for review' })
  @IsString()
  @IsOptional()
  @Length(1, 500)
  reason?: string;
}

export class ReassignWorkflowDto {
  @ApiProperty({ description: 'New user ID to assign workflow to', example: 'uuid-string' })
  @IsString()
  newAssignee: string;

  @ApiProperty({ description: 'Reason for reassignment', example: 'Original assignee unavailable' })
  @IsString()
  @Length(5, 500)
  reason: string;

  @ApiPropertyOptional({ description: 'New queue name', example: 'approval-manager' })
  @IsString()
  @IsOptional()
  @Length(1, 50)
  queueName?: string;
}

export class StartReviewDto {
  @ApiPropertyOptional({ description: 'Initial review notes', example: 'Starting detailed review of withdrawal request' })
  @IsString()
  @IsOptional()
  @Length(1, 1000)
  initialNotes?: string;

  @ApiPropertyOptional({ description: 'Estimated review duration in minutes', example: 30 })
  @IsNumber()
  @Min(1)
  @Max(480) // Max 8 hours
  @IsOptional()
  estimatedDurationMinutes?: number;
}

export class ApprovalDecisionDto {
  @ApiPropertyOptional({ description: 'Approval notes', example: 'Transaction approved after thorough review. Customer identity verified.' })
  @IsString()
  @IsOptional()
  @Length(10, 2000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Approval conditions that must be met' })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ApprovalConditionDto)
  conditions?: ApprovalConditionDto[];

  @ApiPropertyOptional({ description: 'Override authorization checks', example: false })
  @IsBoolean()
  @IsOptional()
  overrideChecks?: boolean = false;

  @ApiPropertyOptional({ description: 'Confidence level in decision (0-100)', example: 95 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  confidenceLevel?: number;
}

export class ApprovalConditionDto {
  @ApiProperty({ description: 'Condition description', example: 'Customer must present valid ID' })
  @IsString()
  @Length(1, 200)
  condition: string;

  @ApiProperty({ description: 'Is this condition required?', example: true })
  @IsBoolean()
  required: boolean;

  @ApiProperty({ description: 'Has this condition been verified?', example: false })
  @IsBoolean()
  verified: boolean;

  @ApiPropertyOptional({ description: 'Verification notes', example: 'ID verified by agent' })
  @IsString()
  @IsOptional()
  @Length(1, 500)
  notes?: string;
}

export class RejectionDecisionDto {
  @ApiProperty({ description: 'Detailed rejection reason', example: 'Insufficient documentation provided. Customer unable to verify identity adequately.' })
  @IsString()
  @Length(10, 2000)
  reason: string;

  @ApiPropertyOptional({ description: 'Rejection category', example: 'documentation_incomplete' })
  @IsString()
  @IsOptional()
  @Length(1, 50)
  category?: string;

  @ApiPropertyOptional({ description: 'Allow customer to resubmit request?', example: true })
  @IsBoolean()
  @IsOptional()
  allowResubmission?: boolean = true;

  @ApiPropertyOptional({ description: 'Required actions for resubmission' })
  @IsArray()
  @IsOptional()
  requiredActions?: string[];

  @ApiPropertyOptional({ description: 'Escalation recommended?', example: false })
  @IsBoolean()
  @IsOptional()
  recommendEscalation?: boolean = false;
}

export class EscalationDto {
  @ApiProperty({ description: 'Escalation reason', enum: EscalationReason, example: EscalationReason.HIGH_RISK })
  @IsEnum(EscalationReason)
  reason: EscalationReason;

  @ApiProperty({ description: 'Escalation notes', example: 'Transaction flagged for unusual pattern requiring manager review' })
  @IsString()
  @Length(10, 1000)
  notes: string;

  @ApiPropertyOptional({ description: 'Escalate to specific user', example: 'uuid-string' })
  @IsString()
  @IsOptional()
  escalateTo?: string;

  @ApiPropertyOptional({ description: 'Urgency level', example: 'high' })
  @IsString()
  @IsOptional()
  urgency?: string;
}

export class BulkApprovalDto {
  @ApiProperty({ description: 'Workflow IDs to approve', type: [String] })
  @IsArray()
  @IsString({ each: true })
  workflowIds: string[];

  @ApiPropertyOptional({ description: 'Bulk approval notes', example: 'Batch approval of low-risk transactions' })
  @IsString()
  @IsOptional()
  @Length(5, 1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Override individual checks', example: false })
  @IsBoolean()
  @IsOptional()
  overrideChecks?: boolean = false;
}

export class BulkRejectionDto {
  @ApiProperty({ description: 'Workflow IDs to reject', type: [String] })
  @IsArray()
  @IsString({ each: true })
  workflowIds: string[];

  @ApiProperty({ description: 'Bulk rejection reason', example: 'System maintenance - all pending requests rejected' })
  @IsString()
  @Length(10, 1000)
  reason: string;

  @ApiPropertyOptional({ description: 'Allow resubmission for all?', example: true })
  @IsBoolean()
  @IsOptional()
  allowResubmission?: boolean = true;
}

export class AddCommentDto {
  @ApiProperty({ description: 'Comment text', example: 'Requested additional documentation from customer' })
  @IsString()
  @Length(1, 2000)
  comment: string;

  @ApiPropertyOptional({ description: 'Is this an internal comment?', example: false })
  @IsBoolean()
  @IsOptional()
  internal?: boolean = false;

  @ApiPropertyOptional({ description: 'Tag other users in comment' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  taggedUsers?: string[];
}

export class UpdatePriorityDto {
  @ApiProperty({ description: 'New priority level', enum: ApprovalPriority, example: ApprovalPriority.HIGH })
  @IsEnum(ApprovalPriority)
  priority: ApprovalPriority;

  @ApiProperty({ description: 'Reason for priority change', example: 'VIP customer request requires urgent processing' })
  @IsString()
  @Length(5, 500)
  reason: string;
}

export class ExtendSLADto {
  @ApiProperty({ description: 'Additional time in minutes', example: 60, minimum: 15, maximum: 1440 })
  @IsNumber()
  @Min(15)
  @Max(1440) // Max 24 hours
  additionalMinutes: number;

  @ApiProperty({ description: 'Reason for SLA extension', example: 'Awaiting external verification response' })
  @IsString()
  @Length(10, 500)
  reason: string;

  @ApiPropertyOptional({ description: 'Auto-approve after extension?', example: false })
  @IsBoolean()
  @IsOptional()
  autoApproveAfterExtension?: boolean = false;
}

export class ChecklistItemDto {
  @ApiProperty({ description: 'Checklist item description', example: 'Verify customer identity documents' })
  @IsString()
  @Length(1, 200)
  item: string;

  @ApiProperty({ description: 'Is this item required?', example: true })
  @IsBoolean()
  required: boolean;

  @ApiPropertyOptional({ description: 'Item completion notes', example: 'ID documents verified against database' })
  @IsString()
  @IsOptional()
  @Length(1, 500)
  notes?: string;
}

export class CompleteChecklistItemDto {
  @ApiProperty({ description: 'Index of checklist item to complete', example: 0 })
  @IsNumber()
  @Min(0)
  itemIndex: number;

  @ApiPropertyOptional({ description: 'Completion notes', example: 'Item verified successfully' })
  @IsString()
  @IsOptional()
  @Length(1, 500)
  notes?: string;
}

// Response DTOs
export class ApprovalWorkflowResponseDto {
  @ApiProperty({ description: 'Workflow ID', example: 'uuid-string' })
  id: string;

  @ApiProperty({ description: 'Workflow number', example: 'AWF1234567890' })
  workflowNumber: string;

  @ApiProperty({ description: 'Company ID', example: 'uuid-string' })
  companyId: string;

  @ApiProperty({ description: 'Transaction ID', example: 'uuid-string' })
  transactionId: string;

  @ApiProperty({ description: 'Workflow status', enum: WorkflowStatus })
  status: WorkflowStatus;

  @ApiProperty({ description: 'Current approval stage', enum: ApprovalStage })
  currentStage: ApprovalStage;

  @ApiProperty({ description: 'Workflow priority', enum: ApprovalPriority })
  priority: ApprovalPriority;

  @ApiProperty({ description: 'Assignment information' })
  assignment: {
    assignedTo?: string;
    assignedToName?: string;
    assignedAt?: string;
    assignedBy?: string;
    queueName?: string;
  };

  @ApiProperty({ description: 'SLA and timing information' })
  timing: {
    slaDurationMinutes: number;
    expiresAt: string;
    startedAt?: string;
    completedAt?: string;
    responseTimeMinutes?: number;
    isWithinSLA: boolean;
    isOverdue: boolean;
    urgencyLevel: number;
  };

  @ApiProperty({ description: 'Escalation information' })
  escalation: {
    escalated: boolean;
    escalationLevel: number;
    escalationReason?: EscalationReason;
    escalatedAt?: string;
    escalatedBy?: string;
    escalationNotes?: string;
    autoEscalated: boolean;
  };

  @ApiProperty({ description: 'Decision information' })
  decision: {
    approvedBy?: string;
    approvedAt?: string;
    approvalNotes?: string;
    approvalConditions?: Array<{
      condition: string;
      required: boolean;
      verified: boolean;
      notes?: string;
    }>;
    rejectedBy?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    rejectionCategory?: string;
    allowResubmission?: boolean;
  };

  @ApiProperty({ description: 'Review checklist information' })
  checklist: {
    items?: Array<{
      item: string;
      required: boolean;
      completed: boolean;
      completedBy?: string;
      completedAt?: string;
      notes?: string;
    }>;
    completionPercentage: number;
    riskReviewCompleted: boolean;
    complianceReviewCompleted: boolean;
    documentationReviewCompleted: boolean;
  };

  @ApiProperty({ description: 'Performance analytics' })
  analytics: {
    touchesCount: number;
    reviewersCount: number;
    stageDurations: Record<string, number>;
    efficiencyScore: number;
    stageProgress: number;
  };

  @ApiProperty({ description: 'Comments and communication' })
  communication: {
    comments: Array<{
      id: string;
      commentBy: string;
      commentAt: string;
      comment: string;
      internal: boolean;
      flagged: boolean;
    }>;
    internalNotes?: string;
  };

  @ApiProperty({ description: 'Compliance information' })
  compliance: {
    flags?: Array<{
      flag: string;
      severity: string;
      description: string;
      raisedAt: string;
      resolvedAt?: string;
    }>;
    regulatoryRequirements?: Array<{
      requirement: string;
      applicable: boolean;
      satisfied: boolean;
      evidence?: string;
    }>;
  };

  @ApiProperty({ description: 'Transaction details' })
  transaction: {
    transactionNumber: string;
    type: string;
    amount: number;
    currency: string;
    customerId: string;
    customerName: string;
    agentId: string;
    agentName: string;
    riskScore: number;
  };

  @ApiProperty({ description: 'Workflow metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Workflow tags' })
  tags?: string[];

  @ApiProperty({ description: 'Creation timestamp', example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp', example: '2024-01-15T10:35:00Z' })
  updatedAt: string;
}

export class ApprovalWorkflowListResponseDto {
  @ApiProperty({ description: 'List of approval workflows', type: [ApprovalWorkflowResponseDto] })
  workflows: ApprovalWorkflowResponseDto[];

  @ApiProperty({ description: 'Total count', example: 150 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total pages', example: 8 })
  totalPages: number;
}

export class ApprovalQueueStatsDto {
  @ApiProperty({ description: 'Queue name', example: 'approval-clerk' })
  queueName: string;

  @ApiProperty({ description: 'Total pending items', example: 25 })
  pendingCount: number;

  @ApiProperty({ description: 'Items in review', example: 8 })
  inReviewCount: number;

  @ApiProperty({ description: 'Overdue items', example: 3 })
  overdueCount: number;

  @ApiProperty({ description: 'High priority items', example: 5 })
  highPriorityCount: number;

  @ApiProperty({ description: 'Average SLA adherence percentage', example: 87.5 })
  slaAdherence: number;

  @ApiProperty({ description: 'Average processing time in minutes', example: 45 })
  averageProcessingTime: number;

  @ApiProperty({ description: 'Items by priority' })
  priorityBreakdown: Record<ApprovalPriority, number>;

  @ApiProperty({ description: 'Items by stage' })
  stageBreakdown: Record<ApprovalStage, number>;
}

export class ApprovalDashboardStatsDto {
  @ApiProperty({ description: 'Overall statistics' })
  overall: {
    totalPending: number;
    totalInReview: number;
    totalCompleted: number;
    totalOverdue: number;
    slaAdherence: number;
    averageProcessingTime: number;
    approvalRate: number;
  };

  @ApiProperty({ description: 'Statistics by queue' })
  queueStats: ApprovalQueueStatsDto[];

  @ApiProperty({ description: 'Top performing approvers' })
  topApprovers: Array<{
    userId: string;
    userName: string;
    itemsProcessed: number;
    averageTime: number;
    slaAdherence: number;
    approvalRate: number;
  }>;

  @ApiProperty({ description: 'Escalation statistics' })
  escalations: {
    totalEscalated: number;
    autoEscalated: number;
    manualEscalated: number;
    escalationsByReason: Record<EscalationReason, number>;
  };

  @ApiProperty({ description: 'Performance trends' })
  trends: {
    dailyVolume: Array<{ date: string; count: number }>;
    processingTimes: Array<{ date: string; avgTime: number }>;
    slaPerformance: Array<{ date: string; adherence: number }>;
  };
}

// Query DTOs
export class ApprovalWorkflowQueryDto {
  @ApiPropertyOptional({ description: 'Filter by workflow status', enum: WorkflowStatus })
  @IsEnum(WorkflowStatus)
  @IsOptional()
  status?: WorkflowStatus;

  @ApiPropertyOptional({ description: 'Filter by approval stage', enum: ApprovalStage })
  @IsEnum(ApprovalStage)
  @IsOptional()
  stage?: ApprovalStage;

  @ApiPropertyOptional({ description: 'Filter by priority', enum: ApprovalPriority })
  @IsEnum(ApprovalPriority)
  @IsOptional()
  priority?: ApprovalPriority;

  @ApiPropertyOptional({ description: 'Filter by assigned user' })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Filter by queue name' })
  @IsString()
  @IsOptional()
  queueName?: string;

  @ApiPropertyOptional({ description: 'Filter by transaction ID' })
  @IsString()
  @IsOptional()
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Filter by customer ID' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Filter by agent ID' })
  @IsString()
  @IsOptional()
  agentId?: string;

  @ApiPropertyOptional({ description: 'Show only escalated workflows', example: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  escalatedOnly?: boolean;

  @ApiPropertyOptional({ description: 'Show only overdue workflows', example: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  overdueOnly?: boolean;

  @ApiPropertyOptional({ description: 'Show only high priority workflows', example: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  highPriorityOnly?: boolean;

  @ApiPropertyOptional({ description: 'Filter by minimum amount' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum amount' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Filter by date from (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by date to (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Search in workflow number, transaction number, or notes' })
  @IsString()
  @IsOptional()
  @Length(2, 100)
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', example: 1, minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 20, minimum: 1, maximum: 100 })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort by field', example: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy?: string = 'urgencyLevel';

  @ApiPropertyOptional({ description: 'Sort order', example: 'DESC' })
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class BulkActionResultDto {
  @ApiProperty({ description: 'Total items processed', example: 10 })
  totalProcessed: number;

  @ApiProperty({ description: 'Successful operations', example: 8 })
  successCount: number;

  @ApiProperty({ description: 'Failed operations', example: 2 })
  failedCount: number;

  @ApiProperty({ description: 'Detailed results' })
  results: Array<{
    workflowId: string;
    workflowNumber: string;
    success: boolean;
    message?: string;
    error?: string;
  }>;

  @ApiProperty({ description: 'Operation summary' })
  summary: {
    action: string;
    performedBy: string;
    performedAt: string;
    successRate: number;
  };
}