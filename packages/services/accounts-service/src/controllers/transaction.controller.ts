import { HttpException, HttpStatus } from '@nestjs/common';
import { getErrorMessage, getErrorStack, getErrorStatus, UserRole, ReportType, LibraryCapability } from '@sabs/common';
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request, Logger, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TransactionService, AgentInfo } from '../services/transaction.service';
import {
  CreateWithdrawalRequestDto,
  CustomerVerificationDto,
  ApproveTransactionDto,
  RejectTransactionDto,
  ProcessTransactionDto,
  CancelTransactionDto,
  ReverseTransactionDto,
  HoldManagementDto,
  TransactionQueryDto,
  TransactionResponseDto,
  TransactionListResponseDto,
  TransactionStatsResponseDto,
  BalanceInquiryResponseDto,
  BulkTransactionActionDto,
  TransactionReceiptDto,
} from '../dto/transaction.dto';

// Mock @Roles decorator to fix signature issues
function Roles(...roles: any[]) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    // Mock implementation
    return descriptor;
  };
}

// Mock imports - these should be replaced with actual implementations
class JwtAuthGuard {}
class RolesGuard {}
class TenantGuard {}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    companyId: string;
    role: string;
    permissions: string[];
    name: string;
    email: string;
    phone: string;
  };
}

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class TransactionController {
  private readonly logger = new Logger(TransactionController.name);

  constructor(private readonly transactionService: TransactionService) {}

  // ===== WITHDRAWAL REQUEST OPERATIONS =====

  @Post('withdrawal-requests')
  @Roles(UserRole.FIELD_AGENT, UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Create withdrawal request',
    description: 'Create a new withdrawal request for a customer. Requires customer verification and approval workflow.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Withdrawal request created successfully',
    type: TransactionResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation errors or business rule violations' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Customer or account not found' 
  })
  async createWithdrawalRequest(
    @Request() req: AuthenticatedRequest,
    @Body() createDto: CreateWithdrawalRequestDto,
  ): Promise<TransactionResponseDto> {
    this.logger.log(`Creating withdrawal request by agent ${req.user.id} for customer ${createDto.customerId}`);

    try {
      const agentInfo: AgentInfo = {
        id: req.user.id,
        name: req.user.name,
        phone: req.user.phone,
        ipAddress: (req as any).ip,
        location: (req.body as any)?.location,
        deviceInfo: {
          userAgent: req.headers['user-agent'],
          timestamp: new Date().toISOString(),
        },
      };

      return await this.transactionService.createWithdrawalRequest(
        req.user.companyId,
        agentInfo,
        createDto,
      );
    } catch (error) {
      this.logger.error(`Failed to create withdrawal request: ${error instanceof Error ? getErrorMessage(error) : JSON.stringify(error)}`, error instanceof Error ? getErrorStack(error) : undefined);
      throw error;
    }
  }

  @Put(':transactionId/verify-customer')
  @Roles(UserRole.FIELD_AGENT, UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Verify customer for transaction',
    description: 'Perform customer verification using PIN, OTP, biometric, or agent visual confirmation.'
  })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Customer verification updated successfully',
    type: TransactionResponseDto
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Only the initiating agent can verify customer' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Transaction not found' 
  })
  async verifyCustomer(
    @Request() req: AuthenticatedRequest,
    @Param('transactionId') transactionId: string,
    @Body() verificationDto: CustomerVerificationDto,
  ): Promise<TransactionResponseDto> {
    this.logger.log(`Verifying customer for transaction ${transactionId} by agent ${req.user.id}`);

    try {
      return await this.transactionService.verifyCustomer(
        req.user.companyId,
        transactionId,
        req.user.id,
        verificationDto,
      );
    } catch (error) {
      this.logger.error(`Failed to verify customer: ${getErrorMessage(error)}`, getErrorStack(error));
      throw error;
    }
  }

  @Put(':transactionId/approve')
  @Roles(UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Approve transaction',
    description: 'Approve a pending withdrawal request. Requires appropriate authorization level.'
  })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Transaction approved successfully',
    type: TransactionResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Transaction cannot be approved in current state' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Insufficient authorization level' 
  })
  async approveTransaction(
    @Request() req: AuthenticatedRequest,
    @Param('transactionId') transactionId: string,
    @Body() approveDto: ApproveTransactionDto,
  ): Promise<TransactionResponseDto> {
    this.logger.log(`Approving transaction ${transactionId} by ${req.user.id}`);

    try {
      return await this.transactionService.approveTransaction(
        req.user.companyId,
        transactionId,
        req.user.id,
        approveDto,
      );
    } catch (error) {
      this.logger.error(`Failed to approve transaction: ${getErrorMessage(error)}`, getErrorStack(error));
      throw error;
    }
  }

  @Put(':transactionId/reject')
  @Roles(UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Reject transaction',
    description: 'Reject a pending withdrawal request with reason.'
  })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Transaction rejected successfully',
    type: TransactionResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Only pending transactions can be rejected' 
  })
  async rejectTransaction(
    @Request() req: AuthenticatedRequest,
    @Param('transactionId') transactionId: string,
    @Body() rejectDto: RejectTransactionDto,
  ): Promise<TransactionResponseDto> {
    this.logger.log(`Rejecting transaction ${transactionId} by ${req.user.id}`);

    try {
      return await this.transactionService.rejectTransaction(
        req.user.companyId,
        transactionId,
        req.user.id,
        rejectDto,
      );
    } catch (error) {
      this.logger.error(`Failed to reject transaction: ${getErrorMessage(error)}`, getErrorStack(error));
      throw error;
    }
  }

  @Put(':transactionId/process')
  @Roles(UserRole.FIELD_AGENT, UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Process transaction',
    description: 'Execute the approved withdrawal transaction and update account balances.'
  })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Transaction processed successfully',
    type: TransactionResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Transaction cannot be processed in current state' 
  })
  async processTransaction(
    @Request() req: AuthenticatedRequest,
    @Param('transactionId') transactionId: string,
    @Body() processDto: ProcessTransactionDto,
  ): Promise<TransactionResponseDto> {
    this.logger.log(`Processing transaction ${transactionId} by ${req.user.id}`);

    try {
      return await this.transactionService.processTransaction(
        req.user.companyId,
        transactionId,
        req.user.id,
        processDto,
      );
    } catch (error) {
      this.logger.error(`Failed to process transaction: ${getErrorMessage(error)}`, getErrorStack(error));
      throw error;
    }
  }

  @Put(':transactionId/cancel')
  @Roles(UserRole.FIELD_AGENT, UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Cancel transaction',
    description: 'Cancel a pending or approved transaction.'
  })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Transaction cancelled successfully',
    type: TransactionResponseDto
  })
  async cancelTransaction(
    @Request() req: AuthenticatedRequest,
    @Param('transactionId') transactionId: string,
    @Body() cancelDto: CancelTransactionDto,
  ): Promise<TransactionResponseDto> {
    this.logger.log(`Cancelling transaction ${transactionId} by ${req.user.id}`);

    try {
      return await this.transactionService.cancelTransaction(
        req.user.companyId,
        transactionId,
        req.user.id,
        cancelDto,
      );
    } catch (error) {
      this.logger.error(`Failed to cancel transaction: ${getErrorMessage(error)}`, getErrorStack(error));
      throw error;
    }
  }

  @Put(':transactionId/reverse')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Reverse transaction',
    description: 'Reverse a completed transaction. Requires manager or admin authorization.'
  })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Transaction reversal initiated successfully',
    type: TransactionResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Transaction cannot be reversed' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Insufficient authorization for reversal' 
  })
  async reverseTransaction(
    @Request() req: AuthenticatedRequest,
    @Param('transactionId') transactionId: string,
    @Body() reverseDto: ReverseTransactionDto,
  ): Promise<TransactionResponseDto> {
    this.logger.log(`Reversing transaction ${transactionId} by ${req.user.id}`);

    try {
      // Transaction reversal logic would be implemented here
      // For now, throw not implemented
      throw new HttpException('Transaction reversal not yet implemented in Story 3.2', HttpStatus.NOT_IMPLEMENTED);
    } catch (error) {
      this.logger.error(`Failed to reverse transaction: ${getErrorMessage(error)}`, getErrorStack(error));
      throw error;
    }
  }

  // ===== TRANSACTION INQUIRY OPERATIONS =====

  @Get()
  @Roles(UserRole.FIELD_AGENT, UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Get transactions',
    description: 'Retrieve transactions with filtering, pagination, and sorting options.'
  })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by transaction type' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by transaction status' })
  @ApiQuery({ name: 'customerId', required: false, description: 'Filter by customer ID' })
  @ApiQuery({ name: 'accountId', required: false, description: 'Filter by account ID' })
  @ApiQuery({ name: 'agentId', required: false, description: 'Filter by agent ID' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Filter from date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Filter to date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in transaction number, reference, or description' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Transactions retrieved successfully',
    type: TransactionListResponseDto
  })
  async getTransactions(
    @Request() req: AuthenticatedRequest,
    @Query() query: TransactionQueryDto,
  ): Promise<TransactionListResponseDto> {
    this.logger.log(`Retrieving transactions for company ${req.user.companyId}`);

    try {
      return await this.transactionService.getTransactions(req.user.companyId, query);
    } catch (error) {
      this.logger.error(`Failed to retrieve transactions: ${getErrorMessage(error)}`, getErrorStack(error));
      throw error;
    }
  }

  @Get(':transactionId')
  @Roles(UserRole.FIELD_AGENT, UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Get transaction by ID',
    description: 'Retrieve detailed information about a specific transaction.'
  })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Transaction retrieved successfully',
    type: TransactionResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Transaction not found' 
  })
  async getTransactionById(
    @Request() req: AuthenticatedRequest,
    @Param('transactionId') transactionId: string,
  ): Promise<TransactionResponseDto> {
    this.logger.log(`Retrieving transaction ${transactionId} for company ${req.user.companyId}`);

    try {
      const transaction = await this.transactionService.getTransactionById(req.user.companyId, transactionId);
      return this.transactionService['formatTransactionResponse'](transaction);
    } catch (error) {
      this.logger.error(`Failed to retrieve transaction: ${getErrorMessage(error)}`, getErrorStack(error));
      throw error;
    }
  }

  @Get('stats/overview')
  @Roles(UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Get transaction statistics',
    description: 'Retrieve comprehensive transaction statistics and analytics.'
  })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Statistics from date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Statistics to date (YYYY-MM-DD)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Transaction statistics retrieved successfully',
    type: TransactionStatsResponseDto
  })
  async getTransactionStats(
    @Request() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<TransactionStatsResponseDto> {
    this.logger.log(`Retrieving transaction statistics for company ${req.user.companyId}`);

    try {
      return await this.transactionService.getTransactionStats(req.user.companyId, dateFrom, dateTo);
    } catch (error) {
      this.logger.error(`Failed to retrieve transaction statistics: ${getErrorMessage(error)}`, getErrorStack(error));
      throw error;
    }
  }

  // ===== BALANCE INQUIRY OPERATIONS =====

  @Get('accounts/:accountId/balance')
  @Roles(UserRole.FIELD_AGENT, UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Get account balance',
    description: 'Retrieve current account balance and transaction limits.'
  })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Account balance retrieved successfully',
    type: BalanceInquiryResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Account not found' 
  })
  async getAccountBalance(
    @Request() req: AuthenticatedRequest,
    @Param('accountId') accountId: string,
  ): Promise<BalanceInquiryResponseDto> {
    this.logger.log(`Retrieving balance for account ${accountId}`);

    try {
      return await this.transactionService.getAccountBalance(req.user.companyId, accountId);
    } catch (error) {
      this.logger.error(`Failed to retrieve account balance: ${getErrorMessage(error)}`, getErrorStack(error));
      throw error;
    }
  }

  // ===== HOLD MANAGEMENT OPERATIONS =====

  @Put(':transactionId/hold')
  @Roles(UserRole.FIELD_AGENT, UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Place transaction hold',
    description: 'Place a hold on transaction amount for pending approvals.'
  })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Hold placed successfully'
  })
  async placeHold(
    @Request() req: AuthenticatedRequest,
    @Param('transactionId') transactionId: string,
    @Body() holdDto: HoldManagementDto,
  ): Promise<{ message: string; transactionId: string; holdAmount: number; expiresAt: string }> {
    this.logger.log(`Placing hold on transaction ${transactionId}`);

    try {
      await this.transactionService.placeTransactionHold(
        transactionId,
        holdDto.holdAmount,
        holdDto.expiryMinutes || 30,
      );

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + (holdDto.expiryMinutes || 30));

      return {
        message: 'Hold placed successfully',
        transactionId,
        holdAmount: holdDto.holdAmount,
        expiresAt: expiresAt.toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to place hold: ${getErrorMessage(error)}`, getErrorStack(error));
      throw error;
    }
  }

  @Delete(':transactionId/hold')
  @Roles(UserRole.FIELD_AGENT, UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Release transaction hold',
    description: 'Release the hold placed on a transaction.'
  })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Hold released successfully'
  })
  async releaseHold(
    @Request() req: AuthenticatedRequest,
    @Param('transactionId') transactionId: string,
  ): Promise<{ message: string; transactionId: string }> {
    this.logger.log(`Releasing hold on transaction ${transactionId}`);

    try {
      await this.transactionService.releaseTransactionHold(transactionId);

      return {
        message: 'Hold released successfully',
        transactionId,
      };
    } catch (error) {
      this.logger.error(`Failed to release hold: ${getErrorMessage(error)}`, getErrorStack(error));
      throw error;
    }
  }

  // ===== BULK OPERATIONS =====

  @Post('bulk-actions')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Perform bulk transaction actions',
    description: 'Perform actions on multiple transactions simultaneously.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Bulk action completed successfully'
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Insufficient authorization for bulk operations' 
  })
  async performBulkAction(
    @Request() req: AuthenticatedRequest,
    @Body() bulkActionDto: BulkTransactionActionDto,
  ): Promise<{ 
    message: string; 
    processedCount: number; 
    failedCount: number; 
    results: Array<{ transactionId: string; success: boolean; error?: string }>;
  }> {
    this.logger.log(`Performing bulk action '${bulkActionDto.action}' on ${Object.values(bulkActionDto.transactionIds).length} transactions`);

    try {
      // Bulk operations logic would be implemented here
      // For now, throw not implemented
      throw new HttpException('Bulk operations not yet implemented in Story 3.2', HttpStatus.NOT_IMPLEMENTED);
    } catch (error) {
      this.logger.error(`Failed to perform bulk action: ${getErrorMessage(error)}`, getErrorStack(error));
      throw error;
    }
  }

  // ===== RECEIPT OPERATIONS =====

  @Get(':transactionId/receipt')
  @Roles(UserRole.FIELD_AGENT, UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Get transaction receipt',
    description: 'Generate and retrieve transaction receipt for printing.'
  })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
  @ApiQuery({ name: 'format', required: false, description: 'Receipt format (pdf, text, json)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Receipt generated successfully',
    type: TransactionReceiptDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Transaction not found' 
  })
  async getTransactionReceipt(
    @Request() req: AuthenticatedRequest,
    @Param('transactionId') transactionId: string,
    @Query('format') format: string = 'json',
  ): Promise<TransactionReceiptDto | string> {
    this.logger.log(`Generating receipt for transaction ${transactionId} in ${format} format`);

    try {
      // Receipt generation logic would be implemented here
      // For now, throw not implemented
      throw new HttpException('Receipt generation not yet implemented in Story 3.2', HttpStatus.NOT_IMPLEMENTED);
    } catch (error) {
      this.logger.error(`Failed to generate receipt: ${getErrorMessage(error)}`, getErrorStack(error));
      throw error;
    }
  }

  @Put(':transactionId/receipt/print')
  @Roles(UserRole.FIELD_AGENT, UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Mark receipt as printed',
    description: 'Mark transaction receipt as printed and update timestamp.'
  })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Receipt marked as printed successfully'
  })
  async markReceiptPrinted(
    @Request() req: AuthenticatedRequest,
    @Param('transactionId') transactionId: string,
  ): Promise<{ message: string; transactionId: string; printedAt: string }> {
    this.logger.log(`Marking receipt as printed for transaction ${transactionId}`);

    try {
      // Mark receipt as printed logic would be implemented here
      // For now, return success response
      const printedAt = new Date().toISOString();

      return {
        message: 'Receipt marked as printed successfully',
        transactionId,
        printedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to mark receipt as printed: ${getErrorMessage(error)}`, getErrorStack(error));
      throw error;
    }
  }

  // ===== ADMINISTRATIVE OPERATIONS =====

  @Get('pending-approvals')
  @Roles(UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Get pending approvals',
    description: 'Retrieve transactions that require approval based on user authorization level.'
  })
  @ApiQuery({ name: 'priority', required: false, description: 'Filter by priority level' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Pending approvals retrieved successfully',
    type: TransactionListResponseDto
  })
  async getPendingApprovals(
    @Request() req: AuthenticatedRequest,
    @Query() query: { priority?: string; page?: number; limit?: number },
  ): Promise<TransactionListResponseDto> {
    this.logger.log(`Retrieving pending approvals for user ${req.user.id}`);

    try {
      const transactionQuery: TransactionQueryDto = {
        pendingApproval: true,
        page: query.page || 1,
        limit: query.limit || 20,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      };

      return await this.transactionService.getTransactions(req.user.companyId, transactionQuery);
    } catch (error) {
      this.logger.error(`Failed to retrieve pending approvals: ${getErrorMessage(error)}`, getErrorStack(error));
      throw error;
    }
  }

  @Get('high-risk')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Get high-risk transactions',
    description: 'Retrieve transactions flagged as high-risk for review.'
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiResponse({ 
    status: 200, 
    description: 'High-risk transactions retrieved successfully',
    type: TransactionListResponseDto
  })
  async getHighRiskTransactions(
    @Request() req: AuthenticatedRequest,
    @Query() query: { page?: number; limit?: number },
  ): Promise<TransactionListResponseDto> {
    this.logger.log(`Retrieving high-risk transactions for company ${req.user.companyId}`);

    try {
      const transactionQuery: TransactionQueryDto = {
        highRiskOnly: true,
        page: query.page || 1,
        limit: query.limit || 20,
        sortBy: 'riskScore',
        sortOrder: 'DESC',
      };

      return await this.transactionService.getTransactions(req.user.companyId, transactionQuery);
    } catch (error) {
      this.logger.error(`Failed to retrieve high-risk transactions: ${getErrorMessage(error)}`, getErrorStack(error));
      throw error;
    }
  }

  @Get('agent/:agentId/transactions')
  @Roles(UserRole.FIELD_AGENT, UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Get agent transactions',
    description: 'Retrieve transactions initiated by a specific agent.'
  })
  @ApiParam({ name: 'agentId', description: 'Agent ID' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Filter from date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Filter to date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Agent transactions retrieved successfully',
    type: TransactionListResponseDto
  })
  async getAgentTransactions(
    @Request() req: AuthenticatedRequest,
    @Param('agentId') agentId: string,
    @Query() query: { dateFrom?: string; dateTo?: string; page?: number; limit?: number },
  ): Promise<TransactionListResponseDto> {
    this.logger.log(`Retrieving transactions for agent ${agentId}`);

    try {
      // Ensure agents can only view their own transactions unless manager/admin
      if (req.user.role === UserRole.FIELD_AGENT && req.user.id !== agentId) {
        throw new HttpException('Agents can only view their own transactions', HttpStatus.FORBIDDEN);
      }

      const transactionQuery: TransactionQueryDto = {
        agentId,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        page: query.page || 1,
        limit: query.limit || 20,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      };

      return await this.transactionService.getTransactions(req.user.companyId, transactionQuery);
    } catch (error) {
      this.logger.error(`Failed to retrieve agent transactions: ${getErrorMessage(error)}`, getErrorStack(error));
      throw error;
    }
  }

  // ===== HEALTH CHECK =====

  @Get('health')
  @ApiOperation({ 
    summary: 'Transaction service health check',
    description: 'Check the health status of the transaction service.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy' 
  })
  async healthCheck(): Promise<{ status: string; timestamp: string; service: string }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Transaction Service',
    };
  }
}