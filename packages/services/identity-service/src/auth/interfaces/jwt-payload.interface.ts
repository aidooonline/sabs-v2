import { UserRole } from '@sabs/common';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  companyId: string;
  role: UserRole;
  iat?: number; // Issued at
  exp?: number; // Expiration time
}

export interface AuthUser {
  id: string;
  email: string;
  companyId: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  expiresIn: number;
}