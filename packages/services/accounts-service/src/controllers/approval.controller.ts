import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  Logger,
  ParseUUIDPipe,
  HttpCode,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';

import { ApprovalService } from '../services/approval.service';
import { JwtAuthGuard } from '../../../identity-service/src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity-service/src/auth/guards/roles.guard';
import { TenantGuard } from '../../../identity-service/src/auth/guards/tenant.guard';
import { Roles } from '../../../identity-service/src/auth/decorators/roles.decorator';
import { CurrentUser } from '../../../identity-service/src/auth/decorators/current-user.decorator';

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
  BulkActionResultDto,
} from '../dto/approval.dto';

interface JwtPayload {
  sub: string;
  email: string;
  companyId: string;
  roles: string[];
}

@ApiTags('Approval Workflows')
@ApiBearerAuth()
@Controller('approval')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ApprovalController {
  private readonly logger = new Logger(ApprovalController.name);

  constructor(private readonly approvalService: ApprovalService) {}

  // ===== WORKFLOW MANAGEMENT ENDPOINTS =====

  @Post('/workflows/:transactionId')
  @ApiOperation({ 
    summary: 'Create approval workflow',
    description: 'Create a new approval workflow for a transaction requiring approval'
  })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID requiring approval' })
  @ApiResponse({ status: 201, description: 'Workflow created successfully', type: ApprovalWorkflowResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @Roles('agent', 'clerk', 'manager', 'admin')
  async createApprovalWorkflow(
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApprovalWorkflowResponseDto> {
    this.logger.log(`Creating approval workflow for transaction ${transactionId} by user ${user.sub}`);

    return await this.approvalService.createApprovalWorkflow(
      user.companyId,
      transactionId,
      user.sub,
    );
  }

  @Get('/workflows/:workflowId')
  @ApiOperation({
    summary: 'Get approval workflow',
    description: 'Retrieve detailed information about a specific approval workflow'
  })
  @ApiParam({ name: 'workflowId', description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'Workflow details retrieved', type: ApprovalWorkflowResponseDto })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  @Roles('clerk', 'manager', 'admin')
  async getWorkflow(
    @Param('workflowId', ParseUUIDPipe) workflowId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApprovalWorkflowResponseDto> {
    const workflow = await this.approvalService['getWorkflowById'](user.companyId, workflowId);
    return this.approvalService['formatWorkflowResponse'](workflow);
  }

  @Get('/workflows')
  @ApiOperation({
    summary: 'List approval workflows',
    description: 'Retrieve paginated list of approval workflows with filtering and sorting options'
  })
  @ApiResponse({ status: 200, description: 'Workflows retrieved successfully', type: ApprovalWorkflowListResponseDto })
  @Roles('clerk', 'manager', 'admin')
  async getWorkflows(
    @Query() query: ApprovalWorkflowQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApprovalWorkflowListResponseDto> {
    this.logger.log(`Fetching workflows for company ${user.companyId} with filters: ${JSON.stringify(query)}`);

    // If user is not admin/manager, only show workflows assigned to them or their role
    if (!user.roles.includes('admin') && !user.roles.includes('manager')) {
      query.assignedTo = user.sub;
    }

    return await this.approvalService.getWorkflows(user.companyId, query);
  }

  // ===== WORKFLOW ASSIGNMENT ENDPOINTS =====

  @Post('/workflows/:workflowId/assign')
  @ApiOperation({
    summary: 'Assign workflow',
    description: 'Assign an approval workflow to a specific user or queue'
  })
  @ApiParam({ name: 'workflowId', description: 'Workflow ID' })
  @ApiBody({ type: AssignWorkflowDto })
  @ApiResponse({ status: 200, description: 'Workflow assigned successfully', type: ApprovalWorkflowResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid assignment request' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @Roles('manager', 'admin')
  async assignWorkflow(
    @Param('workflowId', ParseUUIDPipe) workflowId: string,
    @Body() assignDto: AssignWorkflowDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApprovalWorkflowResponseDto> {
    this.logger.log(`Assigning workflow ${workflowId} to ${assignDto.assignedTo} by ${user.sub}`);

    return await this.approvalService.assignWorkflow(
      user.companyId,
      workflowId,
      user.sub,
      assignDto,
    );
  }

  @Post('/workflows/:workflowId/reassign')
  @ApiOperation({
    summary: 'Reassign workflow',
    description: 'Reassign an approval workflow to a different user'
  })
  @ApiParam({ name: 'workflowId', description: 'Workflow ID' })
  @ApiBody({ type: ReassignWorkflowDto })
  @ApiResponse({ status: 200, description: 'Workflow reassigned successfully', type: ApprovalWorkflowResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid reassignment request' })
  @Roles('manager', 'admin')
  async reassignWorkflow(
    @Param('workflowId', ParseUUIDPipe) workflowId: string,
    @Body() reassignDto: ReassignWorkflowDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApprovalWorkflowResponseDto> {
    this.logger.log(`Reassigning workflow ${workflowId} to ${reassignDto.newAssignee} by ${user.sub}`);

    return await this.approvalService.reassignWorkflow(
      user.companyId,
      workflowId,
      user.sub,
      reassignDto,
    );
  }

  @Post('/workflows/:workflowId/start-review')
  @ApiOperation({
    summary: 'Start workflow review',
    description: 'Start reviewing an assigned approval workflow'
  })
  @ApiParam({ name: 'workflowId', description: 'Workflow ID' })
  @ApiBody({ type: StartReviewDto })
  @ApiResponse({ status: 200, description: 'Review started successfully', type: ApprovalWorkflowResponseDto })
  @ApiResponse({ status: 400, description: 'Review cannot be started' })
  @Roles('clerk', 'manager', 'admin')
  async startReview(
    @Param('workflowId', ParseUUIDPipe) workflowId: string,
    @Body() startDto: StartReviewDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApprovalWorkflowResponseDto> {
    this.logger.log(`Starting review for workflow ${workflowId} by ${user.sub}`);

    return await this.approvalService.startReview(
      user.companyId,
      workflowId,
      user.sub,
      startDto,
    );
  }

  // ===== APPROVAL DECISION ENDPOINTS =====

  @Post('/workflows/:workflowId/approve')
  @ApiOperation({
    summary: 'Approve workflow',
    description: 'Approve an approval workflow after review'
  })
  @ApiParam({ name: 'workflowId', description: 'Workflow ID' })
  @ApiBody({ type: ApprovalDecisionDto })
  @ApiResponse({ status: 200, description: 'Workflow approved successfully', type: ApprovalWorkflowResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot approve workflow' })
  @ApiResponse({ status: 403, description: 'Insufficient approval authority' })
  @Roles('clerk', 'manager', 'admin')
  async approveWorkflow(
    @Param('workflowId', ParseUUIDPipe) workflowId: string,
    @Body() approvalDto: ApprovalDecisionDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<ApprovalWorkflowResponseDto> {
    this.logger.log(`Approving workflow ${workflowId} by ${user.sub}`);

    // Add audit information
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    // In a real implementation, you would add this to the audit trail

    return await this.approvalService.approveWorkflow(
      user.companyId,
      workflowId,
      user.sub,
      approvalDto,
    );
  }

  @Post('/workflows/:workflowId/reject')
  @ApiOperation({
    summary: 'Reject workflow',
    description: 'Reject an approval workflow with reason'
  })
  @ApiParam({ name: 'workflowId', description: 'Workflow ID' })
  @ApiBody({ type: RejectionDecisionDto })
  @ApiResponse({ status: 200, description: 'Workflow rejected successfully', type: ApprovalWorkflowResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot reject workflow' })
  @ApiResponse({ status: 403, description: 'Insufficient rejection authority' })
  @Roles('clerk', 'manager', 'admin')
  async rejectWorkflow(
    @Param('workflowId', ParseUUIDPipe) workflowId: string,
    @Body() rejectionDto: RejectionDecisionDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<ApprovalWorkflowResponseDto> {
    this.logger.log(`Rejecting workflow ${workflowId} by ${user.sub}`);

    // Add audit information
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    // In a real implementation, you would add this to the audit trail

    return await this.approvalService.rejectWorkflow(
      user.companyId,
      workflowId,
      user.sub,
      rejectionDto,
    );
  }

  @Post('/workflows/:workflowId/escalate')
  @ApiOperation({
    summary: 'Escalate workflow',
    description: 'Escalate an approval workflow to higher authority'
  })
  @ApiParam({ name: 'workflowId', description: 'Workflow ID' })
  @ApiBody({ type: EscalationDto })
  @ApiResponse({ status: 200, description: 'Workflow escalated successfully', type: ApprovalWorkflowResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot escalate workflow' })
  @Roles('clerk', 'manager', 'admin')
  async escalateWorkflow(
    @Param('workflowId', ParseUUIDPipe) workflowId: string,
    @Body() escalationDto: EscalationDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApprovalWorkflowResponseDto> {
    this.logger.log(`Escalating workflow ${workflowId} by ${user.sub}`);

    return await this.approvalService.escalateWorkflow(
      user.companyId,
      workflowId,
      user.sub,
      escalationDto,
    );
  }

  // ===== BULK OPERATIONS ENDPOINTS =====

  @Post('/workflows/bulk-approve')
  @ApiOperation({
    summary: 'Bulk approve workflows',
    description: 'Approve multiple workflows in a single operation'
  })
  @ApiBody({ type: BulkApprovalDto })
  @ApiResponse({ status: 200, description: 'Bulk approval completed', type: BulkActionResultDto })
  @ApiResponse({ status: 400, description: 'Invalid bulk approval request' })
  @Roles('manager', 'admin')
  async bulkApproveWorkflows(
    @Body() bulkDto: BulkApprovalDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BulkActionResultDto> {
    this.logger.log(`Bulk approving ${bulkDto.workflowIds.length} workflows by ${user.sub}`);

    return await this.approvalService.bulkApproveWorkflows(
      user.companyId,
      user.sub,
      bulkDto,
    );
  }

  @Post('/workflows/bulk-reject')
  @ApiOperation({
    summary: 'Bulk reject workflows',
    description: 'Reject multiple workflows in a single operation'
  })
  @ApiBody({ type: BulkRejectionDto })
  @ApiResponse({ status: 200, description: 'Bulk rejection completed', type: BulkActionResultDto })
  @ApiResponse({ status: 400, description: 'Invalid bulk rejection request' })
  @Roles('manager', 'admin')
  async bulkRejectWorkflows(
    @Body() bulkDto: BulkRejectionDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BulkActionResultDto> {
    this.logger.log(`Bulk rejecting ${bulkDto.workflowIds.length} workflows by ${user.sub}`);

    return await this.approvalService.bulkRejectWorkflows(
      user.companyId,
      user.sub,
      bulkDto,
    );
  }

  // ===== WORKFLOW UTILITIES ENDPOINTS =====

  @Post('/workflows/:workflowId/comments')
  @ApiOperation({
    summary: 'Add comment to workflow',
    description: 'Add a comment or note to an approval workflow'
  })
  @ApiParam({ name: 'workflowId', description: 'Workflow ID' })
  @ApiBody({ type: AddCommentDto })
  @ApiResponse({ status: 201, description: 'Comment added successfully' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  @Roles('clerk', 'manager', 'admin')
  async addComment(
    @Param('workflowId', ParseUUIDPipe) workflowId: string,
    @Body() commentDto: AddCommentDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ commentId: string }> {
    this.logger.log(`Adding comment to workflow ${workflowId} by ${user.sub}`);

    const commentId = await this.approvalService.addComment(
      user.companyId,
      workflowId,
      user.sub,
      commentDto,
    );

    return { commentId };
  }

  @Put('/workflows/:workflowId/priority')
  @ApiOperation({
    summary: 'Update workflow priority',
    description: 'Update the priority level of an approval workflow'
  })
  @ApiParam({ name: 'workflowId', description: 'Workflow ID' })
  @ApiBody({ type: UpdatePriorityDto })
  @ApiResponse({ status: 200, description: 'Priority updated successfully', type: ApprovalWorkflowResponseDto })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  @Roles('manager', 'admin')
  async updatePriority(
    @Param('workflowId', ParseUUIDPipe) workflowId: string,
    @Body() priorityDto: UpdatePriorityDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApprovalWorkflowResponseDto> {
    this.logger.log(`Updating priority for workflow ${workflowId} by ${user.sub}`);

    return await this.approvalService.updatePriority(
      user.companyId,
      workflowId,
      user.sub,
      priorityDto,
    );
  }

  @Put('/workflows/:workflowId/sla')
  @ApiOperation({
    summary: 'Extend workflow SLA',
    description: 'Extend the SLA deadline for an approval workflow'
  })
  @ApiParam({ name: 'workflowId', description: 'Workflow ID' })
  @ApiBody({ type: ExtendSLADto })
  @ApiResponse({ status: 200, description: 'SLA extended successfully', type: ApprovalWorkflowResponseDto })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  @Roles('manager', 'admin')
  async extendSLA(
    @Param('workflowId', ParseUUIDPipe) workflowId: string,
    @Body() slaDto: ExtendSLADto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApprovalWorkflowResponseDto> {
    this.logger.log(`Extending SLA for workflow ${workflowId} by ${user.sub}`);

    return await this.approvalService.extendSLA(
      user.companyId,
      workflowId,
      user.sub,
      slaDto,
    );
  }

  // ===== DASHBOARD AND ANALYTICS ENDPOINTS =====

  @Get('/dashboard/stats')
  @ApiOperation({
    summary: 'Get approval dashboard statistics',
    description: 'Retrieve comprehensive approval workflow statistics and analytics'
  })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved', type: ApprovalDashboardStatsDto })
  @Roles('manager', 'admin')
  async getDashboardStats(
    @CurrentUser() user: JwtPayload,
  ): Promise<ApprovalDashboardStatsDto> {
    this.logger.log(`Fetching dashboard stats for company ${user.companyId}`);

    return await this.approvalService.getDashboardStats(user.companyId);
  }

  @Get('/queues/my-queue')
  @ApiOperation({
    summary: 'Get my approval queue',
    description: 'Retrieve workflows assigned to current user or their role queue'
  })
  @ApiResponse({ status: 200, description: 'Personal queue retrieved', type: ApprovalWorkflowListResponseDto })
  @Roles('clerk', 'manager', 'admin')
  async getMyQueue(
    @Query() query: ApprovalWorkflowQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApprovalWorkflowListResponseDto> {
    this.logger.log(`Fetching personal queue for user ${user.sub}`);

    // Force filter to current user's assignments
    query.assignedTo = user.sub;
    query.sortBy = 'urgencyLevel';
    query.sortOrder = 'DESC';

    return await this.approvalService.getWorkflows(user.companyId, query);
  }

  @Get('/workflows/overdue')
  @ApiOperation({
    summary: 'Get overdue workflows',
    description: 'Retrieve all workflows that have exceeded their SLA deadline'
  })
  @ApiResponse({ status: 200, description: 'Overdue workflows retrieved', type: ApprovalWorkflowListResponseDto })
  @Roles('manager', 'admin')
  async getOverdueWorkflows(
    @Query() query: ApprovalWorkflowQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApprovalWorkflowListResponseDto> {
    this.logger.log(`Fetching overdue workflows for company ${user.companyId}`);

    // Force overdue filter
    query.overdueOnly = true;
    query.sortBy = 'expiresAt';
    query.sortOrder = 'ASC';

    return await this.approvalService.getWorkflows(user.companyId, query);
  }

  @Get('/workflows/escalated')
  @ApiOperation({
    summary: 'Get escalated workflows',
    description: 'Retrieve all workflows that have been escalated'
  })
  @ApiResponse({ status: 200, description: 'Escalated workflows retrieved', type: ApprovalWorkflowListResponseDto })
  @Roles('manager', 'admin')
  async getEscalatedWorkflows(
    @Query() query: ApprovalWorkflowQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApprovalWorkflowListResponseDto> {
    this.logger.log(`Fetching escalated workflows for company ${user.companyId}`);

    // Force escalated filter
    query.escalatedOnly = true;
    query.sortBy = 'escalatedAt';
    query.sortOrder = 'DESC';

    return await this.approvalService.getWorkflows(user.companyId, query);
  }

  @Get('/workflows/high-priority')
  @ApiOperation({
    summary: 'Get high priority workflows',
    description: 'Retrieve all high priority workflows requiring immediate attention'
  })
  @ApiResponse({ status: 200, description: 'High priority workflows retrieved', type: ApprovalWorkflowListResponseDto })
  @Roles('clerk', 'manager', 'admin')
  async getHighPriorityWorkflows(
    @Query() query: ApprovalWorkflowQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApprovalWorkflowListResponseDto> {
    this.logger.log(`Fetching high priority workflows for company ${user.companyId}`);

    // Force high priority filter
    query.highPriorityOnly = true;
    query.sortBy = 'urgencyLevel';
    query.sortOrder = 'DESC';

    // If user is not admin/manager, only show workflows assigned to them
    if (!user.roles.includes('admin') && !user.roles.includes('manager')) {
      query.assignedTo = user.sub;
    }

    return await this.approvalService.getWorkflows(user.companyId, query);
  }

  // ===== ADMINISTRATIVE ENDPOINTS =====

  @Delete('/workflows/:workflowId')
  @ApiOperation({
    summary: 'Cancel workflow',
    description: 'Cancel an approval workflow (admin only)'
  })
  @ApiParam({ name: 'workflowId', description: 'Workflow ID' })
  @ApiResponse({ status: 204, description: 'Workflow cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin')
  async cancelWorkflow(
    @Param('workflowId', ParseUUIDPipe) workflowId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    this.logger.log(`Cancelling workflow ${workflowId} by admin ${user.sub}`);

    const workflow = await this.approvalService['getWorkflowById'](user.companyId, workflowId);
    workflow.cancel(user.sub, 'Administrative cancellation');
    await this.approvalService['workflowRepository'].save(workflow);
  }

  @Get('/workflows/:workflowId/audit')
  @ApiOperation({
    summary: 'Get workflow audit trail',
    description: 'Retrieve complete audit trail for a workflow (admin only)'
  })
  @ApiParam({ name: 'workflowId', description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'Audit trail retrieved' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  @Roles('admin')
  async getWorkflowAuditTrail(
    @Param('workflowId', ParseUUIDPipe) workflowId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ auditTrail: any[] }> {
    this.logger.log(`Fetching audit trail for workflow ${workflowId} by admin ${user.sub}`);

    const workflow = await this.approvalService['getWorkflowById'](user.companyId, workflowId);
    
    return {
      auditTrail: workflow.auditTrail,
    };
  }

  // ===== HEALTH CHECK ENDPOINT =====

  @Get('/health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Check approval service health status'
  })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}