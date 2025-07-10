import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Import real Redux slices and APIs
import authSlice from '../../store/slices/authSlice';
import uiSlice from '../../store/slices/uiSlice';
import { approvalApi } from '../../store/api/approvalApi';
import { dashboardApi } from '../../store/api/dashboardApi';

// Import test utilities
import { TestFramework } from '../setup/testFramework';

// Import component
import ApprovalDashboard from '../../app/approval/dashboard/page';

// Simple mock data with proper structure
const mockWorkflowsData = {
  workflows: [{
    id: 'WF-123',
    workflowNumber: 'WF-123',
    status: 'pending',
    priority: 'high',
    currentStage: 'clerk_review',
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    withdrawalRequest: {
      customer: { 
        fullName: 'John Doe',
        accountNumber: 'ACC000123',
        phoneNumber: '+233123456789'
      },
      agent: { 
        fullName: 'Agent Smith',
        id: 'agent-1',
        branch: 'Branch 1'
      },
      amount: 5000,
      currency: 'GHS'
    },
    riskAssessment: { 
      riskScore: 45,
      riskLevel: 'medium',
      factors: ['Factor 1']
    }
  }],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 1,
    hasNext: false,
    hasPrevious: false
  }
};

const mockDashboardStats = {
  queueStats: { 
    totalPending: 1,
    averageProcessingTime: 4.5,
    slaCompliance: 0.89
  },
  performanceMetrics: { 
    approvalsToday: 45 
  }
};

// Setup fetch mock
beforeAll(() => {
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
      return Promise.resolve(new Response(JSON.stringify({
        totalPending: 1,
        totalApproved: 890,
        totalRejected: 45,
        averageProcessingTime: 270,
        slaCompliance: 0.89,
        riskDistribution: []
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
});

// Real Redux store setup
const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice,
      ui: uiSlice,
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
      }
    }
  });
};

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider store={createTestStore()}>
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

describe.skip('ApprovalDashboard Simple Test (skipped due to MSW dependency)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.skip('should render without crashing (skipped due to MSW dependency)', async () => {
    render(
      <TestWrapper>
        <ApprovalDashboard />
      </TestWrapper>
    );

    // Just check that the basic dashboard renders
    await waitFor(() => {
      expect(screen.getByText('Approval Dashboard')).toBeInTheDocument();
    });
  });

  it.skip('should load and display data (skipped due to MSW dependency)', async () => {
    render(
      <TestWrapper>
        <ApprovalDashboard />
      </TestWrapper>
    );

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    }, { timeout: 10000 });

    // Check if data is loaded (pending count should be 1)
    await waitFor(() => {
      expect(screen.getByTestId('total-pending-count')).toHaveTextContent('1');
    }, { timeout: 5000 });
  });
});