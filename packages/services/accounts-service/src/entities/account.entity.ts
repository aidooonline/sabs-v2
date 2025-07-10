import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index, BeforeInsert } from 'typeorm';
import { Customer } from './customer.entity';
import { Transaction } from './transaction.entity';
import { nanoid } from 'nanoid';

export enum AccountType {
  SAVINGS = 'savings',
  CURRENT = 'current',
  LOAN = 'loan',
  FIXED_DEPOSIT = 'fixed_deposit',
  WALLET = 'wallet',
}

export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  CLOSED = 'closed',
  FROZEN = 'frozen',
}

export enum CurrencyCode {
  GHS = 'GHS', // Ghana Cedi
  USD = 'USD', // US Dollar
  EUR = 'EUR', // Euro
  GBP = 'GBP', // British Pound
}

@Entity('accounts')
@Index(['companyId', 'accountNumber'])
@Index(['companyId', 'customerId'])
@Index(['companyId', 'status'])
@Index(['companyId', 'accountType'])
@Index(['accountNumber'], { unique: true })
@Index(['createdBy'])
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_number', _length: any, unique: true })
  accountNumber: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  // Account Details
  @Column({ 
    type: 'enum', 
    enum: AccountType,
    name: 'account_type',
    default: AccountType.SAVINGS
  })
  accountType: AccountType;

  @Column({ name: 'account_name', _length: any)
  accountName: string;

  @Column({ name: 'account_description', _type: any, nullable: true })
  accountDescription: string;

  // Status and State
  @Column({ 
    type: 'enum', 
    enum: AccountStatus,
    name: 'status',
    default: AccountStatus.ACTIVE
  })
  status: AccountStatus;

  @Column({ name: 'is_primary', _default: any)
  isPrimary: boolean;

  @Column({ name: 'is_joint_account', _default: any)
  isJointAccount: boolean;

  // Balance Information
  @Column({ 
    name: 'current_balance', 
    type: 'decimal', 
    precision: 15, 
    scale: 2, 
    default: 0 
  })
  currentBalance: number;

  @Column({ 
    name: 'available_balance', 
    type: 'decimal', 
    precision: 15, 
    scale: 2, 
    default: 0 
  })
  availableBalance: number;

  @Column({ 
    name: 'ledger_balance', 
    type: 'decimal', 
    precision: 15, 
    scale: 2, 
    default: 0 
  })
  ledgerBalance: number;

  @Column({ 
    name: 'pending_credits', 
    type: 'decimal', 
    precision: 15, 
    scale: 2, 
    default: 0 
  })
  pendingCredits: number;

  @Column({ 
    name: 'pending_debits', 
    type: 'decimal', 
    precision: 15, 
    scale: 2, 
    default: 0 
  })
  pendingDebits: number;

  @Column({ 
    name: 'hold_amount', 
    type: 'decimal', 
    precision: 15, 
    scale: 2, 
    default: 0 
  })
  holdAmount: number;

  // Currency and Limits
  @Column({ 
    type: 'enum', 
    enum: CurrencyCode,
    name: 'currency',
    default: CurrencyCode.GHS
  })
  currency: CurrencyCode;

  @Column({ 
    name: 'minimum_balance', 
    type: 'decimal', 
    precision: 15, 
    scale: 2, 
    default: 0 
  })
  minimumBalance: number;

  @Column({ 
    name: 'overdraft_limit', 
    type: 'decimal', 
    precision: 15, 
    scale: 2, 
    default: 0 
  })
  overdraftLimit: number;

  @Column({ 
    name: 'daily_withdrawal_limit', 
    type: 'decimal', 
    precision: 15, 
    scale: 2, 
    default: 0 
  })
  dailyWithdrawalLimit: number;

  @Column({ 
    name: 'daily_deposit_limit', 
    type: 'decimal', 
    precision: 15, 
    scale: 2, 
    default: 0 
  })
  dailyDepositLimit: number;

  @Column({ 
    name: 'monthly_transaction_limit', 
    type: 'decimal', 
    precision: 15, 
    scale: 2, 
    default: 0 
  })
  monthlyTransactionLimit: number;

  // Interest and Charges
  @Column({ 
    name: 'interest_rate', 
    type: 'decimal', 
    precision: 5, 
    scale: 4, 
    default: 0 
  })
  interestRate: number; // Annual interest rate as a decimal (e.g., 0.05 for 5%)

  @Column({ 
    name: 'maintenance_fee', 
    type: 'decimal', 
    precision: 10, 
    scale: 2, 
    default: 0 
  })
  maintenanceFee: number;

  @Column({ name: 'last_interest_calculation', _type: any, nullable: true })
  lastInterestCalculation: Date;

  @Column({ name: 'last_maintenance_fee', _type: any, nullable: true })
  lastMaintenanceFee: Date;

  // Account Opening Information
  @Column({ name: 'opened_date', _type: any)
  openedDate: Date;

  @Column({ name: 'created_by' })
  createdBy: string; // Agent User ID who created the account

  @Column({ name: 'opening_location', _type: any, nullable: true })
  openingLocation: string; // GPS coordinates

  @Column({ name: 'opening_ip', _length: any, nullable: true })
  openingIp: string;

  @Column({ 
    name: 'opening_balance', 
    type: 'decimal', 
    precision: 15, 
    scale: 2, 
    default: 0 
  })
  openingBalance: number;

  // Account Closure Information
  @Column({ name: 'closed_date', _type: any, nullable: true })
  closedDate: Date;

  @Column({ name: 'closed_by', _nullable: any)
  closedBy: string; // User ID who closed the account

  @Column({ name: 'closure_reason', _type: any, nullable: true })
  closureReason: string;

  // Product and Scheme Information
  @Column({ name: 'product_code', _length: any, nullable: true })
  productCode: string;

  @Column({ name: 'scheme_code', _length: any, nullable: true })
  schemeCode: string;

  @Column({ name: 'branch_code', _length: any, nullable: true })
  branchCode: string;

  // Risk and Compliance
  @Column({ name: 'risk_rating', _default: any)
  riskRating: number; // 1-5 (1: Low, 5: High)

  @Column({ name: 'aml_status', _length: any, default: 'CLEAR' })
  amlStatus: string; // CLEAR, SUSPICIOUS, FLAGGED, BLOCKED

  @Column({ name: 'kyc_status', _length: any, default: 'PENDING' })
  kycStatus: string; // PENDING, VERIFIED, REJECTED

  @Column({ name: 'sanctions_checked', _default: any)
  sanctionsChecked: boolean;

  @Column({ name: 'last_sanctions_check', _type: any, nullable: true })
  lastSanctionsCheck: Date;

  // Operational Information
  @Column({ name: 'dormant_date', _type: any, nullable: true })
  dormantDate: Date;

  @Column({ name: 'last_transaction_date', _type: any, nullable: true })
  lastTransactionDate: Date;

  @Column({ name: 'statement_frequency', _length: any, default: 'MONTHLY' })
  statementFrequency: string; // DAILY, WEEKLY, MONTHLY, QUARTERLY

  @Column({ name: 'last_statement_date', _type: any, nullable: true })
  lastStatementDate: Date;

  // Notifications and Preferences
  @Column({ name: 'sms_alerts', _default: any)
  smsAlerts: boolean;

  @Column({ name: 'email_alerts', _default: any)
  emailAlerts: boolean;

  @Column({ name: 'transaction_alerts', _default: any)
  transactionAlerts: boolean;

  @Column({ name: 'balance_alerts', _default: any)
  balanceAlerts: boolean;

  @Column({ name: 'low_balance_threshold', _type: any, precision: 15, _scale: any, default: 0 })
  lowBalanceThreshold: number;

  // Additional Information
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

  @OneToMany(() => Transaction, transaction => transaction.account)
  transactions: Transaction[];

  // Computed properties
  get accountAge(): number {
    const today = new Date();
    const opened = new Date(this.openedDate);
    const diffTime = Math.abs(today.getTime() - opened.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Days
  }

  get isActive(): boolean {
    return this.status === AccountStatus.ACTIVE;
  }

  get isClosed(): boolean {
    return this.status === AccountStatus.CLOSED;
  }

  get isFrozen(): boolean {
    return this.status === AccountStatus.FROZEN || this.status === AccountStatus.SUSPENDED;
  }

  get canTransact(): boolean {
    return this.isActive && !this.isFrozen && this.kycStatus === 'VERIFIED';
  }

  get effectiveBalance(): number {
    return this.availableBalance - this.holdAmount;
  }

  get isDormant(): boolean {
    if (!this.lastTransactionDate) return false;
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    return this.lastTransactionDate < sixMonthsAgo;
  }

  get needsMaintenanceFee(): boolean {
    if (!this.lastMaintenanceFee || this.maintenanceFee <= 0) return false;
    
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    return this.lastMaintenanceFee < monthAgo;
  }

  get needsInterestCalculation(): boolean {
    if (!this.lastInterestCalculation || this.interestRate <= 0) return false;
    
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    return this.lastInterestCalculation < monthAgo;
  }

  get hasLowBalance(): boolean {
    return this.lowBalanceThreshold > 0 && this.availableBalance <= this.lowBalanceThreshold;
  }

  get isOverdrawn(): boolean {
    return this.currentBalance < 0;
  }

  get canWithdraw(): boolean {
    return this.canTransact && this.effectiveBalance > this.minimumBalance;
  }

  get canDeposit(): boolean {
    return this.canTransact && this.status !== AccountStatus.CLOSED;
  }

  // Business logic methods
  credit(_amount: any, description?: string): boolean {
    if (amount <= 0) return false;
    
    this.currentBalance += amount;
    this.availableBalance += amount;
    this.ledgerBalance += amount;
    this.lastTransactionDate = new Date();
    this.updatedAt = new Date();
    
    return true;
  }

  debit(_amount: any, description?: string): boolean {
    if (amount <= 0) return false;
    if (!this.canWithdraw) return false;
    if (this.effectiveBalance < amount && this.currentBalance - amount < -this.overdraftLimit) {
      return false; // Insufficient funds
    }
    
    this.currentBalance -= amount;
    this.availableBalance -= amount;
    this.ledgerBalance -= amount;
    this.lastTransactionDate = new Date();
    this.updatedAt = new Date();
    
    return true;
  }

  hold(_amount: any, reference?: string): boolean {
    if (amount <= 0) return false;
    if (this.availableBalance < amount) return false;
    
    this.holdAmount += amount;
    this.availableBalance -= amount;
    this.updatedAt = new Date();
    
    return true;
  }

  releaseHold(_amount: any, reference?: string): boolean {
    if (amount <= 0) return false;
    if (this.holdAmount < amount) return false;
    
    this.holdAmount -= amount;
    this.availableBalance += amount;
    this.updatedAt = new Date();
    
    return true;
  }

  freeze(reason?: string): void {
    this.status = AccountStatus.FROZEN;
    this.updatedAt = new Date();
    
    if (reason) {
      this.metadata = { ...this.metadata, freezeReason: reason };
    }
  }

  unfreeze(): void {
    this.status = AccountStatus.ACTIVE;
    this.updatedAt = new Date();
    
    if (this.metadata?.freezeReason) {
      delete this.metadata.freezeReason;
    }
  }

  suspend(reason?: string): void {
    this.status = AccountStatus.SUSPENDED;
    this.updatedAt = new Date();
    
    if (reason) {
      this.metadata = { ...this.metadata, suspensionReason: reason };
    }
  }

  activate(): void {
    this.status = AccountStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  close(_closedBy: any, reason?: string): boolean {
    if (this.currentBalance !== 0) {
      return false; // Cannot close account with balance
    }
    
    this.status = AccountStatus.CLOSED;
    this.closedDate = new Date();
    this.closedBy = closedBy;
    this.closureReason = reason;
    this.updatedAt = new Date();
    
    return true;
  }

  setPrimary(): void {
    this.isPrimary = true;
    this.updatedAt = new Date();
  }

  unsetPrimary(): void {
    this.isPrimary = false;
    this.updatedAt = new Date();
  }

  updateLimits(limits: {
    dailyWithdrawalLimit?: number;
    dailyDepositLimit?: number;
    monthlyTransactionLimit?: number;
    overdraftLimit?: number;
  }): void {
    if (limits.dailyWithdrawalLimit !== undefined) {
      this.dailyWithdrawalLimit = limits.dailyWithdrawalLimit;
    }
    if (limits.dailyDepositLimit !== undefined) {
      this.dailyDepositLimit = limits.dailyDepositLimit;
    }
    if (limits.monthlyTransactionLimit !== undefined) {
      this.monthlyTransactionLimit = limits.monthlyTransactionLimit;
    }
    if (limits.overdraftLimit !== undefined) {
      this.overdraftLimit = limits.overdraftLimit;
    }
    
    this.updatedAt = new Date();
  }

  updateInterestRate(_rate: any): void {
    this.interestRate = Math.max(0, rate);
    this.updatedAt = new Date();
  }

  calculateInterest(): number {
    if (this.interestRate <= 0 || this.currentBalance <= 0) return 0;
    
    // Simple interest calculation (annual rate / 12 for monthly)
    const monthlyRate = this.interestRate / 12;
    return this.currentBalance * monthlyRate;
  }

  applyInterest(): boolean {
    const interest = this.calculateInterest();
    if (interest <= 0) return false;
    
    this.credit(interest, 'Interest credit');
    this.lastInterestCalculation = new Date();
    
    return true;
  }

  chargeMaintenance(): boolean {
    if (this.maintenanceFee <= 0) return false;
    if (!this.debit(this.maintenanceFee, 'Maintenance fee')) {
      return false;
    }
    
    this.lastMaintenanceFee = new Date();
    return true;
  }

  updateKycStatus(_status: any, verifiedBy?: string): void {
    this.kycStatus = status;
    this.updatedAt = new Date();
    
    if (verifiedBy) {
      this.metadata = { ...this.metadata, kycVerifiedBy: verifiedBy };
    }
  }

  updateAmlStatus(_status: any, checkedBy?: string): void {
    this.amlStatus = status;
    this.updatedAt = new Date();
    
    if (checkedBy) {
      this.metadata = { ...this.metadata, amlCheckedBy: checkedBy };
    }
  }

  markDormant(): void {
    this.dormantDate = new Date();
    this.status = AccountStatus.INACTIVE;
    this.updatedAt = new Date();
  }

  reactivate(): void {
    this.dormantDate = null;
    this.status = AccountStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  @BeforeInsert()
  generateAccountNumber(): void {
    if (!this.accountNumber) {
      // Generate account number: ACC + 10 random characters
      this.accountNumber = 'ACC' + nanoid(10).toUpperCase();
    }
    
    if (!this.openedDate) {
      this.openedDate = new Date();
    }
  }

  // Static factory methods
  static createSavingsAccount(data: {
    companyId: string;
    customerId: string;
    accountName: string;
    createdBy: string;
    openingBalance?: number;
    currency?: CurrencyCode;
  }): Partial<Account> {
    return {
      ...data,
      accountType: AccountType.SAVINGS,
      status: AccountStatus.ACTIVE,
      currentBalance: data.openingBalance || 0,
      availableBalance: data.openingBalance || 0,
      ledgerBalance: data.openingBalance || 0,
      openingBalance: data.openingBalance || 0,
      currency: data.currency || CurrencyCode.GHS,
      minimumBalance: 10, // GHS 10 minimum
      dailyWithdrawalLimit: 2000, // GHS 2,000 daily limit
      dailyDepositLimit: 10000, // GHS 10,000 daily limit
      monthlyTransactionLimit: 50000, // GHS 50,000 monthly limit
      interestRate: 0.03, // 3% annual interest
      maintenanceFee: 5, // GHS 5 monthly maintenance
      riskRating: 1,
      kycStatus: 'PENDING',
      amlStatus: 'CLEAR',
    };
  }

  static createCurrentAccount(data: {
    companyId: string;
    customerId: string;
    accountName: string;
    createdBy: string;
    openingBalance?: number;
    currency?: CurrencyCode;
  }): Partial<Account> {
    return {
      ...Account.createSavingsAccount(data),
      accountType: AccountType.CURRENT,
      minimumBalance: 100, // GHS 100 minimum
      overdraftLimit: 1000, // GHS 1,000 overdraft
      dailyWithdrawalLimit: 5000, // GHS 5,000 daily limit
      dailyDepositLimit: 25000, // GHS 25,000 daily limit
      monthlyTransactionLimit: 100000, // GHS 100,000 monthly limit
      interestRate: 0.01, // 1% annual interest
      maintenanceFee: 10, // GHS 10 monthly maintenance
    };
  }

  static createWalletAccount(data: {
    companyId: string;
    customerId: string;
    accountName: string;
    createdBy: string;
    openingBalance?: number;
    currency?: CurrencyCode;
  }): Partial<Account> {
    return {
      ...Account.createSavingsAccount(data),
      accountType: AccountType.WALLET,
      minimumBalance: 0, // No minimum balance
      dailyWithdrawalLimit: 1000, // GHS 1,000 daily limit
      dailyDepositLimit: 5000, // GHS 5,000 daily limit
      monthlyTransactionLimit: 20000, // GHS 20,000 monthly limit
      interestRate: 0, // No interest
      maintenanceFee: 0, // No maintenance fee
    };
  }
}