# Story 1.3: Configure Global State (Redux) with sessionSlice - Sabs v2 Frontend

## 📋 Story Overview

**Epic**: Phase 1 - Project Setup & Core Services  
**Story ID**: FRONTEND-1.3  
**Story Title**: Configure Global State (Redux) with initial sessionSlice  
**Story Points**: 5  
**Priority**: High  
**Status**: Ready for Development

---

## 👤 User Story

**As a** Frontend Developer  
**I want to** implement Redux Toolkit global state management with an authentication session slice  
**So that** the application can manage user authentication state, session data, and UI state consistently across all components

---

## 🎯 Acceptance Criteria

### ✅ **AC 1: Redux Toolkit Store Setup**
- [ ] Configure Redux Toolkit store with proper TypeScript integration
- [ ] Set up store provider component for the application
- [ ] Implement proper middleware configuration (Redux DevTools, etc.)
- [ ] Create root reducer with feature slice organization
- [ ] Set up store persistence for session management

### ✅ **AC 2: Authentication Session Slice**
- [ ] Create `authSlice` with user authentication state
- [ ] Implement login, logout, and token refresh actions
- [ ] Add user profile and permissions state management
- [ ] Create session timeout and auto-logout functionality
- [ ] Set up proper loading and error states for auth operations

### ✅ **AC 3: UI State Management**
- [ ] Create `uiSlice` for global UI state (modals, notifications, etc.)
- [ ] Implement loading state management across the app
- [ ] Add notification/toast message state
- [ ] Create modal state management
- [ ] Set up theme and preferences state

### ✅ **AC 4: Custom Hooks Integration**
- [ ] Create `useAuth` hook for authentication state
- [ ] Implement `useAppDispatch` and `useAppSelector` typed hooks
- [ ] Create `useSession` hook for session management
- [ ] Add `useUI` hook for UI state management
- [ ] Set up proper hook typing and error handling

### ✅ **AC 5: Middleware and Persistence**
- [ ] Configure Redux Persist for session persistence
- [ ] Set up API middleware for automatic token attachment
- [ ] Implement error handling middleware
- [ ] Create logging middleware for development
- [ ] Add session timeout middleware

---

## 🏗️ Technical Implementation Guidelines

### **Store Configuration**

#### **Store Setup (`store/index.ts`)**
```typescript
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';
import { apiMiddleware } from './middleware/apiMiddleware';
import { sessionTimeoutMiddleware } from './middleware/sessionTimeoutMiddleware';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Only persist auth state
  blacklist: ['ui'], // Don't persist UI state
};

const rootReducer = combineReducers({
  auth: authSlice,
  ui: uiSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    })
    .concat(apiMiddleware)
    .concat(sessionTimeoutMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

#### **Redux Provider Component (`store/provider.tsx`)**
```typescript
'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './index';
import LoadingSpinner from '@/components/atoms/LoadingSpinner';

interface ReduxProviderProps {
  children: React.ReactNode;
}

export default function ReduxProvider({ children }: ReduxProviderProps) {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
```

### **Authentication Slice Implementation**

#### **Auth Slice (`store/slices/authSlice.ts`)**
```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, LoginCredentials, AuthResponse } from '@/services/types/auth.types';
import { authService } from '@/services/api/authService';

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
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
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.permissions = action.payload.permissions || [];
        state.role = action.payload.user.role;
        state.companyId = action.payload.user.companyId;
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
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
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
```

#### **UI Slice (`store/slices/uiSlice.ts`)**
```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NotificationState {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface ModalState {
  id: string;
  isOpen: boolean;
  data?: any;
}

interface UIState {
  isLoading: boolean;
  notifications: NotificationState[];
  modals: Record<string, ModalState>;
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  bottomTabVisible: boolean;
  pageTitle: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
}

const initialState: UIState = {
  isLoading: false,
  notifications: [],
  modals: {},
  sidebarOpen: false,
  theme: 'light',
  bottomTabVisible: true,
  pageTitle: '',
  breadcrumbs: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<NotificationState, 'id'>>) => {
      const notification: NotificationState = {
        ...action.payload,
        id: Math.random().toString(36).substr(2, 9),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    openModal: (state, action: PayloadAction<{ id: string; data?: any }>) => {
      state.modals[action.payload.id] = {
        id: action.payload.id,
        isOpen: true,
        data: action.payload.data,
      };
    },
    closeModal: (state, action: PayloadAction<string>) => {
      if (state.modals[action.payload]) {
        state.modals[action.payload].isOpen = false;
      }
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setBottomTabVisible: (state, action: PayloadAction<boolean>) => {
      state.bottomTabVisible = action.payload;
    },
    setPageTitle: (state, action: PayloadAction<string>) => {
      state.pageTitle = action.payload;
    },
    setBreadcrumbs: (state, action: PayloadAction<Array<{ label: string; href?: string }>>) => {
      state.breadcrumbs = action.payload;
    },
  },
});

export const {
  setLoading,
  addNotification,
  removeNotification,
  clearNotifications,
  openModal,
  closeModal,
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  setBottomTabVisible,
  setPageTitle,
  setBreadcrumbs,
} = uiSlice.actions;

export default uiSlice.reducer;

// Selectors
export const selectUI = (state: { ui: UIState }) => state.ui;
export const selectIsLoading = (state: { ui: UIState }) => state.ui.isLoading;
export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications;
export const selectModals = (state: { ui: UIState }) => state.ui.modals;
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
```

### **Custom Hooks Implementation**

#### **Typed Redux Hooks (`hooks/redux.ts`)**
```typescript
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

#### **Authentication Hook (`hooks/useAuth.ts`)**
```typescript
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
} from '@/store/slices/authSlice';
import { LoginCredentials } from '@/services/types/auth.types';

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
    async (credentials: LoginCredentials) => {
      const result = await dispatch(loginUser(credentials));
      return result;
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    await dispatch(logoutUser());
  }, [dispatch]);

  const refresh = useCallback(async () => {
    const result = await dispatch(refreshToken());
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
```

#### **UI State Hook (`hooks/useUI.ts`)**
```typescript
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import {
  setLoading,
  addNotification,
  removeNotification,
  clearNotifications,
  openModal,
  closeModal,
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  setBottomTabVisible,
  setPageTitle,
  setBreadcrumbs,
  selectUI,
  selectIsLoading,
  selectNotifications,
  selectModals,
  selectTheme,
} from '@/store/slices/uiSlice';

export const useUI = () => {
  const dispatch = useAppDispatch();
  const ui = useAppSelector(selectUI);
  const isLoading = useAppSelector(selectIsLoading);
  const notifications = useAppSelector(selectNotifications);
  const modals = useAppSelector(selectModals);
  const theme = useAppSelector(selectTheme);

  const showLoading = useCallback(() => {
    dispatch(setLoading(true));
  }, [dispatch]);

  const hideLoading = useCallback(() => {
    dispatch(setLoading(false));
  }, [dispatch]);

  const showNotification = useCallback(
    (type: 'success' | 'error' | 'warning' | 'info', message: string, duration?: number) => {
      dispatch(addNotification({ type, message, duration }));
    },
    [dispatch]
  );

  const hideNotification = useCallback(
    (id: string) => {
      dispatch(removeNotification(id));
    },
    [dispatch]
  );

  const showModal = useCallback(
    (id: string, data?: any) => {
      dispatch(openModal({ id, data }));
    },
    [dispatch]
  );

  const hideModal = useCallback(
    (id: string) => {
      dispatch(closeModal(id));
    },
    [dispatch]
  );

  const toggleSidebarState = useCallback(() => {
    dispatch(toggleSidebar());
  }, [dispatch]);

  const updatePageTitle = useCallback(
    (title: string) => {
      dispatch(setPageTitle(title));
    },
    [dispatch]
  );

  const updateBreadcrumbs = useCallback(
    (breadcrumbs: Array<{ label: string; href?: string }>) => {
      dispatch(setBreadcrumbs(breadcrumbs));
    },
    [dispatch]
  );

  return {
    // State
    ui,
    isLoading,
    notifications,
    modals,
    theme,
    
    // Actions
    showLoading,
    hideLoading,
    showNotification,
    hideNotification,
    showModal,
    hideModal,
    toggleSidebar: toggleSidebarState,
    updatePageTitle,
    updateBreadcrumbs,
  };
};
```

### **Middleware Implementation**

#### **API Middleware (`store/middleware/apiMiddleware.ts`)**
```typescript
import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../index';

export const apiMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  // Automatically attach token to API requests
  const result = next(action);
  
  // You can add logic here to automatically attach tokens to API calls
  // This will be expanded when we implement the API client
  
  return result;
};
```

#### **Session Timeout Middleware (`store/middleware/sessionTimeoutMiddleware.ts`)**
```typescript
import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { clearAuth } from '../slices/authSlice';

export const sessionTimeoutMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  const result = next(action);
  
  // Check session expiry
  const state = store.getState();
  const { sessionExpiry, isAuthenticated } = state.auth;
  
  if (isAuthenticated && sessionExpiry && Date.now() > sessionExpiry) {
    store.dispatch(clearAuth());
  }
  
  return result;
};
```

---

## 🧪 Testing Implementation

### **Auth Slice Tests (`store/slices/__tests__/authSlice.test.ts`)**
```typescript
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { loginUser, logoutUser, clearError } from '../authSlice';

describe('authSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: { auth: authReducer },
    });
  });

  it('should handle initial state', () => {
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.user).toBe(null);
  });

  it('should handle clearError', () => {
    store.dispatch(clearError());
    expect(store.getState().auth.error).toBe(null);
  });

  // Add more tests for login, logout, etc.
});
```

---

## 📝 Definition of Done

### **Store Configuration**
- [ ] Redux Toolkit store properly configured with TypeScript
- [ ] Redux DevTools integration working in development
- [ ] Redux Persist configured for session state
- [ ] Store provider component implemented
- [ ] Proper middleware configuration

### **State Management**
- [ ] Auth slice with complete authentication state
- [ ] UI slice with global UI state management
- [ ] Proper action creators and reducers
- [ ] Async thunks for API operations
- [ ] Selectors for state access

### **Custom Hooks**
- [ ] Typed Redux hooks (useAppDispatch, useAppSelector)
- [ ] useAuth hook with authentication operations
- [ ] useUI hook for UI state management
- [ ] Proper error handling in hooks
- [ ] Permission and role checking utilities

### **Testing**
- [ ] Unit tests for all slices
- [ ] Hook testing with React Testing Library
- [ ] Integration tests for store configuration
- [ ] Test utilities for Redux state
- [ ] Mock implementations for testing

---

## 🔗 Dependencies

**Previous Stories:**
- ✅ Story 1.1: Initialize Next.js Project
- ✅ Story 1.2: Implement Defined Directory Structure

**Next Stories:**
- Story 1.4: Implement Central API Client (Axios)

---

## 📈 Success Metrics

- [ ] **State Performance**: State updates complete in <10ms
- [ ] **Memory Usage**: Redux state overhead <5MB
- [ ] **Developer Experience**: Type safety and autocomplete working
- [ ] **Test Coverage**: >95% coverage on state management logic
- [ ] **Persistence**: Session state persists across browser refreshes

---

**Story Status**: ✅ **READY FOR DEVELOPMENT**

*This story establishes the complete Redux Toolkit global state management system with authentication and UI state, providing a solid foundation for all frontend state management needs.*