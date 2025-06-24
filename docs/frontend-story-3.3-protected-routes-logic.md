# Story 3.3: Implement Protected Routes Logic - Sabs v2 Frontend

## 📋 Story Overview

**Epic**: Phase 3 - Authentication Flow  
**Story ID**: FRONTEND-3.3  
**Story Title**: Implement Protected Routes Logic  
**Story Points**: 4  
**Priority**: High  
**Status**: Ready for Development

---

## 👤 User Story

**As a** User  
**I want to** access only the routes and features I'm authorized for  
**So that** the application maintains proper security and users see only relevant functionality based on their roles and permissions

---

## 🎯 Acceptance Criteria

### ✅ **AC 1: Route Protection Implementation**
- [ ] Create authentication guards for protected routes
- [ ] Implement automatic redirect to login for unauthenticated users
- [ ] Support return URLs for post-login redirection
- [ ] Handle session expiry during route navigation
- [ ] Prevent access to auth pages when already logged in

### ✅ **AC 2: Role-Based Access Control**
- [ ] Implement role-based route protection
- [ ] Create permission-based route guards
- [ ] Show appropriate error pages for unauthorized access
- [ ] Support hierarchical role permissions
- [ ] Dynamic route access based on user context

### ✅ **AC 3: Navigation Guards**
- [ ] Implement route middleware for Next.js App Router
- [ ] Create HOCs for component-level protection
- [ ] Support loading states during authentication checks
- [ ] Handle authentication state initialization
- [ ] Provide graceful fallbacks for auth failures

### ✅ **AC 4: User Experience**
- [ ] Seamless authentication flow without flickering
- [ ] Clear feedback for unauthorized access attempts
- [ ] Proper loading indicators during auth checks
- [ ] Maintenance of navigation state across auth flows
- [ ] Support for deep linking with authentication

### ✅ **AC 5: Security & Performance**
- [ ] Client-side route protection
- [ ] Server-side authentication validation where needed
- [ ] Efficient re-authentication checks
- [ ] Proper cleanup on logout/session expiry
- [ ] Prevention of auth bypass attempts

---

## 🏗️ Technical Implementation Guidelines

### **Authentication Guards and HOCs**

#### **Auth Guard HOC (`components/auth/withAuth.tsx`)**
```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface WithAuthOptions {
  requiredRoles?: string[];
  requiredPermissions?: string[];
  redirectTo?: string;
  requireEmailVerified?: boolean;
  showUnauthorized?: boolean;
}

interface AuthCheckResult {
  isAuthorized: boolean;
  isLoading: boolean;
  redirectRequired: boolean;
  redirectUrl: string;
}

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const {
    requiredRoles = [],
    requiredPermissions = [],
    redirectTo = '/login',
    requireEmailVerified = false,
    showUnauthorized = false,
  } = options;

  const AuthenticatedComponent = (props: P) => {
    const router = useRouter();
    const {
      isAuthenticated,
      isInitialized,
      user,
      hasRole,
      hasAnyRole,
      hasPermission,
      hasAnyPermission,
    } = useAuth();

    const [authCheck, setAuthCheck] = useState<AuthCheckResult>({
      isAuthorized: false,
      isLoading: true,
      redirectRequired: false,
      redirectUrl: '',
    });

    useEffect(() => {
      if (!isInitialized) {
        // Still initializing auth state
        setAuthCheck(prev => ({ ...prev, isLoading: true }));
        return;
      }

      if (!isAuthenticated) {
        // User not authenticated, redirect to login
        const currentPath = window.location.pathname;
        const redirectUrl = `${redirectTo}?returnTo=${encodeURIComponent(currentPath)}`;
        
        setAuthCheck({
          isAuthorized: false,
          isLoading: false,
          redirectRequired: true,
          redirectUrl,
        });
        return;
      }

      // Check email verification requirement
      if (requireEmailVerified && user && !user.emailVerified) {
        setAuthCheck({
          isAuthorized: false,
          isLoading: false,
          redirectRequired: true,
          redirectUrl: '/verify-email',
        });
        return;
      }

      // Check role requirements
      if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
        setAuthCheck({
          isAuthorized: false,
          isLoading: false,
          redirectRequired: showUnauthorized ? false : true,
          redirectUrl: '/unauthorized',
        });
        return;
      }

      // Check permission requirements
      if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
        setAuthCheck({
          isAuthorized: false,
          isLoading: false,
          redirectRequired: showUnauthorized ? false : true,
          redirectUrl: '/unauthorized',
        });
        return;
      }

      // User is authorized
      setAuthCheck({
        isAuthorized: true,
        isLoading: false,
        redirectRequired: false,
        redirectUrl: '',
      });
    }, [
      isAuthenticated,
      isInitialized,
      user,
      hasAnyRole,
      hasAnyPermission,
      requiredRoles,
      requiredPermissions,
      requireEmailVerified,
      showUnauthorized,
      redirectTo,
    ]);

    // Handle redirects
    useEffect(() => {
      if (authCheck.redirectRequired && authCheck.redirectUrl) {
        router.replace(authCheck.redirectUrl);
      }
    }, [authCheck.redirectRequired, authCheck.redirectUrl, router]);

    // Show loading state
    if (authCheck.isLoading) {
      return <AuthLoadingScreen />;
    }

    // Show unauthorized message if configured to do so
    if (!authCheck.isAuthorized && showUnauthorized) {
      return <UnauthorizedScreen />;
    }

    // Render protected component if authorized
    if (authCheck.isAuthorized) {
      return <WrappedComponent {...props} />;
    }

    // Default: show loading (redirect should happen)
    return <AuthLoadingScreen />;
  };

  AuthenticatedComponent.displayName = `withAuth(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;

  return AuthenticatedComponent;
}

// Loading screen component
const AuthLoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Checking authentication...</p>
    </div>
  </div>
);

// Unauthorized screen component
const UnauthorizedScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="mx-auto h-16 w-16 text-red-500">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h2 className="mt-4 text-2xl font-bold text-gray-900">Access Denied</h2>
      <p className="mt-2 text-gray-600">
        You don't have permission to access this page.
      </p>
    </div>
  </div>
);
```

#### **Route Guard Hook (`hooks/useRouteGuard.ts`)**
```typescript
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './useAuth';

interface RouteGuardOptions {
  requiredRoles?: string[];
  requiredPermissions?: string[];
  redirectTo?: string;
  requireEmailVerified?: boolean;
}

export const useRouteGuard = (options: RouteGuardOptions = {}) => {
  const {
    requiredRoles = [],
    requiredPermissions = [],
    redirectTo = '/login',
    requireEmailVerified = false,
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const {
    isAuthenticated,
    isInitialized,
    user,
    hasAnyRole,
    hasAnyPermission,
  } = useAuth();

  useEffect(() => {
    if (!isInitialized) {
      // Still initializing, wait
      return;
    }

    if (!isAuthenticated) {
      // Not authenticated, redirect to login with return URL
      const returnTo = encodeURIComponent(pathname);
      router.replace(`${redirectTo}?returnTo=${returnTo}`);
      return;
    }

    // Check email verification
    if (requireEmailVerified && user && !user.emailVerified) {
      router.replace('/verify-email');
      return;
    }

    // Check role requirements
    if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
      router.replace('/unauthorized');
      return;
    }

    // Check permission requirements
    if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
      router.replace('/unauthorized');
      return;
    }
  }, [
    isAuthenticated,
    isInitialized,
    user,
    hasAnyRole,
    hasAnyPermission,
    requiredRoles,
    requiredPermissions,
    requireEmailVerified,
    redirectTo,
    pathname,
    router,
  ]);

  return {
    isAuthenticated,
    isInitialized,
    user,
    isAuthorized: isAuthenticated && 
      (requiredRoles.length === 0 || hasAnyRole(requiredRoles)) &&
      (requiredPermissions.length === 0 || hasAnyPermission(requiredPermissions)) &&
      (!requireEmailVerified || !user || user.emailVerified),
  };
};
```

### **Protected Route Layouts**

#### **Protected Dashboard Layout (`app/(dashboard)/layout.tsx`)**
```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';
import { withAuth } from '@/components/auth/withAuth';
import DashboardTemplate from '@/components/templates/DashboardTemplate';

function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardTemplate>
      {children}
    </DashboardTemplate>
  );
}

// Apply authentication guard to the entire dashboard layout
export default withAuth(DashboardLayout, {
  requiredRoles: [], // Any authenticated user can access dashboard
  redirectTo: '/login',
  requireEmailVerified: true,
});
```

#### **Admin Protected Layout (`app/(dashboard)/admin/layout.tsx`)**
```typescript
'use client';

import { withAuth } from '@/components/auth/withAuth';
import DashboardTemplate from '@/components/templates/DashboardTemplate';

function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardTemplate title="Admin Panel">
      {children}
    </DashboardTemplate>
  );
}

// Apply strict authentication guard for admin routes
export default withAuth(AdminLayout, {
  requiredRoles: ['super_admin', 'admin'],
  redirectTo: '/unauthorized',
  requireEmailVerified: true,
  showUnauthorized: true,
});
```

### **Public Route Handler**

#### **Auth Route Handler (`app/(auth)/layout.tsx`)**
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();

  useEffect(() => {
    // Redirect authenticated users away from auth pages
    if (isInitialized && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Don't render auth pages if user is already authenticated
  if (isInitialized && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
```

### **Error Pages**

#### **Unauthorized Page (`app/unauthorized/page.tsx`)**
```typescript
'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/atoms/Button';

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Error Icon */}
        <div className="mx-auto h-24 w-24 text-red-500">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        {/* Error Message */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">
            You don't have permission to access this page.
          </p>
          {user && (
            <p className="mt-2 text-sm text-gray-500">
              Signed in as: {user.email} ({user.role})
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Link href="/dashboard">
            <Button variant="primary" fullWidth>
              Go to Dashboard
            </Button>
          </Link>
          
          <Button 
            variant="ghost" 
            fullWidth 
            onClick={logout}
          >
            Sign out and try different account
          </Button>
        </div>

        {/* Contact Support */}
        <div className="text-sm text-gray-500">
          <p>
            If you believe this is an error, please{' '}
            <Link href="/help" className="text-primary-600 hover:text-primary-500">
              contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

### **Permission-Based Component Guards**

#### **Permission Guard Component (`components/auth/PermissionGuard.tsx`)**
```typescript
import React from 'react';
import { useAuth } from '@/hooks/useAuth';

interface PermissionGuardProps {
  children: React.ReactNode;
  roles?: string[];
  permissions?: string[];
  fallback?: React.ReactNode;
  requireAll?: boolean; // Require all permissions/roles vs any
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  roles = [],
  permissions = [],
  fallback = null,
  requireAll = false,
}) => {
  const { hasRole, hasPermission, hasAnyRole, hasAnyPermission } = useAuth();

  // Check role requirements
  const roleCheck = () => {
    if (roles.length === 0) return true;
    
    if (requireAll) {
      return roles.every(role => hasRole(role));
    } else {
      return hasAnyRole(roles);
    }
  };

  // Check permission requirements
  const permissionCheck = () => {
    if (permissions.length === 0) return true;
    
    if (requireAll) {
      return permissions.every(permission => hasPermission(permission));
    } else {
      return hasAnyPermission(permissions);
    }
  };

  const isAuthorized = roleCheck() && permissionCheck();

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Convenience wrapper for hiding content
export const ShowForRoles: React.FC<{
  roles: string[];
  children: React.ReactNode;
}> = ({ roles, children }) => (
  <PermissionGuard roles={roles}>
    {children}
  </PermissionGuard>
);

export const ShowForPermissions: React.FC<{
  permissions: string[];
  children: React.ReactNode;
}> = ({ permissions, children }) => (
  <PermissionGuard permissions={permissions}>
    {children}
  </PermissionGuard>
);
```

---

## 🧪 Testing Implementation

### **Protected Routes Tests**
```typescript
import React from 'react';
import { render, screen } from '@/utils/test-utils';
import { useRouter } from 'next/navigation';
import { withAuth } from '../withAuth';
import { useAuth } from '@/hooks/useAuth';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/hooks/useAuth');

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Test component
const TestComponent = () => <div>Protected Content</div>;

describe('withAuth HOC', () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      replace: mockReplace,
    } as any);
    jest.clearAllMocks();
  });

  it('renders component when user is authenticated and authorized', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      user: { role: 'admin' },
      hasAnyRole: jest.fn(() => true),
      hasAnyPermission: jest.fn(() => true),
    } as any);

    const ProtectedComponent = withAuth(TestComponent, {
      requiredRoles: ['admin'],
    });

    render(<ProtectedComponent />);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isInitialized: true,
    } as any);

    const ProtectedComponent = withAuth(TestComponent);

    render(<ProtectedComponent />);
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining('/login?returnTo=')
    );
  });

  it('redirects to unauthorized when user lacks required role', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      user: { role: 'user' },
      hasAnyRole: jest.fn(() => false),
      hasAnyPermission: jest.fn(() => true),
    } as any);

    const ProtectedComponent = withAuth(TestComponent, {
      requiredRoles: ['admin'],
    });

    render(<ProtectedComponent />);
    expect(mockReplace).toHaveBeenCalledWith('/unauthorized');
  });

  it('shows loading screen while auth is initializing', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isInitialized: false,
    } as any);

    const ProtectedComponent = withAuth(TestComponent);

    render(<ProtectedComponent />);
    expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
  });
});
```

---

## 📝 Definition of Done

### **Route Protection**
- [ ] Authentication guards for all protected routes
- [ ] Automatic redirect to login for unauthenticated users
- [ ] Return URL support for post-login redirection
- [ ] Session expiry handling during navigation
- [ ] Prevention of access to auth pages when authenticated

### **Access Control**
- [ ] Role-based route protection implementation
- [ ] Permission-based route guards
- [ ] Hierarchical role permission support
- [ ] Dynamic route access based on user context
- [ ] Proper error pages for unauthorized access

### **User Experience**
- [ ] Seamless authentication flow without flickering
- [ ] Clear feedback for unauthorized access
- [ ] Loading indicators during auth checks
- [ ] Maintenance of navigation state
- [ ] Support for deep linking with authentication

### **Security & Performance**
- [ ] Client-side route protection
- [ ] Efficient re-authentication checks
- [ ] Proper cleanup on logout/session expiry
- [ ] Prevention of auth bypass attempts
- [ ] Component-level permission guards

### **Testing**
- [ ] Unit tests for all route guards and HOCs
- [ ] Authentication flow testing
- [ ] Role and permission testing
- [ ] Redirect behavior testing
- [ ] Error scenario testing

---

## 🔗 Dependencies

**Previous Stories:**
- ✅ Story 1.1: Initialize Next.js Project
- ✅ Story 1.2: Implement Defined Directory Structure  
- ✅ Story 1.3: Configure Global State (Redux) with sessionSlice
- ✅ Story 1.4: Implement Central API Client (Axios)
- ✅ Story 2.1: Build Foundational "Atom" Components
- ✅ Story 2.2: Implement Main Application Layout
- ✅ Story 2.3: Build Main Menu Screen
- ✅ Story 3.1: Build Login Page UI
- ✅ Story 3.2: Implement Login Logic (API & Redux Integration)

**Next Stories:**
- Ready for additional feature development stories

---

## 📈 Success Metrics

- [ ] **Security**: 100% protection of restricted routes
- [ ] **User Experience**: Seamless navigation for authorized users
- [ ] **Performance**: Route checks complete in <50ms
- [ ] **Accessibility**: Proper error handling and feedback
- [ ] **Compliance**: Role-based access working correctly

---

**Story Status**: ✅ **READY FOR DEVELOPMENT**

*This story completes the authentication flow by implementing comprehensive route protection, ensuring users can only access features and pages they're authorized for while maintaining a smooth user experience.*