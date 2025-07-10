import { getErrorMessage, getErrorStack, getErrorStatus, UserRole, ReportType, LibraryCapability } from '@sabs/common';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index, BeforeInsert } from 'typeorm';
import { Customer } from './customer.entity';
import { Account } from './account.entity';
import { nanoid } from 'nanoid';


export enum TransactionType {
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit',
  TRANSFER = 'transfer',
  FEE = 'fee',
  INTEREST = 'interest',
  REVERSAL = 'reversal',
  ADJUSTMENT = 'adjustment',
}

export enum TransactionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REVERSED = 'reversed',
}

export enum TransactionChannel {
  AGENT_MOBILE = 'agent_mobile',
  AGENT_TABLET = 'agent_tablet',
  BRANCH = 'branch',
  ATM = 'atm',
  WEB = 'web',
  USSD = 'ussd',
  API = 'api',
}

export enum TransactionPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ApprovalLevel {
  NONE = 'none',
  AGENT = UserRole.FIELD_AGENT,
  CLERK = UserRole.CLERK,
  MANAGER = UserRole.COMPANY_ADMIN,
  ADMIN = UserRole.SUPER_ADMIN,
}

export enum AuthenticationMethod {
  PIN = 'pin',
  BIOMETRIC = 'biometric',
  OTP = 'otp',
  TOKEN = 'token',
  AGENT_VERIFICATION = 'agent_verification',
}

@Entity('transactions')
@Index(['companyId', 'transactionNumber'])
@Index(['companyId', 'customerId'])
@Index(['companyId', 'accountId'])
@Index(['companyId', 'status'])
@Index(['companyId', 'type'])
@Index(['agentId'])
@Index(['status', 'createdAt'])
@Index(['scheduledAt'])
@Index(['approvalRequired', 'status'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'transaction_number', _length: any, unique: true })
  transactionNumber: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'account_id' })
  accountId: string;

  // Transaction Details
  @Column({ 
    type: 'enum', 
    enum: TransactionType,
    name: 'type'
  })
  type: TransactionType;

  @Column({ 
    type: 'enum', 
    enum: TransactionStatus,
    name: 'status',
    default: TransactionStatus.PENDING
  })
  status: TransactionStatus;

  @Column({ 
    type: 'enum', 
    enum: TransactionChannel,
    name: 'channel',
    default: TransactionChannel.AGENT_MOBILE
  })
  channel: TransactionChannel;

  @Column({ 
    type: 'enum', 
    enum: TransactionPriority,
    name: 'priority',
    default: TransactionPriority.NORMAL
  })
  priority: TransactionPriority;

  // Amount and Currency
  @Column({ 
    name: 'amount', 
    type: 'decimal', 
    precision: 15, 
    scale: 2 
  })
  amount: number;

  @Column({ name: 'currency', _length: any, default: 'GHS' })
  currency: string;

  @Column({ 
    name: 'fee_amount', 
    type: 'decimal', 
    precision: 15, 
    scale: 2, 
    default: 0 
  })
  feeAmount: number;

  @Column({ 
    name: 'total_amount', 
    type: 'decimal', 
    precision: 15, 
    scale: 2 
  })
  totalAmount: number; // amount + fees

  // Balance Information (at time of transaction)
  @Column({ 
    name: 'account_balance_before', 
    type: 'decimal', 
    precision: 15, 
    scale: 2 
  })
  accountBalanceBefore: number;

  @Column({ 
    name: 'account_balance_after', 
    type: 'decimal', 
    precision: 15, 
    scale: 2,
    nullable: true
  })
  accountBalanceAfter: number;

  @Column({ 
    name: 'available_balance_before', 
    type: 'decimal', 
    precision: 15, 
    scale: 2 
  })
  availableBalanceBefore: number;

  @Column({ 
    name: 'available_balance_after', 
    type: 'decimal', 
    precision: 15, 
    scale: 2,
    nullable: true
  })
  availableBalanceAfter: number;

  // Transaction Description and Reference
  @Column({ name: 'description', _type: any)
  description: string;

  @Column({ name: 'reference', _length: any, nullable: true })
  reference: string;

  @Column({ name: 'external_reference', _length: any, nullable: true })
  externalReference: string;

  @Column({ name: 'batch_id', _nullable: any)
  batchId: string;

  // Agent and Location Information
  @Column({ name: 'agent_id' })
  agentId: string; // User ID of the agent initiating transaction

  @Column({ name: 'agent_name', _length: any)
  agentName: string;

  @Column({ name: 'agent_phone', _length: any)
  agentPhone: string;

  @Column({ name: 'agent_location', _type: any, nullable: true })
  agentLocation: string; // GPS coordinates

  @Column({ name: 'agent_ip', _length: any, nullable: true })
  agentIp: string;

  @Column({ name: 'agent_device_info', _type: any, nullable: true })
  agentDeviceInfo: Record<string, any>;

  // Customer Verification and Authentication
  @Column({ name: 'customer_present', _default: any)
  customerPresent: boolean;

  @Column({ name: 'customer_verified', _default: any)
  customerVerified: boolean;

  @Column({ name: 'verification_method', _type: any, nullable: true })
  verificationMethod: AuthenticationMethod[];

  @Column({ name: 'verification_data', _type: any, nullable: true })
  verificationData: Record<string, any>;

  @Column({ name: 'biometric_hash', _type: any, nullable: true })
  biometricHash: string;

  @Column({ name: 'pin_verified', _default: any)
  pinVerified: boolean;

  @Column({ name: 'otp_verified', _default: any)
  otpVerified: boolean;

  // Approval Workflow
  @Column({ name: 'approval_required', _default: any)
  approvalRequired: boolean;

  @Column({ 
    type: 'enum', 
    enum: ApprovalLevel,
    name: 'required_approval_level',
    default: ApprovalLevel.CLERK
  })
  requiredApprovalLevel: ApprovalLevel;

  @Column({ name: 'approved_by', _nullable: any)
  approvedBy: string; // User ID who approved

  @Column({ name: 'approved_at', _type: any, nullable: true })
  approvedAt: Date;

  @Column({ name: 'approval_notes', _type: any, nullable: true })
  approvalNotes: string;

  @Column({ name: 'rejected_by', _nullable: any)
  rejectedBy: string; // User ID who rejected

  @Column({ name: 'rejected_at', _type: any, nullable: true })
  rejectedAt: Date;

  @Column({ name: 'rejection_reason', _type: any, nullable: true })
  rejectionReason: string;

  // Processing Information
  @Column({ name: 'scheduled_at', _type: any, nullable: true })
  scheduledAt: Date;

  @Column({ name: 'processed_at', _type: any, nullable: true })
  processedAt: Date;

  @Column({ name: 'completed_at', _type: any, nullable: true })
  completedAt: Date;

  @Column({ name: 'processing_time_ms', _nullable: any)
  processingTimeMs: number;

  @Column({ name: 'processed_by', _nullable: any)
  processedBy: string; // User ID who processed

  // Risk and Compliance
  @Column({ name: 'risk_score', _default: any)
  riskScore: number; // 0-100

  @Column({ name: 'risk_factors', _type: any, nullable: true })
  riskFactors: Array<{
    factor: string;
    score: number;
    description: string;
  }>;

  @Column({ name: 'aml_check_required', _default: any)
  amlCheckRequired: boolean;

  @Column({ name: 'aml_check_completed', _default: any)
  amlCheckCompleted: boolean;

  @Column({ name: 'aml_check_result', _nullable: any)
  amlCheckResult: string; // CLEAR, REVIEW, BLOCKED

  @Column({ name: 'sanctions_check_required', _default: any)
  sanctionsCheckRequired: boolean;

  @Column({ name: 'sanctions_check_completed', _default: any)
  sanctionsCheckCompleted: boolean;

  @Column({ name: 'compliance_flags', _type: any, nullable: true })
  complianceFlags: Array<{
    flag: string;
    severity: string;
    description: string;
    raisedAt: string;
  }>;

  // Holds and Reserves
  @Column({ name: 'hold_placed', _default: any)
  holdPlaced: boolean;

  @Column({ name: 'hold_amount', _type: any, precision: 15, _scale: any, default: 0 })
  holdAmount: number;

  @Column({ name: 'hold_reference', _nullable: any)
  holdReference: string;

  @Column({ name: 'hold_placed_at', _type: any, nullable: true })
  holdPlacedAt: Date;

  @Column({ name: 'hold_released_at', _type: any, nullable: true })
  holdReleasedAt: Date;

  @Column({ name: 'hold_expires_at', _type: any, nullable: true })
  holdExpiresAt: Date;

  // Receipt and Notification
  @Column({ name: 'receipt_number', _length: any, nullable: true })
  receiptNumber: string;

  @Column({ name: 'receipt_printed', _default: any)
  receiptPrinted: boolean;

  @Column({ name: 'receipt_printed_at', _type: any, nullable: true })
  receiptPrintedAt: Date;

  @Column({ name: 'customer_notified', _default: any)
  customerNotified: boolean;

  @Column({ name: 'customer_notification_sent_at', _type: any, nullable: true })
  customerNotificationSentAt: Date;

  @Column({ name: 'sms_sent', _default: any)
  smsSent: boolean;

  @Column({ name: 'email_sent', _default: any)
  emailSent: boolean;

  // Error Handling and Retry
  @Column({ name: 'retry_count', _default: any)
  retryCount: number;

  @Column({ name: 'max_retries', _default: any)
  maxRetries: number;

  @Column({ name: 'last_error', _type: any, nullable: true })
  lastError: string;

  @Column({ name: 'error_details', _type: any, nullable: true })
  errorDetails: Record<string, any>;

  // Reversal Information
  @Column({ name: 'is_reversal', _default: any)
  isReversal: boolean;

  @Column({ name: 'original_transaction_id', _nullable: any)
  originalTransactionId: string;

  @Column({ name: 'reversed', _default: any)
  reversed: boolean;

  @Column({ name: 'reversed_at', _type: any, nullable: true })
  reversedAt: Date;

  @Column({ name: 'reversed_by', _nullable: any)
  reversedBy: string;

  @Column({ name: 'reversal_reason', _type: any, nullable: true })
  reversalReason: string;

  @Column({ name: 'reversal_transaction_id', _nullable: any)
  reversalTransactionId: string;

  // Audit Trail
  @Column({ name: 'audit_trail', _type: any, default: '[]' })
  auditTrail: Array<{
    action: string;
    performedBy: string;
    performedAt: string;
    details: Record<string, any>;
    ipAddress: string;
    location?: string;
  }>;

  // Additional Metadata
  @Column({ type: 'json', _nullable: any)
  metadata: Record<string, any>;

  @Column({ name: 'notes', _type: any, nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Customer, customer => customer.accounts, { eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Account, account => account.customer, { eager: true })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @OneToMany('ApprovalWorkflow', 'transaction')
  approvalWorkflows: any[];

  // Computed properties
  get isWithdrawal(): boolean {
    return this.type === TransactionType.WITHDRAWAL;
  }

  get isDeposit(): boolean {
    return this.type === TransactionType.DEPOSIT;
  }

  get isPending(): boolean {
    return this.status === TransactionStatus.PENDING;
  }

  get isApproved(): boolean {
    return this.status === TransactionStatus.APPROVED;
  }

  get isCompleted(): boolean {
    return this.status === TransactionStatus.COMPLETED;
  }

  get isFailed(): boolean {
    return [TransactionStatus.FAILED, TransactionStatus.REJECTED, TransactionStatus.CANCELLED].includes(this.status);
  }

  get canBeApproved(): boolean {
    return this.isPending && this.approvalRequired && !this.approvedAt;
  }

  get canBeProcessed(): boolean {
    return this.isApproved && !this.processedAt;
  }

  get canBeReversed(): boolean {
    return this.isCompleted && !this.reversed && !this.isReversal;
  }

  get needsCustomerVerification(): boolean {
    return this.customerPresent && !this.customerVerified;
  }

  get hasValidHold(): boolean {
    return this.holdPlaced && this.holdExpiresAt && new Date() < this.holdExpiresAt;
  }

  get isHighRisk(): boolean {
    return this.riskScore >= 70;
  }

  get requiresManagerApproval(): boolean {
    return this.isHighRisk || this.amount >= 5000 || this.amlCheckResult === 'REVIEW';
  }

  get requiresAdminApproval(): boolean {
    return this.amount >= 10000 || this.amlCheckResult === 'BLOCKED' || this.riskScore >= 90;
  }

  get processingDurationMs(): number {
    if (!this.processedAt || !this.createdAt) return 0;
    return this.processedAt.getTime() - this.createdAt.getTime();
  }

  get totalDurationMs(): number {
    if (!this.completedAt || !this.createdAt) return 0;
    return this.completedAt.getTime() - this.createdAt.getTime();
  }

  get isExpired(): boolean {
    if (!this.holdExpiresAt) return false;
    return new Date() > this.holdExpiresAt;
  }

  get effectiveAmount(): number {
    return this.isWithdrawal ? -this.totalAmount : this.totalAmount;
  }

  // Business logic methods
  approve(_approvedBy: any, notes?: string): void {
    if (!this.canBeApproved) {
      throw new Error('Transaction cannot be approved in current state');
    }

    this.status = TransactionStatus.APPROVED;
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
    this.approvalNotes = notes;
    this.updatedAt = new Date();

    this.addAuditEntry('TRANSACTION_APPROVED', approvedBy, { notes });
  }

  reject(_rejectedBy: any, reason: string): void {
    if (!this.isPending) {
      throw new Error('Transaction cannot be rejected in current state');
    }

    this.status = TransactionStatus.REJECTED;
    this.rejectedBy = rejectedBy;
    this.rejectedAt = new Date();
    this.rejectionReason = reason;
    this.updatedAt = new Date();

    // Release hold if placed
    if (this.holdPlaced) {
      this.releaseHold();
    }

    this.addAuditEntry('TRANSACTION_REJECTED', rejectedBy, { reason });
  }

  startProcessing(_processedBy: any): void {
    if (!this.canBeProcessed) {
      throw new Error('Transaction cannot be processed in current state');
    }

    this.status = TransactionStatus.PROCESSING;
    this.processedBy = processedBy;
    this.processedAt = new Date();
    this.updatedAt = new Date();

    this.addAuditEntry('TRANSACTION_PROCESSING_STARTED', processedBy);
  }

  complete(_balanceAfter: any, availableBalanceAfter: number): void {
    if (this.status !== TransactionStatus.PROCESSING) {
      throw new Error('Transaction must be in processing state to complete');
    }

    this.status = TransactionStatus.COMPLETED;
    this.completedAt = new Date();
    this.accountBalanceAfter = balanceAfter;
    this.availableBalanceAfter = availableBalanceAfter;
    this.processingTimeMs = this.processingDurationMs;
    this.updatedAt = new Date();

    // Release hold if placed
    if (this.holdPlaced) {
      this.releaseHold();
    }

    this.addAuditEntry('TRANSACTION_COMPLETED', this.processedBy || 'SYSTEM', {
      balanceAfter,
      availableBalanceAfter,
      processingTimeMs: this.processingTimeMs,
    });
  }

  fail(_error: any, details?: Record<string, any>): void {
    this.status = TransactionStatus.FAILED;
    this.lastError = error;
    this.errorDetails = details;
    this.updatedAt = new Date();

    // Release hold if placed
    if (this.holdPlaced) {
      this.releaseHold();
    }

    this.addAuditEntry('TRANSACTION_FAILED', this.processedBy || 'SYSTEM', { error, details });
  }

  cancel(_cancelledBy: any, reason?: string): void {
    if (![TransactionStatus.PENDING, TransactionStatus.APPROVED].includes(this.status)) {
      throw new Error('Transaction cannot be cancelled in current state');
    }

    this.status = TransactionStatus.CANCELLED;
    this.updatedAt = new Date();

    // Release hold if placed
    if (this.holdPlaced) {
      this.releaseHold();
    }

    this.addAuditEntry('TRANSACTION_CANCELLED', cancelledBy, { reason });
  }

  reverse(_reversedBy: any, reason: string): void {
    if (!this.canBeReversed) {
      throw new Error('Transaction cannot be reversed');
    }

    this.reversed = true;
    this.reversedAt = new Date();
    this.reversedBy = reversedBy;
    this.reversalReason = reason;
    this.updatedAt = new Date();

    this.addAuditEntry('TRANSACTION_REVERSED', reversedBy, { reason });
  }

  placeHold(_holdAmount: any, expiresInMinutes: number = 30): void {
    this.holdPlaced = true;
    this.holdAmount = holdAmount;
    this.holdReference = `HOLD-${this.transactionNumber}`;
    this.holdPlacedAt = new Date();
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);
    this.holdExpiresAt = expiresAt;

    this.addAuditEntry('HOLD_PLACED', this.agentId, { holdAmount, expiresInMinutes });
  }

  releaseHold(): void {
    if (!this.holdPlaced) return;

    this.holdPlaced = false;
    this.holdReleasedAt = new Date();
    this.updatedAt = new Date();

    this.addAuditEntry('HOLD_RELEASED', this.processedBy || 'SYSTEM');
  }

  verifyCustomer(_method: any, verificationData?: Record<string, any>): void {
    if (!this.verificationMethod) {
      this.verificationMethod = [];
    }

    if (!this.verificationMethod.includes(method)) {
      this.verificationMethod.push(method);
    }

    if (verificationData) {
      this.verificationData = { ...this.verificationData, ...verificationData };
    }

    // Check if customer is fully verified based on required methods
    this.customerVerified = this.isCustomerFullyVerified();
    this.updatedAt = new Date();

    this.addAuditEntry('CUSTOMER_VERIFIED', this.agentId, { method, _verified: any);
  }

  setPin(_verified: any): void {
    this.pinVerified = verified;
    if (verified) {
      this.verifyCustomer(AuthenticationMethod.PIN);
    }
  }

  setBiometric(_verified: any, hash?: string): void {
    this.pinVerified = verified;
    if (verified) {
      this.biometricHash = hash;
      this.verifyCustomer(AuthenticationMethod.BIOMETRIC, { biometricHash: hash });
    }
  }

  setOtp(_verified: any): void {
    this.otpVerified = verified;
    if (verified) {
      this.verifyCustomer(AuthenticationMethod.OTP);
    }
  }

  updateRiskScore(_score: any, factors?: Array<{ factor: string; score: number; description: string }>): void {
    this.riskScore = Math.max(0, Math.min(100, score));
    if (factors) {
      this.riskFactors = factors;
    }

    // Update required approval level based on risk
    if (this.requiresAdminApproval) {
      this.requiredApprovalLevel = ApprovalLevel.ADMIN;
    } else if (this.requiresManagerApproval) {
      this.requiredApprovalLevel = ApprovalLevel.MANAGER;
    }

    this.updatedAt = new Date();
    this.addAuditEntry('RISK_SCORE_UPDATED', this.agentId, { score, factors });
  }

  addComplianceFlag(_flag: any, severity: string, _description: any): void {
    if (!this.complianceFlags) {
      this.complianceFlags = [];
    }

    this.complianceFlags.push({
      flag,
      severity,
      description,
      raisedAt: new Date().toISOString(),
    });

    this.addAuditEntry('COMPLIANCE_FLAG_ADDED', this.agentId, { flag, severity, description });
  }

  requireAmlCheck(): void {
    this.amlCheckRequired = true;
    this.addAuditEntry('AML_CHECK_REQUIRED', this.agentId);
  }

  completeAmlCheck(_result: any): void {
    this.amlCheckCompleted = true;
    this.amlCheckResult = result;
    this.addAuditEntry('AML_CHECK_COMPLETED', this.agentId, { result });
  }

  requireSanctionsCheck(): void {
    this.sanctionsCheckRequired = true;
    this.addAuditEntry('SANCTIONS_CHECK_REQUIRED', this.agentId);
  }

  completeSanctionsCheck(_result: any): void {
    this.sanctionsCheckCompleted = true;
    this.addAuditEntry('SANCTIONS_CHECK_COMPLETED', this.agentId, { result });
  }

  retry(): void {
    if (this.retryCount >= this.maxRetries) {
      throw new Error('Maximum retry attempts exceeded');
    }

    this.retryCount++;
    this.status = TransactionStatus.PENDING;
    this.lastError = null;
    this.errorDetails = null;
    this.updatedAt = new Date();

    this.addAuditEntry('TRANSACTION_RETRIED', this.agentId, { retryCount: this.retryCount });
  }

  addAuditEntry(_action: any, performedBy: string, details?: Record<string, any>): void {
    this.auditTrail.push({
      action,
      performedBy,
      performedAt: new Date().toISOString(),
      details: details || {},
      ipAddress: this.agentIp || 'unknown',
      location: this.agentLocation,
    });
  }

  private isCustomerFullyVerified(): boolean {
    // Basic verification requires at least one method
    if (!this.verificationMethod || Object.values(this.verificationMethod).length === 0) {
      return false;
    }

    // For high-risk transactions, require multiple verification methods
    if (this.isHighRisk) {
      return Object.values(this.verificationMethod).length >= 2 && 
             (this.pinVerified || this.otpVerified) && 
             this.verificationMethod.includes(AuthenticationMethod.BIOMETRIC);
    }

    // For normal transactions, require at least PIN or OTP
    return this.pinVerified || this.otpVerified || this.verificationMethod.includes(AuthenticationMethod.AGENT_VERIFICATION);
  }

  @BeforeInsert()
  generateTransactionNumber(): void {
    if (!this.transactionNumber) {
      // Generate transaction number: TXN + timestamp + random
      const timestamp = Date.now().toString(36);
      const random = nanoid(4).toUpperCase();
      this.transactionNumber = `TXN${timestamp}${random}`;
    }

    // Calculate total amount
    this.totalAmount = this.amount + this.feeAmount;

    // Set default scheduled time to now
    if (!this.scheduledAt) {
      this.scheduledAt = new Date();
    }

    // Set hold expiry if not set
    if (this.holdPlaced && !this.holdExpiresAt) {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutes default
      this.holdExpiresAt = expiresAt;
    }
  }

  // Static factory methods
  static createWithdrawalRequest(data: {
    companyId: string;
    customerId: string;
    accountId: string;
    amount: number;
    currency?: string;
    description: string;
    agentId: string;
    agentName: string;
    agentPhone: string;
    channel?: TransactionChannel;
    reference?: string;
    balanceBefore: number;
    availableBalanceBefore: number;
    location?: string;
    ipAddress?: string;
  }): Partial<Transaction> {
    return {
      ...data,
      type: TransactionType.WITHDRAWAL,
      status: TransactionStatus.PENDING,
      channel: data.channel || TransactionChannel.AGENT_MOBILE,
      currency: data.currency || 'GHS',
      feeAmount: 0, // Will be calculated by service
      totalAmount: data.amount, // Will be updated with fees
      accountBalanceBefore: data.balanceBefore,
      availableBalanceBefore: data.availableBalanceBefore,
      agentLocation: data.location,
      agentIp: data.ipAddress,
      customerPresent: true,
      approvalRequired: true,
      requiredApprovalLevel: data.amount >= 1000 ? ApprovalLevel.MANAGER : ApprovalLevel.CLERK,
      priority: data.amount >= 5000 ? TransactionPriority.HIGH : TransactionPriority.NORMAL,
      riskScore: 20, // Initial risk score
      retryCount: 0,
      maxRetries: 3,
      verificationMethod: [],
      auditTrail: [],
    };
  }

  static createReversal(_originalTransaction: any, reversedBy: string, _reason: any): Partial<Transaction> {
    return {
      companyId: originalTransaction.companyId,
      customerId: originalTransaction.customerId,
      accountId: originalTransaction.accountId,
      type: TransactionType.REVERSAL,
      status: TransactionStatus.PENDING,
      channel: originalTransaction.channel,
      amount: originalTransaction.amount,
      currency: originalTransaction.currency,
      feeAmount: 0,
      totalAmount: originalTransaction.amount,
      description: `Reversal of ${originalTransaction.transactionNumber}: ${reason}`,
      agentId: reversedBy,
      agentName: 'System Reversal',
      agentPhone: '',
      isReversal: true,
      originalTransactionId: originalTransaction.id,
      approvalRequired: true,
      requiredApprovalLevel: ApprovalLevel.MANAGER,
      priority: TransactionPriority.HIGH,
      riskScore: 0,
      auditTrail: [],
    };
  }
}