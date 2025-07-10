import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Between, In, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Transaction, TransactionStatus, TransactionType } from '../entities/transaction.entity';
import { Account, AccountType } from '../entities/account.entity';
import { Customer } from '../entities/customer.entity';
import { getErrorMessage, getErrorStack, getErrorStatus, UserRole, ReportType, LibraryCapability } from '@sabs/common';


export interface TransactionSearchFilters {
  // Date range filters
  startDate?: string;
  endDate?: string;
  dateRange?: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'last90days' | 'custom';
  
  // Transaction filters
  transactionTypes?: TransactionType[];
  statuses?: TransactionStatus[];
  minAmount?: number;
  maxAmount?: number;
  amountRange?: 'small' | 'medium' | 'large' | 'custom';
  
  // Account filters
  accountIds?: string[];
  accountTypes?: AccountType[];
  accountNumbers?: string[];
  
  // Customer filters
  customerIds?: string[];
  customerName?: string;
  customerPhone?: string;
  
  // Agent filters
  agentIds?: string[];
  agentName?: string;
  
  // Transaction details
  transactionNumbers?: string[];
  references?: string[];
  receiptNumbers?: string[];
  
  // Risk and approval filters
  riskScoreMin?: number;
  riskScoreMax?: number;
  requiresApproval?: boolean;
  approvedBy?: string[];
  
  // Location filters
  locations?: string[];
  locationRadius?: number;
  
  // Advanced filters
  hasNotes?: boolean;
  isReversed?: boolean;
  hasAttachments?: boolean;
  priority?: string[];
  
  // Search text
  searchText?: string;
  
  // Pagination
  page?: number;
  limit?: number;
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface TransactionHistoryResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  summary: {
    totalAmount: number;
    totalFees: number;
    transactionCount: number;
    averageAmount: number;
    statusBreakdown: Record<string, number>;
    typeBreakdown: Record<string, number>;
  };
  filters: TransactionSearchFilters;
}

export interface TransactionAnalytics {
  summary: {
    totalTransactions: number;
    totalVolume: number;
    totalFees: number;
    averageAmount: number;
    successRate: number;
  };
  trends: {
    daily: Array<{ date: string; count: number; volume: number; fees: number }>;
    weekly: Array<{ week: string; count: number; volume: number; fees: number }>;
    monthly: Array<{ month: string; count: number; volume: number; fees: number }>;
  };
  breakdown: {
    byType: Record<string, { count: number; volume: number; percentage: number }>;
    byStatus: Record<string, { count: number; volume: number; percentage: number }>;
    byAccountType: Record<string, { count: number; volume: number; percentage: number }>;
    byAgent: Array<{ agentId: string; agentName: string; count: number; volume: number }>;
    byTimeOfDay: Array<{ hour: number; count: number; volume: number }>;
    byDayOfWeek: Array<{ day: string; count: number; volume: number }>;
  };
  performance: {
    averageProcessingTime: number;
    fastestTransaction: number;
    slowestTransaction: number;
    processingTimeDistribution: Array<{ range: string; count: number }>;
  };
  risk: {
    averageRiskScore: number;
    highRiskTransactions: number;
    riskDistribution: Array<{ range: string; count: number }>;
    suspiciousPatterns: Array<{ pattern: string; count: number; description: string }>;
  };
}

export interface ReconciliationReport {
  summary: {
    totalTransactions: number;
    reconciledTransactions: number;
    pendingReconciliation: number;
    discrepancies: number;
    reconciliationRate: number;
  };
  discrepancies: Array<{
    transactionId: string;
    transactionNumber: string;
    expectedAmount: number;
    actualAmount: number;
    variance: number;
    accountId: string;
    accountNumber: string;
    type: 'balance_mismatch' | 'missing_transaction' | 'duplicate_transaction' | 'amount_variance';
    severity: 'low' | 'medium' | 'high' | 'critical';
    detectedAt: Date;
    resolvedAt?: Date;
    notes?: string;
  }>;
  balanceSummary: Array<{
    accountId: string;
    accountNumber: string;
    expectedBalance: number;
    actualBalance: number;
    variance: number;
    lastReconciled: Date;
    status: 'balanced' | 'variance' | 'critical';
  }>;
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  fields?: string[];
  includeHeaders?: boolean;
  fileName?: string;
  customTemplate?: string;
  watermark?: string;
  compression?: boolean;
}

@Injectable()
export class TransactionHistoryService {
  private readonly logger = new Logger(TransactionHistoryService.name);

  // Predefined amount ranges for quick filtering
  private readonly amountRanges = {
    small: { min: 0, max: 100 },
    medium: { min: 100, max: 1000 },
    large: { min: 1000, max: Number.MAX_SAFE_INTEGER },
  };

  // Default pagination settings
  private readonly defaultPagination = {
    page: 1,
    limit: 50,
    maxLimit: 1000,
  };

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,

    @InjectRepository(Account)
    private accountRepository: Repository<Account>,

    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,

    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  // ===== TRANSACTION HISTORY SEARCH =====

  async searchTransactions(
    companyId: string,
    filters: TransactionSearchFilters,
  ): Promise<TransactionHistoryResponse> {
    this.logger.log(`Searching transactions for company ${companyId} with filters: ${JSON.stringify(filters)}`);

    // Validate and sanitize filters
    const sanitizedFilters = this.sanitizeFilters(filters);

    // Check cache first
    const cacheKey = this.generateCacheKey('search', companyId, sanitizedFilters);
    const cached = await this.cacheManager.get<TransactionHistoryResponse>(cacheKey);
    if (cached) {
      this.logger.log(`Returning cached search results for key: ${cacheKey}`);
      return cached;
    }

    // Build query
    const queryBuilder = this.buildSearchQuery(companyId, sanitizedFilters);

    // Get total count for pagination
    const totalQuery = queryBuilder.clone();
    const total = await totalQuery.getCount();

    // Apply pagination
    const { page, limit } = this.getPagination(sanitizedFilters);
    const offset = (page - 1) * limit;
    
    queryBuilder.skip(offset).take(limit);

    // Apply sorting
    this.applySorting(queryBuilder, sanitizedFilters);

    // Execute query
    const transactions = await queryBuilder.getMany();

    // Calculate summary
    const summary = await this.calculateSummary(companyId, sanitizedFilters);

    // Build response
    const response: TransactionHistoryResponse = {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrevious: page > 1,
      },
      summary,
      filters: sanitizedFilters,
    };

    // Cache result for 2 minutes
    await this.cacheManager.set(cacheKey, response, 120000);

    this.logger.log(`Found ${Object.values(transactions).length} transactions out of ${total} total`);
    return response;
  }

  async getTransactionById(
    companyId: string,
    transactionId: string,
  ): Promise<Transaction> {
    this.logger.log(`Getting transaction ${transactionId} for company ${companyId}`);

    // Check cache first
    const cacheKey = `transaction:${transactionId}`;
    const cached = await this.cacheManager.get<Transaction>(cacheKey);
    if (cached) {
      return cached;
    }

    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId, companyId },
      relations: ["customer", 'account', 'approvalWorkflows'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, transaction, 300000);

    return transaction;
  }

  async getTransactionsByAccount(
    companyId: string,
    accountId: string,
    filters?: Partial<TransactionSearchFilters>,
  ): Promise<TransactionHistoryResponse> {
    this.logger.log(`Getting transactions for account ${accountId}`);

    const searchFilters: TransactionSearchFilters = {
      ...filters,
      accountIds: [accountId],
    };

    return this.searchTransactions(companyId, searchFilters);
  }

  async getTransactionsByCustomer(
    companyId: string,
    customerId: string,
    filters?: Partial<TransactionSearchFilters>,
  ): Promise<TransactionHistoryResponse> {
    this.logger.log(`Getting transactions for customer ${customerId}`);

    const searchFilters: TransactionSearchFilters = {
      ...filters,
      customerIds: [customerId],
    };

    return this.searchTransactions(companyId, searchFilters);
  }

  // ===== TRANSACTION ANALYTICS =====

  async getTransactionAnalytics(
    companyId: string,
    filters?: Partial<TransactionSearchFilters>,
  ): Promise<TransactionAnalytics> {
    this.logger.log(`Generating analytics for company ${companyId}`);

    // Check cache first
    const cacheKey = this.generateCacheKey('analytics', companyId, filters);
    const cached = await this.cacheManager.get<TransactionAnalytics>(cacheKey);
    if (cached) {
      return cached;
    }

    const sanitizedFilters = this.sanitizeFilters(filters || {});

    // Get base query
    const baseQuery = this.buildSearchQuery(companyId, sanitizedFilters);

    // Calculate summary
    const summary = await this.calculateAnalyticsSummary(baseQuery);

    // Calculate trends
    const trends = await this.calculateTrends(companyId, sanitizedFilters);

    // Calculate breakdowns
    const breakdown = await this.calculateBreakdowns(companyId, sanitizedFilters);

    // Calculate performance metrics
    const performance = await this.calculatePerformanceMetrics(companyId, sanitizedFilters);

    // Calculate risk metrics
    const risk = await this.calculateRiskMetrics(companyId, sanitizedFilters);

    const analytics: TransactionAnalytics = {
      summary,
      trends,
      breakdown,
      performance,
      risk,
    };

    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, analytics, 600000);

    return analytics;
  }

  async getReconciliationReport(
    companyId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ReconciliationReport> {
    this.logger.log(`Generating reconciliation report for company ${companyId}`);

    const cacheKey = `reconciliation:${companyId}:${startDate}:${endDate}`;
    const cached = await this.cacheManager.get<ReconciliationReport>(cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate date range
    const dateFilters = this.getDateRange({ startDate, endDate });

    // Get transactions in range
    const transactions = await this.transactionRepository.find({
      where: {
        companyId,
        completedAt: dateFilters.completedAt,
        status: TransactionStatus.COMPLETED,
      },
      relations: ['account'],
    });

    // Calculate reconciliation metrics
    const summary = await this.calculateReconciliationSummary(transactions);

    // Detect discrepancies
    const discrepancies = await this.detectDiscrepancies(transactions);

    // Calculate balance summary
    const balanceSummary = await this.calculateBalanceSummary(companyId, transactions);

    const report: ReconciliationReport = {
      summary,
      discrepancies,
      balanceSummary,
    };

    // Cache for 15 minutes
    await this.cacheManager.set(cacheKey, report, 900000);

    return report;
  }

  // ===== EXPORT CAPABILITIES =====

  async exportTransactions(
    companyId: string,
    filters: TransactionSearchFilters,
    options: ExportOptions,
  ): Promise<{
    data: string | Buffer;
    fileName: string;
    mimeType: string;
    size: number;
  }> {
    this.logger.log(`Exporting transactions for company ${companyId} in ${options.format} format`);

    // Get all transactions (remove pagination for export)
    const exportFilters = { ...filters, page: undefined, limit: undefined };
    const queryBuilder = this.buildSearchQuery(companyId, exportFilters);
    
    // Limit large exports to prevent memory issues
    const maxExportLimit = 50000;
    queryBuilder.take(maxExportLimit);

    const transactions = await queryBuilder.getMany();

    if (Object.values(transactions).length === 0) {
      throw new BadRequestException('No transactions found for export');
    }

    this.logger.log(`Exporting ${Object.values(transactions).length} transactions`);

    // Generate export data based on format
    let data: string | Buffer;
    let mimeType: string;
    let fileName: string;

    switch (options.format) {
      case 'csv':
        data = this.generateCsvExport(transactions, options);
        mimeType = 'text/csv';
        fileName = options.fileName || `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'excel':
        data = this.generateExcelExport(transactions, options);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileName = options.fileName || `transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
        break;

      case 'pdf':
        data = this.generatePdfExport(transactions, options);
        mimeType = 'application/pdf';
        fileName = options.fileName || `transactions_${new Date().toISOString().split('T')[0]}.pdf`;
        break;

      case 'json':
        data = JSON.stringify({
          exportDate: new Date().toISOString(),
          companyId,
          filters: exportFilters,
          count: Object.values(transactions).length,
          transactions: transactions.map(t => this.sanitizeTransactionForExport(t)),
        }, null, 2);
        mimeType = 'application/json';
        fileName = options.fileName || `transactions_${new Date().toISOString().split('T')[0]}.json`;
        break;

      default:
        throw new BadRequestException(`Unsupported export format: ${options.format}`);
    }

    return {
      data,
      fileName,
      mimeType,
      size: Buffer.isBuffer(data) ? Object.values(data).length : Buffer.byteLength(data),
    };
  }

  // ===== TRANSACTION PATTERNS AND INSIGHTS =====

  async detectTransactionPatterns(
    companyId: string,
    analysisType: 'fraud' | 'velocity' | 'behavior' | 'risk',
    timeWindow?: number, // hours
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
    this.logger.log(`Detecting ${analysisType} patterns for company ${companyId}`);

    const windowHours = timeWindow || 24;
    const startDate = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    const transactions = await this.transactionRepository.find({
      where: {
        companyId,
        createdAt: MoreThanOrEqual(startDate),
      },
      relations: ["customer", 'account'],
      order: { createdAt: 'DESC' },
    });

    let patterns: any[] = [];
    let recommendations: any[] = [];

    switch (analysisType) {
      case 'fraud':
        patterns = this.detectFraudPatterns(transactions);
        break;
      case 'velocity':
        patterns = this.detectVelocityPatterns(transactions);
        break;
      case 'behavior':
        patterns = this.detectBehaviorPatterns(transactions);
        break;
      case 'risk':
        patterns = this.detectRiskPatterns(transactions);
        break;
    }

    // Generate recommendations based on patterns
    recommendations = this.generateRecommendations(patterns, analysisType);

    return { patterns, recommendations };
  }

  async getTransactionInsights(
    companyId: string,
    timeRange: 'daily' | 'weekly' | 'monthly' = 'weekly',
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
    this.logger.log(`Generating insights for company ${companyId} with ${timeRange} range`);

    // This would implement sophisticated analytics
    // For now, return placeholder structure
    return {
      insights: [
        {
          type: 'trend',
          title: 'Transaction Volume Increasing',
          description: 'Daily transaction volume has increased by 15% compared to last week',
          impact: 'positive',
          confidence: 0.85,
          data: { volumeIncrease: 15, period: 'week' },
        },
        {
          type: 'anomaly',
          title: 'Unusual High-Risk Transaction Spike',
          description: 'High-risk transactions increased by 45% today',
          impact: 'negative',
          confidence: 0.92,
          data: { riskIncrease: 45, threshold: 70 },
        },
      ],
      metrics: {
        growthRate: 12.5,
        volumeChange: 8.2,
        customerActivity: 78.5,
        efficiency: 94.2,
      },
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  private sanitizeFilters(filters: TransactionSearchFilters): TransactionSearchFilters {
    const sanitized = { ...filters };

    // Handle date range presets
    if (sanitized.dateRange && sanitized.dateRange !== 'custom') {
      const dateRange = this.getPresetDateRange(sanitized.dateRange);
      sanitized.startDate = dateRange.startDate;
      sanitized.endDate = dateRange.endDate;
    }

    // Handle amount range presets
    if (sanitized.amountRange && sanitized.amountRange !== 'custom') {
      const range = this.amountRanges[sanitized.amountRange];
      if (range) {
        sanitized.minAmount = range.min;
        sanitized.maxAmount = range.max;
      }
    }

    // Validate and sanitize amounts
    if (sanitized.minAmount !== undefined && sanitized.minAmount < 0) {
      sanitized.minAmount = 0;
    }
    if (sanitized.maxAmount !== undefined && sanitized.maxAmount < 0) {
      delete sanitized.maxAmount;
    }

    // Validate risk scores
    if (sanitized.riskScoreMin !== undefined) {
      sanitized.riskScoreMin = Math.max(0, Math.min(100, sanitized.riskScoreMin));
    }
    if (sanitized.riskScoreMax !== undefined) {
      sanitized.riskScoreMax = Math.max(0, Math.min(100, sanitized.riskScoreMax));
    }

    return sanitized;
  }

  private buildSearchQuery(
    companyId: string,
    filters: TransactionSearchFilters,
  ): SelectQueryBuilder<Transaction> {
    let query = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transactionEntity.customer', UserRole.CUSTOMER)
      .leftJoinAndSelect('transaction.account', 'account')
      .leftJoinAndSelect('transaction.approvalWorkflows', 'approval')
      .where('transaction.companyId = :companyId', { companyId });

    // Date filters
    if (filters.startDate || filters.endDate) {
      const dateRange = this.getDateRange(filters);
      if (dateRange.createdAt) {
        query = query.andWhere('transaction.createdAt BETWEEN :startDate AND :endDate', {
          startDate: dateRange.createdAt.from,
          endDate: dateRange.createdAt.to,
        });
      }
    }

    // Transaction type filters
    if (filters.transactionTypes && Object.values(filters.transactionTypes).length > 0) {
      query = query.andWhere('transaction.type IN (:...types)', { types: filters.transactionTypes });
    }

    // Status filters
    if (filters.statuses && Object.values(filters.statuses).length > 0) {
      query = query.andWhere('transaction.status IN (:...statuses)', { statuses: filters.statuses });
    }

    // Amount filters
    if (filters.minAmount !== undefined) {
      query = query.andWhere('transaction.amount >= :minAmount', { minAmount: filters.minAmount });
    }
    if (filters.maxAmount !== undefined) {
      query = query.andWhere('transaction.amount <= :maxAmount', { maxAmount: filters.maxAmount });
    }

    // Account filters
    if (filters.accountIds && Object.values(filters.accountIds).length > 0) {
      query = query.andWhere('transaction.accountId IN (:...accountIds)', { accountIds: filters.accountIds });
    }
    if (filters.accountTypes && Object.values(filters.accountTypes).length > 0) {
      query = query.andWhere('account.accountType IN (:...accountTypes)', { accountTypes: filters.accountTypes });
    }
    if (filters.accountNumbers && Object.values(filters.accountNumbers).length > 0) {
      query = query.andWhere('account.accountNumber IN (:...accountNumbers)', { accountNumbers: filters.accountNumbers });
    }

    // Customer filters
    if (filters.customerIds && Object.values(filters.customerIds).length > 0) {
      query = query.andWhere('transaction.customerId IN (:...customerIds)', { customerIds: filters.customerIds });
    }
    if (filters.customerName) {
      query = query.andWhere(
        '(customer.firstName ILIKE :customerName OR customer.lastName ILIKE :customerName OR CONCAT(customer.firstName, \' \', customer.lastName) ILIKE :customerName)',
        { customerName: `%${filters.customerName}%` }
      );
    }
    if (filters.customerPhone) {
      query = query.andWhere('customer.phoneNumber ILIKE :customerPhone', { customerPhone: `%${filters.customerPhone}%` });
    }

    // Agent filters
    if (filters.agentIds && Object.values(filters.agentIds).length > 0) {
      query = query.andWhere('transaction.agentId IN (:...agentIds)', { agentIds: filters.agentIds });
    }
    if (filters.agentName) {
      query = query.andWhere('transaction.agentName ILIKE :agentName', { agentName: `%${filters.agentName}%` });
    }

    // Transaction detail filters
    if (filters.transactionNumbers && Object.values(filters.transactionNumbers).length > 0) {
      query = query.andWhere('transaction.transactionNumber IN (:...transactionNumbers)', { transactionNumbers: filters.transactionNumbers });
    }
    if (filters.references && Object.values(filters.references).length > 0) {
      query = query.andWhere('transaction.reference IN (:...references)', { references: filters.references });
    }
    if (filters.receiptNumbers && Object.values(filters.receiptNumbers).length > 0) {
      query = query.andWhere('transaction.receiptNumber IN (:...receiptNumbers)', { receiptNumbers: filters.receiptNumbers });
    }

    // Risk filters
    if (filters.riskScoreMin !== undefined) {
      query = query.andWhere('transaction.riskScore >= :riskScoreMin', { riskScoreMin: filters.riskScoreMin });
    }
    if (filters.riskScoreMax !== undefined) {
      query = query.andWhere('transaction.riskScore <= :riskScoreMax', { riskScoreMax: filters.riskScoreMax });
    }

    // Approval filters
    if (filters.requiresApproval !== undefined) {
      query = query.andWhere('transaction.requiresApproval = :requiresApproval', { requiresApproval: filters.requiresApproval });
    }
    if (filters.approvedBy && Object.values(filters.approvedBy).length > 0) {
      query = query.andWhere('approval.approvedBy IN (:...approvedBy)', { approvedBy: filters.approvedBy });
    }

    // Location filters
    if (filters.locations && Object.values(filters.locations).length > 0) {
      query = query.andWhere('transaction.agentLocation IN (:...locations)', { locations: filters.locations });
    }

    // Advanced filters
    if (filters.hasNotes !== undefined) {
      if (filters.hasNotes) {
        query = query.andWhere('transaction.notes IS NOT NULL AND transaction.notes != \'\'');
      } else {
        query = query.andWhere('(transaction.notes IS NULL OR transaction.notes = \'\')');
      }
    }

    if (filters.isReversed !== undefined) {
      query = query.andWhere('transaction.reversed = :isReversed', { isReversed: filters.isReversed });
    }

    if (filters.priority && Object.values(filters.priority).length > 0) {
      query = query.andWhere('transaction.priority IN (:...priority)', { priority: filters.priority });
    }

    // Search text (searches across multiple fields)
    if (filters.searchText) {
      const searchText = `%${filters.searchText}%`;
      query = query.andWhere(
        '(transaction.transactionNumber ILIKE :searchText OR transaction.reference ILIKE :searchText OR customer.firstName ILIKE :searchText OR customer.lastName ILIKE :searchText OR account.accountNumber ILIKE :searchText OR transaction.notes ILIKE :searchText)',
        { searchText }
      );
    }

    return query;
  }

  private applySorting(query: SelectQueryBuilder<Transaction>, filters: TransactionSearchFilters): void {
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';

    // Map sort fields to actual column names
    const sortFieldMap: Record<string, string> = {
      createdAt: 'transaction.createdAt',
      amount: 'transaction.amount',
      status: 'transaction.status',
      type: 'transaction.type',
      customerName: 'customer.firstName',
      accountNumber: 'account.accountNumber',
      agentName: 'transaction.agentName',
      riskScore: 'transaction.riskScore',
      completedAt: 'transaction.completedAt',
      processedAt: 'transaction.processedAt',
    };

    const sortField = sortFieldMap[sortBy] || 'transaction.createdAt';
    query.orderBy(sortField, sortOrder);

    // Add secondary sort for consistency
    if (sortBy !== 'createdAt') {
      query.addOrderBy('transaction.createdAt', 'DESC');
    }
  }

  private async calculateSummary(
    companyId: string,
    filters: TransactionSearchFilters,
  ): Promise<TransactionHistoryResponse['summary']> {
    const summaryQuery = this.buildSearchQuery(companyId, filters);

    const result = await summaryQuery
      .select([
        'COUNT(*) as transactionCount',
        'SUM(transaction.amount) as totalAmount',
        'SUM(transaction.feeAmount) as totalFees',
        'AVG(transaction.amount) as averageAmount',
      ])
      .getRawOne();

    // Get status breakdown
    const statusQuery = this.buildSearchQuery(companyId, filters);
    const statusBreakdown = await statusQuery
      .select(['transaction.status', 'COUNT(*) as count'])
      .groupBy('transaction.status')
      .getRawMany();

    // Get type breakdown
    const typeQuery = this.buildSearchQuery(companyId, filters);
    const typeBreakdown = await typeQuery
      .select(['transaction.type', 'COUNT(*) as count'])
      .groupBy('transaction.type')
      .getRawMany();

    return {
      totalAmount: parseFloat(result.totalAmount) || 0,
      totalFees: parseFloat(result.totalFees) || 0,
      transactionCount: parseInt(result.transactionCount) || 0,
      averageAmount: parseFloat(result.averageAmount) || 0,
      statusBreakdown: Object.values(statusBreakdown).reduce((acc, item) => {
        acc[item.transaction_status] = parseInt(item.count);
        return acc;
      }, {}),
      typeBreakdown: Object.values(typeBreakdown).reduce((acc, item) => {
        acc[item.transaction_type] = parseInt(item.count);
        return acc;
      }, {}),
    };
  }

  private getPresetDateRange(preset: string): { startDate: string; endDate: string } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (preset) {
      case 'today':
        return {
          startDate: today.toISOString(),
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
        };
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          startDate: yesterday.toISOString(),
          endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
        };
      case 'last7days':
        return {
          startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: now.toISOString(),
        };
      case 'last30days':
        return {
          startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: now.toISOString(),
        };
      case 'last90days':
        return {
          startDate: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: now.toISOString(),
        };
      default:
        return {
          startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: now.toISOString(),
        };
    }
  }

  private getDateRange(filters: TransactionSearchFilters): any {
    if (!filters.startDate && !filters.endDate) {
      return {};
    }

    const startDate = filters.startDate ? new Date(filters.startDate) : null;
    const endDate = filters.endDate ? new Date(filters.endDate) : null;

    if (startDate && endDate) {
      return {
        createdAt: Between(startDate, endDate),
      };
    } else if (startDate) {
      return {
        createdAt: MoreThanOrEqual(startDate),
      };
    } else if (endDate) {
      return {
        createdAt: LessThanOrEqual(endDate),
      };
    }

    return {};
  }

  private getPagination(filters: TransactionSearchFilters): { page: number; limit: number } {
    const page = Math.max(1, filters.page || this.defaultPagination.page);
    const limit = Math.min(
      this.defaultPagination.maxLimit,
      Math.max(1, filters.limit || this.defaultPagination.limit)
    );

    return { page, limit };
  }

  private generateCacheKey(type: string, companyId: string, filters?: any): string {
    const filterString = filters ? JSON.stringify(filters) : '';
    const hash = require('crypto')
      .createHash('md5')
      .update(filterString)
      .digest('hex')
      .substring(0, 8);
    
    return `${type}:${companyId}:${hash}`;
  }

  // Placeholder implementations for complex analytics methods
  private async calculateAnalyticsSummary(query: SelectQueryBuilder<Transaction>): Promise<any> {
    // This would calculate comprehensive analytics summary
    return {
      totalTransactions: 0,
      totalVolume: 0,
      totalFees: 0,
      averageAmount: 0,
      successRate: 0,
    };
  }

  private async calculateTrends(companyId: string, filters: TransactionSearchFilters): Promise<any> {
    // This would calculate daily, weekly, monthly trends
    return {
      daily: [],
      weekly: [],
      monthly: [],
    };
  }

  private async calculateBreakdowns(companyId: string, filters: TransactionSearchFilters): Promise<any> {
    // This would calculate various breakdowns
    return {
      byType: {},
      byStatus: {},
      byAccountType: {},
      byAgent: [],
      byTimeOfDay: [],
      byDayOfWeek: [],
    };
  }

  private async calculatePerformanceMetrics(companyId: string, filters: TransactionSearchFilters): Promise<any> {
    // This would calculate performance metrics
    return {
      averageProcessingTime: 0,
      fastestTransaction: 0,
      slowestTransaction: 0,
      processingTimeDistribution: [],
    };
  }

  private async calculateRiskMetrics(companyId: string, filters: TransactionSearchFilters): Promise<any> {
    // This would calculate risk metrics
    return {
      averageRiskScore: 0,
      highRiskTransactions: 0,
      riskDistribution: [],
      suspiciousPatterns: [],
    };
  }

  private async calculateReconciliationSummary(transactions: Transaction[]): Promise<any> {
    // This would calculate reconciliation metrics
    return {
      totalTransactions: transactions.length,
      reconciledTransactions: transactions.length,
      pendingReconciliation: 0,
      discrepancies: 0,
      reconciliationRate: 100,
    };
  }

  private async detectDiscrepancies(transactions: Transaction[]): Promise<any[]> {
    // This would detect reconciliation discrepancies
    return [];
  }

  private async calculateBalanceSummary(companyId: string, transactions: Transaction[]): Promise<any[]> {
    // This would calculate balance summary
    return [];
  }

  private generateCsvExport(transactions: Transaction[], options: ExportOptions): string {
    // This would generate CSV export
    const headers = options.fields || ['transactionNumber', 'type', 'amount', 'status', 'createdAt'];
    const csvLines = [headers.join(',')];

    transactions.forEach(transaction => {
      const row = headers.map(field => {
        const value = transaction[field as keyof Transaction];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csvLines.push(row.join(','));
    });

    return csvLines.join('\n');
  }

  private generateExcelExport(transactions: Transaction[], options: ExportOptions): Buffer {
    // This would generate Excel export using a library like xlsx
    const csv = this.generateCsvExport(transactions, options);
    return Buffer.from(csv);
  }

  private generatePdfExport(transactions: Transaction[], options: ExportOptions): Buffer {
    // This would generate PDF export using a library like pdfkit
    return Buffer.from('PDF export placeholder');
  }

  private sanitizeTransactionForExport(transaction: Transaction): any {
    // Remove sensitive fields for export
    const { password, ...sanitized } = transaction as any;
    return sanitized;
  }

  private detectFraudPatterns(transactions: Transaction[]): any[] {
    // This would implement fraud detection algorithms
    return [];
  }

  private detectVelocityPatterns(transactions: Transaction[]): any[] {
    // This would detect velocity patterns
    return [];
  }

  private detectBehaviorPatterns(transactions: Transaction[]): any[] {
    // This would detect behavior patterns
    return [];
  }

  private detectRiskPatterns(transactions: Transaction[]): any[] {
    // This would detect risk patterns
    return [];
  }

  private generateRecommendations(patterns: any[], analysisType: string): any[] {
    // This would generate recommendations based on patterns
    return [];
  }
}