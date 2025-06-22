import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  ValidationPipe,
  BadRequestException,
  Logger,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

import {
  MobileTransactionService,
  MobileTransaction,
  TransactionType,
  TransactionCategory,
  TransactionStatus,
  TransactionPriority,
  VerificationMethod,
  BillServiceType,
  MobileNetwork,
  RecurringFrequency,
  FraudAlertType,
  InitiateTransferRequest,
  BillPaymentRequest,
  AirtimePurchaseRequest,
  VerifyTransactionRequest,
  BeneficiaryInfo,
  BillInfo,
  AirtimeInfo,
  RecurringInfo,
  GeolocationData,
} from '../services/mobile-transaction.service';

// ===== REQUEST DTOs =====

export class InitiateTransferDto {
  fromAccountId: string;
  toAccountId?: string;
  beneficiaryInfo?: {
    accountNumber?: string;
    bankCode?: string;
    name: string;
    phoneNumber?: string;
    email?: string;
    relationship?: string;
    isFrequent: boolean;
  };
  amount: number;
  description: string;
  priority?: TransactionPriority = TransactionPriority.NORMAL;
  scheduledAt?: string; // ISO string
  recurring?: {
    isRecurring: boolean;
    frequency: RecurringFrequency;
    startDate: string;
    endDate?: string;
    maxOccurrences?: number;
  };
  verificationMethod?: VerificationMethod;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export class BillPaymentDto {
  fromAccountId: string;
  billInfo: {
    provider: string;
    serviceType: BillServiceType;
    accountNumber: string;
    customerName?: string;
    dueDate?: string;
    billAmount?: number;
    billReference?: string;
  };
  amount: number;
  description?: string;
  scheduledAt?: string;
  recurring?: {
    isRecurring: boolean;
    frequency: RecurringFrequency;
    startDate: string;
    endDate?: string;
    maxOccurrences?: number;
  };
  verificationMethod?: VerificationMethod;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export class AirtimePurchaseDto {
  fromAccountId: string;
  airtimeInfo: {
    network: MobileNetwork;
    phoneNumber: string;
    recipientName?: string;
    isOwnNumber: boolean;
  };
  amount: number;
  description?: string;
  verificationMethod?: VerificationMethod;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export class VerifyTransactionDto {
  transactionId: string;
  method: VerificationMethod;
  value: string; // PIN, OTP, biometric data, etc.
  deviceInfo?: Record<string, any>;
}

export class TransactionFiltersDto {
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
  limit?: number = 20;
  offset?: number = 0;
}

export class BeneficiaryDto {
  accountNumber?: string;
  bankCode?: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  relationship?: string;
  nickname?: string;
}

// ===== RESPONSE DTOs =====

export class TransactionInitiationResponseDto {
  transactionId: string;
  status: TransactionStatus;
  verificationRequired: boolean;
  estimatedFee: number;
  estimatedTime: string;
  reference: string;
  message: string;
}

export class BillPaymentResponseDto {
  transactionId: string;
  status: TransactionStatus;
  verificationRequired: boolean;
  billDetails: any;
  estimatedFee: number;
  reference: string;
  message: string;
}

export class AirtimeResponseDto {
  transactionId: string;
  status: TransactionStatus;
  verificationRequired: boolean;
  networkInfo: any;
  estimatedFee: number;
  reference: string;
  message: string;
}

export class VerificationResponseDto {
  success: boolean;
  status: TransactionStatus;
  message: string;
  remainingAttempts: number;
}

export class TransactionStatusResponseDto {
  transaction: MobileTransaction;
  statusHistory: any[];
  estimatedCompletion?: Date;
  progressPercentage: number;
}

export class TransactionListResponseDto {
  transactions: MobileTransaction[];
  total: number;
  summary: {
    totalAmount: number;
    totalFees: number;
    completedCount: number;
    pendingCount: number;
  };
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class ReceiptResponseDto {
  receiptId: string;
  receiptNumber: string;
  content: string;
  format: string;
  downloadUrl?: string;
}

export class TransactionLimitsResponseDto {
  limits: Array<{
    type: TransactionType;
    dailyLimit: number;
    monthlyLimit: number;
    singleTransactionLimit: number;
    dailyUsed: number;
    monthlyUsed: number;
    dailyRemaining: number;
    monthlyRemaining: number;
    utilizationPercentage: number;
  }>;
  globalLimits: {
    maxDailyTransactions: number;
    currentDailyTransactions: number;
  };
}

@ApiTags('Mobile Transactions')
@Controller('mobile-transactions')
export class MobileTransactionController {
  private readonly logger = new Logger(MobileTransactionController.name);

  constructor(private readonly transactionService: MobileTransactionService) {}

  // ===== MONEY TRANSFER ENDPOINTS =====

  @Post('transfers')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate money transfer' })
  @ApiResponse({ status: 201, description: 'Transfer initiated successfully', type: TransactionInitiationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid transfer request' })
  @ApiResponse({ status: 403, description: 'Transaction limit exceeded' })
  async initiateTransfer(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) transferDto: InitiateTransferDto,
  ): Promise<TransactionInitiationResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    this.logger.log(`Transfer request: ${customerId} -> GHS ${transferDto.amount}`);

    const request: InitiateTransferRequest = {
      fromAccountId: transferDto.fromAccountId,
      toAccountId: transferDto.toAccountId,
      beneficiaryInfo: transferDto.beneficiaryInfo as BeneficiaryInfo,
      amount: transferDto.amount,
      description: transferDto.description,
      priority: transferDto.priority,
      scheduledAt: transferDto.scheduledAt ? new Date(transferDto.scheduledAt) : undefined,
      recurring: transferDto.recurring ? {
        ...transferDto.recurring,
        startDate: new Date(transferDto.recurring.startDate),
        endDate: transferDto.recurring.endDate ? new Date(transferDto.recurring.endDate) : undefined,
        currentOccurrence: 0,
        isActive: true,
      } as RecurringInfo : undefined,
      verificationMethod: transferDto.verificationMethod,
      location: transferDto.location as GeolocationData,
    };

    const result = await this.transactionService.initiateTransfer(customerId, request);

    return {
      ...result,
      message: 'Transfer initiated successfully',
    };
  }

  @Get('transfers/beneficiaries')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get frequent beneficiaries' })
  @ApiResponse({ status: 200, description: 'Beneficiaries retrieved' })
  async getFrequentBeneficiaries(
    @Headers('authorization') authorization: string,
  ): Promise<{
    beneficiaries: Array<{
      id: string;
      name: string;
      accountNumber?: string;
      bankCode?: string;
      phoneNumber?: string;
      relationship?: string;
      lastUsed: Date;
      frequency: number;
    }>;
  }> {
    // Mock beneficiaries data
    return {
      beneficiaries: [
        {
          id: 'ben_001',
          name: 'John Doe',
          accountNumber: '1234567890',
          bankCode: 'GCB',
          phoneNumber: '+233244123456',
          relationship: 'friend',
          lastUsed: new Date(),
          frequency: 15,
        },
        {
          id: 'ben_002',
          name: 'Jane Smith',
          phoneNumber: '+233554987654',
          relationship: 'family',
          lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          frequency: 8,
        },
      ],
    };
  }

  @Post('transfers/beneficiaries')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add new beneficiary' })
  @ApiResponse({ status: 201, description: 'Beneficiary added successfully' })
  async addBeneficiary(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) beneficiaryDto: BeneficiaryDto,
  ): Promise<{ success: boolean; beneficiaryId: string; message: string }> {
    const customerId = await this.extractCustomerId(authorization);
    
    // Mock beneficiary creation
    const beneficiaryId = `ben_${Date.now()}`;
    
    this.logger.log(`Adding beneficiary for customer ${customerId}: ${beneficiaryDto.name}`);
    
    return {
      success: true,
      beneficiaryId,
      message: 'Beneficiary added successfully',
    };
  }

  // ===== BILL PAYMENT ENDPOINTS =====

  @Post('bills')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pay bill' })
  @ApiResponse({ status: 201, description: 'Bill payment initiated', type: BillPaymentResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid bill payment request' })
  async payBill(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) billDto: BillPaymentDto,
  ): Promise<BillPaymentResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    this.logger.log(`Bill payment request: ${customerId} -> ${billDto.billInfo.provider}`);

    const request: BillPaymentRequest = {
      fromAccountId: billDto.fromAccountId,
      billInfo: {
        ...billDto.billInfo,
        dueDate: billDto.billInfo.dueDate ? new Date(billDto.billInfo.dueDate) : undefined,
      } as BillInfo,
      amount: billDto.amount,
      description: billDto.description,
      scheduledAt: billDto.scheduledAt ? new Date(billDto.scheduledAt) : undefined,
      recurring: billDto.recurring ? {
        ...billDto.recurring,
        startDate: new Date(billDto.recurring.startDate),
        endDate: billDto.recurring.endDate ? new Date(billDto.recurring.endDate) : undefined,
        currentOccurrence: 0,
        isActive: true,
      } as RecurringInfo : undefined,
      verificationMethod: billDto.verificationMethod,
      location: billDto.location as GeolocationData,
    };

    const result = await this.transactionService.initiateBillPayment(customerId, request);

    return {
      ...result,
      message: 'Bill payment initiated successfully',
    };
  }

  @Get('bills/providers')
  @ApiOperation({ summary: 'Get bill payment providers' })
  @ApiResponse({ status: 200, description: 'Providers retrieved' })
  async getBillProviders(): Promise<{
    providers: Array<{
      id: string;
      name: string;
      serviceType: BillServiceType;
      logo?: string;
      isPopular: boolean;
      processingTime: string;
      fee: number;
    }>;
  }> {
    return {
      providers: [
        {
          id: 'ecg',
          name: 'Electricity Company of Ghana',
          serviceType: BillServiceType.ELECTRICITY,
          logo: '/logos/ecg.png',
          isPopular: true,
          processingTime: 'Instant',
          fee: 2.0,
        },
        {
          id: 'gwcl',
          name: 'Ghana Water Company Limited',
          serviceType: BillServiceType.WATER,
          logo: '/logos/gwcl.png',
          isPopular: true,
          processingTime: '1-3 minutes',
          fee: 2.0,
        },
        {
          id: 'vodafone',
          name: 'Vodafone Ghana',
          serviceType: BillServiceType.INTERNET,
          logo: '/logos/vodafone.png',
          isPopular: true,
          processingTime: 'Instant',
          fee: 1.0,
        },
        {
          id: 'dstv',
          name: 'DStv Ghana',
          serviceType: BillServiceType.CABLE_TV,
          logo: '/logos/dstv.png',
          isPopular: true,
          processingTime: 'Instant',
          fee: 1.5,
        },
      ],
    };
  }

  @Post('bills/validate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate bill information' })
  @ApiResponse({ status: 200, description: 'Bill information validated' })
  async validateBillInfo(
    @Headers('authorization') authorization: string,
    @Body() billInfo: { provider: string; accountNumber: string; serviceType: BillServiceType },
  ): Promise<{
    valid: boolean;
    customerName?: string;
    dueAmount?: number;
    dueDate?: Date;
    accountStatus?: string;
    message: string;
  }> {
    // Mock bill validation
    if (billInfo.accountNumber && billInfo.accountNumber.length >= 8) {
      return {
        valid: true,
        customerName: 'John Doe',
        dueAmount: 150.50,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        accountStatus: 'active',
        message: 'Bill information is valid',
      };
    }

    return {
      valid: false,
      message: 'Invalid account number or account not found',
    };
  }

  // ===== AIRTIME PURCHASE ENDPOINTS =====

  @Post('airtime')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Purchase airtime' })
  @ApiResponse({ status: 201, description: 'Airtime purchase initiated', type: AirtimeResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid airtime request' })
  async purchaseAirtime(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) airtimeDto: AirtimePurchaseDto,
  ): Promise<AirtimeResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    this.logger.log(`Airtime purchase: ${customerId} -> ${airtimeDto.airtimeInfo.network}`);

    const request: AirtimePurchaseRequest = {
      fromAccountId: airtimeDto.fromAccountId,
      airtimeInfo: airtimeDto.airtimeInfo as AirtimeInfo,
      amount: airtimeDto.amount,
      description: airtimeDto.description,
      verificationMethod: airtimeDto.verificationMethod,
      location: airtimeDto.location as GeolocationData,
    };

    const result = await this.transactionService.purchaseAirtime(customerId, request);

    return {
      ...result,
      message: 'Airtime purchase initiated successfully',
    };
  }

  @Get('airtime/networks')
  @ApiOperation({ summary: 'Get mobile networks' })
  @ApiResponse({ status: 200, description: 'Networks retrieved' })
  async getMobileNetworks(): Promise<{
    networks: Array<{
      id: MobileNetwork;
      name: string;
      logo?: string;
      minAmount: number;
      maxAmount: number;
      denominations: number[];
      processingTime: string;
    }>;
  }> {
    return {
      networks: [
        {
          id: MobileNetwork.MTN,
          name: 'MTN Ghana',
          logo: '/logos/mtn.png',
          minAmount: 1,
          maxAmount: 500,
          denominations: [1, 2, 5, 10, 20, 50, 100],
          processingTime: 'Instant',
        },
        {
          id: MobileNetwork.VODAFONE,
          name: 'Vodafone Ghana',
          logo: '/logos/vodafone.png',
          minAmount: 1,
          maxAmount: 500,
          denominations: [1, 2, 5, 10, 20, 50, 100],
          processingTime: 'Instant',
        },
        {
          id: MobileNetwork.AIRTELTIGO,
          name: 'AirtelTigo',
          logo: '/logos/airteltigo.png',
          minAmount: 1,
          maxAmount: 500,
          denominations: [1, 2, 5, 10, 20, 50, 100],
          processingTime: 'Instant',
        },
      ],
    };
  }

  // ===== TRANSACTION VERIFICATION ENDPOINTS =====

  @Post('verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify transaction' })
  @ApiResponse({ status: 200, description: 'Transaction verified', type: VerificationResponseDto })
  @ApiResponse({ status: 400, description: 'Verification failed' })
  async verifyTransaction(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) verifyDto: VerifyTransactionDto,
  ): Promise<VerificationResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    const request: VerifyTransactionRequest = {
      transactionId: verifyDto.transactionId,
      method: verifyDto.method,
      value: verifyDto.value,
      deviceInfo: verifyDto.deviceInfo,
    };

    return await this.transactionService.verifyTransaction(customerId, request);
  }

  @Post(':transactionId/resend-otp')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend OTP for transaction verification' })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'OTP resent successfully' })
  async resendOTP(
    @Headers('authorization') authorization: string,
    @Param('transactionId') transactionId: string,
    @Body() body: { method: VerificationMethod },
  ): Promise<{ success: boolean; expiresIn: number; message: string }> {
    const customerId = await this.extractCustomerId(authorization);
    
    // Mock OTP resend
    this.logger.log(`Resending OTP for transaction ${transactionId}, method: ${body.method}`);
    
    return {
      success: true,
      expiresIn: 300, // 5 minutes
      message: 'OTP sent successfully',
    };
  }

  // ===== TRANSACTION STATUS & TRACKING ENDPOINTS =====

  @Get(':transactionId/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get transaction status' })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Transaction status retrieved', type: TransactionStatusResponseDto })
  async getTransactionStatus(
    @Headers('authorization') authorization: string,
    @Param('transactionId') transactionId: string,
  ): Promise<TransactionStatusResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    const result = await this.transactionService.getTransactionStatus(customerId, transactionId);
    
    // Calculate progress percentage
    const progressPercentage = this.calculateProgressPercentage(result.transaction.status);
    
    return {
      ...result,
      progressPercentage,
    };
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer transactions' })
  @ApiQuery({ name: 'type', required: false, enum: TransactionType })
  @ApiQuery({ name: 'status', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Transactions retrieved', type: TransactionListResponseDto })
  async getTransactions(
    @Headers('authorization') authorization: string,
    @Query() filters: TransactionFiltersDto,
  ): Promise<TransactionListResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    const filterParams = {
      type: filters.type,
      status: filters.status,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      limit: Math.min(filters.limit || 20, 100),
      offset: filters.offset || 0,
    };

    const result = await this.transactionService.getCustomerTransactions(customerId, filterParams);
    
    const totalPages = Math.ceil(result.total / filterParams.limit);
    const currentPage = Math.floor(filterParams.offset / filterParams.limit) + 1;

    return {
      ...result,
      pagination: {
        page: currentPage,
        limit: filterParams.limit,
        totalPages,
      },
    };
  }

  @Put(':transactionId/cancel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel transaction' })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Transaction cancelled successfully' })
  async cancelTransaction(
    @Headers('authorization') authorization: string,
    @Param('transactionId') transactionId: string,
  ): Promise<{ success: boolean; message: string }> {
    const customerId = await this.extractCustomerId(authorization);
    
    // Mock transaction cancellation
    this.logger.log(`Cancelling transaction ${transactionId} for customer ${customerId}`);
    
    return {
      success: true,
      message: 'Transaction cancelled successfully',
    };
  }

  // ===== RECEIPT GENERATION ENDPOINTS =====

  @Get(':transactionId/receipt')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate transaction receipt' })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
  @ApiQuery({ name: 'format', required: false, enum: ['html', 'pdf', 'json'] })
  @ApiResponse({ status: 200, description: 'Receipt generated', type: ReceiptResponseDto })
  async generateReceipt(
    @Headers('authorization') authorization: string,
    @Param('transactionId') transactionId: string,
    @Query('format') format: 'html' | 'pdf' | 'json' = 'html',
  ): Promise<ReceiptResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    const result = await this.transactionService.generateReceipt(customerId, transactionId, format);
    
    return {
      ...result,
      downloadUrl: `/mobile-transactions/${transactionId}/receipt/download?format=${format}`,
    };
  }

  @Post(':transactionId/receipt/share')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Share transaction receipt' })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Receipt shared successfully' })
  async shareReceipt(
    @Headers('authorization') authorization: string,
    @Param('transactionId') transactionId: string,
    @Body() shareInfo: { method: 'email' | 'sms'; destination: string; format?: string },
  ): Promise<{ success: boolean; message: string }> {
    const customerId = await this.extractCustomerId(authorization);
    
    // Mock receipt sharing
    this.logger.log(`Sharing receipt for transaction ${transactionId} via ${shareInfo.method} to ${shareInfo.destination}`);
    
    return {
      success: true,
      message: `Receipt shared successfully via ${shareInfo.method}`,
    };
  }

  // ===== TRANSACTION LIMITS ENDPOINTS =====

  @Get('limits')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get transaction limits' })
  @ApiResponse({ status: 200, description: 'Transaction limits retrieved', type: TransactionLimitsResponseDto })
  async getTransactionLimits(
    @Headers('authorization') authorization: string,
  ): Promise<TransactionLimitsResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    // Mock transaction limits
    const limits = [
      {
        type: TransactionType.TRANSFER,
        dailyLimit: 50000,
        monthlyLimit: 200000,
        singleTransactionLimit: 10000,
        dailyUsed: 12500,
        monthlyUsed: 45000,
        dailyRemaining: 37500,
        monthlyRemaining: 155000,
        utilizationPercentage: 25,
      },
      {
        type: TransactionType.BILL_PAYMENT,
        dailyLimit: 25000,
        monthlyLimit: 100000,
        singleTransactionLimit: 5000,
        dailyUsed: 1200,
        monthlyUsed: 8500,
        dailyRemaining: 23800,
        monthlyRemaining: 91500,
        utilizationPercentage: 8.5,
      },
      {
        type: TransactionType.AIRTIME_PURCHASE,
        dailyLimit: 1000,
        monthlyLimit: 10000,
        singleTransactionLimit: 500,
        dailyUsed: 150,
        monthlyUsed: 2100,
        dailyRemaining: 850,
        monthlyRemaining: 7900,
        utilizationPercentage: 21,
      },
    ];

    return {
      limits,
      globalLimits: {
        maxDailyTransactions: 50,
        currentDailyTransactions: 8,
      },
    };
  }

  @Put('limits')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request limit increase' })
  @ApiResponse({ status: 200, description: 'Limit increase request submitted' })
  async requestLimitIncrease(
    @Headers('authorization') authorization: string,
    @Body() request: {
      type: TransactionType;
      requestedDailyLimit?: number;
      requestedMonthlyLimit?: number;
      requestedSingleLimit?: number;
      reason: string;
    },
  ): Promise<{ success: boolean; requestId: string; message: string }> {
    const customerId = await this.extractCustomerId(authorization);
    
    // Mock limit increase request
    const requestId = `req_${Date.now()}`;
    
    this.logger.log(`Limit increase request for customer ${customerId}: ${request.type}`);
    
    return {
      success: true,
      requestId,
      message: 'Limit increase request submitted for review',
    };
  }

  // ===== RECURRING TRANSACTIONS ENDPOINTS =====

  @Get('recurring')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recurring transactions' })
  @ApiResponse({ status: 200, description: 'Recurring transactions retrieved' })
  async getRecurringTransactions(
    @Headers('authorization') authorization: string,
  ): Promise<{
    recurring: Array<{
      id: string;
      type: TransactionType;
      amount: number;
      frequency: RecurringFrequency;
      nextExecution: Date;
      isActive: boolean;
      totalExecutions: number;
      description: string;
    }>;
  }> {
    // Mock recurring transactions
    return {
      recurring: [
        {
          id: 'rec_001',
          type: TransactionType.BILL_PAYMENT,
          amount: 150,
          frequency: RecurringFrequency.MONTHLY,
          nextExecution: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          isActive: true,
          totalExecutions: 6,
          description: 'ECG Electricity Bill',
        },
        {
          id: 'rec_002',
          type: TransactionType.TRANSFER,
          amount: 500,
          frequency: RecurringFrequency.WEEKLY,
          nextExecution: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          isActive: true,
          totalExecutions: 12,
          description: 'Weekly allowance transfer',
        },
      ],
    };
  }

  @Put('recurring/:recurringId/toggle')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle recurring transaction' })
  @ApiParam({ name: 'recurringId', description: 'Recurring transaction ID' })
  @ApiResponse({ status: 200, description: 'Recurring transaction toggled' })
  async toggleRecurringTransaction(
    @Headers('authorization') authorization: string,
    @Param('recurringId') recurringId: string,
  ): Promise<{ success: boolean; isActive: boolean; message: string }> {
    const customerId = await this.extractCustomerId(authorization);
    
    // Mock toggle
    const isActive = Math.random() > 0.5;
    
    this.logger.log(`Toggling recurring transaction ${recurringId} for customer ${customerId}`);
    
    return {
      success: true,
      isActive,
      message: `Recurring transaction ${isActive ? 'activated' : 'deactivated'} successfully`,
    };
  }

  // ===== UTILITY ENDPOINTS =====

  @Get('enums')
  @ApiOperation({ summary: 'Get transaction-related enums' })
  @ApiResponse({ status: 200, description: 'Enums retrieved' })
  async getTransactionEnums(): Promise<{
    transactionTypes: TransactionType[];
    transactionCategories: TransactionCategory[];
    transactionStatuses: TransactionStatus[];
    transactionPriorities: TransactionPriority[];
    verificationMethods: VerificationMethod[];
    billServiceTypes: BillServiceType[];
    mobileNetworks: MobileNetwork[];
    recurringFrequencies: RecurringFrequency[];
    fraudAlertTypes: FraudAlertType[];
  }> {
    return {
      transactionTypes: Object.values(TransactionType),
      transactionCategories: Object.values(TransactionCategory),
      transactionStatuses: Object.values(TransactionStatus),
      transactionPriorities: Object.values(TransactionPriority),
      verificationMethods: Object.values(VerificationMethod),
      billServiceTypes: Object.values(BillServiceType),
      mobileNetworks: Object.values(MobileNetwork),
      recurringFrequencies: Object.values(RecurringFrequency),
      fraudAlertTypes: Object.values(FraudAlertType),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check transaction service health' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async getHealthStatus(): Promise<{
    status: string;
    timestamp: string;
    services: {
      transactions: string;
      verification: string;
      receipts: string;
      limits: string;
    };
  }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        transactions: 'operational',
        verification: 'operational',
        receipts: 'operational',
        limits: 'operational',
      },
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  private async extractCustomerId(authorization: string): Promise<string> {
    // Mock implementation - would validate JWT and extract customer ID
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new BadRequestException('Invalid authorization header');
    }
    
    // Mock customer ID extraction
    return 'cust_demo_001';
  }

  private calculateProgressPercentage(status: TransactionStatus): number {
    switch (status) {
      case TransactionStatus.INITIATED:
        return 10;
      case TransactionStatus.PENDING_VERIFICATION:
        return 20;
      case TransactionStatus.VERIFIED:
        return 40;
      case TransactionStatus.PROCESSING:
        return 70;
      case TransactionStatus.COMPLETED:
        return 100;
      case TransactionStatus.FAILED:
      case TransactionStatus.CANCELLED:
      case TransactionStatus.EXPIRED:
        return 0;
      default:
        return 0;
    }
  }
}