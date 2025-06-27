import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from '@reduxjs/toolkit';
import ApprovalDashboard from '../../app/approval/dashboard/page';
import { setupApiMocks, MockDataGenerators, ApiAssertions, mockFetch } from '../setup/mocks/apiMocks';
import { TestFramework } from '../setup/testFramework';
import authSlice from '../../store/slices/authSlice';
import uiSlice from '../../store/slices/uiSlice';
import { approvalApi } from '../../store/api/approvalApi';
import { dashboardApi } from '../../store/api/dashboardApi';

// Mock Redux store setup with proper RTK Query integration
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      ui: uiSlice,
      approvalApi: approvalApi.reducer,
      dashboardApi: dashboardApi.reducer,
    },
    preloadedState: {
      auth: { 
        user: TestFramework.generateUser(), 
        isAuthenticated: true,
        token: 'mock-token'
      },
      ui: {
        isLoading: false,
        notifications: [],
        modals: {},
        sidebarOpen: true,
        breadcrumbs: [],
        theme: 'light'
      },
      ...initialState
    }
  });
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode; store?: any }> = ({ 
  children, 
  store = createMockStore() 
}) => (
  <Provider store={store}>
    {children}
  </Provider>
);

describe('ApprovalDashboard Integration Tests', () => {
  setupApiMocks();
  
  const user = userEvent.setup();

  beforeEach(() => {
    // Reset any component state
    jest.clearAllMocks();
  });

  describe('Dashboard Loading and Initialization', () => {
    it('should render dashboard with loading state initially', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      // Should show loading indicators
      expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
      
      // Should not show content yet
      expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
    });

    it('should load dashboard data on mount', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      // Wait for API calls to complete
      await waitFor(() => {
        ApiAssertions.expectApiCalled('GET /api/dashboard/stats');
        ApiAssertions.expectApiCalled('GET /api/workflows');
      });

      // Should display dashboard content
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      });
    });

    it('should display error state when API fails', async () => {
      // Simulate API error
      const mockFetch = (global as any).fetch;
      mockFetch.simulateError('GET /api/dashboard/stats', 500, 'Server Error');

      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-error')).toBeInTheDocument();
        expect(screen.getByText(/failed to load dashboard/i)).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Statistics Display', () => {
    it('should display key performance metrics', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for key metrics
        expect(screen.getByTestId('total-pending-count')).toBeInTheDocument();
        expect(screen.getByTestId('high-priority-count')).toBeInTheDocument();
        expect(screen.getByTestId('overdue-count')).toBeInTheDocument();
        expect(screen.getByTestId('avg-processing-time')).toBeInTheDocument();
        expect(screen.getByTestId('completion-rate')).toBeInTheDocument();
        expect(screen.getByTestId('sla-compliance')).toBeInTheDocument();
      });
    });

    it('should display workflow queue statistics', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for queue distribution
        expect(screen.getByTestId('queue-by-status')).toBeInTheDocument();
        expect(screen.getByTestId('queue-by-priority')).toBeInTheDocument();
        expect(screen.getByTestId('queue-by-amount')).toBeInTheDocument();
      });
    });

    it('should show weekly trend chart', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('weekly-trend-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Workflow Queue Management', () => {
    it('should display paginated workflow list', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should show workflow items
        const workflowItems = screen.getAllByTestId(/^workflow-item-/);
        expect(workflowItems).toHaveLength(10); // Default page size

        // Should show pagination controls
        expect(screen.getByTestId('pagination-controls')).toBeInTheDocument();
      });
    });

    it('should filter workflows by status', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('status-filter')).toBeInTheDocument();
      });

      // Click on status filter
      const statusFilter = screen.getByTestId('status-filter');
      await user.click(statusFilter);

      // Select "High Priority" filter
      const highPriorityOption = screen.getByText('High Priority');
      await user.click(highPriorityOption);

      // Should make filtered API call
      await waitFor(() => {
        ApiAssertions.expectApiCalled('GET /api/workflows');
        const lastCall = ApiAssertions.getLastApiCall('GET /api/workflows');
        expect(lastCall.url).toContain('priority=high');
      });
    });

    it('should sort workflows by different criteria', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('sort-dropdown')).toBeInTheDocument();
      });

      // Click sort dropdown
      const sortDropdown = screen.getByTestId('sort-dropdown');
      await user.click(sortDropdown);

      // Select "Amount (High to Low)"
      const amountSort = screen.getByText('Amount (High to Low)');
      await user.click(amountSort);

      // Should make sorted API call
      await waitFor(() => {
        const lastCall = ApiAssertions.getLastApiCall('GET /api/workflows');
        expect(lastCall.url).toContain('sort=amount&order=desc');
      });
    });

    it('should handle pagination navigation', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('pagination-controls')).toBeInTheDocument();
      });

      // Click next page
      const nextPageButton = screen.getByLabelText('Next page');
      await user.click(nextPageButton);

      // Should load page 2
      await waitFor(() => {
        const lastCall = ApiAssertions.getLastApiCall('GET /api/workflows');
        expect(lastCall.url).toContain('page=2');
      });
    });
  });

  describe('Workflow Actions', () => {
    it('should open workflow details when clicked', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        const firstWorkflow = screen.getByTestId('workflow-item-0');
        expect(firstWorkflow).toBeInTheDocument();
      });

      // Click on first workflow
      const firstWorkflow = screen.getByTestId('workflow-item-0');
      await user.click(firstWorkflow);

      // Should navigate to workflow details
      expect(window.location.href).toContain('/approval/workflow/');
    });

    it('should allow quick approval from dashboard', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        const quickApproveButton = screen.getByTestId('quick-approve-WF-123');
        expect(quickApproveButton).toBeInTheDocument();
      });

      // Click quick approve
      const quickApproveButton = screen.getByTestId('quick-approve-WF-123');
      await user.click(quickApproveButton);

      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByTestId('approval-confirmation-dialog')).toBeInTheDocument();
      });

      // Confirm approval
      const confirmButton = screen.getByTestId('confirm-approve-button');
      await user.click(confirmButton);

      // Should make approve API call
      await waitFor(() => {
        ApiAssertions.expectApiCalled('POST /api/workflows/:id/approve');
      });

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/workflow approved successfully/i)).toBeInTheDocument();
      });
    });

    it('should allow bulk actions on selected workflows', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        // Select multiple workflows
        const checkboxes = screen.getAllByTestId(/^workflow-checkbox-/);
        expect(checkboxes.length).toBeGreaterThan(2);
      });

      // Select first two workflows
      const firstCheckbox = screen.getByTestId('workflow-checkbox-0');
      const secondCheckbox = screen.getByTestId('workflow-checkbox-1');
      
      await user.click(firstCheckbox);
      await user.click(secondCheckbox);

      // Should show bulk actions bar
      await waitFor(() => {
        expect(screen.getByTestId('bulk-actions-bar')).toBeInTheDocument();
        expect(screen.getByText('2 workflows selected')).toBeInTheDocument();
      });

      // Click bulk assign
      const bulkAssignButton = screen.getByTestId('bulk-assign-button');
      await user.click(bulkAssignButton);

      // Should show assignment dialog
      await waitFor(() => {
        expect(screen.getByTestId('bulk-assignment-dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should update dashboard when new workflows arrive', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('total-pending-count')).toHaveTextContent('125');
      });

      // Simulate WebSocket message for new workflow
      const websocketEvent = new CustomEvent('websocket-message', {
        detail: {
          type: 'workflow_created',
          data: MockDataGenerators.workflow({ status: 'pending_review' })
        }
      });
      window.dispatchEvent(websocketEvent);

      // Should update pending count
      await waitFor(() => {
        expect(screen.getByTestId('total-pending-count')).toHaveTextContent('126');
      });
    });

    it('should show real-time notifications', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      // Simulate assignment notification
      const notificationEvent = new CustomEvent('websocket-message', {
        detail: {
          type: 'workflow_assigned',
          data: {
            workflowId: 'WF-NEW',
            assignedTo: 'current-user',
            message: 'New workflow assigned to you'
          }
        }
      });
      window.dispatchEvent(notificationEvent);

      // Should show notification toast
      await waitFor(() => {
        expect(screen.getByTestId('notification-toast')).toBeInTheDocument();
        expect(screen.getByText('New workflow assigned to you')).toBeInTheDocument();
      });
    });

    it('should update workflow status in real-time', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        const workflowStatus = screen.getByTestId('workflow-status-WF-123');
        expect(workflowStatus).toHaveTextContent('Pending Review');
      });

      // Simulate status update
      const statusUpdateEvent = new CustomEvent('websocket-message', {
        detail: {
          type: 'workflow_status_changed',
          data: {
            workflowId: 'WF-123',
            newStatus: 'approved',
            approvedBy: 'manager-user'
          }
        }
      });
      window.dispatchEvent(statusUpdateEvent);

      // Should update status display
      await waitFor(() => {
        const workflowStatus = screen.getByTestId('workflow-status-WF-123');
        expect(workflowStatus).toHaveTextContent('Approved');
      });
    });
  });

  describe('Performance and Accessibility', () => {
    it('should render dashboard within performance budget', async () => {
      const memoryTracker = TestFramework.detectMemoryLeaks();
      
      const renderTime = await TestFramework.measureRenderTime(async () => {
        render(
          <TestWrapper>
            <ApprovalDashboard />
          </TestWrapper>
        );
        
        await waitFor(() => {
          expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
        });
      });

      // Should render within 2 seconds
      expect(renderTime).toBeLessThan(2000);
      
      // Should not consume excessive memory
      const memoryUsage = memoryTracker.getMemoryUsage();
      expect(memoryUsage).toBeLessThan(50 * 1024 * 1024); // 50MB limit
    });

    it('should be accessible to screen readers', async () => {
      const { container } = render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      });

      // Check accessibility
      const accessibilityResults = await TestFramework.checkAccessibility(container);
      expect(accessibilityResults.violations).toHaveLength(0);

      // Should have proper ARIA labels
      expect(container).toBeAccessible();
    });

    it('should handle keyboard navigation properly', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      });

      // Tab through interactive elements
      await user.tab();
      expect(screen.getByTestId('search-input')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('status-filter')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('sort-dropdown')).toHaveFocus();

      // Should be able to interact with keyboard
      await user.keyboard('{Enter}');
      expect(screen.getByTestId('sort-options')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty workflow list gracefully', async () => {
      // Mock empty response
      const mockFetch = (global as any).fetch;
      mockFetch.setEndpointResponse('GET /api/workflows', {
        status: 200,
        data: { workflows: [], pagination: { total: 0 } }
      });

      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('empty-workflows-state')).toBeInTheDocument();
        expect(screen.getByText(/no workflows found/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      // Simulate network error
      const mockFetch = (global as any).fetch;
      mockFetch.simulateError('GET /api/workflows', 0, 'Network Error');

      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('network-error-message')).toBeInTheDocument();
        expect(screen.getByText(/check your connection/i)).toBeInTheDocument();
      });

      // Should have retry button
      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton).toBeInTheDocument();

      // Clicking retry should reload data
      await user.click(retryButton);
      await waitFor(() => {
        ApiAssertions.expectApiCalled('GET /api/workflows', 2);
      });
    });

    it('should handle slow API responses', async () => {
      // Simulate slow network
      const mockFetch = (global as any).fetch;
      mockFetch.simulateSlowNetwork('GET /api/workflows', 3000);

      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      // Should show loading state
      expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();

      // Should eventually load content
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should validate user permissions for actions', async () => {
      // Create store with limited permissions
      const restrictedStore = createMockStore({
        auth: {
          user: TestFramework.generateUser({ 
            role: 'viewer',
            permissions: ['view_workflows'] 
          }),
          isAuthenticated: true
        }
      });

      render(
        <TestWrapper store={restrictedStore}>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should not show action buttons for restricted user
        expect(screen.queryByTestId('quick-approve-button')).not.toBeInTheDocument();
        expect(screen.queryByTestId('bulk-actions-bar')).not.toBeInTheDocument();
      });
    });
  });

  describe('Search and Filtering', () => {
    it('should search workflows by customer name', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      // Type in search
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'John Doe');

      // Should debounce and make API call
      await waitFor(() => {
        const lastCall = ApiAssertions.getLastApiCall('GET /api/workflows');
        expect(lastCall.url).toContain('search=John%20Doe');
      }, { timeout: 1500 }); // Account for debounce delay
    });

    it('should filter by date range', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      // Open date filter
      const dateFilterButton = screen.getByTestId('date-filter-button');
      await user.click(dateFilterButton);

      // Select "Last 7 days"
      const last7DaysOption = screen.getByText('Last 7 days');
      await user.click(last7DaysOption);

      // Should make filtered API call
      await waitFor(() => {
        const lastCall = ApiAssertions.getLastApiCall('GET /api/workflows');
        expect(lastCall.url).toContain('dateRange=7d');
      });
    });

    it('should clear all filters', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      // Apply some filters first
      const statusFilter = screen.getByTestId('status-filter');
      await user.click(statusFilter);
      await user.click(screen.getByText('High Priority'));

      // Should show clear filters button
      await waitFor(() => {
        expect(screen.getByTestId('clear-filters-button')).toBeInTheDocument();
      });

      // Clear filters
      const clearFiltersButton = screen.getByTestId('clear-filters-button');
      await user.click(clearFiltersButton);

      // Should reset to default API call
      await waitFor(() => {
        const lastCall = ApiAssertions.getLastApiCall('GET /api/workflows');
        expect(lastCall.url).not.toContain('priority=');
        expect(lastCall.url).not.toContain('search=');
      });
    });
  });
});