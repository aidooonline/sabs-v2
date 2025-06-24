import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { MainMenu, MenuItem } from '../../../components/organisms/MainMenu';
import { useAuth } from '../../../hooks/useAuth';

// Mock hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockPush = jest.fn();
const mockHasRole = jest.fn();
const mockHasPermission = jest.fn();

// Test data
const testMenuItems: MenuItem[] = [
  {
    id: 'item-1',
    title: 'Dashboard',
    description: 'View analytics and insights',
    icon: ({ className }: { className?: string }) => (
      <div className={className} data-testid="dashboard-icon">📊</div>
    ),
    path: '/dashboard',
    category: 'Analytics',
    featured: true,
  },
  {
    id: 'item-2',
    title: 'Users',
    description: 'Manage user accounts',
    icon: ({ className }: { className?: string }) => (
      <div className={className} data-testid="users-icon">👥</div>
    ),
    path: '/users',
    category: 'Management',
    roles: ['admin'],
  },
  {
    id: 'item-3',
    title: 'Settings',
    description: 'Configure system settings',
    icon: ({ className }: { className?: string }) => (
      <div className={className} data-testid="settings-icon">⚙️</div>
    ),
    path: '/settings',
    category: 'Management',
    permissions: ['settings.read'],
  },
  {
    id: 'item-4',
    title: 'Reports',
    description: 'Generate financial reports',
    icon: ({ className }: { className?: string }) => (
      <div className={className} data-testid="reports-icon">📈</div>
    ),
    path: '/reports',
    category: 'Analytics',
    roles: ['admin', 'clerk'],
    featured: true,
  },
];

describe('MainMenu', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    (useAuth as jest.Mock).mockReturnValue({
      hasRole: mockHasRole,
      hasPermission: mockHasPermission,
    });
    
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders menu items grouped by category', () => {
      mockHasRole.mockReturnValue(true);
      mockHasPermission.mockReturnValue(true);

      render(<MainMenu items={testMenuItems} />);

      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Management')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
    });

    it('renders featured items in Quick Actions section', () => {
      mockHasRole.mockReturnValue(true);
      mockHasPermission.mockReturnValue(true);

      render(<MainMenu items={testMenuItems} />);

      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
    });

    it('renders search input by default', () => {
      render(<MainMenu items={testMenuItems} />);

      expect(screen.getByPlaceholderText('Search menu items...')).toBeInTheDocument();
    });

    it('hides search when showSearch is false', () => {
      render(<MainMenu items={testMenuItems} showSearch={false} />);

      expect(screen.queryByPlaceholderText('Search menu items...')).not.toBeInTheDocument();
    });

    it('hides featured section when showFeatured is false', () => {
      mockHasRole.mockReturnValue(true);
      render(<MainMenu items={testMenuItems} showFeatured={false} />);

      expect(screen.queryByText('Quick Actions')).not.toBeInTheDocument();
    });

    it('renders with custom search placeholder', () => {
      render(<MainMenu items={testMenuItems} searchPlaceholder="Find features..." />);

      expect(screen.getByPlaceholderText('Find features...')).toBeInTheDocument();
    });
  });

  describe('Role-based filtering', () => {
    it('shows items when user has required role', () => {
      mockHasRole.mockImplementation((role: string) => role === 'admin');
      mockHasPermission.mockReturnValue(true);

      render(<MainMenu items={testMenuItems} />);

      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
    });

    it('hides items when user lacks required role', () => {
      mockHasRole.mockImplementation((role: string) => role === 'user');
      mockHasPermission.mockReturnValue(true);

      render(<MainMenu items={testMenuItems} />);

      expect(screen.queryByText('Users')).not.toBeInTheDocument();
      expect(screen.queryByText('Reports')).not.toBeInTheDocument();
    });

    it('shows items without role restrictions', () => {
      mockHasRole.mockReturnValue(false);
      mockHasPermission.mockReturnValue(true);

      render(<MainMenu items={testMenuItems} />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Permission-based filtering', () => {
    it('shows items when user has required permission', () => {
      mockHasRole.mockReturnValue(true);
      mockHasPermission.mockImplementation((permission: string) => 
        permission === 'settings.read'
      );

      render(<MainMenu items={testMenuItems} />);

      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('hides items when user lacks required permission', () => {
      mockHasRole.mockReturnValue(true);
      mockHasPermission.mockImplementation((permission: string) => 
        permission !== 'settings.read'
      );

      render(<MainMenu items={testMenuItems} />);

      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });
  });

  describe('Search functionality', () => {
    beforeEach(() => {
      mockHasRole.mockReturnValue(true);
      mockHasPermission.mockReturnValue(true);
    });

    it('filters items by title', async () => {
      render(<MainMenu items={testMenuItems} />);

      const searchInput = screen.getByPlaceholderText('Search menu items...');
      fireEvent.change(searchInput, { target: { value: 'dashboard' } });

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.queryByText('Users')).not.toBeInTheDocument();
        expect(screen.queryByText('Quick Actions')).not.toBeInTheDocument();
      });
    });

    it('filters items by description', async () => {
      render(<MainMenu items={testMenuItems} />);

      const searchInput = screen.getByPlaceholderText('Search menu items...');
      fireEvent.change(searchInput, { target: { value: 'analytics' } });

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.queryByText('Users')).not.toBeInTheDocument();
      });
    });

    it('filters items by category', async () => {
      render(<MainMenu items={testMenuItems} />);

      const searchInput = screen.getByPlaceholderText('Search menu items...');
      fireEvent.change(searchInput, { target: { value: 'management' } });

      await waitFor(() => {
        expect(screen.getByText('Users')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      });
    });

    it('shows no results message when search yields no matches', async () => {
      render(<MainMenu items={testMenuItems} />);

      const searchInput = screen.getByPlaceholderText('Search menu items...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your search query or browse the categories above.')).toBeInTheDocument();
      });
    });

    it('clears search and shows all items when input is cleared', async () => {
      render(<MainMenu items={testMenuItems} />);

      const searchInput = screen.getByPlaceholderText('Search menu items...');
      
      // Search for something
      fireEvent.change(searchInput, { target: { value: 'dashboard' } });
      await waitFor(() => {
        expect(screen.queryByText('Users')).not.toBeInTheDocument();
      });

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });
      await waitFor(() => {
        expect(screen.getByText('Users')).toBeInTheDocument();
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      mockHasRole.mockReturnValue(true);
      mockHasPermission.mockReturnValue(true);
    });

    it('navigates to item path when clicked', () => {
      render(<MainMenu items={testMenuItems} />);

      const dashboardItems = screen.getAllByText('Dashboard');
      fireEvent.click(dashboardItems[0]);

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('calls custom onItemClick handler when provided', () => {
      const mockOnItemClick = jest.fn();
      render(<MainMenu items={testMenuItems} onItemClick={mockOnItemClick} />);

      const dashboardItems = screen.getAllByText('Dashboard');
      fireEvent.click(dashboardItems[0]);

      expect(mockOnItemClick).toHaveBeenCalledWith(testMenuItems[0]);
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Compact mode', () => {
    beforeEach(() => {
      mockHasRole.mockReturnValue(true);
      mockHasPermission.mockReturnValue(true);
    });

    it('renders in compact layout when compact prop is true', () => {
      render(<MainMenu items={testMenuItems} compact />);

      // Compact mode should still show content but with different styling
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    it('hides descriptions in compact mode', () => {
      render(<MainMenu items={testMenuItems} compact />);

      // In compact mode, descriptions should not be visible
      expect(screen.queryByText('View analytics and insights')).not.toBeInTheDocument();
    });
  });

  describe('Empty states', () => {
    it('shows empty state when no items are available', () => {
      mockHasRole.mockReturnValue(false);
      mockHasPermission.mockReturnValue(false);

      render(<MainMenu items={testMenuItems} />);

      expect(screen.getByText('No menu items available')).toBeInTheDocument();
      expect(screen.getByText('Contact your administrator if you need access to additional features.')).toBeInTheDocument();
    });

    it('shows empty state when items array is empty', () => {
      mockHasRole.mockReturnValue(true);
      mockHasPermission.mockReturnValue(true);
      
      render(<MainMenu items={[]} />);

      expect(screen.getByText('No menu items available')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockHasRole.mockReturnValue(true);
      mockHasPermission.mockReturnValue(true);
    });

    it('menu items are clickable and have proper focus', () => {
      render(<MainMenu items={testMenuItems} />);

      const dashboardItems = screen.getAllByText('Dashboard');
      const firstDashboardItem = dashboardItems[0].closest('div[role="button"], button, a');
      expect(firstDashboardItem).toBeTruthy();
    });

    it('search input is properly labeled', () => {
      render(<MainMenu items={testMenuItems} />);

      const searchInput = screen.getByPlaceholderText('Search menu items...');
      expect(searchInput).toHaveAttribute('type', 'text');
    });
  });

  describe('Icons', () => {
    beforeEach(() => {
      mockHasRole.mockReturnValue(true);
      mockHasPermission.mockReturnValue(true);
    });

    it('renders item icons', () => {
      render(<MainMenu items={testMenuItems} />);

      expect(screen.getAllByTestId('dashboard-icon').length).toBeGreaterThan(0);
      expect(screen.getByTestId('users-icon')).toBeInTheDocument();
    });

    it('applies correct icon styling for featured items', () => {
      render(<MainMenu items={testMenuItems} />);

      const dashboardIcons = screen.getAllByTestId('dashboard-icon');
      expect(dashboardIcons[0]).toHaveClass('w-6', 'h-6');
    });
  });
});