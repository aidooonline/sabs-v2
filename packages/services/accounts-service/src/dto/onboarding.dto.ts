import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsPhoneNumber, IsDateString, IsEnum, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, IsObject, Min, Max, Length, Matches } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Gender, IdentificationType } from '../entities/customer.entity';
import { OnboardingChannel, OnboardingStep, DocumentType } from '../entities/customer-onboarding.entity';
import { AccountType, CurrencyCode } from '../entities/account.entity';

// Base Customer Information DTO
export class CustomerPersonalInfoDto {
  @ApiProperty({ description: 'Customer first name', _example: any)
  @IsString()
  @Length(2, 50)
  firstName: string;

  @ApiProperty({ description: 'Customer last name', _example: any)
  @IsString()
  @Length(2, 50)
  lastName: string;

  @ApiPropertyOptional({ description: 'Customer middle name', _example: any)
  @IsString()
  @IsOptional()
  @Length(2, 50)
  middleName?: string;

  @ApiProperty({ description: 'Customer date of birth', _example: any)
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ description: 'Customer gender', _enum: any, example: Gender.MALE })
  @IsEnum(Gender)
  gender: Gender;
}

export class CustomerContactInfoDto {
  @ApiProperty({ description: 'Customer phone number', _example: any)
  @IsPhoneNumber('GH')
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Customer email address', _example: any)
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Address line 1', _example: any)
  @IsString()
  @Length(5, 200)
  addressLine1: string;

  @ApiPropertyOptional({ description: 'Address line 2', _example: any)
  @IsString()
  @IsOptional()
  @Length(1, 200)
  addressLine2?: string;

  @ApiProperty({ description: 'City', _example: any)
  @IsString()
  @Length(2, 50)
  city: string;

  @ApiProperty({ description: 'Region/State', _example: any)
  @IsString()
  @Length(2, 50)
  region: string;

  @ApiPropertyOptional({ description: 'Postal code', _example: any)
  @IsString()
  @IsOptional()
  @Length(3, 20)
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Country code', _example: any, default: 'GHA' })
  @IsString()
  @IsOptional()
  @Length(2, 3)
  country?: string = 'GHA';
}

export class CustomerIdentificationDto {
  @ApiProperty({ description: 'Type of identification', _enum: any, example: IdentificationType.NATIONAL_ID })
  @IsEnum(IdentificationType)
  identificationType: IdentificationType;

  @ApiProperty({ description: 'Identification number', _example: any)
  @IsString()
  @Length(5, 50)
  identificationNumber: string;

  @ApiPropertyOptional({ description: 'Identification expiry date', _example: any)
  @IsDateString()
  @IsOptional()
  identificationExpiry?: string;
}

export class EmergencyContactDto {
  @ApiPropertyOptional({ description: 'Emergency contact name', _example: any)
  @IsString()
  @IsOptional()
  @Length(2, 100)
  emergencyContactName?: string;

  @ApiPropertyOptional({ description: 'Emergency contact phone', _example: any)
  @IsPhoneNumber('GH')
  @IsOptional()
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ description: 'Emergency contact relationship', _example: any)
  @IsString()
  @IsOptional()
  @Length(2, 50)
  emergencyContactRelationship?: string;
}

export class BusinessInformationDto {
  @ApiProperty({ description: 'Business name', _example: any)
  @IsString()
  @Length(2, 200)
  businessName: string;

  @ApiPropertyOptional({ description: 'Business registration number', _example: any)
  @IsString()
  @IsOptional()
  @Length(5, 50)
  businessRegistrationNumber?: string;

  @ApiPropertyOptional({ description: 'Business type', _example: any)
  @IsString()
  @IsOptional()
  @Length(2, 100)
  businessType?: string;
}

export class AccountPreferencesDto {
  @ApiProperty({ description: 'Account type', _enum: any, example: AccountType.SAVINGS })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiProperty({ description: 'Account name', _example: any)
  @IsString()
  @Length(5, 200)
  accountName: string;

  @ApiPropertyOptional({ description: 'Currency', _enum: any, example: CurrencyCode.GHS })
  @IsEnum(CurrencyCode)
  @IsOptional()
  currency?: CurrencyCode = CurrencyCode.GHS;

  @ApiPropertyOptional({ description: 'Opening balance', _example: any, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  openingBalance?: number = 0;

  @ApiPropertyOptional({ description: 'Enable SMS notifications', _example: any)
  @IsBoolean()
  @IsOptional()
  smsNotifications?: boolean = true;

  @ApiPropertyOptional({ description: 'Enable email notifications', _example: any)
  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean = false;

  @ApiPropertyOptional({ description: 'Preferred language', _example: any)
  @IsString()
  @IsOptional()
  @Length(2, 10)
  preferredLanguage?: string = 'en';
}

// Main Onboarding DTOs
export class StartOnboardingDto {
  @ApiProperty({ description: 'Onboarding channel', _enum: any, example: OnboardingChannel.AGENT_MOBILE })
  @IsEnum(OnboardingChannel)
  channel: OnboardingChannel;

  @ApiPropertyOptional({ description: 'Agent GPS location (lat,lng)', _example: any,-0.1870' })
  @IsString()
  @IsOptional()
  @Matches(/^-?\d+\.?\d*,-?\d+\.?\d*$/, { message: 'Location must be in format "latitude,longitude"' })
  location?: string;

  @ApiPropertyOptional({ description: 'Referral code', _example: any)
  @IsString()
  @IsOptional()
  @Length(6, 20)
  referralCode?: string;

  @ApiPropertyOptional({ description: 'Initial notes', _example: any)
  @IsString()
  @IsOptional()
  @Length(1, 500)
  notes?: string;
}

export class UpdatePersonalInfoDto extends CustomerPersonalInfoDto {
  @ApiPropertyOptional({ description: 'Is this a business customer?', _example: any)
  @IsBoolean()
  @IsOptional()
  isBusiness?: boolean = false;

  @ValidateNested()
  @Type(() => BusinessInformationDto)
  @IsOptional()
  businessInfo?: BusinessInformationDto;
}

export class UpdateContactInfoDto extends CustomerContactInfoDto {
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  @IsOptional()
  emergencyContact?: EmergencyContactDto;
}

export class UpdateIdentificationDto extends CustomerIdentificationDto {}

export class UpdateAccountPreferencesDto extends AccountPreferencesDto {}

export class UploadDocumentDto {
  @ApiProperty({ description: 'Document type', _enum: any, example: DocumentType.IDENTIFICATION_FRONT })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({ description: 'Document file name', _example: any)
  @IsString()
  @Length(1, 255)
  fileName: string;

  @ApiProperty({ description: 'File size in bytes', _example: any)
  @IsNumber()
  @Min(1)
  @Max(10 * 1024 * 1024) // 10MB max
  fileSize: number;

  @ApiProperty({ description: 'MIME type', _example: any)
  @IsString()
  @Matches(/^(image\/(jpeg|jpg|png|gif|bmp))|(application\/pdf)$/, { message: 'Invalid file type' })
  mimeType: string;

  @ApiProperty({ description: 'Base64 encoded file content or file URL' })
  @IsString()
  content: string;
}

export class VerifyDocumentDto {
  @ApiProperty({ description: 'Document type to verify', _enum: any)
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({ description: 'Verification result', _example: any)
  @IsBoolean()
  verified: boolean;

  @ApiPropertyOptional({ description: 'Rejection reason if not verified', _example: any)
  @IsString()
  @IsOptional()
  @Length(1, 500)
  rejectionReason?: string;
}

export class SubmitOnboardingDto {
  @ApiPropertyOptional({ description: 'Final notes before submission', _example: any, ready for approval' })
  @IsString()
  @IsOptional()
  @Length(1, 1000)
  notes?: string;
}

export class ApproveOnboardingDto {
  @ApiPropertyOptional({ description: 'Approval notes', _example: any)
  @IsString()
  @IsOptional()
  @Length(1, 1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Create account immediately after approval', _example: any)
  @IsBoolean()
  @IsOptional()
  createAccount?: boolean = true;
}

export class RejectOnboardingDto {
  @ApiProperty({ description: 'Rejection reason', _example: any)
  @IsString()
  @Length(10, 1000)
  reason: string;

  @ApiPropertyOptional({ description: 'Allow resubmission?', _example: any)
  @IsBoolean()
  @IsOptional()
  allowResubmission?: boolean = true;
}

export class UpdateOnboardingStatusDto {
  @ApiPropertyOptional({ description: 'Status change reason', _example: any)
  @IsString()
  @IsOptional()
  @Length(1, 500)
  reason?: string;
}

// Response DTOs
export class OnboardingStepResponseDto {
  @ApiProperty({ description: 'Step name', _enum: any)
  step: OnboardingStep;

  @ApiProperty({ description: 'Step completed', _example: any)
  completed: boolean;

  @ApiProperty({ description: 'Step completion timestamp', _example: any)
  completedAt?: string;

  @ApiProperty({ description: 'Can proceed to next step', _example: any)
  canProceed: boolean;

  @ApiProperty({ description: 'Required data for step completion' })
  requiredData: string[];

  @ApiProperty({ description: 'Step validation errors' })
  errors: string[];
}

export class DocumentResponseDto {
  @ApiProperty({ description: 'Document type', _enum: any)
  type: DocumentType;

  @ApiProperty({ description: 'File name', _example: any)
  fileName: string;

  @ApiProperty({ description: 'File size in bytes', _example: any)
  fileSize: number;

  @ApiProperty({ description: 'Upload timestamp', _example: any)
  uploadedAt: string;

  @ApiProperty({ description: 'Document verified', _example: any)
  verified: boolean;

  @ApiPropertyOptional({ description: 'Rejection reason if not verified' })
  rejectionReason?: string;

  @ApiProperty({ description: 'Document URL' })
  url: string;
}

export class OnboardingResponseDto {
  @ApiProperty({ description: 'Onboarding ID', _example: any)
  id: string;

  @ApiProperty({ description: 'Onboarding number', _example: any)
  onboardingNumber: string;

  @ApiProperty({ description: 'Company ID', _example: any)
  companyId: string;

  @ApiPropertyOptional({ description: 'Customer ID if created', _example: any)
  customerId?: string;

  @ApiProperty({ description: 'Onboarding status', _example: any)
  status: string;

  @ApiProperty({ description: 'Current step', _enum: any)
  currentStep: OnboardingStep;

  @ApiProperty({ description: 'Progress percentage', _example: any, minimum: 0, _maximum: any)
  progressPercentage: number;

  @ApiProperty({ description: 'Completed steps', _type: any)
  completedSteps: OnboardingStep[];

  @ApiProperty({ description: 'Agent information' })
  agent: {
    id: string;
    name: string;
    phone: string;
  };

  @ApiProperty({ description: 'Time remaining in minutes', _example: any)
  timeRemaining: number;

  @ApiProperty({ description: 'Time elapsed in minutes', _example: any)
  timeElapsed: number;

  @ApiProperty({ description: 'Is expired', _example: any)
  isExpired: boolean;

  @ApiProperty({ description: 'Customer data collected so far' })
  customerData: Record<string, any>;

  @ApiProperty({ description: 'Account preferences' })
  accountPreferences: Record<string, any>;

  @ApiProperty({ description: 'Collected documents', _type: any)
  documents: DocumentResponseDto[];

  @ApiProperty({ description: 'Risk score', _example: any, minimum: 0, _maximum: any)
  riskScore: number;

  @ApiProperty({ description: 'KYC level', _example: any, minimum: 1, _maximum: any)
  kycLevel: number;

  @ApiProperty({ description: 'Verification required', _example: any)
  verificationRequired: boolean;

  @ApiPropertyOptional({ description: 'Verification notes' })
  verificationNotes?: string;

  @ApiPropertyOptional({ description: 'Rejection reason' })
  rejectionReason?: string;

  @ApiProperty({ description: 'Creation timestamp', _example: any)
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp', _example: any)
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Completion timestamp' })
  completedAt?: string;

  @ApiPropertyOptional({ description: 'Expiry timestamp' })
  expiresAt: string;
}

export class OnboardingListResponseDto {
  @ApiProperty({ description: 'List of onboarding records', _type: any)
  onboardings: OnboardingResponseDto[];

  @ApiProperty({ description: 'Total count', _example: any)
  total: number;

  @ApiProperty({ description: 'Current page', _example: any)
  page: number;

  @ApiProperty({ description: 'Items per page', _example: any)
  limit: number;

  @ApiProperty({ description: 'Total pages', _example: any)
  totalPages: number;
}

export class OnboardingStatsResponseDto {
  @ApiProperty({ description: 'Total onboardings started', _example: any)
  total: number;

  @ApiProperty({ description: 'Completed onboardings', _example: any)
  completed: number;

  @ApiProperty({ description: 'Pending onboardings', _example: any)
  pending: number;

  @ApiProperty({ description: 'Rejected onboardings', _example: any)
  rejected: number;

  @ApiProperty({ description: 'Abandoned onboardings', _example: any)
  abandoned: number;

  @ApiProperty({ description: 'Expired onboardings', _example: any)
  expired: number;

  @ApiProperty({ description: 'Completion rate percentage', _example: any)
  completionRate: number;

  @ApiProperty({ description: 'Average completion time in minutes', _example: any)
  averageCompletionTime: number;

  @ApiProperty({ description: 'Average risk score', _example: any)
  averageRiskScore: number;

  @ApiProperty({ description: 'Statistics by step' })
  stepStats: Record<OnboardingStep, {
    started: number;
    completed: number;
    averageTimeMinutes: number;
  }>;

  @ApiProperty({ description: 'Statistics by agent' })
  agentStats: Array<{
    agentId: string;
    agentName: string;
    total: number;
    completed: number;
    completionRate: number;
    averageTime: number;
  }>;
}

// Query DTOs
export class OnboardingQueryDto {
  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by agent ID' })
  @IsString()
  @IsOptional()
  agentId?: string;

  @ApiPropertyOptional({ description: 'Filter by current step' })
  @IsEnum(OnboardingStep)
  @IsOptional()
  currentStep?: OnboardingStep;

  @ApiPropertyOptional({ description: 'Filter by date from (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by date to (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Search by customer name or phone' })
  @IsString()
  @IsOptional()
  @Length(2, 100)
  search?: string;

  @ApiPropertyOptional({ description: 'Show only expired records', _example: any)
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  expired?: boolean;

  @ApiPropertyOptional({ description: 'Page number', _example: any, minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', _example: any, minimum: 1, _maximum: any)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort by field', _example: any)
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', _example: any)
  @IsString()
  @IsOptional()
  @Matches(/^(ASC|DESC)$/i)
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}