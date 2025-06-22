import { 
  IsEmail, 
  IsString, 
  IsNotEmpty, 
  MinLength, 
  MaxLength,
  Matches,
  IsOptional,
  IsEnum
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@sabs/common';

export class LoginDto {
  @ApiProperty({
    example: 'admin@accrafinancial.com',
    description: 'User email address'
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'User password'
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegisterDto {
  @ApiProperty({
    example: 'admin@accrafinancial.com',
    description: 'User email address'
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Password (min 8 characters, must contain uppercase, lowercase, number, and special character)'
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' }
  )
  password: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name cannot exceed 50 characters' })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
  lastName: string;

  @ApiProperty({
    example: '+233201234567',
    description: 'User phone number'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'Please provide a valid international phone number' })
  phone: string;

  @ApiProperty({
    example: 'company_admin',
    description: 'User role',
    enum: UserRole
  })
  @IsEnum(UserRole, { message: 'Please provide a valid user role' })
  role: UserRole;

  @ApiProperty({
    example: 'uuid-company-id',
    description: 'Company ID for multi-tenancy'
  })
  @IsString()
  @IsNotEmpty()
  companyId: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    example: 'CurrentPassword123!',
    description: 'Current password'
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    example: 'NewSecurePassword123!',
    description: 'New password (min 8 characters, must contain uppercase, lowercase, number, and special character)'
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' }
  )
  newPassword: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'reset-token-uuid',
    description: 'Password reset token'
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'NewSecurePassword123!',
    description: 'New password (min 8 characters, must contain uppercase, lowercase, number, and special character)'
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' }
  )
  newPassword: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address to send reset link'
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: 'refresh-token-jwt',
    description: 'Refresh token'
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}