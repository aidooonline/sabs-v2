import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { withAuth } from '@/components/auth/withAuth';
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

    // Mock window.location.pathname
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/dashboard/test',
      },
      writable: true,
    });

    jest.clearAllMocks();
  });

  it('renders component when user is authenticated and authorized', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      user: { 
        id: '1', 
        email: 'test@example.com', 
        role: 'admin',
        isEmailVerified: true 
      },
      hasAnyRole: jest.fn(() => true),
      hasAnyPermission: jest.fn(() => true),
    } as any);

    const ProtectedComponent = withAuth(TestComponent, {
      requiredRoles: ['admin'],
    });

    render(<ProtectedComponent />);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
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

  it('redirects to login when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isInitialized: true,
    } as any);

    const ProtectedComponent = withAuth(TestComponent);

    render(<ProtectedComponent />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('/login?returnTo=%2Fdashboard%2Ftest')
      );
    });
  });

  it('redirects to custom login page when specified', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isInitialized: true,
    } as any);

    const ProtectedComponent = withAuth(TestComponent, {
      redirectTo: '/custom-login',
    });

    render(<ProtectedComponent />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('/custom-login?returnTo=')
      );
    });
  });

  it('redirects to unauthorized when user lacks required role', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      user: { 
        id: '1', 
        email: 'test@example.com', 
        role: 'user',
        isEmailVerified: true 
      },
      hasAnyRole: jest.fn(() => false),
      hasAnyPermission: jest.fn(() => true),
    } as any);

    const ProtectedComponent = withAuth(TestComponent, {
      requiredRoles: ['admin'],
    });

    render(<ProtectedComponent />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/unauthorized');
    });
  });

  it('redirects to unauthorized when user lacks required permission', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      user: { 
        id: '1', 
        email: 'test@example.com', 
        role: 'user',
        isEmailVerified: true 
      },
      hasAnyRole: jest.fn(() => true),
      hasAnyPermission: jest.fn(() => false),
    } as any);

    const ProtectedComponent = withAuth(TestComponent, {
      requiredPermissions: ['admin.users.manage'],
    });

    render(<ProtectedComponent />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/unauthorized');
    });
  });

  it('redirects to email verification when email is not verified', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      user: { 
        id: '1', 
        email: 'test@example.com', 
        role: 'user',
        isEmailVerified: false 
      },
      hasAnyRole: jest.fn(() => true),
      hasAnyPermission: jest.fn(() => true),
    } as any);

    const ProtectedComponent = withAuth(TestComponent, {
      requireEmailVerified: true,
    });

    render(<ProtectedComponent />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/verify-email');
    });
  });

  it('shows unauthorized screen when showUnauthorized is true', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      user: { 
        id: '1', 
        email: 'test@example.com', 
        role: 'user',
        isEmailVerified: true 
      },
      hasAnyRole: jest.fn(() => false),
      hasAnyPermission: jest.fn(() => true),
    } as any);

    const ProtectedComponent = withAuth(TestComponent, {
      requiredRoles: ['admin'],
      showUnauthorized: true,
    });

    render(<ProtectedComponent />);
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText('You don\'t have permission to access this page.')).toBeInTheDocument();
  });

  it('handles multiple role requirements correctly', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      user: { 
        id: '1', 
        email: 'test@example.com', 
        role: 'admin',
        isEmailVerified: true 
      },
      hasAnyRole: jest.fn((roles) => roles.includes('admin')),
      hasAnyPermission: jest.fn(() => true),
    } as any);

    const ProtectedComponent = withAuth(TestComponent, {
      requiredRoles: ['admin', 'super_admin'],
    });

    render(<ProtectedComponent />);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('handles multiple permission requirements correctly', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      user: { 
        id: '1', 
        email: 'test@example.com', 
        role: 'admin',
        isEmailVerified: true 
      },
      hasAnyRole: jest.fn(() => true),
      hasAnyPermission: jest.fn((perms) => perms.includes('users.read')),
    } as any);

    const ProtectedComponent = withAuth(TestComponent, {
      requiredPermissions: ['users.read', 'users.write'],
    });

    render(<ProtectedComponent />);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('works with no requirements (just authentication)', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      user: { 
        id: '1', 
        email: 'test@example.com', 
        role: 'user',
        isEmailVerified: true 
      },
      hasAnyRole: jest.fn(() => true),
      hasAnyPermission: jest.fn(() => true),
    } as any);

    const ProtectedComponent = withAuth(TestComponent);

    render(<ProtectedComponent />);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('preserves component display name', () => {
    const NamedComponent = () => <div>Test</div>;
    NamedComponent.displayName = 'NamedComponent';

    const ProtectedComponent = withAuth(NamedComponent);
    expect(ProtectedComponent.displayName).toBe('withAuth(NamedComponent)');
  });

  it('handles component without display name', () => {
    const AnonymousComponent = () => <div>Test</div>;

    const ProtectedComponent = withAuth(AnonymousComponent);
    expect(ProtectedComponent.displayName).toBe('withAuth(AnonymousComponent)');
  });
});