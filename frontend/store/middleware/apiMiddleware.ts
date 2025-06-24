import { Middleware } from '@reduxjs/toolkit';
import type { RootState } from '../types';

export const apiMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  // Automatically attach token to API requests
  const result = next(action);
  
  // Get current auth state
  const state = store.getState();
  const { token } = state.auth;
  
  // This middleware will be expanded when we implement the API client
  // to automatically attach the token to outgoing API requests
  
  return result;
};