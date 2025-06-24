import React from 'react';

// Menu item interface to avoid circular dependency
export interface MenuItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  permissions?: string[];
  roles?: string[];
  category: string;
  featured?: boolean;
}

// Icon components for menu items
export const menuIcons = {
  Company: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Users: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  ),
  Customers: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Transactions: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  Settings: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Reports: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Help: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Dashboard: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Add: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Edit: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  History: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Approval: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// Default menu items configuration
export const defaultMenuItems: MenuItem[] = [
  // Company Management
  {
    id: 'company-profile',
    title: 'Company Profile',
    description: 'View and edit company information',
    icon: menuIcons.Company,
    path: '/company/profile',
    category: 'Company',
    roles: ['super_admin', 'admin'],
  },
  {
    id: 'service-credits',
    title: 'Service Credits',
    description: 'Manage SMS and transaction credits',
    icon: menuIcons.Settings,
    path: '/company/credits',
    category: 'Company',
    roles: ['super_admin', 'admin'],
    featured: true,
  },

  // User Management
  {
    id: 'staff-management',
    title: 'Staff Management',
    description: 'Add, edit, and manage staff members',
    icon: menuIcons.Users,
    path: '/users',
    category: 'Users',
    roles: ['super_admin', 'admin'],
  },
  {
    id: 'user-roles',
    title: 'User Roles',
    description: 'Configure user roles and permissions',
    icon: menuIcons.Settings,
    path: '/users/roles',
    category: 'Users',
    roles: ['super_admin', 'admin'],
  },

  // Customer Management
  {
    id: 'customers-list',
    title: 'All Customers',
    description: 'View and manage customer database',
    icon: menuIcons.Customers,
    path: '/customers',
    category: 'Customers',
    featured: true,
  },
  {
    id: 'add-customer',
    title: 'Add New Customer',
    description: 'Register a new customer',
    icon: menuIcons.Add,
    path: '/customers/new',
    category: 'Customers',
  },

  // Transactions
  {
    id: 'new-deposit',
    title: 'New Deposit',
    description: 'Process customer deposit',
    icon: menuIcons.Transactions,
    path: '/transactions/deposit',
    category: 'Transactions',
  },
  {
    id: 'new-withdrawal',
    title: 'New Withdrawal',
    description: 'Process customer withdrawal',
    icon: menuIcons.Transactions,
    path: '/transactions/withdrawal',
    category: 'Transactions',
    featured: true,
  },
  {
    id: 'transaction-history',
    title: 'Transaction History',
    description: 'View all transaction records',
    icon: menuIcons.History,
    path: '/transactions/history',
    category: 'Transactions',
  },
  {
    id: 'pending-approvals',
    title: 'Pending Approvals',
    description: 'Review pending withdrawal approvals',
    icon: menuIcons.Approval,
    path: '/transactions/approvals',
    category: 'Transactions',
    roles: ['admin', 'clerk'],
  },

  // Reports & Analytics
  {
    id: 'dashboard',
    title: 'Analytics Dashboard',
    description: 'View business analytics and insights',
    icon: menuIcons.Dashboard,
    path: '/dashboard',
    category: 'Reports',
  },
  {
    id: 'financial-reports',
    title: 'Financial Reports',
    description: 'Generate financial statements',
    icon: menuIcons.Reports,
    path: '/reports/financial',
    category: 'Reports',
    roles: ['admin', 'clerk'],
  },

  // Settings
  {
    id: 'account-settings',
    title: 'Account Settings',
    description: 'Manage your account preferences',
    icon: menuIcons.Settings,
    path: '/settings/account',
    category: 'Settings',
  },
  {
    id: 'system-settings',
    title: 'System Settings',
    description: 'Configure system preferences',
    icon: menuIcons.Settings,
    path: '/settings/system',
    category: 'Settings',
    roles: ['super_admin', 'admin'],
  },

  // Help & Support
  {
    id: 'help-center',
    title: 'Help Center',
    description: 'Get help and support',
    icon: menuIcons.Help,
    path: '/help',
    category: 'Support',
  },
];

// Quick action items (featured items subset)
export const quickActionItems: MenuItem[] = defaultMenuItems.filter(item => item.featured);

// Category-specific menu items
export const getMenuItemsByCategory = (category: string): MenuItem[] => {
  return defaultMenuItems.filter(item => item.category === category);
};

// Role-specific menu items
export const getMenuItemsByRole = (role: string): MenuItem[] => {
  return defaultMenuItems.filter(item => 
    !item.roles || item.roles.includes(role)
  );
};