import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';
import { apiMiddleware } from './middleware/apiMiddleware';
import { sessionTimeoutMiddleware } from './middleware/sessionTimeoutMiddleware';

// Dashboard API setup - now active
import { dashboardApi } from './api/dashboardApi';

// Approval Workflow API setup
import { approvalApi } from './api/approvalApi';

// Import the store reference setter to avoid circular dependency
import { setStoreReference } from '../services/apiClient';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Only persist auth state
  blacklist: ['ui', 'dashboardApi', 'approvalApi'], // Don't persist UI state or API cache
};

const rootReducer = combineReducers({
  auth: authSlice,
  ui: uiSlice,
  dashboardApi: dashboardApi.reducer,
  approvalApi: approvalApi.reducer,
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
    .concat(sessionTimeoutMiddleware)
    .concat(dashboardApi.middleware)
    .concat(approvalApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

// Set the store reference in apiClient to avoid circular dependency
setStoreReference(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;