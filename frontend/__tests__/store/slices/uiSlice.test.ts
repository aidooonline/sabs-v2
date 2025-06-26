import { configureStore } from '@reduxjs/toolkit';
import uiReducer, {
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
  setBreadcrumbs
} from '../../../store/slices/uiSlice';

interface UIState {
  isLoading: boolean;
  notifications: Array<{ id: string; type: string; message: string; duration?: number }>;
  modals: Record<string, any>;
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  bottomTabVisible: boolean;
  pageTitle: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
}

describe('uiSlice', () => {
  let store: ReturnType<typeof configureStore<{ ui: UIState }>>;

  beforeEach(() => {
    store = configureStore({
      reducer: { ui: uiReducer },
    });
  });

  describe('initial state', () => {
    it('should handle initial state', () => {
      const state = store.getState().ui;
      expect(state.isLoading).toBe(false);
      expect(state.notifications).toEqual([]);
      expect(state.modals).toEqual({});
      expect(state.sidebarOpen).toBe(false);
      expect(state.theme).toBe('light');
      expect(state.bottomTabVisible).toBe(true);
      expect(state.pageTitle).toBe('');
      expect(state.breadcrumbs).toEqual([]);
    });
  });

  describe('loading actions', () => {
    it('should handle setLoading true', () => {
      store.dispatch(setLoading(true));
      expect(store.getState().ui.isLoading).toBe(true);
    });

    it('should handle setLoading false', () => {
      store.dispatch(setLoading(false));
      expect(store.getState().ui.isLoading).toBe(false);
    });
  });

  describe('notification actions', () => {
    it('should handle addNotification', () => {
      const notification = {
        type: 'success' as const,
        message: 'Test notification',
        duration: 5000
      };

      store.dispatch(addNotification(notification));
      const state = store.getState().ui;
      
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0]).toMatchObject(notification);
      expect(state.notifications[0].id).toBeDefined();
    });

    it('should handle multiple notifications', () => {
      store.dispatch(addNotification({ type: 'success', message: 'First' }));
      store.dispatch(addNotification({ type: 'error', message: 'Second' }));
      
      const state = store.getState().ui;
      expect(state.notifications).toHaveLength(2);
      expect(state.notifications[0].message).toBe('First');
      expect(state.notifications[1].message).toBe('Second');
    });

    it('should handle removeNotification', () => {
      // Add notifications first
      store.dispatch(addNotification({ type: 'success', message: 'First' }));
      store.dispatch(addNotification({ type: 'error', message: 'Second' }));
      
      const firstNotificationId = store.getState().ui.notifications[0].id;
      
      store.dispatch(removeNotification(firstNotificationId));
      const state = store.getState().ui;
      
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].message).toBe('Second');
    });

    it('should handle clearNotifications', () => {
      // Add notifications first
      store.dispatch(addNotification({ type: 'success', message: 'First' }));
      store.dispatch(addNotification({ type: 'error', message: 'Second' }));
      
      store.dispatch(clearNotifications());
      expect(store.getState().ui.notifications).toEqual([]);
    });
  });

  describe('modal actions', () => {
    it('should handle openModal', () => {
      const modalData = { userId: '123', action: 'edit' };
      store.dispatch(openModal({ id: 'userModal', data: modalData }));
      
      const state = store.getState().ui;
      expect(state.modals.userModal).toEqual({
        id: 'userModal',
        isOpen: true,
        data: modalData
      });
    });

    it('should handle openModal without data', () => {
      store.dispatch(openModal({ id: 'confirmModal' }));
      
      const state = store.getState().ui;
      expect(state.modals.confirmModal).toEqual({
        id: 'confirmModal',
        isOpen: true,
        data: undefined
      });
    });

    it('should handle closeModal', () => {
      // Open modal first
      store.dispatch(openModal({ id: 'testModal', data: { test: true } }));
      
      // Then close it
      store.dispatch(closeModal('testModal'));
      
      const state = store.getState().ui;
      expect(state.modals.testModal.isOpen).toBe(false);
    });

    it('should handle closeModal for non-existent modal', () => {
      // Should not throw error
      store.dispatch(closeModal('nonExistentModal'));
      
      const state = store.getState().ui;
      expect(state.modals.nonExistentModal).toBeUndefined();
    });
  });

  describe('sidebar actions', () => {
    it('should handle toggleSidebar', () => {
      expect(store.getState().ui.sidebarOpen).toBe(false);
      
      store.dispatch(toggleSidebar());
      expect(store.getState().ui.sidebarOpen).toBe(true);
      
      store.dispatch(toggleSidebar());
      expect(store.getState().ui.sidebarOpen).toBe(false);
    });

    it('should handle setSidebarOpen', () => {
      store.dispatch(setSidebarOpen(true));
      expect(store.getState().ui.sidebarOpen).toBe(true);
      
      store.dispatch(setSidebarOpen(false));
      expect(store.getState().ui.sidebarOpen).toBe(false);
    });
  });

  describe('theme actions', () => {
    it('should handle setTheme to dark', () => {
      store.dispatch(setTheme('dark'));
      expect(store.getState().ui.theme).toBe('dark');
    });

    it('should handle setTheme to light', () => {
      store.dispatch(setTheme('light'));
      expect(store.getState().ui.theme).toBe('light');
    });
  });

  describe('navigation actions', () => {
    it('should handle setBottomTabVisible', () => {
      store.dispatch(setBottomTabVisible(false));
      expect(store.getState().ui.bottomTabVisible).toBe(false);
      
      store.dispatch(setBottomTabVisible(true));
      expect(store.getState().ui.bottomTabVisible).toBe(true);
    });

    it('should handle setPageTitle', () => {
      const title = 'Dashboard - Sabs v2';
      store.dispatch(setPageTitle(title));
      expect(store.getState().ui.pageTitle).toBe(title);
    });

    it('should handle setBreadcrumbs', () => {
      const breadcrumbs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Users', href: '/dashboard/users' },
        { label: 'Edit User' }
      ];
      
      store.dispatch(setBreadcrumbs(breadcrumbs));
      expect(store.getState().ui.breadcrumbs).toEqual(breadcrumbs);
    });
  });
});