// Transaction types
export type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'commission' | 'fee' | 'loan_disbursement' | 'loan_repayment';

// Transaction status
export type TransactionStatus = 'pending' | 'approved' | 'completed' | 'failed' | 'cancelled' | 'reversed';

// Transaction entity
export interface Transaction {
  id: string;
  companyId: string;
  customerId: string;
  agentId: string;
  clerkId?: string; // For approvals
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  reference: string;
  description?: string;
  metadata?: Record<string, any>;
  fees?: {
    agentCommission: number;
    systemFee: number;
    totalFees: number;
  };
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  approvalRequired: boolean;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  completedAt?: string;
  receiptNumber?: string;
  createdAt: string;
  updatedAt: string;
}

// Transaction creation request
export interface CreateTransactionRequest {
  customerId: string;
  type: TransactionType;
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, any>;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

// Transaction approval request
export interface ApproveTransactionRequest {
  transactionId: string;
  approved: boolean;
  comments?: string;
  pin?: string; // For additional security
}

// Transaction filters
export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  customerId?: string;
  agentId?: string;
  clerkId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  currency?: string;
  approvalRequired?: boolean;
}

// Transaction summary
export interface TransactionSummary {
  totalTransactions: number;
  totalAmount: number;
  totalFees: number;
  pendingApprovals: number;
  completedToday: number;
  failedTransactions: number;
  byType: {
    deposits: { count: number; amount: number };
    withdrawals: { count: number; amount: number };
    transfers: { count: number; amount: number };
  };
}

// Daily transaction report
export interface DailyTransactionReport {
  date: string;
  transactionCount: number;
  totalAmount: number;
  totalFees: number;
  agentCommissions: number;
  byType: Record<TransactionType, { count: number; amount: number }>;
}

// Transaction receipt data
export interface TransactionReceipt {
  transaction: Transaction;
  customer: {
    name: string;
    phone: string;
    accountBalance: number;
  };
  agent: {
    name: string;
    code: string;
  };
  company: {
    name: string;
    address: string;
    phone: string;
  };
  receiptNumber: string;
  printedAt: string;
}