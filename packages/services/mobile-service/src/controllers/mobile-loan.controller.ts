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
  MobileLoanService,
  MobileLoan,
  LoanProduct,
  LoanApplication,
  LoanRepayment,
  LoanStatus,
  LoanType,
  ApplicationStatus,
  ApplicationStage,
  RiskGrade,
  LoanPurpose,
  EmploymentStatus,
  PaymentStatus,
  DocumentType,
  LoanApplicationRequest,
  RepaymentRequest,
  EarlySettlementRequest,
  CollateralInfo,
  GuarantorInfo,
} from '../services/mobile-loan.service';

// ===== REQUEST DTOs =====

export class LoanApplicationDto {
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
  collateral?: Array<{
    type: string;
    description: string;
    estimatedValue: number;
    location?: string;
    documents: string[];
  }>;
  guarantors?: Array<{
    name: string;
    phoneNumber: string;
    email: string;
    relationship: string;
    monthlyIncome: number;
    employmentStatus: EmploymentStatus;
    idNumber: string;
  }>;
}

export class RepaymentDto {
  loanId: string;
  amount: number;
  paymentMethod: string;
  fromAccountId: string;
}

export class EarlySettlementDto {
  loanId: string;
  settlementDate: string;
  fromAccountId: string;
}

export class LoanCalculatorDto {
  productId: string;
  amount: number;
  termMonths: number;
}

export class DocumentUploadDto {
  applicationId: string;
  documentType: DocumentType;
  fileName: string;
  fileData: string; // Base64 encoded
}

export class LoanFiltersDto {
  status?: LoanStatus;
  type?: LoanType;
  includeHistory?: boolean = false;
}

// ===== RESPONSE DTOs =====

export class LoanApplicationResponseDto {
  applicationId: string;
  status: ApplicationStatus;
  estimatedDecisionTime: string;
  nextSteps: string[];
  message: string;
}

export class LoanCalculationResponseDto {
  monthlyPayment: number;
  totalAmount: number;
  totalInterest: number;
  effectiveRate: number;
  processingFee: number;
  breakdown: {
    principalAmount: number;
    interestAmount: number;
    fees: number;
  };
}

export class RepaymentResponseDto {
  paymentId: string;
  transactionId: string;
  amount: number;
  newBalance: number;
  nextPaymentDate?: Date;
  nextPaymentAmount: number;
  message: string;
}

export class LoanSummaryResponseDto {
  activeLoans: MobileLoan[];
  summary: {
    totalLoans: number;
    totalOutstanding: number;
    totalMonthlyPayments: number;
    nextPaymentDate?: Date;
    nextPaymentAmount: number;
  };
  creditProfile: {
    creditScore: number;
    riskGrade: RiskGrade;
    availableCredit: number;
  };
}

export class ApplicationStatusResponseDto {
  application: LoanApplication;
  progress: number;
  currentStage: string;
  nextSteps: string[];
  estimatedCompletion?: Date;
  timeline: Array<{
    stage: string;
    status: 'completed' | 'current' | 'pending';
    date?: Date;
  }>;
}

export class LoanDetailsResponseDto {
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
  analytics: {
    paidPercentage: number;
    daysToMaturity: number;
    interestSaved?: number;
  };
}

export class EarlySettlementResponseDto {
  currentBalance: number;
  earlySettlementAmount: number;
  interestSaved: number;
  discountApplied: number;
  settlementDate: Date;
  savings: {
    percentage: number;
    amount: number;
  };
}

@ApiTags('Mobile Loans')
@Controller('mobile-loans')
export class MobileLoanController {
  private readonly logger = new Logger(MobileLoanController.name);

  constructor(private readonly loanService: MobileLoanService) {}

  // ===== LOAN PRODUCTS ENDPOINTS =====

  @Get('products')
  @ApiOperation({ summary: 'Get available loan products' })
  @ApiResponse({ status: 200, description: 'Loan products retrieved' })
  async getLoanProducts(): Promise<{
    products: Array<{
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
      features: string[];
      benefits: string[];
      isPopular?: boolean;
    }>;
  }> {
    const products = await this.loanService.getLoanProducts();
    
    const enhancedProducts = products.map(product => ({
      ...product,
      isPopular: product.type === LoanType.PERSONAL,
    }));

    return { products: enhancedProducts };
  }

  @Get('products/:productId')
  @ApiOperation({ summary: 'Get loan product details' })
  @ApiParam({ name: 'productId', description: 'Loan product ID' })
  @ApiResponse({ status: 200, description: 'Product details retrieved' })
  async getLoanProduct(@Param('productId') productId: string): Promise<{
    product: LoanProduct;
    eligibility: {
      criteria: any;
      requirements: string[];
      tips: string[];
    };
  }> {
    const product = await this.loanService.getLoanProduct(productId);
    
    return {
      product,
      eligibility: {
        criteria: product.eligibilityCriteria,
        requirements: product.requirements,
        tips: [
          'Maintain a good credit score',
          'Have stable monthly income',
          'Keep debt-to-income ratio low',
          'Provide complete documentation',
        ],
      },
    };
  }

  @Post('calculator')
  @ApiOperation({ summary: 'Calculate loan details' })
  @ApiResponse({ status: 200, description: 'Loan calculation completed', type: LoanCalculationResponseDto })
  async calculateLoan(
    @Body(ValidationPipe) calculatorDto: LoanCalculatorDto,
  ): Promise<LoanCalculationResponseDto> {
    this.logger.log(`Calculating loan: Product ${calculatorDto.productId}, Amount: GHS ${calculatorDto.amount}`);

    const calculation = await this.loanService.calculateLoanDetails(
      calculatorDto.productId,
      calculatorDto.amount,
      calculatorDto.termMonths
    );

    return {
      ...calculation,
      breakdown: {
        principalAmount: calculatorDto.amount,
        interestAmount: calculation.totalInterest,
        fees: calculation.processingFee,
      },
    };
  }

  // ===== LOAN APPLICATION ENDPOINTS =====

  @Post('applications')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit loan application' })
  @ApiResponse({ status: 201, description: 'Application submitted successfully', type: LoanApplicationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid application data' })
  async submitApplication(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) applicationDto: LoanApplicationDto,
  ): Promise<LoanApplicationResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    this.logger.log(`Loan application: ${customerId} -> GHS ${applicationDto.requestedAmount}`);

    const request: LoanApplicationRequest = {
      loanProductId: applicationDto.loanProductId,
      requestedAmount: applicationDto.requestedAmount,
      requestedTerm: applicationDto.requestedTerm,
      purpose: applicationDto.purpose,
      monthlyIncome: applicationDto.monthlyIncome,
      monthlyExpenses: applicationDto.monthlyExpenses,
      employmentStatus: applicationDto.employmentStatus,
      employerName: applicationDto.employerName,
      workExperience: applicationDto.workExperience,
      existingLoans: applicationDto.existingLoans,
      collateral: applicationDto.collateral as CollateralInfo[],
      guarantors: applicationDto.guarantors as GuarantorInfo[],
    };

    const result = await this.loanService.submitLoanApplication(customerId, request);

    return {
      ...result,
      message: 'Loan application submitted successfully',
    };
  }

  @Get('applications/:applicationId/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get application status' })
  @ApiParam({ name: 'applicationId', description: 'Application ID' })
  @ApiResponse({ status: 200, description: 'Application status retrieved', type: ApplicationStatusResponseDto })
  async getApplicationStatus(
    @Headers('authorization') authorization: string,
    @Param('applicationId') applicationId: string,
  ): Promise<ApplicationStatusResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    const result = await this.loanService.getApplicationStatus(customerId, applicationId);
    
    // Generate timeline
    const timeline = [
      { stage: 'Application Submitted', status: 'completed' as const, date: result.application.submittedDate },
      { stage: 'Financial Review', status: result.progress > 40 ? 'completed' as const : result.progress > 20 ? 'current' as const : 'pending' as const },
      { stage: 'Credit Check', status: result.progress > 80 ? 'completed' as const : result.progress > 60 ? 'current' as const : 'pending' as const },
      { stage: 'Final Decision', status: result.progress === 100 ? 'completed' as const : result.progress > 90 ? 'current' as const : 'pending' as const },
    ];

    return {
      ...result,
      timeline,
    };
  }

  @Get('applications')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer applications' })
  @ApiQuery({ name: 'status', required: false, enum: ApplicationStatus })
  @ApiResponse({ status: 200, description: 'Applications retrieved' })
  async getApplications(
    @Headers('authorization') authorization: string,
    @Query('status') status?: ApplicationStatus,
  ): Promise<{
    applications: Array<{
      id: string;
      productName: string;
      requestedAmount: number;
      status: ApplicationStatus;
      stage: ApplicationStage;
      submittedDate: Date;
      progress: number;
    }>;
    summary: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    };
  }> {
    // Mock applications data
    const applications = [
      {
        id: 'app_001',
        productName: 'Personal Loan',
        requestedAmount: 25000,
        status: ApplicationStatus.APPROVED,
        stage: ApplicationStage.DECISION,
        submittedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        progress: 100,
      },
      {
        id: 'app_002',
        productName: 'Business Loan',
        requestedAmount: 100000,
        status: ApplicationStatus.UNDER_REVIEW,
        stage: ApplicationStage.CREDIT_CHECK,
        submittedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        progress: 80,
      },
    ];

    const filteredApplications = status 
      ? applications.filter(app => app.status === status)
      : applications;

    return {
      applications: filteredApplications,
      summary: {
        total: applications.length,
        pending: applications.filter(app => app.status === ApplicationStatus.UNDER_REVIEW).length,
        approved: applications.filter(app => app.status === ApplicationStatus.APPROVED).length,
        rejected: applications.filter(app => app.status === ApplicationStatus.REJECTED).length,
      },
    };
  }

  @Post('applications/:applicationId/documents')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload application document' })
  @ApiParam({ name: 'applicationId', description: 'Application ID' })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  async uploadDocument(
    @Headers('authorization') authorization: string,
    @Param('applicationId') applicationId: string,
    @Body(ValidationPipe) documentDto: DocumentUploadDto,
  ): Promise<{
    documentId: string;
    status: string;
    message: string;
    nextSteps?: string[];
  }> {
    const customerId = await this.extractCustomerId(authorization);
    
    // Mock document upload
    const documentId = `doc_${Date.now()}`;
    
    this.logger.log(`Document uploaded for application ${applicationId}: ${documentDto.documentType}`);
    
    return {
      documentId,
      status: 'uploaded',
      message: 'Document uploaded successfully',
      nextSteps: [
        'Document is being verified',
        'You will be notified once verification is complete',
      ],
    };
  }

  // ===== LOAN MANAGEMENT ENDPOINTS =====

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer loans' })
  @ApiQuery({ name: 'status', required: false, enum: LoanStatus })
  @ApiQuery({ name: 'type', required: false, enum: LoanType })
  @ApiQuery({ name: 'includeHistory', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Loans retrieved', type: LoanSummaryResponseDto })
  async getCustomerLoans(
    @Headers('authorization') authorization: string,
    @Query() filters: LoanFiltersDto,
  ): Promise<LoanSummaryResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    const result = await this.loanService.getCustomerLoans(customerId, filters);
    
    // Mock credit profile
    const creditProfile = {
      creditScore: 720,
      riskGrade: RiskGrade.B,
      availableCredit: 75000,
    };

    return {
      ...result,
      creditProfile,
    };
  }

  @Get(':loanId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get loan details' })
  @ApiParam({ name: 'loanId', description: 'Loan ID' })
  @ApiResponse({ status: 200, description: 'Loan details retrieved', type: LoanDetailsResponseDto })
  async getLoanDetails(
    @Headers('authorization') authorization: string,
    @Param('loanId') loanId: string,
  ): Promise<LoanDetailsResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    const result = await this.loanService.getLoanDetails(customerId, loanId);
    
    // Calculate analytics
    const paidPercentage = (result.loan.paidAmount / result.loan.totalAmount) * 100;
    const daysToMaturity = result.loan.maturityDate 
      ? Math.ceil((result.loan.maturityDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      : 0;

    return {
      ...result,
      analytics: {
        paidPercentage: Math.round(paidPercentage * 100) / 100,
        daysToMaturity,
        interestSaved: 0, // Would calculate based on early payments
      },
    };
  }

  @Get(':loanId/statement')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get loan statement' })
  @ApiParam({ name: 'loanId', description: 'Loan ID' })
  @ApiQuery({ name: 'format', required: false, enum: ['pdf', 'html'] })
  @ApiResponse({ status: 200, description: 'Loan statement generated' })
  async getLoanStatement(
    @Headers('authorization') authorization: string,
    @Param('loanId') loanId: string,
    @Query('format') format: string = 'html',
  ): Promise<{
    statementId: string;
    format: string;
    content: string;
    generatedDate: Date;
  }> {
    const customerId = await this.extractCustomerId(authorization);
    
    // Mock statement generation
    const statementId = `stmt_${Date.now()}`;
    
    const htmlContent = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h2>Loan Statement</h2>
        <hr>
        <p><strong>Loan ID:</strong> ${loanId}</p>
        <p><strong>Statement Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Outstanding Balance:</strong> GHS 15,000.00</p>
        <p><strong>Next Payment Due:</strong> GHS 1,250.00</p>
        <p><strong>Due Date:</strong> ${new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
        <hr>
        <h3>Recent Payments</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #ccc;">
            <th>Date</th><th>Amount</th><th>Balance</th>
          </tr>
          <tr><td>Dec 01, 2024</td><td>GHS 1,250.00</td><td>GHS 16,250.00</td></tr>
          <tr><td>Nov 01, 2024</td><td>GHS 1,250.00</td><td>GHS 17,500.00</td></tr>
        </table>
      </div>
    `;

    return {
      statementId,
      format,
      content: htmlContent,
      generatedDate: new Date(),
    };
  }

  // ===== REPAYMENT ENDPOINTS =====

  @Post(':loanId/repayment')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Make loan repayment' })
  @ApiParam({ name: 'loanId', description: 'Loan ID' })
  @ApiResponse({ status: 201, description: 'Payment processed successfully', type: RepaymentResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid payment request' })
  async makeRepayment(
    @Headers('authorization') authorization: string,
    @Param('loanId') loanId: string,
    @Body(ValidationPipe) repaymentDto: RepaymentDto,
  ): Promise<RepaymentResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    this.logger.log(`Loan repayment: ${customerId} -> Loan ${loanId}, Amount: GHS ${repaymentDto.amount}`);

    const request: RepaymentRequest = {
      loanId,
      amount: repaymentDto.amount,
      paymentMethod: repaymentDto.paymentMethod,
      fromAccountId: repaymentDto.fromAccountId,
    };

    const result = await this.loanService.makeRepayment(customerId, request);

    return {
      ...result,
      message: 'Payment processed successfully',
    };
  }

  @Get(':loanId/repayment/history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get repayment history' })
  @ApiParam({ name: 'loanId', description: 'Loan ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Repayment history retrieved' })
  async getRepaymentHistory(
    @Headers('authorization') authorization: string,
    @Param('loanId') loanId: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ): Promise<{
    payments: LoanRepayment[];
    summary: {
      totalPaid: number;
      averagePayment: number;
      onTimePayments: number;
      latePayments: number;
    };
    pagination: {
      limit: number;
      offset: number;
      total: number;
    };
  }> {
    const customerId = await this.extractCustomerId(authorization);
    
    // Mock repayment history
    const payments: LoanRepayment[] = [
      {
        id: 'pay_001',
        loanId,
        paymentNumber: 3,
        paymentDate: new Date(),
        dueDate: new Date(),
        principalAmount: 800,
        interestAmount: 450,
        totalAmount: 1250,
        outstandingBalance: 15000,
        status: PaymentStatus.PAID,
        paymentMethod: 'Bank Transfer',
        daysPastDue: 0,
        createdAt: new Date(),
      },
      {
        id: 'pay_002',
        loanId,
        paymentNumber: 2,
        paymentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        principalAmount: 780,
        interestAmount: 470,
        totalAmount: 1250,
        outstandingBalance: 16250,
        status: PaymentStatus.PAID,
        paymentMethod: 'Mobile Banking',
        daysPastDue: 0,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    ];

    return {
      payments: payments.slice(offset, offset + limit),
      summary: {
        totalPaid: 3750,
        averagePayment: 1250,
        onTimePayments: 3,
        latePayments: 0,
      },
      pagination: {
        limit,
        offset,
        total: payments.length,
      },
    };
  }

  @Get(':loanId/early-settlement')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculate early settlement amount' })
  @ApiParam({ name: 'loanId', description: 'Loan ID' })
  @ApiQuery({ name: 'settlementDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Early settlement calculated', type: EarlySettlementResponseDto })
  async calculateEarlySettlement(
    @Headers('authorization') authorization: string,
    @Param('loanId') loanId: string,
    @Query('settlementDate') settlementDate?: string,
  ): Promise<EarlySettlementResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    const date = settlementDate ? new Date(settlementDate) : new Date();
    const result = await this.loanService.calculateEarlySettlement(customerId, loanId, date);
    
    const savingsPercentage = ((result.currentBalance - result.earlySettlementAmount) / result.currentBalance) * 100;

    return {
      ...result,
      savings: {
        percentage: Math.round(savingsPercentage * 100) / 100,
        amount: result.currentBalance - result.earlySettlementAmount,
      },
    };
  }

  @Post(':loanId/early-settlement')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process early settlement' })
  @ApiParam({ name: 'loanId', description: 'Loan ID' })
  @ApiResponse({ status: 201, description: 'Early settlement processed' })
  async processEarlySettlement(
    @Headers('authorization') authorization: string,
    @Param('loanId') loanId: string,
    @Body(ValidationPipe) settlementDto: EarlySettlementDto,
  ): Promise<{
    settlementId: string;
    transactionId: string;
    amount: number;
    savingsAmount: number;
    status: string;
    message: string;
  }> {
    const customerId = await this.extractCustomerId(authorization);
    
    // Mock early settlement processing
    const settlementId = `settle_${Date.now()}`;
    const transactionId = `txn_${Date.now()}`;
    
    this.logger.log(`Early settlement processed: ${customerId} -> Loan ${loanId}`);
    
    return {
      settlementId,
      transactionId,
      amount: 14250, // Mock settlement amount
      savingsAmount: 750, // Mock savings
      status: 'completed',
      message: 'Early settlement processed successfully',
    };
  }

  // ===== LOAN ANALYTICS ENDPOINTS =====

  @Get('analytics/summary')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get loan analytics summary' })
  @ApiResponse({ status: 200, description: 'Analytics summary retrieved' })
  async getLoanAnalytics(
    @Headers('authorization') authorization: string,
  ): Promise<{
    overview: {
      totalBorrowed: number;
      totalRepaid: number;
      activeLoans: number;
      creditScore: number;
      paymentHistory: string;
    };
    trends: {
      monthlyPayments: Array<{ month: string; amount: number }>;
      balanceHistory: Array<{ date: Date; balance: number }>;
    };
    insights: {
      averagePaymentTime: number;
      onTimePaymentRate: number;
      interestSaved: number;
      recommendations: string[];
    };
  }> {
    const customerId = await this.extractCustomerId(authorization);
    
    // Mock analytics data
    return {
      overview: {
        totalBorrowed: 75000,
        totalRepaid: 45000,
        activeLoans: 2,
        creditScore: 720,
        paymentHistory: 'Excellent',
      },
      trends: {
        monthlyPayments: [
          { month: 'Oct 2024', amount: 2500 },
          { month: 'Nov 2024', amount: 2500 },
          { month: 'Dec 2024', amount: 2500 },
        ],
        balanceHistory: [
          { date: new Date('2024-10-01'), balance: 50000 },
          { date: new Date('2024-11-01'), balance: 32500 },
          { date: new Date('2024-12-01'), balance: 30000 },
        ],
      },
      insights: {
        averagePaymentTime: 2, // days before due date
        onTimePaymentRate: 100,
        interestSaved: 1200,
        recommendations: [
          'Consider early repayment to save on interest',
          'Your payment history is excellent - eligible for better rates',
          'You qualify for higher loan amounts if needed',
        ],
      },
    };
  }

  @Get('eligibility/check')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check loan eligibility' })
  @ApiQuery({ name: 'productId', required: false, type: String })
  @ApiQuery({ name: 'amount', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Eligibility checked' })
  async checkEligibility(
    @Headers('authorization') authorization: string,
    @Query('productId') productId?: string,
    @Query('amount') amount?: number,
  ): Promise<{
    eligible: boolean;
    maxAmount: number;
    recommendedProducts: Array<{
      id: string;
      name: string;
      maxAmount: number;
      interestRate: number;
      reason: string;
    }>;
    requirements: {
      met: string[];
      missing: string[];
    };
    creditProfile: {
      score: number;
      grade: RiskGrade;
      factors: {
        positive: string[];
        negative: string[];
      };
    };
  }> {
    const customerId = await this.extractCustomerId(authorization);
    
    // Mock eligibility check
    return {
      eligible: true,
      maxAmount: 150000,
      recommendedProducts: [
        {
          id: 'personal_001',
          name: 'Personal Loan',
          maxAmount: 50000,
          interestRate: 18.0,
          reason: 'Best match for your profile',
        },
        {
          id: 'business_001',
          name: 'Business Loan',
          maxAmount: 150000,
          interestRate: 16.0,
          reason: 'Higher amount available',
        },
      ],
      requirements: {
        met: ['Valid ID', 'Proof of income', 'Good credit score'],
        missing: ['Recent bank statements'],
      },
      creditProfile: {
        score: 720,
        grade: RiskGrade.B,
        factors: {
          positive: ['Consistent payment history', 'Stable income', 'Low debt ratio'],
          negative: ['Limited credit history'],
        },
      },
    };
  }

  // ===== UTILITY ENDPOINTS =====

  @Get('enums')
  @ApiOperation({ summary: 'Get loan-related enums' })
  @ApiResponse({ status: 200, description: 'Enums retrieved' })
  async getLoanEnums(): Promise<{
    loanStatuses: LoanStatus[];
    loanTypes: LoanType[];
    applicationStatuses: ApplicationStatus[];
    applicationStages: ApplicationStage[];
    riskGrades: RiskGrade[];
    loanPurposes: LoanPurpose[];
    employmentStatuses: EmploymentStatus[];
    paymentStatuses: PaymentStatus[];
    documentTypes: DocumentType[];
  }> {
    return {
      loanStatuses: Object.values(LoanStatus),
      loanTypes: Object.values(LoanType),
      applicationStatuses: Object.values(ApplicationStatus),
      applicationStages: Object.values(ApplicationStage),
      riskGrades: Object.values(RiskGrade),
      loanPurposes: Object.values(LoanPurpose),
      employmentStatuses: Object.values(EmploymentStatus),
      paymentStatuses: Object.values(PaymentStatus),
      documentTypes: Object.values(DocumentType),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check loan service health' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async getHealthStatus(): Promise<{
    status: string;
    timestamp: string;
    services: {
      loanProcessing: string;
      creditAssessment: string;
      repaymentProcessing: string;
      documentManagement: string;
    };
  }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        loanProcessing: 'operational',
        creditAssessment: 'operational',
        repaymentProcessing: 'operational',
        documentManagement: 'operational',
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
}