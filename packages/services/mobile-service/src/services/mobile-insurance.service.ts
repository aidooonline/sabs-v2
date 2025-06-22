import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { nanoid } from 'nanoid';

// ===== INSURANCE ENTITIES =====

export interface InsurancePolicy {
  id: string;
  customerId: string;
  productId: string;
  policyNumber: string;
  type: InsuranceType;
  status: PolicyStatus;
  startDate: Date;
  endDate: Date;
  premiumAmount: number;
  coverageAmount: number;
  beneficiaries: Beneficiary[];
  paymentFrequency: PaymentFrequency;
  nextPaymentDate: Date;
  claimsHistory: string[];
  documents: PolicyDocument[];
  underwritingInfo: UnderwritingInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsuranceProduct {
  id: string;
  name: string;
  type: InsuranceType;
  category: InsuranceCategory;
  description: string;
  features: string[];
  coverageOptions: CoverageOption[];
  premiumRates: PremiumRate[];
  eligibilityRules: EligibilityRule[];
  minimumAge: number;
  maximumAge: number;
  minimumCoverage: number;
  maximumCoverage: number;
  waitingPeriod: number;
  isActive: boolean;
  provider: string;
}

export interface InsuranceClaim {
  id: string;
  policyId: string;
  customerId: string;
  claimNumber: string;
  type: ClaimType;
  status: ClaimStatus;
  incidentDate: Date;
  reportedDate: Date;
  claimAmount: number;
  approvedAmount?: number;
  description: string;
  documents: ClaimDocument[];
  assessments: ClaimAssessment[];
  timeline: ClaimTimeline[];
  assignedAdjuster?: string;
  estimatedSettlement?: Date;
  settlementDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RiskAssessment {
  id: string;
  customerId: string;
  assessmentType: AssessmentType;
  riskScore: number;
  riskLevel: RiskLevel;
  factors: RiskFactor[];
  recommendations: string[];
  validUntil: Date;
  createdAt: Date;
}

// ===== ENUMS =====

export enum InsuranceType {
  LIFE = 'life',
  HEALTH = 'health',
  AUTO = 'auto',
  PROPERTY = 'property',
  TRAVEL = 'travel',
  MICRO_LIFE = 'micro_life',
  MICRO_HEALTH = 'micro_health',
  CROP = 'crop',
  BUSINESS = 'business',
}

export enum InsuranceCategory {
  TRADITIONAL = 'traditional',
  MICRO_INSURANCE = 'micro_insurance',
  GROUP = 'group',
  SPECIALIZED = 'specialized',
}

export enum PolicyStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
  LAPSED = 'lapsed',
}

export enum ClaimStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  INVESTIGATING = 'investigating',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SETTLED = 'settled',
  DISPUTED = 'disputed',
  CLOSED = 'closed',
}

export enum PaymentFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
  ONE_TIME = 'one_time',
}

export enum RiskLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export enum ClaimType {
  DEATH = 'death',
  DISABILITY = 'disability',
  MEDICAL = 'medical',
  ACCIDENT = 'accident',
  THEFT = 'theft',
  DAMAGE = 'damage',
  LIABILITY = 'liability',
}

export enum AssessmentType {
  LIFE_INSURANCE = 'life_insurance',
  HEALTH_INSURANCE = 'health_insurance',
  AUTO_INSURANCE = 'auto_insurance',
  PROPERTY_INSURANCE = 'property_insurance',
}

// ===== SUPPORTING INTERFACES =====

export interface Beneficiary {
  id: string;
  name: string;
  relationship: string;
  percentage: number;
  contactInfo: string;
}

export interface PolicyDocument {
  id: string;
  type: string;
  url: string;
  uploadedAt: Date;
}

export interface UnderwritingInfo {
  riskScore: number;
  medicalExamRequired: boolean;
  additionalDocuments: string[];
  underwriterNotes: string;
  approvalDate: Date;
}

export interface CoverageOption {
  name: string;
  description: string;
  amount: number;
  premium: number;
}

export interface PremiumRate {
  riskLevel: RiskLevel;
  rate: number;
  baseAmount: number;
}

export interface EligibilityRule {
  field: string;
  operator: string;
  value: any;
  description: string;
}

export interface ClaimDocument {
  id: string;
  type: string;
  url: string;
  description: string;
  uploadedAt: Date;
}

export interface ClaimAssessment {
  id: string;
  assessorId: string;
  findings: string;
  recommendation: string;
  amount: number;
  date: Date;
}

export interface ClaimTimeline {
  id: string;
  status: ClaimStatus;
  description: string;
  date: Date;
  actor: string;
}

export interface RiskFactor {
  factor: string;
  impact: number;
  description: string;
}

// ===== REQUEST INTERFACES =====

export interface PurchasePolicyRequest {
  productId: string;
  coverageAmount: number;
  paymentFrequency: PaymentFrequency;
  beneficiaries: Omit<Beneficiary, 'id'>[];
  personalInfo: PersonalInfo;
  riskFactors: Record<string, any>;
}

export interface SubmitClaimRequest {
  policyId: string;
  type: ClaimType;
  incidentDate: Date;
  description: string;
  estimatedAmount: number;
  documents: { type: string; url: string; description: string }[];
}

export interface PersonalInfo {
  age: number;
  occupation: string;
  income: number;
  healthConditions: string[];
  lifestyle: Record<string, any>;
}

@Injectable()
export class MobileInsuranceService {
  private readonly logger = new Logger(MobileInsuranceService.name);

  // In-memory storage
  private policies: Map<string, InsurancePolicy> = new Map();
  private products: Map<string, InsuranceProduct> = new Map();
  private claims: Map<string, InsuranceClaim> = new Map();
  private riskAssessments: Map<string, RiskAssessment[]> = new Map();

  private readonly insuranceConfig = {
    minCoverageAmount: 1000,
    maxCoverageAmount: 10000000,
    processingFee: 25,
    maxBeneficiaries: 5,
    claimTimeLimit: 365, // days
    riskAssessmentValidity: 180, // days
  };

  constructor(
    private eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.initializeInsuranceProducts();
  }

  // ===== INSURANCE PRODUCTS =====

  async getInsuranceProducts(filters?: {
    type?: InsuranceType;
    category?: InsuranceCategory;
    maxPremium?: number;
  }): Promise<{
    products: InsuranceProduct[];
    categories: string[];
    featured: InsuranceProduct[];
  }> {
    let products = Array.from(this.products.values()).filter(p => p.isActive);

    if (filters?.type) {
      products = products.filter(p => p.type === filters.type);
    }
    if (filters?.category) {
      products = products.filter(p => p.category === filters.category);
    }
    if (filters?.maxPremium) {
      products = products.filter(p => 
        p.premiumRates.some(rate => rate.rate * rate.baseAmount <= filters.maxPremium!)
      );
    }

    const categories = [...new Set(products.map(p => p.category))];
    const featured = products.filter(p => p.category === InsuranceCategory.MICRO_INSURANCE).slice(0, 3);

    return {
      products: products.slice(0, 20),
      categories,
      featured,
    };
  }

  async calculatePremium(productId: string, coverageAmount: number, personalInfo: PersonalInfo): Promise<{
    monthlyPremium: number;
    annualPremium: number;
    breakdown: {
      basePremium: number;
      riskAdjustment: number;
      fees: number;
      total: number;
    };
    riskFactors: string[];
  }> {
    const product = this.products.get(productId);
    if (!product) {
      throw new NotFoundException('Insurance product not found');
    }

    // Risk assessment
    const riskScore = this.calculateRiskScore(personalInfo, product.type);
    const riskLevel = this.getRiskLevel(riskScore);
    
    // Base premium calculation
    const premiumRate = product.premiumRates.find(r => r.riskLevel === riskLevel) || product.premiumRates[0];
    const basePremium = (coverageAmount * premiumRate.rate) / 100;
    
    // Risk adjustments
    const riskAdjustment = basePremium * (riskScore / 100);
    const fees = this.insuranceConfig.processingFee;
    const annualPremium = basePremium + riskAdjustment + fees;
    const monthlyPremium = annualPremium / 12;

    const riskFactors = this.identifyRiskFactors(personalInfo, product.type);

    return {
      monthlyPremium: Math.round(monthlyPremium * 100) / 100,
      annualPremium: Math.round(annualPremium * 100) / 100,
      breakdown: {
        basePremium: Math.round(basePremium * 100) / 100,
        riskAdjustment: Math.round(riskAdjustment * 100) / 100,
        fees,
        total: Math.round(annualPremium * 100) / 100,
      },
      riskFactors,
    };
  }

  // ===== POLICY MANAGEMENT =====

  async purchasePolicy(customerId: string, request: PurchasePolicyRequest): Promise<{
    policyId: string;
    policyNumber: string;
    premiumAmount: number;
    status: PolicyStatus;
    nextPaymentDate: Date;
  }> {
    this.logger.log(`Policy purchase: ${customerId} -> Product ${request.productId}`);

    const product = this.products.get(request.productId);
    if (!product) {
      throw new NotFoundException('Insurance product not found');
    }

    // Eligibility check
    const eligibilityResult = this.checkEligibility(product, request.personalInfo);
    if (!eligibilityResult.eligible) {
      throw new BadRequestException(`Not eligible: ${eligibilityResult.reasons.join(', ')}`);
    }

    // Premium calculation
    const premiumCalculation = await this.calculatePremium(
      request.productId,
      request.coverageAmount,
      request.personalInfo
    );

    const policyId = `policy_${nanoid(12)}`;
    const policyNumber = `POL-${Date.now()}-${nanoid(6)}`;

    // Create beneficiaries
    const beneficiaries: Beneficiary[] = request.beneficiaries.map(b => ({
      id: nanoid(8),
      ...b,
    }));

    // Risk assessment
    const riskAssessment = await this.performRiskAssessment(customerId, product.type, request.personalInfo);

    const policy: InsurancePolicy = {
      id: policyId,
      customerId,
      productId: request.productId,
      policyNumber,
      type: product.type,
      status: PolicyStatus.PENDING,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      premiumAmount: request.paymentFrequency === PaymentFrequency.MONTHLY 
        ? premiumCalculation.monthlyPremium 
        : premiumCalculation.annualPremium,
      coverageAmount: request.coverageAmount,
      beneficiaries,
      paymentFrequency: request.paymentFrequency,
      nextPaymentDate: this.calculateNextPaymentDate(request.paymentFrequency),
      claimsHistory: [],
      documents: [],
      underwritingInfo: {
        riskScore: riskAssessment.riskScore,
        medicalExamRequired: riskAssessment.riskLevel === RiskLevel.HIGH,
        additionalDocuments: [],
        underwriterNotes: 'Initial assessment completed',
        approvalDate: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.policies.set(policyId, policy);

    this.eventEmitter.emit('insurance.policy_purchased', {
      policyId,
      customerId,
      productType: product.type,
      coverageAmount: request.coverageAmount,
      premiumAmount: policy.premiumAmount,
    });

    return {
      policyId,
      policyNumber,
      premiumAmount: policy.premiumAmount,
      status: PolicyStatus.PENDING,
      nextPaymentDate: policy.nextPaymentDate,
    };
  }

  async getCustomerPolicies(customerId: string): Promise<{
    policies: InsurancePolicy[];
    summary: {
      totalPolicies: number;
      activePolicies: number;
      totalCoverage: number;
      monthlyPremiums: number;
      upcomingPayments: number;
    };
  }> {
    const policies = Array.from(this.policies.values()).filter(p => p.customerId === customerId);
    
    const activePolicies = policies.filter(p => p.status === PolicyStatus.ACTIVE);
    const totalCoverage = activePolicies.reduce((sum, p) => sum + p.coverageAmount, 0);
    const monthlyPremiums = activePolicies
      .filter(p => p.paymentFrequency === PaymentFrequency.MONTHLY)
      .reduce((sum, p) => sum + p.premiumAmount, 0);
    
    const upcomingPayments = activePolicies.filter(p => 
      p.nextPaymentDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ).length;

    return {
      policies,
      summary: {
        totalPolicies: policies.length,
        activePolicies: activePolicies.length,
        totalCoverage,
        monthlyPremiums,
        upcomingPayments,
      },
    };
  }

  // ===== CLAIMS MANAGEMENT =====

  async submitClaim(customerId: string, request: SubmitClaimRequest): Promise<{
    claimId: string;
    claimNumber: string;
    status: ClaimStatus;
    estimatedProcessingTime: number;
  }> {
    this.logger.log(`Claim submission: ${customerId} -> Policy ${request.policyId}`);

    const policy = this.policies.get(request.policyId);
    if (!policy || policy.customerId !== customerId) {
      throw new NotFoundException('Policy not found');
    }

    if (policy.status !== PolicyStatus.ACTIVE) {
      throw new BadRequestException('Policy is not active');
    }

    const claimId = `claim_${nanoid(12)}`;
    const claimNumber = `CLM-${Date.now()}-${nanoid(6)}`;

    const documents: ClaimDocument[] = request.documents.map(doc => ({
      id: nanoid(8),
      type: doc.type,
      url: doc.url,
      description: doc.description,
      uploadedAt: new Date(),
    }));

    const claim: InsuranceClaim = {
      id: claimId,
      policyId: request.policyId,
      customerId,
      claimNumber,
      type: request.type,
      status: ClaimStatus.SUBMITTED,
      incidentDate: request.incidentDate,
      reportedDate: new Date(),
      claimAmount: request.estimatedAmount,
      description: request.description,
      documents,
      assessments: [],
      timeline: [{
        id: nanoid(8),
        status: ClaimStatus.SUBMITTED,
        description: 'Claim submitted by customer',
        date: new Date(),
        actor: 'Customer',
      }],
      assignedAdjuster: this.assignClaimAdjuster(request.type),
      estimatedSettlement: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.claims.set(claimId, claim);

    // Update policy claims history
    policy.claimsHistory.push(claimId);
    this.policies.set(request.policyId, policy);

    this.eventEmitter.emit('insurance.claim_submitted', {
      claimId,
      claimNumber,
      customerId,
      policyId: request.policyId,
      type: request.type,
      amount: request.estimatedAmount,
    });

    return {
      claimId,
      claimNumber,
      status: ClaimStatus.SUBMITTED,
      estimatedProcessingTime: 14, // days
    };
  }

  async getCustomerClaims(customerId: string): Promise<{
    claims: InsuranceClaim[];
    summary: {
      totalClaims: number;
      pendingClaims: number;
      approvedClaims: number;
      totalClaimAmount: number;
      averageProcessingTime: number;
    };
  }> {
    const claims = Array.from(this.claims.values()).filter(c => c.customerId === customerId);
    
    const pendingClaims = claims.filter(c => 
      [ClaimStatus.SUBMITTED, ClaimStatus.UNDER_REVIEW, ClaimStatus.INVESTIGATING].includes(c.status)
    );
    const approvedClaims = claims.filter(c => c.status === ClaimStatus.APPROVED);
    const totalClaimAmount = approvedClaims.reduce((sum, c) => sum + (c.approvedAmount || 0), 0);

    return {
      claims,
      summary: {
        totalClaims: claims.length,
        pendingClaims: pendingClaims.length,
        approvedClaims: approvedClaims.length,
        totalClaimAmount,
        averageProcessingTime: 12, // Mock average
      },
    };
  }

  // ===== RISK ASSESSMENT =====

  async performRiskAssessment(customerId: string, assessmentType: InsuranceType, personalInfo: PersonalInfo): Promise<RiskAssessment> {
    const riskScore = this.calculateRiskScore(personalInfo, assessmentType);
    const riskLevel = this.getRiskLevel(riskScore);
    const riskFactors = this.generateRiskFactors(personalInfo, assessmentType);

    const assessment: RiskAssessment = {
      id: `risk_${nanoid(12)}`,
      customerId,
      assessmentType: assessmentType as any,
      riskScore,
      riskLevel,
      factors: riskFactors,
      recommendations: this.generateRiskRecommendations(riskLevel, riskFactors),
      validUntil: new Date(Date.now() + this.insuranceConfig.riskAssessmentValidity * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };

    const customerAssessments = this.riskAssessments.get(customerId) || [];
    customerAssessments.push(assessment);
    this.riskAssessments.set(customerId, customerAssessments);

    return assessment;
  }

  // ===== PRIVATE HELPER METHODS =====

  private calculateRiskScore(personalInfo: PersonalInfo, insuranceType: InsuranceType): number {
    let score = 50; // Base score
    
    // Age factor
    if (personalInfo.age < 25) score += 10;
    else if (personalInfo.age > 65) score += 15;
    
    // Occupation factor
    const highRiskOccupations = ['mining', 'construction', 'aviation', 'military'];
    if (highRiskOccupations.some(occ => personalInfo.occupation.toLowerCase().includes(occ))) {
      score += 20;
    }
    
    // Health conditions
    score += personalInfo.healthConditions.length * 5;
    
    // Lifestyle factors
    if (personalInfo.lifestyle.smoking) score += 15;
    if (personalInfo.lifestyle.alcohol === 'heavy') score += 10;
    if (personalInfo.lifestyle.exercise === 'none') score += 5;
    
    return Math.min(100, Math.max(0, score));
  }

  private getRiskLevel(riskScore: number): RiskLevel {
    if (riskScore <= 30) return RiskLevel.LOW;
    if (riskScore <= 50) return RiskLevel.MODERATE;
    if (riskScore <= 75) return RiskLevel.HIGH;
    return RiskLevel.VERY_HIGH;
  }

  private identifyRiskFactors(personalInfo: PersonalInfo, insuranceType: InsuranceType): string[] {
    const factors: string[] = [];
    
    if (personalInfo.age > 65) factors.push('Advanced age');
    if (personalInfo.healthConditions.length > 0) factors.push('Pre-existing health conditions');
    if (personalInfo.lifestyle.smoking) factors.push('Smoking habit');
    if (personalInfo.occupation.toLowerCase().includes('high-risk')) factors.push('High-risk occupation');
    
    return factors;
  }

  private checkEligibility(product: InsuranceProduct, personalInfo: PersonalInfo): {
    eligible: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    
    if (personalInfo.age < product.minimumAge) {
      reasons.push(`Minimum age requirement: ${product.minimumAge}`);
    }
    if (personalInfo.age > product.maximumAge) {
      reasons.push(`Maximum age limit: ${product.maximumAge}`);
    }
    if (personalInfo.income < 12000) { // Minimum annual income
      reasons.push('Insufficient income');
    }
    
    return {
      eligible: reasons.length === 0,
      reasons,
    };
  }

  private calculateNextPaymentDate(frequency: PaymentFrequency): Date {
    const now = new Date();
    switch (frequency) {
      case PaymentFrequency.MONTHLY:
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      case PaymentFrequency.QUARTERLY:
        return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
      case PaymentFrequency.ANNUALLY:
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      default:
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    }
  }

  private assignClaimAdjuster(claimType: ClaimType): string {
    const adjusters = {
      [ClaimType.MEDICAL]: 'Medical Claims Team',
      [ClaimType.ACCIDENT]: 'Accident Investigation Team',
      [ClaimType.DEATH]: 'Life Claims Specialist',
      [ClaimType.DAMAGE]: 'Property Claims Adjuster',
    };
    return adjusters[claimType] || 'General Claims Team';
  }

  private generateRiskFactors(personalInfo: PersonalInfo, assessmentType: InsuranceType): RiskFactor[] {
    const factors: RiskFactor[] = [];
    
    if (personalInfo.age > 50) {
      factors.push({
        factor: 'Age',
        impact: 15,
        description: 'Higher age increases risk profile',
      });
    }
    
    if (personalInfo.healthConditions.length > 0) {
      factors.push({
        factor: 'Health Conditions',
        impact: 20,
        description: 'Pre-existing conditions affect risk',
      });
    }
    
    return factors;
  }

  private generateRiskRecommendations(riskLevel: RiskLevel, factors: RiskFactor[]): string[] {
    const recommendations: string[] = [];
    
    if (riskLevel === RiskLevel.HIGH) {
      recommendations.push('Consider comprehensive coverage options');
      recommendations.push('Regular health check-ups recommended');
    }
    
    if (factors.some(f => f.factor === 'Health Conditions')) {
      recommendations.push('Maintain regular medical care');
    }
    
    recommendations.push('Review and update policy annually');
    
    return recommendations;
  }

  private initializeInsuranceProducts(): void {
    const products: InsuranceProduct[] = [
      {
        id: 'life_term_001',
        name: 'Term Life Insurance',
        type: InsuranceType.LIFE,
        category: InsuranceCategory.TRADITIONAL,
        description: 'Affordable term life insurance with guaranteed payouts',
        features: ['Death benefit', 'Accidental death coverage', 'Flexible premiums'],
        coverageOptions: [
          { name: 'Basic', description: 'Essential coverage', amount: 100000, premium: 500 },
          { name: 'Standard', description: 'Enhanced coverage', amount: 250000, premium: 1000 },
          { name: 'Premium', description: 'Comprehensive coverage', amount: 500000, premium: 1800 },
        ],
        premiumRates: [
          { riskLevel: RiskLevel.LOW, rate: 0.5, baseAmount: 100000 },
          { riskLevel: RiskLevel.MODERATE, rate: 0.8, baseAmount: 100000 },
          { riskLevel: RiskLevel.HIGH, rate: 1.2, baseAmount: 100000 },
        ],
        eligibilityRules: [],
        minimumAge: 18,
        maximumAge: 65,
        minimumCoverage: 50000,
        maximumCoverage: 2000000,
        waitingPeriod: 0,
        isActive: true,
        provider: 'Sabs Insurance',
      },
      {
        id: 'micro_life_001',
        name: 'Micro Life Insurance',
        type: InsuranceType.MICRO_LIFE,
        category: InsuranceCategory.MICRO_INSURANCE,
        description: 'Affordable micro-insurance for low-income families',
        features: ['Low premiums', 'Simple application', 'Quick payouts'],
        coverageOptions: [
          { name: 'Basic', description: 'Essential protection', amount: 5000, premium: 20 },
          { name: 'Family', description: 'Family coverage', amount: 10000, premium: 35 },
        ],
        premiumRates: [
          { riskLevel: RiskLevel.LOW, rate: 0.3, baseAmount: 5000 },
          { riskLevel: RiskLevel.MODERATE, rate: 0.5, baseAmount: 5000 },
        ],
        eligibilityRules: [],
        minimumAge: 18,
        maximumAge: 70,
        minimumCoverage: 2000,
        maximumCoverage: 20000,
        waitingPeriod: 30,
        isActive: true,
        provider: 'Sabs Micro-Insurance',
      },
      {
        id: 'health_basic_001',
        name: 'Basic Health Insurance',
        type: InsuranceType.HEALTH,
        category: InsuranceCategory.TRADITIONAL,
        description: 'Comprehensive health coverage for individuals and families',
        features: ['Hospitalization', 'Outpatient care', 'Prescription drugs', 'Emergency services'],
        coverageOptions: [
          { name: 'Individual', description: 'Single person coverage', amount: 50000, premium: 1200 },
          { name: 'Family', description: 'Full family coverage', amount: 150000, premium: 2500 },
        ],
        premiumRates: [
          { riskLevel: RiskLevel.LOW, rate: 2.0, baseAmount: 50000 },
          { riskLevel: RiskLevel.MODERATE, rate: 2.5, baseAmount: 50000 },
          { riskLevel: RiskLevel.HIGH, rate: 3.5, baseAmount: 50000 },
        ],
        eligibilityRules: [],
        minimumAge: 0,
        maximumAge: 75,
        minimumCoverage: 25000,
        maximumCoverage: 500000,
        waitingPeriod: 90,
        isActive: true,
        provider: 'Sabs Health',
      },
    ];

    products.forEach(product => {
      this.products.set(product.id, product);
    });

    this.logger.log('Insurance products initialized');
  }
}