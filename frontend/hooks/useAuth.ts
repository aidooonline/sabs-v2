import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import {
  loginUser,
  logoutUser,
  refreshToken,
  clearError,
  selectAuth,
  selectIsAuthenticated,
  selectUser,
  selectAuthLoading,
  selectAuthError,
  selectUserPermissions,
  selectUserRole,
  selectCompanyId,
} from '../store/slices/authSlice';
import { LoginRequest } from '../services/types/auth.types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuth);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const permissions = useAppSelector(selectUserPermissions);
  const role = useAppSelector(selectUserRole);
  const companyId = useAppSelector(selectCompanyId);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const result = await dispatch(loginUser(credentials));
      return result;
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    await dispatch(logoutUser());
  }, [dispatch]);

  const refresh = useCallback(async (token: string) => {
    const result = await dispatch(refreshToken(token));
    return result;
  }, [dispatch]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const hasPermission = useCallback(
    (permission: string) => {
      return permissions.includes(permission);
    },
    [permissions]
  );

  const hasRole = useCallback(
    (requiredRole: string) => {
      return role === requiredRole;
    },
    [role]
  );

  const hasAnyRole = useCallback(
    (roles: string[]) => {
      return role ? roles.includes(role) : false;
    },
    [role]
  );

  return {
    // State
    auth,
    user,
    isAuthenticated,
    isLoading,
    error,
    permissions,
    role,
    companyId,
    
    // Actions
    login,
    logout,
    refresh,
    clearAuthError,
    
    // Utilities
    hasPermission,
    hasRole,
    hasAnyRole,
  };
};