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
  MobileInsuranceService,
  InsurancePolicy,
  InsuranceProduct,
  InsuranceClaim,
  RiskAssessment,
  InsuranceType,
  InsuranceCategory,
  PolicyStatus,
  ClaimStatus,
  PaymentFrequency,
  ClaimType,
  RiskLevel,
  PurchasePolicyRequest,
  SubmitClaimRequest,
  PersonalInfo,
} from '../services/mobile-insurance.service';

// ===== REQUEST DTOs =====

export class PurchasePolicyDto {
  productId: string;
  coverageAmount: number;
  paymentFrequency: PaymentFrequency;
  beneficiaries: Array<{
    name: string;
    relationship: string;
    percentage: number;
    contactInfo: string;
  }>;
  personalInfo: PersonalInfo;
  riskFactors: Record<string, any>;
}

export class SubmitClaimDto {
  policyId: string;
  type: ClaimType;
  incidentDate: string;
  description: string;
  estimatedAmount: number;
  documents: Array<{
    type: string;
    url: string;
    description: string;
  }>;
}

export class PremiumCalculationDto {
  productId: string;
  coverageAmount: number;
  personalInfo: PersonalInfo;
}

export class RiskAssessmentDto {
  assessmentType: InsuranceType;
  personalInfo: PersonalInfo;
}

export class InsuranceFiltersDto {
  type?: InsuranceType;
  category?: InsuranceCategory;
  maxPremium?: number;
  minCoverage?: number;
  maxCoverage?: number;
}

// ===== RESPONSE DTOs =====

export class PolicyPurchaseResponseDto {
  policyId: string;
  policyNumber: string;
  premiumAmount: number;
  status: PolicyStatus;
  nextPaymentDate: Date;
  message: string;
}

export class ClaimSubmissionResponseDto {
  claimId: string;
  claimNumber: string;
  status: ClaimStatus;
  estimatedProcessingTime: number;
  message: string;
}

export class PremiumQuoteResponseDto {
  monthlyPremium: number;
  annualPremium: number;
  breakdown: {
    basePremium: number;
    riskAdjustment: number;
    fees: number;
    total: number;
  };
  riskFactors: string[];
  recommendations: string[];
}

export class InsuranceOverviewDto {
  products: InsuranceProduct[];
  categories: string[];
  featured: InsuranceProduct[];
  microInsurance: InsuranceProduct[];
  popularProducts: Array<{
    product: InsuranceProduct;
    popularity: number;
    savings: string;
  }>;
}

export class PolicySummaryDto {
  policies: Array<InsurancePolicy & {
    productName: string;
    daysUntilExpiry: number;
    isRenewalDue: boolean;
    claimCount: number;
  }>;
  summary: {
    totalPolicies: number;
    activePolicies: number;
    totalCoverage: number;
    monthlyPremiums: number;
    upcomingPayments: number;
  };
  insights: {
    coverageGaps: string[];
    renewalReminders: string[];
    recommendations: string[];
  };
}

export class ClaimSummaryDto {
  claims: Array<InsuranceClaim & {
    policyNumber: string;
    productName: string;
    daysSinceSubmission: number;
    nextAction: string;
  }>;
  summary: {
    totalClaims: number;
    pendingClaims: number;
    approvedClaims: number;
    totalClaimAmount: number;
    averageProcessingTime: number;
  };
  timeline: Array<{
    date: Date;
    event: string;
    description: string;
  }>;
}

@ApiTags('Mobile Insurance')
@Controller('mobile-insurance')
export class MobileInsuranceController {
  private readonly logger = new Logger(MobileInsuranceController.name);

  constructor(private readonly insuranceService: MobileInsuranceService) {}

  // ===== INSURANCE PRODUCTS ENDPOINTS =====

  @Get('products')
  @ApiOperation({ summary: 'Get insurance products' })
  @ApiQuery({ name: 'type', required: false, enum: InsuranceType })
  @ApiQuery({ name: 'category', required: false, enum: InsuranceCategory })
  @ApiQuery({ name: 'maxPremium', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Insurance products retrieved', type: InsuranceOverviewDto })
  async getInsuranceProducts(
    @Query() filters: InsuranceFiltersDto,
  ): Promise<InsuranceOverviewDto> {
    const result = await this.insuranceService.getInsuranceProducts(filters);
    
    // Add micro-insurance products
    const microInsurance = result.products.filter(p => p.category === InsuranceCategory.MICRO_INSURANCE);
    
    // Mock popular products
    const popularProducts = result.products.slice(0, 3).map(product => ({
      product,
      popularity: Math.floor(Math.random() * 100) + 50,
      savings: `Save up to ${Math.floor(Math.random() * 30) + 10}%`,
    }));

    return {
      ...result,
      microInsurance,
      popularProducts,
    };
  }

  @Get('products/:productId')
  @ApiOperation({ summary: 'Get product details' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product details retrieved' })
  async getProductDetails(
    @Param('productId') productId: string,
  ): Promise<{
    product: InsuranceProduct;
    samplePremiums: Array<{
      age: number;
      coverage: number;
      monthlyPremium: number;
      annualPremium: number;
    }>;
    testimonials: Array<{
      customerName: string;
      rating: number;
      comment: string;
      date: Date;
    }>;
    faqs: Array<{
      question: string;
      answer: string;
    }>;
  }> {
    // Mock implementation - would get from service
    return {
      product: {
        id: productId,
        name: 'Term Life Insurance',
        type: InsuranceType.LIFE,
        category: InsuranceCategory.TRADITIONAL,
        description: 'Comprehensive life insurance protection for you and your family',
        features: ['Death benefit up to GHS 2M', 'Accidental death coverage', 'Flexible premium payments'],
        coverageOptions: [
          { name: 'Basic', description: 'Essential coverage', amount: 100000, premium: 500 },
          { name: 'Standard', description: 'Enhanced coverage', amount: 250000, premium: 1000 },
        ],
        premiumRates: [],
        eligibilityRules: [],
        minimumAge: 18,
        maximumAge: 65,
        minimumCoverage: 50000,
        maximumCoverage: 2000000,
        waitingPeriod: 0,
        isActive: true,
        provider: 'Sabs Insurance',
      },
      samplePremiums: [
        { age: 25, coverage: 100000, monthlyPremium: 45, annualPremium: 540 },
        { age: 35, coverage: 250000, monthlyPremium: 125, annualPremium: 1500 },
        { age: 45, coverage: 500000, monthlyPremium: 280, annualPremium: 3360 },
      ],
      testimonials: [
        {
          customerName: 'Kwame A.',
          rating: 5,
          comment: 'Great coverage at affordable rates. Quick approval process.',
          date: new Date(),
        },
        {
          customerName: 'Ama S.',
          rating: 4,
          comment: 'Excellent customer service and transparent pricing.',
          date: new Date(),
        },
      ],
      faqs: [
        {
          question: 'What is the waiting period?',
          answer: 'There is no waiting period for accidental death. Natural death has a 12-month waiting period.',
        },
        {
          question: 'Can I change my coverage amount?',
          answer: 'Yes, you can increase your coverage subject to underwriting approval.',
        },
      ],
    };
  }

  @Post('quotes')
  @ApiOperation({ summary: 'Calculate insurance premium' })
  @ApiResponse({ status: 200, description: 'Premium calculated', type: PremiumQuoteResponseDto })
  async calculatePremium(
    @Body(ValidationPipe) quoteDto: PremiumCalculationDto,
  ): Promise<PremiumQuoteResponseDto> {
    const result = await this.insuranceService.calculatePremium(
      quoteDto.productId,
      quoteDto.coverageAmount,
      quoteDto.personalInfo
    );

    return {
      ...result,
      recommendations: [
        'Consider increasing coverage for better family protection',
        'Annual payment offers 10% discount',
        'Add accidental death rider for extra protection',
      ],
    };
  }

  // ===== POLICY MANAGEMENT ENDPOINTS =====

  @Post('policies')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Purchase insurance policy' })
  @ApiResponse({ status: 201, description: 'Policy purchased successfully', type: PolicyPurchaseResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid policy request' })
  async purchasePolicy(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) policyDto: PurchasePolicyDto,
  ): Promise<PolicyPurchaseResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    this.logger.log(`Policy purchase: ${customerId} -> Product ${policyDto.productId}`);

    // Validate beneficiaries percentages
    const totalPercentage = policyDto.beneficiaries.reduce((sum, b) => sum + b.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new BadRequestException('Beneficiary percentages must total 100%');
    }

    const request: PurchasePolicyRequest = {
      productId: policyDto.productId,
      coverageAmount: policyDto.coverageAmount,
      paymentFrequency: policyDto.paymentFrequency,
      beneficiaries: policyDto.beneficiaries,
      personalInfo: policyDto.personalInfo,
      riskFactors: policyDto.riskFactors,
    };

    const result = await this.insuranceService.purchasePolicy(customerId, request);

    return {
      ...result,
      message: 'Policy application submitted successfully. Underwriting review in progress.',
    };
  }

  @Get('policies')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer policies' })
  @ApiResponse({ status: 200, description: 'Policies retrieved', type: PolicySummaryDto })
  async getCustomerPolicies(
    @Headers('authorization') authorization: string,
  ): Promise<PolicySummaryDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    const result = await this.insuranceService.getCustomerPolicies(customerId);
    
    // Enhance policies with additional info
    const enhancedPolicies = result.policies.map(policy => {
      const daysUntilExpiry = Math.ceil((policy.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      const isRenewalDue = daysUntilExpiry <= 30;
      
      return {
        ...policy,
        productName: this.getProductName(policy.productId),
        daysUntilExpiry,
        isRenewalDue,
        claimCount: policy.claimsHistory.length,
      };
    });

    return {
      policies: enhancedPolicies,
      summary: result.summary,
      insights: {
        coverageGaps: this.identifyCoverageGaps(result.policies),
        renewalReminders: enhancedPolicies
          .filter(p => p.isRenewalDue)
          .map(p => `${p.productName} expires in ${p.daysUntilExpiry} days`),
        recommendations: [
          'Consider increasing life insurance coverage as income grows',
          'Add health insurance for comprehensive protection',
          'Review beneficiaries annually',
        ],
      },
    };
  }

  @Get('policies/:policyId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get policy details' })
  @ApiParam({ name: 'policyId', description: 'Policy ID' })
  @ApiResponse({ status: 200, description: 'Policy details retrieved' })
  async getPolicyDetails(
    @Headers('authorization') authorization: string,
    @Param('policyId') policyId: string,
  ): Promise<{
    policy: InsurancePolicy;
    paymentHistory: Array<{
      date: Date;
      amount: number;
      status: string;
      method: string;
    }>;
    coverage: {
      currentCoverage: number;
      beneficiaries: Array<{
        name: string;
        relationship: string;
        percentage: number;
        amount: number;
      }>;
    };
    documents: Array<{
      name: string;
      type: string;
      url: string;
      date: Date;
    }>;
  }> {
    const customerId = await this.extractCustomerId(authorization);
    
    // Mock implementation - would get from service
    const policy = {
      id: policyId,
      customerId,
      productId: 'life_term_001',
      policyNumber: 'POL-2024-001',
      type: InsuranceType.LIFE,
      status: PolicyStatus.ACTIVE,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-01-01'),
      premiumAmount: 125,
      coverageAmount: 250000,
      beneficiaries: [
        { id: '1', name: 'Jane Doe', relationship: 'Spouse', percentage: 60, contactInfo: 'jane@email.com' },
        { id: '2', name: 'John Doe Jr.', relationship: 'Child', percentage: 40, contactInfo: 'minor' },
      ],
      paymentFrequency: PaymentFrequency.MONTHLY,
      nextPaymentDate: new Date('2024-12-01'),
      claimsHistory: [],
      documents: [],
      underwritingInfo: {
        riskScore: 45,
        medicalExamRequired: false,
        additionalDocuments: [],
        underwriterNotes: 'Standard risk profile',
        approvalDate: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as InsurancePolicy;

    return {
      policy,
      paymentHistory: [
        { date: new Date('2024-11-01'), amount: 125, status: 'Paid', method: 'Mobile Money' },
        { date: new Date('2024-10-01'), amount: 125, status: 'Paid', method: 'Bank Transfer' },
        { date: new Date('2024-09-01'), amount: 125, status: 'Paid', method: 'Mobile Money' },
      ],
      coverage: {
        currentCoverage: policy.coverageAmount,
        beneficiaries: policy.beneficiaries.map(b => ({
          name: b.name,
          relationship: b.relationship,
          percentage: b.percentage,
          amount: (policy.coverageAmount * b.percentage) / 100,
        })),
      },
      documents: [
        { name: 'Policy Certificate', type: 'certificate', url: '/docs/policy-cert.pdf', date: new Date() },
        { name: 'Payment Schedule', type: 'schedule', url: '/docs/payment-schedule.pdf', date: new Date() },
      ],
    };
  }

  @Put('policies/:policyId/renew')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Renew insurance policy' })
  @ApiParam({ name: 'policyId', description: 'Policy ID' })
  @ApiResponse({ status: 200, description: 'Policy renewed successfully' })
  async renewPolicy(
    @Headers('authorization') authorization: string,
    @Param('policyId') policyId: string,
    @Body() renewalOptions?: {
      coverageAmount?: number;
      paymentFrequency?: PaymentFrequency;
      updateBeneficiaries?: boolean;
    },
  ): Promise<{
    success: boolean;
    newPolicyId: string;
    newPremium: number;
    renewalDate: Date;
    message: string;
  }> {
    const customerId = await this.extractCustomerId(authorization);
    
    this.logger.log(`Policy renewal: ${customerId} -> Policy ${policyId}`);

    return {
      success: true,
      newPolicyId: `policy_${Date.now()}`,
      newPremium: renewalOptions?.coverageAmount ? 150 : 125,
      renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      message: 'Policy renewed successfully for another year',
    };
  }

  // ===== CLAIMS MANAGEMENT ENDPOINTS =====

  @Post('claims')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit insurance claim' })
  @ApiResponse({ status: 201, description: 'Claim submitted successfully', type: ClaimSubmissionResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid claim request' })
  async submitClaim(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) claimDto: SubmitClaimDto,
  ): Promise<ClaimSubmissionResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    this.logger.log(`Claim submission: ${customerId} -> Policy ${claimDto.policyId}`);

    const request: SubmitClaimRequest = {
      policyId: claimDto.policyId,
      type: claimDto.type,
      incidentDate: new Date(claimDto.incidentDate),
      description: claimDto.description,
      estimatedAmount: claimDto.estimatedAmount,
      documents: claimDto.documents,
    };

    const result = await this.insuranceService.submitClaim(customerId, request);

    return {
      ...result,
      message: 'Claim submitted successfully. Our team will review and contact you within 48 hours.',
    };
  }

  @Get('claims')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer claims' })
  @ApiResponse({ status: 200, description: 'Claims retrieved', type: ClaimSummaryDto })
  async getCustomerClaims(
    @Headers('authorization') authorization: string,
  ): Promise<ClaimSummaryDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    const result = await this.insuranceService.getCustomerClaims(customerId);
    
    // Enhance claims with additional info
    const enhancedClaims = result.claims.map(claim => {
      const daysSinceSubmission = Math.ceil((Date.now() - claim.reportedDate.getTime()) / (24 * 60 * 60 * 1000));
      
      return {
        ...claim,
        policyNumber: `POL-${claim.policyId.slice(-6)}`,
        productName: this.getProductName(claim.policyId),
        daysSinceSubmission,
        nextAction: this.getNextClaimAction(claim.status),
      };
    });

    // Generate timeline
    const timeline = result.claims.flatMap(claim => 
      claim.timeline.map(t => ({
        date: t.date,
        event: `${claim.claimNumber}: ${t.description}`,
        description: `Claim ${t.status.replace('_', ' ')}`,
      }))
    ).sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

    return {
      claims: enhancedClaims,
      summary: result.summary,
      timeline,
    };
  }

  @Get('claims/:claimId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get claim details' })
  @ApiParam({ name: 'claimId', description: 'Claim ID' })
  @ApiResponse({ status: 200, description: 'Claim details retrieved' })
  async getClaimDetails(
    @Headers('authorization') authorization: string,
    @Param('claimId') claimId: string,
  ): Promise<{
    claim: InsuranceClaim;
    timeline: Array<{
      date: Date;
      status: string;
      description: string;
      actor: string;
      documents?: string[];
    }>;
    nextSteps: string[];
    estimatedResolution: Date;
    contactInfo: {
      adjuster: string;
      phone: string;
      email: string;
    };
  }> {
    const customerId = await this.extractCustomerId(authorization);
    
    // Mock implementation
    return {
      claim: {
        id: claimId,
        policyId: 'policy_001',
        customerId,
        claimNumber: 'CLM-2024-001',
        type: ClaimType.MEDICAL,
        status: ClaimStatus.UNDER_REVIEW,
        incidentDate: new Date('2024-11-15'),
        reportedDate: new Date('2024-11-16'),
        claimAmount: 5000,
        description: 'Medical treatment for accident',
        documents: [],
        assessments: [],
        timeline: [],
        assignedAdjuster: 'Medical Claims Team',
        estimatedSettlement: new Date('2024-12-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      timeline: [
        {
          date: new Date('2024-11-16'),
          status: 'submitted',
          description: 'Claim submitted by customer',
          actor: 'Customer',
        },
        {
          date: new Date('2024-11-17'),
          status: 'under_review',
          description: 'Initial review completed, documents verified',
          actor: 'Claims Team',
          documents: ['medical_report.pdf', 'receipts.pdf'],
        },
        {
          date: new Date('2024-11-20'),
          status: 'investigating',
          description: 'Medical assessment in progress',
          actor: 'Medical Assessor',
        },
      ],
      nextSteps: [
        'Medical assessment completion (Expected: Dec 5, 2024)',
        'Final review and approval (Expected: Dec 10, 2024)',
        'Payment processing (Expected: Dec 15, 2024)',
      ],
      estimatedResolution: new Date('2024-12-15'),
      contactInfo: {
        adjuster: 'Dr. Sarah Johnson',
        phone: '+233-20-123-4567',
        email: 'claims@sabsinsurance.com',
      },
    };
  }

  @Post('claims/:claimId/documents')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload additional claim documents' })
  @ApiParam({ name: 'claimId', description: 'Claim ID' })
  @ApiResponse({ status: 201, description: 'Documents uploaded successfully' })
  async uploadClaimDocuments(
    @Headers('authorization') authorization: string,
    @Param('claimId') claimId: string,
    @Body() documents: Array<{
      type: string;
      url: string;
      description: string;
    }>,
  ): Promise<{
    success: boolean;
    uploadedDocuments: number;
    message: string;
  }> {
    const customerId = await this.extractCustomerId(authorization);
    
    this.logger.log(`Document upload: ${customerId} -> Claim ${claimId}, ${documents.length} documents`);

    return {
      success: true,
      uploadedDocuments: documents.length,
      message: 'Documents uploaded successfully. Claim review will be updated.',
    };
  }

  // ===== RISK ASSESSMENT ENDPOINTS =====

  @Post('risk-assessment')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perform risk assessment' })
  @ApiResponse({ status: 201, description: 'Risk assessment completed' })
  async performRiskAssessment(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) assessmentDto: RiskAssessmentDto,
  ): Promise<{
    assessment: RiskAssessment;
    recommendations: string[];
    suitableProducts: Array<{
      productId: string;
      productName: string;
      recommendationReason: string;
    }>;
  }> {
    const customerId = await this.extractCustomerId(authorization);
    
    const assessment = await this.insuranceService.performRiskAssessment(
      customerId,
      assessmentDto.assessmentType,
      assessmentDto.personalInfo
    );

    return {
      assessment,
      recommendations: [
        'Based on your risk profile, consider comprehensive health coverage',
        'Regular health check-ups can help reduce risk and premiums',
        'Consider increasing life insurance coverage due to family dependents',
      ],
      suitableProducts: [
        {
          productId: 'health_basic_001',
          productName: 'Basic Health Insurance',
          recommendationReason: 'Matches your health coverage needs and budget',
        },
        {
          productId: 'life_term_001',
          productName: 'Term Life Insurance',
          recommendationReason: 'Provides family protection at affordable rates',
        },
      ],
    };
  }

  @Get('risk-profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer risk profile' })
  @ApiResponse({ status: 200, description: 'Risk profile retrieved' })
  async getCustomerRiskProfile(
    @Headers('authorization') authorization: string,
  ): Promise<{
    overallRiskLevel: RiskLevel;
    riskScores: Array<{
      type: InsuranceType;
      score: number;
      level: RiskLevel;
      lastAssessed: Date;
    }>;
    factors: Array<{
      category: string;
      impact: 'positive' | 'negative';
      description: string;
      suggestions: string[];
    }>;
    recommendations: string[];
  }> {
    const customerId = await this.extractCustomerId(authorization);
    
    return {
      overallRiskLevel: RiskLevel.MODERATE,
      riskScores: [
        {
          type: InsuranceType.LIFE,
          score: 45,
          level: RiskLevel.MODERATE,
          lastAssessed: new Date(),
        },
        {
          type: InsuranceType.HEALTH,
          score: 38,
          level: RiskLevel.LOW,
          lastAssessed: new Date(),
        },
      ],
      factors: [
        {
          category: 'Health & Lifestyle',
          impact: 'positive',
          description: 'Regular exercise and non-smoking lifestyle',
          suggestions: ['Maintain current healthy habits', 'Consider health insurance discounts'],
        },
        {
          category: 'Occupation',
          impact: 'negative',
          description: 'Moderate-risk occupation in construction',
          suggestions: ['Consider occupational accident coverage', 'Review safety protocols'],
        },
      ],
      recommendations: [
        'Your health profile qualifies for preferred rates',
        'Consider increasing life insurance coverage',
        'Occupational hazard coverage recommended',
      ],
    };
  }

  // ===== INSURANCE INSIGHTS ENDPOINTS =====

  @Get('insights/coverage-analysis')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get coverage gap analysis' })
  @ApiResponse({ status: 200, description: 'Coverage analysis retrieved' })
  async getCoverageAnalysis(
    @Headers('authorization') authorization: string,
  ): Promise<{
    currentCoverage: {
      totalCoverage: number;
      byType: Array<{ type: InsuranceType; coverage: number; percentage: number }>;
    };
    gaps: Array<{
      type: InsuranceType;
      currentCoverage: number;
      recommendedCoverage: number;
      gap: number;
      priority: 'high' | 'medium' | 'low';
    }>;
    recommendations: Array<{
      action: string;
      product: string;
      benefit: string;
      estimatedCost: number;
    }>;
  }> {
    const customerId = await this.extractCustomerId(authorization);
    
    return {
      currentCoverage: {
        totalCoverage: 350000,
        byType: [
          { type: InsuranceType.LIFE, coverage: 250000, percentage: 71.4 },
          { type: InsuranceType.HEALTH, coverage: 100000, percentage: 28.6 },
        ],
      },
      gaps: [
        {
          type: InsuranceType.LIFE,
          currentCoverage: 250000,
          recommendedCoverage: 500000,
          gap: 250000,
          priority: 'high',
        },
        {
          type: InsuranceType.AUTO,
          currentCoverage: 0,
          recommendedCoverage: 50000,
          gap: 50000,
          priority: 'medium',
        },
      ],
      recommendations: [
        {
          action: 'Increase life insurance coverage',
          product: 'Term Life Insurance',
          benefit: 'Better family financial protection',
          estimatedCost: 75,
        },
        {
          action: 'Add auto insurance',
          product: 'Comprehensive Auto Insurance',
          benefit: 'Vehicle and liability protection',
          estimatedCost: 120,
        },
      ],
    };
  }

  @Get('insights/education')
  @ApiOperation({ summary: 'Get insurance education content' })
  @ApiResponse({ status: 200, description: 'Education content retrieved' })
  async getInsuranceEducation(): Promise<{
    articles: Array<{
      id: string;
      title: string;
      category: string;
      readTime: number;
      summary: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
    }>;
    videos: Array<{
      id: string;
      title: string;
      duration: number;
      thumbnail: string;
      category: string;
    }>;
    calculators: Array<{
      name: string;
      description: string;
      url: string;
    }>;
    faqs: Array<{
      category: string;
      question: string;
      answer: string;
    }>;
  }> {
    return {
      articles: [
        {
          id: 'ins_001',
          title: 'Understanding Life Insurance Basics',
          category: 'Life Insurance',
          readTime: 5,
          summary: 'Learn the fundamentals of life insurance and why it matters',
          difficulty: 'beginner',
        },
        {
          id: 'ins_002',
          title: 'Micro-Insurance: Protection for Everyone',
          category: 'Micro-Insurance',
          readTime: 4,
          summary: 'How micro-insurance makes protection affordable for all',
          difficulty: 'beginner',
        },
        {
          id: 'ins_003',
          title: 'Claim Process: What to Expect',
          category: 'Claims',
          readTime: 7,
          summary: 'Step-by-step guide to filing and managing insurance claims',
          difficulty: 'intermediate',
        },
      ],
      videos: [
        {
          id: 'vid_ins_001',
          title: 'Choosing the Right Insurance Coverage',
          duration: 240,
          thumbnail: '/videos/insurance-guide.jpg',
          category: 'General',
        },
      ],
      calculators: [
        {
          name: 'Life Insurance Needs Calculator',
          description: 'Calculate how much life insurance coverage you need',
          url: '/calculators/life-insurance',
        },
        {
          name: 'Premium Comparison Tool',
          description: 'Compare premiums across different insurance products',
          url: '/calculators/premium-comparison',
        },
      ],
      faqs: [
        {
          category: 'General',
          question: 'What is the difference between term and whole life insurance?',
          answer: 'Term life insurance provides coverage for a specific period, while whole life insurance provides lifetime coverage with a cash value component.',
        },
        {
          category: 'Claims',
          question: 'How long does it take to process a claim?',
          answer: 'Most claims are processed within 14-30 days, depending on the complexity and documentation provided.',
        },
      ],
    };
  }

  // ===== UTILITY ENDPOINTS =====

  @Get('enums')
  @ApiOperation({ summary: 'Get insurance-related enums' })
  @ApiResponse({ status: 200, description: 'Enums retrieved' })
  async getInsuranceEnums(): Promise<{
    insuranceTypes: InsuranceType[];
    insuranceCategories: InsuranceCategory[];
    policyStatuses: PolicyStatus[];
    claimStatuses: ClaimStatus[];
    paymentFrequencies: PaymentFrequency[];
    claimTypes: ClaimType[];
    riskLevels: RiskLevel[];
  }> {
    return {
      insuranceTypes: Object.values(InsuranceType),
      insuranceCategories: Object.values(InsuranceCategory),
      policyStatuses: Object.values(PolicyStatus),
      claimStatuses: Object.values(ClaimStatus),
      paymentFrequencies: Object.values(PaymentFrequency),
      claimTypes: Object.values(ClaimType),
      riskLevels: Object.values(RiskLevel),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check insurance service health' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async getHealthStatus(): Promise<{
    status: string;
    timestamp: string;
    services: {
      policyManagement: string;
      claimsProcessing: string;
      riskAssessment: string;
      underwriting: string;
    };
  }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        policyManagement: 'operational',
        claimsProcessing: 'operational',
        riskAssessment: 'operational',
        underwriting: 'operational',
      },
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  private async extractCustomerId(authorization: string): Promise<string> {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new BadRequestException('Invalid authorization header');
    }
    return 'cust_demo_001';
  }

  private getProductName(productId: string): string {
    const productNames: Record<string, string> = {
      'life_term_001': 'Term Life Insurance',
      'micro_life_001': 'Micro Life Insurance',
      'health_basic_001': 'Basic Health Insurance',
      'auto_comprehensive_001': 'Comprehensive Auto Insurance',
    };
    return productNames[productId] || 'Unknown Product';
  }

  private identifyCoverageGaps(policies: InsurancePolicy[]): string[] {
    const gaps: string[] = [];
    
    const hasLife = policies.some(p => p.type === InsuranceType.LIFE);
    const hasHealth = policies.some(p => p.type === InsuranceType.HEALTH);
    const hasAuto = policies.some(p => p.type === InsuranceType.AUTO);
    
    if (!hasLife) gaps.push('Consider life insurance for family protection');
    if (!hasHealth) gaps.push('Health insurance recommended for medical coverage');
    if (!hasAuto) gaps.push('Auto insurance may be required for vehicle owners');
    
    return gaps;
  }

  private getNextClaimAction(status: ClaimStatus): string {
    const actions: Record<ClaimStatus, string> = {
      [ClaimStatus.SUBMITTED]: 'Awaiting initial review',
      [ClaimStatus.UNDER_REVIEW]: 'Document verification in progress',
      [ClaimStatus.INVESTIGATING]: 'Assessment by adjusters',
      [ClaimStatus.APPROVED]: 'Payment processing',
      [ClaimStatus.REJECTED]: 'Review rejection reason',
      [ClaimStatus.SETTLED]: 'Claim completed',
      [ClaimStatus.DISPUTED]: 'Dispute resolution pending',
      [ClaimStatus.CLOSED]: 'No further action required',
    };
    return actions[status] || 'Contact support for status';
  }
}