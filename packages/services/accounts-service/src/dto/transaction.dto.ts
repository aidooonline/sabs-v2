import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, IsArray, ValidateNested, Min, Max, Length, Matches, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TransactionType, TransactionChannel, TransactionPriority, AuthenticationMethod, ApprovalLevel } from '../entities/transaction.entity';

// Base Transaction DTOs
export class CreateWithdrawalRequestDto {
  @ApiProperty({ description: 'Customer ID', example: 'uuid-string' })
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Account ID', example: 'uuid-string' })
  @IsString()
  accountId: string;

  @ApiProperty({ description: 'Withdrawal amount', example: 500.00, minimum: 1 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ description: 'Currency code', example: 'GHS', default: 'GHS' })
  @IsString()
  @IsOptional()
  @Length(3, 3)
  currency?: string = 'GHS';

  @ApiProperty({ description: 'Transaction description', example: 'Cash withdrawal at agent location' })
  @IsString()
  @Length(5, 500)
  description: string;

  @ApiPropertyOptional({ description: 'Transaction channel', enum: TransactionChannel, example: TransactionChannel.AGENT_MOBILE })
  @IsEnum(TransactionChannel)
  @IsOptional()
  channel?: TransactionChannel = TransactionChannel.AGENT_MOBILE;

  @ApiPropertyOptional({ description: 'External reference', example: 'REF123456789' })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  reference?: string;

  @ApiPropertyOptional({ description: 'Agent GPS location (lat,lng)', example: '5.6037,-0.1870' })
  @IsString()
  @IsOptional()
  @Matches(/^-?\d+\.?\d*,-?\d+\.?\d*$/, { message: 'Location must be in format "latitude,longitude"' })
  location?: string;

  @ApiPropertyOptional({ description: 'Customer is physically present', example: true })
  @IsBoolean()
  @IsOptional()
  customerPresent?: boolean = true;

  @ApiPropertyOptional({ description: 'Transaction priority', enum: TransactionPriority, example: TransactionPriority.NORMAL })
  @IsEnum(TransactionPriority)
  @IsOptional()
  priority?: TransactionPriority = TransactionPriority.NORMAL;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Customer requested smaller denominations' })
  @IsString()
  @IsOptional()
  @Length(1, 1000)
  notes?: string;
}

export class CustomerVerificationDto {
  @ApiProperty({ description: 'Verification method', enum: AuthenticationMethod, example: AuthenticationMethod.PIN })
  @IsEnum(AuthenticationMethod)
  method: AuthenticationMethod;

  @ApiPropertyOptional({ description: 'PIN verification result', example: true })
  @IsBoolean()
  @IsOptional()
  pinVerified?: boolean;

  @ApiPropertyOptional({ description: 'OTP verification result', example: true })
  @IsBoolean()
  @IsOptional()
  otpVerified?: boolean;

  @ApiPropertyOptional({ description: 'Biometric verification result', example: true })
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
  @ApiPropertyOptional({ description: 'Approval notes', example: 'Transaction verified and approved after customer identity confirmation' })
  @IsString()
  @IsOptional()
  @Length(1, 1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Bypass additional checks', example: false })
  @IsBoolean()
  @IsOptional()
  bypassChecks?: boolean = false;
}

export class RejectTransactionDto {
  @ApiProperty({ description: 'Rejection reason', example: 'Insufficient customer verification documents' })
  @IsString()
  @Length(10, 1000)
  reason: string;

  @ApiPropertyOptional({ description: 'Allow resubmission?', example: true })
  @IsBoolean()
  @IsOptional()
  allowResubmission?: boolean = true;

  @ApiPropertyOptional({ description: 'Additional rejection details' })
  @IsOptional()
  rejectionDetails?: Record<string, any>;
}

export class ProcessTransactionDto {
  @ApiPropertyOptional({ description: 'Processing notes', example: 'Cash dispensed to customer' })
  @IsString()
  @IsOptional()
  @Length(1, 500)
  processingNotes?: string;

  @ApiPropertyOptional({ description: 'Force processing despite warnings', example: false })
  @IsBoolean()
  @IsOptional()
  forceProcess?: boolean = false;
}

export class CancelTransactionDto {
  @ApiProperty({ description: 'Cancellation reason', example: 'Customer changed mind' })
  @IsString()
  @Length(5, 500)
  reason: string;

  @ApiPropertyOptional({ description: 'Refund fees?', example: true })
  @IsBoolean()
  @IsOptional()
  refundFees?: boolean = true;
}

export class ReverseTransactionDto {
  @ApiProperty({ description: 'Reversal reason', example: 'Duplicate transaction processed in error' })
  @IsString()
  @Length(10, 1000)
  reason: string;

  @ApiPropertyOptional({ description: 'Reversal type', example: 'FULL' })
  @IsString()
  @IsOptional()
  reversalType?: string = 'FULL';

  @ApiPropertyOptional({ description: 'Administrative override', example: false })
  @IsBoolean()
  @IsOptional()
  adminOverride?: boolean = false;
}

export class UpdateTransactionStatusDto {
  @ApiPropertyOptional({ description: 'Status change reason', example: 'System maintenance hold' })
  @IsString()
  @IsOptional()
  @Length(1, 500)
  reason?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class HoldManagementDto {
  @ApiProperty({ description: 'Hold amount', example: 500.00, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  holdAmount: number;

  @ApiPropertyOptional({ description: 'Hold expiry in minutes', example: 30, minimum: 1, maximum: 1440 })
  @IsNumber()
  @Min(1)
  @Max(1440) // Max 24 hours
  @IsOptional()
  expiryMinutes?: number = 30;

  @ApiPropertyOptional({ description: 'Hold reference', example: 'AGENT-HOLD-001' })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  holdReference?: string;

  @ApiPropertyOptional({ description: 'Hold reason', example: 'Pending customer verification' })
  @IsString()
  @IsOptional()
  @Length(1, 200)
  reason?: string;
}

// Response DTOs
export class TransactionResponseDto {
  @ApiProperty({ description: 'Transaction ID', example: 'uuid-string' })
  id: string;

  @ApiProperty({ description: 'Transaction number', example: 'TXN1234567890' })
  transactionNumber: string;

  @ApiProperty({ description: 'Company ID', example: 'uuid-string' })
  companyId: string;

  @ApiProperty({ description: 'Customer ID', example: 'uuid-string' })
  customerId: string;

  @ApiProperty({ description: 'Account ID', example: 'uuid-string' })
  accountId: string;

  @ApiProperty({ description: 'Transaction type', enum: TransactionType })
  type: TransactionType;

  @ApiProperty({ description: 'Transaction status', example: 'pending' })
  status: string;

  @ApiProperty({ description: 'Transaction channel', enum: TransactionChannel })
  channel: TransactionChannel;

  @ApiProperty({ description: 'Transaction priority', enum: TransactionPriority })
  priority: TransactionPriority;

  @ApiProperty({ description: 'Transaction amount', example: 500.00 })
  amount: number;

  @ApiProperty({ description: 'Currency', example: 'GHS' })
  currency: string;

  @ApiProperty({ description: 'Fee amount', example: 5.00 })
  feeAmount: number;

  @ApiProperty({ description: 'Total amount (including fees)', example: 505.00 })
  totalAmount: number;

  @ApiProperty({ description: 'Account balance before transaction', example: 1500.00 })
  accountBalanceBefore: number;

  @ApiPropertyOptional({ description: 'Account balance after transaction', example: 995.00 })
  accountBalanceAfter?: number;

  @ApiProperty({ description: 'Available balance before transaction', example: 1500.00 })
  availableBalanceBefore: number;

  @ApiPropertyOptional({ description: 'Available balance after transaction', example: 995.00 })
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

  @ApiProperty({ description: 'Creation timestamp', example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp', example: '2024-01-15T10:35:00Z' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Transaction notes' })
  notes?: string;
}

export class TransactionListResponseDto {
  @ApiProperty({ description: 'List of transactions', type: [TransactionResponseDto] })
  transactions: TransactionResponseDto[];

  @ApiProperty({ description: 'Total count', example: 250 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total pages', example: 13 })
  totalPages: number;
}

export class TransactionStatsResponseDto {
  @ApiProperty({ description: 'Total transactions', example: 1250 })
  total: number;

  @ApiProperty({ description: 'Pending transactions', example: 45 })
  pending: number;

  @ApiProperty({ description: 'Approved transactions', example: 1100 })
  approved: number;

  @ApiProperty({ description: 'Completed transactions', example: 1050 })
  completed: number;

  @ApiProperty({ description: 'Rejected transactions', example: 25 })
  rejected: number;

  @ApiProperty({ description: 'Failed transactions', example: 15 })
  failed: number;

  @ApiProperty({ description: 'Cancelled transactions', example: 10 })
  cancelled: number;

  @ApiProperty({ description: 'Reversed transactions', example: 5 })
  reversed: number;

  @ApiProperty({ description: 'Total volume', example: 567500.00 })
  totalVolume: number;

  @ApiProperty({ description: 'Average transaction amount', example: 454.00 })
  averageAmount: number;

  @ApiProperty({ description: 'Success rate percentage', example: 92.5 })
  successRate: number;

  @ApiProperty({ description: 'Average processing time in milliseconds', example: 2500 })
  averageProcessingTime: number;

  @ApiProperty({ description: 'Average risk score', example: 35.5 })
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
  @ApiProperty({ description: 'Account ID', example: 'uuid-string' })
  accountId: string;

  @ApiProperty({ description: 'Account number', example: 'ACC1234567890' })
  accountNumber: string;

  @ApiProperty({ description: 'Current balance', example: 1500.00 })
  currentBalance: number;

  @ApiProperty({ description: 'Available balance', example: 1450.00 })
  availableBalance: number;

  @ApiProperty({ description: 'Ledger balance', example: 1500.00 })
  ledgerBalance: number;

  @ApiProperty({ description: 'Pending credits', example: 0.00 })
  pendingCredits: number;

  @ApiProperty({ description: 'Pending debits', example: 50.00 })
  pendingDebits: number;

  @ApiProperty({ description: 'Hold amount', example: 50.00 })
  holdAmount: number;

  @ApiProperty({ description: 'Currency', example: 'GHS' })
  currency: string;

  @ApiProperty({ description: 'Account status', example: 'active' })
  accountStatus: string;

  @ApiProperty({ description: 'Can transact', example: true })
  canTransact: boolean;

  @ApiProperty({ description: 'Daily withdrawal limit', example: 2000.00 })
  dailyWithdrawalLimit: number;

  @ApiProperty({ description: 'Remaining daily limit', example: 1500.00 })
  remainingDailyLimit: number;

  @ApiProperty({ description: 'Transaction limits' })
  limits: {
    dailyWithdrawal: number;
    dailyDeposit: number;
    monthlyTransaction: number;
    remainingDaily: number;
    remainingMonthly: number;
  };

  @ApiProperty({ description: 'Last transaction date', example: '2024-01-15T10:30:00Z' })
  lastTransactionDate?: string;

  @ApiProperty({ description: 'Balance as of timestamp', example: '2024-01-15T10:30:00Z' })
  asOfDate: string;
}

// Query DTOs
export class TransactionQueryDto {
  @ApiPropertyOptional({ description: 'Filter by transaction type', enum: TransactionType })
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

  @ApiPropertyOptional({ description: 'Filter by channel', enum: TransactionChannel })
  @IsEnum(TransactionChannel)
  @IsOptional()
  channel?: TransactionChannel;

  @ApiPropertyOptional({ description: 'Filter by minimum amount', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum amount', minimum: 0 })
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

  @ApiPropertyOptional({ description: 'Show only high-risk transactions', example: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  highRiskOnly?: boolean;

  @ApiPropertyOptional({ description: 'Show only pending approval', example: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  pendingApproval?: boolean;

  @ApiPropertyOptional({ description: 'Show only with holds', example: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  withHolds?: boolean;

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

export class BulkTransactionActionDto {
  @ApiProperty({ description: 'Transaction IDs to process', type: [String] })
  @IsArray()
  @IsString({ each: true })
  transactionIds: string[];

  @ApiProperty({ description: 'Action to perform', example: 'approve' })
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
  @ApiProperty({ description: 'Receipt number', example: 'RCP1234567890' })
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