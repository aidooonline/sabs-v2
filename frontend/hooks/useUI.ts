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
  selectSidebarOpen,
  selectBottomTabVisible,
  selectPageTitle,
  selectBreadcrumbs,
} from '../store/slices/uiSlice';

export const useUI = () => {
  const dispatch = useAppDispatch();
  const ui = useAppSelector(selectUI);
  const isLoading = useAppSelector(selectIsLoading);
  const notifications = useAppSelector(selectNotifications);
  const modals = useAppSelector(selectModals);
  const theme = useAppSelector(selectTheme);
  const sidebarOpen = useAppSelector(selectSidebarOpen);
  const bottomTabVisible = useAppSelector(selectBottomTabVisible);
  const pageTitle = useAppSelector(selectPageTitle);
  const breadcrumbs = useAppSelector(selectBreadcrumbs);

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

  const clearAllNotifications = useCallback(() => {
    dispatch(clearNotifications());
  }, [dispatch]);

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

  const setSidebar = useCallback(
    (open: boolean) => {
      dispatch(setSidebarOpen(open));
    },
    [dispatch]
  );

  const switchTheme = useCallback(
    (newTheme: 'light' | 'dark') => {
      dispatch(setTheme(newTheme));
    },
    [dispatch]
  );

  const setBottomTab = useCallback(
    (visible: boolean) => {
      dispatch(setBottomTabVisible(visible));
    },
    [dispatch]
  );

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
    sidebarOpen,
    bottomTabVisible,
    pageTitle,
    breadcrumbs,
    
    // Actions
    showLoading,
    hideLoading,
    showNotification,
    hideNotification,
    clearAllNotifications,
    showModal,
    hideModal,
    toggleSidebar: toggleSidebarState,
    setSidebar,
    switchTheme,
    setBottomTab,
    updatePageTitle,
    updateBreadcrumbs,
  };
};