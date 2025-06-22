import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsBoolean,
  IsEnum,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  Length,
  Matches
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// MFA DTOs
export class EnableMfaDto {
  @ApiProperty({
    example: 'totp',
    description: 'MFA type to enable',
    enum: ['totp', 'sms', 'email']
  })
  @IsEnum(['totp', 'sms', 'email'])
  type: 'totp' | 'sms' | 'email';

  @ApiProperty({
    example: '+233201234567',
    description: 'Phone number for SMS MFA (required for SMS type)',
    required: false
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'Please provide a valid international phone number' })
  phoneNumber?: string;
}

export class VerifyMfaSetupDto {
  @ApiProperty({
    example: '123456',
    description: '6-digit verification code'
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Verification code must be 6 digits' })
  @Matches(/^\d{6}$/, { message: 'Verification code must contain only digits' })
  code: string;
}

export class VerifyMfaDto {
  @ApiProperty({
    example: '123456',
    description: '6-digit MFA code or backup code'
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: false,
    description: 'Whether this is a backup code',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isBackupCode?: boolean;
}

export class DisableMfaDto {
  @ApiProperty({
    example: 'CurrentPassword123!',
    description: 'Current password for security verification'
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: '123456',
    description: 'Current MFA code',
    required: false
  })
  @IsOptional()
  @IsString()
  mfaCode?: string;
}

// Enhanced Login DTOs
export class EnhancedLoginDto {
  @ApiProperty({
    example: 'admin@accrafinancial.com',
    description: 'User email address'
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'User password'
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: '123456',
    description: 'MFA code (required if MFA is enabled)',
    required: false
  })
  @IsOptional()
  @IsString()
  mfaCode?: string;

  @ApiProperty({
    example: 'ABC123',
    description: 'Backup code (alternative to MFA code)',
    required: false
  })
  @IsOptional()
  @IsString()
  backupCode?: string;

  @ApiProperty({
    example: 'device_fingerprint_hash',
    description: 'Device fingerprint for security tracking'
  })
  @IsString()
  @IsNotEmpty()
  deviceFingerprint: string;

  @ApiProperty({
    example: 'John\'s iPhone',
    description: 'Human-readable device name',
    required: false
  })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiProperty({
    example: false,
    description: 'Whether to remember this device',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  rememberDevice?: boolean;
}

// Device Management DTOs
export class RegisterDeviceDto {
  @ApiProperty({
    example: 'device_fingerprint_hash',
    description: 'Unique device fingerprint'
  })
  @IsString()
  @IsNotEmpty()
  deviceFingerprint: string;

  @ApiProperty({
    example: 'John\'s iPhone',
    description: 'Human-readable device name'
  })
  @IsString()
  @IsNotEmpty()
  deviceName: string;

  @ApiProperty({
    example: 'mobile',
    description: 'Device type',
    enum: ['mobile', 'desktop', 'tablet']
  })
  @IsEnum(['mobile', 'desktop', 'tablet'])
  deviceType: 'mobile' | 'desktop' | 'tablet';
}

export class UpdateDeviceDto {
  @ApiProperty({
    example: 'John\'s Updated iPhone',
    description: 'Updated device name',
    required: false
  })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiProperty({
    example: true,
    description: 'Whether device is trusted',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isTrusted?: boolean;
}

// Session Management DTOs
export class SessionFilterDto {
  @ApiProperty({
    example: 1,
    description: 'Page number for pagination',
    required: false
  })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    example: 10,
    description: 'Number of items per page',
    required: false
  })
  @IsOptional()  
  limit?: number = 10;

  @ApiProperty({
    example: true,
    description: 'Filter by active sessions only',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  activeOnly?: boolean;

  @ApiProperty({
    example: 'mobile',
    description: 'Filter by device type',
    required: false
  })
  @IsOptional()
  @IsString()
  deviceType?: string;
}

export class InvalidateSessionDto {
  @ApiProperty({
    example: ['session-id-1', 'session-id-2'],
    description: 'Array of session IDs to invalidate'
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  sessionIds: string[];
}

// Security DTOs
export class ReportSuspiciousActivityDto {
  @ApiProperty({
    example: 'suspicious_login',
    description: 'Type of suspicious activity'
  })
  @IsString()
  @IsNotEmpty()
  activityType: string;

  @ApiProperty({
    example: 'Multiple failed login attempts from unknown location',
    description: 'Description of the suspicious activity'
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: { ip: '192.168.1.1', attempts: 5 },
    description: 'Additional metadata',
    required: false
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SecuritySettingsDto {
  @ApiProperty({
    example: true,
    description: 'Enable email notifications for security events',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiProperty({
    example: true,
    description: 'Enable SMS notifications for security events',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;

  @ApiProperty({
    example: ['192.168.1.0/24', '10.0.0.0/8'],
    description: 'IP whitelist for trusted networks',
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ipWhitelist?: string[];

  @ApiProperty({
    example: 24,
    description: 'Session timeout in hours',
    required: false
  })
  @IsOptional()
  sessionTimeout?: number;
}