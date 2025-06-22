import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { nanoid } from 'nanoid';

// ===== TRANSACTION ENTITIES =====

export interface MobileTransaction {
  id: string;
  customerId: string;
  fromAccountId: string;
  toAccountId?: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  currency: string;
  fee: number;
  totalAmount: number;
  description: string;
  reference: string;
  status: TransactionStatus;
  priority: TransactionPriority;
  metadata: {
    deviceId?: string;
    ipAddress?: string;
    location?: GeolocationData;
    beneficiaryInfo?: BeneficiaryInfo;
    billInfo?: BillInfo;
    airtimeInfo?: AirtimeInfo;
    recurringInfo?: RecurringInfo;
  };
  statusHistory: TransactionStatusUpdate[];
  verification: TransactionVerification;
  receipt?: TransactionReceipt;
  createdAt: Date;
  updatedAt: Date;
  scheduledAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;
}

export interface TransactionStatusUpdate {
  status: TransactionStatus;
  timestamp: Date;
  reason?: string;
  updatedBy: string;
  details?: Record<string, any>;
}

export interface TransactionVerification {
  required: boolean;
  methods: VerificationMethod[];
  attempts: VerificationAttempt[];
  verified: boolean;
  verifiedAt?: Date;
  expiresAt?: Date;
}

export interface VerificationAttempt {
  method: VerificationMethod;
  success: boolean;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface TransactionReceipt {
  id: string;
  transactionId: string;
  receiptNumber: string;
  type: 'digital' | 'email' | 'sms';
  content: string;
  format: 'html' | 'pdf' | 'json';
  generatedAt: Date;
  deliveredAt?: Date;
  metadata: Record<string, any>;
}

export interface BeneficiaryInfo {
  accountNumber?: string;
  bankCode?: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  relationship?: string;
  isFrequent: boolean;
}

export interface BillInfo {
  provider: string;
  serviceType: BillServiceType;
  accountNumber: string;
  customerName?: string;
  dueDate?: Date;
  billAmount?: number;
  billReference?: string;
}

export interface AirtimeInfo {
  network: MobileNetwork;
  phoneNumber: string;
  recipientName?: string;
  isOwnNumber: boolean;
}

export interface RecurringInfo {
  isRecurring: boolean;
  frequency: RecurringFrequency;
  startDate: Date;
  endDate?: Date;
  maxOccurrences?: number;
  currentOccurrence: number;
  nextExecutionDate?: Date;
  isActive: boolean;
}

export interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  address?: string;
}

export interface TransactionLimit {
  customerId: string;
  type: TransactionType;
  category?: TransactionCategory;
  dailyLimit: number;
  monthlyLimit: number;
  singleTransactionLimit: number;
  dailyUsed: number;
  monthlyUsed: number;
  isActive: boolean;
  updatedAt: Date;
}

export interface FraudAlert {
  id: string;
  transactionId: string;
  customerId: string;
  alertType: FraudAlertType;
  riskScore: number;
  reasons: string[];
  status: 'pending' | 'resolved' | 'escalated';
  createdAt: Date;
  resolvedAt?: Date;
}

// ===== ENUMS =====

export enum TransactionType {
  TRANSFER = 'transfer',
  BILL_PAYMENT = 'bill_payment',
  AIRTIME_PURCHASE = 'airtime_purchase',
  MERCHANT_PAYMENT = 'merchant_payment',
  P2P_TRANSFER = 'p2p_transfer',
  INTERNATIONAL_TRANSFER = 'international_transfer',
  LOAN_REPAYMENT = 'loan_repayment',
  INVESTMENT = 'investment',
}

export enum TransactionCategory {
  BANK_TRANSFER = 'bank_transfer',
  MOBILE_MONEY = 'mobile_money',
  UTILITY_BILL = 'utility_bill',
  TELECOM_BILL = 'telecom_bill',
  INSURANCE_PAYMENT = 'insurance_payment',
  SCHOOL_FEES = 'school_fees',
  GOVERNMENT_PAYMENT = 'government_payment',
  ONLINE_SHOPPING = 'online_shopping',
  FUEL_PAYMENT = 'fuel_payment',
  OTHER = 'other',
}

export enum TransactionStatus {
  INITIATED = 'initiated',
  PENDING_VERIFICATION = 'pending_verification',
  VERIFIED = 'verified',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  REVERSED = 'reversed',
  SCHEDULED = 'scheduled',
}

export enum TransactionPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum VerificationMethod {
  PIN = 'pin',
  BIOMETRIC = 'biometric',
  SMS_OTP = 'sms_otp',
  EMAIL_OTP = 'email_otp',
  SECURITY_QUESTION = 'security_question',
  TWO_FACTOR = 'two_factor',
}

export enum BillServiceType {
  ELECTRICITY = 'electricity',
  WATER = 'water',
  INTERNET = 'internet',
  CABLE_TV = 'cable_tv',
  INSURANCE = 'insurance',
  LOAN = 'loan',
  SCHOOL_FEES = 'school_fees',
  TAX = 'tax',
  OTHER = 'other',
}

export enum MobileNetwork {
  MTN = 'mtn',
  VODAFONE = 'vodafone',
  AIRTELTIGO = 'airteltigo',
  GLO = 'glo',
}

export enum RecurringFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum FraudAlertType {
  UNUSUAL_AMOUNT = 'unusual_amount',
  UNUSUAL_FREQUENCY = 'unusual_frequency',
  UNUSUAL_LOCATION = 'unusual_location',
  SUSPICIOUS_BENEFICIARY = 'suspicious_beneficiary',
  VELOCITY_CHECK = 'velocity_check',
  BLACKLIST_CHECK = 'blacklist_check',
}

// ===== REQUEST INTERFACES =====

export interface InitiateTransferRequest {
  fromAccountId: string;
  toAccountId?: string;
  beneficiaryInfo?: BeneficiaryInfo;
  amount: number;
  description: string;
  priority?: TransactionPriority;
  scheduledAt?: Date;
  recurring?: RecurringInfo;
  verificationMethod?: VerificationMethod;
  location?: GeolocationData;
}

export interface BillPaymentRequest {
  fromAccountId: string;
  billInfo: BillInfo;
  amount: number;
  description?: string;
  scheduledAt?: Date;
  recurring?: RecurringInfo;
  verificationMethod?: VerificationMethod;
  location?: GeolocationData;
}

export interface AirtimePurchaseRequest {
  fromAccountId: string;
  airtimeInfo: AirtimeInfo;
  amount: number;
  description?: string;
  verificationMethod?: VerificationMethod;
  location?: GeolocationData;
}

export interface VerifyTransactionRequest {
  transactionId: string;
  method: VerificationMethod;
  value: string; // PIN, OTP, biometric data, etc.
  deviceInfo?: Record<string, any>;
}

@Injectable()
export class MobileTransactionService {
  private readonly logger = new Logger(MobileTransactionService.name);

  // In-memory storage (would use database in production)
  private transactions: Map<string, MobileTransaction> = new Map();
  private limits: Map<string, TransactionLimit[]> = new Map();
  private fraudAlerts: Map<string, FraudAlert[]> = new Map();
  private receipts: Map<string, TransactionReceipt> = new Map();

  // Transaction configurations
  private readonly transactionConfig = {
    maxDailyTransactions: 50,
    maxSingleTransactionAmount: 10000,
    defaultTransactionFee: 2.50,
    verificationExpiry: 5 * 60 * 1000, // 5 minutes
    transactionExpiry: 30 * 60 * 1000, // 30 minutes
    fraudRiskThreshold: 70,
    maxVerificationAttempts: 3,
  };

  constructor(
    private eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.initializeTransactionLimits();
  }

  // ===== MONEY TRANSFER =====

  async initiateTransfer(customerId: string, request: InitiateTransferRequest): Promise<{
    transactionId: string;
    status: TransactionStatus;
    verificationRequired: boolean;
    estimatedFee: number;
    estimatedTime: string;
    reference: string;
  }> {
    this.logger.log(`Initiating transfer for customer ${customerId}, amount: GHS ${request.amount}`);

    try {
      // Validate request
      await this.validateTransferRequest(customerId, request);

      // Check transaction limits
      await this.checkTransactionLimits(customerId, TransactionType.TRANSFER, request.amount);

      // Calculate fees
      const fee = await this.calculateTransactionFee(TransactionType.TRANSFER, request.amount);
      const totalAmount = request.amount + fee;

      // Check account balance
      await this.validateAccountBalance(request.fromAccountId, totalAmount);

      // Create transaction record
      const transactionId = `txn_${nanoid(12)}`;
      const reference = `TXN${Date.now()}${nanoid(4).toUpperCase()}`;

      const transaction: MobileTransaction = {
        id: transactionId,
        customerId,
        fromAccountId: request.fromAccountId,
        toAccountId: request.toAccountId,
        type: TransactionType.TRANSFER,
        category: request.beneficiaryInfo?.bankCode ? TransactionCategory.BANK_TRANSFER : TransactionCategory.MOBILE_MONEY,
        amount: request.amount,
        currency: 'GHS',
        fee,
        totalAmount,
        description: request.description,
        reference,
        status: TransactionStatus.INITIATED,
        priority: request.priority || TransactionPriority.NORMAL,
        metadata: {
          beneficiaryInfo: request.beneficiaryInfo,
          location: request.location,
          recurringInfo: request.recurring,
        },
        statusHistory: [{
          status: TransactionStatus.INITIATED,
          timestamp: new Date(),
          reason: 'Transaction initiated by customer',
          updatedBy: customerId,
        }],
        verification: {
          required: this.requiresVerification(request.amount, request.priority),
          methods: this.getRequiredVerificationMethods(request.amount),
          attempts: [],
          verified: false,
          expiresAt: new Date(Date.now() + this.transactionConfig.verificationExpiry),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        scheduledAt: request.scheduledAt,
        expiresAt: new Date(Date.now() + this.transactionConfig.transactionExpiry),
      };

      // Run fraud detection
      const fraudRisk = await this.detectFraud(transaction);
      if (fraudRisk.riskScore >= this.transactionConfig.fraudRiskThreshold) {
        transaction.status = TransactionStatus.PENDING_VERIFICATION;
        transaction.verification.required = true;
        
        await this.createFraudAlert(transaction, fraudRisk);
      }

      // Store transaction
      this.transactions.set(transactionId, transaction);

      // Update transaction limits
      await this.updateTransactionLimits(customerId, TransactionType.TRANSFER, request.amount);

      // Emit transaction initiated event
      this.eventEmitter.emit('transaction.initiated', {
        transactionId,
        customerId,
        type: TransactionType.TRANSFER,
        amount: request.amount,
        status: transaction.status,
      });

      return {
        transactionId,
        status: transaction.status,
        verificationRequired: transaction.verification.required,
        estimatedFee: fee,
        estimatedTime: this.getEstimatedProcessingTime(transaction),
        reference,
      };

    } catch (error) {
      this.logger.error(`Transfer initiation failed: ${(error as Error).message}`);
      throw error;
    }
  }

  // ===== BILL PAYMENT =====

  async initiateBillPayment(customerId: string, request: BillPaymentRequest): Promise<{
    transactionId: string;
    status: TransactionStatus;
    verificationRequired: boolean;
    billDetails: any;
    estimatedFee: number;
    reference: string;
  }> {
    this.logger.log(`Initiating bill payment for customer ${customerId}, provider: ${request.billInfo.provider}`);

    try {
      // Validate bill information
      const billDetails = await this.validateBillInfo(request.billInfo);

      // Calculate fees
      const fee = await this.calculateTransactionFee(TransactionType.BILL_PAYMENT, request.amount);
      const totalAmount = request.amount + fee;

      // Check limits and balance
      await this.checkTransactionLimits(customerId, TransactionType.BILL_PAYMENT, request.amount);
      await this.validateAccountBalance(request.fromAccountId, totalAmount);

      // Create transaction
      const transactionId = `bill_${nanoid(12)}`;
      const reference = `BILL${Date.now()}${nanoid(4).toUpperCase()}`;

      const transaction: MobileTransaction = {
        id: transactionId,
        customerId,
        fromAccountId: request.fromAccountId,
        type: TransactionType.BILL_PAYMENT,
        category: this.getBillCategory(request.billInfo.serviceType),
        amount: request.amount,
        currency: 'GHS',
        fee,
        totalAmount,
        description: request.description || `${request.billInfo.serviceType} bill payment`,
        reference,
        status: TransactionStatus.INITIATED,
        priority: TransactionPriority.NORMAL,
        metadata: {
          billInfo: request.billInfo,
          location: request.location,
          recurringInfo: request.recurring,
        },
        statusHistory: [{
          status: TransactionStatus.INITIATED,
          timestamp: new Date(),
          reason: 'Bill payment initiated',
          updatedBy: customerId,
        }],
        verification: {
          required: this.requiresVerification(request.amount),
          methods: this.getRequiredVerificationMethods(request.amount),
          attempts: [],
          verified: false,
          expiresAt: new Date(Date.now() + this.transactionConfig.verificationExpiry),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        scheduledAt: request.scheduledAt,
        expiresAt: new Date(Date.now() + this.transactionConfig.transactionExpiry),
      };

      this.transactions.set(transactionId, transaction);

      // Update limits
      await this.updateTransactionLimits(customerId, TransactionType.BILL_PAYMENT, request.amount);

      // Emit event
      this.eventEmitter.emit('transaction.bill_payment_initiated', {
        transactionId,
        customerId,
        provider: request.billInfo.provider,
        amount: request.amount,
      });

      return {
        transactionId,
        status: transaction.status,
        verificationRequired: transaction.verification.required,
        billDetails,
        estimatedFee: fee,
        reference,
      };

    } catch (error) {
      this.logger.error(`Bill payment initiation failed: ${(error as Error).message}`);
      throw error;
    }
  }

  // ===== AIRTIME PURCHASE =====

  async purchaseAirtime(customerId: string, request: AirtimePurchaseRequest): Promise<{
    transactionId: string;
    status: TransactionStatus;
    verificationRequired: boolean;
    networkInfo: any;
    estimatedFee: number;
    reference: string;
  }> {
    this.logger.log(`Purchasing airtime for customer ${customerId}, network: ${request.airtimeInfo.network}`);

    try {
      // Validate airtime request
      await this.validateAirtimeRequest(request);

      // Calculate fees (lower for airtime)
      const fee = Math.min(await this.calculateTransactionFee(TransactionType.AIRTIME_PURCHASE, request.amount), 1.0);
      const totalAmount = request.amount + fee;

      // Check limits and balance
      await this.checkTransactionLimits(customerId, TransactionType.AIRTIME_PURCHASE, request.amount);
      await this.validateAccountBalance(request.fromAccountId, totalAmount);

      // Create transaction
      const transactionId = `air_${nanoid(12)}`;
      const reference = `AIR${Date.now()}${nanoid(4).toUpperCase()}`;

      const transaction: MobileTransaction = {
        id: transactionId,
        customerId,
        fromAccountId: request.fromAccountId,
        type: TransactionType.AIRTIME_PURCHASE,
        category: TransactionCategory.TELECOM_BILL,
        amount: request.amount,
        currency: 'GHS',
        fee,
        totalAmount,
        description: request.description || `${request.airtimeInfo.network} airtime purchase`,
        reference,
        status: TransactionStatus.INITIATED,
        priority: TransactionPriority.HIGH, // Airtime is usually urgent
        metadata: {
          airtimeInfo: request.airtimeInfo,
          location: request.location,
        },
        statusHistory: [{
          status: TransactionStatus.INITIATED,
          timestamp: new Date(),
          reason: 'Airtime purchase initiated',
          updatedBy: customerId,
        }],
        verification: {
          required: request.amount > 100, // Only require verification for large amounts
          methods: [VerificationMethod.PIN],
          attempts: [],
          verified: false,
          expiresAt: new Date(Date.now() + this.transactionConfig.verificationExpiry),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + this.transactionConfig.transactionExpiry),
      };

      this.transactions.set(transactionId, transaction);

      // Update limits
      await this.updateTransactionLimits(customerId, TransactionType.AIRTIME_PURCHASE, request.amount);

      // Emit event
      this.eventEmitter.emit('transaction.airtime_initiated', {
        transactionId,
        customerId,
        network: request.airtimeInfo.network,
        phoneNumber: request.airtimeInfo.phoneNumber,
        amount: request.amount,
      });

      return {
        transactionId,
        status: transaction.status,
        verificationRequired: transaction.verification.required,
        networkInfo: {
          network: request.airtimeInfo.network,
          phoneNumber: request.airtimeInfo.phoneNumber,
        },
        estimatedFee: fee,
        reference,
      };

    } catch (error) {
      this.logger.error(`Airtime purchase failed: ${(error as Error).message}`);
      throw error;
    }
  }

  // ===== TRANSACTION VERIFICATION =====

  async verifyTransaction(customerId: string, request: VerifyTransactionRequest): Promise<{
    success: boolean;
    status: TransactionStatus;
    message: string;
    remainingAttempts: number;
  }> {
    this.logger.log(`Verifying transaction ${request.transactionId} with method ${request.method}`);

    try {
      const transaction = this.transactions.get(request.transactionId);
      
      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      if (transaction.customerId !== customerId) {
        throw new ForbiddenException('Access denied');
      }

      if (transaction.status !== TransactionStatus.INITIATED && 
          transaction.status !== TransactionStatus.PENDING_VERIFICATION) {
        throw new BadRequestException('Transaction cannot be verified in current status');
      }

      if (!transaction.verification.required) {
        throw new BadRequestException('Transaction does not require verification');
      }

      if (transaction.verification.expiresAt && transaction.verification.expiresAt < new Date()) {
        await this.updateTransactionStatus(transaction.id, TransactionStatus.EXPIRED, 'Verification expired');
        throw new BadRequestException('Verification period expired');
      }

      // Check verification attempts
      const attemptCount = transaction.verification.attempts.length;
      if (attemptCount >= this.transactionConfig.maxVerificationAttempts) {
        await this.updateTransactionStatus(transaction.id, TransactionStatus.FAILED, 'Maximum verification attempts exceeded');
        throw new BadRequestException('Maximum verification attempts exceeded');
      }

      // Verify the provided value
      const verificationSuccess = await this.performVerification(
        request.method,
        request.value,
        customerId,
        transaction
      );

      // Record verification attempt
      transaction.verification.attempts.push({
        method: request.method,
        success: verificationSuccess,
        timestamp: new Date(),
        metadata: request.deviceInfo,
      });

      if (verificationSuccess) {
        transaction.verification.verified = true;
        transaction.verification.verifiedAt = new Date();
        
        // Move to processing
        await this.updateTransactionStatus(transaction.id, TransactionStatus.VERIFIED, 'Transaction verified successfully');
        
        // Start processing
        await this.processTransaction(transaction.id);

        return {
          success: true,
          status: TransactionStatus.PROCESSING,
          message: 'Transaction verified and processing started',
          remainingAttempts: 0,
        };
      } else {
        const remainingAttempts = this.transactionConfig.maxVerificationAttempts - (attemptCount + 1);
        
        return {
          success: false,
          status: transaction.status,
          message: 'Verification failed. Please try again.',
          remainingAttempts,
        };
      }

    } catch (error) {
      this.logger.error(`Transaction verification failed: ${(error as Error).message}`);
      throw error;
    }
  }

  // ===== TRANSACTION STATUS TRACKING =====

  async getTransactionStatus(customerId: string, transactionId: string): Promise<{
    transaction: MobileTransaction;
    statusHistory: TransactionStatusUpdate[];
    estimatedCompletion?: Date;
  }> {
    const transaction = this.transactions.get(transactionId);
    
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.customerId !== customerId) {
      throw new ForbiddenException('Access denied');
    }

    const estimatedCompletion = this.calculateEstimatedCompletion(transaction);

    return {
      transaction: this.sanitizeTransactionData(transaction),
      statusHistory: transaction.statusHistory,
      estimatedCompletion,
    };
  }

  async getCustomerTransactions(
    customerId: string,
    filters: {
      type?: TransactionType;
      status?: TransactionStatus;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<{
    transactions: MobileTransaction[];
    total: number;
    summary: {
      totalAmount: number;
      totalFees: number;
      completedCount: number;
      pendingCount: number;
    };
  }> {
    let transactions = Array.from(this.transactions.values()).filter(
      txn => txn.customerId === customerId
    );

    // Apply filters
    if (filters.type) {
      transactions = transactions.filter(txn => txn.type === filters.type);
    }
    if (filters.status) {
      transactions = transactions.filter(txn => txn.status === filters.status);
    }
    if (filters.startDate) {
      transactions = transactions.filter(txn => txn.createdAt >= filters.startDate);
    }
    if (filters.endDate) {
      transactions = transactions.filter(txn => txn.createdAt <= filters.endDate);
    }

    // Sort by creation date (newest first)
    transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = transactions.length;
    
    // Apply pagination
    const offset = filters.offset || 0;
    const limit = Math.min(filters.limit || 50, 100);
    transactions = transactions.slice(offset, offset + limit);

    // Calculate summary
    const allTransactions = Array.from(this.transactions.values()).filter(
      txn => txn.customerId === customerId
    );
    
    const summary = {
      totalAmount: allTransactions.reduce((sum, txn) => sum + txn.amount, 0),
      totalFees: allTransactions.reduce((sum, txn) => sum + txn.fee, 0),
      completedCount: allTransactions.filter(txn => txn.status === TransactionStatus.COMPLETED).length,
      pendingCount: allTransactions.filter(txn => 
        [TransactionStatus.INITIATED, TransactionStatus.PROCESSING, TransactionStatus.PENDING_VERIFICATION].includes(txn.status)
      ).length,
    };

    return {
      transactions: transactions.map(txn => this.sanitizeTransactionData(txn)),
      total,
      summary,
    };
  }

  // ===== RECEIPT GENERATION =====

  async generateReceipt(customerId: string, transactionId: string, format: 'html' | 'pdf' | 'json' = 'html'): Promise<{
    receiptId: string;
    receiptNumber: string;
    content: string;
    format: string;
  }> {
    const transaction = this.transactions.get(transactionId);
    
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.customerId !== customerId) {
      throw new ForbiddenException('Access denied');
    }

    if (transaction.status !== TransactionStatus.COMPLETED) {
      throw new BadRequestException('Receipt can only be generated for completed transactions');
    }

    const receiptId = `receipt_${nanoid(8)}`;
    const receiptNumber = `RCP${Date.now()}${nanoid(4).toUpperCase()}`;
    
    const receiptContent = await this.generateReceiptContent(transaction, format);

    const receipt: TransactionReceipt = {
      id: receiptId,
      transactionId,
      receiptNumber,
      type: 'digital',
      content: receiptContent,
      format,
      generatedAt: new Date(),
      metadata: {
        customerId,
        transactionType: transaction.type,
        amount: transaction.amount,
      },
    };

    this.receipts.set(receiptId, receipt);
    
    // Update transaction with receipt info
    transaction.receipt = receipt;
    this.transactions.set(transactionId, transaction);

    return {
      receiptId,
      receiptNumber,
      content: receiptContent,
      format,
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  private async processTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) return;

    try {
      await this.updateTransactionStatus(transactionId, TransactionStatus.PROCESSING, 'Transaction processing started');

      // Simulate processing delay
      setTimeout(async () => {
        try {
          // Simulate successful processing
          const success = Math.random() > 0.1; // 90% success rate
          
          if (success) {
            await this.updateTransactionStatus(transactionId, TransactionStatus.COMPLETED, 'Transaction completed successfully');
            
            transaction.completedAt = new Date();
            this.transactions.set(transactionId, transaction);

            // Emit completion event
            this.eventEmitter.emit('transaction.completed', {
              transactionId,
              customerId: transaction.customerId,
              type: transaction.type,
              amount: transaction.amount,
              reference: transaction.reference,
            });

          } else {
            await this.updateTransactionStatus(transactionId, TransactionStatus.FAILED, 'Transaction processing failed');
            
            this.eventEmitter.emit('transaction.failed', {
              transactionId,
              customerId: transaction.customerId,
              reason: 'Processing failed',
            });
          }
        } catch (error) {
          this.logger.error(`Transaction processing error: ${(error as Error).message}`);
          await this.updateTransactionStatus(transactionId, TransactionStatus.FAILED, 'System error during processing');
        }
      }, 2000 + Math.random() * 3000); // 2-5 seconds processing time

    } catch (error) {
      this.logger.error(`Failed to start transaction processing: ${(error as Error).message}`);
      await this.updateTransactionStatus(transactionId, TransactionStatus.FAILED, 'Failed to start processing');
    }
  }

  private async updateTransactionStatus(
    transactionId: string, 
    status: TransactionStatus, 
    reason: string
  ): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) return;

    transaction.status = status;
    transaction.updatedAt = new Date();
    
    transaction.statusHistory.push({
      status,
      timestamp: new Date(),
      reason,
      updatedBy: 'system',
    });

    this.transactions.set(transactionId, transaction);

    // Emit status update event
    this.eventEmitter.emit('transaction.status_updated', {
      transactionId,
      customerId: transaction.customerId,
      oldStatus: transaction.statusHistory[transaction.statusHistory.length - 2]?.status,
      newStatus: status,
      reason,
    });
  }

  private async validateTransferRequest(customerId: string, request: InitiateTransferRequest): Promise<void> {
    if (request.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    if (request.amount > this.transactionConfig.maxSingleTransactionAmount) {
      throw new BadRequestException(`Amount exceeds maximum limit of GHS ${this.transactionConfig.maxSingleTransactionAmount}`);
    }

    if (!request.fromAccountId) {
      throw new BadRequestException('Source account is required');
    }

    if (!request.beneficiaryInfo && !request.toAccountId) {
      throw new BadRequestException('Beneficiary information or destination account is required');
    }
  }

  private async checkTransactionLimits(customerId: string, type: TransactionType, amount: number): Promise<void> {
    const customerLimits = this.limits.get(customerId) || [];
    const typeLimit = customerLimits.find(limit => limit.type === type);

    if (!typeLimit) {
      // Create default limits if none exist
      await this.createDefaultLimits(customerId, type);
      return;
    }

    if (amount > typeLimit.singleTransactionLimit) {
      throw new BadRequestException(`Amount exceeds single transaction limit of GHS ${typeLimit.singleTransactionLimit}`);
    }

    if (typeLimit.dailyUsed + amount > typeLimit.dailyLimit) {
      throw new BadRequestException(`Amount exceeds daily limit of GHS ${typeLimit.dailyLimit}`);
    }

    if (typeLimit.monthlyUsed + amount > typeLimit.monthlyLimit) {
      throw new BadRequestException(`Amount exceeds monthly limit of GHS ${typeLimit.monthlyLimit}`);
    }
  }

  private async updateTransactionLimits(customerId: string, type: TransactionType, amount: number): Promise<void> {
    const customerLimits = this.limits.get(customerId) || [];
    const limitIndex = customerLimits.findIndex(limit => limit.type === type);

    if (limitIndex !== -1) {
      customerLimits[limitIndex].dailyUsed += amount;
      customerLimits[limitIndex].monthlyUsed += amount;
      customerLimits[limitIndex].updatedAt = new Date();
      
      this.limits.set(customerId, customerLimits);
    }
  }

  private async calculateTransactionFee(type: TransactionType, amount: number): Promise<number> {
    // Simple fee calculation - would be more sophisticated in production
    const baseFee = this.transactionConfig.defaultTransactionFee;
    const percentageFee = amount * 0.001; // 0.1%
    
    switch (type) {
      case TransactionType.TRANSFER:
        return Math.min(baseFee + percentageFee, 10.0);
      case TransactionType.BILL_PAYMENT:
        return Math.min(baseFee, 5.0);
      case TransactionType.AIRTIME_PURCHASE:
        return Math.min(1.0, amount * 0.02); // 2% capped at GHS 1
      default:
        return baseFee;
    }
  }

  private requiresVerification(amount: number, priority?: TransactionPriority): boolean {
    return amount >= 1000 || priority === TransactionPriority.URGENT;
  }

  private getRequiredVerificationMethods(amount: number): VerificationMethod[] {
    if (amount >= 5000) {
      return [VerificationMethod.PIN, VerificationMethod.SMS_OTP];
    } else if (amount >= 1000) {
      return [VerificationMethod.PIN];
    }
    return [];
  }

  private async performVerification(
    method: VerificationMethod,
    value: string,
    customerId: string,
    transaction: MobileTransaction
  ): Promise<boolean> {
    // Mock verification - would integrate with actual verification systems
    switch (method) {
      case VerificationMethod.PIN:
        return value === '1234'; // Mock PIN
      case VerificationMethod.SMS_OTP:
        return value === '123456'; // Mock OTP
      case VerificationMethod.BIOMETRIC:
        return value && value.length > 50; // Mock biometric data
      default:
        return false;
    }
  }

  private async detectFraud(transaction: MobileTransaction): Promise<{
    riskScore: number;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let riskScore = 0;

    // High amount check
    if (transaction.amount > 5000) {
      riskScore += 30;
      reasons.push('High transaction amount');
    }

    // Time-based check (suspicious hours)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      riskScore += 20;
      reasons.push('Transaction at unusual hour');
    }

    // Velocity check (simplified)
    const recentTransactions = Array.from(this.transactions.values()).filter(
      txn => txn.customerId === transaction.customerId &&
             txn.createdAt > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );

    if (recentTransactions.length > 5) {
      riskScore += 40;
      reasons.push('High transaction frequency');
    }

    return { riskScore: Math.min(riskScore, 100), reasons };
  }

  private async createFraudAlert(transaction: MobileTransaction, fraudRisk: any): Promise<void> {
    const alert: FraudAlert = {
      id: `fraud_${nanoid(8)}`,
      transactionId: transaction.id,
      customerId: transaction.customerId,
      alertType: FraudAlertType.UNUSUAL_AMOUNT,
      riskScore: fraudRisk.riskScore,
      reasons: fraudRisk.reasons,
      status: 'pending',
      createdAt: new Date(),
    };

    const customerAlerts = this.fraudAlerts.get(transaction.customerId) || [];
    customerAlerts.push(alert);
    this.fraudAlerts.set(transaction.customerId, customerAlerts);

    this.eventEmitter.emit('fraud.alert_created', alert);
  }

  private sanitizeTransactionData(transaction: MobileTransaction): MobileTransaction {
    // Remove sensitive data for client response
    const sanitized = { ...transaction };
    // Would remove/mask sensitive information here
    return sanitized;
  }

  private getEstimatedProcessingTime(transaction: MobileTransaction): string {
    switch (transaction.type) {
      case TransactionType.AIRTIME_PURCHASE:
        return 'Instant';
      case TransactionType.TRANSFER:
        return '2-5 minutes';
      case TransactionType.BILL_PAYMENT:
        return '1-3 minutes';
      default:
        return '2-5 minutes';
    }
  }

  private calculateEstimatedCompletion(transaction: MobileTransaction): Date | undefined {
    if (transaction.status === TransactionStatus.COMPLETED) {
      return transaction.completedAt;
    }

    if (transaction.status === TransactionStatus.PROCESSING) {
      return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    }

    return undefined;
  }

  private async generateReceiptContent(transaction: MobileTransaction, format: string): Promise<string> {
    if (format === 'html') {
      return `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h2>Transaction Receipt</h2>
          <hr>
          <p><strong>Reference:</strong> ${transaction.reference}</p>
          <p><strong>Date:</strong> ${transaction.completedAt?.toLocaleString()}</p>
          <p><strong>Type:</strong> ${transaction.type}</p>
          <p><strong>Amount:</strong> GHS ${transaction.amount.toFixed(2)}</p>
          <p><strong>Fee:</strong> GHS ${transaction.fee.toFixed(2)}</p>
          <p><strong>Total:</strong> GHS ${transaction.totalAmount.toFixed(2)}</p>
          <p><strong>Status:</strong> ${transaction.status}</p>
          <p><strong>Description:</strong> ${transaction.description}</p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            Thank you for using our mobile banking service.
          </p>
        </div>
      `;
    }

    // Return JSON format for other cases
    return JSON.stringify({
      reference: transaction.reference,
      date: transaction.completedAt,
      type: transaction.type,
      amount: transaction.amount,
      fee: transaction.fee,
      total: transaction.totalAmount,
      status: transaction.status,
      description: transaction.description,
    }, null, 2);
  }

  private async validateAccountBalance(accountId: string, requiredAmount: number): Promise<void> {
    // Mock balance check - would integrate with account service
    const mockBalance = 10000; // GHS 10,000
    if (requiredAmount > mockBalance) {
      throw new BadRequestException('Insufficient account balance');
    }
  }

  private async validateBillInfo(billInfo: BillInfo): Promise<any> {
    // Mock bill validation - would integrate with bill providers
    return {
      provider: billInfo.provider,
      customerName: 'John Doe',
      dueAmount: 150.00,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      accountStatus: 'active',
    };
  }

  private async validateAirtimeRequest(request: AirtimePurchaseRequest): Promise<void> {
    if (request.amount < 1 || request.amount > 500) {
      throw new BadRequestException('Airtime amount must be between GHS 1 and GHS 500');
    }

    // Validate phone number format (Ghana)
    const phoneRegex = /^(\+233|0)[2-9]\d{8}$/;
    if (!phoneRegex.test(request.airtimeInfo.phoneNumber)) {
      throw new BadRequestException('Invalid Ghana phone number format');
    }
  }

  private getBillCategory(serviceType: BillServiceType): TransactionCategory {
    switch (serviceType) {
      case BillServiceType.ELECTRICITY:
      case BillServiceType.WATER:
        return TransactionCategory.UTILITY_BILL;
      case BillServiceType.INTERNET:
      case BillServiceType.CABLE_TV:
        return TransactionCategory.TELECOM_BILL;
      case BillServiceType.INSURANCE:
        return TransactionCategory.INSURANCE_PAYMENT;
      case BillServiceType.SCHOOL_FEES:
        return TransactionCategory.SCHOOL_FEES;
      default:
        return TransactionCategory.OTHER;
    }
  }

  private async createDefaultLimits(customerId: string, type: TransactionType): Promise<void> {
    const customerLimits = this.limits.get(customerId) || [];
    
    const defaultLimit: TransactionLimit = {
      customerId,
      type,
      dailyLimit: 50000,
      monthlyLimit: 200000,
      singleTransactionLimit: 10000,
      dailyUsed: 0,
      monthlyUsed: 0,
      isActive: true,
      updatedAt: new Date(),
    };

    customerLimits.push(defaultLimit);
    this.limits.set(customerId, customerLimits);
  }

  private initializeTransactionLimits(): void {
    // Initialize default limits for demo customer
    const customerId = 'cust_demo_001';
    this.createDefaultLimits(customerId, TransactionType.TRANSFER);
    this.createDefaultLimits(customerId, TransactionType.BILL_PAYMENT);
    this.createDefaultLimits(customerId, TransactionType.AIRTIME_PURCHASE);
    
    this.logger.log('Transaction limits initialized');
  }
}