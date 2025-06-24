import { apiClient } from '../apiClient';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  RefreshTokenRequest,
  ApiResponse,
} from '../types';

class AuthService {
  private readonly basePath = '/auth';

  // Login user
  async login(data: LoginRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>(`${this.basePath}/login`, data);
  }

  // Register new user
  async register(data: RegisterRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>(`${this.basePath}/register`, data);
  }

  // Logout user
  async logout(): Promise<ApiResponse<null>> {
    return apiClient.post<ApiResponse<null>>(`${this.basePath}/logout`);
  }

  // Refresh access token
  async refreshToken(data: RefreshTokenRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>(`${this.basePath}/refresh`, data);
  }

  // Forgot password
  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<null>> {
    return apiClient.post<ApiResponse<null>>(`${this.basePath}/forgot-password`, data);
  }

  // Reset password
  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<null>> {
    return apiClient.post<ApiResponse<null>>(`${this.basePath}/reset-password`, data);
  }

  // Verify email
  async verifyEmail(token: string): Promise<ApiResponse<null>> {
    return apiClient.post<ApiResponse<null>>(`${this.basePath}/verify-email`, { token });
  }

  // Get current user profile
  async getProfile(): Promise<any> {
    return apiClient.get<any>(`${this.basePath}/profile`);
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;