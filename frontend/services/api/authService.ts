import { BaseService } from '../base/BaseService';
import { 
  LoginRequest, 
  LoginResponse, 
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  MfaSetupRequest,
  MfaVerifyRequest,
  RegisterRequest
} from '../types/auth.types';
import { User, ChangePasswordRequest } from '../types/user.types';
import { ApiResponse } from '../types/api.types';

// Define RefreshTokenResponse interface
interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
}

class AuthService extends BaseService {
  constructor() {
    super('/auth');
  }

  // User login
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.post<LoginResponse>('/login', credentials, { skipAuth: true });
  }

  // User logout
  async logout(): Promise<ApiResponse<void>> {
    return this.post<void>('/logout');
  }

  // Refresh access token
  async refreshToken(data: RefreshTokenRequest): Promise<ApiResponse<RefreshTokenResponse>> {
    return this.post<RefreshTokenResponse>('/refresh', data, { 
      skipAuth: true,
      skipErrorNotification: true 
    });
  }

  // Register new user
  async register(userData: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    return this.post<LoginResponse>('/register', userData, { skipAuth: true });
  }

  // Get current user profile
  async getProfile(): Promise<ApiResponse<User>> {
    return this.get<User>('/profile');
  }

  // Update user profile
  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.put<User>('/profile', data);
  }

  // Change password
  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<void>> {
    return this.post<void>('/change-password', data);
  }

  // Request password reset
  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<void>> {
    return this.post<void>('/forgot-password', data, { skipAuth: true });
  }

  // Reset password with token
  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<void>> {
    return this.post<void>('/reset-password', data, { skipAuth: true });
  }

  // Verify email address
  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    return this.post<void>('/verify-email', { token }, { skipAuth: true });
  }

  // Resend email verification
  async resendEmailVerification(): Promise<ApiResponse<void>> {
    return this.post<void>('/resend-verification');
  }

  // Enable MFA
  async enableMfa(data: MfaSetupRequest): Promise<ApiResponse<{ qrCode: string; secret: string }>> {
    return this.post<{ qrCode: string; secret: string }>('/mfa/enable', data);
  }

  // Verify MFA setup
  async verifyMfa(data: MfaVerifyRequest): Promise<ApiResponse<void>> {
    return this.post<void>('/mfa/verify', data);
  }

  // Disable MFA
  async disableMfa(data: MfaVerifyRequest): Promise<ApiResponse<void>> {
    return this.post<void>('/mfa/disable', data);
  }

  // Verify MFA code during login
  async verifyMfaLogin(data: MfaVerifyRequest): Promise<ApiResponse<LoginResponse>> {
    return this.post<LoginResponse>('/mfa/verify-login', data, { skipAuth: true });
  }

  // Check session validity
  async checkSession(): Promise<ApiResponse<{ valid: boolean; user?: User }>> {
    return this.get<{ valid: boolean; user?: User }>('/session');
  }

  // Get user permissions
  async getPermissions(): Promise<ApiResponse<string[]>> {
    return this.get<string[]>('/permissions');
  }

  // Revoke all sessions (logout from all devices)
  async revokeAllSessions(): Promise<ApiResponse<void>> {
    return this.post<void>('/revoke-all-sessions');
  }

  // Get active sessions
  async getActiveSessions(): Promise<ApiResponse<Array<{
    id: string;
    deviceInfo: string;
    lastActivity: string;
    ipAddress: string;
    isCurrent: boolean;
  }>>> {
    return this.get('/sessions');
  }

  // Revoke specific session
  async revokeSession(sessionId: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/sessions/${sessionId}`);
  }
}

export const authService = new AuthService();