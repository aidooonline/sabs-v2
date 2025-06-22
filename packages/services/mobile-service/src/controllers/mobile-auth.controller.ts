import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ValidationPipe,
  BadRequestException,
  UnauthorizedException,
  Logger,
  Headers,
  Ip,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';

import {
  MobileAuthService,
  MobileDevice,
  MobileSession,
  MobileOnboarding,
  DeviceType,
  MobilePlatform,
  BiometricType,
  SecurityLevel,
  AuthMethod,
  OnboardingStatus,
  OnboardingStep,
  MobileAuthRequest,
  BiometricSetupRequest,
  OnboardingRequest,
  VerificationRequest,
} from '../services/mobile-auth.service';

// ===== DTOs =====

export class LoginWithPasswordDto {
  phoneNumber?: string;
  email?: string;
  password: string;
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
}

export class LoginWithBiometricDto {
  biometricData: string;
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
}

export class RefreshSessionDto {
  refreshToken: string;
  deviceId: string;
}

export class SetupBiometricDto {
  biometricType: BiometricType;
  biometricTemplate: string;
  publicKey: string;
  deviceSecurityLevel: string;
}

export class StartOnboardingDto {
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
}

export class VerifyStepDto {
  stepType: OnboardingStep;
  verificationCode?: string;
  data?: Record<string, any>;
}

export class PersonalInfoDto {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  nationality: string;
  occupation?: string;
  address: {
    street: string;
    city: string;
    region: string;
    postalCode?: string;
    country: string;
  };
}

export class IdentityVerificationDto {
  nationalId: string;
  idType: 'national_id' | 'passport' | 'drivers_license';
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
}

export class DocumentUploadDto {
  documents: Array<{
    type: 'id_front' | 'id_back' | 'selfie' | 'proof_of_address' | 'other';
    fileName: string;
    fileData: string; // base64 encoded
    fileSize: number;
    mimeType: string;
  }>;
}

export class FaceVerificationDto {
  faceImage: string; // base64 encoded
  livenessData?: {
    blinkDetected: boolean;
    headMovement: boolean;
    timestamp: number;
  };
}

export class PinSetupDto {
  pin: string;
  confirmPin: string;
}

// ===== RESPONSE DTOs =====

export class LoginResponseDto {
  sessionToken: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  customer: {
    id: string;
    phoneNumber: string;
    email?: string;
    fullName: string;
    isActive: boolean;
  };
  device: {
    id: string;
    deviceName: string;
    deviceType: DeviceType;
    platform: MobilePlatform;
    biometricEnabled: boolean;
    biometricType?: BiometricType;
    isTrusted: boolean;
    lastActiveAt: Date;
    registeredAt: Date;
  };
  securityLevel: SecurityLevel;
}

export class OnboardingResponseDto {
  onboardingId: string;
  currentStep: OnboardingStep;
  expiresAt: Date;
  verificationRequired: boolean;
}

export class StepVerificationResponseDto {
  success: boolean;
  nextStep?: OnboardingStep;
  completed: boolean;
  customerId?: string;
  message?: string;
}

export class BiometricSetupResponseDto {
  success: boolean;
  biometricId: string;
  securityLevel: SecurityLevel;
}

export class DeviceResponseDto {
  id: string;
  deviceName: string;
  deviceType: DeviceType;
  platform: MobilePlatform;
  biometricEnabled: boolean;
  biometricType?: BiometricType;
  isTrusted: boolean;
  lastActiveAt: Date;
  registeredAt: Date;
}

@ApiTags('Mobile Authentication')
@Controller('mobile-auth')
export class MobileAuthController {
  private readonly logger = new Logger(MobileAuthController.name);

  constructor(private readonly mobileAuthService: MobileAuthService) {}

  // ===== AUTHENTICATION ENDPOINTS =====

  @Post('login/password')
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiHeader({ name: 'User-Agent', description: 'Device user agent' })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  async loginWithPassword(
    @Body(ValidationPipe) loginDto: LoginWithPasswordDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
  ): Promise<LoginResponseDto> {
    this.logger.log(`Password login attempt from ${ipAddress} for ${loginDto.phoneNumber || loginDto.email}`);

    const request: MobileAuthRequest = {
      phoneNumber: loginDto.phoneNumber,
      email: loginDto.email,
      password: loginDto.password,
      deviceInfo: loginDto.deviceInfo,
      location: loginDto.location,
      ipAddress,
      userAgent,
    };

    return await this.mobileAuthService.authenticateWithPassword(request);
  }

  @Post('login/biometric')
  @ApiOperation({ summary: 'Login with biometric authentication' })
  @ApiHeader({ name: 'User-Agent', description: 'Device user agent' })
  @ApiResponse({ status: 200, description: 'Biometric login successful', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Biometric verification failed' })
  async loginWithBiometric(
    @Body(ValidationPipe) loginDto: LoginWithBiometricDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
  ): Promise<LoginResponseDto> {
    this.logger.log(`Biometric login attempt from ${ipAddress} for device ${loginDto.deviceInfo.deviceId}`);

    const request: MobileAuthRequest = {
      biometricData: loginDto.biometricData,
      deviceInfo: loginDto.deviceInfo,
      location: loginDto.location,
      ipAddress,
      userAgent,
    };

    return await this.mobileAuthService.authenticateWithBiometric(request);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh authentication session' })
  @ApiResponse({ status: 200, description: 'Session refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshSession(
    @Body(ValidationPipe) refreshDto: RefreshSessionDto,
  ): Promise<{
    sessionToken: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    this.logger.log(`Session refresh for device ${refreshDto.deviceId}`);

    return await this.mobileAuthService.refreshSession(refreshDto.refreshToken, refreshDto.deviceId);
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from current session' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @Headers('authorization') authorization: string,
  ): Promise<{ success: boolean; message: string }> {
    const sessionToken = this.extractSessionToken(authorization);
    
    const result = await this.mobileAuthService.logout(sessionToken);
    
    return {
      success: result.success,
      message: 'Logout successful',
    };
  }

  @Get('session/validate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate current session' })
  @ApiResponse({ status: 200, description: 'Session is valid' })
  @ApiResponse({ status: 401, description: 'Session is invalid' })
  async validateSession(
    @Headers('authorization') authorization: string,
  ): Promise<{
    valid: boolean;
    customer?: any;
    device?: any;
    session?: any;
  }> {
    const sessionToken = this.extractSessionToken(authorization);
    
    return await this.mobileAuthService.validateSession(sessionToken);
  }

  // ===== BIOMETRIC MANAGEMENT ENDPOINTS =====

  @Post('biometric/setup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Setup biometric authentication' })
  @ApiResponse({ status: 200, description: 'Biometric setup successful', type: BiometricSetupResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid biometric data' })
  async setupBiometric(
    @Body(ValidationPipe) setupDto: SetupBiometricDto,
    @Headers('authorization') authorization: string,
  ): Promise<BiometricSetupResponseDto> {
    const { customer, device } = await this.validateAndGetSession(authorization);

    const request: BiometricSetupRequest = {
      customerId: customer.id,
      deviceId: device.id,
      biometricType: setupDto.biometricType,
      biometricTemplate: setupDto.biometricTemplate,
      publicKey: setupDto.publicKey,
      deviceSecurityLevel: setupDto.deviceSecurityLevel,
    };

    return await this.mobileAuthService.setupBiometric(request);
  }

  @Delete('biometric/:deviceId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable biometric authentication' })
  @ApiParam({ name: 'deviceId', description: 'Device ID' })
  @ApiResponse({ status: 200, description: 'Biometric disabled successfully' })
  async disableBiometric(
    @Param('deviceId') deviceId: string,
    @Headers('authorization') authorization: string,
  ): Promise<{ success: boolean; message: string }> {
    const { customer } = await this.validateAndGetSession(authorization);

    const result = await this.mobileAuthService.disableBiometric(customer.id, deviceId);
    
    return {
      success: result.success,
      message: 'Biometric authentication disabled successfully',
    };
  }

  // ===== ONBOARDING ENDPOINTS =====

  @Post('onboarding/start')
  @ApiOperation({ summary: 'Start mobile onboarding process' })
  @ApiHeader({ name: 'User-Agent', description: 'Device user agent' })
  @ApiResponse({ status: 200, description: 'Onboarding started', type: OnboardingResponseDto })
  @ApiResponse({ status: 400, description: 'Customer already exists' })
  async startOnboarding(
    @Body(ValidationPipe) startDto: StartOnboardingDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
  ): Promise<OnboardingResponseDto> {
    this.logger.log(`Starting onboarding for ${startDto.phoneNumber} from ${ipAddress}`);

    const request: OnboardingRequest = {
      phoneNumber: startDto.phoneNumber,
      email: startDto.email,
      deviceInfo: startDto.deviceInfo,
      ipAddress,
      userAgent,
    };

    return await this.mobileAuthService.startOnboarding(request);
  }

  @Post('onboarding/:onboardingId/verify/phone')
  @ApiOperation({ summary: 'Verify phone number' })
  @ApiParam({ name: 'onboardingId', description: 'Onboarding ID' })
  @ApiResponse({ status: 200, description: 'Phone verified', type: StepVerificationResponseDto })
  async verifyPhone(
    @Param('onboardingId') onboardingId: string,
    @Body() body: { verificationCode: string },
  ): Promise<StepVerificationResponseDto> {
    const request: VerificationRequest = {
      onboardingId,
      stepType: OnboardingStep.PHONE_VERIFICATION,
      verificationCode: body.verificationCode,
    };

    const result = await this.mobileAuthService.verifyOnboardingStep(request);
    
    return {
      ...result,
      message: result.success ? 'Phone number verified successfully' : 'Invalid verification code',
    };
  }

  @Post('onboarding/:onboardingId/verify/email')
  @ApiOperation({ summary: 'Verify email address' })
  @ApiParam({ name: 'onboardingId', description: 'Onboarding ID' })
  @ApiResponse({ status: 200, description: 'Email verified', type: StepVerificationResponseDto })
  async verifyEmail(
    @Param('onboardingId') onboardingId: string,
    @Body() body: { verificationCode: string },
  ): Promise<StepVerificationResponseDto> {
    const request: VerificationRequest = {
      onboardingId,
      stepType: OnboardingStep.EMAIL_VERIFICATION,
      verificationCode: body.verificationCode,
    };

    const result = await this.mobileAuthService.verifyOnboardingStep(request);
    
    return {
      ...result,
      message: result.success ? 'Email address verified successfully' : 'Invalid verification code',
    };
  }

  @Post('onboarding/:onboardingId/personal-info')
  @ApiOperation({ summary: 'Submit personal information' })
  @ApiParam({ name: 'onboardingId', description: 'Onboarding ID' })
  @ApiResponse({ status: 200, description: 'Personal info submitted', type: StepVerificationResponseDto })
  async submitPersonalInfo(
    @Param('onboardingId') onboardingId: string,
    @Body(ValidationPipe) personalInfo: PersonalInfoDto,
  ): Promise<StepVerificationResponseDto> {
    const request: VerificationRequest = {
      onboardingId,
      stepType: OnboardingStep.PERSONAL_INFO,
      data: personalInfo,
    };

    const result = await this.mobileAuthService.verifyOnboardingStep(request);
    
    return {
      ...result,
      message: result.success ? 'Personal information submitted successfully' : 'Invalid personal information',
    };
  }

  @Post('onboarding/:onboardingId/identity-verification')
  @ApiOperation({ summary: 'Submit identity verification' })
  @ApiParam({ name: 'onboardingId', description: 'Onboarding ID' })
  @ApiResponse({ status: 200, description: 'Identity verified', type: StepVerificationResponseDto })
  async submitIdentityVerification(
    @Param('onboardingId') onboardingId: string,
    @Body(ValidationPipe) identityData: IdentityVerificationDto,
  ): Promise<StepVerificationResponseDto> {
    const request: VerificationRequest = {
      onboardingId,
      stepType: OnboardingStep.IDENTITY_VERIFICATION,
      data: identityData,
    };

    const result = await this.mobileAuthService.verifyOnboardingStep(request);
    
    return {
      ...result,
      message: result.success ? 'Identity verification completed' : 'Identity verification failed',
    };
  }

  @Post('onboarding/:onboardingId/documents')
  @ApiOperation({ summary: 'Upload identity documents' })
  @ApiParam({ name: 'onboardingId', description: 'Onboarding ID' })
  @ApiResponse({ status: 200, description: 'Documents uploaded', type: StepVerificationResponseDto })
  async uploadDocuments(
    @Param('onboardingId') onboardingId: string,
    @Body(ValidationPipe) documents: DocumentUploadDto,
  ): Promise<StepVerificationResponseDto> {
    const request: VerificationRequest = {
      onboardingId,
      stepType: OnboardingStep.DOCUMENT_UPLOAD,
      data: documents,
    };

    const result = await this.mobileAuthService.verifyOnboardingStep(request);
    
    return {
      ...result,
      message: result.success ? 'Documents uploaded successfully' : 'Document upload failed',
    };
  }

  @Post('onboarding/:onboardingId/face-verification')
  @ApiOperation({ summary: 'Face verification' })
  @ApiParam({ name: 'onboardingId', description: 'Onboarding ID' })
  @ApiResponse({ status: 200, description: 'Face verified', type: StepVerificationResponseDto })
  async submitFaceVerification(
    @Param('onboardingId') onboardingId: string,
    @Body(ValidationPipe) faceData: FaceVerificationDto,
  ): Promise<StepVerificationResponseDto> {
    const request: VerificationRequest = {
      onboardingId,
      stepType: OnboardingStep.FACE_VERIFICATION,
      data: faceData,
    };

    const result = await this.mobileAuthService.verifyOnboardingStep(request);
    
    return {
      ...result,
      message: result.success ? 'Face verification completed' : 'Face verification failed',
    };
  }

  @Post('onboarding/:onboardingId/biometric-setup')
  @ApiOperation({ summary: 'Setup biometric during onboarding' })
  @ApiParam({ name: 'onboardingId', description: 'Onboarding ID' })
  @ApiResponse({ status: 200, description: 'Biometric setup completed', type: StepVerificationResponseDto })
  async setupOnboardingBiometric(
    @Param('onboardingId') onboardingId: string,
    @Body() biometricData: { biometricType?: BiometricType; biometricTemplate?: string },
  ): Promise<StepVerificationResponseDto> {
    const request: VerificationRequest = {
      onboardingId,
      stepType: OnboardingStep.BIOMETRIC_SETUP,
      data: { biometricData },
    };

    const result = await this.mobileAuthService.verifyOnboardingStep(request);
    
    return {
      ...result,
      message: 'Biometric setup completed (optional)',
    };
  }

  @Post('onboarding/:onboardingId/pin-setup')
  @ApiOperation({ summary: 'Setup PIN' })
  @ApiParam({ name: 'onboardingId', description: 'Onboarding ID' })
  @ApiResponse({ status: 200, description: 'PIN setup completed', type: StepVerificationResponseDto })
  async setupPin(
    @Param('onboardingId') onboardingId: string,
    @Body(ValidationPipe) pinData: PinSetupDto,
  ): Promise<StepVerificationResponseDto> {
    if (pinData.pin !== pinData.confirmPin) {
      throw new BadRequestException('PIN confirmation does not match');
    }

    const request: VerificationRequest = {
      onboardingId,
      stepType: OnboardingStep.PIN_SETUP,
      data: { pin: pinData.pin },
    };

    const result = await this.mobileAuthService.verifyOnboardingStep(request);
    
    return {
      ...result,
      message: result.success ? 'PIN setup completed' : 'PIN setup failed',
    };
  }

  @Post('onboarding/:onboardingId/complete')
  @ApiOperation({ summary: 'Complete onboarding and create account' })
  @ApiParam({ name: 'onboardingId', description: 'Onboarding ID' })
  @ApiResponse({ status: 200, description: 'Onboarding completed', type: StepVerificationResponseDto })
  async completeOnboarding(
    @Param('onboardingId') onboardingId: string,
  ): Promise<StepVerificationResponseDto> {
    const request: VerificationRequest = {
      onboardingId,
      stepType: OnboardingStep.ACCOUNT_CREATION,
    };

    const result = await this.mobileAuthService.verifyOnboardingStep(request);
    
    return {
      ...result,
      message: result.success ? 'Welcome! Your account has been created successfully' : 'Account creation failed',
    };
  }

  // ===== DEVICE MANAGEMENT ENDPOINTS =====

  @Get('devices')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer devices' })
  @ApiResponse({ status: 200, description: 'Devices retrieved', type: [DeviceResponseDto] })
  async getDevices(
    @Headers('authorization') authorization: string,
  ): Promise<DeviceResponseDto[]> {
    const { customer } = await this.validateAndGetSession(authorization);

    return await this.mobileAuthService.getCustomerDevices(customer.id);
  }

  @Delete('devices/:deviceId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove device' })
  @ApiParam({ name: 'deviceId', description: 'Device ID' })
  @ApiResponse({ status: 200, description: 'Device removed successfully' })
  async removeDevice(
    @Param('deviceId') deviceId: string,
    @Headers('authorization') authorization: string,
  ): Promise<{ success: boolean; message: string }> {
    const { customer } = await this.validateAndGetSession(authorization);

    const result = await this.mobileAuthService.removeDevice(customer.id, deviceId);
    
    return {
      success: result.success,
      message: 'Device removed successfully',
    };
  }

  // ===== UTILITY ENDPOINTS =====

  @Get('security/enums')
  @ApiOperation({ summary: 'Get security-related enums' })
  @ApiResponse({ status: 200, description: 'Enums retrieved' })
  async getSecurityEnums(): Promise<{
    deviceTypes: DeviceType[];
    platforms: MobilePlatform[];
    biometricTypes: BiometricType[];
    securityLevels: SecurityLevel[];
    authMethods: AuthMethod[];
    onboardingStatuses: OnboardingStatus[];
    onboardingSteps: OnboardingStep[];
  }> {
    return {
      deviceTypes: Object.values(DeviceType),
      platforms: Object.values(MobilePlatform),
      biometricTypes: Object.values(BiometricType),
      securityLevels: Object.values(SecurityLevel),
      authMethods: Object.values(AuthMethod),
      onboardingStatuses: Object.values(OnboardingStatus),
      onboardingSteps: Object.values(OnboardingStep),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check mobile auth service health' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async getHealthStatus(): Promise<{
    status: string;
    timestamp: string;
    services: {
      authentication: string;
      biometric: string;
      onboarding: string;
      deviceManagement: string;
    };
  }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        authentication: 'operational',
        biometric: 'operational',
        onboarding: 'operational',
        deviceManagement: 'operational',
      },
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  private extractSessionToken(authorization: string): string {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid authorization header');
    }
    return authorization.substring(7);
  }

  private async validateAndGetSession(authorization: string): Promise<{
    customer: any;
    device: any;
    session: any;
  }> {
    const sessionToken = this.extractSessionToken(authorization);
    const validation = await this.mobileAuthService.validateSession(sessionToken);

    if (!validation.valid) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    return {
      customer: validation.customer,
      device: validation.device,
      session: validation.session,
    };
  }
}