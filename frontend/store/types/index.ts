import { User } from '../../services/types/user.types';

export interface RootState {
  auth: AuthState;
  ui: UIState;
}

export interface AuthState {
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

export interface UIState {
  isLoading: boolean;
  notifications: NotificationState[];
  modals: Record<string, ModalState>;
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  bottomTabVisible: boolean;
  pageTitle: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
}

export interface NotificationState {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface ModalState {
  id: string;
  isOpen: boolean;
  data?: any;
}