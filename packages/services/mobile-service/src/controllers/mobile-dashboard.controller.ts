import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ValidationPipe,
  BadRequestException,
  Logger,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

import {
  MobileDashboardService,
  CustomerAccount,
  DashboardSummary,
  TransactionSummary,
  BalanceAlert,
  FinancialInsight,
  SpendingCategory,
  QuickAction,
  AccountType,
  AccountStatus,
  TransactionType,
  TransactionStatus,
  AlertType,
  AlertSeverity,
  InsightType,
  QuickActionType,
  DashboardRequest,
  BalanceHistoryRequest,
  SpendingAnalysisRequest,
  AlertConfigRequest,
} from '../services/mobile-dashboard.service';

// ===== REQUEST DTOs =====

export class GetDashboardDto {
  includeInsights?: boolean = true;
  includeAlerts?: boolean = true;
  transactionLimit?: number = 10;
  period?: 'week' | 'month' | 'quarter' | 'year' = 'month';
}

export class TransactionSearchDto {
  accountId?: string;
  type?: TransactionType;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  searchText?: string;
  page?: number = 1;
  limit?: number = 20;
}

export class SpendingAnalysisDto {
  accountId?: string;
  period: 'week' | 'month' | 'quarter' | 'year' = 'month';
  categories?: string[];
  groupBy?: 'category' | 'date' | 'merchant' = 'category';
}

export class BalanceHistoryDto {
  accountId?: string;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month';
  startDate?: string;
  endDate?: string;
}

export class SetAlertDto {
  accountId: string;
  alertType: AlertType;
  threshold: number;
  enabled: boolean = true;
}

export class BudgetDto {
  category: string;
  amount: number;
  period: 'week' | 'month' | 'quarter' | 'year' = 'month';
  startDate?: string;
  endDate?: string;
}

// ===== RESPONSE DTOs =====

export class AccountDetailsDto {
  account: CustomerAccount;
  recentTransactions: TransactionSummary[];
  monthlyBalance: { date: string; balance: number }[];
  spendingByCategory: SpendingCategory[];
}

export class TransactionSearchResponseDto {
  transactions: TransactionSummary[];
  total: number;
  page: number;
  totalPages: number;
  filters: any;
}

export class SpendingAnalysisResponseDto {
  totalSpending: number;
  categories: SpendingCategory[];
  trends: { date: string; amount: number }[];
  comparison: { period: string; amount: number; change: number }[];
}

export class BalanceHistoryResponseDto {
  history: { date: string; balance: number }[];
  summary: {
    startBalance: number;
    endBalance: number;
    highestBalance: number;
    lowestBalance: number;
    averageBalance: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export class InsightResponseDto {
  insights: FinancialInsight[];
  summary: {
    totalInsights: number;
    actionableInsights: number;
    categories: { [key: string]: number };
  };
}

export class AlertResponseDto {
  alerts: BalanceAlert[];
  summary: {
    totalAlerts: number;
    activeAlerts: number;
    criticalAlerts: number;
    lastTriggered?: Date;
  };
}

@ApiTags('Mobile Dashboard')
@Controller('mobile-dashboard')
export class MobileDashboardController {
  private readonly logger = new Logger(MobileDashboardController.name);

  constructor(private readonly dashboardService: MobileDashboardService) {}

  // ===== DASHBOARD OVERVIEW ENDPOINTS =====

  @Get('summary')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer dashboard summary' })
  @ApiQuery({ name: 'includeInsights', required: false, type: Boolean })
  @ApiQuery({ name: 'includeAlerts', required: false, type: Boolean })
  @ApiQuery({ name: 'transactionLimit', required: false, type: Number })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'quarter', 'year'] })
  @ApiResponse({ status: 200, description: 'Dashboard summary retrieved' })
  async getDashboardSummary(
    @Headers('authorization') authorization: string,
    @Query() query: GetDashboardDto,
  ): Promise<DashboardSummary> {
    const customerId = await this.extractCustomerId(authorization);
    
    const request: DashboardRequest = {
      customerId,
      includeInsights: query.includeInsights,
      includeAlerts: query.includeAlerts,
      transactionLimit: query.transactionLimit,
      period: query.period,
    };

    return await this.dashboardService.getDashboardSummary(request);
  }

  @Get('accounts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer accounts' })
  @ApiResponse({ status: 200, description: 'Accounts retrieved' })
  async getAccounts(
    @Headers('authorization') authorization: string,
  ): Promise<CustomerAccount[]> {
    const customerId = await this.extractCustomerId(authorization);
    
    return await this.dashboardService.getCustomerAccounts(customerId);
  }

  @Get('accounts/:accountId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed account information' })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Account details retrieved', type: AccountDetailsDto })
  async getAccountDetails(
    @Headers('authorization') authorization: string,
    @Param('accountId') accountId: string,
  ): Promise<AccountDetailsDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    return await this.dashboardService.getAccountDetails(customerId, accountId);
  }

  @Get('quick-actions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available quick actions' })
  @ApiResponse({ status: 200, description: 'Quick actions retrieved' })
  async getQuickActions(
    @Headers('authorization') authorization: string,
  ): Promise<QuickAction[]> {
    const customerId = await this.extractCustomerId(authorization);
    
    return await this.dashboardService.getQuickActions(customerId);
  }

  // ===== TRANSACTION ENDPOINTS =====

  @Get('transactions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search and filter transactions' })
  @ApiQuery({ name: 'accountId', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: TransactionType })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'minAmount', required: false, type: Number })
  @ApiQuery({ name: 'maxAmount', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'searchText', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Transactions retrieved', type: TransactionSearchResponseDto })
  async searchTransactions(
    @Headers('authorization') authorization: string,
    @Query() query: TransactionSearchDto,
  ): Promise<TransactionSearchResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    const filters = {
      accountId: query.accountId,
      type: query.type,
      category: query.category,
      minAmount: query.minAmount,
      maxAmount: query.maxAmount,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      searchText: query.searchText,
    };

    const pagination = {
      page: query.page || 1,
      limit: Math.min(query.limit || 20, 100), // Max 100 items per page
    };

    const result = await this.dashboardService.searchTransactions(customerId, filters, pagination);
    
    return {
      ...result,
      filters: query,
    };
  }

  @Get('transactions/categories')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get transaction categories with counts' })
  @ApiResponse({ status: 200, description: 'Transaction categories retrieved' })
  async getTransactionCategories(
    @Headers('authorization') authorization: string,
  ): Promise<{ category: string; count: number; totalAmount: number }[]> {
    // Mock implementation
    return [
      { category: 'Food & Dining', count: 23, totalAmount: 450 },
      { category: 'Transportation', count: 15, totalAmount: 320 },
      { category: 'Shopping', count: 8, totalAmount: 280 },
      { category: 'Utilities', count: 5, totalAmount: 195 },
      { category: 'Entertainment', count: 7, totalAmount: 140 },
    ];
  }

  // ===== BALANCE & ANALYTICS ENDPOINTS =====

  @Get('balance/history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get account balance history' })
  @ApiQuery({ name: 'accountId', required: false, type: String })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month', 'quarter', 'year'] })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Balance history retrieved', type: BalanceHistoryResponseDto })
  async getBalanceHistory(
    @Headers('authorization') authorization: string,
    @Query() query: BalanceHistoryDto,
  ): Promise<BalanceHistoryResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    if (!query.accountId) {
      // Get primary account if none specified
      const accounts = await this.dashboardService.getCustomerAccounts(customerId);
      const primaryAccount = accounts.find(acc => acc.isDefault) || accounts[0];
      query.accountId = primaryAccount?.id;
    }

    if (!query.accountId) {
      throw new BadRequestException('No account found for balance history');
    }

    const history = await this.dashboardService.getBalanceHistory(query.accountId, query.period);
    
    // Calculate summary statistics
    const balances = history.map(h => h.balance);
    const startBalance = balances[0] || 0;
    const endBalance = balances[balances.length - 1] || 0;
    const highestBalance = Math.max(...balances);
    const lowestBalance = Math.min(...balances);
    const averageBalance = balances.reduce((sum, b) => sum + b, 0) / balances.length;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (endBalance > startBalance * 1.05) trend = 'up';
    else if (endBalance < startBalance * 0.95) trend = 'down';

    return {
      history,
      summary: {
        startBalance,
        endBalance,
        highestBalance,
        lowestBalance,
        averageBalance: Math.round(averageBalance * 100) / 100,
        trend,
      },
    };
  }

  @Get('spending/analysis')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get spending analysis and insights' })
  @ApiQuery({ name: 'accountId', required: false, type: String })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'quarter', 'year'] })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['category', 'date', 'merchant'] })
  @ApiResponse({ status: 200, description: 'Spending analysis retrieved', type: SpendingAnalysisResponseDto })
  async getSpendingAnalysis(
    @Headers('authorization') authorization: string,
    @Query() query: SpendingAnalysisDto,
  ): Promise<SpendingAnalysisResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    const request: SpendingAnalysisRequest = {
      customerId,
      accountId: query.accountId,
      period: query.period,
      categories: query.categories,
      groupBy: query.groupBy,
    };

    return await this.dashboardService.getSpendingAnalysis(request);
  }

  @Get('insights')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get financial insights and recommendations' })
  @ApiResponse({ status: 200, description: 'Financial insights retrieved', type: InsightResponseDto })
  async getFinancialInsights(
    @Headers('authorization') authorization: string,
  ): Promise<InsightResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    const insights = await this.dashboardService.getFinancialInsights(customerId);
    
    // Calculate summary statistics
    const totalInsights = insights.length;
    const actionableInsights = insights.filter(i => i.actionable).length;
    const categories = insights.reduce((acc, insight) => {
      acc[insight.type] = (acc[insight.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return {
      insights,
      summary: {
        totalInsights,
        actionableInsights,
        categories,
      },
    };
  }

  // ===== ALERT MANAGEMENT ENDPOINTS =====

  @Get('alerts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active alerts' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved', type: AlertResponseDto })
  async getAlerts(
    @Headers('authorization') authorization: string,
  ): Promise<AlertResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    const alertSummaries = await this.dashboardService.getActiveAlerts(customerId);
    
    // Convert to full alert objects for response
    const alerts = alertSummaries.map(summary => ({
      id: summary.id,
      customerId,
      accountId: '', // Would be populated from actual data
      alertType: summary.type,
      threshold: 0, // Would be populated from actual data
      currentValue: 0, // Would be populated from actual data
      message: summary.message,
      severity: summary.severity,
      isActive: summary.isActive,
      triggeredAt: summary.createdAt,
    })) as BalanceAlert[];

    const totalAlerts = alerts.length;
    const activeAlerts = alerts.filter(a => a.isActive).length;
    const criticalAlerts = alerts.filter(a => a.severity === AlertSeverity.CRITICAL).length;
    const lastTriggered = alerts.length > 0 ? 
      new Date(Math.max(...alerts.map(a => a.triggeredAt.getTime()))) : undefined;

    return {
      alerts,
      summary: {
        totalAlerts,
        activeAlerts,
        criticalAlerts,
        lastTriggered,
      },
    };
  }

  @Post('alerts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create balance alert' })
  @ApiResponse({ status: 201, description: 'Alert created successfully' })
  async createAlert(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) alertDto: SetAlertDto,
  ): Promise<{ success: boolean; alertId: string; message: string }> {
    const customerId = await this.extractCustomerId(authorization);
    
    const request: AlertConfigRequest = {
      customerId,
      accountId: alertDto.accountId,
      alertType: alertDto.alertType,
      threshold: alertDto.threshold,
      enabled: alertDto.enabled,
    };

    const result = await this.dashboardService.setBalanceAlert(request);
    
    return {
      success: result.success,
      alertId: result.alertId,
      message: 'Alert created successfully',
    };
  }

  @Put('alerts/:alertId/acknowledge')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Acknowledge an alert' })
  @ApiParam({ name: 'alertId', description: 'Alert ID' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged' })
  async acknowledgeAlert(
    @Headers('authorization') authorization: string,
    @Param('alertId') alertId: string,
  ): Promise<{ success: boolean; message: string }> {
    const customerId = await this.extractCustomerId(authorization);
    
    const result = await this.dashboardService.acknowledgeAlert(customerId, alertId);
    
    return {
      success: result.success,
      message: 'Alert acknowledged successfully',
    };
  }

  // ===== BUDGET MANAGEMENT ENDPOINTS =====

  @Get('budgets')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get budget information' })
  @ApiResponse({ status: 200, description: 'Budgets retrieved' })
  async getBudgets(
    @Headers('authorization') authorization: string,
  ): Promise<{
    budgets: Array<{
      id: string;
      category: string;
      amount: number;
      spent: number;
      remaining: number;
      percentage: number;
      period: string;
      status: 'on_track' | 'warning' | 'exceeded';
    }>;
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
  }> {
    // Mock budget data
    const budgets = [
      {
        id: 'budget_001',
        category: 'Food & Dining',
        amount: 500,
        spent: 450,
        remaining: 50,
        percentage: 90,
        period: 'month',
        status: 'warning' as const,
      },
      {
        id: 'budget_002',
        category: 'Transportation',
        amount: 300,
        spent: 320,
        remaining: -20,
        percentage: 107,
        period: 'month',
        status: 'exceeded' as const,
      },
      {
        id: 'budget_003',
        category: 'Shopping',
        amount: 400,
        spent: 280,
        remaining: 120,
        percentage: 70,
        period: 'month',
        status: 'on_track' as const,
      },
    ];

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const totalRemaining = totalBudget - totalSpent;

    return {
      budgets,
      totalBudget,
      totalSpent,
      totalRemaining,
    };
  }

  @Post('budgets')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set budget for category' })
  @ApiResponse({ status: 201, description: 'Budget created successfully' })
  async setBudget(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) budgetDto: BudgetDto,
  ): Promise<{ success: boolean; budgetId: string; message: string }> {
    const customerId = await this.extractCustomerId(authorization);
    
    // Mock budget creation
    const budgetId = `budget_${Date.now()}`;
    
    this.logger.log(`Setting budget for customer ${customerId}: ${budgetDto.category} - GHS ${budgetDto.amount}`);
    
    return {
      success: true,
      budgetId,
      message: `Budget of GHS ${budgetDto.amount} set for ${budgetDto.category}`,
    };
  }

  // ===== UTILITY ENDPOINTS =====

  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved' })
  async getDashboardStats(
    @Headers('authorization') authorization: string,
  ): Promise<{
    accountStats: {
      totalAccounts: number;
      activeAccounts: number;
      totalBalance: number;
      averageBalance: number;
    };
    transactionStats: {
      thisMonth: { count: number; volume: number };
      lastMonth: { count: number; volume: number };
      thisYear: { count: number; volume: number };
    };
    alertStats: {
      totalAlerts: number;
      activeAlerts: number;
      acknowledgedAlerts: number;
    };
  }> {
    const customerId = await this.extractCustomerId(authorization);
    
    const accounts = await this.dashboardService.getCustomerAccounts(customerId);
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
    const activeAccounts = accounts.filter(acc => acc.status === AccountStatus.ACTIVE).length;
    
    return {
      accountStats: {
        totalAccounts: accounts.length,
        activeAccounts,
        totalBalance,
        averageBalance: totalBalance / accounts.length || 0,
      },
      transactionStats: {
        thisMonth: { count: 45, volume: 12450.50 },
        lastMonth: { count: 52, volume: 14320.75 },
        thisYear: { count: 587, volume: 156780.25 },
      },
      alertStats: {
        totalAlerts: 8,
        activeAlerts: 3,
        acknowledgedAlerts: 5,
      },
    };
  }

  @Get('enums')
  @ApiOperation({ summary: 'Get dashboard-related enums' })
  @ApiResponse({ status: 200, description: 'Enums retrieved' })
  async getDashboardEnums(): Promise<{
    accountTypes: AccountType[];
    accountStatuses: AccountStatus[];
    transactionTypes: TransactionType[];
    transactionStatuses: TransactionStatus[];
    alertTypes: AlertType[];
    alertSeverities: AlertSeverity[];
    insightTypes: InsightType[];
    quickActionTypes: QuickActionType[];
  }> {
    return {
      accountTypes: Object.values(AccountType),
      accountStatuses: Object.values(AccountStatus),
      transactionTypes: Object.values(TransactionType),
      transactionStatuses: Object.values(TransactionStatus),
      alertTypes: Object.values(AlertType),
      alertSeverities: Object.values(AlertSeverity),
      insightTypes: Object.values(InsightType),
      quickActionTypes: Object.values(QuickActionType),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check dashboard service health' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async getHealthStatus(): Promise<{
    status: string;
    timestamp: string;
    services: {
      dashboard: string;
      analytics: string;
      alerts: string;
      insights: string;
    };
  }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        dashboard: 'operational',
        analytics: 'operational',
        alerts: 'operational',
        insights: 'operational',
      },
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  private async extractCustomerId(authorization: string): Promise<string> {
    // Mock implementation - would validate JWT and extract customer ID
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new BadRequestException('Invalid authorization header');
    }
    
    // Mock customer ID extraction
    return 'cust_demo_001';
  }
}