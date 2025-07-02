import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSession } from '../entities/user-session.entity';
import { SessionFilterDto, InvalidateSessionDto } from '../dto/enhanced-auth.dto';
import UAParser from 'ua-parser-js';
import * as geoip from 'geoip-lite';
import { v4 as uuidv4 } from 'uuid';

export interface DeviceInfo {
  fingerprint: string;
  name?: string;
  type: 'mobile' | 'desktop' | 'tablet';
  browser?: string;
  os?: string;
  userAgent: string;
}

export interface LocationInfo {
  ip: string;
  country?: string;
  city?: string;
  coordinates?: string;
}

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
  ) {}

  /**
   * Create a new user session
   */
  async createSession(
    userId: string,
    accessToken: string,
    refreshToken: string,
    deviceInfo: DeviceInfo,
    locationInfo: LocationInfo,
    expiresIn: number = 24 * 60 * 60 // 24 hours in seconds
  ): Promise<UserSession> {
    const session = this.sessionRepository.create({
      userId,
      accessToken,
      refreshToken,
      deviceFingerprint: deviceInfo.fingerprint,
      deviceName: deviceInfo.name,
      deviceType: deviceInfo.type,
      browserInfo: deviceInfo.browser,
      userAgent: deviceInfo.userAgent,
      ipAddress: locationInfo.ip,
      locationCountry: locationInfo.country,
      locationCity: locationInfo.city,
      locationCoordinates: locationInfo.coordinates,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      lastActivity: new Date(),
    });

    return await this.sessionRepository.save(session);
  }

  /**
   * Get session by refresh token
   */
  async getSessionByRefreshToken(refreshToken: string): Promise<UserSession | null> {
    return await this.sessionRepository.findOne({
      where: { refreshToken, isActive: true },
      relations: ['user'],
    });
  }

  /**
   * Get session by access token
   */
  async getSessionByAccessToken(accessToken: string): Promise<UserSession | null> {
    return await this.sessionRepository.findOne({
      where: { accessToken, isActive: true },
      relations: ['user'],
    });
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    await this.sessionRepository.update(sessionId, {
      lastActivity: new Date(),
    });
  }

  /**
   * Get all user sessions
   */
  async getUserSessions(userId: string, filterDto?: SessionFilterDto): Promise<{
    sessions: UserSession[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .where('session.userId = :userId', { userId });

    if (filterDto?.activeOnly) {
      queryBuilder.andWhere('session.isActive = true');
      queryBuilder.andWhere('session.expiresAt > :now', { now: new Date() });
    }

    if (filterDto?.deviceType) {
      queryBuilder.andWhere('session.deviceType = :deviceType', { 
        deviceType: filterDto.deviceType 
      });
    }

    const total = await queryBuilder.getCount();

    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 10;
    const offset = (page - 1) * limit;

    const sessions = await queryBuilder
      .orderBy('session.lastActivity', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();

    return { sessions, total, page, limit };
  }

  /**
   * Invalidate specific sessions
   */
  async invalidateSessions(userId: string, sessionIds: string[]): Promise<{ invalidated: number }> {
    const result = await this.sessionRepository.update(
      { userId, id: { $in: sessionIds } as any },
      { isActive: false }
    );

    return { invalidated: result.affected || 0 };
  }

  /**
   * Invalidate all user sessions except current
   */
  async invalidateAllSessionsExceptCurrent(userId: string, currentSessionId: string): Promise<{ invalidated: number }> {
    const result = await this.sessionRepository.update(
      { userId, id: { $ne: currentSessionId } as any },
      { isActive: false }
    );

    return { invalidated: result.affected || 0 };
  }

  /**
   * Mark session as suspicious
   */
  async markSessionSuspicious(sessionId: string, reason?: string): Promise<void> {
    await this.sessionRepository.update(sessionId, {
      isSuspicious: true,
      isActive: false,
    });
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<{ cleaned: number }> {
    const result = await this.sessionRepository.update(
      { expiresAt: { $lt: new Date() } as any },
      { isActive: false }
    );

    return { cleaned: result.affected || 0 };
  }

  /**
   * Get session security analytics
   */
  async getSessionAnalytics(userId: string): Promise<{
    totalSessions: number;
    activeSessions: number;
    suspiciousSessions: number;
    deviceBreakdown: Record<string, number>;
    locationBreakdown: Record<string, number>;
    recentSessions: UserSession[];
  }> {
    const sessions = await this.sessionRepository.find({ where: { userId } });

    const analytics = {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.isValid).length,
      suspiciousSessions: sessions.filter(s => s.isSuspicious).length,
      deviceBreakdown: {} as Record<string, number>,
      locationBreakdown: {} as Record<string, number>,
      recentSessions: sessions
        .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
        .slice(0, 10),
    };

    // Device breakdown
    sessions.forEach(session => {
      const device = session.deviceType || 'unknown';
      analytics.deviceBreakdown[device] = (analytics.deviceBreakdown[device] || 0) + 1;
    });

    // Location breakdown
    sessions.forEach(session => {
      const location = session.locationCountry || 'unknown';
      analytics.locationBreakdown[location] = (analytics.locationBreakdown[location] || 0) + 1;
    });

    return analytics;
  }

  /**
   * Detect suspicious session activity
   */
  async detectSuspiciousActivity(userId: string): Promise<{
    suspiciousActivities: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      sessions: string[];
    }>;
  }> {
    const sessions = await this.sessionRepository.find({ 
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });

    const suspiciousActivities: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      sessions: string[];
    }> = [];

    // Check for multiple simultaneous sessions from different locations
    const activeLocationSessions = sessions.filter(s => s.locationCountry);
    const locationGroups = this.groupBy(activeLocationSessions, 'locationCountry');
    
    if (Object.keys(locationGroups).length > 2) {
      suspiciousActivities.push({
        type: 'multiple_locations',
        description: `Active sessions detected from ${Object.keys(locationGroups).length} different countries`,
        severity: 'high',
        sessions: activeLocationSessions.map(s => s.id),
      });
    }

    // Check for unusual device activity
    const deviceGroups = this.groupBy(sessions, 'deviceType');
    const newDevices = sessions.filter(s => 
      s.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    );

    if (newDevices.length > 3) {
      suspiciousActivities.push({
        type: 'multiple_new_devices',
        description: `${newDevices.length} new devices registered in the last 24 hours`,
        severity: 'medium',
        sessions: newDevices.map(s => s.id),
      });
    }

    return { suspiciousActivities };
  }

  /**
   * Parse device information from user agent
   */
  parseDeviceInfo(userAgent: string, deviceFingerprint: string, deviceName?: string): DeviceInfo {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop';
    
    if (result.device.type === 'mobile') {
      deviceType = 'mobile';
    } else if (result.device.type === 'tablet') {
      deviceType = 'tablet';
    }

    return {
      fingerprint: deviceFingerprint,
      name: deviceName || `${result.browser.name} on ${result.os.name}`,
      type: deviceType,
      browser: `${result.browser.name} ${result.browser.version}`,
      os: `${result.os.name} ${result.os.version}`,
      userAgent,
    };
  }

  /**
   * Parse location information from IP address
   */
  parseLocationInfo(ipAddress: string): LocationInfo {
    const geo = geoip.lookup(ipAddress);

    return {
      ip: ipAddress,
      country: geo?.country,
      city: geo?.city,
      coordinates: geo ? `${geo.ll[0]},${geo.ll[1]}` : undefined,
    };
  }

  // Private helper methods
  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }
}