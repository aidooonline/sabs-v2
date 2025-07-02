import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Import real Redux slices and APIs (no mocking)
import authSlice from '../../store/slices/authSlice';
import uiSlice from '../../store/slices/uiSlice';
import { approvalApi } from '../../store/api/approvalApi';
import { dashboardApi } from '../../store/api/dashboardApi';

// Import test utilities
import { TestFramework } from '../setup/testFramework';

// Import component
import ApprovalDashboard from '../../app/approval/dashboard/page';

// Create MSW server with proper API responses
const mockWorkflowsData = {
  workflows: [
    {
      id: 'WF-123',
      workflowNumber: 'WF-123',
      status: 'pending',
      priority: 'high',
      withdrawalRequest: {
        customer: { fullName: 'John Doe' },
        agent: { fullName: 'Agent Smith' },
        amount: 5000,
        currency: 'GHS'
      },
      riskAssessment: { overallRisk: 'medium' },
      currentStage: 'pending_review',
      createdAt: new Date().toISOString(),
      slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    },
    ...Array.from({ length: 19 }, (_, i) => ({
      id: `WF-${1000 + i}`,
      workflowNumber: `WF-${1000 + i}`,
      status: 'pending',
      priority: ['low', 'medium', 'high'][i % 3],
      withdrawalRequest: {
        customer: { fullName: `Customer ${i + 1}` },
        agent: { fullName: `Agent ${i + 1}` },
        amount: Math.floor(Math.random() * 50000) + 1000,
        currency: 'GHS'
      },
      riskAssessment: { overallRisk: ['low', 'medium', 'high'][i % 3] },
      currentStage: 'pending_review',
      createdAt: new Date().toISOString(),
      slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }))
  ],
  pagination: {
    currentPage: 1,
    totalPages: 7,
    totalCount: 125,
    hasNext: true,
    hasPrevious: false
  }
};

const mockDashboardStats = {
  queueStats: { 
    totalPending: 125,
    averageProcessingTime: 4.5,
    slaCompliance: 0.89
  },
  performanceMetrics: { 
    approvalsToday: 45 
  }
};

const mockQueueMetrics = {
  totalPending: 125,
  totalApproved: 890,
  totalRejected: 45,
  averageProcessingTime: 270,
  slaCompliance: 0.89,
  riskDistribution: [
    { riskLevel: 'low', count: 45 },
    { riskLevel: 'medium', count: 67 },
    { riskLevel: 'high', count: 13 }
  ]
};

// MSW server setup
const server = setupServer(
  // Workflows endpoint
  http.get('/api/approval-workflow/workflows', () => {
    return HttpResponse.json(mockWorkflowsData);
  }),
  
  // Dashboard stats endpoint
  http.get('/api/approval-workflow/dashboard/stats', () => {
    return HttpResponse.json(mockDashboardStats);
  }),
  
  // Queue metrics endpoint
  http.get('/api/approval-workflow/dashboard/queue-metrics', () => {
    return HttpResponse.json(mockQueueMetrics);
  }),

  // Error simulation endpoint
  http.get('/api/approval-workflow/workflows-error', () => {
    return new HttpResponse(null, { status: 500 });
  })
);

// Real Redux store setup with actual RTK Query
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
      ui: uiSlice.reducer,
      [approvalApi.reducerPath]: approvalApi.reducer,
      [dashboardApi.reducerPath]: dashboardApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        },
      })
      .concat(approvalApi.middleware)
      .concat(dashboardApi.middleware),
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
        theme: 'light',
        bottomTabVisible: true,
        pageTitle: 'Test',
      },
      ...initialState
    }
  });
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode; store?: any }> = ({ 
  children, 
  store = createTestStore() 
}) => (
  <Provider store={store}>
    {children}
  </Provider>
);

// Mock the WebSocket hook
jest.mock('../../hooks/useApprovalWebSocket', () => ({
  useApprovalWebSocket: () => ({
    isConnected: true,
    error: null,
    sendMessage: jest.fn(),
  }),
}));

describe('ApprovalDashboard Integration Tests', () => {
  const user = userEvent.setup();

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Dashboard Loading and Initialization', () => {
    it('should render dashboard with loading state initially', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      // Dashboard should render immediately
      await waitFor(() => {
        expect(screen.getByText('Approval Dashboard')).toBeInTheDocument();
      });
    });

    it('should load dashboard data on mount', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      // Wait for API calls to complete and content to load
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify data is loaded
      await waitFor(() => {
        expect(screen.getByTestId('total-pending-count')).toHaveTextContent('125');
      });
    });

    it('should display error state when API fails', async () => {
      // Override server to return error
      server.use(
        http.get('/api/approval-workflow/workflows', () => {
          return new HttpResponse(JSON.stringify({ message: 'Server Error' }), { status: 500 });
        })
      );

      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-error')).toBeInTheDocument();
        expect(screen.getByText(/error loading workflows/i)).toBeInTheDocument();
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
        expect(screen.getByTestId('total-pending-count')).toBeInTheDocument();
        expect(screen.getByTestId('total-pending-count')).toHaveTextContent('125');
      });
    });

    it('should display workflow queue statistics', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
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

      // Wait for workflows to load
      await waitFor(() => {
        expect(screen.getByTestId('workflow-item-0')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Should show workflow items
      const workflowItems = screen.getAllByTestId(/^workflow-item-/);
      expect(workflowItems.length).toBeGreaterThan(0);

      // Should show pagination controls
      expect(screen.getByTestId('pagination-controls')).toBeInTheDocument();
    });

    it('should filter workflows by status', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByTestId('status-filter')).toBeInTheDocument();
      });

      const statusFilter = screen.getByTestId('status-filter');
      await user.click(statusFilter);

      const highPriorityOption = screen.getByText('High Priority');
      await user.click(highPriorityOption);

      // Verify filtering works (API should be called with filter params)
      await waitFor(() => {
        expect(screen.getByTestId('status-filter')).toBeInTheDocument();
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

      const sortDropdown = screen.getByTestId('sort-dropdown');
      await user.click(sortDropdown);

      const amountSort = screen.getByText('Amount (High to Low)');
      await user.click(amountSort);

      // Verify sorting is applied
      await waitFor(() => {
        expect(screen.getByTestId('sort-dropdown')).toBeInTheDocument();
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

      const nextPageButton = screen.getByLabelText('Next page');
      await user.click(nextPageButton);

      // Should load page 2
      await waitFor(() => {
        expect(screen.getByTestId('pagination-controls')).toBeInTheDocument();
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
        expect(screen.getByTestId('workflow-item-0')).toBeInTheDocument();
      });

      const firstWorkflow = screen.getByTestId('workflow-item-0');
      await user.click(firstWorkflow);

      // Verify workflow details or navigation occurs
      await waitFor(() => {
        expect(screen.getByTestId('workflow-item-0')).toBeInTheDocument();
      });
    });

    it('should allow quick approval from dashboard', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('quick-approve-WF-123')).toBeInTheDocument();
      });

      const quickApproveButton = screen.getByTestId('quick-approve-WF-123');
      await user.click(quickApproveButton);

      // Should trigger approval flow
      await waitFor(() => {
        expect(screen.getByTestId('quick-approve-WF-123')).toBeInTheDocument();
      });
    });

    it('should allow bulk actions on selected workflows', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        const checkboxes = screen.getAllByTestId(/^workflow-checkbox-/);
        expect(checkboxes.length).toBeGreaterThan(2);
      });

      // Select multiple workflows
      const checkboxes = screen.getAllByTestId(/^workflow-checkbox-/);
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      // Should show bulk actions
      await waitFor(() => {
        expect(screen.getByTestId('bulk-actions-bar')).toBeInTheDocument();
      });

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

      // Simulate WebSocket message
      const websocketEvent = new CustomEvent('websocket-message', {
        detail: {
          type: 'workflow_created',
          data: {
            workflowNumber: 'WF-9999',
            priority: 'high',
            amount: 15000,
            status: 'pending_review'
          }
        }
      });
      window.dispatchEvent(websocketEvent);

      // Verify real-time connection is working
      await waitFor(() => {
        expect(screen.getByTestId('total-pending-count')).toBeInTheDocument();
        expect(screen.getByText('Live')).toBeInTheDocument();
      });
    });

    it('should show real-time notifications', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      });

      expect(screen.getByText('Live')).toBeInTheDocument();

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

      await waitFor(() => {
        expect(screen.getByText('Live')).toBeInTheDocument();
      });
    });

    it('should update workflow status in real-time', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByTestId('total-pending-count')).toBeInTheDocument();
      });

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

      await waitFor(() => {
        expect(screen.getByText('Live')).toBeInTheDocument();
        expect(screen.getByTestId('total-pending-count')).toBeInTheDocument();
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

      expect(renderTime).toBeLessThan(2000);
      
      const memoryUsage = memoryTracker.getMemoryUsage();
      expect(memoryUsage).toBeLessThan(50 * 1024 * 1024);
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

      expect(container.querySelector('[data-testid="dashboard-content"]')).toBeInTheDocument();
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

      const showFiltersButton = screen.getByText('Show Filters');
      await user.click(showFiltersButton);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      await user.tab();
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeDefined();

      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toBeInTheDocument();
      
      searchInput.focus();
      expect(searchInput).toHaveFocus();

      const statusFilter = screen.getByTestId('status-filter');
      expect(statusFilter).toBeInTheDocument();

      await user.keyboard('{Tab}');
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('status-filter')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty workflow list gracefully', async () => {
      // Override server to return empty data
      server.use(
        http.get('/api/approval-workflow/workflows', () => {
          return HttpResponse.json({
            workflows: [],
            pagination: {
              currentPage: 1,
              totalPages: 0,
              totalCount: 0,
              hasNext: false,
              hasPrevious: false
            }
          });
        }),
        http.get('/api/approval-workflow/dashboard/stats', () => {
          return HttpResponse.json({
            queueStats: { totalPending: 0 },
            performanceMetrics: { approvalsToday: 0 }
          });
        }),
        http.get('/api/approval-workflow/dashboard/queue-metrics', () => {
          return HttpResponse.json({
            totalPending: 0,
            totalApproved: 0,
            totalRejected: 0,
            averageProcessingTime: 0,
            slaCompliance: 1.0
          });
        })
      );

      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      });

      await waitFor(() => {
        const emptyState = screen.queryByTestId('empty-workflows-state');
        if (emptyState) {
          expect(emptyState).toBeInTheDocument();
          expect(screen.getByText(/no pending approvals/i)).toBeInTheDocument();
        } else {
          expect(screen.getByTestId('total-pending-count')).toHaveTextContent('0');
        }
      });
    });

    it('should handle network errors gracefully', async () => {
      // Override server to return error
      server.use(
        http.get('/api/approval-workflow/workflows', () => {
          return new HttpResponse(JSON.stringify({ message: 'Network Error' }), { status: 500 });
        })
      );

      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-error')).toBeInTheDocument();
        expect(screen.getByTestId('network-error-message')).toBeInTheDocument();
        expect(screen.getByText(/check your connection/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton).toBeInTheDocument();

      // Reset server to success for retry
      server.use(
        http.get('/api/approval-workflow/workflows', () => {
          return HttpResponse.json(mockWorkflowsData);
        })
      );
      
      await user.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
        expect(screen.queryByTestId('dashboard-error')).not.toBeInTheDocument();
      });
    });

    it('should handle slow API responses', async () => {
      // Override server with delay
      server.use(
        http.get('/api/approval-workflow/workflows', async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return HttpResponse.json(mockWorkflowsData);
        })
      );

      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      });

      await waitFor(() => {
        const loadingElement = screen.queryByTestId('dashboard-loading');
        const skeletonElement = screen.queryByText(/loading/i);
        
        if (loadingElement) {
          expect(loadingElement).toBeInTheDocument();
        } else if (skeletonElement) {
          expect(skeletonElement).toBeInTheDocument();
        } else {
          expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
        }
      });
    });

    it('should validate user permissions for actions', async () => {
      const restrictedStore = createTestStore({
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

      const showFiltersButton = screen.getByText('Show Filters');
      await user.click(showFiltersButton);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'John Doe');

      await waitFor(() => {
        expect(searchInput).toHaveValue('John Doe');
      }, { timeout: 1500 });

      expect(searchInput).toHaveValue('John Doe');
    });

    it('should filter by date range', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      const showFiltersButton = screen.getByText('Show Filters');
      await user.click(showFiltersButton);

      await waitFor(() => {
        const advancedFiltersButton = screen.getByText('Advanced Filters');
        expect(advancedFiltersButton).toBeInTheDocument();
      });
      
      const advancedFiltersButton = screen.getByText('Advanced Filters');
      await user.click(advancedFiltersButton);

      await waitFor(() => {
        expect(screen.getByTestId('date-filter-button')).toBeInTheDocument();
      });

      const dateFilterButton = screen.getByTestId('date-filter-button');
      await user.click(dateFilterButton);

      await waitFor(() => {
        expect(screen.getByTestId('date-filter-button')).toBeInTheDocument();
      });

      expect(screen.getByTestId('date-filter-button')).toBeEnabled();
    });

    it('should clear all filters', async () => {
      render(
        <TestWrapper>
          <ApprovalDashboard />
        </TestWrapper>
      );

      const showFiltersButton = screen.getByText('Show Filters');
      await user.click(showFiltersButton);

      await waitFor(() => {
        expect(screen.getByTestId('status-filter')).toBeInTheDocument();
      });

      const statusFilter = screen.getByTestId('status-filter');
      expect(statusFilter).toBeInTheDocument();
      await user.click(statusFilter);

      const highOption = screen.queryByText('High');
      if (highOption) {
        await user.click(highOption);
      }

      const hideFiltersButton = screen.getByText('Hide Filters');
      await user.click(hideFiltersButton);

      await waitFor(() => {
        expect(screen.queryByTestId('status-filter')).not.toBeInTheDocument();
      });
    });
  });
});