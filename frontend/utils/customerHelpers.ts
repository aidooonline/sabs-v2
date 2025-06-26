import type {
  Customer,
  CustomerStatus,
  VerificationStatus,
  KycStatus,
  AccountStatus,
  RiskLevel,
  CustomerFilters,
  CustomerQuery,
  CustomerSortField
} from '../types/customer';

/**
 * Utility functions for customer data management
 */

// Format customer name
export const formatCustomerName = (customer: Customer): string => {
  return `${customer.firstName} ${customer.lastName}`.trim();
};

// Format customer phone number
export const formatPhoneNumber = (phone: string): string => {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Format Ghana phone numbers
  if (digits.startsWith('233')) {
    // International format: +233 XX XXX XXXX
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  } else if (digits.startsWith('0') && digits.length === 10) {
    // Local format: 0XX XXX XXXX
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  
  return phone; // Return original if format not recognized
};

// Get verification status color and text
export const getVerificationStatusInfo = (status: VerificationStatus) => {
  const statusMap = {
    verified: { color: 'text-customer-verified', bgColor: 'bg-customer-verified', text: 'Verified' },
    pending: { color: 'text-customer-pending', bgColor: 'bg-customer-pending', text: 'Pending' },
    unverified: { color: 'text-customer-unverified', bgColor: 'bg-customer-unverified', text: 'Unverified' },
    rejected: { color: 'text-customer-unverified', bgColor: 'bg-customer-unverified', text: 'Rejected' },
  };
  
  return statusMap[status] || statusMap.unverified;
};

// Get customer status info
export const getCustomerStatusInfo = (status: CustomerStatus) => {
  const statusMap = {
    active: { color: 'text-green-600', bgColor: 'bg-green-100', text: 'Active', badgeClass: 'verification-badge-verified' },
    inactive: { color: 'text-gray-600', bgColor: 'bg-gray-100', text: 'Inactive', badgeClass: 'verification-badge-pending' },
    suspended: { color: 'text-red-600', bgColor: 'bg-red-100', text: 'Suspended', badgeClass: 'verification-badge-rejected' },
    pending: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', text: 'Pending', badgeClass: 'verification-badge-pending' },
  };
  
  return statusMap[status] || statusMap.pending;
};

// Get account status info
export const getAccountStatusInfo = (status: AccountStatus) => {
  const statusMap = {
    active: { color: 'text-green-600', indicator: 'account-status-active', text: 'Active' },
    inactive: { color: 'text-gray-600', indicator: 'account-status-inactive', text: 'Inactive' },
    frozen: { color: 'text-yellow-600', indicator: 'account-status-frozen', text: 'Frozen' },
    closed: { color: 'text-red-600', indicator: 'account-status-closed', text: 'Closed' },
  };
  
  return statusMap[status] || statusMap.inactive;
};

// Get risk level info
export const getRiskLevelInfo = (riskLevel: RiskLevel) => {
  const riskMap = {
    low: { color: 'text-green-600', bgColor: 'bg-green-100', text: 'Low Risk', indicator: 'risk-indicator-low' },
    medium: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', text: 'Medium Risk', indicator: 'risk-indicator-medium' },
    high: { color: 'text-orange-600', bgColor: 'bg-orange-100', text: 'High Risk', indicator: 'risk-indicator-high' },
    critical: { color: 'text-red-600', bgColor: 'bg-red-100', text: 'Critical Risk', indicator: 'risk-indicator-critical' },
  };
  
  return riskMap[riskLevel] || riskMap.medium;
};

// Calculate customer risk level based on various factors
export const calculateCustomerRiskLevel = (customer: Customer): RiskLevel => {
  let riskScore = 0;
  
  // Verification status impact
  if (customer.verificationStatus === 'unverified') riskScore += 3;
  else if (customer.verificationStatus === 'pending') riskScore += 2;
  else if (customer.verificationStatus === 'rejected') riskScore += 4;
  
  // Account balance impact (very high or very low balances increase risk)
  if (customer.accountBalance > 100000) riskScore += 2; // Very high balance
  if (customer.accountBalance < 0) riskScore += 3; // Negative balance
  
  // Customer status impact
  if (customer.status === 'suspended') riskScore += 4;
  else if (customer.status === 'inactive') riskScore += 1;
  
  // Account count impact (too many accounts can be risky)
  if (customer.accounts && customer.accounts.length > 5) riskScore += 2;
  
  // Return risk level based on score
  if (riskScore >= 8) return 'critical';
  if (riskScore >= 5) return 'high';
  if (riskScore >= 2) return 'medium';
  return 'low';
};

// Format currency
export const formatCurrency = (amount: number, currency: string = 'GHS'): string => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

// Format date for display
export const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions): string => {
  const date = new Date(dateString);
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  
  return new Intl.DateTimeFormat('en-GH', defaultOptions).format(date);
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(dateString);
};

// Search and filter utilities
export const filterCustomers = (customers: Customer[], filters: CustomerFilters): Customer[] => {
  return customers.filter(customer => {
    // Date range filter
    if (filters.dateRange) {
      const customerDate = new Date(customer.createdAt);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      
      if (customerDate < startDate || customerDate > endDate) {
        return false;
      }
    }
    
    // Balance range filter
    if (filters.balanceRange) {
      if (customer.accountBalance < filters.balanceRange.min || 
          customer.accountBalance > filters.balanceRange.max) {
        return false;
      }
    }
    
    // Has transactions filter
    if (filters.hasTransactions !== undefined) {
      const hasTransactions = customer.lastTransactionAt !== undefined;
      if (filters.hasTransactions !== hasTransactions) {
        return false;
      }
    }
    
    // Account types filter
    if (filters.accountTypes && filters.accountTypes.length > 0) {
      const customerAccountTypes = customer.accounts?.map(acc => acc.accountType) || [];
      const hasMatchingAccountType = filters.accountTypes.some(type => 
        customerAccountTypes.includes(type)
      );
      if (!hasMatchingAccountType) {
        return false;
      }
    }
    
    // Risk level filter
    if (filters.riskLevel && filters.riskLevel.length > 0) {
      const customerRiskLevel = calculateCustomerRiskLevel(customer);
      if (!filters.riskLevel.includes(customerRiskLevel)) {
        return false;
      }
    }
    
    return true;
  });
};

// Sort customers
export const sortCustomers = (
  customers: Customer[], 
  sortBy: CustomerSortField, 
  sortOrder: 'asc' | 'desc'
): Customer[] => {
  return [...customers].sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    switch (sortBy) {
      case 'firstName':
        aValue = a.firstName.toLowerCase();
        bValue = b.firstName.toLowerCase();
        break;
      case 'lastName':
        aValue = a.lastName.toLowerCase();
        bValue = b.lastName.toLowerCase();
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case 'lastTransactionAt':
        aValue = a.lastTransactionAt ? new Date(a.lastTransactionAt) : new Date(0);
        bValue = b.lastTransactionAt ? new Date(b.lastTransactionAt) : new Date(0);
        break;
      case 'accountBalance':
        aValue = a.accountBalance;
        bValue = b.accountBalance;
        break;
      case 'phone':
        aValue = a.phone;
        bValue = b.phone;
        break;
      default:
        aValue = a.firstName.toLowerCase();
        bValue = b.firstName.toLowerCase();
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
};

// Search customers
export const searchCustomers = (customers: Customer[], query: string): Customer[] => {
  if (!query.trim()) return customers;
  
  const searchTerm = query.toLowerCase().trim();
  
  return customers.filter(customer => {
    // Search in name
    const fullName = formatCustomerName(customer).toLowerCase();
    if (fullName.includes(searchTerm)) return true;
    
    // Search in phone
    if (customer.phone.includes(searchTerm)) return true;
    
    // Search in email
    if (customer.email && customer.email.toLowerCase().includes(searchTerm)) return true;
    
    // Search in ID number
    if (customer.idNumber && customer.idNumber.toLowerCase().includes(searchTerm)) return true;
    
    // Search in account numbers
    if (customer.accounts) {
      const accountMatch = customer.accounts.some(account => 
        account.accountNumber.toLowerCase().includes(searchTerm)
      );
      if (accountMatch) return true;
    }
    
    return false;
  });
};

// Validate customer data
export const validateCustomerData = (customer: Partial<Customer>) => {
  const errors: Record<string, string> = {};
  
  if (!customer.firstName?.trim()) {
    errors.firstName = 'First name is required';
  }
  
  if (!customer.lastName?.trim()) {
    errors.lastName = 'Last name is required';
  }
  
  if (!customer.phone?.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!/^(\+233|0)[0-9]{9}$/.test(customer.phone.replace(/\s/g, ''))) {
    errors.phone = 'Please enter a valid Ghana phone number';
  }
  
  if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Generate customer display ID (shorter version for UI)
export const generateCustomerDisplayId = (customer: Customer): string => {
  const prefix = customer.firstName.charAt(0).toUpperCase() + customer.lastName.charAt(0).toUpperCase();
  const suffix = customer.id.slice(-6).toUpperCase();
  return `${prefix}${suffix}`;
};

// Check if customer can be edited based on status
export const canEditCustomer = (customer: Customer): boolean => {
  return customer.status !== 'suspended' && customer.verificationStatus !== 'rejected';
};

// Check if customer can create new accounts
export const canCreateAccount = (customer: Customer): boolean => {
  return customer.status === 'active' && customer.verificationStatus === 'verified';
};

// Get customer activity status
export const getCustomerActivityStatus = (customer: Customer): {
  status: 'active' | 'inactive' | 'new';
  text: string;
  color: string;
} => {
  const now = new Date();
  const createdAt = new Date(customer.createdAt);
  const lastTransaction = customer.lastTransactionAt ? new Date(customer.lastTransactionAt) : null;
  
  // New customer (created within last 7 days)
  const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceCreation <= 7) {
    return { status: 'new', text: 'New Customer', color: 'text-blue-600' };
  }
  
  // Active customer (transaction within last 30 days)
  if (lastTransaction) {
    const daysSinceLastTransaction = Math.floor((now.getTime() - lastTransaction.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastTransaction <= 30) {
      return { status: 'active', text: 'Active', color: 'text-green-600' };
    }
  }
  
  // Inactive customer
  return { status: 'inactive', text: 'Inactive', color: 'text-gray-600' };
};

// Export utility object for easier importing
export const customerUtils = {
  formatCustomerName,
  formatPhoneNumber,
  getVerificationStatusInfo,
  getCustomerStatusInfo,
  getAccountStatusInfo,
  getRiskLevelInfo,
  calculateCustomerRiskLevel,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  filterCustomers,
  sortCustomers,
  searchCustomers,
  validateCustomerData,
  generateCustomerDisplayId,
  canEditCustomer,
  canCreateAccount,
  getCustomerActivityStatus,
};