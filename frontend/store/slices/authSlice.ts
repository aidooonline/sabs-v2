import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/services/types/user.types';
import { 
  LoginCredentials, 
  AuthResponse, 
  MfaVerificationRequest,
  AuthState
} from '@/services/types/auth.types';
import { authService } from '@/services/api/authService';

// Enhanced async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      return rejectWithValue(errorMessage);
    }
  }
);

export const verifyMfa = createAsyncThunk(
  'auth/verifyMfa',
  async (data: MfaVerificationRequest, { rejectWithValue }) => {
    try {
      const response = await authService.verifyMfa(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'MFA verification failed');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.refreshToken();
      return response.data;
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
      // Even if logout fails on server, clear local state
      return true;
    }
  }
);

export const validateSession = createAsyncThunk(
  'auth/validateSession',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.validateSession();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Session validation failed');
    }
  }
);

export const getUserProfile = createAsyncThunk(
  'auth/getUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getProfile();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (data: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

// Initial state
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

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Basic actions
    clearError: (state) => {
      state.error = null;
    },
    
    setInitialized: (state) => {
      state.isInitialized = true;
    },
    
    updateLastActivity: (state) => {
      state.lastActivity = Date.now();
    },
    
    // Security actions
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
    
    // Session management
    updateSessionExpiry: (state, action: PayloadAction<number>) => {
      state.sessionExpiry = action.payload;
    },
    
    clearAuth: (state) => {
      return {
        ...initialState,
        isInitialized: true,
      };
    },
    
    // MFA actions
    clearMfaState: (state) => {
      state.requiresMfaVerification = false;
      state.mfaToken = null;
    },

    // Token management
    setTokens: (state, action: PayloadAction<{ token: string; refreshToken: string; expiresIn: number }>) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.sessionExpiry = Date.now() + (action.payload.expiresIn * 1000);
    },

    // Update user data
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.role = action.payload.role;
      state.companyId = action.payload.companyId || null;
    },

    // Set authentication state
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Set permissions
    setPermissions: (state, action: PayloadAction<string[]>) => {
      state.permissions = action.payload;
    },

    // Set remember me
    setRememberMe: (state, action: PayloadAction<boolean>) => {
      state.rememberMe = action.payload;
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
        
        if (action.payload.requiresMfa) {
          // MFA required
          state.requiresMfaVerification = true;
          state.mfaToken = action.payload.mfaToken || null;
        } else {
          // Full authentication
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.refreshToken = action.payload.refreshToken;
          state.permissions = action.payload.permissions || [];
          state.role = action.payload.user.role;
          state.companyId = action.payload.user.companyId || null;
          state.sessionExpiry = Date.now() + (action.payload.expiresIn * 1000);
          state.lastActivity = Date.now();
          
          // Reset security state
          state.loginAttempts = 0;
          state.accountLocked = false;
          state.lockoutExpiry = null;
        }
        
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
      
      // MFA verification cases
      .addCase(verifyMfa.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyMfa.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.permissions = action.payload.permissions || [];
        state.role = action.payload.user.role;
        state.companyId = action.payload.user.companyId || null;
        state.sessionExpiry = Date.now() + (action.payload.expiresIn * 1000);
        state.lastActivity = Date.now();
        
        // Clear MFA state
        state.requiresMfaVerification = false;
        state.mfaToken = null;
        
        // Reset security state
        state.loginAttempts = 0;
        state.accountLocked = false;
        state.lockoutExpiry = null;
        state.error = null;
      })
      .addCase(verifyMfa.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Token refresh cases
      .addCase(refreshToken.pending, (state) => {
        // Don't set loading for token refresh to avoid UI flickering
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.sessionExpiry = Date.now() + (action.payload.expiresIn * 1000);
        state.lastActivity = Date.now();
      })
      .addCase(refreshToken.rejected, (state) => {
        // Token refresh failed, clear auth state
        return { ...initialState, isInitialized: true };
      })
      
      // Logout cases
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        return { ...initialState, isInitialized: true };
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even if logout fails, clear local state
        return { ...initialState, isInitialized: true };
      })
      
      // Session validation cases
      .addCase(validateSession.pending, (state) => {
        // Don't show loading for session validation
      })
      .addCase(validateSession.fulfilled, (state, action) => {
        if (action.payload.valid && action.payload.user) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.role = action.payload.user.role;
          state.companyId = action.payload.user.companyId || null;
          state.permissions = action.payload.permissions || [];
          state.lastActivity = Date.now();
          if (action.payload.expiresAt) {
            state.sessionExpiry = new Date(action.payload.expiresAt).getTime();
          }
        } else {
          return { ...initialState, isInitialized: true };
        }
      })
      .addCase(validateSession.rejected, (state) => {
        return { ...initialState, isInitialized: true };
      })

      // Profile management cases
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.role = action.payload.role;
        state.companyId = action.payload.companyId || null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const {
  clearError,
  setInitialized,
  updateLastActivity,
  resetLoginAttempts,
  incrementLoginAttempts,
  checkAccountLockout,
  updateSessionExpiry,
  clearAuth,
  clearMfaState,
  setTokens,
  setUser,
  setAuthenticated,
  setLoading,
  setPermissions,
  setRememberMe,
} = authSlice.actions;

export default authSlice.reducer;

// Enhanced selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectUserPermissions = (state: { auth: AuthState }) => state.auth.permissions;
export const selectUserRole = (state: { auth: AuthState }) => state.auth.role;
export const selectCompanyId = (state: { auth: AuthState }) => state.auth.companyId;
export const selectRequiresMfa = (state: { auth: AuthState }) => state.auth.requiresMfaVerification;
export const selectMfaToken = (state: { auth: AuthState }) => state.auth.mfaToken;
export const selectIsInitialized = (state: { auth: AuthState }) => state.auth.isInitialized;
export const selectAccountLocked = (state: { auth: AuthState }) => state.auth.accountLocked;
export const selectLoginAttempts = (state: { auth: AuthState }) => state.auth.loginAttempts;
export const selectSessionExpiry = (state: { auth: AuthState }) => state.auth.sessionExpiry;
export const selectLastActivity = (state: { auth: AuthState }) => state.auth.lastActivity;
export const selectRememberMe = (state: { auth: AuthState }) => state.auth.rememberMe;