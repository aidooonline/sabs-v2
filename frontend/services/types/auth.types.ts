import { User, UserRole } from './user.types';

// Enhanced login credentials interface
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  mfaCode?: string;
  companyId?: string; // For multi-tenant login
}

// Enhanced authentication response
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  permissions: string[];
  expiresIn: number;
  requiresMfa?: boolean;
  mfaToken?: string;
}

// MFA authentication response
export interface MfaAuthResponse extends Omit<AuthResponse, 'user' | 'token' | 'refreshToken' | 'permissions' | 'expiresIn'> {
  requiresMfa: true;
  mfaToken: string;
  requiresMfaVerification?: boolean;
}

// Token refresh response
export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

// MFA verification request
export interface MfaVerificationRequest {
  mfaToken: string;
  code: string;
  rememberDevice?: boolean;
}

// Session validation response
export interface SessionValidationResponse {
  valid: boolean;
  user?: User;
  expiresAt?: string;
  permissions?: string[];
}

// Password reset request
export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

// Legacy interfaces for backward compatibility
export interface LoginRequest extends LoginCredentials {}

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

// Enhanced authentication state for Redux
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // MFA state
  requiresMfaVerification: boolean;
  mfaToken: string | null;
  
  // Security state
  loginAttempts: number;
  maxLoginAttempts: number;
  accountLocked: boolean;
  lockoutExpiry: number | null;
  
  // Session state
  sessionExpiry: number | null;
  lastActivity: number | null;
  rememberMe: boolean;
  
  // User context
  permissions: string[];
  role: string | null;
  companyId: string | null;
  
  // UI state
  isInitialized: boolean;
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