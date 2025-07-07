import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
// MSW is now globally configured in jest.setup.js

// Import slices
import authSlice from '../../store/slices/authSlice';
import uiSlice from '../../store/slices/uiSlice';
import { approvalApi } from '../../store/api/approvalApi';

// Minimal test - just test that RTK Query works with MSW
const TestComponent = () => {
  const { data, isLoading, error } = approvalApi.useGetWorkflowsQuery({});
  
  // Debug logging (disabled for cleaner output)
  // console.log('Test component state:', { data, isLoading, error });
  
  if (isLoading) return <div data-testid="loading">Loading...</div>;
  if (error) return <div data-testid="error">Error: {JSON.stringify(error)}</div>;
  if (data) return <div data-testid="data-loaded">Data: {data.workflows?.length || 0} workflows</div>;
  return <div data-testid="no-data">No data</div>;
};

// Mock store with enhanced logging and devtools
const store = configureStore({
  reducer: {
    auth: authSlice,
    ui: uiSlice,
    [approvalApi.reducerPath]: approvalApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      },
      immutableCheck: { warnAfter: 32 },
    }).concat(approvalApi.middleware),
  devTools: true
});

describe('MSW + RTK Query Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    expect(screen.getByText('Data: 20 workflows')).toBeInTheDocument();
  });
});