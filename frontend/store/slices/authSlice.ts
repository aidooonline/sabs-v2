import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { LoginRequest, LoginResponse } from '../../services/types/auth.types';
import { User } from '../../services/types/user.types';
import { authService } from '../../services/api/authService';

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (refreshToken: string, { rejectWithValue }) => {
    try {
      const response = await authService.refreshToken({ refreshToken });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Token refresh failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);

// Auth state interface
interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginAttempts: number;
  maxLoginAttempts: number;
  accountLocked: boolean;
  lockoutExpiry: number | null;
  sessionExpiry: number | null;
  permissions: string[];
  role: string | null;
  companyId: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  loginAttempts: 0,
  maxLoginAttempts: 5,
  accountLocked: false,
  lockoutExpiry: null,
  sessionExpiry: null,
  permissions: [],
  role: null,
  companyId: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetLoginAttempts: (state) => {
      state.loginAttempts = 0;
      state.accountLocked = false;
      state.lockoutExpiry = null;
    },
    incrementLoginAttempts: (state) => {
      state.loginAttempts += 1;
      if (state.loginAttempts >= state.maxLoginAttempts) {
        state.accountLocked = true;
        state.lockoutExpiry = Date.now() + (15 * 60 * 1000); // 15 minutes
      }
    },
    checkAccountLockout: (state) => {
      if (state.accountLocked && state.lockoutExpiry && Date.now() > state.lockoutExpiry) {
        state.accountLocked = false;
        state.lockoutExpiry = null;
        state.loginAttempts = 0;
      }
    },
    updateSessionExpiry: (state, action: PayloadAction<number>) => {
      state.sessionExpiry = action.payload;
    },
    clearAuth: (state) => {
      return { ...initialState };
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.data.user;
        state.token = action.payload.data.token;
        state.refreshToken = action.payload.data.refreshToken;
        state.permissions = action.payload.data.permissions || [];
        state.role = action.payload.data.user.role;
        state.companyId = action.payload.data.user.companyId || null;
        state.sessionExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        state.loginAttempts = 0;
        state.accountLocked = false;
        state.lockoutExpiry = null;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.loginAttempts += 1;
        if (state.loginAttempts >= state.maxLoginAttempts) {
          state.accountLocked = true;
          state.lockoutExpiry = Date.now() + (15 * 60 * 1000);
        }
      })
      // Refresh token cases
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.data.token;
        state.refreshToken = action.payload.data.refreshToken;
        state.sessionExpiry = Date.now() + (24 * 60 * 60 * 1000);
      })
      .addCase(refreshToken.rejected, (state) => {
        return { ...initialState };
      })
      // Logout cases
      .addCase(logoutUser.fulfilled, (state) => {
        return { ...initialState };
      });
  },
});

export const {
  clearError,
  resetLoginAttempts,
  incrementLoginAttempts,
  checkAccountLockout,
  updateSessionExpiry,
  clearAuth,
} = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectUserPermissions = (state: { auth: AuthState }) => state.auth.permissions;
export const selectUserRole = (state: { auth: AuthState }) => state.auth.role;
export const selectCompanyId = (state: { auth: AuthState }) => state.auth.companyId;