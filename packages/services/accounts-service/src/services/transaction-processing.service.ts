import { getErrorMessage, getErrorStack, getErrorStatus, UserRole, ReportType, LibraryCapability } from '@sabs/common';

import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { nanoid } from 'nanoid';

import { Transaction, TransactionStatus, TransactionType } from '../entities/transaction.entity';
import { Account } from '../entities/account.entity';
import { Customer } from '../entities/customer.entity';
import { ApprovalWorkflow, WorkflowStatus } from '../entities/approval-workflow.entity';

export interface ProcessingResult {
  success: boolean;
  transactionId: string;
  transactionNumber: string;
  finalBalance: number;
  finalAvailableBalance: number;
  receiptNumber?: string;
  processingTimeMs: number;
  message: string;
  errorCode?: string;
  errorDetails?: Record<string, any>;
}

export interface BalanceUpdate {
  accountId: string;
  previousBalance: number;
  newBalance: number;
  previousAvailableBalance: number;
  newAvailableBalance: number;
  amount: number;
  effectiveAmount: number;
  feesApplied: number;
}

export interface FeeCalculation {
  baseFee: number;
  percentageFee: number;
  totalFees: number;
  feeBreakdown: Array<{
    type: string;
    description: string;
    amount: number;
    rate?: number;
  }>;
}

export interface Receipt {
  receiptNumber: string;
  transactionNumber: string;
  customerName: string;
  customerPhone: string;
  accountNumber: string;
  transactionType: string;
  amount: number;
  fees: number;
  totalAmount: number;
  balanceAfter: number;
  agentName: string;
  agentPhone: string;
  location: string;
  timestamp: string;
  reference: string;
  signature?: string;
}

export interface ReconciliationEntry {
  transactionId: string;
  accountId: string;
  expectedBalance: number;
  actualBalance: number;
  variance: number;
  reconciled: boolean;
  reconciliationNotes?: string;
}

@Injectable()
export class TransactionProcessingService {
  private readonly logger = new Logger(TransactionProcessingService.name);

  // Fee structure configuration
  private readonly feeStructure = {
    withdrawal: {
      savings: { baseFee: 2.00, percentageRate: 0.005, maxFee: 50.00 }, // 0.5% with GHS 2 base
      current: { baseFee: 1.50, percentageRate: 0.003, maxFee: 30.00 }, // 0.3% with GHS 1.50 base
      wallet: { baseFee: 1.00, percentageRate: 0.002, maxFee: 20.00 },  // 0.2% with GHS 1 base
    },
    transfer: {
      internal: { baseFee: 0.50, percentageRate: 0.001, maxFee: 10.00 },
      external: { baseFee: 5.00, percentageRate: 0.01, maxFee: 100.00 },
    },
    deposit: {
      cash: { baseFee: 0.00, percentageRate: 0.000, maxFee: 0.00 }, // Free cash deposits
      check: { baseFee: 2.50, percentageRate: 0.002, maxFee: 25.00 },
    },
  };

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,

    @InjectRepository(Account)
    private accountRepository: Repository<Account>,

    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,

    @InjectRepository(ApprovalWorkflow)
    private workflowRepository: Repository<ApprovalWorkflow>,

    private dataSource: DataSource,
    private eventEmitter: EventEmitter2,

    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  // ===== MAIN TRANSACTION PROCESSING =====

  async processTransaction(
    companyId: string,
    transactionId: string,
    processedBy: string,
    forceProcess: boolean = false,
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    this.logger.log(`Processing transaction ${transactionId} by ${processedBy}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get transaction with lock for processing
      const transaction = await this.getTransactionForProcessing(
        queryRunner,
        companyId,
        transactionId,
        forceProcess,
      );

      // Validate transaction can be processed
      await this.validateTransactionForProcessing(transaction);

      // Get account with lock
      const account = await this.getAccountForProcessing(
        queryRunner,
        transaction.accountId,
      );

      // Calculate fees
      const feeCalculation = await this.calculateTransactionFees(transaction, account);

      // Update transaction with calculated fees
      transaction.feeAmount = feeCalculation.totalFees;
      transaction.totalAmount = transaction.amount + feeCalculation.totalFees;

      // Perform balance updates
      const balanceUpdate = await this.updateAccountBalance(
        queryRunner,
        transaction,
        account,
        feeCalculation,
      );

      // Update transaction status and completion
      await this.completeTransactionProcessing(
        queryRunner,
        transaction,
        balanceUpdate,
        processedBy,
      );

      // Generate receipt
      const receipt = await this.generateReceipt(transaction, account);

      // Release any holds
      await this.releaseTransactionHolds(queryRunner, transaction);

      // Create reconciliation entry
      await this.createReconciliationEntry(queryRunner, transaction, balanceUpdate);

      // Commit transaction
      await queryRunner.commitTransaction();

      // Clear caches
      await this.clearRelatedCaches(transaction);

      // Emit completion events
      const processingTimeMs = Date.now() - startTime;
      await this.emitProcessingEvents(transaction, balanceUpdate, receipt, processingTimeMs);

      this.logger.log(`Transaction ${transaction.transactionNumber} processed successfully in ${processingTimeMs}ms`);

      return {
        success: true,
        transactionId: transaction.id,
        transactionNumber: transaction.transactionNumber,
        finalBalance: balanceUpdate.newBalance,
        finalAvailableBalance: balanceUpdate.newAvailableBalance,
        receiptNumber: receipt.receiptNumber,
        processingTimeMs,
        message: 'Transaction processed successfully',
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      
             const processingTimeMs = Date.now() - startTime;
       this.logger.error(`Transaction processing failed: ${error instanceof Error ? getErrorMessage(error) : 'Unknown error'}`, error instanceof Error ? getErrorStack(error) : undefined);

             // Update transaction with error details
       await this.handleProcessingError(transactionId, error, processingTimeMs);

       return {
         success: false,
         transactionId,
         transactionNumber: 'Unknown',
         finalBalance: 0,
         finalAvailableBalance: 0,
         processingTimeMs,
         message: error instanceof Error ? getErrorMessage(error) : 'Unknown error',
         errorCode: (error as any)?.code || 'PROCESSING_ERROR',
         errorDetails: { 
           error: error instanceof Error ? getErrorMessage(error) : 'Unknown error', 
           stack: error instanceof Error ? getErrorStack(error) : undefined 
         },
       };

    } finally {
      await queryRunner.release();
    }
  }

  async processMultipleTransactions(
    companyId: string,
    transactionIds: string[],
    processedBy: string,
  ): Promise<ProcessingResult[]> {
    this.logger.log(`Batch processing ${transactionIds.length} transactions by ${processedBy}`);

    const results: ProcessingResult[] = [];
    
    // Process transactions in parallel with limited concurrency
    const concurrencyLimit = 5;
    const batches = this.chunkArray(transactionIds, concurrencyLimit);

    for (const batch of batches) {
      const batchPromises = batch.map(transactionId =>
        this.processTransaction(companyId, transactionId, processedBy).catch(error => ({
          success: false,
          transactionId,
          transactionNumber: 'Unknown',
          finalBalance: 0,
          finalAvailableBalance: 0,
          processingTimeMs: 0,
          message: error instanceof Error ? getErrorMessage(error) : JSON.stringify(error),
          errorCode: 'BATCH_PROCESSING_ERROR',
        }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    // Emit batch completion event
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    this.eventEmitter.emit('transaction.batch_processed', {
      processedBy,
      totalTransactions: results.length,
      successCount,
      failureCount,
      successRate: (successCount / results.length) * 100,
    });

    return results;
  }

  // ===== TRANSACTION REVERSAL =====

  async reverseTransaction(
    companyId: string,
    originalTransactionId: string,
    reversedBy: string,
    reason: string,
  ): Promise<ProcessingResult> {
    this.logger.log(`Reversing transaction ${originalTransactionId} by ${reversedBy}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get original transaction
      const originalTransaction = await this.getTransactionById(
        queryRunner,
        companyId,
        originalTransactionId,
      );

      // Validate transaction can be reversed
      await this.validateTransactionForReversal(originalTransaction);

      // Create reversal transaction
      const reversalTransaction = await this.createReversalTransaction(
        queryRunner,
        originalTransaction,
        reversedBy,
        reason,
      );

      // Get account with lock
      const account = await this.getAccountForProcessing(
        queryRunner,
        originalTransaction.accountId,
      );

      // Reverse the balance changes
      const balanceUpdate = await this.reverseAccountBalance(
        queryRunner,
        originalTransaction,
        reversalTransaction,
        account,
      );

      // Update both transactions
      await this.completeReversalProcessing(
        queryRunner,
        originalTransaction,
        reversalTransaction,
        balanceUpdate,
        reversedBy,
      );

      // Generate reversal receipt
      const receipt = await this.generateReversalReceipt(reversalTransaction, account);

      // Commit transaction
      await queryRunner.commitTransaction();

      // Clear caches
      await this.clearRelatedCaches(originalTransaction);

      // Emit reversal events
      this.eventEmitter.emit('transaction.reversed', {
        originalTransactionId,
        reversalTransactionId: reversalTransaction.id,
        reversedBy,
        reason,
        balanceUpdate,
      });

      this.logger.log(`Transaction ${originalTransaction.transactionNumber} reversed successfully`);

      return {
        success: true,
        transactionId: reversalTransaction.id,
        transactionNumber: reversalTransaction.transactionNumber,
        finalBalance: balanceUpdate.newBalance,
        finalAvailableBalance: balanceUpdate.newAvailableBalance,
        receiptNumber: receipt.receiptNumber,
        processingTimeMs: 0,
        message: 'Transaction reversed successfully',
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Transaction reversal failed: ${error instanceof Error ? getErrorMessage(error) : 'Unknown error'}`, error instanceof Error ? getErrorStack(error) : undefined);

      return {
        success: false,
        transactionId: originalTransactionId,
        transactionNumber: 'Unknown',
        finalBalance: 0,
        finalAvailableBalance: 0,
        processingTimeMs: 0,
        message: error instanceof Error ? getErrorMessage(error) : 'Unknown error',
        errorCode: 'REVERSAL_ERROR',
        errorDetails: { error: error instanceof Error ? getErrorMessage(error) : 'Unknown error' },
      };

    } finally {
      await queryRunner.release();
    }
  }

  // ===== BALANCE MANAGEMENT =====

  private async updateAccountBalance(
    queryRunner: QueryRunner,
    transaction: Transaction,
    account: Account,
    feeCalculation: FeeCalculation,
  ): Promise<BalanceUpdate> {
    const previousBalance = account.currentBalance;
    const previousAvailableBalance = account.availableBalance;
    
    let effectiveAmount: number;
    
    // Calculate effective amount based on transaction type
    switch (transaction.type) {
      case TransactionType.WITHDRAWAL:
        effectiveAmount = -(transaction.amount + feeCalculation.totalFees);
        break;
      case TransactionType.DEPOSIT:
        effectiveAmount = transaction.amount - feeCalculation.totalFees;
        break;
      case TransactionType.TRANSFER:
        effectiveAmount = -(transaction.amount + feeCalculation.totalFees);
        break;
      default:
        effectiveAmount = transaction.amount;
    }

    // Validate sufficient balance
    if (transaction.type === TransactionType.WITHDRAWAL || transaction.type === TransactionType.TRANSFER) {
      const requiredAmount = Math.abs(effectiveAmount);
      if (account.availableBalance < requiredAmount) {
        throw new BadRequestException(
          `Insufficient available balance. Required: ${requiredAmount}, Available: ${account.availableBalance}`
        );
      }
    }

    // Update balances
    const newBalance = previousBalance + effectiveAmount;
    const newAvailableBalance = previousAvailableBalance + effectiveAmount;

    // Update account
    account.currentBalance = newBalance;
    account.availableBalance = newAvailableBalance;
    account.lastTransactionDate = new Date();

    await queryRunner.manager.save(Account, account);

    // Update transaction with balance information
    transaction.accountBalanceBefore = previousBalance;
    transaction.accountBalanceAfter = newBalance;
    transaction.availableBalanceBefore = previousAvailableBalance;
    transaction.availableBalanceAfter = newAvailableBalance;

    return {
      accountId: account.id,
      previousBalance,
      newBalance,
      previousAvailableBalance,
      newAvailableBalance,
      amount: transaction.amount,
      effectiveAmount,
      feesApplied: feeCalculation.totalFees,
    };
  }

  private async reverseAccountBalance(
    queryRunner: QueryRunner,
    originalTransaction: Transaction,
    reversalTransaction: Transaction,
    account: Account,
  ): Promise<BalanceUpdate> {
    const previousBalance = account.currentBalance;
    const previousAvailableBalance = account.availableBalance;
    
    // Calculate reversal amount (opposite of original)
    const originalEffectiveAmount = originalTransaction.accountBalanceAfter - originalTransaction.accountBalanceBefore;
    const reversalEffectiveAmount = -originalEffectiveAmount;

    // Update balances
    const newBalance = previousBalance + reversalEffectiveAmount;
    const newAvailableBalance = previousAvailableBalance + reversalEffectiveAmount;

    // Update account
    account.currentBalance = newBalance;
    account.availableBalance = newAvailableBalance;
    account.lastTransactionDate = new Date();

    await queryRunner.manager.save(Account, account);

    // Update reversal transaction with balance information
    reversalTransaction.accountBalanceBefore = previousBalance;
    reversalTransaction.accountBalanceAfter = newBalance;
    reversalTransaction.availableBalanceBefore = previousAvailableBalance;
    reversalTransaction.availableBalanceAfter = newAvailableBalance;

    return {
      accountId: account.id,
      previousBalance,
      newBalance,
      previousAvailableBalance,
      newAvailableBalance,
      amount: reversalTransaction.amount,
      effectiveAmount: reversalEffectiveAmount,
      feesApplied: 0, // Typically no fees on reversals
    };
  }

  // ===== FEE CALCULATION =====

  private async calculateTransactionFees(
    transaction: Transaction,
    account: Account,
  ): Promise<FeeCalculation> {
    const feeBreakdown: Array<{
      type: string;
      description: string;
      amount: number;
      rate?: number;
    }> = [];

    let totalFees = 0;

    // Get fee structure based on transaction type and account type
    const transactionType = transaction.type.toLowerCase();
    const accountType = account.accountType.toLowerCase();

    if (this.feeStructure[transactionType] && this.feeStructure[transactionType][accountType]) {
      const feeConfig = this.feeStructure[transactionType][accountType];
      
      // Base fee
      if (feeConfig.baseFee > 0) {
        feeBreakdown.push({
          type: 'base_fee',
          description: `${transaction.type} base fee`,
          amount: feeConfig.baseFee,
        });
        totalFees += feeConfig.baseFee;
      }

      // Percentage fee
      if (feeConfig.percentageRate > 0) {
        const percentageFee = Math.min(
          transaction.amount * feeConfig.percentageRate,
          feeConfig.maxFee - feeConfig.baseFee
        );

        if (percentageFee > 0) {
          feeBreakdown.push({
            type: 'percentage_fee',
            description: `${(feeConfig.percentageRate * 100).toFixed(2)}% transaction fee`,
            amount: percentageFee,
            rate: feeConfig.percentageRate,
          });
          totalFees += percentageFee;
        }
      }

      // Apply maximum fee cap
      if (totalFees > feeConfig.maxFee) {
        const reduction = totalFees - feeConfig.maxFee;
        feeBreakdown.push({
          type: 'fee_cap_adjustment',
          description: 'Maximum fee cap applied',
          amount: -reduction,
        });
        totalFees = feeConfig.maxFee;
      }
    }

    // Add additional fees based on special conditions
    await this.applySpecialFees(transaction, account, feeBreakdown);

    // Calculate final totals
    const finalTotalFees = feeBreakdown.reduce((sum, fee) => sum + fee.amount, 0);

    return {
      baseFee: feeBreakdown.find(f => f.type === 'base_fee')?.amount || 0,
      percentageFee: feeBreakdown.find(f => f.type === 'percentage_fee')?.amount || 0,
      totalFees: Math.max(finalTotalFees, 0), // Ensure non-negative
      feeBreakdown,
    };
  }

  private async applySpecialFees(
    transaction: Transaction,
    account: Account,
    feeBreakdown: Array<{
      type: string;
      description: string;
      amount: number;
      rate?: number;
    }>,
  ): Promise<void> {
    // High-risk transaction fee
    if (transaction.riskScore >= 70) {
      feeBreakdown.push({
        type: 'risk_fee',
        description: 'High-risk transaction fee',
        amount: 5.00,
      });
    }

    // After-hours fee
    const currentHour = new Date().getHours();
    if (currentHour < 8 || currentHour > 17) {
      feeBreakdown.push({
        type: 'after_hours_fee',
        description: 'After-hours processing fee',
        amount: 2.00,
      });
    }

    // Large amount fee
    if (transaction.amount > 10000) {
      feeBreakdown.push({
        type: 'large_amount_fee',
        description: 'Large amount processing fee',
        amount: 10.00,
      });
    }

    // Express processing fee (if flagged as urgent)
    if (transaction.priority === 'urgent') {
      feeBreakdown.push({
        type: 'express_fee',
        description: 'Express processing fee',
        amount: 15.00,
      });
    }
  }

  // ===== RECEIPT GENERATION =====

  private async generateReceipt(
    transaction: Transaction,
    account: Account,
  ): Promise<Receipt> {
    const receiptNumber = this.generateReceiptNumber();
    
    // Update transaction with receipt number
    transaction.receiptNumber = receiptNumber;
    await this.transactionRepository.save(transaction);

    const receipt: Receipt = {
      receiptNumber,
      transactionNumber: transaction.transactionNumber,
      customerName: transaction.customer.fullName,
      customerPhone: transaction.customer?.phoneNumber || (transaction.customer as any)?.phone,
      accountNumber: account.accountNumber,
      transactionType: transaction.type.toUpperCase(),
      amount: transaction.amount,
      fees: transaction.feeAmount,
      totalAmount: transaction.totalAmount,
      balanceAfter: transaction.accountBalanceAfter,
      agentName: transaction.agentName,
      agentPhone: transaction.agentPhone,
      location: transaction.agentLocation || 'Unknown',
      timestamp: transaction.completedAt.toISOString(),
      reference: transaction.reference || transaction.transactionNumber,
    };

    // Cache receipt for quick access
    await this.cacheManager.set(
      `receipt:${receiptNumber}`,
      receipt,
      3600000, // 1 hour
    );

    // Emit receipt generated event
    this.eventEmitter.emit('transaction.receipt_generated', {
      transactionId: transaction.id,
      receiptNumber,
      customerPhone: transaction.customer?.phoneNumber || (transaction.customer as any)?.phone,
    });

    return receipt;
  }

  private async generateReversalReceipt(
    reversalTransaction: Transaction,
    account: Account,
  ): Promise<Receipt> {
    const receiptNumber = this.generateReceiptNumber();
    
    reversalTransaction.receiptNumber = receiptNumber;
    await this.transactionRepository.save(reversalTransaction);

    const receipt: Receipt = {
      receiptNumber,
      transactionNumber: reversalTransaction.transactionNumber,
      customerName: reversalTransaction.customer.fullName,
      customerPhone: reversalTransaction.customer?.phoneNumber || (transaction.customer as any)?.phone || (transaction.customer as any)?.phone,
      accountNumber: account.accountNumber,
      transactionType: 'REVERSAL',
      amount: reversalTransaction.amount,
      fees: 0,
      totalAmount: reversalTransaction.amount,
      balanceAfter: reversalTransaction.accountBalanceAfter,
      agentName: reversalTransaction.agentName,
      agentPhone: reversalTransaction.agentPhone,
      location: reversalTransaction.agentLocation || 'Unknown',
      timestamp: reversalTransaction.completedAt.toISOString(),
      reference: `REV-${reversalTransaction.originalTransactionId}`,
    };

    await this.cacheManager.set(
      `receipt:${receiptNumber}`,
      receipt,
      3600000, // 1 hour
    );

    return receipt;
  }

  private generateReceiptNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = nanoid(4).toUpperCase();
    return `RCP${timestamp}${random}`;
  }

  // ===== VALIDATION METHODS =====

  private async validateTransactionForProcessing(transaction: Transaction): Promise<void> {
    if (!transaction.canBeProcessed) {
      throw new BadRequestException('Transaction cannot be processed in current state');
    }

    if (transaction.processedAt) {
      throw new ConflictException('Transaction has already been processed');
    }

    if (!transaction.isApproved) {
      throw new BadRequestException('Transaction must be approved before processing');
    }

    if (transaction.isExpired) {
      throw new BadRequestException('Transaction has expired and cannot be processed');
    }
  }

  private async validateTransactionForReversal(transaction: Transaction): Promise<void> {
    if (!transaction.canBeReversed) {
      throw new BadRequestException('Transaction cannot be reversed');
    }

    if (transaction.reversed) {
      throw new ConflictException('Transaction has already been reversed');
    }

    if (!transaction.isCompleted) {
      throw new BadRequestException('Only completed transactions can be reversed');
    }

    // Check if reversal time limit has passed (e.g., 24 hours)
    const reversalTimeLimit = 24 * 60 * 60 * 1000; // 24 hours in ms
    const timeSinceCompletion = Date.now() - transaction.completedAt.getTime();
    
    if (timeSinceCompletion > reversalTimeLimit) {
      throw new BadRequestException('Reversal time limit exceeded (24 hours)');
    }
  }

  // ===== HELPER METHODS =====

  private async getTransactionForProcessing(
    queryRunner: QueryRunner,
    companyId: string,
    transactionId: string,
    forceProcess: boolean,
  ): Promise<Transaction> {
    const transaction = await queryRunner.manager.findOne(Transaction, {
      where: { id: transactionId, companyId },
      relations: [UserRole.CUSTOMER, 'account'],
      lock: { mode: 'pessimistic_write' },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  private async getAccountForProcessing(
    queryRunner: QueryRunner,
    accountId: string,
  ): Promise<Account> {
    const account = await queryRunner.manager.findOne(Account, {
      where: { id: accountId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  private async getTransactionById(
    queryRunner: QueryRunner,
    companyId: string,
    transactionId: string,
  ): Promise<Transaction> {
    const transaction = await queryRunner.manager.findOne(Transaction, {
      where: { id: transactionId, companyId },
      relations: [UserRole.CUSTOMER, 'account'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  private async completeTransactionProcessing(
    queryRunner: QueryRunner,
    transaction: Transaction,
    balanceUpdate: BalanceUpdate,
    processedBy: string,
  ): Promise<void> {
    transaction.status = TransactionStatus.PROCESSING;
    transaction.processedBy = processedBy;
    transaction.processedAt = new Date();
    
    // Complete the transaction
    transaction.complete(
      balanceUpdate.newBalance,
      balanceUpdate.newAvailableBalance,
    );

    // Add processing audit entry
    transaction.addAuditEntry('PROCESSED', processedBy, {
      balanceUpdate,
      processingTime: transaction.processingTimeMs,
    });

    await queryRunner.manager.save(Transaction, transaction);
  }

  private async completeReversalProcessing(
    queryRunner: QueryRunner,
    originalTransaction: Transaction,
    reversalTransaction: Transaction,
    balanceUpdate: BalanceUpdate,
    reversedBy: string,
  ): Promise<void> {
    // Update original transaction
    originalTransaction.reverse(reversedBy, reversalTransaction.reversalReason);
    originalTransaction.reversalTransactionId = reversalTransaction.id;

    // Complete reversal transaction
    reversalTransaction.status = TransactionStatus.COMPLETED;
    reversalTransaction.processedBy = reversedBy;
    reversalTransaction.processedAt = new Date();
    reversalTransaction.completedAt = new Date();

    await queryRunner.manager.save(Transaction, originalTransaction);
    await queryRunner.manager.save(Transaction, reversalTransaction);
  }

  private async createReversalTransaction(
    queryRunner: QueryRunner,
    originalTransaction: Transaction,
    reversedBy: string,
    reason: string,
  ): Promise<Transaction> {
    const reversalData = Transaction.createReversal(originalTransaction, reversedBy, reason);
    const reversalTransaction = queryRunner.manager.create(Transaction, reversalData);
    
    return await queryRunner.manager.save(Transaction, reversalTransaction);
  }

  private async releaseTransactionHolds(
    queryRunner: QueryRunner,
    transaction: Transaction,
  ): Promise<void> {
    if (transaction.holdPlaced && !transaction.holdReleasedAt) {
      transaction.releaseHold();
      await queryRunner.manager.save(Transaction, transaction);
    }
  }

  private async createReconciliationEntry(
    queryRunner: QueryRunner,
    transaction: Transaction,
    balanceUpdate: BalanceUpdate,
  ): Promise<void> {
    // This would typically create an entry in a reconciliation table
    // For now, we'll just log the reconciliation data
    this.logger.log(`Reconciliation entry created for transaction ${transaction.transactionNumber}`);
  }

  private async clearRelatedCaches(transaction: Transaction): Promise<void> {
    const cacheKeys = [
      `transaction:${transaction.id}`,
      `account:${transaction.accountId}`,
      `customer:${transaction.customerId}`,
      `balance:${transaction.accountId}`,
    ];

    await Promise.all(cacheKeys.map(key => this.cacheManager.del(key)));
  }

  private async emitProcessingEvents(
    transaction: Transaction,
    balanceUpdate: BalanceUpdate,
    receipt: Receipt,
    processingTimeMs: number,
  ): Promise<void> {
    // Emit completion event
    this.eventEmitter.emit('transaction.completed', {
      transactionId: transaction.id,
      transactionNumber: transaction.transactionNumber,
      customerId: transaction.customerId,
      accountId: transaction.accountId,
      amount: transaction.amount,
      type: transaction.type,
      balanceUpdate,
      processingTimeMs,
    });

    // Emit receipt event
    this.eventEmitter.emit('transaction.receipt_ready', {
      transactionId: transaction.id,
      receiptNumber: receipt.receiptNumber,
      customerPhone: transaction.customer?.phoneNumber || (transaction.customer as any)?.phone || (transaction.customer as any)?.phone,
      customerEmail: transaction.customer.email,
    });

    // Emit notification event
    this.eventEmitter.emit('transaction.notification_required', {
      transactionId: transaction.id,
      customerId: transaction.customerId,
      type: 'transaction_completed',
      channels: ['sms', 'email'],
      data: {
        amount: transaction.amount,
        balance: balanceUpdate.newBalance,
        reference: transaction.transactionNumber,
      },
    });
  }

  private async handleProcessingError(
    transactionId: string,
    error: any,
    processingTimeMs: number,
  ): Promise<void> {
    try {
      const transaction = await this.transactionRepository.findOne({
        where: { id: transactionId },
      });

      if (transaction) {
        const errorMessage = error instanceof Error ? getErrorMessage(error) : JSON.stringify(error);
        const errorStack = error instanceof Error ? getErrorStack(error) : undefined;
        
        transaction.fail(errorMessage, {
          processingTimeMs,
          errorStack,
        });

        await this.transactionRepository.save(transaction);
      }
    } catch (updateError) {
      const updateErrorMessage = updateError instanceof Error ? updateError.message : JSON.stringify(updateError);
      this.logger.error(`Failed to update transaction with error: ${updateErrorMessage}`);
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // ===== PUBLIC QUERY METHODS =====

  async getProcessingStats(companyId: string): Promise<{
    totalProcessed: number;
    totalVolume: number;
    averageProcessingTime: number;
    successRate: number;
    dailyStats: Array<{ date: string; count: number; volume: number }>;
  }> {
    const stats = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        'COUNT(*) as total_processed',
        'SUM(amount) as total_volume',
        'AVG(processing_time_ms) as avg_processing_time',
        'COUNT(CASE WHEN status = \'completed\' THEN 1 END) as completed_count',
      ])
      .where('transaction.companyId = :companyId', { companyId })
      .andWhere('transaction.processedAt IS NOT NULL')
      .getRawOne();

    const successRate = stats.total_processed > 0 
      ? (stats.completed_count / stats.total_processed) * 100 
      : 0;

    return {
      totalProcessed: parseInt(stats.total_processed) || 0,
      totalVolume: parseFloat(stats.total_volume) || 0,
      averageProcessingTime: parseFloat(stats.avg_processing_time) || 0,
      successRate,
      dailyStats: [], // Would implement daily aggregation
    };
  }

  async getReceipt(receiptNumber: string): Promise<Receipt | null> {
    // Try cache first
    const cached = await this.cacheManager.get<Receipt>(`receipt:${receiptNumber}`);
    if (cached) {
      return cached;
    }

    // Get from database
    const transaction = await this.transactionRepository.findOne({
      where: { receiptNumber },
      relations: [UserRole.CUSTOMER, 'account'],
    });

    if (!transaction) {
      return null;
    }

    return this.generateReceipt(transaction, transaction.account);
  }
}