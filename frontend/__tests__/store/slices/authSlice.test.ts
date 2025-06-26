import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  loginUser,
  verifyMfa,
  refreshToken,
  logoutUser,
  validateSession,
  getUserProfile,
  updateUserProfile,
  clearError,
  setInitialized,
  updateLastActivity,
  clearMfaState,
  resetLoginAttempts,
  incrementLoginAttempts,
  checkAccountLockout,
} from '@/store/slices/authSlice';
import { authService } from '@/services/api/authService';
import { AuthState } from '@/services/types/auth.types';
import { UserRole } from '@/services/types/user.types';

// Mock API service
jest.mock('@/services/api/authService');
const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('authSlice', () => {
  type TestStore = ReturnType<typeof configureStore<{ auth: AuthState }>>;
  let store: TestStore;

  const initialState: AuthState = {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    
    requiresMfaVerification: false,
    mfaToken: null,
    
    loginAttempts: 0,
    maxLoginAttempts: 5,
    accountLocked: false,
    lockoutExpiry: null,
    
    sessionExpiry: null,
    lastActivity: null,
    rememberMe: false,
    
    permissions: [],
    role: null,
    companyId: null,
    
    isInitialized: false,
  };

  beforeEach(() => {
    store = configureStore({
      reducer: { auth: authReducer },
    });
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().auth;
      expect(state).toEqual(initialState);
    });
  });

  describe('Synchronous Actions', () => {
    it('should handle clearError', () => {
      // Set an error first
      store.dispatch({ type: 'auth/loginUser/rejected', payload: 'Test error' });
      
      store.dispatch(clearError());
      
      const state = store.getState().auth;
      expect(state.error).toBeNull();
    });

    it('should handle setInitialized', () => {
      store.dispatch(setInitialized());
      
      const state = store.getState().auth;
      expect(state.isInitialized).toBe(true);
    });

    it('should handle updateLastActivity', () => {
      const before = Date.now();
      
      store.dispatch(updateLastActivity());
      
      const state = store.getState().auth;
      const after = Date.now();
      
      expect(state.lastActivity).toBeGreaterThanOrEqual(before);
      expect(state.lastActivity).toBeLessThanOrEqual(after);
    });

    it('should handle resetLoginAttempts', () => {
      // Set some attempts first
      store.dispatch(incrementLoginAttempts());
      store.dispatch(incrementLoginAttempts());
      
      store.dispatch(resetLoginAttempts());
      
      const state = store.getState().auth;
      expect(state.loginAttempts).toBe(0);
      expect(state.accountLocked).toBe(false);
      expect(state.lockoutExpiry).toBeNull();
    });

    it('should handle incrementLoginAttempts', () => {
      store.dispatch(incrementLoginAttempts());
      
      const state = store.getState().auth;
      expect(state.loginAttempts).toBe(1);
      expect(state.accountLocked).toBe(false);
    });

    it('should lock account after max attempts', () => {
      // Increment to max attempts
      for (let i = 0; i < 5; i++) {
        store.dispatch(incrementLoginAttempts());
      }
      
      const state = store.getState().auth;
      expect(state.loginAttempts).toBe(5);
      expect(state.accountLocked).toBe(true);
      expect(state.lockoutExpiry).toBeGreaterThan(Date.now());
    });

    it('should handle clearMfaState', () => {
      // Set MFA state first
      store.dispatch({ 
        type: 'auth/loginUser/fulfilled', 
        payload: { requiresMfa: true, mfaToken: 'test-token' } 
      });
      
      store.dispatch(clearMfaState());
      
      const state = store.getState().auth;
      expect(state.requiresMfaVerification).toBe(false);
      expect(state.mfaToken).toBeNull();
    });
  });

  describe('loginUser async thunk', () => {
    const credentials = {
      email: 'test@example.com',
      password: 'password123',
      rememberMe: true,
    };

    it('should handle successful login without MFA', async () => {
      const mockResponse = {
        data: {
          user: { 
            id: '1', 
            email: 'test@example.com', 
            firstName: 'Test',
            lastName: 'User',
            role: 'agent' as UserRole,
            companyId: 'company-1',
            status: 'active' as const,
            isEmailVerified: true,
            isPhoneVerified: false,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            phone: '+1234567890'
          },
          token: 'jwt-token',
          refreshToken: 'refresh-token',
          permissions: ['read', 'write'],
          expiresIn: 3600,
        },
        message: 'Login successful',
        success: true,
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const result = await store.dispatch(loginUser(credentials));

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockResponse.data.user);
      expect(state.token).toBe(mockResponse.data.token);
      expect(state.refreshToken).toBe(mockResponse.data.refreshToken);
      expect(state.permissions).toEqual(mockResponse.data.permissions);
      expect(state.role).toBe(mockResponse.data.user.role);
      expect(state.companyId).toBe(mockResponse.data.user.companyId);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.loginAttempts).toBe(0);
      expect(state.accountLocked).toBe(false);
    });

    it('should handle login requiring MFA', async () => {
      const mockResponse = {
        data: {
          requiresMfa: true,
          mfaToken: 'mfa-token-123',
        } as any,
        message: 'MFA required',
        success: true,
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      await store.dispatch(loginUser(credentials));

      const state = store.getState().auth;
      expect(state.requiresMfaVerification).toBe(true);
      expect(state.mfaToken).toBe('mfa-token-123');
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle login failure', async () => {
      const errorMessage = 'Invalid credentials';
      mockAuthService.login.mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await store.dispatch(loginUser(credentials));

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(state.loginAttempts).toBe(1);
      expect(state.isLoading).toBe(false);
    });

    it('should handle generic login error', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Network error'));

      await store.dispatch(loginUser(credentials));

      const state = store.getState().auth;
      expect(state.error).toBe('Login failed');
      expect(state.loginAttempts).toBe(1);
    });
  });

  describe('verifyMfa async thunk', () => {
    const mfaData = {
      mfaToken: 'mfa-token-123',
      code: '123456',
      rememberDevice: true,
    };

    beforeEach(() => {
      // Set MFA required state
      store.dispatch({
        type: 'auth/loginUser/fulfilled',
        payload: { requiresMfa: true, mfaToken: 'mfa-token-123' },
      });
    });

    it('should handle successful MFA verification', async () => {
      const mockResponse = {
        data: {
          user: { 
            id: '1', 
            email: 'test@example.com', 
            role: 'agent' as UserRole,
            companyId: 'company-1',
            firstName: 'Test',
            lastName: 'User',
            status: 'active' as const,
            isEmailVerified: true,
            isPhoneVerified: false,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            phone: '+1234567890'
          },
          token: 'jwt-token',
          refreshToken: 'refresh-token',
          permissions: ['read', 'write'],
          expiresIn: 3600,
        },
        message: 'MFA verified',
        success: true,
      };

      mockAuthService.verifyMfa.mockResolvedValue(mockResponse);

      await store.dispatch(verifyMfa(mfaData));

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockResponse.data.user);
      expect(state.requiresMfaVerification).toBe(false);
      expect(state.mfaToken).toBeNull();
      expect(state.loginAttempts).toBe(0);
      expect(state.accountLocked).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle MFA verification failure', async () => {
      const errorMessage = 'Invalid MFA code';
      mockAuthService.verifyMfa.mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await store.dispatch(verifyMfa(mfaData));

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(state.requiresMfaVerification).toBe(true); // Should remain true
    });
  });

  describe('refreshToken async thunk', () => {
    beforeEach(() => {
      // Set authenticated state
      store.dispatch({
        type: 'auth/loginUser/fulfilled',
        payload: {
          user: { id: '1', role: 'agent' },
          token: 'old-token',
          refreshToken: 'old-refresh',
          permissions: ['read'],
          expiresIn: 3600,
        },
      });
    });

    it('should handle successful token refresh', async () => {
      const mockResponse = {
        data: {
          token: 'new-token',
          refreshToken: 'new-refresh',
          expiresIn: 3600,
        },
        message: 'Token refreshed',
        success: true,
      };

      mockAuthService.refreshToken.mockResolvedValue(mockResponse);

      await store.dispatch(refreshToken());

      const state = store.getState().auth;
      expect(state.token).toBe('new-token');
      expect(state.refreshToken).toBe('new-refresh');
      expect(state.sessionExpiry).toBeGreaterThan(Date.now());
    });

    it('should clear auth state on refresh failure', async () => {
      mockAuthService.refreshToken.mockRejectedValue(new Error('Refresh failed'));

      await store.dispatch(refreshToken());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isInitialized).toBe(true);
    });
  });

  describe('logoutUser async thunk', () => {
    beforeEach(() => {
      // Set authenticated state
      store.dispatch({
        type: 'auth/loginUser/fulfilled',
        payload: {
          user: { id: '1', role: 'agent' },
          token: 'token',
          refreshToken: 'refresh',
          permissions: ['read'],
          expiresIn: 3600,
        },
      });
    });

    it('should handle successful logout', async () => {
      mockAuthService.logout.mockResolvedValue({ 
        data: undefined,
        message: 'Logged out successfully',
        success: true,
      });

      await store.dispatch(logoutUser());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isInitialized).toBe(true);
    });

    it('should clear auth state even if logout fails', async () => {
      mockAuthService.logout.mockRejectedValue(new Error('Logout failed'));

      await store.dispatch(logoutUser());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isInitialized).toBe(true);
    });
  });

  describe('validateSession async thunk', () => {
    it('should handle valid session', async () => {
      const mockResponse = {
        data: {
          valid: true,
          user: { 
            id: '1', 
            role: 'agent' as UserRole,
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            companyId: 'company-1',
            status: 'active' as const,
            isEmailVerified: true,
            isPhoneVerified: false,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            phone: '+1234567890'
          },
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          permissions: ['read', 'write'],
        },
        message: 'Session valid',
        success: true,
      };

      mockAuthService.validateSession.mockResolvedValue(mockResponse);

      await store.dispatch(validateSession());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockResponse.data.user);
      expect(state.permissions).toEqual(mockResponse.data.permissions);
      expect(state.role).toBe(mockResponse.data.user.role);
      expect(state.companyId).toBe(mockResponse.data.user.companyId);
    });

    it('should handle invalid session', async () => {
      const mockResponse = {
        data: { valid: false },
        message: 'Session invalid',
        success: true,
      };

      mockAuthService.validateSession.mockResolvedValue(mockResponse);

      await store.dispatch(validateSession());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.isInitialized).toBe(true);
    });

    it('should clear auth state on validation failure', async () => {
      mockAuthService.validateSession.mockRejectedValue(new Error('Validation failed'));

      await store.dispatch(validateSession());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.isInitialized).toBe(true);
    });
  });

  describe('profile management thunks', () => {
    it('should handle getUserProfile success', async () => {
      const mockUser = {
        id: '1',
        firstName: 'Updated',
        lastName: 'User',
        email: 'test@example.com',
        role: 'agent' as UserRole,
        companyId: 'company-1',
        status: 'active' as const,
        isEmailVerified: true,
        isPhoneVerified: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        phone: '+1234567890'
      };

      mockAuthService.getProfile.mockResolvedValue({ 
        data: mockUser,
        message: 'Profile retrieved',
        success: true,
      });

      await store.dispatch(getUserProfile());

      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.role).toBe(mockUser.role);
      expect(state.companyId).toBe(mockUser.companyId);
    });

    it('should handle updateUserProfile success', async () => {
      const updateData = { firstName: 'Updated' };
      const mockUser = {
        id: '1',
        firstName: 'Updated',
        lastName: 'User',
        email: 'test@example.com',
        role: 'agent' as UserRole,
        companyId: 'company-1',
        status: 'active' as const,
        isEmailVerified: true,
        isPhoneVerified: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        phone: '+1234567890'
      };

      mockAuthService.updateProfile.mockResolvedValue({ 
        data: mockUser,
        message: 'Profile updated',
        success: true,
      });

      await store.dispatch(updateUserProfile(updateData));

      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
    });
  });
});