import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsPhoneNumber, IsDateString, IsEnum, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, IsObject, Min, Max, Length, Matches } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Gender, IdentificationType } from '../entities/customer.entity';
import { OnboardingChannel, OnboardingStep, DocumentType } from '../entities/customer-onboarding.entity';
import { AccountType, CurrencyCode } from '../entities/account.entity';

// Base Customer Information DTO
export class CustomerPersonalInfoDto {
  @ApiProperty({ description: 'Customer first name', example: 'John' })
  @IsString()
  @Length(2, 50)
  firstName: string;

  @ApiProperty({ description: 'Customer last name', example: 'Doe' })
  @IsString()
  @Length(2, 50)
  lastName: string;

  @ApiPropertyOptional({ description: 'Customer middle name', example: 'Michael' })
  @IsString()
  @IsOptional()
  @Length(2, 50)
  middleName?: string;

  @ApiProperty({ description: 'Customer date of birth', example: '1990-01-15' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ description: 'Customer gender', enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender: Gender;
}

export class CustomerContactInfoDto {
  @ApiProperty({ description: 'Customer phone number', example: '+233244123456' })
  @IsPhoneNumber('GH')
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Customer email address', example: 'john.doe@email.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Address line 1', example: '123 Main Street' })
  @IsString()
  @Length(5, 200)
  addressLine1: string;

  @ApiPropertyOptional({ description: 'Address line 2', example: 'Apartment 4B' })
  @IsString()
  @IsOptional()
  @Length(1, 200)
  addressLine2?: string;

  @ApiProperty({ description: 'City', example: 'Accra' })
  @IsString()
  @Length(2, 50)
  city: string;

  @ApiProperty({ description: 'Region/State', example: 'Greater Accra' })
  @IsString()
  @Length(2, 50)
  region: string;

  @ApiPropertyOptional({ description: 'Postal code', example: 'GA-123-4567' })
  @IsString()
  @IsOptional()
  @Length(3, 20)
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Country code', example: 'GHA', default: 'GHA' })
  @IsString()
  @IsOptional()
  @Length(2, 3)
  country?: string = 'GHA';
}

export class CustomerIdentificationDto {
  @ApiProperty({ description: 'Type of identification', enum: IdentificationType, example: IdentificationType.NATIONAL_ID })
  @IsEnum(IdentificationType)
  identificationType: IdentificationType;

  @ApiProperty({ description: 'Identification number', example: 'GHA-123456789-1' })
  @IsString()
  @Length(5, 50)
  identificationNumber: string;

  @ApiPropertyOptional({ description: 'Identification expiry date', example: '2030-12-31' })
  @IsDateString()
  @IsOptional()
  identificationExpiry?: string;
}

export class EmergencyContactDto {
  @ApiPropertyOptional({ description: 'Emergency contact name', example: 'Jane Doe' })
  @IsString()
  @IsOptional()
  @Length(2, 100)
  emergencyContactName?: string;

  @ApiPropertyOptional({ description: 'Emergency contact phone', example: '+233244987654' })
  @IsPhoneNumber('GH')
  @IsOptional()
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ description: 'Emergency contact relationship', example: 'Sister' })
  @IsString()
  @IsOptional()
  @Length(2, 50)
  emergencyContactRelationship?: string;
}

export class BusinessInformationDto {
  @ApiProperty({ description: 'Business name', example: 'Doe Trading Enterprise' })
  @IsString()
  @Length(2, 200)
  businessName: string;

  @ApiPropertyOptional({ description: 'Business registration number', example: 'REG-123456' })
  @IsString()
  @IsOptional()
  @Length(5, 50)
  businessRegistrationNumber?: string;

  @ApiPropertyOptional({ description: 'Business type', example: 'Sole Proprietorship' })
  @IsString()
  @IsOptional()
  @Length(2, 100)
  businessType?: string;
}

export class AccountPreferencesDto {
  @ApiProperty({ description: 'Account type', enum: AccountType, example: AccountType.SAVINGS })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiProperty({ description: 'Account name', example: 'John Doe Savings Account' })
  @IsString()
  @Length(5, 200)
  accountName: string;

  @ApiPropertyOptional({ description: 'Currency', enum: CurrencyCode, example: CurrencyCode.GHS })
  @IsEnum(CurrencyCode)
  @IsOptional()
  currency?: CurrencyCode = CurrencyCode.GHS;

  @ApiPropertyOptional({ description: 'Opening balance', example: 50.00, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  openingBalance?: number = 0;

  @ApiPropertyOptional({ description: 'Enable SMS notifications', example: true })
  @IsBoolean()
  @IsOptional()
  smsNotifications?: boolean = true;

  @ApiPropertyOptional({ description: 'Enable email notifications', example: false })
  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean = false;

  @ApiPropertyOptional({ description: 'Preferred language', example: 'en' })
  @IsString()
  @IsOptional()
  @Length(2, 10)
  preferredLanguage?: string = 'en';
}

// Main Onboarding DTOs
export class StartOnboardingDto {
  @ApiProperty({ description: 'Onboarding channel', enum: OnboardingChannel, example: OnboardingChannel.AGENT_MOBILE })
  @IsEnum(OnboardingChannel)
  channel: OnboardingChannel;

  @ApiPropertyOptional({ description: 'Agent GPS location (lat,lng)', example: '5.6037,-0.1870' })
  @IsString()
  @IsOptional()
  @Matches(/^-?\d+\.?\d*,-?\d+\.?\d*$/, { message: 'Location must be in format "latitude,longitude"' })
  location?: string;

  @ApiPropertyOptional({ description: 'Referral code', example: 'REF123456' })
  @IsString()
  @IsOptional()
  @Length(6, 20)
  referralCode?: string;

  @ApiPropertyOptional({ description: 'Initial notes', example: 'Customer referred by existing customer' })
  @IsString()
  @IsOptional()
  @Length(1, 500)
  notes?: string;
}

export class UpdatePersonalInfoDto extends CustomerPersonalInfoDto {
  @ApiPropertyOptional({ description: 'Is this a business customer?', example: false })
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
  @ApiProperty({ description: 'Document type', enum: DocumentType, example: DocumentType.IDENTIFICATION_FRONT })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({ description: 'Document file name', example: 'national_id_front.jpg' })
  @IsString()
  @Length(1, 255)
  fileName: string;

  @ApiProperty({ description: 'File size in bytes', example: 1024000 })
  @IsNumber()
  @Min(1)
  @Max(10 * 1024 * 1024) // 10MB max
  fileSize: number;

  @ApiProperty({ description: 'MIME type', example: 'image/jpeg' })
  @IsString()
  @Matches(/^(image\/(jpeg|jpg|png|gif|bmp))|(application\/pdf)$/, { message: 'Invalid file type' })
  mimeType: string;

  @ApiProperty({ description: 'Base64 encoded file content or file URL' })
  @IsString()
  content: string;
}

export class VerifyDocumentDto {
  @ApiProperty({ description: 'Document type to verify', enum: DocumentType })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({ description: 'Verification result', example: true })
  @IsBoolean()
  verified: boolean;

  @ApiPropertyOptional({ description: 'Rejection reason if not verified', example: 'Document is blurry' })
  @IsString()
  @IsOptional()
  @Length(1, 500)
  rejectionReason?: string;
}

export class SubmitOnboardingDto {
  @ApiPropertyOptional({ description: 'Final notes before submission', example: 'All documents verified, ready for approval' })
  @IsString()
  @IsOptional()
  @Length(1, 1000)
  notes?: string;
}

export class ApproveOnboardingDto {
  @ApiPropertyOptional({ description: 'Approval notes', example: 'Customer onboarding approved after verification' })
  @IsString()
  @IsOptional()
  @Length(1, 1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Create account immediately after approval', example: true })
  @IsBoolean()
  @IsOptional()
  createAccount?: boolean = true;
}

export class RejectOnboardingDto {
  @ApiProperty({ description: 'Rejection reason', example: 'Incomplete documentation' })
  @IsString()
  @Length(10, 1000)
  reason: string;

  @ApiPropertyOptional({ description: 'Allow resubmission?', example: true })
  @IsBoolean()
  @IsOptional()
  allowResubmission?: boolean = true;
}

export class UpdateOnboardingStatusDto {
  @ApiPropertyOptional({ description: 'Status change reason', example: 'Customer requested to abandon onboarding' })
  @IsString()
  @IsOptional()
  @Length(1, 500)
  reason?: string;
}

// Response DTOs
export class OnboardingStepResponseDto {
  @ApiProperty({ description: 'Step name', enum: OnboardingStep })
  step: OnboardingStep;

  @ApiProperty({ description: 'Step completed', example: true })
  completed: boolean;

  @ApiProperty({ description: 'Step completion timestamp', example: '2024-01-15T10:30:00Z' })
  completedAt?: string;

  @ApiProperty({ description: 'Can proceed to next step', example: true })
  canProceed: boolean;

  @ApiProperty({ description: 'Required data for step completion' })
  requiredData: string[];

  @ApiProperty({ description: 'Step validation errors' })
  errors: string[];
}

export class DocumentResponseDto {
  @ApiProperty({ description: 'Document type', enum: DocumentType })
  type: DocumentType;

  @ApiProperty({ description: 'File name', example: 'national_id_front.jpg' })
  fileName: string;

  @ApiProperty({ description: 'File size in bytes', example: 1024000 })
  fileSize: number;

  @ApiProperty({ description: 'Upload timestamp', example: '2024-01-15T10:30:00Z' })
  uploadedAt: string;

  @ApiProperty({ description: 'Document verified', example: true })
  verified: boolean;

  @ApiPropertyOptional({ description: 'Rejection reason if not verified' })
  rejectionReason?: string;

  @ApiProperty({ description: 'Document URL' })
  url: string;
}

export class OnboardingResponseDto {
  @ApiProperty({ description: 'Onboarding ID', example: 'uuid-string' })
  id: string;

  @ApiProperty({ description: 'Onboarding number', example: 'ONB12345678' })
  onboardingNumber: string;

  @ApiProperty({ description: 'Company ID', example: 'uuid-string' })
  companyId: string;

  @ApiPropertyOptional({ description: 'Customer ID if created', example: 'uuid-string' })
  customerId?: string;

  @ApiProperty({ description: 'Onboarding status', example: 'in_progress' })
  status: string;

  @ApiProperty({ description: 'Current step', enum: OnboardingStep })
  currentStep: OnboardingStep;

  @ApiProperty({ description: 'Progress percentage', example: 65, minimum: 0, maximum: 100 })
  progressPercentage: number;

  @ApiProperty({ description: 'Completed steps', type: [String] })
  completedSteps: OnboardingStep[];

  @ApiProperty({ description: 'Agent information' })
  agent: {
    id: string;
    name: string;
    phone: string;
  };

  @ApiProperty({ description: 'Time remaining in minutes', example: 4320 })
  timeRemaining: number;

  @ApiProperty({ description: 'Time elapsed in minutes', example: 45 })
  timeElapsed: number;

  @ApiProperty({ description: 'Is expired', example: false })
  isExpired: boolean;

  @ApiProperty({ description: 'Customer data collected so far' })
  customerData: Record<string, any>;

  @ApiProperty({ description: 'Account preferences' })
  accountPreferences: Record<string, any>;

  @ApiProperty({ description: 'Collected documents', type: [DocumentResponseDto] })
  documents: DocumentResponseDto[];

  @ApiProperty({ description: 'Risk score', example: 25, minimum: 0, maximum: 100 })
  riskScore: number;

  @ApiProperty({ description: 'KYC level', example: 1, minimum: 1, maximum: 3 })
  kycLevel: number;

  @ApiProperty({ description: 'Verification required', example: true })
  verificationRequired: boolean;

  @ApiPropertyOptional({ description: 'Verification notes' })
  verificationNotes?: string;

  @ApiPropertyOptional({ description: 'Rejection reason' })
  rejectionReason?: string;

  @ApiProperty({ description: 'Creation timestamp', example: '2024-01-15T10:00:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp', example: '2024-01-15T10:30:00Z' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Completion timestamp' })
  completedAt?: string;

  @ApiPropertyOptional({ description: 'Expiry timestamp' })
  expiresAt: string;
}

export class OnboardingListResponseDto {
  @ApiProperty({ description: 'List of onboarding records', type: [OnboardingResponseDto] })
  onboardings: OnboardingResponseDto[];

  @ApiProperty({ description: 'Total count', example: 150 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total pages', example: 8 })
  totalPages: number;
}

export class OnboardingStatsResponseDto {
  @ApiProperty({ description: 'Total onboardings started', example: 150 })
  total: number;

  @ApiProperty({ description: 'Completed onboardings', example: 120 })
  completed: number;

  @ApiProperty({ description: 'Pending onboardings', example: 20 })
  pending: number;

  @ApiProperty({ description: 'Rejected onboardings', example: 5 })
  rejected: number;

  @ApiProperty({ description: 'Abandoned onboardings', example: 3 })
  abandoned: number;

  @ApiProperty({ description: 'Expired onboardings', example: 2 })
  expired: number;

  @ApiProperty({ description: 'Completion rate percentage', example: 80.0 })
  completionRate: number;

  @ApiProperty({ description: 'Average completion time in minutes', example: 45 })
  averageCompletionTime: number;

  @ApiProperty({ description: 'Average risk score', example: 25.5 })
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

  @ApiPropertyOptional({ description: 'Show only expired records', example: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  expired?: boolean;

  @ApiPropertyOptional({ description: 'Page number', example: 1, minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 20, minimum: 1, maximum: 100 })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort by field', example: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', example: 'DESC' })
  @IsString()
  @IsOptional()
  @Matches(/^(ASC|DESC)$/i)
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}