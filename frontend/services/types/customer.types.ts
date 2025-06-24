// Customer entity
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
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  kycStatus: 'pending' | 'verified' | 'rejected';
  accountBalance: number;
  createdAt: string;
  updatedAt: string;
  lastTransactionAt?: string;
  agentId: string; // Agent who onboarded the customer
}

// Customer creation request
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
}

// Customer update request
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
  status?: 'active' | 'inactive' | 'suspended';
}

// Customer search filters
export interface CustomerFilters {
  status?: 'active' | 'inactive' | 'suspended' | 'pending';
  kycStatus?: 'pending' | 'verified' | 'rejected';
  agentId?: string;
  registeredFrom?: string;
  registeredTo?: string;
  hasTransactions?: boolean;
}

// Customer summary for dashboard
export interface CustomerSummary {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  pendingKyc: number;
  totalAccountBalance: number;
}

// Customer transaction history summary
export interface CustomerTransactionSummary {
  customerId: string;
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  lastTransactionDate?: string;
  averageTransactionAmount: number;
}