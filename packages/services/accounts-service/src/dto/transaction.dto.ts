import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, IsArray, ValidateNested, Min, Max, Length, Matches, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TransactionType, TransactionChannel, TransactionPriority, AuthenticationMethod, ApprovalLevel } from '../entities/transaction.entity';

// Base Transaction DTOs
export class CreateWithdrawalRequestDto {
  @ApiProperty({ description: 'Customer ID', _example: any)
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Account ID', _example: any)
  @IsString()
  accountId: string;

  @ApiProperty({ description: 'Withdrawal amount', _example: any, minimum: 1 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ description: 'Currency code', _example: any, default: 'GHS' })
  @IsString()
  @IsOptional()
  @Length(3, 3)
  currency?: string = 'GHS';

  @ApiProperty({ description: 'Transaction description', _example: any)
  @IsString()
  @Length(5, 500)
  description: string;

  @ApiPropertyOptional({ description: 'Transaction channel', _enum: any, example: TransactionChannel.AGENT_MOBILE })
  @IsEnum(TransactionChannel)
  @IsOptional()
  channel?: TransactionChannel = TransactionChannel.AGENT_MOBILE;

  @ApiPropertyOptional({ description: 'External reference', _example: any)
  @IsString()
  @IsOptional()
  @Length(1, 100)
  reference?: string;

  @ApiPropertyOptional({ description: 'Agent GPS location (lat,lng)', _example: any,-0.1870' })
  @IsString()
  @IsOptional()
  @Matches(/^-?\d+\.?\d*,-?\d+\.?\d*$/, { message: 'Location must be in format "latitude,longitude"' })
  location?: string;

  @ApiPropertyOptional({ description: 'Customer is physically present', _example: any)
  @IsBoolean()
  @IsOptional()
  customerPresent?: boolean = true;

  @ApiPropertyOptional({ description: 'Transaction priority', _enum: any, example: TransactionPriority.NORMAL })
  @IsEnum(TransactionPriority)
  @IsOptional()
  priority?: TransactionPriority = TransactionPriority.NORMAL;

  @ApiPropertyOptional({ description: 'Additional notes', _example: any)
  @IsString()
  @IsOptional()
  @Length(1, 1000)
  notes?: string;
}

export class CustomerVerificationDto {
  @ApiProperty({ description: 'Verification method', _enum: any, example: AuthenticationMethod.PIN })
  @IsEnum(AuthenticationMethod)
  method: AuthenticationMethod;

  @ApiPropertyOptional({ description: 'PIN verification result', _example: any)
  @IsBoolean()
  @IsOptional()
  pinVerified?: boolean;

  @ApiPropertyOptional({ description: 'OTP verification result', _example: any)
  @IsBoolean()
  @IsOptional()
  otpVerified?: boolean;

  @ApiPropertyOptional({ description: 'Biometric verification result', _example: any)
  @IsBoolean()
  @IsOptional()
  biometricVerified?: boolean;

  @ApiPropertyOptional({ description: 'Biometric hash for verification' })
  @IsString()
  @IsOptional()
  biometricHash?: string;

  @ApiPropertyOptional({ description: 'OTP code for verification' })
  @IsString()
  @IsOptional()
  @Length(4, 8)
  otpCode?: string;

  @ApiPropertyOptional({ description: 'Additional verification data' })
  @IsOptional()
  verificationData?: Record<string, any>;
}

export class ApproveTransactionDto {
  @ApiPropertyOptional({ description: 'Approval notes', _example: any)
  @IsString()
  @IsOptional()
  @Length(1, 1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Bypass additional checks', _example: any)
  @IsBoolean()
  @IsOptional()
  bypassChecks?: boolean = false;
}

export class RejectTransactionDto {
  @ApiProperty({ description: 'Rejection reason', _example: any)
  @IsString()
  @Length(10, 1000)
  reason: string;

  @ApiPropertyOptional({ description: 'Allow resubmission?', _example: any)
  @IsBoolean()
  @IsOptional()
  allowResubmission?: boolean = true;

  @ApiPropertyOptional({ description: 'Additional rejection details' })
  @IsOptional()
  rejectionDetails?: Record<string, any>;
}

export class ProcessTransactionDto {
  @ApiPropertyOptional({ description: 'Processing notes', _example: any)
  @IsString()
  @IsOptional()
  @Length(1, 500)
  processingNotes?: string;

  @ApiPropertyOptional({ description: 'Force processing despite warnings', _example: any)
  @IsBoolean()
  @IsOptional()
  forceProcess?: boolean = false;
}

export class CancelTransactionDto {
  @ApiProperty({ description: 'Cancellation reason', _example: any)
  @IsString()
  @Length(5, 500)
  reason: string;

  @ApiPropertyOptional({ description: 'Refund fees?', _example: any)
  @IsBoolean()
  @IsOptional()
  refundFees?: boolean = true;
}

export class ReverseTransactionDto {
  @ApiProperty({ description: 'Reversal reason', _example: any)
  @IsString()
  @Length(10, 1000)
  reason: string;

  @ApiPropertyOptional({ description: 'Reversal type', _example: any)
  @IsString()
  @IsOptional()
  reversalType?: string = 'FULL';

  @ApiPropertyOptional({ description: 'Administrative override', _example: any)
  @IsBoolean()
  @IsOptional()
  adminOverride?: boolean = false;
}

export class UpdateTransactionStatusDto {
  @ApiPropertyOptional({ description: 'Status change reason', _example: any)
  @IsString()
  @IsOptional()
  @Length(1, 500)
  reason?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class HoldManagementDto {
  @ApiProperty({ description: 'Hold amount', _example: any, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  holdAmount: number;

  @ApiPropertyOptional({ description: 'Hold expiry in minutes', _example: any, minimum: 1, _maximum: any)
  @IsNumber()
  @Min(1)
  @Max(1440) // Max 24 hours
  @IsOptional()
  expiryMinutes?: number = 30;

  @ApiPropertyOptional({ description: 'Hold reference', _example: any)
  @IsString()
  @IsOptional()
  @Length(1, 100)
  holdReference?: string;

  @ApiPropertyOptional({ description: 'Hold reason', _example: any)
  @IsString()
  @IsOptional()
  @Length(1, 200)
  reason?: string;
}

// Response DTOs
export class TransactionResponseDto {
  @ApiProperty({ description: 'Transaction ID', _example: any)
  id: string;

  @ApiProperty({ description: 'Transaction number', _example: any)
  transactionNumber: string;

  @ApiProperty({ description: 'Company ID', _example: any)
  companyId: string;

  @ApiProperty({ description: 'Customer ID', _example: any)
  customerId: string;

  @ApiProperty({ description: 'Account ID', _example: any)
  accountId: string;

  @ApiProperty({ description: 'Transaction type', _enum: any)
  type: TransactionType;

  @ApiProperty({ description: 'Transaction status', _example: any)
  status: string;

  @ApiProperty({ description: 'Transaction channel', _enum: any)
  channel: TransactionChannel;

  @ApiProperty({ description: 'Transaction priority', _enum: any)
  priority: TransactionPriority;

  @ApiProperty({ description: 'Transaction amount', _example: any)
  amount: number;

  @ApiProperty({ description: 'Currency', _example: any)
  currency: string;

  @ApiProperty({ description: 'Fee amount', _example: any)
  feeAmount: number;

  @ApiProperty({ description: 'Total amount (including fees)', _example: any)
  totalAmount: number;

  @ApiProperty({ description: 'Account balance before transaction', _example: any)
  accountBalanceBefore: number;

  @ApiPropertyOptional({ description: 'Account balance after transaction', _example: any)
  accountBalanceAfter?: number;

  @ApiProperty({ description: 'Available balance before transaction', _example: any)
  availableBalanceBefore: number;

  @ApiPropertyOptional({ description: 'Available balance after transaction', _example: any)
  availableBalanceAfter?: number;

  @ApiProperty({ description: 'Transaction description' })
  description: string;

  @ApiPropertyOptional({ description: 'Transaction reference' })
  reference?: string;

  @ApiProperty({ description: 'Agent information' })
  agent: {
    id: string;
    name: string;
    phone: string;
    location?: string;
  };

  @ApiProperty({ description: 'Customer information' })
  customer: {
    id: string;
    fullName: string;
    phoneNumber: string;
    customerNumber: string;
  };

  @ApiProperty({ description: 'Account information' })
  account: {
    id: string;
    accountNumber: string;
    accountType: string;
    currency: string;
  };

  @ApiProperty({ description: 'Customer verification status' })
  verification: {
    customerPresent: boolean;
    customerVerified: boolean;
    verificationMethods: AuthenticationMethod[];
    pinVerified: boolean;
    otpVerified: boolean;
    biometricVerified: boolean;
  };

  @ApiProperty({ description: 'Approval information' })
  approval: {
    required: boolean;
    level: ApprovalLevel;
    approvedBy?: string;
    approvedAt?: string;
    rejectedBy?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    notes?: string;
  };

  @ApiProperty({ description: 'Hold information' })
  hold: {
    placed: boolean;
    amount: number;
    reference?: string;
    placedAt?: string;
    expiresAt?: string;
    releasedAt?: string;
  };

  @ApiProperty({ description: 'Risk information' })
  risk: {
    score: number;
    factors?: Array<{
      factor: string;
      score: number;
      description: string;
    }>;
    isHighRisk: boolean;
  };

  @ApiProperty({ description: 'Compliance information' })
  compliance: {
    amlCheckRequired: boolean;
    amlCheckCompleted: boolean;
    amlCheckResult?: string;
    sanctionsCheckRequired: boolean;
    sanctionsCheckCompleted: boolean;
    flags?: Array<{
      flag: string;
      severity: string;
      description: string;
    }>;
  };

  @ApiProperty({ description: 'Processing information' })
  processing: {
    scheduledAt?: string;
    processedAt?: string;
    completedAt?: string;
    processingTimeMs?: number;
    processedBy?: string;
  };

  @ApiProperty({ description: 'Receipt information' })
  receipt: {
    receiptNumber?: string;
    printed: boolean;
    printedAt?: string;
  };

  @ApiProperty({ description: 'Notification information' })
  notifications: {
    customerNotified: boolean;
    smsSent: boolean;
    emailSent: boolean;
    notificationSentAt?: string;
  };

  @ApiProperty({ description: 'Error information' })
  error?: {
    lastError?: string;
    retryCount: number;
    maxRetries: number;
  };

  @ApiProperty({ description: 'Reversal information' })
  reversal: {
    reversed: boolean;
    reversedAt?: string;
    reversedBy?: string;
    reversalReason?: string;
    isReversal: boolean;
    originalTransactionId?: string;
  };

  @ApiProperty({ description: 'Creation timestamp', _example: any)
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp', _example: any)
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Transaction notes' })
  notes?: string;
}

export class TransactionListResponseDto {
  @ApiProperty({ description: 'List of transactions', _type: any)
  transactions: TransactionResponseDto[];

  @ApiProperty({ description: 'Total count', _example: any)
  total: number;

  @ApiProperty({ description: 'Current page', _example: any)
  page: number;

  @ApiProperty({ description: 'Items per page', _example: any)
  limit: number;

  @ApiProperty({ description: 'Total pages', _example: any)
  totalPages: number;
}

export class TransactionStatsResponseDto {
  @ApiProperty({ description: 'Total transactions', _example: any)
  total: number;

  @ApiProperty({ description: 'Pending transactions', _example: any)
  pending: number;

  @ApiProperty({ description: 'Approved transactions', _example: any)
  approved: number;

  @ApiProperty({ description: 'Completed transactions', _example: any)
  completed: number;

  @ApiProperty({ description: 'Rejected transactions', _example: any)
  rejected: number;

  @ApiProperty({ description: 'Failed transactions', _example: any)
  failed: number;

  @ApiProperty({ description: 'Cancelled transactions', _example: any)
  cancelled: number;

  @ApiProperty({ description: 'Reversed transactions', _example: any)
  reversed: number;

  @ApiProperty({ description: 'Total volume', _example: any)
  totalVolume: number;

  @ApiProperty({ description: 'Average transaction amount', _example: any)
  averageAmount: number;

  @ApiProperty({ description: 'Success rate percentage', _example: any)
  successRate: number;

  @ApiProperty({ description: 'Average processing time in milliseconds', _example: any)
  averageProcessingTime: number;

  @ApiProperty({ description: 'Average risk score', _example: any)
  averageRiskScore: number;

  @ApiProperty({ description: 'Statistics by transaction type' })
  typeStats: Record<TransactionType, {
    count: number;
    volume: number;
    averageAmount: number;
    successRate: number;
  }>;

  @ApiProperty({ description: 'Statistics by status' })
  statusStats: Record<string, {
    count: number;
    percentage: number;
  }>;

  @ApiProperty({ description: 'Statistics by agent' })
  agentStats: Array<{
    agentId: string;
    agentName: string;
    transactionCount: number;
    totalVolume: number;
    successRate: number;
    averageAmount: number;
    averageProcessingTime: number;
  }>;

  @ApiProperty({ description: 'Statistics by channel' })
  channelStats: Record<TransactionChannel, {
    count: number;
    volume: number;
    successRate: number;
  }>;

  @ApiProperty({ description: 'Hourly distribution' })
  hourlyStats: Array<{
    hour: number;
    count: number;
    volume: number;
  }>;
}

export class BalanceInquiryResponseDto {
  @ApiProperty({ description: 'Account ID', _example: any)
  accountId: string;

  @ApiProperty({ description: 'Account number', _example: any)
  accountNumber: string;

  @ApiProperty({ description: 'Current balance', _example: any)
  currentBalance: number;

  @ApiProperty({ description: 'Available balance', _example: any)
  availableBalance: number;

  @ApiProperty({ description: 'Ledger balance', _example: any)
  ledgerBalance: number;

  @ApiProperty({ description: 'Pending credits', _example: any)
  pendingCredits: number;

  @ApiProperty({ description: 'Pending debits', _example: any)
  pendingDebits: number;

  @ApiProperty({ description: 'Hold amount', _example: any)
  holdAmount: number;

  @ApiProperty({ description: 'Currency', _example: any)
  currency: string;

  @ApiProperty({ description: 'Account status', _example: any)
  accountStatus: string;

  @ApiProperty({ description: 'Can transact', _example: any)
  canTransact: boolean;

  @ApiProperty({ description: 'Daily withdrawal limit', _example: any)
  dailyWithdrawalLimit: number;

  @ApiProperty({ description: 'Remaining daily limit', _example: any)
  remainingDailyLimit: number;

  @ApiProperty({ description: 'Transaction limits' })
  limits: {
    dailyWithdrawal: number;
    dailyDeposit: number;
    monthlyTransaction: number;
    remainingDaily: number;
    remainingMonthly: number;
  };

  @ApiProperty({ description: 'Last transaction date', _example: any)
  lastTransactionDate?: string;

  @ApiProperty({ description: 'Balance as of timestamp', _example: any)
  asOfDate: string;
}

// Query DTOs
export class TransactionQueryDto {
  @ApiPropertyOptional({ description: 'Filter by transaction type', _enum: any)
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by customer ID' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Filter by account ID' })
  @IsString()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ description: 'Filter by agent ID' })
  @IsString()
  @IsOptional()
  agentId?: string;

  @ApiPropertyOptional({ description: 'Filter by channel', _enum: any)
  @IsEnum(TransactionChannel)
  @IsOptional()
  channel?: TransactionChannel;

  @ApiPropertyOptional({ description: 'Filter by minimum amount', _minimum: any)
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum amount', _minimum: any)
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Filter by date from (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by date to (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Search by transaction number, reference, or description' })
  @IsString()
  @IsOptional()
  @Length(2, 100)
  search?: string;

  @ApiPropertyOptional({ description: 'Show only high-risk transactions', _example: any)
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  highRiskOnly?: boolean;

  @ApiPropertyOptional({ description: 'Show only pending approval', _example: any)
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  pendingApproval?: boolean;

  @ApiPropertyOptional({ description: 'Show only with holds', _example: any)
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  withHolds?: boolean;

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

export class BulkTransactionActionDto {
  @ApiProperty({ description: 'Transaction IDs to process', _type: any)
  @IsArray()
  @IsString({ each: true })
  transactionIds: string[];

  @ApiProperty({ description: 'Action to perform', _example: any)
  @IsString()
  @Length(1, 50)
  action: string;

  @ApiPropertyOptional({ description: 'Action reason or notes' })
  @IsString()
  @IsOptional()
  @Length(1, 1000)
  reason?: string;

  @ApiPropertyOptional({ description: 'Additional action parameters' })
  @IsOptional()
  parameters?: Record<string, any>;
}

export class TransactionReceiptDto {
  @ApiProperty({ description: 'Receipt number', _example: any)
  receiptNumber: string;

  @ApiProperty({ description: 'Transaction details for receipt' })
  transaction: {
    transactionNumber: string;
    type: string;
    amount: number;
    currency: string;
    feeAmount: number;
    totalAmount: number;
    description: string;
    completedAt: string;
  };

  @ApiProperty({ description: 'Customer details for receipt' })
  customer: {
    fullName: string;
    phoneNumber: string;
    customerNumber: string;
  };

  @ApiProperty({ description: 'Account details for receipt' })
  account: {
    accountNumber: string;
    accountType: string;
    balanceAfter: number;
  };

  @ApiProperty({ description: 'Agent details for receipt' })
  agent: {
    name: string;
    phone: string;
    location?: string;
  };

  @ApiProperty({ description: 'Receipt generation timestamp' })
  generatedAt: string;

  @ApiProperty({ description: 'Receipt format preferences' })
  format?: {
    includeQrCode: boolean;
    includeLogo: boolean;
    paperSize: string;
  };
}