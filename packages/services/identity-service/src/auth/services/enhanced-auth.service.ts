import { 
  Injectable, 
  UnauthorizedException, 
  BadRequestException,
  ConflictException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { UsersService } from '../../users/users.service';
import { MfaService } from './mfa.service';
import { SessionService } from './session.service';
import { AuditService, AuditContext } from './audit.service';
import { JwtPayload, LoginResponse, AuthUser } from '../interfaces/jwt-payload.interface';
import { EnhancedLoginDto } from '../dto/enhanced-auth.dto';
import { AuditAction, AuditSeverity } from '../entities/audit-log.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export interface LoginAttempt {
  count: number;
  firstAttempt: Date;
  lastAttempt: Date;
  locked: boolean;
  lockExpires?: Date;
}

@Injectable()
export class EnhancedAuthService {
  private readonly jwtExpiresIn = '24h';
  private readonly refreshTokenExpiresIn = '7d';
  private readonly saltRounds = 12;
  private readonly maxLoginAttempts = 5;
  private readonly lockoutDuration = 15 * 60 * 1000; // 15 minutes

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mfaService: MfaService,
    private readonly sessionService: SessionService,
    private readonly auditService: AuditService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Enhanced login with MFA, device tracking, and security monitoring
   */
  async enhancedLogin(
    loginDto: EnhancedLoginDto,
    request: any
  ): Promise<LoginResponse & { requiresMfa?: boolean; sessionId?: string }> {
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'] || '';
    
    const auditContext: AuditContext = {
      ipAddress,
      userAgent,
      deviceFingerprint: loginDto.deviceFingerprint,
    };

    try {
      // Check rate limiting
      await this.checkRateLimit(ipAddress, loginDto.email);

      // Validate user credentials
      const user = await this.validateUserCredentials(loginDto.email, loginDto.password);
      auditContext.userId = user.id;

      // Check if MFA is required
      const mfaEnabled = await this.mfaService.isMfaEnabled(user.id);
      
      if (mfaEnabled && !loginDto.mfaCode && !loginDto.backupCode) {
        await this.auditService.logAuthEvent(
          AuditAction.LOGIN_FAILED,
          auditContext,
          false,
          'MFA required but not provided',
          AuditSeverity.MEDIUM
        );
        
        return {
          requiresMfa: true,
          accessToken: '',
          refreshToken: '',
          user: null as any,
          expiresIn: 0,
        };
      }

      // Verify MFA if provided
      if (mfaEnabled && (loginDto.mfaCode || loginDto.backupCode)) {
        const mfaCode = loginDto.mfaCode || loginDto.backupCode!;
        const isBackupCode = !!loginDto.backupCode;
        
        await this.mfaService.verifyMfa(user.id, {
          code: mfaCode,
          isBackupCode,
        });

        await this.auditService.logMfaEvent(
          AuditAction.MFA_VERIFIED,
          auditContext,
          true,
          isBackupCode ? 'backup_code_used' : 'totp_verified'
        );
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Parse device and location info
      const deviceInfo = this.sessionService.parseDeviceInfo(
        userAgent,
        loginDto.deviceFingerprint,
        loginDto.deviceName
      );
      const locationInfo = this.sessionService.parseLocationInfo(ipAddress);

      // Create session
      const session = await this.sessionService.createSession(
        user.id,
        tokens.accessToken,
        tokens.refreshToken,
        deviceInfo,
        locationInfo
      );

      // Check for suspicious activity
      await this.checkSuspiciousActivity(user.id, deviceInfo, locationInfo, auditContext);

      // Clear failed login attempts
      await this.clearLoginAttempts(loginDto.email);

      // Log successful login
      await this.auditService.logSuccessfulLogin(
        { ...auditContext, sessionId: session.id },
        mfaEnabled
      );

      await this.auditService.logSessionEvent(
        AuditAction.SESSION_CREATED,
        { ...auditContext, sessionId: session.id }
      );

      return {
        ...tokens,
        user,
        sessionId: session.id,
      };

    } catch (error) {
      // Log failed login
      await this.auditService.logFailedLogin(
        auditContext,
        error instanceof Error ? error.message : 'Unknown error'
      );

      // Record failed login attempt
      await this.recordFailedLoginAttempt(loginDto.email);

      throw error;
    }
  }

  /**
   * Enhanced token refresh with session validation
   */
  async enhancedRefreshToken(
    refreshToken: string,
    request: any
  ): Promise<LoginResponse> {
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'] || '';

    // Get session by refresh token
    const session = await this.sessionService.getSessionByRefreshToken(refreshToken);
    
    if (!session || !session.isValid) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Validate user
    const user = await this.usersService.findById(session.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Check for session hijacking
    const deviceInfo = this.sessionService.parseDeviceInfo(
      userAgent,
      session.deviceFingerprint
    );

    if (session.ipAddress !== ipAddress) {
      // Potential session hijacking - mark as suspicious
      await this.sessionService.markSessionSuspicious(
        session.id,
        'IP address mismatch during token refresh'
      );

      await this.auditService.logSuspiciousActivity(
        {
          userId: user.id,
          ipAddress,
          userAgent,
          sessionId: session.id,
        },
        'Token refresh from different IP address',
        AuditSeverity.HIGH
      );

      throw new UnauthorizedException('Suspicious activity detected');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    // Update session
    await this.sessionService.updateSessionActivity(session.id);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        companyId: user.companyId,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
      },
    };
  }

  /**
   * Enhanced logout with session cleanup
   */
  async enhancedLogout(
    accessToken: string,
    request: any,
    logoutAllSessions: boolean = false
  ): Promise<{ message: string }> {
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'] || '';

    // Get session by access token
    const session = await this.sessionService.getSessionByAccessToken(accessToken);
    
    if (session) {
      const auditContext: AuditContext = {
        userId: session.userId,
        ipAddress,
        userAgent,
        sessionId: session.id,
      };

      if (logoutAllSessions) {
        // Invalidate all user sessions
        await this.sessionService.invalidateAllSessionsExceptCurrent(session.userId, '');
        
        await this.auditService.logAuthEvent(
          AuditAction.LOGOUT,
          auditContext,
          true,
          undefined,
          AuditSeverity.MEDIUM
        );
      } else {
        // Invalidate current session only
        await this.sessionService.invalidateSessions(session.userId, [session.id]);
        
        await this.auditService.logAuthEvent(
          AuditAction.LOGOUT,
          auditContext,
          true,
          undefined,
          AuditSeverity.LOW
        );
      }

      await this.auditService.logSessionEvent(
        AuditAction.SESSION_INVALIDATED,
        auditContext
      );

      // Add token to blacklist
      await this.blacklistToken(accessToken);
    }

    return { 
      message: logoutAllSessions 
        ? 'Successfully logged out from all sessions' 
        : 'Successfully logged out' 
    };
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `blacklisted_token:${crypto.createHash('sha256').update(token).digest('hex')}`;
    const blacklisted = await this.cacheManager.get(key);
    return !!blacklisted;
  }

  /**
   * Validate user credentials
   */
  private async validateUserCredentials(email: string, password: string): Promise<AuthUser> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result as AuthUser;
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(user: AuthUser): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.jwtExpiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.refreshTokenExpiresIn,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
    };
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(ipAddress: string, email: string): Promise<void> {
    const ipKey = `rate_limit:ip:${ipAddress}`;
    const emailKey = `rate_limit:email:${email}`;

    const [ipAttempts, emailAttempts] = await Promise.all([
      this.cacheManager.get<number>(ipKey) || 0,
      this.cacheManager.get<number>(emailKey) || 0,
    ]);

    if (ipAttempts >= 20 || emailAttempts >= 10) { // IP: 20/hour, Email: 10/hour
      await this.auditService.logRateLimitExceeded(
        { ipAddress, userAgent: '', metadata: { email } },
        '/auth/login'
      );
      
      throw new UnauthorizedException('Too many login attempts. Please try again later.');
    }

    // Increment counters
    await Promise.all([
      this.cacheManager.set(ipKey, ipAttempts + 1, 60 * 60 * 1000), // 1 hour
      this.cacheManager.set(emailKey, emailAttempts + 1, 60 * 60 * 1000), // 1 hour
    ]);
  }

  /**
   * Record failed login attempt
   */
  private async recordFailedLoginAttempt(email: string): Promise<void> {
    const key = `failed_login:${email}`;
    const attempt = await this.cacheManager.get<LoginAttempt>(key);

    if (attempt) {
      attempt.count++;
      attempt.lastAttempt = new Date();

      if (attempt.count >= this.maxLoginAttempts) {
        attempt.locked = true;
        attempt.lockExpires = new Date(Date.now() + this.lockoutDuration);
      }
    } else {
      const newAttempt: LoginAttempt = {
        count: 1,
        firstAttempt: new Date(),
        lastAttempt: new Date(),
        locked: false,
      };
      
      await this.cacheManager.set(key, newAttempt, this.lockoutDuration);
    }
  }

  /**
   * Clear failed login attempts
   */
  private async clearLoginAttempts(email: string): Promise<void> {
    const key = `failed_login:${email}`;
    await this.cacheManager.del(key);
  }

  /**
   * Check for suspicious activity
   */
  private async checkSuspiciousActivity(
    userId: string,
    deviceInfo: any,
    locationInfo: any,
    auditContext: AuditContext
  ): Promise<void> {
    const suspicious = await this.sessionService.detectSuspiciousActivity(userId);
    
    for (const activity of suspicious.suspiciousActivities) {
      if (activity.severity === 'high') {
        await this.auditService.logSuspiciousActivity(
          auditContext,
          activity.description,
          AuditSeverity.HIGH
        );
      }
    }
  }

  /**
   * Blacklist token
   */
  private async blacklistToken(token: string): Promise<void> {
    const key = `blacklisted_token:${crypto.createHash('sha256').update(token).digest('hex')}`;
    const decoded = this.jwtService.decode(token) as any;
    const ttl = decoded?.exp ? (decoded.exp * 1000) - Date.now() : 24 * 60 * 60 * 1000;
    
    if (ttl > 0) {
      await this.cacheManager.set(key, true, ttl);
    }
  }

  /**
   * Get client IP address
   */
  private getClientIp(request: any): string {
    return request.headers['x-forwarded-for'] || 
           request.headers['x-real-ip'] || 
           request.connection?.remoteAddress || 
           request.socket?.remoteAddress ||
           request.ip ||
           '127.0.0.1';
  }
}