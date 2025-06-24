# Story 2.3: Build Main Menu Screen - Sabs v2 Frontend

## 📋 Story Overview

**Epic**: Phase 2 - Core UI Layout & Components  
**Story ID**: FRONTEND-2.3  
**Story Title**: Build Main Menu Screen  
**Story Points**: 5  
**Priority**: High  
**Status**: Ready for Development

---

## 👤 User Story

**As a** User  
**I want to** access a comprehensive main menu screen  
**So that** I can navigate to all major application sections (Company, Users, Accounts, Customers, Deposits, Withdrawals, etc.) with clear organization and quick access

---

## 🎯 Acceptance Criteria

### ✅ **AC 1: Menu Layout & Organization**
- [ ] Create main menu screen with categorized sections
- [ ] Implement sections for Company, Users, Accounts, Customers, Transactions
- [ ] Add visual grouping with clear section headers
- [ ] Support grid layout for easy scanning and selection
- [ ] Include search functionality for quick menu item access

### ✅ **AC 2: Navigation Items**
- [ ] Company management section with relevant sub-items
- [ ] Staff/Users management with role-based visibility
- [ ] Customer management and account operations
- [ ] Transaction operations (Deposits, Withdrawals, History)
- [ ] Settings and configuration options

### ✅ **AC 3: Role-Based Menu Display**
- [ ] Filter menu items based on user permissions
- [ ] Show/hide sections based on user role (Admin, Clerk, Agent)
- [ ] Display appropriate badges or indicators for restricted items
- [ ] Implement proper access control validation
- [ ] Provide clear feedback for unavailable features

### ✅ **AC 4: Visual Design & Interaction**
- [ ] Implement card-based layout for menu sections
- [ ] Add icons for visual recognition and quick identification
- [ ] Include hover and focus states for better UX
- [ ] Support touch interactions for mobile devices
- [ ] Ensure accessibility with proper ARIA labels

### ✅ **AC 5: Search & Quick Actions**
- [ ] Add search bar for filtering menu items
- [ ] Implement recent actions or quick access section
- [ ] Support keyboard shortcuts for power users
- [ ] Add breadcrumb navigation for context
- [ ] Include help/support section for guidance

---

## 🏗️ Technical Implementation Guidelines

### **Main Menu Component**

#### **Main Menu Screen (`app/(dashboard)/menu/page.tsx`)**
```typescript
'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/hooks/useUI';
import DashboardTemplate from '@/components/templates/DashboardTemplate';
import { Input } from '@/components/atoms/Input';
import { Card } from '@/components/atoms/Card';
import { cn } from '@/utils/helpers';

// Menu item interface
interface MenuItem {
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

// Icon components
const menuIcons = {
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
};

// Menu items configuration
const menuItems: MenuItem[] = [
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
    icon: menuIcons.Customers,
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
    icon: menuIcons.Transactions,
    path: '/transactions/history',
    category: 'Transactions',
  },
  {
    id: 'pending-approvals',
    title: 'Pending Approvals',
    description: 'Review pending withdrawal approvals',
    icon: menuIcons.Transactions,
    path: '/transactions/approvals',
    category: 'Transactions',
    roles: ['admin', 'clerk'],
  },

  // Reports & Analytics
  {
    id: 'dashboard',
    title: 'Analytics Dashboard',
    description: 'View business analytics and insights',
    icon: menuIcons.Reports,
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

export default function MenuPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { hasRole, hasPermission } = useAuth();
  const { updatePageTitle, updateBreadcrumbs } = useUI();

  // Set page metadata
  React.useEffect(() => {
    updatePageTitle('Main Menu');
    updateBreadcrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Menu' },
    ]);
  }, [updatePageTitle, updateBreadcrumbs]);

  // Filter menu items based on user permissions
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      // Check role-based access
      if (item.roles && !item.roles.some(role => hasRole(role))) {
        return false;
      }
      
      // Check permission-based access
      if (item.permissions && !item.permissions.some(permission => hasPermission(permission))) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [hasRole, hasPermission, searchQuery]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    filteredMenuItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredMenuItems]);

  // Featured items for quick access
  const featuredItems = useMemo(() => {
    return filteredMenuItems.filter(item => item.featured);
  }, [filteredMenuItems]);

  const handleItemClick = (item: MenuItem) => {
    router.push(item.path);
  };

  return (
    <DashboardTemplate title="Main Menu">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Search Bar */}
        <div className="w-full max-w-md">
          <Input
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        {/* Featured Items */}
        {!searchQuery && featuredItems.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onClick={() => handleItemClick(item)}
                  featured
                />
              ))}
            </div>
          </section>
        )}

        {/* Grouped Menu Items */}
        {Object.entries(groupedItems).map(([category, items]) => (
          <section key={category}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{category}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onClick={() => handleItemClick(item)}
                />
              ))}
            </div>
          </section>
        ))}

        {/* No Results */}
        {searchQuery && filteredMenuItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-500">
              Try adjusting your search query or browse the categories above.
            </p>
          </div>
        )}
      </div>
    </DashboardTemplate>
  );
}

// Menu Item Card Component
interface MenuItemCardProps {
  item: MenuItem;
  onClick: () => void;
  featured?: boolean;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onClick, featured = false }) => {
  const IconComponent = item.icon;

  return (
    <Card
      interactive
      onClick={onClick}
      className={cn(
        'h-full transition-all duration-200',
        featured && 'ring-2 ring-primary-200 bg-primary-50'
      )}
    >
      <div className="flex items-start space-x-3">
        <div className={cn(
          'flex-shrink-0 p-2 rounded-lg',
          featured 
            ? 'bg-primary-100 text-primary-600' 
            : 'bg-gray-100 text-gray-600'
        )}>
          <IconComponent className="w-6 h-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {item.title}
          </h3>
          {item.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
```

---

## 🧪 Testing Implementation

### **Menu Screen Tests**
```typescript
import React from 'react';
import { render, screen, fireEvent } from '@/utils/test-utils';
import { useRouter } from 'next/navigation';
import MenuPage from '../page';

// Mock hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    hasRole: jest.fn(() => true),
    hasPermission: jest.fn(() => true),
  }),
}));

describe('Menu Page', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    jest.clearAllMocks();
  });

  it('renders menu categories and items', () => {
    render(<MenuPage />);
    
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
  });

  it('filters items based on search query', () => {
    render(<MenuPage />);
    
    const searchInput = screen.getByPlaceholderText('Search menu items...');
    fireEvent.change(searchInput, { target: { value: 'customer' } });
    
    expect(screen.getByText('All Customers')).toBeInTheDocument();
    expect(screen.getByText('Add New Customer')).toBeInTheDocument();
  });

  it('navigates when menu items are clicked', () => {
    render(<MenuPage />);
    
    fireEvent.click(screen.getByText('All Customers'));
    expect(mockPush).toHaveBeenCalledWith('/customers');
  });
});
```

---

## 📝 Definition of Done

### **Menu Implementation**
- [ ] Main menu screen with categorized sections
- [ ] Role-based menu item filtering
- [ ] Search functionality for menu items
- [ ] Card-based layout with proper interactions
- [ ] Featured items section for quick access

### **Navigation & Organization**
- [ ] Logical grouping by functional areas
- [ ] Clear visual hierarchy and organization
- [ ] Responsive grid layout for all screen sizes
- [ ] Proper routing integration with Next.js
- [ ] Breadcrumb navigation updates

### **Accessibility & UX**
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] Touch-friendly interactions
- [ ] Clear visual feedback for interactions
- [ ] Proper ARIA labels and semantics

### **Testing**
- [ ] Unit tests for menu functionality
- [ ] Role-based access testing
- [ ] Search functionality testing
- [ ] Navigation flow testing
- [ ] Accessibility testing

---

## 🔗 Dependencies

**Previous Stories:**
- ✅ Story 1.1: Initialize Next.js Project
- ✅ Story 1.2: Implement Defined Directory Structure  
- ✅ Story 1.3: Configure Global State (Redux) with sessionSlice
- ✅ Story 1.4: Implement Central API Client (Axios)
- ✅ Story 2.1: Build Foundational "Atom" Components
- ✅ Story 2.2: Implement Main Application Layout

**Next Stories:**
- Story 3.1: Build Login Page UI

---

## 📈 Success Metrics

- [ ] **Menu Usage**: >80% of features accessed through menu
- [ ] **Search Efficiency**: Users find items in <3 searches
- [ ] **Role Compliance**: 100% proper permission enforcement
- [ ] **Performance**: Menu loads in <200ms
- [ ] **Accessibility**: WCAG 2.1 AA compliance

---

**Story Status**: ✅ **READY FOR DEVELOPMENT**

*This story creates a comprehensive main menu that serves as the central hub for all application features, ensuring users can efficiently navigate and access functionality based on their roles and permissions.*
</rewritten_file>