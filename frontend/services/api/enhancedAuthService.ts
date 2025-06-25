import { api } from '../apiClient';

// Authentication Types
export interface EnhancedLoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
  backupCode?: string;
  deviceFingerprint: string;
  deviceName?: string;
  rememberDevice?: boolean;
}

export interface EnhancedLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  expiresIn: number;
  requiresMfa?: boolean;
  sessionId?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  companyId?: string;
  role: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isEmailVerified?: boolean;
  lastLogin?: string;
}

// MFA Types
export interface MfaSetupRequest {
  type: 'totp' | 'sms' | 'email';
  phoneNumber?: string;
}

export interface MfaSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  type: string;
}

export interface MfaVerifySetupRequest {
  code: string;
}

export interface MfaStatus {
  enabled: boolean;
  type?: 'totp' | 'sms' | 'email';
  phoneNumber?: string;
  backupCodesRemaining: number;
}

export interface MfaDisableRequest {
  password: string;
  mfaCode?: string;
}

// Session Types
export interface UserSession {
  id: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  deviceFingerprint: string;
  ipAddress: string;
  locationCity?: string;
  locationCountry?: string;
  userAgent: string;
  isActive: boolean;
  isCurrent: boolean;
  isSuspicious: boolean;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
}

export interface SessionsResponse {
  sessions: UserSession[];
  total: number;
  page: number;
  limit: number;
}

export interface SessionFilterParams {
  page?: number;
  limit?: number;
  activeOnly?: boolean;
  deviceType?: string;
}

export interface SessionAnalytics {
  totalSessions: number;
  activeSessions: number;
  suspiciousSessions: number;
  uniqueDevices: number;
  uniqueLocations: number;
  averageSessionDuration: number;
  deviceBreakdown: Record<string, number>;
  locationBreakdown: Record<string, number>;
  riskScore: number;
}

// Device Types
export interface UserDevice {
  fingerprint: string;
  name: string;
  type: 'mobile' | 'desktop' | 'tablet';
  lastSeen: string;
  location: string;
  trusted: boolean;
}

export interface DevicesResponse {
  devices: UserDevice[];
  total: number;
}

// Security Types
export interface AuditLog {
  id: string;
  action: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  details?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface SecurityAnalytics {
  totalEvents: number;
  successfulLogins: number;
  failedLogins: number;
  suspiciousActivities: number;
  mfaEvents: number;
  uniqueIPs: number;
  riskScore: number;
  trends: {
    date: string;
    logins: number;
    failures: number;
    suspicious: number;
  }[];
}

export interface SuspiciousActivity {
  id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: string;
  resolved: boolean;
  metadata?: Record<string, any>;
}

export interface ReportSuspiciousActivityRequest {
  activityType: string;
  description: string;
  metadata?: Record<string, any>;
}

export class EnhancedAuthService {
  // Authentication Methods
  async enhancedLogin(loginData: EnhancedLoginRequest): Promise<EnhancedLoginResponse> {
    const response = await api.post<EnhancedLoginResponse>('/auth/login', loginData);
    
    // Store tokens if login successful
    if (response.data.accessToken) {
      this.setTokens(response.data.accessToken, response.data.refreshToken);
    }
    
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<EnhancedLoginResponse> {
    const response = await api.post<EnhancedLoginResponse>('/auth/refresh', { refreshToken });
    
    if (response.data.accessToken) {
      this.setTokens(response.data.accessToken, response.data.refreshToken);
    }
    
    return response.data;
  }

  async enhancedLogout(logoutAll: boolean = false): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(`/auth/logout?all=${logoutAll}`);
    this.clearTokens();
    return response.data;
  }

  // MFA Methods
  async setupMfa(setupData: MfaSetupRequest): Promise<MfaSetupResponse> {
    const response = await api.post<MfaSetupResponse>('/auth/mfa/setup', setupData);
    return response.data;
  }

  async verifyMfaSetup(verifyData: MfaVerifySetupRequest): Promise<{ success: boolean; backupCodes: string[] }> {
    const response = await api.post<{ success: boolean; backupCodes: string[] }>('/auth/mfa/verify-setup', verifyData);
    return response.data;
  }

  async getMfaStatus(): Promise<MfaStatus> {
    const response = await api.get<MfaStatus>('/auth/mfa/status');
    return response.data;
  }

  async generateBackupCodes(): Promise<{ backupCodes: string[] }> {
    const response = await api.post<{ backupCodes: string[] }>('/auth/mfa/backup-codes');
    return response.data;
  }

  async disableMfa(disableData: MfaDisableRequest): Promise<{ success: boolean }> {
    // Use POST instead of DELETE for body data
    const response = await api.post<{ success: boolean }>('/auth/mfa/disable', disableData);
    return response.data;
  }

  // Session Management
  async getSessions(params?: SessionFilterParams): Promise<SessionsResponse> {
    const response = await api.get<SessionsResponse>('/auth/sessions', params);
    return response.data;
  }

  async invalidateSessions(sessionIds: string[]): Promise<{ success: boolean }> {
    // Use POST for session invalidation with body data
    const response = await api.post<{ success: boolean }>('/auth/sessions/invalidate', { sessionIds });
    return response.data;
  }

  async getSessionAnalytics(): Promise<SessionAnalytics> {
    const response = await api.get<SessionAnalytics>('/auth/sessions/analytics');
    return response.data;
  }

  async detectSuspiciousActivity(): Promise<{ suspiciousActivities: SuspiciousActivity[] }> {
    const response = await api.get<{ suspiciousActivities: SuspiciousActivity[] }>('/auth/sessions/suspicious-activity');
    return response.data;
  }

  // Device Management
  async getDevices(): Promise<DevicesResponse> {
    const response = await api.get<DevicesResponse>('/auth/devices');
    return response.data;
  }

  // Security & Audit
  async getAuditLogs(limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
    const response = await api.get<AuditLog[]>('/auth/audit-logs', { limit, offset });
    return response.data;
  }

  async getSecurityAnalytics(days: number = 30): Promise<SecurityAnalytics> {
    const response = await api.get<SecurityAnalytics>('/auth/security/analytics', { days });
    return response.data;
  }

  async detectAnomalies(): Promise<{ anomalies: any[] }> {
    const response = await api.get<{ anomalies: any[] }>('/auth/security/anomalies');
    return response.data;
  }

  async reportSuspiciousActivity(reportData: ReportSuspiciousActivityRequest): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/security/report-suspicious', reportData);
    return response.data;
  }

  // Token Management (Local Storage)
  setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken');
    }
    return null;
  }

  clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  // Device Fingerprinting
  generateDeviceFingerprint(): string {
    if (typeof window === 'undefined') return 'server-side';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }

    // Get device memory safely
    const deviceMemory = (navigator as any).deviceMemory || 0;

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
      deviceMemory,
      canvas.toDataURL(),
    ].join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16);
  }

  getDeviceName(): string {
    if (typeof window === 'undefined') return 'Server';

    const userAgent = navigator.userAgent;
    
    if (/iPhone/i.test(userAgent)) return 'iPhone';
    if (/iPad/i.test(userAgent)) return 'iPad';
    if (/Android/i.test(userAgent)) return 'Android Device';
    if (/Windows/i.test(userAgent)) return 'Windows PC';
    if (/Macintosh/i.test(userAgent)) return 'Mac';
    if (/Linux/i.test(userAgent)) return 'Linux PC';
    
    return 'Unknown Device';
  }

  getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
    if (typeof window === 'undefined') return 'desktop';

    const userAgent = navigator.userAgent;
    
    if (/iPad/i.test(userAgent)) return 'tablet';
    if (/iPhone|Android/i.test(userAgent) && !/iPad/i.test(userAgent)) return 'mobile';
    
    return 'desktop';
  }

  // Utility Methods
  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  async checkTokenValidity(): Promise<boolean> {
    try {
      await api.get('/auth/health/auth');
      return true;
    } catch {
      return false;
    }
  }

  // Helper Methods for UI
  formatSessionDuration(session: UserSession): string {
    const start = new Date(session.createdAt);
    const end = session.lastActivity ? new Date(session.lastActivity) : new Date();
    const duration = end.getTime() - start.getTime();

    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  getSessionRiskLevel(session: UserSession): { level: 'low' | 'medium' | 'high'; color: string } {
    if (session.isSuspicious) {
      return { level: 'high', color: 'red' };
    }
    
    const deviceAge = new Date().getTime() - new Date(session.createdAt).getTime();
    const daysSinceCreated = deviceAge / (1000 * 60 * 60 * 24);
    
    if (daysSinceCreated < 1) {
      return { level: 'medium', color: 'yellow' };
    }
    
    return { level: 'low', color: 'green' };
  }

  formatAuditLogSeverity(severity: string): { label: string; color: string } {
    const severityMap = {
      LOW: { label: 'Low', color: 'gray' },
      MEDIUM: { label: 'Medium', color: 'yellow' },
      HIGH: { label: 'High', color: 'orange' },
      CRITICAL: { label: 'Critical', color: 'red' },
    };
    
    return severityMap[severity as keyof typeof severityMap] || { label: severity, color: 'gray' };
  }

  formatLastActivity(lastActivity: string): string {
    const date = new Date(lastActivity);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

  getLocationString(session: UserSession): string {
    if (session.locationCity && session.locationCountry) {
      return `${session.locationCity}, ${session.locationCountry}`;
    }
    if (session.locationCountry) {
      return session.locationCountry;
    }
    return 'Unknown Location';
  }
}

// Export singleton instance
export const enhancedAuthService = new EnhancedAuthService();