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
  const { hasRole, hasPermission, hasAnyRole, hasAnyPermission, hasAllPermissions } = useAuth();

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
      return hasAllPermissions(permissions);
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

// Convenience wrapper for hiding content based on roles
export const ShowForRoles: React.FC<{
  roles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ roles, children, fallback }) => (
  <PermissionGuard roles={roles} fallback={fallback}>
    {children}
  </PermissionGuard>
);

// Convenience wrapper for hiding content based on permissions
export const ShowForPermissions: React.FC<{
  permissions: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ permissions, children, fallback }) => (
  <PermissionGuard permissions={permissions} fallback={fallback}>
    {children}
  </PermissionGuard>
);

// Convenience wrapper for super admin only content
export const ShowForSuperAdmin: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <PermissionGuard roles={['super_admin']} fallback={fallback}>
    {children}
  </PermissionGuard>
);

// Convenience wrapper for admin and above content
export const ShowForAdmins: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <PermissionGuard roles={['super_admin', 'company_admin']} fallback={fallback}>
    {children}
  </PermissionGuard>
);

// Convenience wrapper for clerks and above content
export const ShowForClerks: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <PermissionGuard roles={['super_admin', 'company_admin', 'clerk']} fallback={fallback}>
    {children}
  </PermissionGuard>
);

// Convenience wrapper for any authenticated user
export const ShowForAuthenticated: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};