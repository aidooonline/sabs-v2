import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction, AuditSeverity } from '../entities/audit-log.entity';
import * as geoip from 'geoip-lite';

export interface AuditContext {
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  deviceFingerprint?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  /**
   * Log authentication event
   */
  async logAuthEvent(
    action: AuditAction,
    context: AuditContext,
    success: boolean = true,
    errorMessage?: string,
    severity: AuditSeverity = AuditSeverity.LOW
  ): Promise<void> {
    const geo = geoip.lookup(context.ipAddress);

    const auditLog = this.auditRepository.create({
      userId: context.userId,
      action,
      severity,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      deviceFingerprint: context.deviceFingerprint,
      locationCountry: geo?.country,
      locationCity: geo?.city,
      success,
      errorMessage,
      metadata: {
        ...context.metadata,
        sessionId: context.sessionId,
        timestamp: new Date().toISOString(),
      },
    });

    await this.auditRepository.save(auditLog);
  }

  /**
   * Log successful login
   */
  async logSuccessfulLogin(context: AuditContext, mfaUsed: boolean = false): Promise<void> {
    await this.logAuthEvent(
      AuditAction.LOGIN_SUCCESS,
      context,
      true,
      undefined,
      mfaUsed ? AuditSeverity.LOW : AuditSeverity.MEDIUM
    );
  }

  /**
   * Log failed login attempt
   */
  async logFailedLogin(context: AuditContext, reason: string): Promise<void> {
    await this.logAuthEvent(
      AuditAction.LOGIN_FAILED,
      context,
      false,
      reason,
      AuditSeverity.MEDIUM
    );
  }

  /**
   * Log blocked login attempt
   */
  async logBlockedLogin(context: AuditContext, reason: string): Promise<void> {
    await this.logAuthEvent(
      AuditAction.LOGIN_BLOCKED,
      context,
      false,
      reason,
      AuditSeverity.HIGH
    );
  }

  /**
   * Log MFA events
   */
  async logMfaEvent(
    action: AuditAction.MFA_ENABLED | AuditAction.MFA_DISABLED | AuditAction.MFA_VERIFIED | AuditAction.MFA_FAILED,
    context: AuditContext,
    success: boolean = true,
    details?: string
  ): Promise<void> {
    const severity = action === AuditAction.MFA_FAILED ? AuditSeverity.MEDIUM : AuditSeverity.LOW;
    
    await this.logAuthEvent(
      action,
      { ...context, metadata: { ...context.metadata, details } },
      success,
      undefined,
      severity
    );
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    context: AuditContext,
    description: string,
    severity: AuditSeverity = AuditSeverity.HIGH
  ): Promise<void> {
    await this.logAuthEvent(
      AuditAction.SUSPICIOUS_ACTIVITY,
      { ...context, metadata: { ...context.metadata, description } },
      true,
      undefined,
      severity
    );
  }

  /**
   * Log password change
   */
  async logPasswordChange(context: AuditContext): Promise<void> {
    await this.logAuthEvent(
      AuditAction.PASSWORD_CHANGED,
      context,
      true,
      undefined,
      AuditSeverity.MEDIUM
    );
  }

  /**
   * Log password reset events
   */
  async logPasswordReset(
    action: AuditAction.PASSWORD_RESET_REQUESTED | AuditAction.PASSWORD_RESET_COMPLETED,
    context: AuditContext
  ): Promise<void> {
    await this.logAuthEvent(
      action,
      context,
      true,
      undefined,
      AuditSeverity.MEDIUM
    );
  }

  /**
   * Log account lock/unlock events
   */
  async logAccountLockEvent(
    action: AuditAction.ACCOUNT_LOCKED | AuditAction.ACCOUNT_UNLOCKED,
    context: AuditContext,
    reason?: string
  ): Promise<void> {
    await this.logAuthEvent(
      action,
      { ...context, metadata: { ...context.metadata, reason } },
      true,
      undefined,
      AuditSeverity.HIGH
    );
  }

  /**
   * Log session events
   */
  async logSessionEvent(
    action: AuditAction.SESSION_CREATED | AuditAction.SESSION_INVALIDATED,
    context: AuditContext
  ): Promise<void> {
    await this.logAuthEvent(
      action,
      context,
      true,
      undefined,
      AuditSeverity.LOW
    );
  }

  /**
   * Log rate limiting events
   */
  async logRateLimitExceeded(context: AuditContext, endpoint: string): Promise<void> {
    await this.logAuthEvent(
      AuditAction.RATE_LIMIT_EXCEEDED,
      { ...context, metadata: { ...context.metadata, endpoint } },
      false,
      'Rate limit exceeded',
      AuditSeverity.MEDIUM
    );
  }

  /**
   * Get user audit logs
   */
  async getUserAuditLogs(
    userId: string,
    limit: number = 50,
    offset: number = 0,
    actions?: AuditAction[]
  ): Promise<{
    logs: AuditLog[];
    total: number;
  }> {
    const queryBuilder = this.auditRepository
      .createQueryBuilder('audit')
      .where('audit.userId = :userId', { userId });

    if (actions && actions.length > 0) {
      queryBuilder.andWhere('audit.action IN (:...actions)', { actions });
    }

    const total = await queryBuilder.getCount();

    const logs = await queryBuilder
      .orderBy('audit.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();

    return { logs, total };
  }

  /**
   * Get security analytics
   */
  async getSecurityAnalytics(userId?: string, days: number = 30): Promise<{
    totalEvents: number;
    successfulLogins: number;
    failedLogins: number;
    suspiciousActivities: number;
    mfaUsage: number;
    locationBreakdown: Record<string, number>;
    actionBreakdown: Record<string, number>;
    riskScore: number;
  }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const queryBuilder = this.auditRepository
      .createQueryBuilder('audit')
      .where('audit.createdAt >= :since', { since });

    if (userId) {
      queryBuilder.andWhere('audit.userId = :userId', { userId });
    }

    const logs = await queryBuilder.getMany();

    const analytics = {
      totalEvents: logs.length,
      successfulLogins: logs.filter(l => l.action === AuditAction.LOGIN_SUCCESS).length,
      failedLogins: logs.filter(l => l.action === AuditAction.LOGIN_FAILED).length,
      suspiciousActivities: logs.filter(l => l.action === AuditAction.SUSPICIOUS_ACTIVITY).length,
      mfaUsage: logs.filter(l => l.action === AuditAction.MFA_VERIFIED).length,
      locationBreakdown: {} as Record<string, number>,
      actionBreakdown: {} as Record<string, number>,
      riskScore: 0,
    };

    // Calculate breakdowns
    logs.forEach(log => {
      const location = log.locationCountry || 'unknown';
      analytics.locationBreakdown[location] = (analytics.locationBreakdown[location] || 0) + 1;

      analytics.actionBreakdown[log.action] = (analytics.actionBreakdown[log.action] || 0) + 1;
    });

    // Calculate risk score (0-100)
    const riskFactors = [
      Math.min(analytics.failedLogins / Math.max(analytics.successfulLogins, 1) * 50, 30), // Failed login ratio
      Math.min(analytics.suspiciousActivities * 10, 40), // Suspicious activities
      Math.min(Object.keys(analytics.locationBreakdown).length * 5, 20), // Multiple locations
      analytics.mfaUsage === 0 ? 10 : 0, // No MFA usage
    ];

    analytics.riskScore = Math.min(Math.round(riskFactors.reduce((sum, factor) => sum + factor, 0)), 100);

    return analytics;
  }

  /**
   * Detect anomalies in user behavior
   */
  async detectAnomalies(userId: string): Promise<{
    anomalies: Array<{
      type: string;
      description: string;
      severity: AuditSeverity;
      confidence: number;
    }>;
  }> {
    const recentLogs = await this.auditRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    const anomalies: Array<{
      type: string;
      description: string;
      severity: AuditSeverity;
      confidence: number;
    }> = [];

    // Check for unusual login patterns
    const loginLogs = recentLogs.filter(l => l.action === AuditAction.LOGIN_SUCCESS);
    const uniqueLocations = new Set(loginLogs.map(l => l.locationCountry));
    const uniqueIPs = new Set(loginLogs.map(l => l.ipAddress));

    if (uniqueLocations.size > 3) {
      anomalies.push({
        type: 'unusual_locations',
        description: `Login attempts from ${uniqueLocations.size} different countries`,
        severity: AuditSeverity.HIGH,
        confidence: Math.min(uniqueLocations.size * 20, 90),
      });
    }

    if (uniqueIPs.size > 5) {
      anomalies.push({
        type: 'unusual_ip_addresses',
        description: `Login attempts from ${uniqueIPs.size} different IP addresses`,
        severity: AuditSeverity.MEDIUM,
        confidence: Math.min(uniqueIPs.size * 10, 80),
      });
    }

    // Check for failed login spikes
    const failedLogins = recentLogs.filter(l => l.action === AuditAction.LOGIN_FAILED);
    const recentFailedLogins = failedLogins.filter(l => 
      l.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    if (recentFailedLogins.length > 10) {
      anomalies.push({
        type: 'failed_login_spike',
        description: `${recentFailedLogins.length} failed login attempts in the last 24 hours`,
        severity: AuditSeverity.HIGH,
        confidence: Math.min(recentFailedLogins.length * 5, 95),
      });
    }

    return { anomalies };
  }

  /**
   * Clean up old audit logs
   */
  async cleanupOldLogs(retentionDays: number = 365): Promise<{ deleted: number }> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    
    const result = await this.auditRepository.delete({
      createdAt: { $lt: cutoffDate } as any,
    });

    return { deleted: result.affected || 0 };
  }
}