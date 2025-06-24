import { BaseService } from '../base/BaseService';
import { User, ChangePasswordRequest } from '../types/user.types';
import { 
  LoginCredentials, 
  AuthResponse, 
  RefreshTokenResponse,
  ResetPasswordRequest,
  MfaVerificationRequest,
  SessionValidationResponse,
  ForgotPasswordRequest,
  RegisterRequest,
  MfaSetupRequest
} from '../types/auth.types';

class AuthService extends BaseService {
  constructor() {
    super('/auth');
  }

  // User authentication
  async login(credentials: LoginCredentials) {
    return this.post<AuthResponse>('/login', credentials);
  }

  // MFA verification
  async verifyMfa(data: MfaVerificationRequest) {
    return this.post<AuthResponse>('/mfa/verify', data);
  }

  // User logout
  async logout() {
    return this.post<void>('/logout');
  }

  // Refresh access token
  async refreshToken() {
    return this.post<RefreshTokenResponse>('/refresh');
  }

  // Get current user profile
  async getProfile() {
    return this.get<User>('/profile');
  }

  // Update user profile
  async updateProfile(data: Partial<User>) {
    return this.put<User>('/profile', data);
  }

  // Change password
  async changePassword(data: ChangePasswordRequest) {
    return this.post<void>('/change-password', data);
  }

  // Request password reset
  async requestPasswordReset(data: ForgotPasswordRequest) {
    return this.post<void>('/forgot-password', data);
  }

  // Reset password with token
  async resetPassword(data: ResetPasswordRequest) {
    return this.post<void>('/reset-password', data);
  }

  // Validate current session
  async validateSession() {
    return this.get<SessionValidationResponse>('/session/validate');
  }

  // Enable MFA
  async enableMfa(data: MfaSetupRequest) {
    return this.post<{ qrCode: string; secret: string }>('/mfa/enable', data);
  }

  // Disable MFA
  async disableMfa(data: { code: string }) {
    return this.post<void>('/mfa/disable', data);
  }

  // Get user permissions
  async getUserPermissions() {
    return this.get<string[]>('/permissions');
  }

  // Register new user
  async register(data: RegisterRequest) {
    return this.post<AuthResponse>('/register', data);
  }

  // Verify email
  async verifyEmail(token: string) {
    return this.post<void>('/verify-email', { token });
  }

  // Resend verification email
  async resendVerificationEmail() {
    return this.post<void>('/resend-verification');
  }

  // Check if email is available
  async checkEmailAvailable(email: string) {
    return this.get<{ available: boolean }>('/check-email', { email });
  }

  // Update last activity
  async updateActivity() {
    return this.post<void>('/activity');
  }

  // Get session information
  async getSessionInfo() {
    return this.get<{
      sessionId: string;
      expiresAt: string;
      lastActivity: string;
      ipAddress: string;
      userAgent: string;
    }>('/session/info');
  }

  // Terminate specific session
  async terminateSession(sessionId: string) {
    return this.delete<void>(`/session/${sessionId}`);
  }

  // Terminate all other sessions
  async terminateAllOtherSessions() {
    return this.post<void>('/session/terminate-others');
  }

  // Get active sessions
  async getActiveSessions() {
    return this.get<Array<{
      sessionId: string;
      createdAt: string;
      lastActivity: string;
      ipAddress: string;
      userAgent: string;
      isCurrent: boolean;
    }>>('/sessions');
  }

  // Security audit logs
  async getSecurityLogs(params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.get<{
      logs: Array<{
        id: string;
        action: string;
        ipAddress: string;
        userAgent: string;
        timestamp: string;
        details?: any;
      }>;
      total: number;
    }>('/security/logs', params);
  }
}

export const authService = new AuthService();