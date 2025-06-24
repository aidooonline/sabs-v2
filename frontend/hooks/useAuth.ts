import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { authService } from '@/services/api/authService';
import type { LoginRequest, RegisterRequest } from '@/services/types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      // This would dispatch an action to update auth state
      // For now, just calling the service
      const response = await authService.login(credentials);
      return response;
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
      // Dispatch logout action
    } catch (error) {
      // Handle error silently for logout
    }
  }, [dispatch]);

  const register = useCallback(async (userData: RegisterRequest) => {
    try {
      const response = await authService.register(userData);
      return response;
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  const refreshToken = useCallback(async () => {
    try {
      if (authState.refreshToken) {
        const response = await authService.refreshToken({ 
          refreshToken: authState.refreshToken 
        });
        // Dispatch action to update tokens
        return response;
      }
    } catch (error) {
      // Handle refresh error (logout user)
      await logout();
    }
  }, [authState.refreshToken, logout]);

  const checkPermission = useCallback((permission: string): boolean => {
    return authState.permissions.includes(permission);
  }, [authState.permissions]);

  const hasRole = useCallback((role: string): boolean => {
    return authState.user?.role === role;
  }, [authState.user?.role]);

  return {
    // State
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    permissions: authState.permissions,

    // Actions
    login,
    logout,
    register,
    refreshToken,
    checkPermission,
    hasRole,
  };
};