import { configureStore } from '@reduxjs/toolkit';
import authReducer, { 
  loginUser, 
  logoutUser, 
  clearError, 
  resetLoginAttempts,
  incrementLoginAttempts,
  checkAccountLockout
} from '../../../store/slices/authSlice';

// Mock the auth service
jest.mock('../../../services/api/authService', () => ({
  authService: {
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
  }
}));

describe('authSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: { auth: authReducer },
    });
  });

  describe('initial state', () => {
    it('should handle initial state', () => {
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
      expect(state.token).toBe(null);
      expect(state.refreshToken).toBe(null);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.loginAttempts).toBe(0);
      expect(state.maxLoginAttempts).toBe(5);
      expect(state.accountLocked).toBe(false);
      expect(state.permissions).toEqual([]);
      expect(state.role).toBe(null);
      expect(state.companyId).toBe(null);
    });
  });

  describe('sync actions', () => {
    it('should handle clearError', () => {
      // First set an error
      store = configureStore({
        reducer: { auth: authReducer },
        preloadedState: {
          auth: {
            ...store.getState().auth,
            error: 'Test error'
          }
        }
      });
      
      store.dispatch(clearError());
      expect(store.getState().auth.error).toBe(null);
    });

    it('should handle resetLoginAttempts', () => {
      // Set up state with login attempts and locked account
      store = configureStore({
        reducer: { auth: authReducer },
        preloadedState: {
          auth: {
            ...store.getState().auth,
            loginAttempts: 3,
            accountLocked: true,
            lockoutExpiry: Date.now() + 900000
          }
        }
      });

      store.dispatch(resetLoginAttempts());
      const state = store.getState().auth;
      expect(state.loginAttempts).toBe(0);
      expect(state.accountLocked).toBe(false);
      expect(state.lockoutExpiry).toBe(null);
    });

    it('should handle incrementLoginAttempts without locking', () => {
      store.dispatch(incrementLoginAttempts());
      const state = store.getState().auth;
      expect(state.loginAttempts).toBe(1);
      expect(state.accountLocked).toBe(false);
    });

    it('should handle incrementLoginAttempts with locking after max attempts', () => {
      // Set up state near max attempts
      store = configureStore({
        reducer: { auth: authReducer },
        preloadedState: {
          auth: {
            ...store.getState().auth,
            loginAttempts: 4
          }
        }
      });

      store.dispatch(incrementLoginAttempts());
      const state = store.getState().auth;
      expect(state.loginAttempts).toBe(5);
      expect(state.accountLocked).toBe(true);
      expect(state.lockoutExpiry).toBeGreaterThan(Date.now());
    });

    it('should handle checkAccountLockout when lockout has expired', () => {
      // Set up locked account with expired lockout
      store = configureStore({
        reducer: { auth: authReducer },
        preloadedState: {
          auth: {
            ...store.getState().auth,
            accountLocked: true,
            lockoutExpiry: Date.now() - 1000, // Expired 1 second ago
            loginAttempts: 5
          }
        }
      });

      store.dispatch(checkAccountLockout());
      const state = store.getState().auth;
      expect(state.accountLocked).toBe(false);
      expect(state.lockoutExpiry).toBe(null);
      expect(state.loginAttempts).toBe(0);
    });

    it('should not unlock account if lockout has not expired', () => {
      const futureTime = Date.now() + 900000; // 15 minutes from now
      store = configureStore({
        reducer: { auth: authReducer },
        preloadedState: {
          auth: {
            ...store.getState().auth,
            accountLocked: true,
            lockoutExpiry: futureTime,
            loginAttempts: 5
          }
        }
      });

      store.dispatch(checkAccountLockout());
      const state = store.getState().auth;
      expect(state.accountLocked).toBe(true);
      expect(state.lockoutExpiry).toBe(futureTime);
      expect(state.loginAttempts).toBe(5);
    });
  });

  describe('async actions', () => {
    it('should handle loginUser.pending', () => {
      store.dispatch(loginUser.pending('', { email: 'test@example.com', password: 'password' }));
      const state = store.getState().auth;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle loginUser.fulfilled', () => {
      const mockPayload = {
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'agent',
          companyId: 'company123',
          phone: '+1234567890',
          status: 'active' as const,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          isEmailVerified: true,
          isPhoneVerified: true
        },
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        permissions: ['read', 'write']
      };

      store.dispatch(loginUser.fulfilled(mockPayload, '', { email: 'test@example.com', password: 'password' }));
      const state = store.getState().auth;
      
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockPayload.user);
      expect(state.token).toBe(mockPayload.token);
      expect(state.refreshToken).toBe(mockPayload.refreshToken);
      expect(state.permissions).toEqual(mockPayload.permissions);
      expect(state.role).toBe(mockPayload.user.role);
      expect(state.companyId).toBe(mockPayload.user.companyId);
      expect(state.loginAttempts).toBe(0);
      expect(state.accountLocked).toBe(false);
      expect(state.error).toBe(null);
      expect(state.sessionExpiry).toBeGreaterThan(Date.now());
    });

    it('should handle loginUser.rejected', () => {
      store.dispatch(loginUser.rejected(new Error('Login failed'), '', { email: 'test@example.com', password: 'wrong' }, 'Invalid credentials'));
      const state = store.getState().auth;
      
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
      expect(state.loginAttempts).toBe(1);
    });

    it('should handle logoutUser.fulfilled', () => {
      // Set up authenticated state
      store = configureStore({
        reducer: { auth: authReducer },
        preloadedState: {
          auth: {
            user: { id: '1' } as any,
            token: 'test-token',
            refreshToken: 'test-refresh-token',
            isAuthenticated: true,
            isLoading: false,
            error: null,
            loginAttempts: 0,
            maxLoginAttempts: 5,
            accountLocked: false,
            lockoutExpiry: null,
            sessionExpiry: Date.now() + 86400000,
            permissions: ['read'],
            role: 'agent',
            companyId: 'company123'
          }
        }
      });

      store.dispatch(logoutUser.fulfilled(true, '', undefined));
      const state = store.getState().auth;
      
      // Should reset to initial state
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
      expect(state.token).toBe(null);
      expect(state.refreshToken).toBe(null);
      expect(state.permissions).toEqual([]);
      expect(state.role).toBe(null);
      expect(state.companyId).toBe(null);
    });
  });
});