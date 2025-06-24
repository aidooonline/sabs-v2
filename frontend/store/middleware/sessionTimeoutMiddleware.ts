import { Middleware } from '@reduxjs/toolkit';
import type { RootState } from '../types';
import { clearAuth } from '../slices/authSlice';

export const sessionTimeoutMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  const result = next(action);
  
  // Check session expiry
  const state = store.getState();
  const { sessionExpiry, isAuthenticated } = state.auth;
  
  if (isAuthenticated && sessionExpiry && Date.now() > sessionExpiry) {
    console.log('Session expired, logging out user');
    store.dispatch(clearAuth());
  }
  
  return result;
};