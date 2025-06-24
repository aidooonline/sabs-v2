import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from './redux';
import {
  loginUser,
  verifyMfa,
  logoutUser,
  refreshToken,
  validateSession,
  getUserProfile,
  updateUserProfile,
  clearError,
  setInitialized,
  updateLastActivity,
  clearMfaState,
  selectAuth,
  selectIsAuthenticated,
  selectUser,
  selectAuthLoading,
  selectAuthError,
  selectUserPermissions,
  selectUserRole,
  selectCompanyId,
  selectRequiresMfa,
  selectMfaToken,
  selectIsInitialized,
  selectAccountLocked,
  selectLoginAttempts,
  selectSessionExpiry,
  selectLastActivity,
  selectRememberMe,
} from '@/store/slices/authSlice';
import { LoginCredentials, MfaVerificationRequest } from '@/services/types/auth.types';
import { User } from '@/services/types/user.types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  
  // State selectors
  const auth = useAppSelector(selectAuth);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const permissions = useAppSelector(selectUserPermissions);
  const role = useAppSelector(selectUserRole);
  const companyId = useAppSelector(selectCompanyId);
  const requiresMfa = useAppSelector(selectRequiresMfa);
  const mfaToken = useAppSelector(selectMfaToken);
  const isInitialized = useAppSelector(selectIsInitialized);
  const accountLocked = useAppSelector(selectAccountLocked);
  const loginAttempts = useAppSelector(selectLoginAttempts);
  const sessionExpiry = useAppSelector(selectSessionExpiry);
  const lastActivity = useAppSelector(selectLastActivity);
  const rememberMe = useAppSelector(selectRememberMe);

  // Initialize authentication state
  const initialize = useCallback(async () => {
    if (isInitialized) return;
    
    try {
      await dispatch(validateSession());
    } finally {
      dispatch(setInitialized());
    }
  }, [dispatch, isInitialized]);

  // Auto-initialize on hook mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Session activity tracking
  useEffect(() => {
    if (isAuthenticated) {
      const handleActivity = () => {
        dispatch(updateLastActivity());
      };

      // Track user activity
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => {
        document.addEventListener(event, handleActivity, true);
      });

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleActivity, true);
        });
      };
    }
  }, [isAuthenticated, dispatch]);

  // Session expiry monitoring
  useEffect(() => {
    if (isAuthenticated && sessionExpiry) {
      const timeUntilExpiry = sessionExpiry - Date.now();
      
      if (timeUntilExpiry <= 0) {
        // Session already expired
        logout();
        return;
      }

      // Set timer to auto-logout when session expires
      const timer = setTimeout(() => {
        logout();
      }, timeUntilExpiry);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, sessionExpiry]);

  // Automatic token refresh
  useEffect(() => {
    if (isAuthenticated && sessionExpiry) {
      const timeUntilExpiry = sessionExpiry - Date.now();
      const refreshThreshold = 5 * 60 * 1000; // Refresh 5 minutes before expiry
      
      if (timeUntilExpiry > refreshThreshold) {
        const refreshTimer = setTimeout(() => {
          dispatch(refreshToken());
        }, timeUntilExpiry - refreshThreshold);

        return () => clearTimeout(refreshTimer);
      }
    }
  }, [isAuthenticated, sessionExpiry, dispatch]);

  // Actions
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await dispatch(loginUser(credentials));
      return result;
    },
    [dispatch]
  );

  const mfaVerify = useCallback(
    async (data: MfaVerificationRequest) => {
      const result = await dispatch(verifyMfa(data));
      return result;
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    await dispatch(logoutUser());
    router.replace('/login');
  }, [dispatch, router]);

  const refresh = useCallback(async () => {
    const result = await dispatch(refreshToken());
    return result;
  }, [dispatch]);

  const getProfile = useCallback(async () => {
    const result = await dispatch(getUserProfile());
    return result;
  }, [dispatch]);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    const result = await dispatch(updateUserProfile(data));
    return result;
  }, [dispatch]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const clearMfa = useCallback(() => {
    dispatch(clearMfaState());
  }, [dispatch]);

  // Permission utilities
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

  const hasAnyPermission = useCallback(
    (requiredPermissions: string[]) => {
      return requiredPermissions.some(permission => permissions.includes(permission));
    },
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (requiredPermissions: string[]) => {
      return requiredPermissions.every(permission => permissions.includes(permission));
    },
    [permissions]
  );

  // Role hierarchy utilities
  const canAccessRole = useCallback(
    (targetRole: string) => {
      const roleHierarchy = {
        'super_admin': ['super_admin', 'company_admin', 'clerk', 'agent'],
        'company_admin': ['company_admin', 'clerk', 'agent'],
        'clerk': ['clerk', 'agent'],
        'agent': ['agent']
      };
      
      if (!role) return false;
      return roleHierarchy[role as keyof typeof roleHierarchy]?.includes(targetRole) || false;
    },
    [role]
  );

  const isHigherRole = useCallback(
    (comparedRole: string) => {
      const roleOrder = ['agent', 'clerk', 'company_admin', 'super_admin'];
      const currentRoleIndex = role ? roleOrder.indexOf(role) : -1;
      const comparedRoleIndex = roleOrder.indexOf(comparedRole);
      
      return currentRoleIndex > comparedRoleIndex;
    },
    [role]
  );

  // Session utilities
  const isSessionValid = useCallback(() => {
    if (!isAuthenticated || !sessionExpiry) return false;
    return Date.now() < sessionExpiry;
  }, [isAuthenticated, sessionExpiry]);

  const getTimeUntilExpiry = useCallback(() => {
    if (!sessionExpiry) return 0;
    const timeLeft = sessionExpiry - Date.now();
    return Math.max(0, timeLeft);
  }, [sessionExpiry]);

  const getSessionTimeRemaining = useCallback(() => {
    const timeLeft = getTimeUntilExpiry();
    const minutes = Math.floor(timeLeft / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    return { minutes, seconds, total: timeLeft };
  }, [getTimeUntilExpiry]);

  // User info utilities
  const getFullName = useCallback(() => {
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`.trim();
  }, [user]);

  const getInitials = useCallback(() => {
    if (!user) return '';
    const firstInitial = user.firstName.charAt(0).toUpperCase();
    const lastInitial = user.lastName.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  }, [user]);

  const isUserActive = useCallback(() => {
    return user?.status === 'active';
  }, [user]);

  const isEmailVerified = useCallback(() => {
    return user?.isEmailVerified || false;
  }, [user]);

  const isPhoneVerified = useCallback(() => {
    return user?.isPhoneVerified || false;
  }, [user]);

  // Company utilities
  const isSuperAdmin = useCallback(() => {
    return role === 'super_admin';
  }, [role]);

  const isCompanyAdmin = useCallback(() => {
    return role === 'company_admin';
  }, [role]);

  const isClerk = useCallback(() => {
    return role === 'clerk';
  }, [role]);

  const isAgent = useCallback(() => {
    return role === 'agent';
  }, [role]);

  const hasCompany = useCallback(() => {
    return Boolean(companyId);
  }, [companyId]);

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
    requiresMfa,
    mfaToken,
    isInitialized,
    accountLocked,
    loginAttempts,
    sessionExpiry,
    lastActivity,
    rememberMe,
    
    // Actions
    initialize,
    login,
    mfaVerify,
    logout,
    refresh,
    getProfile,
    updateProfile,
    clearAuthError,
    clearMfa,
    
    // Permission utilities
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRole,
    isHigherRole,
    
    // Session utilities
    isSessionValid,
    getTimeUntilExpiry,
    getSessionTimeRemaining,
    
    // User utilities
    getFullName,
    getInitials,
    isUserActive,
    isEmailVerified,
    isPhoneVerified,
    
    // Role utilities
    isSuperAdmin,
    isCompanyAdmin,
    isClerk,
    isAgent,
    hasCompany,
  };
};