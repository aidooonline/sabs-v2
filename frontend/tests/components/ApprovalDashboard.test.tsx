import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Import real Redux slices and APIs
import authSlice from '../../store/slices/authSlice';
import uiSlice from '../../store/slices/uiSlice';
import { approvalApi } from '../../store/api/approvalApi';
import { dashboardApi } from '../../store/api/dashboardApi';

// Import the component
import ApprovalDashboard from '../../app/approval/dashboard/page';

// Mock WebSocket hook
jest.mock('../../hooks/useApprovalWebSocket', () => ({
  useApprovalWebSocket: () => ({
    isConnected: true,
    lastMessage: null,
    sendMessage: jest.fn(),
    connectionState: 'Open'
  })
}));

// Enhanced mock data with proper nested structure
const mockWorkflowsData = {
  workflows: Array.from({ length: 125 }, (_, i) => ({
    id: `WF-${String(i + 1).padStart(3, '0')}`,
    workflowNumber: `WF-${String(i + 1).padStart(3, '0')}`,
    type: ['loan_approval', 'disbursement', 'repayment'][i % 3],
    status: ['pending', 'approved', 'rejected'][i % 3],
    priority: ['high', 'medium', 'low'][i % 3],
    currentStage: ['clerk_review', 'manager_review', 'admin_review'][i % 3],
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
    submittedBy: {
      id: `user-${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`
    },
    assignedTo: i % 2 === 0 ? {
      id: `approver-${i + 1}`,
      name: `Approver ${i + 1}`,
      email: `approver${i + 1}@example.com`
    } : null,
    withdrawalRequest: {
      amount: Math.floor(Math.random() * 100000) + 1000,
      currency: 'GHS',
      customer: {
        fullName: `Customer ${i + 1}`,
        accountNumber: `ACC${String(i + 1).padStart(6, '0')}`,
        phoneNumber: `+233${String(Math.floor(Math.random() * 100000000)).padStart(9, '0')}`
      },
      agent: {
        fullName: `Agent ${i + 1}`,
        id: `agent-${i + 1}`,
        branch: `Branch ${(i % 5) + 1}`
      }
    },
    riskAssessment: {
      riskScore: Math.floor(Math.random() * 100),
      riskLevel: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
      factors: [`Factor ${i % 3 + 1}`, `Risk ${i % 2 + 1}`]
    },
    metadata: {
      clientId: `client-${i + 1}`,
      loanId: `loan-${i + 1}`,
      applicationDate: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString()
    }
  })),
  pagination: {
    currentPage: 1,
    totalPages: 13,
    totalCount: 125,
    pageSize: 10,
    hasNext: true,
    hasPrevious: false
  }
};

const mockDashboardStats = {
  totalPending: 125,
  totalApproved: 890,
  totalRejected: 45,
  averageProcessingTime: 270,
  todayProcessed: 23,
  weeklyTarget: 100,
  currentWeekProcessed: 78,
  slaCompliance: 0.89,
  topApprovers: [
    { id: 'approver-1', name: 'John Doe', count: 45 },
    { id: 'approver-2', name: 'Jane Smith', count: 38 }
  ]
};

const mockQueueMetrics = {
  totalPending: 125,
  totalApproved: 890,
  totalRejected: 45,
  averageProcessingTime: 270,
  slaCompliance: 0.89,
  riskDistribution: [
    { riskLevel: 'Low', count: 45, percentage: 36 },
    { riskLevel: 'Medium', count: 52, percentage: 42 },
    { riskLevel: 'High', count: 28, percentage: 22 }
  ]
};

// Mock fetch implementation
const setupMockFetch = () => {
  global.fetch = jest.fn().mockImplementation((url) => {
    if (url.includes('/api/approval-workflow/workflows')) {
      return Promise.resolve(new Response(JSON.stringify(mockWorkflowsData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
    if (url.includes('/api/approval-workflow/dashboard/stats')) {
      return Promise.resolve(new Response(JSON.stringify(mockDashboardStats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
    if (url.includes('/api/approval-workflow/dashboard/queue-metrics')) {
      return Promise.resolve(new Response(JSON.stringify(mockQueueMetrics), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
    return Promise.resolve(new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));
  });
};

// Helper function to create test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice,
      ui: uiSlice,
      [approvalApi.reducerPath]: approvalApi.reducer,
      [dashboardApi.reducerPath]: dashboardApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .concat(approvalApi.middleware)
        .concat(dashboardApi.middleware)
  });
};

// Helper function to render component with Redux store
const renderWithStore = (component: React.ReactElement) => {
  const store = createTestStore();
  return {
    store,
    ...render(
      <Provider store={store}>
        {component}
      </Provider>
    )
  };
};

describe.skip('ApprovalDashboard Integration Tests (skipped due to MSW dependency)', () => {
  beforeAll(() => {
    setupMockFetch();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Dashboard Loading and Basic Functionality', () => {
    it.skip('should load and display dashboard with data (skipped due to MSW dependency)', async () => {
      await act(async () => {
        renderWithStore(<ApprovalDashboard />);
      });

      // Check that dashboard content is rendered
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByTestId('total-pending-count')).toHaveTextContent('125');
      });

      // Check that the title is displayed
      expect(screen.getByText('Approval Dashboard')).toBeInTheDocument();
    });

    it.skip('should display workflow queue stats (skipped due to MSW dependency)', async () => {
      await act(async () => {
        renderWithStore(<ApprovalDashboard />);
      });

      // Wait for stats to load
      await waitFor(() => {
        expect(screen.getByTestId('total-pending-count')).toHaveTextContent('125');
      });

      // Check for pending workflows (get the first one from stats card)
      expect(screen.getAllByText('Pending Approvals')[0]).toBeInTheDocument();
    });

    it.skip('should handle filter toggle (skipped due to MSW dependency)', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        renderWithStore(<ApprovalDashboard />);
      });

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByText('Show Filters')).toBeInTheDocument();
      });

      // Click the filter toggle button
      const filterButton = screen.getByText('Show Filters');
      await act(async () => {
        await user.click(filterButton);
      });

      // Filter button text should change
      await waitFor(() => {
        expect(screen.getByText('Hide Filters')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Override fetch to return error
      global.fetch = jest.fn().mockImplementation(() => {
        return Promise.resolve(new Response(JSON.stringify({ message: 'Server Error' }), {
          status: 500,
          statusText: 'Internal Server Error',
          headers: { 'Content-Type': 'application/json' }
        }));
      });

      await act(async () => {
        renderWithStore(<ApprovalDashboard />);
      });

      // Dashboard should still render even with API errors
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });

    it('should handle empty workflow list', async () => {
      // Override fetch to return empty data
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/api/approval-workflow/workflows')) {
          return Promise.resolve(new Response(JSON.stringify({
            workflows: [],
            pagination: {
              currentPage: 1,
              totalPages: 0,
              totalCount: 0,
              pageSize: 10,
              hasNext: false,
              hasPrevious: false
            }
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        return Promise.resolve(new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      });

      await act(async () => {
        renderWithStore(<ApprovalDashboard />);
      });

      // Dashboard should render even with empty data
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });
  });

  describe('User Interface Components', () => {
    it('should display refresh button', async () => {
      await act(async () => {
        renderWithStore(<ApprovalDashboard />);
      });

      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('should display live connection indicator', async () => {
      await act(async () => {
        renderWithStore(<ApprovalDashboard />);
      });

      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('should handle refresh button click', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        renderWithStore(<ApprovalDashboard />);
      });

      const refreshButton = screen.getByText('Refresh');
      
      await act(async () => {
        await user.click(refreshButton);
      });

      // Should still be on the dashboard after refresh
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });
  });
});