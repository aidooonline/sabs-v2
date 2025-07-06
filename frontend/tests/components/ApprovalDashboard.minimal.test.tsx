import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { rest } from 'msw';
import { server } from '../setup/mocks/server';

// Import slices
import authSlice from '../../store/slices/authSlice';
import uiSlice from '../../store/slices/uiSlice';
import { approvalApi } from '../../store/api/approvalApi';

// Minimal test - just test that RTK Query works with MSW
const TestComponent = () => {
  const { data, isLoading, error } = approvalApi.useGetWorkflowsQuery({});
  
  // Debug logging
  console.log('Test component state:', { data, isLoading, error });
  
  if (isLoading) return <div data-testid="loading">Loading...</div>;
  if (error) return <div data-testid="error">Error: {JSON.stringify(error)}</div>;
  if (data) return <div data-testid="data-loaded">Data: {data.workflows?.length || 0} workflows</div>;
  return <div data-testid="no-data">No data</div>;
};

// Mock store
const store = configureStore({
  reducer: {
    auth: authSlice,
    ui: uiSlice,
    [approvalApi.reducerPath]: approvalApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(approvalApi.middleware)
});

describe('MSW + RTK Query Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Use the global server and add test-specific handlers
    server.use(
      rest.get('/api/approval-workflow/workflows', (req, res, ctx) => {
        console.log('MSW: API call intercepted for /api/approval-workflow/workflows');
        return res(ctx.json({
          workflows: [{ 
            id: 'test-workflow',
            workflowNumber: 'WF-001',
            status: 'pending',
            priority: 'high',
            currentStage: 'clerk_review',
            createdAt: new Date().toISOString(),
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            withdrawalRequest: {
              amount: 5000,
              currency: 'GHS',
              customer: {
                fullName: 'Test Customer',
                accountNumber: 'ACC000001',
                phoneNumber: '+233123456789'
              },
              agent: {
                fullName: 'Test Agent',
                id: 'agent-1',
                branch: 'Branch 1'
              }
            },
            riskAssessment: {
              riskScore: 45,
              riskLevel: 'medium',
              factors: ['Factor 1']
            }
          }],
          pagination: { totalCount: 1 }
        }));
      })
    );
  });

  it('should work with MSW and RTK Query', async () => {
    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    );

    // Should show loading first
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Then should show data
    await waitFor(() => {
      expect(screen.getByTestId('data-loaded')).toBeInTheDocument();
    });

    expect(screen.getByText('Data: 1 workflows')).toBeInTheDocument();
  });
});