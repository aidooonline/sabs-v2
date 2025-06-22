import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsPhoneNumber,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsUUID,
  ValidateNested,
  MinLength,
  MaxLength,
  IsArray,
  Min,
  Max,
  IsObject,
  IsLatLong,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { UserRole, UserStatus, UserLocation, AgentPerformance } from '../entities/user.entity';

class LocationDto {
  @ApiProperty({ description: 'Latitude coordinate' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiPropertyOptional({ description: 'Address description' })
  @IsOptional()
  @IsString()
  address?: string;
}

export class CreateStaffDto {
  @ApiProperty({ description: 'Staff member email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'First name', minLength: 2, maxLength: 50 })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ description: 'Last name', minLength: 2, maxLength: 50 })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiProperty({ enum: [UserRole.FIELD_AGENT, UserRole.CLERK], description: 'Staff role' })
  @IsEnum([UserRole.FIELD_AGENT, UserRole.CLERK])
  role: UserRole.FIELD_AGENT | UserRole.CLERK;

  @ApiPropertyOptional({ description: 'Custom agent code (auto-generated if not provided)' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  agentCode?: string;

  @ApiPropertyOptional({ description: 'Staff location information' })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Send welcome email', default: true })
  @IsOptional()
  @IsBoolean()
  sendWelcomeEmail?: boolean = true;
}

export class UpdateStaffDto extends PartialType(CreateStaffDto) {
  @ApiPropertyOptional({ enum: UserStatus, description: 'Staff status' })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class StaffResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'Company ID' })
  companyId: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiProperty({ description: 'First name' })
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  lastName: string;

  @ApiProperty({ description: 'Full name' })
  fullName: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  phone?: string;

  @ApiProperty({ enum: UserRole, description: 'User role' })
  role: UserRole;

  @ApiProperty({ enum: UserStatus, description: 'User status' })
  status: UserStatus;

  @ApiPropertyOptional({ description: 'Agent code (for field agents)' })
  agentCode?: string;

  @ApiPropertyOptional({ description: 'Location information' })
  location?: UserLocation;

  @ApiProperty({ description: 'Is email verified' })
  isEmailVerified: boolean;

  @ApiPropertyOptional({ description: 'Last login date' })
  lastLoginAt?: Date;

  @ApiProperty({ description: 'Is account locked' })
  isLocked: boolean;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Display role name' })
  displayRole: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;
}

export class StaffPerformanceDto {
  @ApiProperty({ description: 'Staff member ID' })
  staffId: string;

  @ApiProperty({ description: 'Staff member name' })
  staffName: string;

  @ApiProperty({ description: 'Staff role' })
  role: UserRole;

  @ApiProperty({ description: 'Monthly transaction count' })
  monthlyTransactions: number;

  @ApiProperty({ description: 'Monthly transaction volume' })
  monthlyVolume: number;

  @ApiProperty({ description: 'Number of customers served' })
  customerCount: number;

  @ApiProperty({ description: 'Commission earned this month' })
  commissionEarned: number;

  @ApiProperty({ description: 'Average transaction value' })
  averageTransactionValue: number;

  @ApiProperty({ description: 'Last active date' })
  lastActiveDate: Date;

  @ApiProperty({ description: 'Performance score (0-100)' })
  performanceScore: number;

  @ApiProperty({ description: 'Performance ranking within company' })
  ranking: number;
}

export class BulkStaffOperationDto {
  @ApiProperty({ description: 'Staff IDs to operate on' })
  @IsArray()
  @IsUUID('4', { each: true })
  staffIds: string[];

  @ApiPropertyOptional({ enum: UserStatus, description: 'New status for staff members' })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'Reason for bulk operation' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Send notification to affected staff', default: true })
  @IsOptional()
  @IsBoolean()
  sendNotification?: boolean = true;
}

export class StaffOnboardingDto {
  @ApiProperty({ description: 'Staff member ID' })
  @IsUUID('4')
  staffId: string;

  @ApiProperty({ description: 'Temporary password for initial login' })
  @IsString()
  @MinLength(8)
  temporaryPassword: string;

  @ApiPropertyOptional({ description: 'Force password change on first login', default: true })
  @IsOptional()
  @IsBoolean()
  forcePasswordChange?: boolean = true;

  @ApiPropertyOptional({ description: 'Send onboarding email', default: true })
  @IsOptional()
  @IsBoolean()
  sendOnboardingEmail?: boolean = true;

  @ApiPropertyOptional({ description: 'Custom onboarding message' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  customMessage?: string;
}

export class LocationUpdateDto {
  @ApiProperty({ description: 'Latitude coordinate' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiPropertyOptional({ description: 'Address description' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;
}

export class StaffFilterDto {
  @ApiPropertyOptional({ enum: UserRole, description: 'Filter by role' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by agent code' })
  @IsOptional()
  @IsString()
  agentCode?: string;

  @ApiPropertyOptional({ description: 'Page number (default: 1)' })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page (default: 20, max: 100)' })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ 
    enum: ['firstName', 'lastName', 'email', 'role', 'status', 'createdAt'],
    description: 'Sort by field' 
  })
  @IsOptional()
  @IsEnum(['firstName', 'lastName', 'email', 'role', 'status', 'createdAt'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], description: 'Sort order' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class StaffStatsDto {
  @ApiProperty({ description: 'Total number of staff' })
  totalStaff: number;

  @ApiProperty({ description: 'Number of active staff' })
  activeStaff: number;

  @ApiProperty({ description: 'Number of field agents' })
  fieldAgents: number;

  @ApiProperty({ description: 'Number of clerks' })
  clerks: number;

  @ApiProperty({ description: 'Number of pending staff (awaiting onboarding)' })
  pendingStaff: number;

  @ApiProperty({ description: 'Number of suspended staff' })
  suspendedStaff: number;

  @ApiProperty({ description: 'Staff hired this month' })
  newHiresThisMonth: number;

  @ApiProperty({ description: 'Average performance score' })
  averagePerformanceScore: number;

  @ApiProperty({ description: 'Top performer this month' })
  topPerformer?: {
    id: string;
    name: string;
    performanceScore: number;
  };
}

export class StaffAuditLogDto {
  @ApiProperty({ description: 'Action performed' })
  action: string;

  @ApiProperty({ description: 'Staff member affected' })
  staffId: string;

  @ApiProperty({ description: 'Staff member name' })
  staffName: string;

  @ApiProperty({ description: 'Admin who performed the action' })
  performedBy: string;

  @ApiProperty({ description: 'Admin name' })
  performedByName: string;

  @ApiProperty({ description: 'Action timestamp' })
  timestamp: Date;

  @ApiProperty({ description: 'Reason for action' })
  reason?: string;

  @ApiProperty({ description: 'Details of the change' })
  details: Record<string, any>;
}

export class PasswordResetDto {
  @ApiProperty({ description: 'Staff member ID' })
  @IsUUID('4')
  staffId: string;

  @ApiPropertyOptional({ description: 'Send password reset email', default: true })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean = true;

  @ApiPropertyOptional({ description: 'Custom reset message' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  customMessage?: string;
}