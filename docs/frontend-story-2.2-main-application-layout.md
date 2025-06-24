# Story 2.2: Implement Main Application Layout (Bottom Tab Bar) - Sabs v2 Frontend

## 📋 Story Overview

**Epic**: Phase 2 - Core UI Layout & Components  
**Story ID**: FRONTEND-2.2  
**Story Title**: Implement Main Application Layout (including Bottom Tab Bar)  
**Story Points**: 6  
**Priority**: High  
**Status**: Ready for Development

---

## 👤 User Story

**As a** User  
**I want to** navigate through the main sections of the application using a persistent bottom tab bar  
**So that** I can quickly access core features (Dashboard, Customers, Add, Menu, Settings) with clear visual feedback and efficient navigation

---

## 🎯 Acceptance Criteria

### ✅ **AC 1: Bottom Tab Bar Implementation**
- [ ] Create persistent bottom tab bar with 5 navigation items
- [ ] Implement Menu (Hamburger), Home, Add (+), People, Settings icons
- [ ] Add active/inactive states with proper visual feedback
- [ ] Ensure mobile-responsive design and touch-friendly targets
- [ ] Support keyboard navigation and accessibility

### ✅ **AC 2: Main Layout Structure**
- [ ] Create main application layout component with header and content areas
- [ ] Implement proper page routing integration with Next.js App Router
- [ ] Add breadcrumb navigation support for deeper pages
- [ ] Create flexible content area that adjusts to bottom tab bar
- [ ] Support full-screen modes when bottom tab should be hidden

### ✅ **AC 3: Navigation State Management**
- [ ] Integrate with Redux for navigation state
- [ ] Track active route and update tab states accordingly
- [ ] Implement navigation guards for protected routes
- [ ] Support navigation history and back button functionality
- [ ] Handle deep linking and route restoration

### ✅ **AC 4: Responsive Design**
- [ ] Optimize layout for mobile-first design approach
- [ ] Ensure touch targets meet accessibility guidelines (44px minimum)
- [ ] Implement proper spacing and safe area handling
- [ ] Support both portrait and landscape orientations
- [ ] Handle different screen sizes gracefully

### ✅ **AC 5: Performance & Accessibility**
- [ ] Implement lazy loading for route components
- [ ] Add proper ARIA labels and navigation semantics
- [ ] Support screen readers with clear navigation announcements
- [ ] Ensure smooth transitions and animations
- [ ] Test with keyboard-only navigation

---

## 🏗️ Technical Implementation Guidelines

### **Bottom Tab Bar Component**

#### **Bottom Tab Bar (`components/organisms/BottomTabBar/BottomTabBar.tsx`)**
```typescript
'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/utils/helpers';
import { useUI } from '@/hooks/useUI';

// Tab configuration
const tabs = [
  {
    id: 'menu',
    label: 'Menu',
    icon: 'Menu',
    path: '/menu',
    ariaLabel: 'Open main menu',
  },
  {
    id: 'home',
    label: 'Home',
    icon: 'Home',
    path: '/dashboard',
    ariaLabel: 'Go to dashboard',
  },
  {
    id: 'add',
    label: 'Add',
    icon: 'Plus',
    path: '/add',
    ariaLabel: 'Add new customer or user',
  },
  {
    id: 'customers',
    label: 'People',
    icon: 'Users',
    path: '/customers',
    ariaLabel: 'View customers list',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'Settings',
    path: '/settings',
    ariaLabel: 'Open settings',
  },
];

// Icon components
const icons = {
  Menu: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Home: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Plus: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Users: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  ),
  Settings: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

export interface BottomTabBarProps {
  className?: string;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ className }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { ui } = useUI();

  // Don't show bottom tab bar if explicitly hidden
  if (!ui.bottomTabVisible) {
    return null;
  }

  const handleTabPress = (tab: typeof tabs[0]) => {
    // Handle special cases
    if (tab.id === 'add') {
      // Could open a modal or navigate to add page
      router.push('/customers/new');
      return;
    }

    if (tab.id === 'menu') {
      // Could open a modal or navigate to menu page
      router.push('/menu');
      return;
    }

    router.push(tab.path);
  };

  const isActiveTab = (tab: typeof tabs[0]) => {
    if (tab.path === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname.startsWith(tab.path);
  };

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb',
        className
      )}
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map((tab) => {
          const IconComponent = icons[tab.icon as keyof typeof icons];
          const isActive = isActiveTab(tab);

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={tab.ariaLabel}
              onClick={() => handleTabPress(tab)}
              className={cn(
                'flex flex-col items-center justify-center min-h-[48px] px-3 py-2 rounded-lg transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                isActive
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <IconComponent
                className={cn(
                  'w-6 h-6 mb-1 transition-colors',
                  isActive ? 'text-primary-600' : 'text-gray-500'
                )}
              />
              <span
                className={cn(
                  'text-xs font-medium',
                  isActive ? 'text-primary-600' : 'text-gray-500'
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabBar;
```

### **Main Layout Component**

#### **Main Layout (`components/templates/DashboardTemplate/DashboardTemplate.tsx`)**
```typescript
'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/helpers';
import { useUI } from '@/hooks/useUI';
import BottomTabBar from '@/components/organisms/BottomTabBar';
import Header from '@/components/organisms/Header';
import Breadcrumbs from '@/components/molecules/Breadcrumbs';

export interface DashboardTemplateProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showBottomTabs?: boolean;
  showBreadcrumbs?: boolean;
  headerActions?: ReactNode;
  className?: string;
}

export const DashboardTemplate: React.FC<DashboardTemplateProps> = ({
  children,
  title,
  showHeader = true,
  showBottomTabs = true,
  showBreadcrumbs = true,
  headerActions,
  className,
}) => {
  const pathname = usePathname();
  const { ui } = useUI();

  // Calculate content padding based on what's shown
  const contentPadding = cn(
    showHeader && 'pt-16', // Header height
    showBottomTabs && ui.bottomTabVisible && 'pb-20' // Bottom tab bar height
  );

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* Header */}
      {showHeader && (
        <Header
          title={title}
          actions={headerActions}
          showBreadcrumbs={showBreadcrumbs}
        />
      )}

      {/* Main Content */}
      <main
        className={cn(
          'relative z-0 flex-1 overflow-auto focus:outline-none',
          contentPadding
        )}
        role="main"
        aria-label="Main content"
      >
        {/* Breadcrumbs */}
        {showBreadcrumbs && showHeader && (
          <div className="bg-white border-b border-gray-200 px-4 py-2">
            <Breadcrumbs />
          </div>
        )}

        {/* Page Content */}
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* Bottom Tab Bar */}
      {showBottomTabs && <BottomTabBar />}
    </div>
  );
};

export default DashboardTemplate;
```

### **Header Component**

#### **Header (`components/organisms/Header/Header.tsx`)**
```typescript
'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/utils/helpers';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/atoms/Button';

export interface HeaderProps {
  title?: string;
  actions?: ReactNode;
  showBreadcrumbs?: boolean;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  actions,
  className,
}) => {
  const { user, logout } = useAuth();

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 safe-area-pt',
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Title */}
        <div className="flex items-center min-w-0 flex-1">
          {title && (
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {title}
            </h1>
          )}
        </div>

        {/* Right side - Actions and User */}
        <div className="flex items-center space-x-3">
          {actions}
          
          {/* User Menu */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700 hidden sm:block">
              {user?.firstName} {user?.lastName}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              aria-label="Logout"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
```

### **Breadcrumbs Component**

#### **Breadcrumbs (`components/molecules/Breadcrumbs/Breadcrumbs.tsx`)**
```typescript
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/helpers';
import { useAppSelector } from '@/hooks/redux';

// Route mapping for breadcrumb labels
const routeLabels: Record<string, string> = {
  '/': 'Home',
  '/dashboard': 'Dashboard',
  '/customers': 'Customers',
  '/users': 'Users',
  '/transactions': 'Transactions',
  '/settings': 'Settings',
  '/menu': 'Menu',
  '/add': 'Add New',
};

export interface BreadcrumbsProps {
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ className }) => {
  const pathname = usePathname();
  const breadcrumbs = useAppSelector((state) => state.ui.breadcrumbs);

  // Generate breadcrumbs from pathname if not provided in Redux
  const generateBreadcrumbs = () => {
    if (breadcrumbs && breadcrumbs.length > 0) {
      return breadcrumbs;
    }

    const segments = pathname.split('/').filter(Boolean);
    const crumbs = [{ label: 'Home', href: '/dashboard' }];

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      crumbs.push({
        label,
        href: index === segments.length - 1 ? undefined : currentPath,
      });
    });

    return crumbs;
  };

  const breadcrumbItems = generateBreadcrumbs();

  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav className={cn('flex', className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbItems.map((crumb, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <svg
                className="w-4 h-4 text-gray-400 mx-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="text-sm text-primary-600 hover:text-primary-800 font-medium"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-sm text-gray-900 font-medium">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
```

### **Layout Integration with App Router**

#### **Root Layout (`app/layout.tsx`)**
```typescript
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import ReduxProvider from '@/store/provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cn } from '@/utils/helpers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sabs v2 - Micro-Finance Platform',
  description: 'Scalable micro-finance platform built with modern technology',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={cn(inter.className, 'h-full bg-gray-50')}>
        <ReduxProvider>
          <div id="root" className="h-full">
            {children}
          </div>
        </ReduxProvider>
      </body>
    </html>
  );
}
```

---

## 🧪 Testing Implementation

### **Bottom Tab Bar Tests**
```typescript
import React from 'react';
import { render, screen, fireEvent } from '@/utils/test-utils';
import { useRouter } from 'next/navigation';
import BottomTabBar from '../BottomTabBar';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

describe('BottomTabBar', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    jest.clearAllMocks();
  });

  it('renders all navigation tabs', () => {
    render(<BottomTabBar />);
    
    expect(screen.getByLabelText('Open main menu')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to dashboard')).toBeInTheDocument();
    expect(screen.getByLabelText('Add new customer or user')).toBeInTheDocument();
    expect(screen.getByLabelText('View customers list')).toBeInTheDocument();
    expect(screen.getByLabelText('Open settings')).toBeInTheDocument();
  });

  it('navigates when tabs are clicked', () => {
    render(<BottomTabBar />);
    
    fireEvent.click(screen.getByLabelText('Go to dashboard'));
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('shows active state for current route', () => {
    const { rerender } = render(<BottomTabBar />);
    
    // Test different active states based on pathname
    // Implementation would depend on your mocking strategy
  });
});
```

---

## 📝 Definition of Done

### **Layout Implementation**
- [ ] Bottom tab bar with 5 navigation items and proper states
- [ ] Main layout template with header, content, and navigation
- [ ] Responsive design for mobile and desktop viewports
- [ ] Integration with Next.js App Router
- [ ] Breadcrumb navigation system

### **Navigation Features**
- [ ] Route-based active state detection
- [ ] Keyboard navigation support
- [ ] Touch-friendly targets (44px minimum)
- [ ] Screen reader compatibility
- [ ] Navigation state management with Redux

### **Performance & Accessibility**
- [ ] Smooth transitions and animations
- [ ] WCAG 2.1 AA compliance
- [ ] Proper ARIA labels and navigation semantics
- [ ] Safe area handling for mobile devices
- [ ] Lazy loading integration

### **Testing**
- [ ] Unit tests for all layout components
- [ ] Navigation flow testing
- [ ] Accessibility testing
- [ ] Responsive design testing
- [ ] Performance testing

---

## 🔗 Dependencies

**Previous Stories:**
- ✅ Story 1.1: Initialize Next.js Project
- ✅ Story 1.2: Implement Defined Directory Structure  
- ✅ Story 1.3: Configure Global State (Redux) with sessionSlice
- ✅ Story 1.4: Implement Central API Client (Axios)
- ✅ Story 2.1: Build Foundational "Atom" Components

**Next Stories:**
- Story 2.3: Build Main Menu Screen

---

## 📈 Success Metrics

- [ ] **Navigation Speed**: Tab transitions complete in <100ms
- [ ] **Accessibility Score**: >95% compliance with WCAG 2.1 AA
- [ ] **Touch Success Rate**: >98% successful tab interactions
- [ ] **Performance**: Layout renders without jank
- [ ] **User Experience**: Intuitive navigation patterns

---

**Story Status**: ✅ **READY FOR DEVELOPMENT**

*This story creates the core navigation structure for the Sabs v2 application, providing users with consistent, accessible, and efficient navigation throughout the platform.*