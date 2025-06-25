import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';
import { apiMiddleware } from './middleware/apiMiddleware';
import { sessionTimeoutMiddleware } from './middleware/sessionTimeoutMiddleware';

// Dashboard API setup (commented out temporarily due to dependency issues)
// import { dashboardApi, dashboardApiMiddleware } from './api/dashboardApi';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Only persist auth state
  blacklist: ['ui'], // Don't persist UI state
};

const rootReducer = combineReducers({
  auth: authSlice,
  ui: uiSlice,
  // dashboardApi: dashboardApi.reducer, // Will add after resolving RTK Query setup
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
    // .concat(dashboardApiMiddleware), // Will add after resolving RTK Query setup
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;