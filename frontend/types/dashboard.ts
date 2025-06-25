// Dashboard TypeScript Interfaces
// Adapted from mobile-dashboard.service.ts for frontend use

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

export interface AlertSummary {
  id: string;
  type: AlertType;
  message: string;
  severity: AlertSeverity;
  isActive: boolean;
  createdAt: Date;
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

export interface TransactionSearchRequest {
  customerId: string;
  accountId?: string;
  type?: TransactionType;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: Date;
  endDate?: Date;
  searchText?: string;
  page?: number;
  limit?: number;
}

// ===== RESPONSE INTERFACES =====

export interface AccountDetailsResponse {
  account: CustomerAccount;
  recentTransactions: TransactionSummary[];
  monthlyBalance: { date: string; balance: number }[];
  spendingByCategory: SpendingCategory[];
}

export interface TransactionSearchResponse {
  transactions: TransactionSummary[];
  total: number;
  page: number;
  totalPages: number;
  filters: any;
}

export interface SpendingAnalysisResponse {
  totalSpending: number;
  categories: SpendingCategory[];
  trends: { date: string; amount: number }[];
  comparison: { period: string; amount: number; change: number }[];
}

export interface BalanceHistoryResponse {
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

export interface InsightResponse {
  insights: FinancialInsight[];
  summary: {
    totalInsights: number;
    actionableInsights: number;
    categories: { [key: string]: number };
  };
}

export interface AlertResponse {
  alerts: BalanceAlert[];
  summary: {
    totalAlerts: number;
    activeAlerts: number;
    criticalAlerts: number;
    lastTriggered?: Date;
  };
}

// ===== UTILITY TYPES =====

export type PeriodType = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type TrendType = 'up' | 'down' | 'stable';
export type LoadingState = 'idle' | 'loading' | 'succeeded' | 'failed';

// ===== UI COMPONENT PROPS =====

export interface DashboardCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: TrendType;
  loading?: boolean;
  icon?: string;
  onClick?: () => void;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface FilterOptions {
  dateRange?: { start: Date; end: Date };
  categories?: string[];
  accounts?: string[];
  transactionTypes?: TransactionType[];
}