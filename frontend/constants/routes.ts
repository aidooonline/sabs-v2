// Application routes
export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',

  // Dashboard routes
  DASHBOARD: '/dashboard',
  
  // Customer management routes
  CUSTOMERS: '/dashboard/customers',
  CUSTOMER_DETAIL: (id: string) => `/dashboard/customers/${id}`,
  CREATE_CUSTOMER: '/dashboard/customers/create',
  EDIT_CUSTOMER: (id: string) => `/dashboard/customers/${id}/edit`,

  // Transaction routes
  TRANSACTIONS: '/dashboard/transactions',
  TRANSACTION_DETAIL: (id: string) => `/dashboard/transactions/${id}`,
  CREATE_TRANSACTION: '/dashboard/transactions/create',
  TRANSACTION_HISTORY: '/dashboard/transactions/history',
  PENDING_APPROVALS: '/dashboard/transactions/pending',

  // User management routes
  USERS: '/dashboard/users',
  USER_DETAIL: (id: string) => `/dashboard/users/${id}`,
  CREATE_USER: '/dashboard/users/create',
  EDIT_USER: (id: string) => `/dashboard/users/${id}/edit`,
  USER_PROFILE: '/dashboard/profile',

  // Reports routes
  REPORTS: '/dashboard/reports',
  DAILY_REPORTS: '/dashboard/reports/daily',
  MONTHLY_REPORTS: '/dashboard/reports/monthly',
  TRANSACTION_REPORTS: '/dashboard/reports/transactions',
  COMMISSION_REPORTS: '/dashboard/reports/commissions',

  // Settings routes
  SETTINGS: '/dashboard/settings',
  COMPANY_SETTINGS: '/dashboard/settings/company',
  SECURITY_SETTINGS: '/dashboard/settings/security',
  NOTIFICATION_SETTINGS: '/dashboard/settings/notifications',

  // Agent specific routes
  AGENT_DASHBOARD: '/dashboard/agent',
  AGENT_TRANSACTIONS: '/dashboard/agent/transactions',
  AGENT_CUSTOMERS: '/dashboard/agent/customers',
  AGENT_COMMISSIONS: '/dashboard/agent/commissions',

  // Clerk specific routes
  CLERK_DASHBOARD: '/dashboard/clerk',
  CLERK_APPROVALS: '/dashboard/clerk/approvals',
  CLERK_RECONCILIATION: '/dashboard/clerk/reconciliation',
  CASH_MANAGEMENT: '/dashboard/clerk/cash',

  // Admin specific routes
  ADMIN_DASHBOARD: '/dashboard/admin',
  ADMIN_USERS: '/dashboard/admin/users',
  ADMIN_COMPANIES: '/dashboard/admin/companies',
  ADMIN_SYSTEM: '/dashboard/admin/system',
} as const;

// API endpoints
export const API_ROUTES = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    PROFILE: '/auth/profile',
  },

  // Customers
  CUSTOMERS: {
    BASE: '/customers',
    SEARCH: '/customers/search',
    SUMMARY: '/customers/summary',
    BY_ID: (id: string) => `/customers/${id}`,
    TRANSACTIONS: (id: string) => `/customers/${id}/transactions`,
    KYC: (id: string) => `/customers/${id}/kyc`,
    STATUS: (id: string) => `/customers/${id}/status`,
  },

  // Transactions
  TRANSACTIONS: {
    BASE: '/transactions',
    PENDING: '/transactions/pending',
    APPROVE: (id: string) => `/transactions/${id}/approve`,
    REVERSE: (id: string) => `/transactions/${id}/reverse`,
    RECEIPT: (id: string) => `/transactions/${id}/receipt`,
    SUMMARY: '/transactions/summary',
  },

  // Users
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    SUMMARY: '/users/summary',
    STATUS: (id: string) => `/users/${id}/status`,
  },

  // Reports
  REPORTS: {
    DAILY: '/reports/daily',
    MONTHLY: '/reports/monthly',
    TRANSACTIONS: '/reports/transactions',
    COMMISSIONS: '/reports/commissions',
  },
} as const;

// Route helper functions
export const isPublicRoute = (pathname: string): boolean => {
  const publicRoutes: string[] = [
    ROUTES.HOME,
    ROUTES.LOGIN,
    ROUTES.REGISTER,
    ROUTES.FORGOT_PASSWORD,
    ROUTES.RESET_PASSWORD,
    ROUTES.VERIFY_EMAIL,
  ];
  return publicRoutes.includes(pathname);
};

export const isDashboardRoute = (pathname: string): boolean => {
  return pathname.startsWith('/dashboard');
};

export const getRouteTitle = (pathname: string): string => {
  const routeTitles: Record<string, string> = {
    [ROUTES.HOME]: 'Home',
    [ROUTES.LOGIN]: 'Login',
    [ROUTES.DASHBOARD]: 'Dashboard',
    [ROUTES.CUSTOMERS]: 'Customers',
    [ROUTES.TRANSACTIONS]: 'Transactions',
    [ROUTES.USERS]: 'Users',
    [ROUTES.REPORTS]: 'Reports',
    [ROUTES.SETTINGS]: 'Settings',
  };
  
  return routeTitles[pathname] || 'Sabs v2';
};