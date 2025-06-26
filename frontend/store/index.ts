import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';
import { apiMiddleware } from './middleware/apiMiddleware';
import { sessionTimeoutMiddleware } from './middleware/sessionTimeoutMiddleware';

// Dashboard API setup - now active
import { dashboardApi, dashboardApiMiddleware } from './api/dashboardApi';

// Approval Workflow API setup
import { approvalApi, approvalApiMiddleware } from './api/approvalApi';

// Customer Management API setup
import { customerApi, customerApiMiddleware } from './api/customerApi';

// Reports API setup
import { reportsApi } from './api/reportsApi';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Only persist auth state
  blacklist: ['ui', 'dashboardApi', 'approvalApi', 'customerApi', 'reportsApi'], // Don't persist UI state or API cache
};

const rootReducer = combineReducers({
  auth: authSlice,
  ui: uiSlice,
  dashboardApi: dashboardApi.reducer,
  approvalApi: approvalApi.reducer,
  customerApi: customerApi.reducer,
  reportsApi: reportsApi.reducer,
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
    .concat(dashboardApiMiddleware)
    .concat(approvalApiMiddleware)
    .concat(customerApiMiddleware)
    .concat(reportsApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;