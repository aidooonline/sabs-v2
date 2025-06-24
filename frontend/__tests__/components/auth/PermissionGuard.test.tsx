import React from 'react';
import { render, screen } from '@testing-library/react';
import { 
  PermissionGuard, 
  ShowForRoles, 
  ShowForPermissions,
  ShowForSuperAdmin,
  ShowForAdmins,
  ShowForClerks,
  ShowForAuthenticated
} from '@/components/auth/PermissionGuard';
import { useAuth } from '@/hooks/useAuth';

// Mock dependencies
jest.mock('@/hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('PermissionGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when user has required role', () => {
    mockUseAuth.mockReturnValue({
      hasRole: jest.fn(() => true),
      hasPermission: jest.fn(() => true),
      hasAnyRole: jest.fn(() => true),
      hasAnyPermission: jest.fn(() => true),
      hasAllPermissions: jest.fn(() => true),
    } as any);

    render(
      <PermissionGuard roles={['admin']}>
        <div>Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders fallback when user lacks required role', () => {
    mockUseAuth.mockReturnValue({
      hasRole: jest.fn(() => false),
      hasPermission: jest.fn(() => true),
      hasAnyRole: jest.fn(() => false),
      hasAnyPermission: jest.fn(() => true),
      hasAllPermissions: jest.fn(() => true),
    } as any);

    render(
      <PermissionGuard roles={['admin']} fallback={<div>Access Denied</div>}>
        <div>Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when user has required permission', () => {
    mockUseAuth.mockReturnValue({
      hasRole: jest.fn(() => true),
      hasPermission: jest.fn(() => true),
      hasAnyRole: jest.fn(() => true),
      hasAnyPermission: jest.fn(() => true),
      hasAllPermissions: jest.fn(() => true),
    } as any);

    render(
      <PermissionGuard permissions={['users.read']}>
        <div>Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders fallback when user lacks required permission', () => {
    mockUseAuth.mockReturnValue({
      hasRole: jest.fn(() => true),
      hasPermission: jest.fn(() => false),
      hasAnyRole: jest.fn(() => true),
      hasAnyPermission: jest.fn(() => false),
      hasAllPermissions: jest.fn(() => false),
    } as any);

    render(
      <PermissionGuard permissions={['users.write']} fallback={<div>Access Denied</div>}>
        <div>Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('handles requireAll=true for roles', () => {
    mockUseAuth.mockReturnValue({
      hasRole: jest.fn((role) => role === 'admin'), // Only has admin role
      hasPermission: jest.fn(() => true),
      hasAnyRole: jest.fn(() => true),
      hasAnyPermission: jest.fn(() => true),
      hasAllPermissions: jest.fn(() => true),
    } as any);

    render(
      <PermissionGuard 
        roles={['admin', 'super_admin']} 
        requireAll={true}
        fallback={<div>Need all roles</div>}
      >
        <div>Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.getByText('Need all roles')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('handles requireAll=true for permissions', () => {
    mockUseAuth.mockReturnValue({
      hasRole: jest.fn(() => true),
      hasPermission: jest.fn((perm) => perm === 'users.read'), // Only has read permission
      hasAnyRole: jest.fn(() => true),
      hasAnyPermission: jest.fn(() => true),
      hasAllPermissions: jest.fn((perms) => !perms.includes('users.write')), // Missing write
    } as any);

    render(
      <PermissionGuard 
        permissions={['users.read', 'users.write']} 
        requireAll={true}
        fallback={<div>Need all permissions</div>}
      >
        <div>Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.getByText('Need all permissions')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when no roles or permissions specified', () => {
    mockUseAuth.mockReturnValue({
      hasRole: jest.fn(() => false),
      hasPermission: jest.fn(() => false),
      hasAnyRole: jest.fn(() => false),
      hasAnyPermission: jest.fn(() => false),
      hasAllPermissions: jest.fn(() => false),
    } as any);

    render(
      <PermissionGuard>
        <div>Always Visible</div>
      </PermissionGuard>
    );

    expect(screen.getByText('Always Visible')).toBeInTheDocument();
  });

  it('renders nothing when fallback is not provided', () => {
    mockUseAuth.mockReturnValue({
      hasRole: jest.fn(() => false),
      hasPermission: jest.fn(() => true),
      hasAnyRole: jest.fn(() => false),
      hasAnyPermission: jest.fn(() => true),
      hasAllPermissions: jest.fn(() => true),
    } as any);

    const { container } = render(
      <PermissionGuard roles={['admin']}>
        <div>Protected Content</div>
      </PermissionGuard>
    );

    expect(container.firstChild).toBeNull();
  });
});

describe('ShowForRoles', () => {
  it('renders children when user has any of the specified roles', () => {
    mockUseAuth.mockReturnValue({
      hasRole: jest.fn(() => true),
      hasPermission: jest.fn(() => true),
      hasAnyRole: jest.fn(() => true),
      hasAnyPermission: jest.fn(() => true),
      hasAllPermissions: jest.fn(() => true),
    } as any);

    render(
      <ShowForRoles roles={['admin', 'manager']}>
        <div>Role-based Content</div>
      </ShowForRoles>
    );

    expect(screen.getByText('Role-based Content')).toBeInTheDocument();
  });

  it('renders fallback when user lacks roles', () => {
    mockUseAuth.mockReturnValue({
      hasRole: jest.fn(() => false),
      hasPermission: jest.fn(() => true),
      hasAnyRole: jest.fn(() => false),
      hasAnyPermission: jest.fn(() => true),
      hasAllPermissions: jest.fn(() => true),
    } as any);

    render(
      <ShowForRoles roles={['admin']} fallback={<div>No access</div>}>
        <div>Role-based Content</div>
      </ShowForRoles>
    );

    expect(screen.getByText('No access')).toBeInTheDocument();
  });
});

describe('ShowForPermissions', () => {
  it('renders children when user has any of the specified permissions', () => {
    mockUseAuth.mockReturnValue({
      hasRole: jest.fn(() => true),
      hasPermission: jest.fn(() => true),
      hasAnyRole: jest.fn(() => true),
      hasAnyPermission: jest.fn(() => true),
      hasAllPermissions: jest.fn(() => true),
    } as any);

    render(
      <ShowForPermissions permissions={['users.read', 'users.write']}>
        <div>Permission-based Content</div>
      </ShowForPermissions>
    );

    expect(screen.getByText('Permission-based Content')).toBeInTheDocument();
  });
});

describe('ShowForSuperAdmin', () => {
  it('renders children only for super admin', () => {
    mockUseAuth.mockReturnValue({
      hasRole: jest.fn(() => true),
      hasPermission: jest.fn(() => true),
      hasAnyRole: jest.fn((roles) => roles.includes('super_admin')),
      hasAnyPermission: jest.fn(() => true),
      hasAllPermissions: jest.fn(() => true),
    } as any);

    render(
      <ShowForSuperAdmin>
        <div>Super Admin Content</div>
      </ShowForSuperAdmin>
    );

    expect(screen.getByText('Super Admin Content')).toBeInTheDocument();
  });

  it('hides content for non-super admin', () => {
    mockUseAuth.mockReturnValue({
      hasRole: jest.fn(() => false),
      hasPermission: jest.fn(() => true),
      hasAnyRole: jest.fn(() => false), // Not super admin
      hasAnyPermission: jest.fn(() => true),
      hasAllPermissions: jest.fn(() => true),
    } as any);

    const { container } = render(
      <ShowForSuperAdmin>
        <div>Super Admin Content</div>
      </ShowForSuperAdmin>
    );

    expect(container.firstChild).toBeNull();
  });
});

describe('ShowForAdmins', () => {
  it('renders children for super admin', () => {
    mockUseAuth.mockReturnValue({
      hasRole: jest.fn(() => true),
      hasPermission: jest.fn(() => true),
      hasAnyRole: jest.fn((roles) => roles.includes('super_admin')),
      hasAnyPermission: jest.fn(() => true),
      hasAllPermissions: jest.fn(() => true),
    } as any);

    render(
      <ShowForAdmins>
        <div>Admin Content</div>
      </ShowForAdmins>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('renders children for company admin', () => {
    mockUseAuth.mockReturnValue({
      hasRole: jest.fn(() => true),
      hasPermission: jest.fn(() => true),
      hasAnyRole: jest.fn((roles) => roles.includes('company_admin')),
      hasAnyPermission: jest.fn(() => true),
      hasAllPermissions: jest.fn(() => true),
    } as any);

    render(
      <ShowForAdmins>
        <div>Admin Content</div>
      </ShowForAdmins>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });
});

describe('ShowForClerks', () => {
  it('renders children for clerk and above roles', () => {
    mockUseAuth.mockReturnValue({
      hasRole: jest.fn(() => true),
      hasPermission: jest.fn(() => true),
      hasAnyRole: jest.fn((roles) => roles.includes('clerk')),
      hasAnyPermission: jest.fn(() => true),
      hasAllPermissions: jest.fn(() => true),
    } as any);

    render(
      <ShowForClerks>
        <div>Clerk Content</div>
      </ShowForClerks>
    );

    expect(screen.getByText('Clerk Content')).toBeInTheDocument();
  });
});

describe('ShowForAuthenticated', () => {
  it('renders children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      hasRole: jest.fn(() => true),
      hasPermission: jest.fn(() => true),
      hasAnyRole: jest.fn(() => true),
      hasAnyPermission: jest.fn(() => true),
      hasAllPermissions: jest.fn(() => true),
    } as any);

    render(
      <ShowForAuthenticated>
        <div>Authenticated Content</div>
      </ShowForAuthenticated>
    );

    expect(screen.getByText('Authenticated Content')).toBeInTheDocument();
  });

  it('renders fallback when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      hasRole: jest.fn(() => false),
      hasPermission: jest.fn(() => false),
      hasAnyRole: jest.fn(() => false),
      hasAnyPermission: jest.fn(() => false),
      hasAllPermissions: jest.fn(() => false),
    } as any);

    render(
      <ShowForAuthenticated fallback={<div>Please log in</div>}>
        <div>Authenticated Content</div>
      </ShowForAuthenticated>
    );

    expect(screen.getByText('Please log in')).toBeInTheDocument();
    expect(screen.queryByText('Authenticated Content')).not.toBeInTheDocument();
  });
});