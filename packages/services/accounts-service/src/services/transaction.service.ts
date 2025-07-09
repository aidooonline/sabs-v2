import { getErrorMessage, getErrorStack, getErrorStatus, UserRole, ReportType, LibraryCapability } from '@sabs/common';
import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In, Like, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { Transaction, TransactionType, TransactionStatus, TransactionChannel, AuthenticationMethod, ApprovalLevel } from '../entities/transaction.entity';
import { Customer } from '../entities/customer.entity';
import { Account } from '../entities/account.entity';
import {



  CreateWithdrawalRequestDto,
  CustomerVerificationDto,
  ApproveTransactionDto,
  RejectTransactionDto,
  ProcessTransactionDto,
  CancelTransactionDto,
  ReverseTransactionDto,
  HoldManagementDto,
  TransactionQueryDto,
  TransactionResponseDto,
  TransactionListResponseDto,
  TransactionStatsResponseDto,
  BalanceInquiryResponseDto,
  BulkTransactionActionDto,
  TransactionReceiptDto,
} from '../dto/transaction.dto';

export interface AgentInfo {
  id: string;
  name: string;
  phone: string;
  ipAddress?: string;
  location?: string;
  deviceInfo?: Record<string, any>;
}

export interface WithdrawalFeeStructure {
  fixedFee: number;
  percentageFee: number;
  minimumFee: number;
  maximumFee: number;
}

export interface ComplianceResult {
  passed: boolean;
  flags: Array<{
    flag: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
  }>;
  riskScore: number;
  requiresApproval: boolean;
  approvalLevel: ApprovalLevel;
}

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,

    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,

    @InjectRepository(Account)
    private accountRepository: Repository<Account>,

    private eventEmitter: EventEmitter2,

    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  // ===== WITHDRAWAL REQUEST MANAGEMENT =====

  async createWithdrawalRequest(
    companyId: string,
    agentInfo: AgentInfo,
    createDto: CreateWithdrawalRequestDto,
  ): Promise<TransactionResponseDto> {
    this.logger.log(`Creating withdrawal request for customer ${createDto.customerId} by agent ${agentInfo.id}`);

    // 1. Validate customer and account
    const customer = await this.validateCustomer(companyId, createDto.customerId);
    const account = await this.validateAccount(companyId, createDto.accountId, customer.id);

    // 2. Perform balance and limit checks
    await this.validateWithdrawalEligibility(account, createDto.amount);

    // 3. Calculate fees
    const feeAmount = await this.calculateWithdrawalFee(account, createDto.amount);

    // 4. Perform compliance and risk assessment
    const complianceResult = await this.performComplianceCheck(customer, account, createDto.amount);

    // 5. Create transaction entity
    const transactionData = await this.transactionRepository.create({
      companyId,
      customerId: createDto.customerId,
      accountId: createDto.accountId,
      amount: createDto.amount,
      currency: createDto.currency || 'GHS',
      description: createDto.description,
      agentId: agentInfo.id,
      agentName: agentInfo.name,
      agentPhone: agentInfo.phone,
      channel: createDto.channel,
      reference: createDto.reference,
      balanceBefore: account.currentBalance,
      availableBalanceBefore: account.availableBalance,
      location: createDto.location || agentInfo.location,
      ipAddress: agentInfo.ipAddress,
    });

    // Set fee and compliance data
    transactionData.feeAmount = feeAmount;
    transactionData.totalAmount = createDto.amount + feeAmount;
    transactionData.riskScore = complianceResult.riskScore;
    transactionData.complianceFlags = complianceResult.flags.map((flag: any) => ({
      ...flag,
      raisedAt: flag.raisedAt || new Date().toISOString()
    }));
    transactionData.requiredApprovalLevel = complianceResult.approvalLevel;
    transactionData.customerPresent = createDto.customerPresent ?? true;
    transactionData.priority = createDto.priority;
    transactionData.notes = createDto.notes;
    transactionData.agentDeviceInfo = agentInfo.deviceInfo;

    // Set AML and sanctions check requirements
    if (complianceResult.riskScore >= 50 || createDto.amount >= 1000) {
      transactionData.amlCheckRequired = true;
    }
    if (complianceResult.riskScore >= 70 || createDto.amount >= 5000) {
      transactionData.sanctionsCheckRequired = true;
    }

    // Create and save transaction
    const transaction = this.transactionRepository.create(transactionData);
    await this.transactionRepository.save(transaction);

    // 6. Place hold on account if required
    if (createDto.amount <= account.availableBalance) {
      await this.placeTransactionHold(transaction.id, createDto.amount + feeAmount);
    }

    // 7. Cache transaction for quick access
    await this.cacheManager.set(
      `transaction:${transaction.id}`,
      transaction,
      300000, // 5 minutes
    );

    // 8. Emit event for real-time updates
    this.eventEmitter.emit('transaction.created', {
      transactionId: transaction.id,
      customerId: customer.id,
      accountId: account.id,
      agentId: agentInfo.id,
      amount: createDto.amount,
      type: TransactionType.WITHDRAWAL,
      status: TransactionStatus.PENDING,
    });

    this.logger.log(`Withdrawal request created: ${transaction.transactionNumber}`);

    return this.formatTransactionResponse(await this.getTransactionById(companyId, transaction.id));
  }

  async verifyCustomer(
    companyId: string,
    transactionId: string,
    agentId: string,
    verificationDto: CustomerVerificationDto,
  ): Promise<TransactionResponseDto> {
    this.logger.log(`Verifying customer for transaction ${transactionId}`);

    const transaction = await this.getTransactionById(companyId, transactionId);

    // Validate agent can perform verification
    if (transaction.agentId !== agentId) {
      throw new ForbiddenException('Only the initiating agent can verify customer');
    }

    if (!transaction.isPending) {
      throw new BadRequestException('Customer verification only allowed for pending transactions');
    }

    // Perform verification based on method
    switch (verificationDto.method) {
      case AuthenticationMethod.PIN:
        if (verificationDto.pinVerified) {
          transaction.setPin(true);
        }
        break;

      case AuthenticationMethod.OTP:
        if (verificationDto.otpCode && verificationDto.otpVerified) {
          // Here you would integrate with OTP service
          const otpValid = await this.validateOtp(transaction.customer?.phoneNumber , verificationDto.otpCode);
          if (otpValid) {
            transaction.setOtp(true);
          }
        }
        break;

      case AuthenticationMethod.BIOMETRIC:
        if (verificationDto.biometricVerified && verificationDto.biometricHash) {
          // Here you would integrate with biometric service
          const biometricValid = await this.validateBiometric(
            transaction.customerId,
            verificationDto.biometricHash,
          );
          if (biometricValid) {
            transaction.setBiometric(true, verificationDto.biometricHash);
          }
        }
        break;

      case AuthenticationMethod.AGENT_VERIFICATION:
        // Agent visual verification
        transaction.verifyCustomer(AuthenticationMethod.AGENT_VERIFICATION, {
          agentConfirmed: true,
          verificationTime: new Date().toISOString(),
        });
        break;
    }

    // Save verification updates
    await this.transactionRepository.save(transaction);

    // Check if customer is now fully verified and auto-approve if possible
    if (transaction.customerVerified && !transaction.isHighRisk && transaction.amount < 1000) {
      await this.autoApproveTransaction(transaction);
    }

    // Emit verification event
    this.eventEmitter.emit('transaction.customer_verified', {
      transactionId: transaction.id,
      customerId: transaction.customerId,
      method: verificationDto.method,
      verified: transaction.customerVerified,
    });

    return this.formatTransactionResponse(transaction);
  }

  async approveTransaction(
    companyId: string,
    transactionId: string,
    approverId: string,
    approveDto: ApproveTransactionDto,
  ): Promise<TransactionResponseDto> {
    this.logger.log(`Approving transaction ${transactionId} by ${approverId}`);

    const transaction = await this.getTransactionById(companyId, transactionId);

    if (!transaction.canBeApproved) {
      throw new BadRequestException('Transaction cannot be approved in current state');
    }

    // Validate approver has sufficient authority
    await this.validateApprovalAuthority(approverId, transaction.requiredApprovalLevel);

    // Check customer verification unless bypassed
    if (!transaction.customerVerified && !approveDto.bypassChecks) {
      throw new BadRequestException('Customer must be verified before approval');
    }

    // Perform final compliance checks unless bypassed
    if (!approveDto.bypassChecks) {
      await this.performFinalComplianceCheck(transaction);
    }

    // Approve transaction
    transaction.approve(approverId, approveDto.notes);
    await this.transactionRepository.save(transaction);

    // Schedule for processing if auto-processing is enabled
    if (transaction.amount < 2000 && transaction.customerVerified) {
      await this.scheduleTransactionProcessing(transaction.id);
    }

    // Emit approval event
    this.eventEmitter.emit('transaction.approved', {
      transactionId: transaction.id,
      approverId,
      amount: transaction.amount,
      customerId: transaction.customerId,
    });

    this.logger.log(`Transaction approved: ${transaction.transactionNumber}`);

    return this.formatTransactionResponse(transaction);
  }

  async rejectTransaction(
    companyId: string,
    transactionId: string,
    rejecterId: string,
    rejectDto: RejectTransactionDto,
  ): Promise<TransactionResponseDto> {
    this.logger.log(`Rejecting transaction ${transactionId} by ${rejecterId}`);

    const transaction = await this.getTransactionById(companyId, transactionId);

    if (!transaction.isPending) {
      throw new BadRequestException('Only pending transactions can be rejected');
    }

    // Reject transaction
    transaction.reject(rejecterId, rejectDto.reason);
    await this.transactionRepository.save(transaction);

    // Release hold
    if (transaction.holdPlaced) {
      await this.releaseTransactionHold(transaction.id);
    }

    // Emit rejection event
    this.eventEmitter.emit('transaction.rejected', {
      transactionId: transaction.id,
      rejecterId,
      reason: rejectDto.reason,
      customerId: transaction.customerId,
      allowResubmission: rejectDto.allowResubmission,
    });

    this.logger.log(`Transaction rejected: ${transaction.transactionNumber}`);

    return this.formatTransactionResponse(transaction);
  }

  async processTransaction(
    companyId: string,
    transactionId: string,
    processedBy: string,
    processDto: ProcessTransactionDto,
  ): Promise<TransactionResponseDto> {
    this.logger.log(`Processing transaction ${transactionId} by ${processedBy}`);

    const transaction = await this.getTransactionById(companyId, transactionId);

    if (!transaction.canBeProcessed && !processDto.forceProcess) {
      throw new BadRequestException('Transaction cannot be processed in current state');
    }

    // Start processing
    transaction.startProcessing(processedBy);
    await this.transactionRepository.save(transaction);

    try {
      // Process the actual withdrawal
      const { newBalance, newAvailableBalance } = await this.processWithdrawal(
        transaction.account,
        transaction.totalAmount,
      );

      // Complete transaction
      transaction.complete(newBalance, newAvailableBalance);
      
      // Generate receipt
      const receiptNumber = await this.generateReceipt(transaction);
      transaction.receiptNumber = receiptNumber;

      await this.transactionRepository.save(transaction);

      // Send notifications
      await this.sendTransactionNotifications(transaction);

      // Emit completion event
      this.eventEmitter.emit('transaction.completed', {
        transactionId: transaction.id,
        transactionNumber: transaction.transactionNumber,
        customerId: transaction.customerId,
        amount: transaction.amount,
        newBalance,
      });

      this.logger.log(`Transaction completed: ${transaction.transactionNumber}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? getErrorMessage(error) : JSON.stringify(error);
      const errorStack = error instanceof Error ? getErrorStack(error) : undefined;
      
      this.logger.error(`Transaction processing failed: ${errorMessage}`, errorStack);
      
      // Mark as failed
      transaction.fail(errorMessage, { error: error.toString() });
      await this.transactionRepository.save(transaction);

      // Emit failure event
      this.eventEmitter.emit('transaction.failed', {
        transactionId: savedTransaction.id,
        error: errorMessage,
        customerId: transaction.customerId,
      });

      throw error;
    }

    return this.formatTransactionResponse(transaction);
  }

  async cancelTransaction(
    companyId: string,
    transactionId: string,
    cancelledBy: string,
    cancelDto: CancelTransactionDto,
  ): Promise<TransactionResponseDto> {
    this.logger.log(`Cancelling transaction ${transactionId} by ${cancelledBy}`);

    const transaction = await this.getTransactionById(companyId, transactionId);

    transaction.cancel(cancelledBy, cancelDto.reason);
    await this.transactionRepository.save(transaction);

    // Release hold
    if (transaction.holdPlaced) {
      await this.releaseTransactionHold(savedTransaction.id);
    }

    // Emit cancellation event
    this.eventEmitter.emit('transaction.cancelled', {
      transactionId: savedTransaction.id,
      cancelledBy,
      reason: cancelDto.reason,
      customerId: transaction.customerId,
    });

    return this.formatTransactionResponse(transaction);
  }

  // ===== BALANCE AND ACCOUNT MANAGEMENT =====

  async getAccountBalance(
    companyId: string,
    accountId: string,
  ): Promise<BalanceInquiryResponseDto> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, companyId },
      relations: ["customer"],
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Calculate daily limits and usage
    const dailyUsage = await this.calculateDailyWithdrawalUsage(account.id);
    const monthlyUsage = await this.calculateMonthlyTransactionUsage(account.id);

    return {
      accountId: account.id,
      accountNumber: account.accountNumber,
      currentBalance: account.currentBalance,
      availableBalance: account.availableBalance,
      ledgerBalance: account.ledgerBalance,
      pendingCredits: account.pendingCredits,
      pendingDebits: account.pendingDebits,
      holdAmount: account.holdAmount,
      currency: account.currency,
      accountStatus: account.status,
      canTransact: account.canTransact,
      dailyWithdrawalLimit: account.dailyWithdrawalLimit,
      remainingDailyLimit: Math.max(0, account.dailyWithdrawalLimit - dailyUsage),
      limits: {
        dailyWithdrawal: account.dailyWithdrawalLimit,
        dailyDeposit: account.dailyDepositLimit,
        monthlyTransaction: account.monthlyTransactionLimit,
        remainingDaily: Math.max(0, account.dailyWithdrawalLimit - dailyUsage),
        remainingMonthly: Math.max(0, account.monthlyTransactionLimit - monthlyUsage),
      },
      lastTransactionDate: account.lastTransactionDate?.toISOString(),
      asOfDate: new Date().toISOString(),
    };
  }

  // ===== HOLD MANAGEMENT =====

  async placeTransactionHold(
    transactionId: string,
    holdAmount: number,
    expiryMinutes: number = 30,
  ): Promise<void> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['account'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Place hold on transaction
    transaction.placeHold(holdAmount, expiryMinutes);
    
    // Update account hold amount
    transaction.account.holdAmount += holdAmount;
    transaction.account.availableBalance -= holdAmount;

    await this.transactionRepository.save(transaction);
    await this.accountRepository.save(transaction.account);

    this.logger.log(`Hold placed on transaction ${transactionId} for amount ${holdAmount}`);
  }

  async releaseTransactionHold(transactionId: string): Promise<void> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['account'],
    });

    if (!transaction || !transaction.holdPlaced) {
      return;
    }

    const holdAmount = transaction.holdAmount;

    // Release hold on transaction
    transaction.releaseHold();
    
    // Update account hold amount
    transaction.account.holdAmount = Math.max(0, transaction.account.holdAmount - holdAmount);
    transaction.account.availableBalance += holdAmount;

    await this.transactionRepository.save(transaction);
    await this.accountRepository.save(transaction.account);

    this.logger.log(`Hold released on transaction ${transactionId} for amount ${holdAmount}`);
  }

  // ===== TRANSACTION QUERIES =====

  async getTransactions(
    companyId: string,
    query: TransactionQueryDto,
  ): Promise<TransactionListResponseDto> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.customer', UserRole.CUSTOMER)
      .leftJoinAndSelect('transaction.account', 'account')
      .where('transaction.companyId = :companyId', { companyId });

    // Apply filters
    if (query.type) {
      queryBuilder.andWhere('transaction.type = :type', { type: query.type });
    }

    if (query.status) {
      queryBuilder.andWhere('transaction.status = :status', { status: query.status });
    }

    if (query.customerId) {
      queryBuilder.andWhere('transaction.customerId = :customerId', { customerId: query.customerId });
    }

    if (query.accountId) {
      queryBuilder.andWhere('transaction.accountId = :accountId', { accountId: query.accountId });
    }

    if (query.agentId) {
      queryBuilder.andWhere('transaction.agentId = :agentId', { agentId: query.agentId });
    }

    if (query.channel) {
      queryBuilder.andWhere('transaction.channel = :channel', { channel: query.channel });
    }

    if (query.minAmount) {
      queryBuilder.andWhere('transaction.amount >= :minAmount', { minAmount: query.minAmount });
    }

    if (query.maxAmount) {
      queryBuilder.andWhere('transaction.amount <= :maxAmount', { maxAmount: query.maxAmount });
    }

    if (query.dateFrom) {
      queryBuilder.andWhere('transaction.createdAt >= :dateFrom', { dateFrom: query.dateFrom });
    }

    if (query.dateTo) {
      queryBuilder.andWhere('transaction.createdAt <= :dateTo', { dateTo: query.dateTo });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(savedTransaction.transactionNumber ILIKE :search OR transaction.reference ILIKE :search OR transaction.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.highRiskOnly) {
      queryBuilder.andWhere('transaction.riskScore >= 70');
    }

    if (query.pendingApproval) {
      queryBuilder.andWhere('transaction.approvalRequired = true')
        .andWhere('transaction.status = :pendingStatus', { pendingStatus: TransactionStatus.PENDING });
    }

    if (query.withHolds) {
      queryBuilder.andWhere('transaction.holdPlaced = true');
    }

    // Apply sorting
    queryBuilder.orderBy(`transaction.${query.sortBy}`, query.sortOrder);

    // Apply pagination
    const offset = (query.page - 1) * query.limit;
    queryBuilder.skip(offset).take(query.limit);

    const [transactions, total] = await queryBuilder.getManyAndCount();

    return {
      transactions: transactions.map(t => this.formatTransactionResponse(t)),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async getTransactionById(companyId: string, transactionId: string): Promise<Transaction> {
    // Try cache first
    const cached = await this.cacheManager.get<Transaction>(`transaction:${transactionId}`);
    if (cached && cached.companyId === companyId) {
      return cached;
    }

    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId, companyId },
      relations: ["customer", 'account'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Cache for future requests
    await this.cacheManager.set(`transaction:${transactionId}`, transaction, 300000);

    return transaction;
  }

  async getTransactionStats(
    companyId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<TransactionStatsResponseDto> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.companyId = :companyId', { companyId });

    if (dateFrom) {
      queryBuilder.andWhere('transaction.createdAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('transaction.createdAt <= :dateTo', { dateTo });
    }

    const transactions = await queryBuilder.getMany();

    // Calculate statistics
    const stats = this.calculateTransactionStatistics(transactions);

    return stats;
  }

  // ===== PRIVATE HELPER METHODS =====

  private async validateCustomer(companyId: string, customerId: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId, companyId, isActive: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found or inactive');
    }

    if (!customer.isVerified) {
      throw new BadRequestException('Customer not verified for transactions');
    }

    return customer;
  }

  private async validateAccount(companyId: string, accountId: string, customerId: string): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, companyId, customerId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (!account.canTransact) {
      throw new BadRequestException('Account is not eligible for transactions');
    }

    if (account.isFrozen) {
      throw new BadRequestException('Account is frozen');
    }

    return account;
  }

  private async validateWithdrawalEligibility(account: Account, amount: number): Promise<void> {
    // Check minimum balance
    if (account.availableBalance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    // Check daily withdrawal limit
    const dailyUsage = await this.calculateDailyWithdrawalUsage(account.id);
    if (dailyUsage + amount > account.dailyWithdrawalLimit) {
      throw new BadRequestException('Daily withdrawal limit exceeded');
    }

    // Check minimum withdrawal amount
    if (amount < 10) {
      throw new BadRequestException('Minimum withdrawal amount is GHS 10');
    }

    // Check maximum single withdrawal
    if (amount > 5000) {
      throw new BadRequestException('Maximum single withdrawal amount is GHS 5,000');
    }
  }

  private async calculateWithdrawalFee(account: Account, amount: number): Promise<number> {
    // Fee structure based on account type and amount
    const feeStructures: Record<string, WithdrawalFeeStructure> = {
      savings: { fixedFee: 2, percentageFee: 0.5, minimumFee: 1, maximumFee: 10 },
      current: { fixedFee: 1, percentageFee: 0.25, minimumFee: 1, maximumFee: 15 },
      wallet: { fixedFee: 0.5, percentageFee: 0.1, minimumFee: 0.5, maximumFee: 5 },
    };

    const structure = feeStructures[account.accountType] || feeStructures.savings;
    
    const calculatedFee = structure.fixedFee + (amount * structure.percentageFee / 100);
    
    return Math.max(structure.minimumFee, Math.min(calculatedFee, structure.maximumFee));
  }

  private async performComplianceCheck(customer: Customer, account: Account, amount: number): Promise<ComplianceResult> {
    const flags: Array<{ flag: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; description: string }> = [];
    let riskScore = 0;

    // Customer risk factors
    if ((transaction.customer as any).riskLevel === 'high') {
      riskScore += 30;
      flags.push({ flag: 'HIGH_RISK_CUSTOMER', severity: 'HIGH', description: 'Customer marked as high risk' });
    }

    // Transaction amount factors
    if (amount >= 2000) {
      riskScore += 20;
      flags.push({ flag: 'LARGE_AMOUNT', severity: 'MEDIUM', description: 'Large withdrawal amount' });
    }

    if (amount >= 5000) {
      riskScore += 30;
      flags.push({ flag: 'VERY_LARGE_AMOUNT', severity: 'HIGH', description: 'Very large withdrawal amount' });
    }

    // Account activity factors
    const recentTransactions = await this.getRecentTransactionCount(account.id, 24); // Last 24 hours
    if (recentTransactions > 5) {
      riskScore += 15;
      flags.push({ flag: 'HIGH_FREQUENCY', severity: 'MEDIUM', description: 'High transaction frequency' });
    }

    // Time-based factors
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      riskScore += 10;
      flags.push({ flag: 'OFF_HOURS', severity: 'LOW', description: 'Transaction outside normal hours' });
    }

    // Determine approval level
    let approvalLevel = ApprovalLevel.CLERK;
    if (riskScore >= 50 || amount >= 2000) {
      approvalLevel = ApprovalLevel.MANAGER;
    }
    if (riskScore >= 80 || amount >= 5000) {
      approvalLevel = ApprovalLevel.ADMIN;
    }

    return {
      passed: riskScore < 90,
      flags,
      riskScore,
      requiresApproval: riskScore >= 30 || amount >= 500,
      approvalLevel,
    };
  }

  private async autoApproveTransaction(transaction: Transaction): Promise<void> {
    // Auto-approve low-risk, small amount transactions
    if (transaction.riskScore < 30 && transaction.amount < 1000 && transaction.customerVerified) {
      transaction.approve('SYSTEM_AUTO_APPROVAL', 'Automatically approved: low risk, verified customer');
      await this.transactionRepository.save(transaction);

      this.eventEmitter.emit('transaction.auto_approved', {
        transactionId: savedTransaction.id,
        riskScore: transaction.riskScore,
        amount: transaction.amount,
      });
    }
  }

  private async validateApprovalAuthority(approverId: string, requiredLevel: ApprovalLevel): Promise<void> {
    // Here you would integrate with the identity service to check user roles
    // For now, we'll assume the validation passes
    // In a real implementation: { roadmap: { phases: [], dependencies: [], milestones: [] }, resourcePlan: { resources: [], budget: 0, timeline: "Q1-Q4 2024" }, riskAssessment: { risks: [], mitigation: [], probability: 0, impact: 0 } }, you'd check if the approver has the required role level
  }

  private async performFinalComplianceCheck(transaction: Transaction): Promise<void> {
    // Perform any final AML or sanctions checks
    if (transaction.amlCheckRequired && !transaction.amlCheckCompleted) {
      // Integrate with AML service
      transaction.completeAmlCheck('CLEAR');
    }

    if (transaction.sanctionsCheckRequired && !transaction.sanctionsCheckCompleted) {
      // Integrate with sanctions screening service
      transaction.completeSanctionsCheck('CLEAR');
    }

    await this.transactionRepository.save(transaction);
  }

  private async scheduleTransactionProcessing(transactionId: string): Promise<void> {
    // Here you would add the transaction to a processing queue
    // For now, we'll emit an event
    this.eventEmitter.emit('transaction.scheduled_for_processing', { transactionId });
  }

  private async processWithdrawal(account: Account, amount: number): Promise<{ newBalance: number; newAvailableBalance: number }> {
    // Debit the account
    account.currentBalance -= amount;
    account.availableBalance -= amount;
    account.ledgerBalance -= amount;
    account.lastTransactionDate = new Date();

    await this.accountRepository.save(account);

    return {
      newBalance: account.currentBalance,
      newAvailableBalance: account.availableBalance,
    };
  }

  private async generateReceipt(transaction: Transaction): Promise<string> {
    // Generate unique receipt number
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RCP${timestamp}${random}`;
  }

  private async sendTransactionNotifications(transaction: Transaction): Promise<void> {
    // Send SMS notification
    if (transaction.customer?.phoneNumber ) {
      this.eventEmitter.emit('notification.sms', {
        phoneNumber: transaction.customer?.phoneNumber ,
        message: `Transaction ${transaction.transactionNumber} completed. Amount: ${transaction.currency} ${transaction.amount}. New balance: ${transaction.currency} ${transaction.accountBalanceAfter}`,
        transactionId: transaction.id,
      });
    }

    // Send email notification if available
    if (transaction.customer.email) {
      this.eventEmitter.emit('notification.email', {
        email: transaction.customer.email,
        subject: 'Transaction Completed',
        transactionId: transaction.id,
      });
    }
  }

  private async validateOtp(phoneNumber: string, otpCode: string): Promise<boolean> {
    // Integrate with OTP service
    // For now, return true for demo purposes
    return true;
  }

  private async validateBiometric(customerId: string, biometricHash: string): Promise<boolean> {
    // Integrate with biometric service
    // For now, return true for demo purposes
    return true;
  }

  private async calculateDailyWithdrawalUsage(accountId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'total')
      .where('transaction.accountId = :accountId', { accountId })
      .andWhere('transaction.type = :type', { type: TransactionType.WITHDRAWAL })
      .andWhere('transaction.status IN (:...statuses)', { 
        statuses: [TransactionStatus.APPROVED, TransactionStatus.PROCESSING, TransactionStatus.COMPLETED] 
      })
      .andWhere('transaction.createdAt >= :today', { today })
      .andWhere('transaction.createdAt < :tomorrow', { tomorrow })
      .getRawOne();

    return parseFloat(result.total) || 0;
  }

  private async calculateMonthlyTransactionUsage(accountId: string): Promise<number> {
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'total')
      .where('transaction.accountId = :accountId', { accountId })
      .andWhere('transaction.status IN (:...statuses)', { 
        statuses: [TransactionStatus.APPROVED, TransactionStatus.PROCESSING, TransactionStatus.COMPLETED] 
      })
      .andWhere('transaction.createdAt >= :firstDay', { firstDay: firstDayOfMonth })
      .getRawOne();

    return parseFloat(result.total) || 0;
  }

  private async getRecentTransactionCount(accountId: string, hours: number): Promise<number> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const count = await this.transactionRepository.count({
      where: {
        accountId,
        createdAt: MoreThanOrEqual(since),
      },
    });

    return count;
  }

  private calculateTransactionStatistics(transactions: Transaction[]): TransactionStatsResponseDto {
    const total = Object.values(transactions).length;
    const completed = transactions.filter(t => t.status === TransactionStatus.COMPLETED).length;
    const pending = transactions.filter(t => t.status === TransactionStatus.PENDING).length;
    const approved = transactions.filter(t => t.status === TransactionStatus.APPROVED).length;
    const rejected = transactions.filter(t => t.status === TransactionStatus.REJECTED).length;
    const failed = transactions.filter(t => t.status === TransactionStatus.FAILED).length;
    const cancelled = transactions.filter(t => t.status === TransactionStatus.CANCELLED).length;
    const reversed = transactions.filter(t => t.reversed).length;

    const totalVolume = Object.values(transactions).reduce((sum, t) => sum + t.amount, 0);
    const averageAmount = total > 0 ? totalVolume / total : 0;
    const successRate = total > 0 ? (completed / total) * 100 : 0;

    const processingTimes = transactions
      .filter(t => t.processingTimeMs)
      .map(t => t.processingTimeMs);
    const averageProcessingTime = Object.values(processingTimes).length > 0 
      ? Object.values(processingTimes).reduce((sum, time) => sum + time, 0) / Object.values(processingTimes).length 
      : 0;

    const averageRiskScore = total > 0 
      ? Object.values(transactions).reduce((sum, t) => sum + t.riskScore, 0) / total 
      : 0;

    // Additional statistics would be calculated here...

    return {
      total,
      pending,
      approved,
      completed,
      rejected,
      failed,
      cancelled,
      reversed,
      totalVolume,
      averageAmount,
      successRate,
      averageProcessingTime,
      averageRiskScore,
      typeStats: {} as any, // Would be calculated
      statusStats: {} as any, // Would be calculated
      agentStats: [], // Would be calculated
      channelStats: {} as any, // Would be calculated
      hourlyStats: [], // Would be calculated
    };
  }

  private formatTransactionResponse(transaction: Transaction): TransactionResponseDto {
    return {
      id: transaction.id,
      transactionNumber: transaction.transactionNumber,
      companyId: transaction.companyId,
      customerId: transaction.customerId,
      accountId: transaction.accountId,
      type: transaction.type,
      status: transaction.status,
      channel: transaction.channel,
      priority: transaction.priority,
      amount: transaction.amount,
      currency: transaction.currency,
      feeAmount: transaction.feeAmount,
      totalAmount: transaction.totalAmount,
      accountBalanceBefore: transaction.accountBalanceBefore,
      accountBalanceAfter: transaction.accountBalanceAfter,
      availableBalanceBefore: transaction.availableBalanceBefore,
      availableBalanceAfter: transaction.availableBalanceAfter,
      description: transaction.description,
      reference: transaction.reference,
      agent: {
        id: transaction.agentId,
        name: transaction.agentName,
        phone: transaction.agentPhone,
        location: transaction.agentLocation,
      },
      customer: {
        id: transaction.customer.id,
        fullName: transaction.customer.fullName,
        phoneNumber: transaction.customer?.phoneNumber ,
        customerNumber: transaction.customer.customerNumber,
      },
      account: {
        id: transaction.account.id,
        accountNumber: transaction.account.accountNumber,
        accountType: transaction.account.accountType,
        currency: transaction.account.currency,
      },
      verification: {
        customerPresent: transaction.customerPresent,
        customerVerified: transaction.customerVerified,
        verificationMethods: transaction.verificationMethod || [],
        pinVerified: transaction.pinVerified,
        otpVerified: transaction.otpVerified,
        biometricVerified: !!transaction.biometricHash,
      },
      approval: {
        required: transaction.approvalRequired,
        level: transaction.requiredApprovalLevel,
        approvedBy: transaction.approvedBy,
        approvedAt: transaction.approvedAt?.toISOString(),
        rejectedBy: transaction.rejectedBy,
        rejectedAt: transaction.rejectedAt?.toISOString(),
        rejectionReason: transaction.rejectionReason,
        notes: transaction.approvalNotes,
      },
      hold: {
        placed: transaction.holdPlaced,
        amount: transaction.holdAmount,
        reference: transaction.holdReference,
        placedAt: transaction.holdPlacedAt?.toISOString(),
        expiresAt: transaction.holdExpiresAt?.toISOString(),
        releasedAt: transaction.holdReleasedAt?.toISOString(),
      },
      risk: {
        score: transaction.riskScore,
        factors: transaction.riskFactors,
        isHighRisk: transaction.isHighRisk,
      },
      compliance: {
        amlCheckRequired: transaction.amlCheckRequired,
        amlCheckCompleted: transaction.amlCheckCompleted,
        amlCheckResult: transaction.amlCheckResult,
        sanctionsCheckRequired: transaction.sanctionsCheckRequired,
        sanctionsCheckCompleted: transaction.sanctionsCheckCompleted,
        flags: transaction.complianceFlags,
      },
      processing: {
        scheduledAt: transaction.scheduledAt?.toISOString(),
        processedAt: transaction.processedAt?.toISOString(),
        completedAt: transaction.completedAt?.toISOString(),
        processingTimeMs: transaction.processingTimeMs,
        processedBy: transaction.processedBy,
      },
      receipt: {
        receiptNumber: transaction.receiptNumber,
        printed: transaction.receiptPrinted,
        printedAt: transaction.receiptPrintedAt?.toISOString(),
      },
      notifications: {
        customerNotified: transaction.customerNotified,
        smsSent: transaction.smsSent,
        emailSent: transaction.emailSent,
        notificationSentAt: transaction.customerNotificationSentAt?.toISOString(),
      },
      error: transaction.lastError ? {
        lastError: transaction.lastError,
        retryCount: transaction.retryCount,
        maxRetries: transaction.maxRetries,
      } : undefined,
      reversal: {
        reversed: transaction.reversed,
        reversedAt: transaction.reversedAt?.toISOString(),
        reversedBy: transaction.reversedBy,
        reversalReason: transaction.reversalReason,
        isReversal: transaction.isReversal,
        originalTransactionId: transaction.originalTransactionId,
      },
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
      metadata: transaction.metadata,
      notes: transaction.notes,
    };
  }
}