import { User, UserRole } from './user.types';

// Login request
export interface LoginRequest {
  email: string;
  password: string;
  companyId?: string; // For multi-tenant login
  rememberMe?: boolean;
}

// Login response
export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: string;
  permissions: string[];
}

// Registration request
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  companyId?: string;
  invitationToken?: string;
}

// Password reset request
export interface ForgotPasswordRequest {
  email: string;
  companyId?: string;
}

// Reset password request
export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

// Change password request is defined in user.types.ts

// Token refresh request
export interface RefreshTokenRequest {
  refreshToken: string;
}

// Email verification request
export interface VerifyEmailRequest {
  token: string;
}

// Phone verification request
export interface VerifyPhoneRequest {
  phone: string;
  code: string;
}

// Send verification code
export interface SendVerificationCodeRequest {
  phone: string;
  type: 'sms' | 'call';
}

// Session information
export interface SessionInfo {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  expiresAt: string | null;
  permissions: string[];
}

// Authentication state for Redux
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  permissions: string[];
  loading: boolean;
  error: string | null;
}

// Permission check
export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

// Role-based access control
export interface RolePermissions {
  role: UserRole;
  permissions: string[];
  restrictions?: Record<string, any>;
}

// Multi-factor authentication
export interface MfaSetupRequest {
  type: 'sms' | 'email' | 'authenticator';
  phone?: string;
  email?: string;
}

export interface MfaVerifyRequest {
  code: string;
  type: 'sms' | 'email' | 'authenticator';
}