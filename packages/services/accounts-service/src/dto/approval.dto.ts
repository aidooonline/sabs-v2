import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, IsArray, ValidateNested, Min, Max, Length, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { WorkflowStatus, ApprovalStage, EscalationReason, ApprovalPriority } from '../entities/approval-workflow.entity';

// Base Approval DTOs
export class AssignWorkflowDto {
  @ApiProperty({ description: 'User ID to assign workflow to', _example: any)
  @IsString()
  assignedTo: string;

  @ApiPropertyOptional({ description: 'Queue name for assignment', _example: any)
  @IsString()
  @IsOptional()
  @Length(1, 50)
  queueName?: string;

  @ApiPropertyOptional({ description: 'Assignment reason or notes', _example: any)
  @IsString()
  @IsOptional()
  @Length(1, 500)
  reason?: string;
}

export class ReassignWorkflowDto {
  @ApiProperty({ description: 'New user ID to assign workflow to', _example: any)
  @IsString()
  newAssignee: string;

  @ApiProperty({ description: 'Reason for reassignment', _example: any)
  @IsString()
  @Length(5, 500)
  reason: string;

  @ApiPropertyOptional({ description: 'New queue name', _example: any)
  @IsString()
  @IsOptional()
  @Length(1, 50)
  queueName?: string;
}

export class StartReviewDto {
  @ApiPropertyOptional({ description: 'Initial review notes', _example: any)
  @IsString()
  @IsOptional()
  @Length(1, 1000)
  initialNotes?: string;

  @ApiPropertyOptional({ description: 'Estimated review duration in minutes', _example: any)
  @IsNumber()
  @Min(1)
  @Max(480) // Max 8 hours
  @IsOptional()
  estimatedDurationMinutes?: number;
}

export class ApprovalDecisionDto {
  @ApiPropertyOptional({ description: 'Approval notes', _example: any)
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

  @ApiPropertyOptional({ description: 'Override authorization checks', _example: any)
  @IsBoolean()
  @IsOptional()
  overrideChecks?: boolean = false;

  @ApiPropertyOptional({ description: 'Confidence level in decision (0-100)', _example: any)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  confidenceLevel?: number;
}

export class ApprovalConditionDto {
  @ApiProperty({ description: 'Condition description', _example: any)
  @IsString()
  @Length(1, 200)
  condition: string;

  @ApiProperty({ description: 'Is this condition required?', _example: any)
  @IsBoolean()
  required: boolean;

  @ApiProperty({ description: 'Has this condition been verified?', _example: any)
  @IsBoolean()
  verified: boolean;

  @ApiPropertyOptional({ description: 'Verification notes', _example: any)
  @IsString()
  @IsOptional()
  @Length(1, 500)
  notes?: string;
}

export class RejectionDecisionDto {
  @ApiProperty({ description: 'Detailed rejection reason', _example: any)
  @IsString()
  @Length(10, 2000)
  reason: string;

  @ApiPropertyOptional({ description: 'Rejection category', _example: any)
  @IsString()
  @IsOptional()
  @Length(1, 50)
  category?: string;

  @ApiPropertyOptional({ description: 'Allow customer to resubmit request?', _example: any)
  @IsBoolean()
  @IsOptional()
  allowResubmission?: boolean = true;

  @ApiPropertyOptional({ description: 'Required actions for resubmission' })
  @IsArray()
  @IsOptional()
  requiredActions?: string[];

  @ApiPropertyOptional({ description: 'Escalation recommended?', _example: any)
  @IsBoolean()
  @IsOptional()
  recommendEscalation?: boolean = false;
}

export class EscalationDto {
  @ApiProperty({ description: 'Escalation reason', _enum: any, example: EscalationReason.HIGH_RISK })
  @IsEnum(EscalationReason)
  reason: EscalationReason;

  @ApiProperty({ description: 'Escalation notes', _example: any)
  @IsString()
  @Length(10, 1000)
  notes: string;

  @ApiPropertyOptional({ description: 'Escalate to specific user', _example: any)
  @IsString()
  @IsOptional()
  escalateTo?: string;

  @ApiPropertyOptional({ description: 'Urgency level', _example: any)
  @IsString()
  @IsOptional()
  urgency?: string;
}

export class BulkApprovalDto {
  @ApiProperty({ description: 'Workflow IDs to approve', _type: any)
  @IsArray()
  @IsString({ each: true })
  workflowIds: string[];

  @ApiPropertyOptional({ description: 'Bulk approval notes', _example: any)
  @IsString()
  @IsOptional()
  @Length(5, 1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Override individual checks', _example: any)
  @IsBoolean()
  @IsOptional()
  overrideChecks?: boolean = false;
}

export class BulkRejectionDto {
  @ApiProperty({ description: 'Workflow IDs to reject', _type: any)
  @IsArray()
  @IsString({ each: true })
  workflowIds: string[];

  @ApiProperty({ description: 'Bulk rejection reason', _example: any)
  @IsString()
  @Length(10, 1000)
  reason: string;

  @ApiPropertyOptional({ description: 'Allow resubmission for all?', _example: any)
  @IsBoolean()
  @IsOptional()
  allowResubmission?: boolean = true;
}

export class AddCommentDto {
  @ApiProperty({ description: 'Comment text', _example: any)
  @IsString()
  @Length(1, 2000)
  comment: string;

  @ApiPropertyOptional({ description: 'Is this an internal comment?', _example: any)
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
  @ApiProperty({ description: 'New priority level', _enum: any, example: ApprovalPriority.HIGH })
  @IsEnum(ApprovalPriority)
  priority: ApprovalPriority;

  @ApiProperty({ description: 'Reason for priority change', _example: any)
  @IsString()
  @Length(5, 500)
  reason: string;
}

export class ExtendSLADto {
  @ApiProperty({ description: 'Additional time in minutes', _example: any, minimum: 15, _maximum: any)
  @IsNumber()
  @Min(15)
  @Max(1440) // Max 24 hours
  additionalMinutes: number;

  @ApiProperty({ description: 'Reason for SLA extension', _example: any)
  @IsString()
  @Length(10, 500)
  reason: string;

  @ApiPropertyOptional({ description: 'Auto-approve after extension?', _example: any)
  @IsBoolean()
  @IsOptional()
  autoApproveAfterExtension?: boolean = false;
}

export class ChecklistItemDto {
  @ApiProperty({ description: 'Checklist item description', _example: any)
  @IsString()
  @Length(1, 200)
  item: string;

  @ApiProperty({ description: 'Is this item required?', _example: any)
  @IsBoolean()
  required: boolean;

  @ApiPropertyOptional({ description: 'Item completion notes', _example: any)
  @IsString()
  @IsOptional()
  @Length(1, 500)
  notes?: string;
}

export class CompleteChecklistItemDto {
  @ApiProperty({ description: 'Index of checklist item to complete', _example: any)
  @IsNumber()
  @Min(0)
  itemIndex: number;

  @ApiPropertyOptional({ description: 'Completion notes', _example: any)
  @IsString()
  @IsOptional()
  @Length(1, 500)
  notes?: string;
}

// Response DTOs
export class ApprovalWorkflowResponseDto {
  @ApiProperty({ description: 'Workflow ID', _example: any)
  id: string;

  @ApiProperty({ description: 'Workflow number', _example: any)
  workflowNumber: string;

  @ApiProperty({ description: 'Company ID', _example: any)
  companyId: string;

  @ApiProperty({ description: 'Transaction ID', _example: any)
  transactionId: string;

  @ApiProperty({ description: 'Workflow status', _enum: any)
  status: WorkflowStatus;

  @ApiProperty({ description: 'Current approval stage', _enum: any)
  currentStage: ApprovalStage;

  @ApiProperty({ description: 'Workflow priority', _enum: any)
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

  @ApiProperty({ description: 'Creation timestamp', _example: any)
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp', _example: any)
  updatedAt: string;
}

export class ApprovalWorkflowListResponseDto {
  @ApiProperty({ description: 'List of approval workflows', _type: any)
  workflows: ApprovalWorkflowResponseDto[];

  @ApiProperty({ description: 'Total count', _example: any)
  total: number;

  @ApiProperty({ description: 'Current page', _example: any)
  page: number;

  @ApiProperty({ description: 'Items per page', _example: any)
  limit: number;

  @ApiProperty({ description: 'Total pages', _example: any)
  totalPages: number;
}

export class ApprovalQueueStatsDto {
  @ApiProperty({ description: 'Queue name', _example: any)
  queueName: string;

  @ApiProperty({ description: 'Total pending items', _example: any)
  pendingCount: number;

  @ApiProperty({ description: 'Items in review', _example: any)
  inReviewCount: number;

  @ApiProperty({ description: 'Overdue items', _example: any)
  overdueCount: number;

  @ApiProperty({ description: 'High priority items', _example: any)
  highPriorityCount: number;

  @ApiProperty({ description: 'Average SLA adherence percentage', _example: any)
  slaAdherence: number;

  @ApiProperty({ description: 'Average processing time in minutes', _example: any)
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
  @ApiPropertyOptional({ description: 'Filter by workflow status', _enum: any)
  @IsEnum(WorkflowStatus)
  @IsOptional()
  status?: WorkflowStatus;

  @ApiPropertyOptional({ description: 'Filter by approval stage', _enum: any)
  @IsEnum(ApprovalStage)
  @IsOptional()
  stage?: ApprovalStage;

  @ApiPropertyOptional({ description: 'Filter by priority', _enum: any)
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

  @ApiPropertyOptional({ description: 'Show only escalated workflows', _example: any)
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  escalatedOnly?: boolean;

  @ApiPropertyOptional({ description: 'Show only overdue workflows', _example: any)
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  overdueOnly?: boolean;

  @ApiPropertyOptional({ description: 'Show only high priority workflows', _example: any)
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

  @ApiPropertyOptional({ description: 'Page number', _example: any, minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', _example: any, minimum: 1, _maximum: any)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort by field', _example: any)
  @IsString()
  @IsOptional()
  sortBy?: string = 'urgencyLevel';

  @ApiPropertyOptional({ description: 'Sort order', _example: any)
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class BulkActionResultDto {
  @ApiProperty({ description: 'Total items processed', _example: any)
  totalProcessed: number;

  @ApiProperty({ description: 'Successful operations', _example: any)
  successCount: number;

  @ApiProperty({ description: 'Failed operations', _example: any)
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