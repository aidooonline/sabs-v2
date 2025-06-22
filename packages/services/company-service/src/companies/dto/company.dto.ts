import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsObject,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsUUID,
  IsPhoneNumber,
  IsUrl,
  ValidateNested,
  Min,
  Max,
  Length,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CompanyStatus, CompanySettings, CommissionRates } from '../entities/company.entity';

class NotificationSettingsDto {
  @ApiProperty({ description: 'Enable email notifications' })
  @IsBoolean()
  email: boolean;

  @ApiProperty({ description: 'Enable SMS notifications' })
  @IsBoolean()
  sms: boolean;

  @ApiProperty({ description: 'Enable push notifications' })
  @IsBoolean()
  push: boolean;
}

class FeatureSettingsDto {
  @ApiProperty({ description: 'Enable advanced analytics' })
  @IsBoolean()
  advancedAnalytics: boolean;

  @ApiProperty({ description: 'Enable bulk transactions' })
  @IsBoolean()
  bulkTransactions: boolean;

  @ApiProperty({ description: 'Enable custom reports' })
  @IsBoolean()
  customReports: boolean;
}

class LimitSettingsDto {
  @ApiProperty({ description: 'Maximum number of agents', minimum: 1, maximum: 1000 })
  @IsNumber()
  @Min(1)
  @Max(1000)
  maxAgents: number;

  @ApiProperty({ description: 'Maximum number of customers', minimum: 100, maximum: 100000 })
  @IsNumber()
  @Min(100)
  @Max(100000)
  maxCustomers: number;

  @ApiProperty({ description: 'Daily transaction limit in local currency', minimum: 1000 })
  @IsNumber()
  @Min(1000)
  dailyTransactionLimit: number;
}

class BrandingSettingsDto {
  @ApiPropertyOptional({ description: 'Company logo URL' })
  @IsOptional()
  @IsUrl()
  logo?: string;

  @ApiPropertyOptional({ description: 'Primary brand color (hex code)' })
  @IsOptional()
  @IsString()
  @Length(7, 7)
  primaryColor?: string;

  @ApiPropertyOptional({ description: 'Custom domain for white-label deployment' })
  @IsOptional()
  @IsString()
  customDomain?: string;
}

class CompanySettingsDto {
  @ApiProperty({ description: 'Notification settings' })
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notifications: NotificationSettingsDto;

  @ApiProperty({ description: 'Feature settings' })
  @ValidateNested()
  @Type(() => FeatureSettingsDto)
  features: FeatureSettingsDto;

  @ApiProperty({ description: 'System limits' })
  @ValidateNested()
  @Type(() => LimitSettingsDto)
  limits: LimitSettingsDto;

  @ApiProperty({ description: 'Branding settings' })
  @ValidateNested()
  @Type(() => BrandingSettingsDto)
  branding: BrandingSettingsDto;
}

class CommissionRatesDto {
  @ApiProperty({ description: 'Commission rate for deposits', minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  deposit: number;

  @ApiProperty({ description: 'Commission rate for withdrawals', minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  withdrawal: number;

  @ApiPropertyOptional({ description: 'Commission rate for transfers', minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  transfer?: number;

  @ApiPropertyOptional({ description: 'Commission rate for bill payments', minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  billPayment?: number;

  @ApiPropertyOptional({ description: 'Commission rate for loan disbursements', minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  loanDisbursement?: number;
}

export class CreateCompanyDto {
  @ApiProperty({ description: 'Company name', minLength: 2, maxLength: 255 })
  @IsString()
  @Length(2, 255)
  name: string;

  @ApiProperty({ description: 'Company email address' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Company phone number' })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({ description: 'Company address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Country code (ISO 3166-1 alpha-3)', default: 'GH' })
  @IsOptional()
  @IsString()
  @Length(2, 3)
  countryCode?: string;

  @ApiPropertyOptional({ description: 'Currency code (ISO 4217)', default: 'GHS' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ description: 'Timezone', default: 'Africa/Accra' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ enum: CompanyStatus, description: 'Company status' })
  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  @ApiPropertyOptional({ description: 'Company settings' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompanySettingsDto)
  settings?: CompanySettingsDto;

  @ApiPropertyOptional({ description: 'Subscription plan', default: 'basic' })
  @IsOptional()
  @IsIn(['basic', 'standard', 'premium', 'enterprise'])
  subscriptionPlan?: string;

  @ApiPropertyOptional({ description: 'Trial end date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  trialEndsAt?: string;

  @ApiPropertyOptional({ description: 'Initial SMS credits', minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  smsCredits?: number;

  @ApiPropertyOptional({ description: 'Initial AI credits', minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  aiCredits?: number;

  @ApiPropertyOptional({ description: 'Commission rates configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CommissionRatesDto)
  commissionRates?: CommissionRatesDto;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}

export class CompanyResponseDto {
  @ApiProperty({ description: 'Company ID' })
  id: string;

  @ApiProperty({ description: 'Company name' })
  name: string;

  @ApiProperty({ description: 'Company email' })
  email: string;

  @ApiPropertyOptional({ description: 'Company phone number' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Company address' })
  address?: string;

  @ApiProperty({ description: 'Country code' })
  countryCode: string;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Timezone' })
  timezone: string;

  @ApiProperty({ enum: CompanyStatus, description: 'Company status' })
  status: CompanyStatus;

  @ApiProperty({ description: 'Company settings' })
  settings: CompanySettings;

  @ApiProperty({ description: 'Subscription plan' })
  subscriptionPlan: string;

  @ApiPropertyOptional({ description: 'Trial end date' })
  trialEndsAt?: Date;

  @ApiProperty({ description: 'SMS credits balance' })
  smsCredits: number;

  @ApiProperty({ description: 'AI credits balance' })
  aiCredits: number;

  @ApiProperty({ description: 'Commission rates' })
  commissionRates: CommissionRates;

  @ApiProperty({ description: 'Company creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Is company active' })
  isActive: boolean;

  @ApiProperty({ description: 'Is company on trial' })
  isOnTrial: boolean;

  @ApiProperty({ description: 'Trial days remaining' })
  trialDaysRemaining: number;
}

export class AddServiceCreditsDto {
  @ApiProperty({ enum: ['sms', 'ai'], description: 'Service type' })
  @IsEnum(['sms', 'ai'])
  serviceType: 'sms' | 'ai';

  @ApiProperty({ description: 'Number of credits to add', minimum: 1 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ description: 'Reason for credit addition' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CompanyStatsDto {
  @ApiProperty({ description: 'Total number of users' })
  totalUsers: number;

  @ApiProperty({ description: 'Active users in the last 30 days' })
  activeUsers: number;

  @ApiProperty({ description: 'Total customers' })
  totalCustomers: number;

  @ApiProperty({ description: 'Total transactions this month' })
  monthlyTransactions: number;

  @ApiProperty({ description: 'Total transaction volume this month' })
  monthlyVolume: number;

  @ApiProperty({ description: 'Service usage statistics' })
  serviceUsage: {
    smsUsed: number;
    aiQueriesUsed: number;
  };
}

export class BulkOperationDto {
  @ApiProperty({ description: 'Company IDs to operate on' })
  @IsUUID('4', { each: true })
  companyIds: string[];

  @ApiProperty({ enum: CompanyStatus, description: 'New status for companies' })
  @IsEnum(CompanyStatus)
  status: CompanyStatus;

  @ApiPropertyOptional({ description: 'Reason for bulk operation' })
  @IsOptional()
  @IsString()
  reason?: string;
}