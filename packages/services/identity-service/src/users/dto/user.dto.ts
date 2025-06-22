import { 
  IsEmail, 
  IsString, 
  IsNotEmpty, 
  IsOptional,
  IsBoolean,
  IsEnum,
  MinLength,
  MaxLength,
  Matches
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@sabs/common';
import { PartialType } from '@nestjs/mapped-types';

export class CreateUserDto {
  @ApiProperty({
    example: 'john.doe@example.com',
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
    example: 'field_agent',
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

  @ApiProperty({
    example: true,
    description: 'Whether the user is active',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether the email is verified',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
    required: false
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
    required: false
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name cannot exceed 50 characters' })
  firstName?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
    required: false
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
  lastName?: string;

  @ApiProperty({
    example: '+233201234567',
    description: 'User phone number',
    required: false
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'Please provide a valid international phone number' })
  phone?: string;

  @ApiProperty({
    example: 'field_agent',
    description: 'User role',
    enum: UserRole,
    required: false
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Please provide a valid user role' })
  role?: UserRole;

  @ApiProperty({
    example: true,
    description: 'Whether the user is active',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether the email is verified',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  phone: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  companyId: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isEmailVerified: boolean;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  lastLoginAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class UserListResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  users: UserResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  totalPages: number;
}