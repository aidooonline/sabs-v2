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
    if (requireEmailVerified && user && !user.isEmailVerified) {
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
      (!requireEmailVerified || !user || user.isEmailVerified),
  };
};