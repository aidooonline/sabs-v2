import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { nanoid } from 'nanoid';

// ===== LOAN ENTITIES =====

export interface MobileLoan {
  id: string;
  customerId: string;
  applicationId: string;
  loanProductId: string;
  principalAmount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  totalAmount: number;
  totalInterest: number;
  status: LoanStatus;
  applicationDate: Date;
  approvalDate?: Date;
  disbursementDate?: Date;
  firstPaymentDate?: Date;
  maturityDate?: Date;
  outstandingBalance: number;
  paidAmount: number;
  paymentsMade: number;
  paymentsRemaining: number;
  currentPaymentDue: number;
  nextPaymentDate?: Date;
  daysPastDue: number;
  creditScore: number;
  riskGrade: RiskGrade;
  collateralRequired: boolean;
  guarantorRequired: boolean;
  purpose: LoanPurpose;
  disbursementAccount: string;
  repaymentAccount: string;
  documents: LoanDocument[];
  repaymentHistory: LoanRepayment[];
  notes: LoanNote[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanProduct {
  id: string;
  name: string;
  description: string;
  type: LoanType;
  minAmount: number;
  maxAmount: number;
  minTerm: number;
  maxTerm: number;
  interestRate: number;
  processingFee: number;
  isActive: boolean;
  eligibilityCriteria: EligibilityCriteria;
  features: string[];
  benefits: string[];
  requirements: string[];
}

export interface LoanApplication {
  id: string;
  customerId: string;
  loanProductId: string;
  requestedAmount: number;
  requestedTerm: number;
  purpose: LoanPurpose;
  monthlyIncome: number;
  monthlyExpenses: number;
  employmentStatus: EmploymentStatus;
  employerName?: string;
  workExperience: number;
  existingLoans: number;
  creditScore?: number;
  status: ApplicationStatus;
  stage: ApplicationStage;
  submittedDate: Date;
  lastUpdated: Date;
  assignedOfficer?: string;
  reviewNotes: string[];
  documents: LoanDocument[];
  collateral?: CollateralInfo[];
  guarantors?: GuarantorInfo[];
  assessment: CreditAssessment;
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  paymentNumber: number;
  paymentDate: Date;
  dueDate: Date;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  outstandingBalance: number;
  status: PaymentStatus;
  paymentMethod: string;
  transactionId?: string;
  lateFee?: number;
  daysPastDue: number;
  createdAt: Date;
}

export interface LoanDocument {
  id: string;
  name: string;
  type: DocumentType;
  url: string;
  status: DocumentStatus;
  uploadedDate: Date;
  verifiedDate?: Date;
  verifiedBy?: string;
  expiryDate?: Date;
  isRequired: boolean;
}

export interface CreditAssessment {
  customerId: string;
  creditScore: number;
  riskGrade: RiskGrade;
  debtToIncomeRatio: number;
  paymentHistory: string;
  creditUtilization: number;
  lengthOfCredit: number;
  recommendedAmount: number;
  recommendedTerm: number;
  riskFactors: string[];
  strengthFactors: string[];
  assessmentDate: Date;
  assessedBy: string;
}

// ===== ENUMS =====

export enum LoanStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  ACTIVE = 'active',
  CURRENT = 'current',
  PAST_DUE = 'past_due',
  DEFAULTED = 'defaulted',
  CLOSED = 'closed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum LoanType {
  PERSONAL = 'personal',
  BUSINESS = 'business',
  MORTGAGE = 'mortgage',
  AUTO = 'auto',
  EDUCATION = 'education',
  EMERGENCY = 'emergency',
  PAYDAY = 'payday',
}

export enum ApplicationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum ApplicationStage {
  BASIC_INFO = 'basic_info',
  FINANCIAL_INFO = 'financial_info',
  DOCUMENTS = 'documents',
  VERIFICATION = 'verification',
  CREDIT_CHECK = 'credit_check',
  FINAL_REVIEW = 'final_review',
  DECISION = 'decision',
}

export enum RiskGrade {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
}

export enum LoanPurpose {
  HOME_IMPROVEMENT = 'home_improvement',
  DEBT_CONSOLIDATION = 'debt_consolidation',
  BUSINESS_EXPANSION = 'business_expansion',
  EDUCATION = 'education',
  MEDICAL = 'medical',
  WEDDING = 'wedding',
  VACATION = 'vacation',
  EMERGENCY = 'emergency',
  OTHER = 'other',
}

export enum EmploymentStatus {
  EMPLOYED = 'employed',
  SELF_EMPLOYED = 'self_employed',
  UNEMPLOYED = 'unemployed',
  RETIRED = 'retired',
  STUDENT = 'student',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  PARTIAL = 'partial',
  FAILED = 'failed',
}

export enum DocumentType {
  ID_CARD = 'id_card',
  PASSPORT = 'passport',
  DRIVERS_LICENSE = 'drivers_license',
  PROOF_OF_INCOME = 'proof_of_income',
  BANK_STATEMENT = 'bank_statement',
  EMPLOYMENT_LETTER = 'employment_letter',
  UTILITY_BILL = 'utility_bill',
  BUSINESS_REGISTRATION = 'business_registration',
  TAX_CERTIFICATE = 'tax_certificate',
  COLLATERAL_DOCUMENT = 'collateral_document',
}

export enum DocumentStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

// ===== REQUEST INTERFACES =====

export interface LoanApplicationRequest {
  loanProductId: string;
  requestedAmount: number;
  requestedTerm: number;
  purpose: LoanPurpose;
  monthlyIncome: number;
  monthlyExpenses: number;
  employmentStatus: EmploymentStatus;
  employerName?: string;
  workExperience: number;
  existingLoans: number;
  collateral?: CollateralInfo[];
  guarantors?: GuarantorInfo[];
}

export interface RepaymentRequest {
  loanId: string;
  amount: number;
  paymentMethod: string;
  fromAccountId: string;
}

export interface EarlySettlementRequest {
  loanId: string;
  settlementDate: Date;
  fromAccountId: string;
}

export interface CollateralInfo {
  type: string;
  description: string;
  estimatedValue: number;
  location?: string;
  documents: string[];
}

export interface GuarantorInfo {
  name: string;
  phoneNumber: string;
  email: string;
  relationship: string;
  monthlyIncome: number;
  employmentStatus: EmploymentStatus;
  idNumber: string;
}

export interface EligibilityCriteria {
  minAge: number;
  maxAge: number;
  minIncome: number;
  minCreditScore: number;
  maxDebtToIncomeRatio: number;
  employmentRequired: boolean;
  residencyRequired: boolean;
}

export interface LoanNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  isInternal: boolean;
}

@Injectable()
export class MobileLoanService {
  private readonly logger = new Logger(MobileLoanService.name);

  // In-memory storage (would use database in production)
  private loans: Map<string, MobileLoan> = new Map();
  private applications: Map<string, LoanApplication> = new Map();
  private loanProducts: Map<string, LoanProduct> = new Map();
  private repayments: Map<string, LoanRepayment[]> = new Map();
  private creditAssessments: Map<string, CreditAssessment> = new Map();

  // Loan configurations
  private readonly loanConfig = {
    maxLoanAmount: 500000,
    minLoanAmount: 1000,
    maxTermMonths: 60,
    minTermMonths: 6,
    defaultInterestRate: 18.0,
    processingTimeHours: 24,
    maxActiveLoans: 3,
    minCreditScore: 600,
  };

  constructor(
    private eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.initializeLoanProducts();
  }

  // ===== LOAN PRODUCTS =====

  async getLoanProducts(): Promise<LoanProduct[]> {
    const products = Array.from(this.loanProducts.values()).filter(p => p.isActive);
    return products.sort((a, b) => a.minAmount - b.minAmount);
  }

  async getLoanProduct(productId: string): Promise<LoanProduct> {
    const product = this.loanProducts.get(productId);
    if (!product) {
      throw new NotFoundException('Loan product not found');
    }
    return product;
  }

  async calculateLoanDetails(
    productId: string,
    amount: number,
    termMonths: number
  ): Promise<{
    monthlyPayment: number;
    totalAmount: number;
    totalInterest: number;
    effectiveRate: number;
    processingFee: number;
  }> {
    const product = await this.getLoanProduct(productId);

    if (amount < product.minAmount || amount > product.maxAmount) {
      throw new BadRequestException(`Amount must be between GHS ${product.minAmount} and GHS ${product.maxAmount}`);
    }

    if (termMonths < product.minTerm || termMonths > product.maxTerm) {
      throw new BadRequestException(`Term must be between ${product.minTerm} and ${product.maxTerm} months`);
    }

    const monthlyRate = product.interestRate / 100 / 12;
    const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                          (Math.pow(1 + monthlyRate, termMonths) - 1);
    
    const totalAmount = monthlyPayment * termMonths;
    const totalInterest = totalAmount - amount;
    const processingFee = (amount * product.processingFee) / 100;

    return {
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      effectiveRate: product.interestRate,
      processingFee: Math.round(processingFee * 100) / 100,
    };
  }

  // ===== LOAN APPLICATION =====

  async submitLoanApplication(customerId: string, request: LoanApplicationRequest): Promise<{
    applicationId: string;
    status: ApplicationStatus;
    estimatedDecisionTime: string;
    nextSteps: string[];
  }> {
    this.logger.log(`Processing loan application for customer ${customerId}, amount: GHS ${request.requestedAmount}`);

    try {
      // Validate customer eligibility
      await this.checkCustomerEligibility(customerId, request);

      // Create application
      const applicationId = `app_${nanoid(12)}`;
      
      const application: LoanApplication = {
        id: applicationId,
        customerId,
        loanProductId: request.loanProductId,
        requestedAmount: request.requestedAmount,
        requestedTerm: request.requestedTerm,
        purpose: request.purpose,
        monthlyIncome: request.monthlyIncome,
        monthlyExpenses: request.monthlyExpenses,
        employmentStatus: request.employmentStatus,
        employerName: request.employerName,
        workExperience: request.workExperience,
        existingLoans: request.existingLoans,
        status: ApplicationStatus.SUBMITTED,
        stage: ApplicationStage.BASIC_INFO,
        submittedDate: new Date(),
        lastUpdated: new Date(),
        reviewNotes: [],
        documents: [],
        collateral: request.collateral,
        guarantors: request.guarantors,
        assessment: await this.performInitialCreditAssessment(customerId, request),
      };

      this.applications.set(applicationId, application);

      // Start automated processing
      setTimeout(() => this.processApplication(applicationId), 1000);

      // Emit application submitted event
      this.eventEmitter.emit('loan.application_submitted', {
        applicationId,
        customerId,
        amount: request.requestedAmount,
        productId: request.loanProductId,
      });

      return {
        applicationId,
        status: ApplicationStatus.SUBMITTED,
        estimatedDecisionTime: '24-48 hours',
        nextSteps: [
          'Upload required documents',
          'Wait for credit verification',
          'Await final decision',
        ],
      };

    } catch (error) {
      this.logger.error(`Loan application failed: ${(error as Error).message}`);
      throw error;
    }
  }

  async getApplicationStatus(customerId: string, applicationId: string): Promise<{
    application: LoanApplication;
    progress: number;
    currentStage: string;
    nextSteps: string[];
    estimatedCompletion?: Date;
  }> {
    const application = this.applications.get(applicationId);
    
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.customerId !== customerId) {
      throw new ForbiddenException('Access denied');
    }

    const progress = this.calculateApplicationProgress(application.stage);
    const currentStage = this.getStageDescription(application.stage);
    const nextSteps = this.getNextSteps(application.stage, application.status);

    return {
      application: this.sanitizeApplicationData(application),
      progress,
      currentStage,
      nextSteps,
      estimatedCompletion: this.calculateEstimatedCompletion(application),
    };
  }

  // ===== LOAN MANAGEMENT =====

  async getCustomerLoans(customerId: string, filters?: {
    status?: LoanStatus;
    type?: LoanType;
    includeHistory?: boolean;
  }): Promise<{
    activeLoans: MobileLoan[];
    summary: {
      totalLoans: number;
      totalOutstanding: number;
      totalMonthlyPayments: number;
      nextPaymentDate?: Date;
      nextPaymentAmount: number;
    };
  }> {
    let loans = Array.from(this.loans.values()).filter(
      loan => loan.customerId === customerId
    );

    // Apply filters
    if (filters?.status) {
      loans = loans.filter(loan => loan.status === filters.status);
    }

    if (!filters?.includeHistory) {
      loans = loans.filter(loan => [
        LoanStatus.ACTIVE,
        LoanStatus.CURRENT,
        LoanStatus.PAST_DUE,
      ].includes(loan.status));
    }

    // Calculate summary
    const totalOutstanding = loans.reduce((sum, loan) => sum + loan.outstandingBalance, 0);
    const totalMonthlyPayments = loans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);
    const upcomingPayments = loans
      .filter(loan => loan.nextPaymentDate)
      .sort((a, b) => a.nextPaymentDate!.getTime() - b.nextPaymentDate!.getTime());

    return {
      activeLoans: loans.map(loan => this.sanitizeLoanData(loan)),
      summary: {
        totalLoans: loans.length,
        totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        totalMonthlyPayments: Math.round(totalMonthlyPayments * 100) / 100,
        nextPaymentDate: upcomingPayments[0]?.nextPaymentDate,
        nextPaymentAmount: upcomingPayments[0]?.currentPaymentDue || 0,
      },
    };
  }

  async getLoanDetails(customerId: string, loanId: string): Promise<{
    loan: MobileLoan;
    paymentSchedule: Array<{
      paymentNumber: number;
      dueDate: Date;
      principalAmount: number;
      interestAmount: number;
      totalAmount: number;
      status: PaymentStatus;
    }>;
    recentPayments: LoanRepayment[];
  }> {
    const loan = this.loans.get(loanId);
    
    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (loan.customerId !== customerId) {
      throw new ForbiddenException('Access denied');
    }

    const paymentSchedule = this.generatePaymentSchedule(loan);
    const recentPayments = (this.repayments.get(loanId) || [])
      .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())
      .slice(0, 10);

    return {
      loan: this.sanitizeLoanData(loan),
      paymentSchedule,
      recentPayments,
    };
  }

  // ===== LOAN REPAYMENT =====

  async makeRepayment(customerId: string, request: RepaymentRequest): Promise<{
    paymentId: string;
    transactionId: string;
    amount: number;
    newBalance: number;
    nextPaymentDate?: Date;
    nextPaymentAmount: number;
  }> {
    this.logger.log(`Processing loan repayment: ${customerId} -> Loan ${request.loanId}, Amount: GHS ${request.amount}`);

    const loan = this.loans.get(request.loanId);
    
    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (loan.customerId !== customerId) {
      throw new ForbiddenException('Access denied');
    }

    if (loan.status !== LoanStatus.ACTIVE && loan.status !== LoanStatus.CURRENT && loan.status !== LoanStatus.PAST_DUE) {
      throw new BadRequestException('Loan is not active for repayments');
    }

    if (request.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    // Validate account balance (mock)
    await this.validateAccountBalance(request.fromAccountId, request.amount);

    // Create repayment record
    const paymentId = `pay_${nanoid(12)}`;
    const transactionId = `txn_${nanoid(12)}`;

    const payment: LoanRepayment = {
      id: paymentId,
      loanId: request.loanId,
      paymentNumber: loan.paymentsMade + 1,
      paymentDate: new Date(),
      dueDate: loan.nextPaymentDate || new Date(),
      principalAmount: this.calculatePrincipalAmount(loan, request.amount),
      interestAmount: this.calculateInterestAmount(loan, request.amount),
      totalAmount: request.amount,
      outstandingBalance: loan.outstandingBalance - request.amount,
      status: PaymentStatus.PAID,
      paymentMethod: request.paymentMethod,
      transactionId,
      daysPastDue: loan.daysPastDue,
      createdAt: new Date(),
    };

    // Update loan status
    loan.outstandingBalance -= request.amount;
    loan.paidAmount += request.amount;
    loan.paymentsMade += 1;
    loan.paymentsRemaining = Math.max(0, loan.paymentsRemaining - 1);
    loan.daysPastDue = 0;

    // Calculate next payment
    if (loan.outstandingBalance <= 0) {
      loan.status = LoanStatus.CLOSED;
      loan.nextPaymentDate = undefined;
      loan.currentPaymentDue = 0;
    } else {
      loan.nextPaymentDate = this.calculateNextPaymentDate(loan.nextPaymentDate || new Date());
      loan.currentPaymentDue = loan.monthlyPayment;
      loan.status = LoanStatus.CURRENT;
    }

    loan.updatedAt = new Date();

    // Store records
    this.loans.set(request.loanId, loan);
    const loanPayments = this.repayments.get(request.loanId) || [];
    loanPayments.push(payment);
    this.repayments.set(request.loanId, loanPayments);

    // Emit payment event
    this.eventEmitter.emit('loan.payment_made', {
      loanId: request.loanId,
      customerId,
      amount: request.amount,
      paymentId,
      newBalance: loan.outstandingBalance,
    });

    return {
      paymentId,
      transactionId,
      amount: request.amount,
      newBalance: Math.round(loan.outstandingBalance * 100) / 100,
      nextPaymentDate: loan.nextPaymentDate,
      nextPaymentAmount: loan.currentPaymentDue,
    };
  }

  async calculateEarlySettlement(customerId: string, loanId: string, settlementDate: Date): Promise<{
    currentBalance: number;
    earlySettlementAmount: number;
    interestSaved: number;
    discountApplied: number;
    settlementDate: Date;
  }> {
    const loan = this.loans.get(loanId);
    
    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (loan.customerId !== customerId) {
      throw new ForbiddenException('Access denied');
    }

    const currentBalance = loan.outstandingBalance;
    const remainingInterest = (loan.paymentsRemaining * loan.monthlyPayment) - currentBalance;
    const earlySettlementDiscount = remainingInterest * 0.1; // 10% discount
    const earlySettlementAmount = currentBalance - earlySettlementDiscount;

    return {
      currentBalance: Math.round(currentBalance * 100) / 100,
      earlySettlementAmount: Math.round(earlySettlementAmount * 100) / 100,
      interestSaved: Math.round(remainingInterest * 100) / 100,
      discountApplied: Math.round(earlySettlementDiscount * 100) / 100,
      settlementDate,
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  private async checkCustomerEligibility(customerId: string, request: LoanApplicationRequest): Promise<void> {
    const product = await this.getLoanProduct(request.loanProductId);
    
    // Check basic eligibility
    if (request.requestedAmount < product.minAmount || request.requestedAmount > product.maxAmount) {
      throw new BadRequestException(`Amount must be between GHS ${product.minAmount} and GHS ${product.maxAmount}`);
    }

    if (request.requestedTerm < product.minTerm || request.requestedTerm > product.maxTerm) {
      throw new BadRequestException(`Term must be between ${product.minTerm} and ${product.maxTerm} months`);
    }

    // Check debt-to-income ratio
    const debtToIncomeRatio = (request.monthlyExpenses / request.monthlyIncome) * 100;
    if (debtToIncomeRatio > product.eligibilityCriteria.maxDebtToIncomeRatio) {
      throw new BadRequestException('Debt-to-income ratio exceeds maximum allowed');
    }

    // Check existing loans
    const customerLoans = Array.from(this.loans.values()).filter(
      loan => loan.customerId === customerId && 
      [LoanStatus.ACTIVE, LoanStatus.CURRENT, LoanStatus.PAST_DUE].includes(loan.status)
    );

    if (customerLoans.length >= this.loanConfig.maxActiveLoans) {
      throw new BadRequestException(`Maximum ${this.loanConfig.maxActiveLoans} active loans allowed`);
    }
  }

  private async performInitialCreditAssessment(customerId: string, request: LoanApplicationRequest): Promise<CreditAssessment> {
    // Mock credit assessment - would integrate with credit bureau
    const baseScore = 650 + Math.floor(Math.random() * 200);
    const debtToIncomeRatio = (request.monthlyExpenses / request.monthlyIncome) * 100;
    
    let riskGrade: RiskGrade;
    if (baseScore >= 750) riskGrade = RiskGrade.A;
    else if (baseScore >= 700) riskGrade = RiskGrade.B;
    else if (baseScore >= 650) riskGrade = RiskGrade.C;
    else if (baseScore >= 600) riskGrade = RiskGrade.D;
    else riskGrade = RiskGrade.E;

    const assessment: CreditAssessment = {
      customerId,
      creditScore: baseScore,
      riskGrade,
      debtToIncomeRatio,
      paymentHistory: 'Good',
      creditUtilization: 35,
      lengthOfCredit: 5,
      recommendedAmount: Math.min(request.requestedAmount, request.monthlyIncome * 5),
      recommendedTerm: request.requestedTerm,
      riskFactors: debtToIncomeRatio > 50 ? ['High debt-to-income ratio'] : [],
      strengthFactors: ['Regular income', 'Good payment history'],
      assessmentDate: new Date(),
      assessedBy: 'system',
    };

    this.creditAssessments.set(customerId, assessment);
    return assessment;
  }

  private async processApplication(applicationId: string): Promise<void> {
    const application = this.applications.get(applicationId);
    if (!application) return;

    try {
      // Simulate processing stages
      const stages = [
        ApplicationStage.FINANCIAL_INFO,
        ApplicationStage.CREDIT_CHECK,
        ApplicationStage.FINAL_REVIEW,
        ApplicationStage.DECISION,
      ];

      for (const stage of stages) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
        
        application.stage = stage;
        application.lastUpdated = new Date();
        this.applications.set(applicationId, application);

        this.eventEmitter.emit('loan.application_stage_updated', {
          applicationId,
          customerId: application.customerId,
          stage,
        });
      }

      // Make decision
      const approved = application.assessment.creditScore >= this.loanConfig.minCreditScore;
      
      if (approved) {
        application.status = ApplicationStatus.APPROVED;
        await this.createApprovedLoan(application);
      } else {
        application.status = ApplicationStatus.REJECTED;
        application.reviewNotes.push('Credit score below minimum requirement');
      }

      this.applications.set(applicationId, application);

      this.eventEmitter.emit('loan.application_decided', {
        applicationId,
        customerId: application.customerId,
        status: application.status,
        amount: application.requestedAmount,
      });

    } catch (error) {
      this.logger.error(`Application processing failed: ${(error as Error).message}`);
    }
  }

  private async createApprovedLoan(application: LoanApplication): Promise<void> {
    const loanId = `loan_${nanoid(12)}`;
    const product = this.loanProducts.get(application.loanProductId)!;
    
    const loanDetails = await this.calculateLoanDetails(
      application.loanProductId,
      application.requestedAmount,
      application.requestedTerm
    );

    const loan: MobileLoan = {
      id: loanId,
      customerId: application.customerId,
      applicationId: application.id,
      loanProductId: application.loanProductId,
      principalAmount: application.requestedAmount,
      interestRate: product.interestRate,
      termMonths: application.requestedTerm,
      monthlyPayment: loanDetails.monthlyPayment,
      totalAmount: loanDetails.totalAmount,
      totalInterest: loanDetails.totalInterest,
      status: LoanStatus.APPROVED,
      applicationDate: application.submittedDate,
      approvalDate: new Date(),
      outstandingBalance: application.requestedAmount,
      paidAmount: 0,
      paymentsMade: 0,
      paymentsRemaining: application.requestedTerm,
      currentPaymentDue: loanDetails.monthlyPayment,
      daysPastDue: 0,
      creditScore: application.assessment.creditScore,
      riskGrade: application.assessment.riskGrade,
      collateralRequired: (application.collateral?.length || 0) > 0,
      guarantorRequired: (application.guarantors?.length || 0) > 0,
      purpose: application.purpose,
      disbursementAccount: 'acc_default',
      repaymentAccount: 'acc_default',
      documents: application.documents,
      repaymentHistory: [],
      notes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.loans.set(loanId, loan);
  }

  private calculateApplicationProgress(stage: ApplicationStage): number {
    const stageProgress = {
      [ApplicationStage.BASIC_INFO]: 20,
      [ApplicationStage.FINANCIAL_INFO]: 40,
      [ApplicationStage.DOCUMENTS]: 50,
      [ApplicationStage.VERIFICATION]: 60,
      [ApplicationStage.CREDIT_CHECK]: 80,
      [ApplicationStage.FINAL_REVIEW]: 90,
      [ApplicationStage.DECISION]: 100,
    };
    return stageProgress[stage] || 0;
  }

  private getStageDescription(stage: ApplicationStage): string {
    const descriptions = {
      [ApplicationStage.BASIC_INFO]: 'Application submitted',
      [ApplicationStage.FINANCIAL_INFO]: 'Reviewing financial information',
      [ApplicationStage.DOCUMENTS]: 'Verifying documents',
      [ApplicationStage.VERIFICATION]: 'Identity verification',
      [ApplicationStage.CREDIT_CHECK]: 'Credit assessment in progress',
      [ApplicationStage.FINAL_REVIEW]: 'Final review by loan officer',
      [ApplicationStage.DECISION]: 'Decision made',
    };
    return descriptions[stage] || 'Unknown stage';
  }

  private getNextSteps(stage: ApplicationStage, status: ApplicationStatus): string[] {
    if (status === ApplicationStatus.APPROVED) {
      return ['Loan approved! Proceed to disbursement.'];
    }
    if (status === ApplicationStatus.REJECTED) {
      return ['Application rejected. Contact support for details.'];
    }

    const nextSteps = {
      [ApplicationStage.BASIC_INFO]: ['Upload required documents', 'Wait for verification'],
      [ApplicationStage.FINANCIAL_INFO]: ['Provide additional financial documents if requested'],
      [ApplicationStage.DOCUMENTS]: ['Wait for document verification'],
      [ApplicationStage.VERIFICATION]: ['Wait for identity verification'],
      [ApplicationStage.CREDIT_CHECK]: ['Wait for credit assessment completion'],
      [ApplicationStage.FINAL_REVIEW]: ['Wait for final loan officer review'],
      [ApplicationStage.DECISION]: ['Decision pending'],
    };
    return nextSteps[stage] || [];
  }

  private calculateEstimatedCompletion(application: LoanApplication): Date | undefined {
    if (application.status === ApplicationStatus.APPROVED || application.status === ApplicationStatus.REJECTED) {
      return undefined;
    }
    return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
  }

  private generatePaymentSchedule(loan: MobileLoan): Array<{
    paymentNumber: number;
    dueDate: Date;
    principalAmount: number;
    interestAmount: number;
    totalAmount: number;
    status: PaymentStatus;
  }> {
    const schedule = [];
    const monthlyRate = loan.interestRate / 100 / 12;
    let balance = loan.principalAmount;
    const currentDate = loan.firstPaymentDate || new Date();

    for (let i = 1; i <= loan.termMonths; i++) {
      const interestAmount = balance * monthlyRate;
      const principalAmount = loan.monthlyPayment - interestAmount;
      balance -= principalAmount;

      const status = i <= loan.paymentsMade ? PaymentStatus.PAID : PaymentStatus.PENDING;

      schedule.push({
        paymentNumber: i,
        dueDate: new Date(currentDate),
        principalAmount: Math.round(principalAmount * 100) / 100,
        interestAmount: Math.round(interestAmount * 100) / 100,
        totalAmount: loan.monthlyPayment,
        status,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return schedule;
  }

  private calculatePrincipalAmount(loan: MobileLoan, paymentAmount: number): number {
    const monthlyRate = loan.interestRate / 100 / 12;
    const interestAmount = loan.outstandingBalance * monthlyRate;
    return Math.max(0, paymentAmount - interestAmount);
  }

  private calculateInterestAmount(loan: MobileLoan, paymentAmount: number): number {
    const monthlyRate = loan.interestRate / 100 / 12;
    const interestAmount = loan.outstandingBalance * monthlyRate;
    return Math.min(interestAmount, paymentAmount);
  }

  private calculateNextPaymentDate(currentDate: Date): Date {
    const nextDate = new Date(currentDate);
    nextDate.setMonth(nextDate.getMonth() + 1);
    return nextDate;
  }

  private async validateAccountBalance(accountId: string, amount: number): Promise<void> {
    // Mock balance check
    const mockBalance = 10000;
    if (amount > mockBalance) {
      throw new BadRequestException('Insufficient account balance');
    }
  }

  private sanitizeApplicationData(application: LoanApplication): LoanApplication {
    // Remove sensitive data for client response
    return { ...application };
  }

  private sanitizeLoanData(loan: MobileLoan): MobileLoan {
    // Remove sensitive data for client response
    return { ...loan };
  }

  private initializeLoanProducts(): void {
    const products: LoanProduct[] = [
      {
        id: 'personal_001',
        name: 'Personal Loan',
        description: 'Quick personal loans for your immediate needs',
        type: LoanType.PERSONAL,
        minAmount: 1000,
        maxAmount: 50000,
        minTerm: 6,
        maxTerm: 36,
        interestRate: 18.0,
        processingFee: 2.5,
        isActive: true,
        eligibilityCriteria: {
          minAge: 18,
          maxAge: 65,
          minIncome: 1500,
          minCreditScore: 600,
          maxDebtToIncomeRatio: 60,
          employmentRequired: true,
          residencyRequired: true,
        },
        features: ['Quick approval', 'Flexible terms', 'No collateral required'],
        benefits: ['Fast disbursement', 'Competitive rates', '24/7 application'],
        requirements: ['Valid ID', 'Proof of income', 'Bank statements'],
      },
      {
        id: 'business_001',
        name: 'Business Loan',
        description: 'Loans to grow your business',
        type: LoanType.BUSINESS,
        minAmount: 5000,
        maxAmount: 200000,
        minTerm: 12,
        maxTerm: 60,
        interestRate: 16.0,
        processingFee: 3.0,
        isActive: true,
        eligibilityCriteria: {
          minAge: 21,
          maxAge: 65,
          minIncome: 5000,
          minCreditScore: 650,
          maxDebtToIncomeRatio: 70,
          employmentRequired: false,
          residencyRequired: true,
        },
        features: ['Business expansion', 'Equipment financing', 'Working capital'],
        benefits: ['Higher loan amounts', 'Longer terms', 'Business support'],
        requirements: ['Business registration', 'Financial statements', 'Business plan'],
      },
    ];

    products.forEach(product => {
      this.loanProducts.set(product.id, product);
    });

    this.logger.log('Loan products initialized');
  }
}