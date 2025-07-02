import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { nanoid } from 'nanoid';

// ===== DASHBOARD ENTITIES =====

export interface CustomerAccount {
  id: string;
  customerId: string;
  accountNumber: string;
  accountType: AccountType;
  accountName: string;
  currency: string;
  currentBalance: number;
  availableBalance: number;
  blockedAmount: number;
  status: AccountStatus;
  isDefault: boolean;
  createdAt: Date;
  lastTransactionAt?: Date;
  metadata: Record<string, any>;
}

export interface DashboardSummary {
  customerId: string;
  totalBalance: number;
  totalAccounts: number;
  recentTransactions: TransactionSummary[];
  monthlySpending: number;
  monthlyIncome: number;
  alerts: AlertSummary[];
  quickActions: QuickAction[];
  insights: FinancialInsight[];
  lastUpdated: Date;
}

export interface TransactionSummary {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  description: string;
  category: string;
  date: Date;
  status: TransactionStatus;
  balance: number;
}

export interface BalanceAlert {
  id: string;
  customerId: string;
  accountId: string;
  alertType: AlertType;
  threshold: number;
  currentValue: number;
  message: string;
  severity: AlertSeverity;
  isActive: boolean;
  triggeredAt: Date;
  acknowledgedAt?: Date;
}

export interface FinancialInsight {
  id: string;
  customerId: string;
  type: InsightType;
  title: string;
  description: string;
  value: number;
  previousValue?: number;
  changePercentage?: number;
  period: string;
  actionable: boolean;
  recommendations?: string[];
  createdAt: Date;
}

export interface SpendingCategory {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  trend: 'up' | 'down' | 'stable';
  budget?: number;
  budgetUsed?: number;
}

export interface QuickAction {
  id: string;
  type: QuickActionType;
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
  requiresAuth: boolean;
  endpoint?: string;
  metadata?: Record<string, any>;
}

// ===== ENUMS =====

export enum AccountType {
  SAVINGS = 'savings',
  CURRENT = 'current',
  WALLET = 'wallet',
  LOAN = 'loan',
  FIXED_DEPOSIT = 'fixed_deposit',
}

export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  CLOSED = 'closed',
  PENDING = 'pending',
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRANSFER = 'transfer',
  PAYMENT = 'payment',
  FEE = 'fee',
  INTEREST = 'interest',
  REVERSAL = 'reversal',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REVERSED = 'reversed',
}

export enum AlertType {
  LOW_BALANCE = 'low_balance',
  HIGH_SPENDING = 'high_spending',
  UNUSUAL_ACTIVITY = 'unusual_activity',
  BUDGET_EXCEEDED = 'budget_exceeded',
  DEPOSIT_RECEIVED = 'deposit_received',
  PAYMENT_DUE = 'payment_due',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum InsightType {
  SPENDING_PATTERN = 'spending_pattern',
  SAVING_OPPORTUNITY = 'saving_opportunity',
  BUDGET_PERFORMANCE = 'budget_performance',
  CASH_FLOW = 'cash_flow',
  COMPARATIVE_SPENDING = 'comparative_spending',
  GOAL_PROGRESS = 'goal_progress',
}

export enum QuickActionType {
  TRANSFER_MONEY = 'transfer_money',
  PAY_BILL = 'pay_bill',
  BUY_AIRTIME = 'buy_airtime',
  CHECK_BALANCE = 'check_balance',
  VIEW_STATEMENTS = 'view_statements',
  REQUEST_LOAN = 'request_loan',
  SET_BUDGET = 'set_budget',
  FIND_ATM = 'find_atm',
}

export interface AlertSummary {
  id: string;
  type: AlertType;
  message: string;
  severity: AlertSeverity;
  isActive: boolean;
  createdAt: Date;
}

// ===== REQUEST/RESPONSE INTERFACES =====

export interface DashboardRequest {
  customerId: string;
  includeInsights?: boolean;
  includeAlerts?: boolean;
  transactionLimit?: number;
  period?: 'week' | 'month' | 'quarter' | 'year';
}

export interface BalanceHistoryRequest {
  customerId: string;
  accountId?: string;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate?: Date;
  endDate?: Date;
}

export interface SpendingAnalysisRequest {
  customerId: string;
  accountId?: string;
  period: 'week' | 'month' | 'quarter' | 'year';
  categories?: string[];
  groupBy?: 'category' | 'date' | 'merchant';
}

export interface AlertConfigRequest {
  customerId: string;
  accountId: string;
  alertType: AlertType;
  threshold: number;
  enabled: boolean;
}

@Injectable()
export class MobileDashboardService {
  private readonly logger = new Logger(MobileDashboardService.name);

  // In-memory storage (would use database in production)
  private accounts: Map<string, CustomerAccount> = new Map();
  private transactions: Map<string, TransactionSummary[]> = new Map();
  private alerts: Map<string, BalanceAlert[]> = new Map();
  private insights: Map<string, FinancialInsight[]> = new Map();

  constructor(
    private eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.initializeMockData();
  }

  // ===== DASHBOARD OVERVIEW =====

  async getDashboardSummary(request: DashboardRequest): Promise<DashboardSummary> {
    this.logger.log(`Getting dashboard summary for customer ${request.customerId}`);

    try {
      // Check cache first
      const cacheKey = `dashboard_${request.customerId}`;
      const cached = await this.cacheManager.get<DashboardSummary>(cacheKey);
      if (cached) {
        return cached;
      }

      // Get customer accounts
      const accounts = await this.getCustomerAccounts(request.customerId);
      
      // Calculate totals
      const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
      const totalAccounts = accounts.length;

      // Get recent transactions
      const recentTransactions = await this.getRecentTransactions(
        request.customerId, 
        request.transactionLimit || 10
      );

      // Calculate monthly metrics
      const { monthlySpending, monthlyIncome } = await this.getMonthlyMetrics(request.customerId);

      // Get active alerts
      const alerts = await this.getActiveAlerts(request.customerId);

      // Get quick actions
      const quickActions = await this.getQuickActions(request.customerId);

      // Get insights if requested
      const insights = request.includeInsights 
        ? await this.getFinancialInsights(request.customerId)
        : [];

      const summary: DashboardSummary = {
        customerId: request.customerId,
        totalBalance,
        totalAccounts,
        recentTransactions,
        monthlySpending,
        monthlyIncome,
        alerts,
        quickActions,
        insights,
        lastUpdated: new Date(),
      };

      // Cache for 5 minutes
      await this.cacheManager.set(cacheKey, summary, 300);

      return summary;

    } catch (error) {
      this.logger.error(`Dashboard summary failed: ${(error as Error).message}`);
      throw error;
    }
  }

  async getAccountDetails(customerId: string, accountId: string): Promise<{
    account: CustomerAccount;
    recentTransactions: TransactionSummary[];
    monthlyBalance: { date: string; balance: number }[];
    spendingByCategory: SpendingCategory[];
  }> {
    this.logger.log(`Getting account details for ${accountId}`);

    const account = Array.from(this.accounts.values()).find(acc => 
      acc.id === accountId && acc.customerId === customerId
    );

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const recentTransactions = await this.getAccountTransactions(accountId, 20);
    const monthlyBalance = await this.getBalanceHistory(accountId, 'month');
    const spendingByCategory = await this.getSpendingByCategory(accountId, 'month');

    return {
      account,
      recentTransactions,
      monthlyBalance,
      spendingByCategory,
    };
  }

  // ===== BALANCE MANAGEMENT =====

  async getBalanceHistory(
    accountId: string, 
    period: 'day' | 'week' | 'month' | 'quarter' | 'year'
  ): Promise<{ date: string; balance: number }[]> {
    this.logger.log(`Getting balance history for account ${accountId}, period: ${period}`);

    // Mock balance history generation
    const days = this.getPeriodDays(period);
    const history = [];
    const baseBalance = 5000;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const variation = (Math.random() - 0.5) * 1000;
      const balance = Math.max(0, baseBalance + variation * (days - i) / days);
      
      history.push({
        date: date.toISOString().split('T')[0],
        balance: Math.round(balance * 100) / 100,
      });
    }

    return history;
  }

  async setBalanceAlert(request: AlertConfigRequest): Promise<{ success: boolean; alertId: string }> {
    this.logger.log(`Setting balance alert for account ${request.accountId}`);

    const alertId = `alert_${nanoid(8)}`;
    const alert: BalanceAlert = {
      id: alertId,
      customerId: request.customerId,
      accountId: request.accountId,
      alertType: request.alertType,
      threshold: request.threshold,
      currentValue: 0, // Will be updated by monitoring
      message: this.generateAlertMessage(request.alertType, request.threshold),
      severity: this.getAlertSeverity(request.alertType),
      isActive: request.enabled,
      triggeredAt: new Date(),
    };

    // Store alert
    const customerAlerts = this.alerts.get(request.customerId) || [];
    customerAlerts.push(alert);
    this.alerts.set(request.customerId, customerAlerts);

    // Emit alert setup event
    this.eventEmitter.emit('dashboard.alert_created', {
      customerId: request.customerId,
      accountId: request.accountId,
      alertType: request.alertType,
      threshold: request.threshold,
    });

    return { success: true, alertId };
  }

  // ===== FINANCIAL INSIGHTS =====

  async getFinancialInsights(customerId: string): Promise<FinancialInsight[]> {
    this.logger.log(`Getting financial insights for customer ${customerId}`);

    // Check cache
    const cacheKey = `insights_${customerId}`;
    const cached = await this.cacheManager.get<FinancialInsight[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const insights: FinancialInsight[] = [];
    const accounts = await this.getCustomerAccounts(customerId);
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

    // Spending pattern insight
    insights.push({
      id: `insight_${nanoid(6)}`,
      customerId,
      type: InsightType.SPENDING_PATTERN,
      title: 'Your Spending This Month',
      description: `You've spent GHS 1,245 this month, which is 15% less than last month.`,
      value: 1245,
      previousValue: 1465,
      changePercentage: -15,
      period: 'month',
      actionable: true,
      recommendations: [
        'Continue your great spending discipline',
        'Consider saving the extra GHS 220 you saved',
      ],
      createdAt: new Date(),
    });

    // Saving opportunity insight
    insights.push({
      id: `insight_${nanoid(6)}`,
      customerId,
      type: InsightType.SAVING_OPPORTUNITY,
      title: 'Saving Opportunity Detected',
      description: `Based on your income and expenses, you could save an additional GHS 350 monthly.`,
      value: 350,
      period: 'month',
      actionable: true,
      recommendations: [
        'Set up an automatic savings plan',
        'Consider opening a high-yield savings account',
        'Reduce dining out by 20% to save GHS 120',
      ],
      createdAt: new Date(),
    });

    // Cash flow insight
    if (totalBalance > 10000) {
      insights.push({
        id: `insight_${nanoid(6)}`,
        customerId,
        type: InsightType.CASH_FLOW,
        title: 'Strong Cash Position',
        description: `Your account balance is healthy. Consider investment opportunities.`,
        value: totalBalance,
        period: 'current',
        actionable: true,
        recommendations: [
          'Explore fixed deposit options for better returns',
          'Consider diversifying with investment products',
        ],
        createdAt: new Date(),
      });
    }

    // Cache insights for 1 hour
    await this.cacheManager.set(cacheKey, insights, 3600);

    return insights;
  }

  async getSpendingAnalysis(request: SpendingAnalysisRequest): Promise<{
    totalSpending: number;
    categories: SpendingCategory[];
    trends: { date: string; amount: number }[];
    comparison: { period: string; amount: number; change: number }[];
  }> {
    this.logger.log(`Getting spending analysis for customer ${request.customerId}`);

    // Mock spending data
    const categories: SpendingCategory[] = [
      {
        category: 'Food & Dining',
        amount: 450,
        percentage: 36,
        transactionCount: 23,
        trend: 'up',
        budget: 500,
        budgetUsed: 90,
      },
      {
        category: 'Transportation',
        amount: 320,
        percentage: 26,
        transactionCount: 15,
        trend: 'stable',
        budget: 300,
        budgetUsed: 107,
      },
      {
        category: 'Shopping',
        amount: 280,
        percentage: 22,
        transactionCount: 8,
        trend: 'down',
        budget: 400,
        budgetUsed: 70,
      },
      {
        category: 'Utilities',
        amount: 195,
        percentage: 16,
        transactionCount: 5,
        trend: 'stable',
        budget: 200,
        budgetUsed: 98,
      },
    ];

    const totalSpending = categories.reduce((sum, cat) => sum + cat.amount, 0);

    // Generate daily trends for the period
    const days = this.getPeriodDays(request.period);
    const trends = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trends.push({
        date: date.toISOString().split('T')[0],
        amount: Math.round((Math.random() * 100 + 20) * 100) / 100,
      });
    }

    // Comparison data
    const comparison = [
      { period: 'This Month', amount: totalSpending, change: 0 },
      { period: 'Last Month', amount: 1465, change: -15 },
      { period: 'This Quarter', amount: 3850, change: -8 },
      { period: 'Last Quarter', amount: 4180, change: -8 },
    ];

    return {
      totalSpending,
      categories,
      trends,
      comparison,
    };
  }

  // ===== ACCOUNT MANAGEMENT =====

  async getCustomerAccounts(customerId: string): Promise<CustomerAccount[]> {
    const customerAccounts = Array.from(this.accounts.values()).filter(
      account => account.customerId === customerId
    );

    return customerAccounts.sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return b.currentBalance - a.currentBalance;
    });
  }

  async getAccountTransactions(accountId: string, limit: number = 50): Promise<TransactionSummary[]> {
    const transactions = this.transactions.get(accountId) || [];
    return transactions
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }

  async searchTransactions(
    customerId: string,
    filters: {
      accountId?: string;
      type?: TransactionType;
      category?: string;
      minAmount?: number;
      maxAmount?: number;
      startDate?: Date;
      endDate?: Date;
      searchText?: string;
    },
    pagination: { page: number; limit: number }
  ): Promise<{
    transactions: TransactionSummary[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    this.logger.log(`Searching transactions for customer ${customerId}`);

    let allTransactions: TransactionSummary[] = [];

    if (filters.accountId) {
      allTransactions = this.transactions.get(filters.accountId) || [];
    } else {
      // Get transactions from all customer accounts
      const accounts = await this.getCustomerAccounts(customerId);
      for (const account of accounts) {
        const accountTransactions = this.transactions.get(account.id) || [];
        allTransactions.push(...accountTransactions);
      }
    }

    // Apply filters
    const filteredTransactions = allTransactions.filter(transaction => {
      if (filters.type && transaction.type !== filters.type) return false;
      if (filters.category && transaction.category !== filters.category) return false;
      if (filters.minAmount && transaction.amount < filters.minAmount) return false;
      if (filters.maxAmount && transaction.amount > filters.maxAmount) return false;
      if (filters.startDate && transaction.date < filters.startDate) return false;
      if (filters.endDate && transaction.date > filters.endDate) return false;
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        if (!transaction.description.toLowerCase().includes(searchLower)) return false;
      }
      return true;
    });

    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    const total = filteredTransactions.length;
    const totalPages = Math.ceil(total / pagination.limit);
    const offset = (pagination.page - 1) * pagination.limit;
    const transactions = filteredTransactions.slice(offset, offset + pagination.limit);

    return {
      transactions,
      total,
      page: pagination.page,
      totalPages,
    };
  }

  // ===== QUICK ACTIONS =====

  async getQuickActions(customerId: string): Promise<QuickAction[]> {
    const baseActions: QuickAction[] = [
      {
        id: 'transfer',
        type: QuickActionType.TRANSFER_MONEY,
        title: 'Transfer Money',
        description: 'Send money to another account',
        icon: 'transfer',
        enabled: true,
        requiresAuth: true,
        endpoint: '/mobile/transfers',
      },
      {
        id: 'pay_bill',
        type: QuickActionType.PAY_BILL,
        title: 'Pay Bills',
        description: 'Pay utilities and services',
        icon: 'bill',
        enabled: true,
        requiresAuth: true,
        endpoint: '/mobile/bills',
      },
      {
        id: 'buy_airtime',
        type: QuickActionType.BUY_AIRTIME,
        title: 'Buy Airtime',
        description: 'Top up mobile credit',
        icon: 'phone',
        enabled: true,
        requiresAuth: true,
        endpoint: '/mobile/airtime',
      },
      {
        id: 'check_balance',
        type: QuickActionType.CHECK_BALANCE,
        title: 'Check Balance',
        description: 'View account balances',
        icon: 'balance',
        enabled: true,
        requiresAuth: false,
        endpoint: '/mobile/balance',
      },
      {
        id: 'statements',
        type: QuickActionType.VIEW_STATEMENTS,
        title: 'Statements',
        description: 'Download account statements',
        icon: 'document',
        enabled: true,
        requiresAuth: true,
        endpoint: '/mobile/statements',
      },
      {
        id: 'request_loan',
        type: QuickActionType.REQUEST_LOAN,
        title: 'Request Loan',
        description: 'Apply for personal loan',
        icon: 'loan',
        enabled: true,
        requiresAuth: true,
        endpoint: '/mobile/loans',
      },
    ];

    return baseActions;
  }

  // ===== ALERTS & NOTIFICATIONS =====

  async getActiveAlerts(customerId: string): Promise<AlertSummary[]> {
    const customerAlerts = this.alerts.get(customerId) || [];
    
    return customerAlerts
      .filter(alert => alert.isActive)
      .map(alert => ({
        id: alert.id,
        type: alert.alertType,
        message: alert.message,
        severity: alert.severity,
        isActive: alert.isActive,
        createdAt: alert.triggeredAt,
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);
  }

  async acknowledgeAlert(customerId: string, alertId: string): Promise<{ success: boolean }> {
    const customerAlerts = this.alerts.get(customerId) || [];
    const alert = customerAlerts.find(a => a.id === alertId);

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    alert.acknowledgedAt = new Date();
    alert.isActive = false;

    this.alerts.set(customerId, customerAlerts);

    this.eventEmitter.emit('dashboard.alert_acknowledged', {
      customerId,
      alertId,
      alertType: alert.alertType,
    });

    return { success: true };
  }

  // ===== PRIVATE HELPER METHODS =====

  private async getRecentTransactions(customerId: string, limit: number): Promise<TransactionSummary[]> {
    const allTransactions: TransactionSummary[] = [];
    
    const accounts = await this.getCustomerAccounts(customerId);
    for (const account of accounts) {
      const accountTransactions = this.transactions.get(account.id) || [];
      allTransactions.push(...accountTransactions);
    }

    return allTransactions
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }

  private async getMonthlyMetrics(customerId: string): Promise<{
    monthlySpending: number;
    monthlyIncome: number;
  }> {
    const transactions = await this.getRecentTransactions(customerId, 1000);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyTransactions = transactions.filter(t => 
      t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear
    );

    const spending = monthlyTransactions
      .filter(t => [TransactionType.WITHDRAWAL, TransactionType.PAYMENT, TransactionType.FEE].includes(t.type))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const income = monthlyTransactions
      .filter(t => [TransactionType.DEPOSIT, TransactionType.INTEREST].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      monthlySpending: Math.round(spending * 100) / 100,
      monthlyIncome: Math.round(income * 100) / 100,
    };
  }

  private async getSpendingByCategory(accountId: string, period: string): Promise<SpendingCategory[]> {
    // Mock implementation
    return [
      {
        category: 'Food & Dining',
        amount: 450,
        percentage: 36,
        transactionCount: 23,
        trend: 'up',
        budget: 500,
        budgetUsed: 90,
      },
      {
        category: 'Transportation',
        amount: 320,
        percentage: 26,
        transactionCount: 15,
        trend: 'stable',
        budget: 300,
        budgetUsed: 107,
      },
    ];
  }

  private getPeriodDays(period: string): number {
    switch (period) {
      case 'day': return 1;
      case 'week': return 7;
      case 'month': return 30;
      case 'quarter': return 90;
      case 'year': return 365;
      default: return 30;
    }
  }

  private generateAlertMessage(alertType: AlertType, threshold: number): string {
    switch (alertType) {
      case AlertType.LOW_BALANCE:
        return `Account balance is below GHS ${threshold}`;
      case AlertType.HIGH_SPENDING:
        return `Monthly spending exceeded GHS ${threshold}`;
      case AlertType.BUDGET_EXCEEDED:
        return `Budget limit of GHS ${threshold} exceeded`;
      default:
        return `Alert triggered for threshold GHS ${threshold}`;
    }
  }

  private getAlertSeverity(alertType: AlertType): AlertSeverity {
    switch (alertType) {
      case AlertType.LOW_BALANCE:
        return AlertSeverity.HIGH;
      case AlertType.HIGH_SPENDING:
        return AlertSeverity.MEDIUM;
      case AlertType.UNUSUAL_ACTIVITY:
        return AlertSeverity.CRITICAL;
      default:
        return AlertSeverity.MEDIUM;
    }
  }

  private initializeMockData(): void {
    // Initialize mock accounts and transactions for demo
    const customerId = 'cust_demo_001';
    
    // Mock accounts
    const accounts: CustomerAccount[] = [
      {
        id: 'acc_001',
        customerId,
        accountNumber: '1234567001',
        accountType: AccountType.SAVINGS,
        accountName: 'My Savings',
        currency: 'GHS',
        currentBalance: 15750.50,
        availableBalance: 15750.50,
        blockedAmount: 0,
        status: AccountStatus.ACTIVE,
        isDefault: true,
        createdAt: new Date('2024-01-15'),
        lastTransactionAt: new Date(),
        metadata: {},
      },
      {
        id: 'acc_002',
        customerId,
        accountNumber: '1234567002',
        accountType: AccountType.CURRENT,
        accountName: 'Current Account',
        currency: 'GHS',
        currentBalance: 8420.75,
        availableBalance: 8420.75,
        blockedAmount: 0,
        status: AccountStatus.ACTIVE,
        isDefault: false,
        createdAt: new Date('2024-02-01'),
        lastTransactionAt: new Date(),
        metadata: {},
      },
    ];

    accounts.forEach(account => {
      this.accounts.set(account.id, account);
    });

    // Mock transactions
    const mockTransactions: TransactionSummary[] = [
      {
        id: 'txn_001',
        accountId: 'acc_001',
        type: TransactionType.DEPOSIT,
        amount: 2000,
        currency: 'GHS',
        description: 'Salary Payment',
        category: 'Income',
        date: new Date(),
        status: TransactionStatus.COMPLETED,
        balance: 15750.50,
      },
      {
        id: 'txn_002',
        accountId: 'acc_001',
        type: TransactionType.WITHDRAWAL,
        amount: -250,
        currency: 'GHS',
        description: 'ATM Withdrawal',
        category: 'Cash',
        date: new Date(Date.now() - 86400000),
        status: TransactionStatus.COMPLETED,
        balance: 13750.50,
      },
    ];

    this.transactions.set('acc_001', mockTransactions);
    this.transactions.set('acc_002', []);

    this.logger.log('Mock data initialized for mobile dashboard');
  }
}

// Note: All interfaces are already exported with 'export interface' declarations above