// Customer UI Types - Comprehensive interfaces from backend DTOs
export interface Customer {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth?: string;
  address?: {
    street?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country: string;
  };
  idNumber?: string;
  idType?: 'national_id' | 'passport' | 'drivers_license' | 'voter_id';
  profilePicture?: string;
  status: CustomerStatus;
  kycStatus: KycStatus;
  verificationStatus: VerificationStatus;
  accountBalance: number;
  accounts: Account[];
  riskScore?: number;
  createdAt: string;
  updatedAt: string;
  lastTransactionAt?: string;
  agentId: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export type CustomerStatus = 'active' | 'inactive' | 'suspended' | 'pending';
export type KycStatus = 'pending' | 'verified' | 'rejected' | 'in_review';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface Account {
  id: string;
  accountNumber: string;
  balance: number;
  currency: string;
  accountType: AccountType;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
  lastTransactionAt?: string;
}

export type AccountType = 'savings' | 'checking' | 'mobile_money' | 'loan' | 'investment';
export type AccountStatus = 'active' | 'inactive' | 'frozen' | 'closed';

export interface CustomerListResponse {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerQuery {
  search?: string;
  status?: CustomerStatus;
  kycStatus?: KycStatus;
  verificationStatus?: VerificationStatus;
  agentId?: string;
  page?: number;
  limit?: number;
  sortBy?: CustomerSortField;
  sortOrder?: 'asc' | 'desc';
  filters?: CustomerFilters;
}

export type CustomerSortField = 'firstName' | 'lastName' | 'createdAt' | 'lastTransactionAt' | 'accountBalance' | 'phone';

export interface CustomerFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  balanceRange?: {
    min: number;
    max: number;
  };
  hasTransactions?: boolean;
  accountTypes?: AccountType[];
  riskLevel?: RiskLevel[];
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface CustomerSearchState {
  query: string;
  filters: CustomerFilters;
  sortBy: CustomerSortField;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface CustomerTransaction {
  id: string;
  customerId: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  description?: string;
  reference: string;
  agentId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}

export type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'fee' | 'interest' | 'loan_disbursement' | 'loan_repayment';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'processing';

export interface CustomerRiskAssessment {
  customerId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  factors: RiskFactor[];
  lastAssessmentAt: string;
  nextAssessmentDue: string;
}

export interface RiskFactor {
  factor: string;
  weight: number;
  score: number;
  description: string;
}

export interface CustomerDocument {
  id: string;
  customerId: string;
  fileName: string;
  documentType: DocumentType;
  status: DocumentStatus;
  uploadDate: string;
  verifiedAt?: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
}

export type DocumentType = 'national_id' | 'passport' | 'drivers_license' | 'proof_of_address' | 'bank_statement' | 'other';
export type DocumentStatus = 'uploaded' | 'pending' | 'verified' | 'rejected';

export interface CustomerStats {
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  averageTransactionAmount: number;
  lastTransactionDate?: string;
  accountBalance: number;
  monthlyTransactionCount: number;
  lifetimeValue: number;
}

export interface CreateCustomerRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  address?: {
    street?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country: string;
  };
  idNumber?: string;
  idType?: 'national_id' | 'passport' | 'drivers_license' | 'voter_id';
  initialDeposit?: number;
  agentId?: string;
}

export interface UpdateCustomerRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: {
    street?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country: string;
  };
  idNumber?: string;
  idType?: 'national_id' | 'passport' | 'drivers_license' | 'voter_id';
  status?: CustomerStatus;
}

export interface CustomerExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  fields: string[];
  filters?: CustomerFilters;
  includeTransactions?: boolean;
}

export interface BulkCustomerOperation {
  operation: 'update_status' | 'export' | 'assign_agent' | 'send_notification';
  customerIds: string[];
  data?: Record<string, any>;
}

// UI State interfaces
export interface CustomerUIState {
  searchState: CustomerSearchState;
  selectedCustomers: string[];
  isLoading: boolean;
  error: string | null;
  activeModal: CustomerModal | null;
  currentCustomer: Customer | null;
}

export type CustomerModal = 'details' | 'edit' | 'transactions' | 'documents' | 'new_account' | 'risk_assessment';

export interface CustomerCardProps {
  customer: Customer;
  onSelect?: (customerId: string) => void;
  onAction?: (action: string, customerId: string) => void;
  isSelected?: boolean;
  showActions?: boolean;
}

export interface CustomerSearchProps {
  onSearch?: (query: CustomerQuery) => void;
  initialQuery?: CustomerQuery;
  showFilters?: boolean;
  showExport?: boolean;
}