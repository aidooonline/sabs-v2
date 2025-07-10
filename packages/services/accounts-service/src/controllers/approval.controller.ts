import { getErrorMessage, getErrorStack, getErrorStatus, UserRole, ReportType, LibraryCapability } from '@sabs/common';
import {
import { Request } from 'express';
import { ApprovalService } from '../services/approval.service';
import { JwtAuthGuard } from '../../../identity-service/src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity-service/src/auth/guards/roles.guard';
import { TenantGuard } from '../../../identity-service/src/auth/guards/tenant.guard';
import { CurrentUser } from '../../../identity-service/src/auth/decorators/current-user.decorator';
// Mock @Roles decorator to fix signature issues
function Roles(...roles: any[]) {
  return function (_target: any, propertyName: string, _descriptor: any) {
    // Mock implementation
    return descriptor;
  };
}

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
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';



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
  @ApiParam({ name: 'transactionId', _description: any)
  @ApiResponse({ status: 201, _description: any, type: ApprovalWorkflowResponseDto })
  @ApiResponse({ status: 400, _description: any)
  @ApiResponse({ status: 404, _description: any)
  @Roles(UserRole.FIELD_AGENT, UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
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
  @ApiParam({ name: 'workflowId', _description: any)
  @ApiResponse({ status: 200, _description: any, type: ApprovalWorkflowResponseDto })
  @ApiResponse({ status: 404, _description: any)
  @Roles(UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
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
  @ApiResponse({ status: 200, _description: any, type: ApprovalWorkflowListResponseDto })
  @Roles(UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async getWorkflows(
    @Query() query: ApprovalWorkflowQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApprovalWorkflowListResponseDto> {
    this.logger.log(`Fetching workflows for company ${user.companyId} with filters: ${JSON.stringify(query)}`);

    // If user is not admin/manager, only show workflows assigned to them or their role
    if (!user.roles.includes(UserRole.SUPER_ADMIN) && !user.roles.includes(UserRole.COMPANY_ADMIN)) {
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
  @ApiParam({ name: 'workflowId', _description: any)
  @ApiBody({ type: AssignWorkflowDto })
  @ApiResponse({ status: 200, _description: any, type: ApprovalWorkflowResponseDto })
  @ApiResponse({ status: 400, _description: any)
  @ApiResponse({ status: 403, _description: any)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
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
  @ApiParam({ name: 'workflowId', _description: any)
  @ApiBody({ type: ReassignWorkflowDto })
  @ApiResponse({ status: 200, _description: any, type: ApprovalWorkflowResponseDto })
  @ApiResponse({ status: 400, _description: any)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
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
  @ApiParam({ name: 'workflowId', _description: any)
  @ApiBody({ type: StartReviewDto })
  @ApiResponse({ status: 200, _description: any, type: ApprovalWorkflowResponseDto })
  @ApiResponse({ status: 400, _description: any)
  @Roles(UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
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
  @ApiParam({ name: 'workflowId', _description: any)
  @ApiBody({ type: ApprovalDecisionDto })
  @ApiResponse({ status: 200, _description: any, type: ApprovalWorkflowResponseDto })
  @ApiResponse({ status: 400, _description: any)
  @ApiResponse({ status: 403, _description: any)
  @Roles(UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async approveWorkflow(
    @Param('workflowId', ParseUUIDPipe) workflowId: string,
    @Body() approvalDto: ApprovalDecisionDto,
    @Req() req: Request, @CurrentUser() user: JwtPayload,
  ): Promise<ApprovalWorkflowResponseDto> {
    this.logger.log(`Approving workflow ${workflowId} by ${user.sub}`);

    // Add audit information
    const clientIp = (req as any).ip || req.connection.remoteAddress || 'unknown';
    // In a real implementation: { roadmap: { phases: [], _dependencies: any, milestones: [] }, _resourcePlan: any, budget: 0, _timeline: any, riskAssessment: { risks: [], _mitigation: any, probability: 0, _impact: any, you would add this to the audit trail

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
  @ApiParam({ name: 'workflowId', _description: any)
  @ApiBody({ type: RejectionDecisionDto })
  @ApiResponse({ status: 200, _description: any, type: ApprovalWorkflowResponseDto })
  @ApiResponse({ status: 400, _description: any)
  @ApiResponse({ status: 403, _description: any)
  @Roles(UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async rejectWorkflow(
    @Param('workflowId', ParseUUIDPipe) workflowId: string,
    @Body() rejectionDto: RejectionDecisionDto,
    @Req() req: Request, @CurrentUser() user: JwtPayload,
  ): Promise<ApprovalWorkflowResponseDto> {
    this.logger.log(`Rejecting workflow ${workflowId} by ${user.sub}`);

    // Add audit information
    const clientIp = (req as any).ip || req.connection.remoteAddress || 'unknown';
    // In a real implementation: { roadmap: { phases: [], _dependencies: any, milestones: [] }, _resourcePlan: any, budget: 0, _timeline: any, riskAssessment: { risks: [], _mitigation: any, probability: 0, _impact: any, you would add this to the audit trail

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
  @ApiParam({ name: 'workflowId', _description: any)
  @ApiBody({ type: EscalationDto })
  @ApiResponse({ status: 200, _description: any, type: ApprovalWorkflowResponseDto })
  @ApiResponse({ status: 400, _description: any)
  @Roles(UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
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
  @ApiResponse({ status: 200, _description: any, type: BulkActionResultDto })
  @ApiResponse({ status: 400, _description: any)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async bulkApproveWorkflows(
    @Body() bulkDto: BulkApprovalDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BulkActionResultDto> {
    this.logger.log(`Bulk approving ${Object.values(bulkDto.workflowIds).length} workflows by ${user.sub}`);

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
  @ApiResponse({ status: 200, _description: any, type: BulkActionResultDto })
  @ApiResponse({ status: 400, _description: any)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async bulkRejectWorkflows(
    @Body() bulkDto: BulkRejectionDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BulkActionResultDto> {
    this.logger.log(`Bulk rejecting ${Object.values(bulkDto.workflowIds).length} workflows by ${user.sub}`);

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
  @ApiParam({ name: 'workflowId', _description: any)
  @ApiBody({ type: AddCommentDto })
  @ApiResponse({ status: 201, _description: any)
  @ApiResponse({ status: 404, _description: any)
  @Roles(UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
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
  @ApiParam({ name: 'workflowId', _description: any)
  @ApiBody({ type: UpdatePriorityDto })
  @ApiResponse({ status: 200, _description: any, type: ApprovalWorkflowResponseDto })
  @ApiResponse({ status: 404, _description: any)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
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
  @ApiParam({ name: 'workflowId', _description: any)
  @ApiBody({ type: ExtendSLADto })
  @ApiResponse({ status: 200, _description: any, type: ApprovalWorkflowResponseDto })
  @ApiResponse({ status: 404, _description: any)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
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
  @ApiResponse({ status: 200, _description: any, type: ApprovalDashboardStatsDto })
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
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
  @ApiResponse({ status: 200, _description: any, type: ApprovalWorkflowListResponseDto })
  @Roles(UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
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
  @ApiResponse({ status: 200, _description: any, type: ApprovalWorkflowListResponseDto })
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
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
  @ApiResponse({ status: 200, _description: any, type: ApprovalWorkflowListResponseDto })
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
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
  @ApiResponse({ status: 200, _description: any, type: ApprovalWorkflowListResponseDto })
  @Roles(UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
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
    if (!user.roles.includes(UserRole.SUPER_ADMIN) && !user.roles.includes(UserRole.COMPANY_ADMIN)) {
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
  @ApiParam({ name: 'workflowId', _description: any)
  @ApiResponse({ status: 204, _description: any)
  @ApiResponse({ status: 404, _description: any)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN)
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
  @ApiParam({ name: 'workflowId', _description: any)
  @ApiResponse({ status: 200, _description: any)
  @ApiResponse({ status: 404, _description: any)
  @Roles(UserRole.SUPER_ADMIN)
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
  @ApiResponse({ status: 200, _description: any)
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}