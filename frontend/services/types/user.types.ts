// User roles in the system
export type UserRole = 'super_admin' | 'company_admin' | 'clerk' | 'agent';

// User entity
export interface User {
  id: string;
  companyId?: string; // null for super_admin
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  profilePicture?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  permissions?: string[];
  agentCode?: string; // For agents
  clerkCode?: string; // For clerks
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}

// User creation request
export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  password: string;
  companyId?: string;
}

// User update request
export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  status?: 'active' | 'inactive' | 'suspended';
  profilePicture?: string;
  permissions?: string[];
}

// User filters for listing
export interface UserFilters {
  role?: UserRole;
  status?: 'active' | 'inactive' | 'suspended' | 'pending';
  companyId?: string;
  isVerified?: boolean;
  lastLoginFrom?: string;
  lastLoginTo?: string;
}

// User profile update
export interface UserProfileUpdate {
  firstName?: string;
  lastName?: string;
  phone?: string;
  profilePicture?: string;
}

// Password change request
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// User summary for dashboard
export interface UserSummary {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersByRole: {
    super_admin: number;
    company_admin: number;
    clerk: number;
    agent: number;
  };
}

// User session info
export interface UserSession {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: string;
  permissions: string[];
}