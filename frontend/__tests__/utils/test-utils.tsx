import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authSlice from '../../store/slices/authSlice';
import uiSlice from '../../store/slices/uiSlice';

// Test store factory
const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      ui: uiSlice,
    },
    preloadedState,
  });
};

// Custom render function with providers
const AllTheProviders = ({ children, store }: { children: React.ReactNode; store?: any }) => {
  const testStore = store || createTestStore();
  
  return (
    <Provider store={testStore}>
      {children}
    </Provider>
  );
};

const customRender = (
  ui: ReactElement,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    ...renderOptions
  }: {
    preloadedState?: any;
    store?: any;
  } & Omit<RenderOptions, 'wrapper'> = {}
) => render(ui, { wrapper: (props) => <AllTheProviders {...props} store={store} />, ...renderOptions });

export * from '@testing-library/react';
export { customRender as renderWithProviders, createTestStore };