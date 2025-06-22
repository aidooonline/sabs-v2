import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { nanoid } from 'nanoid';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

// Mobile Device Entity
export interface MobileDevice {
  id: string;
  customerId: string;
  deviceId: string;
  deviceName: string;
  deviceType: DeviceType;
  platform: MobilePlatform;
  platformVersion: string;
  appVersion: string;
  deviceModel: string;
  isActive: boolean;
  isTrusted: boolean;
  lastActiveAt: Date;
  registeredAt: Date;
  deviceFingerprint: string;
  pushTokens: string[];
  biometricEnabled: boolean;
  biometricType?: BiometricType;
  locationEnabled: boolean;
  securityFlags: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Mobile Session Entity
export interface MobileSession {
  id: string;
  customerId: string;
  deviceId: string;
  sessionToken: string;
  refreshToken: string;
  accessToken: string;
  expiresAt: Date;
  refreshExpiresAt: Date;
  isActive: boolean;
  ipAddress: string;
  userAgent: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  };
  securityLevel: SecurityLevel;
  authMethods: AuthMethod[];
  lastActivityAt: Date;
  createdAt: Date;
}

// Mobile Onboarding Entity
export interface MobileOnboarding {
  id: string;
  customerId?: string;
  phoneNumber: string;
  email?: string;
  status: OnboardingStatus;
  currentStep: OnboardingStep;
  stepData: Record<string, any>;
  verificationData: {
    phoneVerified: boolean;
    emailVerified: boolean;
    identityVerified: boolean;
    faceVerified: boolean;
    documentsVerified: boolean;
  };
  deviceId: string;
  metadata: Record<string, any>;
  startedAt: Date;
  completedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum DeviceType {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop',
  WATCH = 'watch',
}

export enum MobilePlatform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
  WINDOWS = 'windows',
  MACOS = 'macos',
}

export enum BiometricType {
  FINGERPRINT = 'fingerprint',
  FACE_ID = 'face_id',
  VOICE = 'voice',
  IRIS = 'iris',
  PALM = 'palm',
}

export enum SecurityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  MAXIMUM = 'maximum',
}

export enum AuthMethod {
  PASSWORD = 'password',
  BIOMETRIC = 'biometric',
  SMS_OTP = 'sms_otp',
  EMAIL_OTP = 'email_otp',
  PUSH_NOTIFICATION = 'push_notification',
  HARDWARE_TOKEN = 'hardware_token',
}

export enum OnboardingStatus {
  STARTED = 'started',
  IN_PROGRESS = 'in_progress',
  PENDING_VERIFICATION = 'pending_verification',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export enum OnboardingStep {
  PHONE_VERIFICATION = 'phone_verification',
  EMAIL_VERIFICATION = 'email_verification',
  PERSONAL_INFO = 'personal_info',
  IDENTITY_VERIFICATION = 'identity_verification',
  DOCUMENT_UPLOAD = 'document_upload',
  FACE_VERIFICATION = 'face_verification',
  BIOMETRIC_SETUP = 'biometric_setup',
  PIN_SETUP = 'pin_setup',
  ACCOUNT_CREATION = 'account_creation',
  WELCOME = 'welcome',
}

export interface MobileAuthRequest {
  phoneNumber?: string;
  email?: string;
  password?: string;
  biometricData?: string;
  otpCode?: string;
  deviceInfo: {
    deviceId: string;
    deviceName: string;
    platform: MobilePlatform;
    platformVersion: string;
    appVersion: string;
    deviceModel: string;
    deviceFingerprint: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  ipAddress: string;
  userAgent: string;
}

export interface BiometricSetupRequest {
  customerId: string;
  deviceId: string;
  biometricType: BiometricType;
  biometricTemplate: string;
  publicKey: string;
  deviceSecurityLevel: string;
}

export interface OnboardingRequest {
  phoneNumber: string;
  email?: string;
  deviceInfo: {
    deviceId: string;
    deviceName: string;
    platform: MobilePlatform;
    platformVersion: string;
    appVersion: string;
    deviceModel: string;
    deviceFingerprint: string;
  };
  ipAddress: string;
  userAgent: string;
}

export interface VerificationRequest {
  onboardingId: string;
  stepType: OnboardingStep;
  verificationCode?: string;
  data?: Record<string, any>;
}

@Injectable()
export class MobileAuthService {
  private readonly logger = new Logger(MobileAuthService.name);

  // In-memory storage (would use database in production)
  private devices: Map<string, MobileDevice> = new Map();
  private sessions: Map<string, MobileSession> = new Map();
  private onboardings: Map<string, MobileOnboarding> = new Map();
  private biometricTemplates: Map<string, string> = new Map();

  // Security configurations
  private readonly securityConfig = {
    sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
    refreshDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
    onboardingExpiry: 24 * 60 * 60 * 1000, // 24 hours
    maxLoginAttempts: 5,
    lockoutDuration: 30 * 60 * 1000, // 30 minutes
    otpExpiry: 5 * 60 * 1000, // 5 minutes
    maxDevicesPerUser: 5,
    biometricThreshold: 0.85,
  };

  constructor(
    private eventEmitter: EventEmitter2,

    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {
    this.initializeSecurity();
  }

  // ===== MOBILE AUTHENTICATION =====

  async authenticateWithPassword(request: MobileAuthRequest): Promise<{
    sessionToken: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    customer: any;
    device: MobileDevice;
    securityLevel: SecurityLevel;
  }> {
    this.logger.log(`Password authentication attempt for ${request.phoneNumber || request.email}`);

    try {
      // Check rate limiting
      await this.checkRateLimit(request.deviceInfo.deviceId);

      // Validate credentials (mock implementation)
      const customer = await this.validateCredentials(
        request.phoneNumber || request.email,
        request.password
      );

      if (!customer) {
        await this.recordFailedAttempt(request.deviceInfo.deviceId);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Register or update device
      const device = await this.registerDevice(customer.id, request.deviceInfo, request.ipAddress);

      // Create session
      const session = await this.createSession(customer.id, device.id, request, SecurityLevel.MEDIUM);

      // Record successful login
      await this.recordSuccessfulLogin(customer.id, device.id, [AuthMethod.PASSWORD]);

      // Emit login event
      this.eventEmitter.emit('mobile.login', {
        customerId: customer.id,
        deviceId: device.id,
        sessionId: session.id,
        authMethod: AuthMethod.PASSWORD,
        ipAddress: request.ipAddress,
        location: request.location,
      });

      return {
        sessionToken: session.sessionToken,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresIn: Math.floor((session.expiresAt.getTime() - Date.now()) / 1000),
        customer: this.sanitizeCustomerData(customer),
        device: this.sanitizeDeviceData(device),
        securityLevel: session.securityLevel,
      };

    } catch (error) {
      this.logger.error(`Authentication failed: ${(error as Error).message}`);
      throw error;
    }
  }

  async authenticateWithBiometric(request: MobileAuthRequest): Promise<{
    sessionToken: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    customer: any;
    device: MobileDevice;
    securityLevel: SecurityLevel;
  }> {
    this.logger.log(`Biometric authentication attempt for device ${request.deviceInfo.deviceId}`);

    try {
      // Get device registration
      const device = await this.getDevice(request.deviceInfo.deviceId);
      if (!device || !device.biometricEnabled) {
        throw new UnauthorizedException('Biometric authentication not enabled for this device');
      }

      // Verify biometric data
      const biometricValid = await this.verifyBiometric(
        device.customerId,
        request.deviceInfo.deviceId,
        request.biometricData
      );

      if (!biometricValid) {
        await this.recordFailedAttempt(request.deviceInfo.deviceId);
        throw new UnauthorizedException('Biometric verification failed');
      }

      // Get customer data
      const customer = await this.getCustomer(device.customerId);

      // Create high-security session
      const session = await this.createSession(customer.id, device.id, request, SecurityLevel.HIGH);

      // Record successful login
      await this.recordSuccessfulLogin(customer.id, device.id, [AuthMethod.BIOMETRIC]);

      // Emit login event
      this.eventEmitter.emit('mobile.login', {
        customerId: customer.id,
        deviceId: device.id,
        sessionId: session.id,
        authMethod: AuthMethod.BIOMETRIC,
        ipAddress: request.ipAddress,
        location: request.location,
      });

      return {
        sessionToken: session.sessionToken,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresIn: Math.floor((session.expiresAt.getTime() - Date.now()) / 1000),
        customer: this.sanitizeCustomerData(customer),
        device: this.sanitizeDeviceData(device),
        securityLevel: session.securityLevel,
      };

    } catch (error) {
      this.logger.error(`Biometric authentication failed: ${(error as Error).message}`);
      throw error;
    }
  }

  async refreshSession(refreshToken: string, deviceId: string): Promise<{
    sessionToken: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    this.logger.log(`Refreshing session for device ${deviceId}`);

    try {
      // Find session by refresh token
      const session = Array.from(this.sessions.values()).find(
        s => s.refreshToken === refreshToken && s.deviceId === deviceId && s.isActive
      );

      if (!session || session.refreshExpiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Generate new tokens
      const newSessionToken = this.generateSecureToken();
      const newAccessToken = this.generateSecureToken();
      const newRefreshToken = this.generateSecureToken();

      // Update session
      session.sessionToken = newSessionToken;
      session.accessToken = newAccessToken;
      session.refreshToken = newRefreshToken;
      session.expiresAt = new Date(Date.now() + this.securityConfig.sessionDuration);
      session.refreshExpiresAt = new Date(Date.now() + this.securityConfig.refreshDuration);
      session.lastActivityAt = new Date();

      this.sessions.set(session.id, session);

      // Cache session
      await this.cacheManager.set(`session_${newSessionToken}`, session, 3600);

      return {
        sessionToken: newSessionToken,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: Math.floor((session.expiresAt.getTime() - Date.now()) / 1000),
      };

    } catch (error) {
      this.logger.error(`Session refresh failed: ${(error as Error).message}`);
      throw error;
    }
  }

  // ===== BIOMETRIC MANAGEMENT =====

  async setupBiometric(request: BiometricSetupRequest): Promise<{
    success: boolean;
    biometricId: string;
    securityLevel: SecurityLevel;
  }> {
    this.logger.log(`Setting up biometric for customer ${request.customerId} on device ${request.deviceId}`);

    try {
      // Validate device ownership
      const device = await this.getDevice(request.deviceId);
      if (!device || device.customerId !== request.customerId) {
        throw new UnauthorizedException('Device not registered to customer');
      }

      // Validate biometric template
      if (!this.validateBiometricTemplate(request.biometricTemplate)) {
        throw new BadRequestException('Invalid biometric template');
      }

      // Store encrypted biometric template
      const biometricId = `bio_${nanoid(12)}`;
      const encryptedTemplate = this.encryptBiometricTemplate(request.biometricTemplate);
      
      this.biometricTemplates.set(`${request.customerId}_${request.deviceId}`, encryptedTemplate);

      // Update device with biometric info
      device.biometricEnabled = true;
      device.biometricType = request.biometricType;
      device.securityFlags.push('biometric_enabled');
      device.updatedAt = new Date();

      this.devices.set(device.id, device);

      // Emit biometric setup event
      this.eventEmitter.emit('mobile.biometric_setup', {
        customerId: request.customerId,
        deviceId: request.deviceId,
        biometricType: request.biometricType,
        biometricId,
      });

      return {
        success: true,
        biometricId,
        securityLevel: SecurityLevel.HIGH,
      };

    } catch (error) {
      this.logger.error(`Biometric setup failed: ${(error as Error).message}`);
      throw error;
    }
  }

  async disableBiometric(customerId: string, deviceId: string): Promise<{ success: boolean }> {
    this.logger.log(`Disabling biometric for customer ${customerId} on device ${deviceId}`);

    try {
      // Get device
      const device = await this.getDevice(deviceId);
      if (!device || device.customerId !== customerId) {
        throw new UnauthorizedException('Device not registered to customer');
      }

      // Remove biometric data
      this.biometricTemplates.delete(`${customerId}_${deviceId}`);

      // Update device
      device.biometricEnabled = false;
      device.biometricType = undefined;
      device.securityFlags = device.securityFlags.filter(flag => flag !== 'biometric_enabled');
      device.updatedAt = new Date();

      this.devices.set(device.id, device);

      // Emit biometric disabled event
      this.eventEmitter.emit('mobile.biometric_disabled', {
        customerId,
        deviceId,
      });

      return { success: true };

    } catch (error) {
      this.logger.error(`Biometric disable failed: ${(error as Error).message}`);
      throw error;
    }
  }

  // ===== MOBILE ONBOARDING =====

  async startOnboarding(request: OnboardingRequest): Promise<{
    onboardingId: string;
    currentStep: OnboardingStep;
    expiresAt: Date;
    verificationRequired: boolean;
  }> {
    this.logger.log(`Starting mobile onboarding for ${request.phoneNumber}`);

    try {
      // Check if customer already exists
      const existingCustomer = await this.findCustomerByPhone(request.phoneNumber);
      if (existingCustomer) {
        throw new BadRequestException('Customer already exists. Please use login instead.');
      }

      // Create onboarding record
      const onboardingId = `onb_${nanoid(8)}`;
      const expiresAt = new Date(Date.now() + this.securityConfig.onboardingExpiry);

      const onboarding: MobileOnboarding = {
        id: onboardingId,
        phoneNumber: request.phoneNumber,
        email: request.email,
        status: OnboardingStatus.STARTED,
        currentStep: OnboardingStep.PHONE_VERIFICATION,
        stepData: {},
        verificationData: {
          phoneVerified: false,
          emailVerified: false,
          identityVerified: false,
          faceVerified: false,
          documentsVerified: false,
        },
        deviceId: request.deviceInfo.deviceId,
        metadata: {
          deviceInfo: request.deviceInfo,
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
        },
        startedAt: new Date(),
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.onboardings.set(onboardingId, onboarding);

      // Send phone verification
      await this.sendPhoneVerification(request.phoneNumber, onboardingId);

      // Emit onboarding started event
      this.eventEmitter.emit('mobile.onboarding_started', {
        onboardingId,
        phoneNumber: request.phoneNumber,
        deviceId: request.deviceInfo.deviceId,
      });

      return {
        onboardingId,
        currentStep: OnboardingStep.PHONE_VERIFICATION,
        expiresAt,
        verificationRequired: true,
      };

    } catch (error) {
      this.logger.error(`Onboarding start failed: ${(error as Error).message}`);
      throw error;
    }
  }

  async verifyOnboardingStep(request: VerificationRequest): Promise<{
    success: boolean;
    nextStep?: OnboardingStep;
    completed: boolean;
    customerId?: string;
  }> {
    this.logger.log(`Verifying onboarding step ${request.stepType} for ${request.onboardingId}`);

    try {
      // Get onboarding record
      const onboarding = this.onboardings.get(request.onboardingId);
      if (!onboarding || onboarding.expiresAt < new Date()) {
        throw new BadRequestException('Onboarding session expired or not found');
      }

      if (onboarding.currentStep !== request.stepType) {
        throw new BadRequestException('Invalid step for current onboarding state');
      }

      let success = false;
      let nextStep: OnboardingStep;

      switch (request.stepType) {
        case OnboardingStep.PHONE_VERIFICATION:
          success = await this.verifyPhone(onboarding.phoneNumber, request.verificationCode);
          if (success) {
            onboarding.verificationData.phoneVerified = true;
            nextStep = onboarding.email ? OnboardingStep.EMAIL_VERIFICATION : OnboardingStep.PERSONAL_INFO;
          }
          break;

        case OnboardingStep.EMAIL_VERIFICATION:
          success = await this.verifyEmail(onboarding.email, request.verificationCode);
          if (success) {
            onboarding.verificationData.emailVerified = true;
            nextStep = OnboardingStep.PERSONAL_INFO;
          }
          break;

        case OnboardingStep.PERSONAL_INFO:
          success = await this.validatePersonalInfo(request.data);
          if (success) {
            onboarding.stepData.personalInfo = request.data;
            nextStep = OnboardingStep.IDENTITY_VERIFICATION;
          }
          break;

        case OnboardingStep.IDENTITY_VERIFICATION:
          success = await this.verifyIdentity(request.data);
          if (success) {
            onboarding.verificationData.identityVerified = true;
            onboarding.stepData.identityData = request.data;
            nextStep = OnboardingStep.DOCUMENT_UPLOAD;
          }
          break;

        case OnboardingStep.DOCUMENT_UPLOAD:
          success = await this.validateDocuments(request.data);
          if (success) {
            onboarding.verificationData.documentsVerified = true;
            onboarding.stepData.documents = request.data;
            nextStep = OnboardingStep.FACE_VERIFICATION;
          }
          break;

        case OnboardingStep.FACE_VERIFICATION:
          success = await this.verifyFace(request.data);
          if (success) {
            onboarding.verificationData.faceVerified = true;
            onboarding.stepData.faceData = request.data;
            nextStep = OnboardingStep.BIOMETRIC_SETUP;
          }
          break;

        case OnboardingStep.BIOMETRIC_SETUP:
          success = true; // Optional step
          if (request.data?.biometricData) {
            onboarding.stepData.biometricData = request.data.biometricData;
          }
          nextStep = OnboardingStep.PIN_SETUP;
          break;

        case OnboardingStep.PIN_SETUP:
          success = await this.validatePin(request.data?.pin);
          if (success) {
            onboarding.stepData.pin = await this.hashPin(request.data.pin);
            nextStep = OnboardingStep.ACCOUNT_CREATION;
          }
          break;

        case OnboardingStep.ACCOUNT_CREATION:
          const customerId = await this.createCustomerAccount(onboarding);
          if (customerId) {
            success = true;
            onboarding.customerId = customerId;
            onboarding.status = OnboardingStatus.COMPLETED;
            onboarding.completedAt = new Date();
            nextStep = OnboardingStep.WELCOME;
          }
          break;

        default:
          throw new BadRequestException('Invalid verification step');
      }

      if (success && nextStep) {
        onboarding.currentStep = nextStep;
        onboarding.updatedAt = new Date();
        this.onboardings.set(request.onboardingId, onboarding);
      }

      const completed = onboarding.status === OnboardingStatus.COMPLETED;

      if (completed) {
        // Emit onboarding completed event
        this.eventEmitter.emit('mobile.onboarding_completed', {
          onboardingId: request.onboardingId,
          customerId: onboarding.customerId,
          phoneNumber: onboarding.phoneNumber,
          deviceId: onboarding.deviceId,
        });
      }

      return {
        success,
        nextStep: completed ? undefined : nextStep,
        completed,
        customerId: onboarding.customerId,
      };

    } catch (error) {
      this.logger.error(`Onboarding verification failed: ${(error as Error).message}`);
      throw error;
    }
  }

  // ===== DEVICE MANAGEMENT =====

  async getCustomerDevices(customerId: string): Promise<MobileDevice[]> {
    const devices = Array.from(this.devices.values()).filter(
      device => device.customerId === customerId && device.isActive
    );

    return devices.map(device => this.sanitizeDeviceData(device));
  }

  async removeDevice(customerId: string, deviceId: string): Promise<{ success: boolean }> {
    this.logger.log(`Removing device ${deviceId} for customer ${customerId}`);

    try {
      const device = await this.getDevice(deviceId);
      if (!device || device.customerId !== customerId) {
        throw new UnauthorizedException('Device not found or not owned by customer');
      }

      // Deactivate device
      device.isActive = false;
      device.updatedAt = new Date();
      this.devices.set(device.id, device);

      // Invalidate all sessions for this device
      await this.invalidateDeviceSessions(deviceId);

      // Remove biometric data
      this.biometricTemplates.delete(`${customerId}_${deviceId}`);

      // Emit device removed event
      this.eventEmitter.emit('mobile.device_removed', {
        customerId,
        deviceId,
      });

      return { success: true };

    } catch (error) {
      this.logger.error(`Device removal failed: ${(error as Error).message}`);
      throw error;
    }
  }

  // ===== SESSION MANAGEMENT =====

  async validateSession(sessionToken: string): Promise<{
    valid: boolean;
    session?: MobileSession;
    customer?: any;
    device?: MobileDevice;
  }> {
    try {
      // Try cache first
      const cachedSession = await this.cacheManager.get<MobileSession>(`session_${sessionToken}`);
      let session = cachedSession;

      if (!session) {
        // Find in memory storage
        session = Array.from(this.sessions.values()).find(
          s => s.sessionToken === sessionToken && s.isActive
        );
      }

      if (!session || session.expiresAt < new Date()) {
        return { valid: false };
      }

      // Update last activity
      session.lastActivityAt = new Date();
      this.sessions.set(session.id, session);

      // Get customer and device data
      const customer = await this.getCustomer(session.customerId);
      const device = await this.getDevice(session.deviceId);

      return {
        valid: true,
        session,
        customer: this.sanitizeCustomerData(customer),
        device: this.sanitizeDeviceData(device),
      };

    } catch (error) {
      this.logger.error(`Session validation failed: ${(error as Error).message}`);
      return { valid: false };
    }
  }

  async logout(sessionToken: string): Promise<{ success: boolean }> {
    this.logger.log(`Logging out session ${sessionToken}`);

    try {
      const session = Array.from(this.sessions.values()).find(
        s => s.sessionToken === sessionToken && s.isActive
      );

      if (session) {
        // Deactivate session
        session.isActive = false;
        this.sessions.set(session.id, session);

        // Remove from cache
        await this.cacheManager.del(`session_${sessionToken}`);

        // Emit logout event
        this.eventEmitter.emit('mobile.logout', {
          customerId: session.customerId,
          deviceId: session.deviceId,
          sessionId: session.id,
        });
      }

      return { success: true };

    } catch (error) {
      this.logger.error(`Logout failed: ${(error as Error).message}`);
      throw error;
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  private async registerDevice(
    customerId: string,
    deviceInfo: any,
    ipAddress: string
  ): Promise<MobileDevice> {
    // Check if device already exists
    let device = Array.from(this.devices.values()).find(
      d => d.deviceId === deviceInfo.deviceId && d.customerId === customerId
    );

    if (device) {
      // Update existing device
      device.deviceName = deviceInfo.deviceName;
      device.platformVersion = deviceInfo.platformVersion;
      device.appVersion = deviceInfo.appVersion;
      device.lastActiveAt = new Date();
      device.updatedAt = new Date();
    } else {
      // Create new device
      const deviceId = `dev_${nanoid(8)}`;
      device = {
        id: deviceId,
        customerId,
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        deviceType: DeviceType.MOBILE,
        platform: deviceInfo.platform,
        platformVersion: deviceInfo.platformVersion,
        appVersion: deviceInfo.appVersion,
        deviceModel: deviceInfo.deviceModel,
        isActive: true,
        isTrusted: false,
        lastActiveAt: new Date(),
        registeredAt: new Date(),
        deviceFingerprint: deviceInfo.deviceFingerprint,
        pushTokens: [],
        biometricEnabled: false,
        locationEnabled: false,
        securityFlags: [],
        metadata: { ipAddress },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    this.devices.set(device.id, device);
    return device;
  }

  private async createSession(
    customerId: string,
    deviceId: string,
    request: MobileAuthRequest,
    securityLevel: SecurityLevel
  ): Promise<MobileSession> {
    const sessionId = `sess_${nanoid(12)}`;
    const sessionToken = this.generateSecureToken();
    const accessToken = this.generateSecureToken();
    const refreshToken = this.generateSecureToken();

    const session: MobileSession = {
      id: sessionId,
      customerId,
      deviceId,
      sessionToken,
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + this.securityConfig.sessionDuration),
      refreshExpiresAt: new Date(Date.now() + this.securityConfig.refreshDuration),
      isActive: true,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      location: request.location,
      securityLevel,
      authMethods: request.biometricData ? [AuthMethod.BIOMETRIC] : [AuthMethod.PASSWORD],
      lastActivityAt: new Date(),
      createdAt: new Date(),
    };

    this.sessions.set(sessionId, session);

    // Cache session
    await this.cacheManager.set(`session_${sessionToken}`, session, 3600);

    return session;
  }

  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async validateCredentials(identifier: string, password: string): Promise<any> {
    // Mock customer validation
    return {
      id: `cust_${nanoid(8)}`,
      phoneNumber: identifier,
      email: identifier.includes('@') ? identifier : null,
      fullName: 'John Doe',
      isActive: true,
    };
  }

  private async verifyBiometric(customerId: string, deviceId: string, biometricData: string): Promise<boolean> {
    const templateKey = `${customerId}_${deviceId}`;
    const storedTemplate = this.biometricTemplates.get(templateKey);
    
    if (!storedTemplate) {
      return false;
    }

    // Mock biometric verification
    return Math.random() > 0.1; // 90% success rate for demo
  }

  private validateBiometricTemplate(template: string): boolean {
    // Mock template validation
    return template && template.length > 50;
  }

  private encryptBiometricTemplate(template: string): string {
    // Mock encryption
    return Buffer.from(template).toString('base64');
  }

  private async getDevice(deviceId: string): Promise<MobileDevice | null> {
    return Array.from(this.devices.values()).find(d => d.deviceId === deviceId) || null;
  }

  private async getCustomer(customerId: string): Promise<any> {
    // Mock customer retrieval
    return {
      id: customerId,
      phoneNumber: '+233123456789',
      fullName: 'John Doe',
      email: 'john@example.com',
      isActive: true,
    };
  }

  private async sendPhoneVerification(phoneNumber: string, onboardingId: string): Promise<void> {
    // Mock SMS sending
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await this.cacheManager.set(`otp_${onboardingId}`, otpCode, 300); // 5 minutes
    this.logger.log(`OTP sent to ${phoneNumber}: ${otpCode}`);
  }

  private async verifyPhone(phoneNumber: string, code: string): Promise<boolean> {
    // Mock verification
    return code === '123456' || Math.random() > 0.3; // Accept test code or 70% success
  }

  private async verifyEmail(email: string, code: string): Promise<boolean> {
    // Mock verification
    return code === '123456' || Math.random() > 0.3;
  }

  private async validatePersonalInfo(data: any): Promise<boolean> {
    return data && data.firstName && data.lastName && data.dateOfBirth;
  }

  private async verifyIdentity(data: any): Promise<boolean> {
    return data && data.nationalId;
  }

  private async validateDocuments(data: any): Promise<boolean> {
    return data && data.documents && data.documents.length > 0;
  }

  private async verifyFace(data: any): Promise<boolean> {
    return data && data.faceImage;
  }

  private async validatePin(pin: string): Promise<boolean> {
    return pin && pin.length >= 4 && /^\d+$/.test(pin);
  }

  private async hashPin(pin: string): Promise<string> {
    return bcrypt.hash(pin, 10);
  }

  private async createCustomerAccount(onboarding: MobileOnboarding): Promise<string> {
    // Mock customer creation
    const customerId = `cust_${nanoid(8)}`;
    this.logger.log(`Created customer account: ${customerId}`);
    return customerId;
  }

  private async findCustomerByPhone(phoneNumber: string): Promise<any> {
    // Mock customer lookup
    return null; // No existing customer for demo
  }

  private async checkRateLimit(deviceId: string): Promise<void> {
    const key = `rate_limit_${deviceId}`;
    const attempts = await this.cacheManager.get<number>(key) || 0;
    
    if (attempts >= this.securityConfig.maxLoginAttempts) {
      throw new UnauthorizedException('Too many login attempts. Please try again later.');
    }
  }

  private async recordFailedAttempt(deviceId: string): Promise<void> {
    const key = `rate_limit_${deviceId}`;
    const attempts = await this.cacheManager.get<number>(key) || 0;
    await this.cacheManager.set(key, attempts + 1, this.securityConfig.lockoutDuration / 1000);
  }

  private async recordSuccessfulLogin(customerId: string, deviceId: string, authMethods: AuthMethod[]): Promise<void> {
    const key = `rate_limit_${deviceId}`;
    await this.cacheManager.del(key); // Clear failed attempts
  }

  private async invalidateDeviceSessions(deviceId: string): Promise<void> {
    const deviceSessions = Array.from(this.sessions.values()).filter(
      s => s.deviceId === deviceId && s.isActive
    );

    for (const session of deviceSessions) {
      session.isActive = false;
      this.sessions.set(session.id, session);
      await this.cacheManager.del(`session_${session.sessionToken}`);
    }
  }

  private sanitizeCustomerData(customer: any): any {
    if (!customer) return null;
    
    return {
      id: customer.id,
      phoneNumber: customer.phoneNumber,
      email: customer.email,
      fullName: customer.fullName,
      isActive: customer.isActive,
    };
  }

  private sanitizeDeviceData(device: MobileDevice): any {
    if (!device) return null;
    
    return {
      id: device.id,
      deviceName: device.deviceName,
      deviceType: device.deviceType,
      platform: device.platform,
      biometricEnabled: device.biometricEnabled,
      biometricType: device.biometricType,
      isTrusted: device.isTrusted,
      lastActiveAt: device.lastActiveAt,
      registeredAt: device.registeredAt,
    };
  }

  private initializeSecurity(): void {
    this.logger.log('Mobile authentication service initialized with security configurations');
  }
}