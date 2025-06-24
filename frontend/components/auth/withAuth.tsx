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
      if (requireEmailVerified && user && !user.isEmailVerified) {
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
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
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
        You don&apos;t have permission to access this page.
      </p>
    </div>
  </div>
);