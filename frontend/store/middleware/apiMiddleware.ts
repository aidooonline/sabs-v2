import { Middleware, isRejectedWithValue } from '@reduxjs/toolkit';
import { RootState } from '../types';
import { addNotification } from '../slices/uiSlice';

/**
 * API Middleware for handling API-related Redux actions
 * This middleware can intercept and handle API errors globally
 */
export const apiMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  // Let the action pass through first
  const result = next(action);
  
  // Handle rejected async thunks (API errors)
  if (isRejectedWithValue(action)) {
    const error = action.payload as any;
    
    // Don't show notifications for auth errors or validation errors
    if (
      error?.code !== 'HTTP_401' && 
      error?.code !== 'HTTP_403' && 
      error?.code !== 'HTTP_422'
    ) {
      // Show error notification for other API errors
      store.dispatch(addNotification({
        type: 'error',
        message: error?.message || 'An unexpected error occurred',
        duration: 5000,
      }));
    }
    
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error caught by middleware:', {
        action: action.type,
        error: action.payload,
      });
    }
  }
  
  return result;
};