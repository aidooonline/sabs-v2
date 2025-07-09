import { getErrorMessage, getErrorStack, getErrorStatus, UserRole, ReportType, LibraryCapability } from '@sabs/common';
import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan, LessThan, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { ApprovalWorkflow, WorkflowStatus, ApprovalStage, EscalationReason, ApprovalPriority } from '../entities/approval-workflow.entity';
import { Transaction, TransactionStatus } from '../entities/transaction.entity';
import {



  AssignWorkflowDto,
  ReassignWorkflowDto,
  StartReviewDto,
  ApprovalDecisionDto,
  RejectionDecisionDto,
  EscalationDto,
  BulkApprovalDto,
  BulkRejectionDto,
  AddCommentDto,
  UpdatePriorityDto,
  ExtendSLADto,
  ChecklistItemDto,
  CompleteChecklistItemDto,
  ApprovalWorkflowQueryDto,
  ApprovalWorkflowResponseDto,
  ApprovalWorkflowListResponseDto,
  ApprovalDashboardStatsDto,
  ApprovalQueueStatsDto,
  BulkActionResultDto,
} from '../dto/approval.dto';

export interface ApprovalRule {
  condition: string;
  requiredRole: string;
  autoApprove: boolean;
  escalateIfFailed: boolean;
  weight: number;
}

export interface QueueConfiguration {
  name: string;
  maxCapacity: number;
  slaMinutes: number;
  autoAssign: boolean;
  roles: string[];
  priority: number;
}

@Injectable()
export class ApprovalService {
  private readonly logger = new Logger(ApprovalService.name);

  // Approval rules configuration
  private readonly approvalRules: ApprovalRule[] = [
    { condition: 'amount < 500', requiredRole: UserRole.CLERK, autoApprove: true, escalateIfFailed: false, weight: 1 },
    { condition: 'amount >= 500 && amount < 2000', requiredRole: UserRole.CLERK, autoApprove: false, escalateIfFailed: false, weight: 2 },
    { condition: 'amount >= 2000 && amount < 5000', requiredRole: UserRole.COMPANY_ADMIN, autoApprove: false, escalateIfFailed: true, weight: 3 },
    { condition: 'amount >= 5000', requiredRole: UserRole.SUPER_ADMIN, autoApprove: false, escalateIfFailed: true, weight: 4 },
    { condition: 'riskScore >= 70', requiredRole: UserRole.COMPANY_ADMIN, autoApprove: false, escalateIfFailed: true, weight: 3 },
    { condition: 'riskScore >= 90', requiredRole: UserRole.SUPER_ADMIN, autoApprove: false, escalateIfFailed: true, weight: 4 },
  ];

  // Queue configurations
  private readonly queueConfigurations: QueueConfiguration[] = [
    { name: 'approval-clerk', maxCapacity: 50, slaMinutes: 30, autoAssign: true, roles: [UserRole.CLERK], priority: 1 },
    { name: 'approval-manager', maxCapacity: 25, slaMinutes: 60, autoAssign: true, roles: [UserRole.COMPANY_ADMIN], priority: 2 },
    { name: 'approval-admin', maxCapacity: 10, slaMinutes: 120, autoAssign: false, roles: [UserRole.SUPER_ADMIN], priority: 3 },
  ];

  constructor(
    @InjectRepository(ApprovalWorkflow)
    private workflowRepository: Repository<ApprovalWorkflow>,

    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,

    private eventEmitter: EventEmitter2,

    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  // ===== WORKFLOW CREATION AND INITIALIZATION =====

  async createApprovalWorkflow(
    companyId: string,
    transactionId: string,
    createdBy: string,
  ): Promise<ApprovalWorkflowResponseDto> {
    this.logger.log(`Creating approval workflow for transaction ${transactionId}`);

    // Get transaction details
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId, companyId },
      relations: ["customer", 'account'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Determine priority and SLA based on transaction details
    const priority = this.determinePriority(transaction);
    const slaDurationMinutes = this.calculateSLA(transaction, priority);
    const initialStage = this.determineInitialStage(transaction);

    // Create workflow data
    const workflowData = ApprovalWorkflow.createForTransaction({}, {
      companyId,
      transactionId,
      priority,
      slaDurationMinutes,
      managerReviewRequired: transaction.requiresManagerApproval,
      adminReviewRequired: transaction.requiresAdminApproval,
    });

    // Create and save workflow
    const workflow = this.workflowRepository.create(workflowData);
    workflow.currentStage = initialStage;
    
    // Add initial checklist items
    this.addInitialChecklistItems(workflow, transaction);
    
    await this.workflowRepository.save(workflow);

    // Auto-assign if possible
    await this.autoAssignWorkflow(workflow);

    // Cache for quick access
    await this.cacheManager.set(
      `workflow:${workflow.id}`,
      workflow,
      300000, // 5 minutes
    );

    // Emit creation event
    this.eventEmitter.emit('approval.workflow_created', {
      workflowId: workflow.id,
      transactionId,
      priority,
      assignedQueue: workflow.queueName,
      slaMinutes: slaDurationMinutes,
    });

    this.logger.log(`Approval workflow created: ${workflow.workflowNumber}`);

    return this.formatWorkflowResponse(await this.getWorkflowById(companyId, workflow.id));
  }

  // ===== WORKFLOW ASSIGNMENT AND MANAGEMENT =====

  async assignWorkflow(
    companyId: string,
    workflowId: string,
    assignedBy: string,
    assignDto: AssignWorkflowDto,
  ): Promise<ApprovalWorkflowResponseDto> {
    this.logger.log(`Assigning workflow ${workflowId} to ${assignDto.assignedTo}`);

    const workflow = await this.getWorkflowById(companyId, workflowId);

    if (!workflow.canBeAssigned) {
      throw new BadRequestException('Workflow cannot be assigned in current state');
    }

    // Validate assignee has appropriate role
    await this.validateApprovalAuthority(assignDto.assignedTo, workflow.currentStage);

    // Assign workflow
    workflow.assign(assignDto.assignedTo, assignedBy, assignDto.queueName);
    await this.workflowRepository.save(workflow);

    // Clear cache
    await this.cacheManager.del(`workflow:${workflowId}`);

    // Emit assignment event
    this.eventEmitter.emit('approval.workflow_assigned', {
      workflowId,
      assignedTo: assignDto.assignedTo,
      assignedBy,
      queueName: assignDto.queueName,
    });

    return this.formatWorkflowResponse(workflow);
  }

  async reassignWorkflow(
    companyId: string,
    workflowId: string,
    reassignedBy: string,
    reassignDto: ReassignWorkflowDto,
  ): Promise<ApprovalWorkflowResponseDto> {
    this.logger.log(`Reassigning workflow ${workflowId} to ${reassignDto.newAssignee}`);

    const workflow = await this.getWorkflowById(companyId, workflowId);

    // Validate new assignee has appropriate role
    await this.validateApprovalAuthority(reassignDto.newAssignee, workflow.currentStage);

    // Reassign workflow
    workflow.reassign(reassignDto.newAssignee, reassignedBy, reassignDto.reason);
    await this.workflowRepository.save(workflow);

    // Clear cache
    await this.cacheManager.del(`workflow:${workflowId}`);

    // Emit reassignment event
    this.eventEmitter.emit('approval.workflow_reassigned', {
      workflowId,
      newAssignee: reassignDto.newAssignee,
      reassignedBy,
      reason: reassignDto.reason,
    });

    return this.formatWorkflowResponse(workflow);
  }

  async startReview(
    companyId: string,
    workflowId: string,
    reviewerId: string,
    startDto: StartReviewDto,
  ): Promise<ApprovalWorkflowResponseDto> {
    this.logger.log(`Starting review for workflow ${workflowId} by ${reviewerId}`);

    const workflow = await this.getWorkflowById(companyId, workflowId);

    if (!workflow.canBeStarted) {
      throw new BadRequestException('Review cannot be started for this workflow');
    }

    // Start review
    workflow.startReview(reviewerId);
    
    if (startDto.initialNotes) {
      workflow.addComment(reviewerId, startDto.initialNotes, true);
    }

    await this.workflowRepository.save(workflow);

    // Clear cache
    await this.cacheManager.del(`workflow:${workflowId}`);

    // Emit review started event
    this.eventEmitter.emit('approval.review_started', {
      workflowId,
      reviewerId,
      estimatedDuration: startDto.estimatedDurationMinutes,
    });

    return this.formatWorkflowResponse(workflow);
  }

  // ===== APPROVAL DECISIONS =====

  async approveWorkflow(
    companyId: string,
    workflowId: string,
    approverId: string,
    approvalDto: ApprovalDecisionDto,
  ): Promise<ApprovalWorkflowResponseDto> {
    this.logger.log(`Approving workflow ${workflowId} by ${approverId}`);

    const workflow = await this.getWorkflowById(companyId, workflowId);

    // Validate approver authority
    if (!approvalDto.overrideChecks) {
      await this.validateApprovalAuthority(approverId, workflow.currentStage);
      await this.validateCompletedChecklist(workflow);
    }

    // Approve workflow
    workflow.approve(approverId, approvalDto.notes, approvalDto.conditions);
    
    if (approvalDto.confidenceLevel) {
      workflow.confidenceLevel = approvalDto.confidenceLevel;
    }

    await this.workflowRepository.save(workflow);

    // Update transaction status
    await this.updateTransactionStatus(workflow.transactionId, TransactionStatus.APPROVED);

    // Clear cache
    await this.cacheManager.del(`workflow:${workflowId}`);

    // Emit approval event
    this.eventEmitter.emit('approval.workflow_approved', {
      workflowId,
      transactionId: workflow.transactionId,
      approverId,
      conditions: approvalDto.conditions,
      processingTimeMinutes: workflow.totalDurationMinutes,
    });

    this.logger.log(`Workflow approved: ${workflow.workflowNumber}`);

    return this.formatWorkflowResponse(workflow);
  }

  async rejectWorkflow(
    companyId: string,
    workflowId: string,
    rejecterId: string,
    rejectionDto: RejectionDecisionDto,
  ): Promise<ApprovalWorkflowResponseDto> {
    this.logger.log(`Rejecting workflow ${workflowId} by ${rejecterId}`);

    const workflow = await this.getWorkflowById(companyId, workflowId);

    // Validate rejector authority
    await this.validateApprovalAuthority(rejecterId, workflow.currentStage);

    // Reject workflow
    workflow.reject(
      rejecterId,
      rejectionDto.reason,
      rejectionDto.category,
      rejectionDto.allowResubmission,
    );

    await this.workflowRepository.save(workflow);

    // Update transaction status
    await this.updateTransactionStatus(workflow.transactionId, TransactionStatus.REJECTED);

    // Clear cache
    await this.cacheManager.del(`workflow:${workflowId}`);

    // Auto-escalate if recommended
    if (rejectionDto.recommendEscalation && workflow.canBeEscalated) {
      await this.escalateWorkflow(companyId, workflowId, rejecterId, {
        reason: EscalationReason.MANUAL_ESCALATION,
        notes: `Escalated after rejection: ${rejectionDto.reason}`,
      });
    }

    // Emit rejection event
    this.eventEmitter.emit('approval.workflow_rejected', {
      workflowId,
      transactionId: workflow.transactionId,
      rejecterId,
      reason: rejectionDto.reason,
      category: rejectionDto.category,
      allowResubmission: rejectionDto.allowResubmission,
    });

    this.logger.log(`Workflow rejected: ${workflow.workflowNumber}`);

    return this.formatWorkflowResponse(workflow);
  }

  async escalateWorkflow(
    companyId: string,
    workflowId: string,
    escalatedBy: string,
    escalationDto: EscalationDto,
  ): Promise<ApprovalWorkflowResponseDto> {
    this.logger.log(`Escalating workflow ${workflowId} by ${escalatedBy}`);

    const workflow = await this.getWorkflowById(companyId, workflowId);

    if (!workflow.canBeEscalated) {
      throw new BadRequestException('Workflow cannot be escalated further');
    }

    // Escalate workflow
    workflow.escalate(escalatedBy, escalationDto.reason, escalationDto.notes);

    // Set specific escalation target if provided
    if (escalationDto.escalateTo) {
      workflow.assignedTo = escalationDto.escalateTo;
      workflow.assignedAt = new Date();
    }

    await this.workflowRepository.save(workflow);

    // Auto-assign to appropriate queue if not specifically assigned
    if (!escalationDto.escalateTo) {
      await this.autoAssignWorkflow(workflow);
    }

    // Clear cache
    await this.cacheManager.del(`workflow:${workflowId}`);

    // Emit escalation event
    this.eventEmitter.emit('approval.workflow_escalated', {
      workflowId,
      escalatedBy,
      reason: escalationDto.reason,
      escalationLevel: workflow.escalationLevel,
      newStage: workflow.currentStage,
    });

    this.logger.log(`Workflow escalated to level ${workflow.escalationLevel}: ${workflow.workflowNumber}`);

    return this.formatWorkflowResponse(workflow);
  }

  // ===== BULK OPERATIONS =====

  async bulkApproveWorkflows(
    companyId: string,
    approverId: string,
    bulkDto: BulkApprovalDto,
  ): Promise<BulkActionResultDto> {
    this.logger.log(`Bulk approving ${Object.values(bulkDto.workflowIds).length} workflows by ${approverId}`);

    const results: Array<{
      workflowId: string;
      workflowNumber: string;
      success: boolean;
      message?: string;
      error?: string;
    }> = [];

    let successCount = 0;
    let failedCount = 0;

    for (const workflowId of bulkDto.workflowIds) {
      try {
        const workflow = await this.getWorkflowById(companyId, workflowId);
        
        // Validate and approve
        if (!bulkDto.overrideChecks) {
          await this.validateApprovalAuthority(approverId, workflow.currentStage);
        }

        workflow.approve(approverId, bulkDto.notes);
        await this.workflowRepository.save(workflow);
        await this.updateTransactionStatus(workflow.transactionId, TransactionStatus.APPROVED);

        results.push({
          workflowId,
          workflowNumber: workflow.workflowNumber,
          success: true,
          message: 'Approved successfully',
        });

        successCount++;

      } catch (error) {
        results.push({
          workflowId,
          workflowNumber: 'Unknown',
          success: false,
          error: error instanceof Error ? getErrorMessage(error) : 'Unknown error',
        });

        failedCount++;
      }
    }

    // Emit bulk approval event
    this.eventEmitter.emit('approval.bulk_approved', {
      approverId,
      totalProcessed: Object.values(bulkDto.workflowIds).length,
      successCount,
      failedCount,
    });

    return {
      totalProcessed: Object.values(bulkDto.workflowIds).length,
      successCount,
      failedCount,
      results,
      summary: {
        action: 'BULK_APPROVAL',
        performedBy: approverId,
        performedAt: new Date().toISOString(),
        successRate: (successCount / Object.values(bulkDto.workflowIds).length) * 100,
      },
    };
  }

  async bulkRejectWorkflows(
    companyId: string,
    rejecterId: string,
    bulkDto: BulkRejectionDto,
  ): Promise<BulkActionResultDto> {
    this.logger.log(`Bulk rejecting ${Object.values(bulkDto.workflowIds).length} workflows by ${rejecterId}`);

    const results: Array<{
      workflowId: string;
      workflowNumber: string;
      success: boolean;
      message?: string;
      error?: string;
    }> = [];

    let successCount = 0;
    let failedCount = 0;

    for (const workflowId of bulkDto.workflowIds) {
      try {
        const workflow = await this.getWorkflowById(companyId, workflowId);
        
        // Validate and reject
        await this.validateApprovalAuthority(rejecterId, workflow.currentStage);

        workflow.reject(rejecterId, bulkDto.reason, 'bulk_rejection', bulkDto.allowResubmission);
        await this.workflowRepository.save(workflow);
        await this.updateTransactionStatus(workflow.transactionId, TransactionStatus.REJECTED);

        results.push({
          workflowId,
          workflowNumber: workflow.workflowNumber,
          success: true,
          message: 'Rejected successfully',
        });

        successCount++;

      } catch (error) {
        results.push({
          workflowId,
          workflowNumber: 'Unknown',
          success: false,
          error: error instanceof Error ? getErrorMessage(error) : 'Unknown error',
        });

        failedCount++;
      }
    }

    // Emit bulk rejection event
    this.eventEmitter.emit('approval.bulk_rejected', {
      rejecterId,
      totalProcessed: Object.values(bulkDto.workflowIds).length,
      successCount,
      failedCount,
    });

    return {
      totalProcessed: Object.values(bulkDto.workflowIds).length,
      successCount,
      failedCount,
      results,
      summary: {
        action: 'BULK_REJECTION',
        performedBy: rejecterId,
        performedAt: new Date().toISOString(),
        successRate: (successCount / Object.values(bulkDto.workflowIds).length) * 100,
      },
    };
  }

  // ===== WORKFLOW QUERIES AND ANALYTICS =====

  async getWorkflows(
    companyId: string,
    query: ApprovalWorkflowQueryDto,
  ): Promise<ApprovalWorkflowListResponseDto> {
    const queryBuilder = this.workflowRepository
      .createQueryBuilder('workflow')
      .leftJoinAndSelect('workflow.transaction', 'transaction')
      .leftJoinAndSelect('transactionEntity.customer', UserRole.CUSTOMER)
      .leftJoinAndSelect('transaction.account', 'account')
      .where('workflow.companyId = :companyId', { companyId });

    // Apply filters
    if (query.status) {
      queryBuilder.andWhere('workflow.status = :status', { status: query.status });
    }

    if (query.stage) {
      queryBuilder.andWhere('workflow.currentStage = :stage', { stage: query.stage });
    }

    if (query.priority) {
      queryBuilder.andWhere('workflow.priority = :priority', { priority: query.priority });
    }

    if (query.assignedTo) {
      queryBuilder.andWhere('workflow.assignedTo = :assignedTo', { assignedTo: query.assignedTo });
    }

    if (query.queueName) {
      queryBuilder.andWhere('workflow.queueName = :queueName', { queueName: query.queueName });
    }

    if (query.escalatedOnly) {
      queryBuilder.andWhere('workflow.escalated = true');
    }

    if (query.overdueOnly) {
      queryBuilder.andWhere('workflow.expiresAt < :now', { now: new Date() });
    }

    if (query.highPriorityOnly) {
      queryBuilder.andWhere('workflow.priority IN (:...priorities)', { 
        priorities: [ApprovalPriority.HIGH, ApprovalPriority.URGENT, ApprovalPriority.CRITICAL] 
      });
    }

    if (query.minAmount || query.maxAmount) {
      if (query.minAmount) {
        queryBuilder.andWhere('transaction.amount >= :minAmount', { minAmount: query.minAmount });
      }
      if (query.maxAmount) {
        queryBuilder.andWhere('transaction.amount <= :maxAmount', { maxAmount: query.maxAmount });
      }
    }

    if (query.dateFrom) {
      queryBuilder.andWhere('workflow.createdAt >= :dateFrom', { dateFrom: query.dateFrom });
    }

    if (query.dateTo) {
      queryBuilder.andWhere('workflow.createdAt <= :dateTo', { dateTo: query.dateTo });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(workflow.workflowNumber ILIKE :search OR transaction.transactionNumber ILIKE :search OR workflow.approvalNotes ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    // Apply sorting
    queryBuilder.orderBy(`workflow.${query.sortBy}`, query.sortOrder);

    // Apply pagination
    const offset = (query.page - 1) * query.limit;
    queryBuilder.skip(offset).take(query.limit);

    const [workflows, total] = await queryBuilder.getManyAndCount();

    return {
      workflows: workflows.map(w => this.formatWorkflowResponse(w)),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async getDashboardStats(companyId: string): Promise<ApprovalDashboardStatsDto> {
    // Get overall statistics
    const overall = await this.getOverallStats(companyId);
    
    // Get queue statistics
    const queueStats = await this.getQueueStats(companyId);
    
    // Get top approvers
    const topApprovers = await this.getTopApprovers(companyId);
    
    // Get escalation statistics
    const escalations = await this.getEscalationStats(companyId);
    
    // Get performance trends
    const trends = await this.getPerformanceTrends(companyId);

    return {
      overall,
      queueStats,
      topApprovers,
      escalations,
      trends,
    };
  }

  // ===== WORKFLOW UTILITIES =====

  async addComment(
    companyId: string,
    workflowId: string,
    commenterId: string,
    commentDto: AddCommentDto,
  ): Promise<string> {
    const workflow = await this.getWorkflowById(companyId, workflowId);
    
    const commentId = workflow.addComment(commenterId, commentDto.comment, commentDto.internal);
    await this.workflowRepository.save(workflow);

    // Clear cache
    await this.cacheManager.del(`workflow:${workflowId}`);

    return commentId;
  }

  async updatePriority(
    companyId: string,
    workflowId: string,
    updatedBy: string,
    priorityDto: UpdatePriorityDto,
  ): Promise<ApprovalWorkflowResponseDto> {
    const workflow = await this.getWorkflowById(companyId, workflowId);
    
    workflow.updatePriority(priorityDto.priority, updatedBy, priorityDto.reason);
    await this.workflowRepository.save(workflow);

    // Clear cache
    await this.cacheManager.del(`workflow:${workflowId}`);

    return this.formatWorkflowResponse(workflow);
  }

  async extendSLA(
    companyId: string,
    workflowId: string,
    extendedBy: string,
    slaDto: ExtendSLADto,
  ): Promise<ApprovalWorkflowResponseDto> {
    const workflow = await this.getWorkflowById(companyId, workflowId);
    
    workflow.extendSLA(slaDto.additionalMinutes, extendedBy, slaDto.reason);
    await this.workflowRepository.save(workflow);

    // Clear cache
    await this.cacheManager.del(`workflow:${workflowId}`);

    return this.formatWorkflowResponse(workflow);
  }

  // ===== PRIVATE HELPER METHODS =====

  private async getWorkflowById(companyId: string, workflowId: string): Promise<ApprovalWorkflow> {
    // Try cache first
    const cached = await this.cacheManager.get<ApprovalWorkflow>(`workflow:${workflowId}`);
    if (cached && cached.companyId === companyId) {
      return cached;
    }

    const workflow = await this.workflowRepository.findOne({
      where: { id: workflowId, companyId },
      relations: ['transaction', 'transactionEntity.customer', 'transaction.account'],
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    // Cache for future requests
    await this.cacheManager.set(`workflow:${workflowId}`, workflow, 300000);

    return workflow;
  }

  private determinePriority(transaction: Transaction): ApprovalPriority {
    // High amount = high priority
    if (transaction.amount >= 5000) return ApprovalPriority.HIGH;
    if (transaction.amount >= 2000) return ApprovalPriority.NORMAL;
    
    // High risk = high priority
    if (transaction.riskScore >= 80) return ApprovalPriority.HIGH;
    if (transaction.riskScore >= 60) return ApprovalPriority.NORMAL;
    
    return ApprovalPriority.LOW;
  }

  private calculateSLA(transaction: Transaction, priority: ApprovalPriority): number {
    let baseMinutes = 60; // Default 1 hour
    
    // Adjust based on priority
    switch (priority) {
      case ApprovalPriority.CRITICAL: baseMinutes = 15; break;
      case ApprovalPriority.URGENT: baseMinutes = 30; break;
      case ApprovalPriority.HIGH: baseMinutes = 45; break;
      case ApprovalPriority.NORMAL: baseMinutes = 60; break;
      case ApprovalPriority.LOW: baseMinutes = 120; break;
    }
    
    // Adjust based on amount
    if (transaction.amount >= 10000) baseMinutes = Math.min(baseMinutes, 30);
    if (transaction.amount >= 5000) baseMinutes = Math.min(baseMinutes, 45);
    
    return baseMinutes;
  }

  private determineInitialStage(transaction: Transaction): ApprovalStage {
    if (transaction.requiresAdminApproval) {
      return ApprovalStage.ADMIN_REVIEW;
    }
    if (transaction.requiresManagerApproval) {
      return ApprovalStage.MANAGER_REVIEW;
    }
    return ApprovalStage.INITIAL_REVIEW;
  }

  private addInitialChecklistItems(workflow: ApprovalWorkflow, transaction: Transaction): void {
    // Standard checklist items
    workflow.addChecklistItem('Verify customer identity', true);
    workflow.addChecklistItem('Check account balance sufficiency', true);
    workflow.addChecklistItem('Review transaction purpose', true);
    
    // Risk-based items
    if (transaction.riskScore >= 50) {
      workflow.addChecklistItem('Conduct enhanced due diligence', true);
      workflow.addChecklistItem('Verify source of funds', true);
    }
    
    // Amount-based items
    if (transaction.amount >= 2000) {
      workflow.addChecklistItem('Manager approval obtained', true);
      workflow.addChecklistItem('Large amount justification documented', true);
    }
    
    if (transaction.amount >= 5000) {
      workflow.addChecklistItem('AML screening completed', true);
      workflow.addChecklistItem('Senior management notification sent', false);
    }
  }

  private async autoAssignWorkflow(workflow: ApprovalWorkflow): Promise<void> {
    const queueConfig = this.queueConfigurations.find(q => q.name === workflow.queueName);
    
    if (queueConfig?.autoAssign) {
      // Find available approver for the queue
      // This would integrate with user management service
      // For now, we'll just set the queue name
      workflow.queueName = queueConfig.name;
      await this.workflowRepository.save(workflow);
    }
  }

  private async validateApprovalAuthority(userId: string, stage: ApprovalStage): Promise<void> {
    // This would integrate with the identity service to check user roles
    // For now, we'll assume validation passes
  }

  private async validateCompletedChecklist(workflow: ApprovalWorkflow): Promise<void> {
    if (workflow.checklistItems && Object.values(workflow.checklistItems).length > 0) {
      const requiredItems = workflow.checklistItems.filter(item => item.required);
      const completedRequired = requiredItems.filter(item => item.completed);
      
      if (Object.values(completedRequired).length < Object.values(requiredItems).length) {
        throw new BadRequestException('Required checklist items must be completed before approval');
      }
    }
  }

  private async updateTransactionStatus(transactionId: string, status: TransactionStatus): Promise<void> {
    await this.transactionRepository.update(transactionId, { status });
  }

  private async getOverallStats(companyId: string): Promise<any> {
    // Implementation for overall statistics
    return {
      totalPending: 0,
      totalInReview: 0,
      totalCompleted: 0,
      totalOverdue: 0,
      slaAdherence: 0,
      averageProcessingTime: 0,
      approvalRate: 0,
    };
  }

  private async getQueueStats(companyId: string): Promise<ApprovalQueueStatsDto[]> {
    // Implementation for queue statistics
    return [];
  }

  private async getTopApprovers(companyId: string): Promise<any[]> {
    // Implementation for top approvers
    return [];
  }

  private async getEscalationStats(companyId: string): Promise<any> {
    // Implementation for escalation statistics
    return {
      totalEscalated: 0,
      autoEscalated: 0,
      manualEscalated: 0,
      escalationsByReason: {},
    };
  }

  private async getPerformanceTrends(companyId: string): Promise<any> {
    // Implementation for performance trends
    return {
      dailyVolume: [],
      processingTimes: [],
      slaPerformance: [],
    };
  }

  private formatWorkflowResponse(workflow: ApprovalWorkflow): ApprovalWorkflowResponseDto {
    return {
      id: workflow.id,
      workflowNumber: workflow.workflowNumber,
      companyId: workflow.companyId,
      transactionId: workflow.transactionId,
      status: workflow.status,
      currentStage: workflow.currentStage,
      priority: workflow.priority,
      assignment: {
        assignedTo: workflow.assignedTo,
        assignedAt: workflow.assignedAt?.toISOString(),
        assignedBy: workflow.assignedBy,
        queueName: workflow.queueName,
      },
      timing: {
        slaDurationMinutes: workflow.slaDurationMinutes,
        expiresAt: workflow.expiresAt.toISOString(),
        startedAt: workflow.startedAt?.toISOString(),
        completedAt: workflow.completedAt?.toISOString(),
        responseTimeMinutes: workflow.responseTimeMinutes,
        isWithinSLA: workflow.isWithinSLA,
        isOverdue: workflow.isOverdue,
        urgencyLevel: workflow.urgencyLevel,
      },
      escalation: {
        escalated: workflow.escalated,
        escalationLevel: workflow.escalationLevel,
        escalationReason: workflow.escalationReason,
        escalatedAt: workflow.escalatedAt?.toISOString(),
        escalatedBy: workflow.escalatedBy,
        escalationNotes: workflow.escalationNotes,
        autoEscalated: workflow.autoEscalated,
      },
      decision: {
        approvedBy: workflow.approvedBy,
        approvedAt: workflow.approvedAt?.toISOString(),
        approvalNotes: workflow.approvalNotes,
        approvalConditions: workflow.approvalConditions,
        rejectedBy: workflow.rejectedBy,
        rejectedAt: workflow.rejectedAt?.toISOString(),
        rejectionReason: workflow.rejectionReason,
        rejectionCategory: workflow.rejectionCategory,
        allowResubmission: workflow.allowResubmission,
      },
      checklist: {
        items: workflow.checklistItems,
        completionPercentage: workflow.checklistCompletionPercentage,
        riskReviewCompleted: workflow.riskReviewCompleted,
        complianceReviewCompleted: workflow.complianceReviewCompleted,
        documentationReviewCompleted: workflow.documentationReviewCompleted,
      },
      analytics: {
        touchesCount: workflow.touchesCount,
        reviewersCount: workflow.reviewersCount,
        stageDurations: workflow.stageDurations,
        efficiencyScore: workflow.efficiencyScore,
        stageProgress: workflow.stageProgress,
      },
      communication: {
        comments: workflow.comments,
        internalNotes: workflow.internalNotes,
      },
      compliance: {
        flags: workflow.complianceFlags,
        regulatoryRequirements: workflow.regulatoryRequirements,
      },
      transaction: {
        transactionNumber: workflow.transaction.transactionNumber,
        type: workflow.transaction.type,
        amount: workflow.transaction.amount,
        currency: workflow.transaction.currency,
        customerId: workflow.transaction.customerId,
        customerName: workflow.transaction?.customer?.fullName || 'Unknown',
        agentId: workflow.transaction.agentId,
        agentName: workflow.transaction.agentName,
        riskScore: workflow.transaction.riskScore,
      },
      metadata: workflow.metadata,
      tags: workflow.tags,
      createdAt: workflow.createdAt.toISOString(),
      updatedAt: workflow.updatedAt.toISOString(),
    };
  }
}