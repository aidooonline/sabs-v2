import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { EnhancedAuthService } from '../services/enhanced-auth.service';
import { MfaService } from '../services/mfa.service';
import { SessionService } from '../services/session.service';
import { AuditService } from '../services/audit.service';
import {
  EnhancedLoginDto,
  EnableMfaDto,
  VerifyMfaSetupDto,
  VerifyMfaDto,
  DisableMfaDto,
  SessionFilterDto,
  InvalidateSessionDto,
  ReportSuspiciousActivityDto,
  SecuritySettingsDto,
} from '../dto/enhanced-auth.dto';
import { RefreshTokenDto } from '../dto/auth.dto';
import { AuthUser } from '../interfaces/jwt-payload.interface';

@ApiTags('Enhanced Authentication')
@Controller('auth')
export class EnhancedAuthController {
  constructor(
    private readonly enhancedAuthService: EnhancedAuthService,
    private readonly mfaService: MfaService,
    private readonly sessionService: SessionService,
    private readonly auditService: AuditService,
  ) {}

  // ===================
  // Authentication Endpoints
  // ===================

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enhanced login with MFA and device tracking' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async enhancedLogin(
    @Body() loginDto: EnhancedLoginDto,
    @Req() request: Request,
  ) {
    return this.enhancedAuthService.enhancedLogin(loginDto, request);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token with session validation' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async enhancedRefreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() request: Request,
  ) {
    return this.enhancedAuthService.enhancedRefreshToken(
      refreshTokenDto.refreshToken,
      request,
    );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enhanced logout with session cleanup' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async enhancedLogout(
    @Req() request: Request,
    @Query('all') logoutAll?: boolean,
  ) {
    const token = request.headers.authorization?.replace('Bearer ', '') || '';
    return this.enhancedAuthService.enhancedLogout(token, request, logoutAll);
  }

  // ===================
  // MFA Endpoints
  // ===================

  @Post('mfa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize MFA setup' })
  @ApiResponse({ status: 200, description: 'MFA setup initiated' })
  async setupMfa(
    @CurrentUser() user: AuthUser,
    @Body() enableMfaDto: EnableMfaDto,
  ) {
    return this.mfaService.setupMfa(user.id, enableMfaDto);
  }

  @Post('mfa/verify-setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify MFA setup' })
  @ApiResponse({ status: 200, description: 'MFA enabled successfully' })
  async verifyMfaSetup(
    @CurrentUser() user: AuthUser,
    @Body() verifyDto: VerifyMfaSetupDto,
  ) {
    return this.mfaService.verifyMfaSetup(user.id, verifyDto);
  }

  @Get('mfa/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get MFA status' })
  @ApiResponse({ status: 200, description: 'MFA status retrieved' })
  async getMfaStatus(@CurrentUser() user: AuthUser) {
    return this.mfaService.getMfaStatus(user.id);
  }

  @Post('mfa/backup-codes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate new backup codes' })
  @ApiResponse({ status: 200, description: 'New backup codes generated' })
  async generateBackupCodes(@CurrentUser() user: AuthUser) {
    return this.mfaService.generateNewBackupCodes(user.id);
  }

  @Delete('mfa')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable MFA' })
  @ApiResponse({ status: 200, description: 'MFA disabled successfully' })
  async disableMfa(
    @CurrentUser() user: AuthUser,
    @Body() disableDto: DisableMfaDto,
  ) {
    return this.mfaService.disableMfa(user.id, disableDto);
  }

  // ===================
  // Session Management Endpoints
  // ===================

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user sessions' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  async getUserSessions(
    @CurrentUser() user: AuthUser,
    @Query() filterDto: SessionFilterDto,
  ) {
    return this.sessionService.getUserSessions(user.id, filterDto);
  }

  @Delete('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invalidate specific sessions' })
  @ApiResponse({ status: 200, description: 'Sessions invalidated successfully' })
  async invalidateSessions(
    @CurrentUser() user: AuthUser,
    @Body() invalidateDto: InvalidateSessionDto,
  ) {
    return this.sessionService.invalidateSessions(user.id, invalidateDto.sessionIds);
  }

  @Get('sessions/analytics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get session security analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getSessionAnalytics(@CurrentUser() user: AuthUser) {
    return this.sessionService.getSessionAnalytics(user.id);
  }

  @Get('sessions/suspicious-activity')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detect suspicious session activity' })
  @ApiResponse({ status: 200, description: 'Suspicious activity analysis completed' })
  async detectSuspiciousActivity(@CurrentUser() user: AuthUser) {
    return this.sessionService.detectSuspiciousActivity(user.id);
  }

  // ===================
  // Security & Audit Endpoints
  // ===================

  @Get('audit-logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  async getAuditLogs(
    @CurrentUser() user: AuthUser,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    return this.auditService.getUserAuditLogs(user.id, limit, offset);
  }

  @Get('security/analytics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get security analytics' })
  @ApiResponse({ status: 200, description: 'Security analytics retrieved successfully' })
  async getSecurityAnalytics(
    @CurrentUser() user: AuthUser,
    @Query('days') days: number = 30,
  ) {
    return this.auditService.getSecurityAnalytics(user.id, days);
  }

  @Get('security/anomalies')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detect security anomalies' })
  @ApiResponse({ status: 200, description: 'Anomaly detection completed' })
  async detectAnomalies(@CurrentUser() user: AuthUser) {
    return this.auditService.detectAnomalies(user.id);
  }

  @Post('security/report-suspicious')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Report suspicious activity' })
  @ApiResponse({ status: 200, description: 'Suspicious activity reported' })
  async reportSuspiciousActivity(
    @CurrentUser() user: AuthUser,
    @Body() reportDto: ReportSuspiciousActivityDto,
    @Req() request: Request,
  ) {
    const ipAddress = request.ip || '127.0.0.1';
    const userAgent = request.headers['user-agent'] || '';

    await this.auditService.logSuspiciousActivity(
      {
        userId: user.id,
        ipAddress,
        userAgent,
        metadata: {
          type: reportDto.activityType,
          description: reportDto.description,
          ...reportDto.metadata,
        },
      },
      reportDto.description,
    );

    return { message: 'Suspicious activity reported successfully' };
  }

  // ===================
  // Device Management Endpoints
  // ===================

  @Get('devices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user devices from sessions' })
  @ApiResponse({ status: 200, description: 'Devices retrieved successfully' })
  async getUserDevices(@CurrentUser() user: AuthUser) {
    const sessions = await this.sessionService.getUserSessions(user.id, { 
      activeOnly: true 
    });
    
    const devices = sessions.sessions.reduce((acc, session) => {
      const existing = acc.find(d => d.fingerprint === session.deviceFingerprint);
      if (!existing) {
        acc.push({
          fingerprint: session.deviceFingerprint,
          name: session.deviceName,
          type: session.deviceType,
          lastSeen: session.lastActivity,
          location: `${session.locationCity}, ${session.locationCountry}`,
          trusted: !session.isSuspicious,
        });
      }
      return acc;
    }, [] as any[]);

    return { devices, total: devices.length };
  }

  // ===================
  // Admin Endpoints (Super Admin Only)
  // ===================

  @Get('admin/security/overview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get platform-wide security overview (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Security overview retrieved' })
  async getSecurityOverview(@CurrentUser() user: AuthUser) {
    // TODO: Add role check for super admin
    return this.auditService.getSecurityAnalytics(undefined, 30);
  }

  @Post('admin/sessions/cleanup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cleanup expired sessions (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Sessions cleaned up' })
  async cleanupExpiredSessions(@CurrentUser() user: AuthUser) {
    // TODO: Add role check for super admin
    return this.sessionService.cleanupExpiredSessions();
  }

  @Post('admin/audit-logs/cleanup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cleanup old audit logs (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Audit logs cleaned up' })
  async cleanupAuditLogs(
    @CurrentUser() user: AuthUser,
    @Query('retentionDays') retentionDays: number = 365,
  ) {
    // TODO: Add role check for super admin
    return this.auditService.cleanupOldLogs(retentionDays);
  }

  // ===================
  // Health Check Endpoints
  // ===================

  @Get('health/auth')
  @ApiOperation({ summary: 'Authentication system health check' })
  @ApiResponse({ status: 200, description: 'Authentication system is healthy' })
  async healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        authentication: 'operational',
        mfa: 'operational',
        sessions: 'operational',
        audit: 'operational',
      },
    };
  }
}