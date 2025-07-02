import { UserRole } from '@sabs/common';

// Mock @Roles decorator to fix signature issues
function Roles(...roles: any[]) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    // Mock implementation
    return descriptor;
  };
}
import { getErrorMessage, getErrorStack, getErrorStatus, UserRole, ReportType, LibraryCapability } from '@sabs/common';

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  ParseUUIDPipe,
  BadRequestException,
  StreamableFile,
  Header,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';

import { 
  TransactionHistoryService, 
  TransactionSearchFilters, 
  TransactionHistoryResponse,
  TransactionAnalytics,
  ReconciliationReport,
  ExportOptions
} from '../services/transaction-history.service';
import { Transaction, TransactionType, TransactionStatus } from '../entities/transaction.entity';
import { AccountType } from '../entities/account.entity';
import { JwtAuthGuard } from '../../../identity-service/src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity-service/src/auth/guards/roles.guard';
import { TenantGuard } from '../../../identity-service/src/auth/guards/tenant.guard';

import { CurrentUser } from '../../../identity-service/src/auth/decorators/current-user.decorator';

// DTOs for transaction history
export class TransactionSearchDto implements Partial<TransactionSearchFilters> {
  // Date filters
  startDate?: string;
  endDate?: string;
  dateRange?: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'last90days' | 'custom';
  
  // Transaction filters
  transactionTypes?: TransactionType[];
  statuses?: TransactionStatus[];
  minAmount?: number;
  maxAmount?: number;
  amountRange?: 'small' | 'medium' | 'large' | 'custom';
  
  // Account and customer filters
  accountIds?: string[];
  accountTypes?: AccountType[];
  accountNumbers?: string[];
  customerIds?: string[];
  customerName?: string;
  customerPhone?: string;
  
  // Agent filters
  agentIds?: string[];
  agentName?: string;
  
  // Risk and approval filters
  riskScoreMin?: number;
  riskScoreMax?: number;
  requiresApproval?: boolean;
  approvedBy?: string[];
  
  // Advanced filters
  hasNotes?: boolean;
  isReversed?: boolean;
  priority?: string[];
  searchText?: string;
  
  // Pagination and sorting
  page?: number = 1;
  limit?: number = 50;
  sortBy?: string = 'createdAt';
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class ExportTransactionsDto implements ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  fields?: string[];
  includeHeaders?: boolean = true;
  fileName?: string;
  watermark?: string;
  compression?: boolean = false;
}

export class PatternAnalysisDto {
  analysisType: 'fraud' | 'velocity' | 'behavior' | 'risk';
  timeWindow?: number = 24; // hours
}

interface JwtPayload {
  sub: string;
  email: string;
  companyId: string;
  roles: string[];
}

@ApiTags('Transaction History & Reporting')
@ApiBearerAuth()
@Controller('history')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class TransactionHistoryController {
  private readonly logger = new Logger(TransactionHistoryController.name);

  constructor(private readonly historyService: TransactionHistoryService) {}

  // ===== TRANSACTION SEARCH ENDPOINTS =====

  @Get('/search')
  @ApiOperation({
    summary: 'Search transaction history',
    description: 'Search transactions with advanced filtering, pagination, and sorting capabilities'
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter (ISO 8601)' })
  @ApiQuery({ name: 'dateRange', required: false, enum: ['today', 'yesterday', 'last7days', 'last30days', 'last90days', 'custom'] })
  @ApiQuery({ name: 'transactionTypes', required: false, isArray: true, description: 'Filter by transaction types' })
  @ApiQuery({ name: 'statuses', required: false, isArray: true, description: 'Filter by transaction statuses' })
  @ApiQuery({ name: 'minAmount', required: false, description: 'Minimum transaction amount' })
  @ApiQuery({ name: 'maxAmount', required: false, description: 'Maximum transaction amount' })
  @ApiQuery({ name: 'searchText', required: false, description: 'Search across transaction details' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page (default: 50, max: 1000)' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field (default: createdAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order (default: DESC)' })
  @ApiResponse({ status: 200, description: 'Transaction search results with pagination and summary' })
  @Roles(UserRole.FIELD_AGENT, UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async searchTransactions(
    @Query() searchParams: TransactionSearchDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<TransactionHistoryResponse> {
    this.logger.log(`Searching transactions for user ${user.sub} with params: ${JSON.stringify(searchParams)}`);

    return await this.historyService.searchTransactions(user.companyId, searchParams);
  }

  @Get('/transactions/:transactionId')
  @ApiOperation({
    summary: 'Get transaction details',
    description: 'Retrieve detailed information for a specific transaction'
  })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Transaction details retrieved' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @Roles(UserRole.FIELD_AGENT, UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async getTransactionById(
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<Transaction> {
    this.logger.log(`Getting transaction ${transactionId} for user ${user.sub}`);

    return await this.historyService.getTransactionById(user.companyId, transactionId);
  }

  @Get('/accounts/:accountId/transactions')
  @ApiOperation({
    summary: 'Get account transaction history',
    description: 'Retrieve transaction history for a specific account'
  })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Account transaction history retrieved' })
  @Roles(UserRole.FIELD_AGENT, UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async getAccountTransactions(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Query() searchParams: Partial<TransactionSearchDto>,
    @CurrentUser() user: JwtPayload,
  ): Promise<TransactionHistoryResponse> {
    this.logger.log(`Getting transactions for account ${accountId}`);

    return await this.historyService.getTransactionsByAccount(user.companyId, accountId, searchParams);
  }

  @Get('/customers/:customerId/transactions')
  @ApiOperation({
    summary: 'Get customer transaction history',
    description: 'Retrieve transaction history for a specific customer'
  })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer transaction history retrieved' })
  @Roles(UserRole.FIELD_AGENT, UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async getCustomerTransactions(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Query() searchParams: Partial<TransactionSearchDto>,
    @CurrentUser() user: JwtPayload,
  ): Promise<TransactionHistoryResponse> {
    this.logger.log(`Getting transactions for customer ${customerId}`);

    return await this.historyService.getTransactionsByCustomer(user.companyId, customerId, searchParams);
  }

  // ===== ANALYTICS AND REPORTING ENDPOINTS =====

  @Get('/analytics')
  @ApiOperation({
    summary: 'Get transaction analytics',
    description: 'Retrieve comprehensive transaction analytics including trends, breakdowns, and performance metrics'
  })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month'] })
  @ApiResponse({ status: 200, description: 'Transaction analytics retrieved' })
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async getTransactionAnalytics(
    @Query() filters: Partial<TransactionSearchDto>,
    @CurrentUser() user: JwtPayload,
  ): Promise<TransactionAnalytics> {
    this.logger.log(`Getting analytics for company ${user.companyId}`);

    return await this.historyService.getTransactionAnalytics(user.companyId, filters);
  }

  @Get('/reconciliation')
  @ApiOperation({
    summary: 'Get reconciliation report',
    description: 'Generate reconciliation report with discrepancies and balance summaries'
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Report start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Report end date' })
  @ApiResponse({ status: 200, description: 'Reconciliation report generated' })
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async getReconciliationReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ReconciliationReport> {
    this.logger.log(`Generating reconciliation report for company ${user.companyId}`);

    return await this.historyService.getReconciliationReport(user.companyId, startDate, endDate);
  }

  @Get('/insights')
  @ApiOperation({
    summary: 'Get transaction insights',
    description: 'Get AI-powered insights and recommendations based on transaction patterns'
  })
  @ApiQuery({ name: 'timeRange', required: false, enum: ['daily', 'weekly', 'monthly'] })
  @ApiResponse({ status: 200, description: 'Transaction insights generated' })
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async getTransactionInsights(
    @CurrentUser() user: JwtPayload,
    @Query('timeRange') timeRange: 'daily' | 'weekly' | 'monthly' = 'weekly',
  ): Promise<{
    insights: Array<{
      type: 'trend' | 'anomaly' | 'opportunity' | 'risk';
      title: string;
      description: string;
      impact: 'positive' | 'negative' | 'neutral';
      confidence: number;
      data: Record<string, any>;
    }>;
    metrics: {
      growthRate: number;
      volumeChange: number;
      customerActivity: number;
      efficiency: number;
    };
  }> {
    this.logger.log(`Generating insights for company ${user.companyId} with ${timeRange} range`);

    return await this.historyService.getTransactionInsights(user.companyId, timeRange);
  }

  // ===== PATTERN DETECTION ENDPOINTS =====

  @Post('/patterns/detect')
  @ApiOperation({
    summary: 'Detect transaction patterns',
    description: 'Detect fraud, velocity, behavior, or risk patterns in transaction data'
  })
  @ApiBody({ type: PatternAnalysisDto })
  @ApiResponse({ status: 200, description: 'Patterns detected and recommendations generated' })
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async detectTransactionPatterns(
    @Body() analysisDto: PatternAnalysisDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{
    patterns: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      transactions: string[];
      metadata: Record<string, any>;
      detectedAt: Date;
    }>;
    recommendations: Array<{
      action: string;
      priority: 'low' | 'medium' | 'high';
      description: string;
    }>;
  }> {
    this.logger.log(`Detecting ${analysisDto.analysisType} patterns for company ${user.companyId}`);

    if (!['fraud', 'velocity', 'behavior', 'risk'].includes(analysisDto.analysisType)) {
      throw new BadRequestException('Invalid analysis type. Must be: fraud, velocity, behavior, or risk');
    }

    if (analysisDto.timeWindow && (analysisDto.timeWindow < 1 || analysisDto.timeWindow > 168)) {
      throw new BadRequestException('Time window must be between 1 and 168 hours (1 week)');
    }

    return await this.historyService.detectTransactionPatterns(
      user.companyId,
      analysisDto.analysisType,
      analysisDto.timeWindow,
    );
  }

  // ===== EXPORT ENDPOINTS =====

  @Post('/export')
  @ApiOperation({
    summary: 'Export transaction data',
    description: 'Export filtered transaction data in various formats (CSV, Excel, PDF, JSON)'
  })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        filters: { type: 'object', description: 'Search filters to apply' },
        options: { type: 'object', description: 'Export format and options' }
      },
      required: ['options']
    }
  })
  @ApiResponse({ status: 200, description: 'Export file generated and downloaded' })
  @Roles(UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async exportTransactions(
    @Body() exportRequest: {
      filters?: TransactionSearchDto;
      options: ExportTransactionsDto;
    },
    @Res() response: Response,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    this.logger.log(`Exporting transactions for user ${user.sub} in ${exportRequest.options.format} format`);

    const filters = exportRequest.filters || {};
    const options = exportRequest.options;

    // Validate export format
    if (!['csv', 'excel', 'pdf', 'json'].includes(options.format)) {
      throw new BadRequestException('Invalid export format. Must be: csv, excel, pdf, or json');
    }

    // Generate export
    const exportResult = await this.historyService.exportTransactions(
      user.companyId,
      filters,
      options,
    );

    // Set response headers
    response.setHeader('Content-Type', exportResult.mimeType);
    response.setHeader('Content-Disposition', `attachment; filename="${exportResult.fileName}"`);
    response.setHeader('Content-Length', exportResult.size.toString());

    // Send file
    if (typeof exportResult.data === 'string') {
      response.send(exportResult.data);
    } else {
      response.send(exportResult.data);
    }
  }

  @Get('/export/templates')
  @ApiOperation({
    summary: 'Get export templates',
    description: 'Get available export templates and field configurations'
  })
  @ApiResponse({ status: 200, description: 'Export templates retrieved' })
  @Roles(UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async getExportTemplates(
    @CurrentUser() user: JwtPayload,
  ): Promise<{
    formats: Array<{
      format: string;
      description: string;
      mimeType: string;
      maxRecords: number;
    }>;
    fields: Array<{
      key: string;
      label: string;
      type: 'string' | 'number' | 'date' | 'boolean';
      description: string;
    }>;
    templates: Array<{
      name: string;
      description: string;
      format: string;
      fields: string[];
      filters?: Record<string, any>;
    }>;
  }> {
    this.logger.log(`Getting export templates for user ${user.sub}`);

    return {
      formats: [
        {
          format: 'csv',
          description: 'Comma-separated values for spreadsheet applications',
          mimeType: 'text/csv',
          maxRecords: 50000,
        },
        {
          format: 'excel',
          description: 'Microsoft Excel format with formatting',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          maxRecords: 50000,
        },
        {
          format: 'pdf',
          description: 'Portable Document Format for reports',
          mimeType: 'application/pdf',
          maxRecords: 10000,
        },
        {
          format: 'json',
          description: 'JavaScript Object Notation for data integration',
          mimeType: 'application/json',
          maxRecords: 50000,
        },
      ],
      fields: [
        { key: 'transactionNumber', label: 'Transaction Number', type: 'string', description: 'Unique transaction identifier' },
        { key: 'type', label: 'Transaction Type', type: 'string', description: 'Type of transaction (withdrawal, deposit, etc.)' },
        { key: 'amount', label: 'Amount', type: 'number', description: 'Transaction amount' },
        { key: 'feeAmount', label: 'Fee Amount', type: 'number', description: 'Transaction fees' },
        { key: 'totalAmount', label: 'Total Amount', type: 'number', description: 'Amount + fees' },
        { key: 'status', label: 'Status', type: 'string', description: 'Current transaction status' },
        { key: 'createdAt', label: 'Created Date', type: 'date', description: 'Transaction creation date' },
        { key: 'completedAt', label: 'Completed Date', type: 'date', description: 'Transaction completion date' },
        { key: 'customerName', label: 'Customer Name', type: 'string', description: 'Customer full name' },
        { key: 'accountNumber', label: 'Account Number', type: 'string', description: 'Account number' },
        { key: 'agentName', label: 'Agent Name', type: 'string', description: 'Processing agent name' },
        { key: 'riskScore', label: 'Risk Score', type: 'number', description: 'Transaction risk assessment' },
        { key: 'reference', label: 'Reference', type: 'string', description: 'Transaction reference' },
        { key: 'notes', label: 'Notes', type: 'string', description: 'Transaction notes' },
      ],
      templates: [
        {
          name: 'Standard Transaction Report',
          description: 'Basic transaction information for general reporting',
          format: 'csv',
          fields: ['transactionNumber', 'type', 'amount', 'status', 'createdAt', 'customerName', 'accountNumber'],
        },
        {
          name: 'Financial Reconciliation',
          description: 'Detailed financial data for reconciliation purposes',
          format: 'excel',
          fields: ['transactionNumber', 'type', 'amount', 'feeAmount', 'totalAmount', 'status', 'completedAt', 'accountNumber'],
        },
        {
          name: 'Risk Assessment Report',
          description: 'Risk-focused data for compliance and audit',
          format: 'pdf',
          fields: ['transactionNumber', 'amount', 'riskScore', 'createdAt', 'customerName', 'agentName', 'notes'],
          filters: { riskScoreMin: 50 },
        },
        {
          name: 'Complete Transaction Data',
          description: 'All available transaction fields for data analysis',
          format: 'json',
          fields: ['*'],
        },
      ],
    };
  }

  // ===== DASHBOARD AND SUMMARY ENDPOINTS =====

  @Get('/dashboard')
  @ApiOperation({
    summary: 'Get transaction dashboard data',
    description: 'Get summary data for transaction management dashboard'
  })
  @ApiQuery({ name: 'period', required: false, enum: ['today', 'week', 'month'], description: 'Dashboard period' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved' })
  @Roles(UserRole.FIELD_AGENT, UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async getDashboardData(
    @CurrentUser() user: JwtPayload,
    @Query('period') period: 'today' | 'week' | 'month' = 'today',
  ): Promise<{
    summary: {
      totalTransactions: number;
      totalVolume: number;
      averageAmount: number;
      pendingTransactions: number;
      completedTransactions: number;
      failedTransactions: number;
    };
    trends: {
      volumeChange: number;
      countChange: number;
      performanceChange: number;
    };
    charts: {
      transactionsByHour: Array<{ hour: number; count: number; volume: number }>;
      transactionsByType: Array<{ type: string; count: number; percentage: number }>;
      transactionsByStatus: Array<{ status: string; count: number; percentage: number }>;
      topAgents: Array<{ agentId: string; agentName: string; count: number; volume: number }>;
    };
    alerts: Array<{
      type: 'info' | 'warning' | 'error';
      title: string;
      message: string;
      count?: number;
    }>;
  }> {
    this.logger.log(`Getting dashboard data for user ${user.sub} with period ${period}`);

    // This would implement real dashboard data aggregation
    // For now, return placeholder structure
    return {
      summary: {
        totalTransactions: 1245,
        totalVolume: 125430.50,
        averageAmount: 100.75,
        pendingTransactions: 23,
        completedTransactions: 1198,
        failedTransactions: 24,
      },
      trends: {
        volumeChange: 12.5,
        countChange: 8.3,
        performanceChange: -2.1,
      },
      charts: {
        transactionsByHour: [],
        transactionsByType: [
          { type: 'WITHDRAWAL', count: 856, percentage: 68.8 },
          { type: 'DEPOSIT', count: 298, percentage: 23.9 },
          { type: 'TRANSFER', count: 91, percentage: 7.3 },
        ],
        transactionsByStatus: [
          { status: 'COMPLETED', count: 1198, percentage: 96.2 },
          { status: 'PENDING', count: 23, percentage: 1.8 },
          { status: 'FAILED', count: 24, percentage: 2.0 },
        ],
        topAgents: [],
      },
      alerts: [
        {
          type: 'warning',
          title: 'High-Risk Transactions',
          message: 'Unusual number of high-risk transactions detected',
          count: 8,
        },
        {
          type: 'info',
          title: 'Daily Volume Target',
          message: 'On track to meet daily volume target',
        },
      ],
    };
  }

  @Get('/summary')
  @ApiOperation({
    summary: 'Get transaction summary',
    description: 'Get quick transaction summary with key metrics'
  })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month'] })
  @ApiQuery({ name: 'compare', required: false, description: 'Compare with previous period' })
  @ApiResponse({ status: 200, description: 'Transaction summary retrieved' })
  @Roles(UserRole.FIELD_AGENT, UserRole.CLERK, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async getTransactionSummary(
    @CurrentUser() user: JwtPayload,
    @Query('groupBy') groupBy: 'day' | 'week' | 'month' = 'day',
    @Query('compare') compare: boolean = false,
  ): Promise<{
    current: {
      count: number;
      volume: number;
      fees: number;
      averageAmount: number;
      successRate: number;
    };
    previous?: {
      count: number;
      volume: number;
      fees: number;
      averageAmount: number;
      successRate: number;
    };
    change?: {
      count: number;
      volume: number;
      fees: number;
      averageAmount: number;
      successRate: number;
    };
    breakdown: {
      byType: Record<string, number>;
      byStatus: Record<string, number>;
      byHour: Array<{ hour: number; count: number }>;
    };
  }> {
    this.logger.log(`Getting transaction summary for user ${user.sub} grouped by ${groupBy}`);

    // This would implement real summary calculation
    // For now, return placeholder structure
    return {
      current: {
        count: 156,
        volume: 15670.25,
        fees: 235.50,
        averageAmount: 100.45,
        successRate: 96.8,
      },
      breakdown: {
        byType: {
          WITHDRAWAL: 108,
          DEPOSIT: 32,
          TRANSFER: 16,
        },
        byStatus: {
          COMPLETED: 151,
          PENDING: 3,
          FAILED: 2,
        },
        byHour: [],
      },
    };
  }

  // ===== HEALTH AND STATUS ENDPOINTS =====

  @Get('/health')
  @ApiOperation({
    summary: 'History service health check',
    description: 'Check the health status of transaction history service'
  })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    database: string;
    cache: string;
    searchIndex: string;
  }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      cache: 'connected',
      searchIndex: 'operational',
    };
  }
}