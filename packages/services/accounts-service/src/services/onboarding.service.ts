import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CustomerOnboarding, OnboardingStatus, OnboardingStep, DocumentType, OnboardingChannel } from '../entities/customer-onboarding.entity';
import { Customer } from '../entities/customer.entity';
import { 
  StartOnboardingDto, 
  UpdatePersonalInfoDto,
  UpdateContactInfoDto,
  UpdateIdentificationDto,
  UpdateAccountPreferencesDto,
  UploadDocumentDto,
  VerifyDocumentDto,
  SubmitOnboardingDto,
  ApproveOnboardingDto,
  RejectOnboardingDto,
  OnboardingQueryDto,
  OnboardingResponseDto,
  OnboardingListResponseDto,
  OnboardingStatsResponseDto
} from '../dto/onboarding.dto';

@Injectable()
export class CustomerOnboardingService {
  private readonly logger = new Logger(CustomerOnboardingService.name);

  constructor(
    @InjectRepository(CustomerOnboarding)
    private readonly onboardingRepository: Repository<CustomerOnboarding>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Start a new customer onboarding process
   */
  async startOnboarding(
    companyId: string,
    agentId: string,
    agentName: string,
    agentPhone: string,
    dto: StartOnboardingDto,
    ipAddress?: string,
  ): Promise<OnboardingResponseDto> {
    this.logger.log(`Starting onboarding for company ${companyId} by agent ${agentId}`);

    // Create onboarding record
    const onboardingData = CustomerOnboarding.create({
      companyId,
      agentId,
      agentName,
      agentPhone,
      channel: dto.channel,
      location: dto.location,
      ipAddress,
    });

    const onboarding = this.onboardingRepository.create(onboardingData);
    
    if (dto.referralCode) {
      onboarding.metadata = { referralCode: dto.referralCode };
    }
    
    if (dto.notes) {
      onboarding.notes = dto.notes;
    }

    onboarding.start(agentId, agentName, agentPhone, dto.location);

    const savedOnboarding = await this.onboardingRepository.save(onboarding);

    // Emit event for analytics and notifications
    this.eventEmitter.emit('onboarding.started', {
      onboardingId: savedOnboarding.id,
      companyId,
      agentId,
      channel: dto.channel,
    });

    this.logger.log(`Onboarding ${savedOnboarding.onboardingNumber} started successfully`);

    return this.mapToResponseDto(savedOnboarding);
  }

  /**
   * Update personal information step
   */
  async updatePersonalInfo(
    onboardingId: string,
    companyId: string,
    dto: UpdatePersonalInfoDto,
  ): Promise<OnboardingResponseDto> {
    const onboarding = await this.findOnboardingByIdAndCompany(onboardingId, companyId);
    
    if (!onboarding.isPending) {
      throw new BadRequestException('Onboarding is not in a state that allows updates');
    }

    if (onboarding.isExpired) {
      throw new BadRequestException('Onboarding session has expired');
    }

    // Validate age requirement (18+)
    const birthDate = new Date(dto.dateOfBirth);
    const age = this.calculateAge(birthDate);
    if (age < 18) {
      throw new BadRequestException('Customer must be at least 18 years old');
    }

    // Update customer data
    const personalData = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      middleName: dto.middleName,
      dateOfBirth: dto.dateOfBirth,
      gender: dto.gender,
      isBusiness: dto.isBusiness || false,
    };

    if (dto.businessInfo && dto.isBusiness) {
      Object.assign(personalData, {
        businessName: dto.businessInfo.businessName,
        businessRegistrationNumber: dto.businessInfo.businessRegistrationNumber,
        businessType: dto.businessInfo.businessType,
      });
    }

    onboarding.updateCustomerData(personalData);
    onboarding.completeStep(OnboardingStep.PERSONAL_INFO, personalData);

    // Update risk score based on personal info
    const riskFactors = this.calculatePersonalInfoRisk(dto, age);
    onboarding.updateRiskScore(riskFactors.totalScore, riskFactors.factors);

    const savedOnboarding = await this.onboardingRepository.save(onboarding);

    this.eventEmitter.emit('onboarding.step.completed', {
      onboardingId: savedOnboarding.id,
      step: OnboardingStep.PERSONAL_INFO,
      companyId,
    });

    return this.mapToResponseDto(savedOnboarding);
  }

  /**
   * Update contact information step
   */
  async updateContactInfo(
    onboardingId: string,
    companyId: string,
    dto: UpdateContactInfoDto,
  ): Promise<OnboardingResponseDto> {
    const onboarding = await this.findOnboardingByIdAndCompany(onboardingId, companyId);

    if (!onboarding.isPending) {
      throw new BadRequestException('Onboarding is not in a state that allows updates');
    }

    if (onboarding.isExpired) {
      throw new BadRequestException('Onboarding session has expired');
    }

    // Check for duplicate phone number in the company
    const existingCustomer = await this.customerRepository.findOne({
      where: {
        companyId,
        phoneNumber: dto.phoneNumber,
      },
    });

    if (existingCustomer) {
      throw new ConflictException('A customer with this phone number already exists');
    }

    // Update customer data
    const contactData = {
      phoneNumber: dto.phoneNumber,
      email: dto.email,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      city: dto.city,
      region: dto.region,
      postalCode: dto.postalCode,
      country: dto.country || 'GHA',
    };

    if (dto.emergencyContact) {
      Object.assign(contactData, {
        emergencyContactName: dto.emergencyContact.emergencyContactName,
        emergencyContactPhone: dto.emergencyContact.emergencyContactPhone,
        emergencyContactRelationship: dto.emergencyContact.emergencyContactRelationship,
      });
    }

    onboarding.updateCustomerData(contactData);
    onboarding.completeStep(OnboardingStep.CONTACT_INFO, contactData);

    const savedOnboarding = await this.onboardingRepository.save(onboarding);

    this.eventEmitter.emit('onboarding.step.completed', {
      onboardingId: savedOnboarding.id,
      step: OnboardingStep.CONTACT_INFO,
      companyId,
    });

    return this.mapToResponseDto(savedOnboarding);
  }

  /**
   * Update identification information step
   */
  async updateIdentification(
    onboardingId: string,
    companyId: string,
    dto: UpdateIdentificationDto,
  ): Promise<OnboardingResponseDto> {
    const onboarding = await this.findOnboardingByIdAndCompany(onboardingId, companyId);

    if (!onboarding.isPending) {
      throw new BadRequestException('Onboarding is not in a state that allows updates');
    }

    if (onboarding.isExpired) {
      throw new BadRequestException('Onboarding session has expired');
    }

    // Check for duplicate identification number in the company
    const existingCustomer = await this.customerRepository.findOne({
      where: {
        companyId,
        identificationNumber: dto.identificationNumber,
      },
    });

    if (existingCustomer) {
      throw new ConflictException('A customer with this identification number already exists');
    }

    // Update customer data
    const identificationData = {
      identificationType: dto.identificationType,
      identificationNumber: dto.identificationNumber,
      identificationExpiry: dto.identificationExpiry,
    };

    onboarding.updateCustomerData(identificationData);
    onboarding.completeStep(OnboardingStep.IDENTIFICATION, identificationData);

    // Check if AML screening is required
    if (this.requiresAmlCheck(dto.identificationNumber, onboarding.customerData)) {
      onboarding.requireAmlCheck();
    }

    const savedOnboarding = await this.onboardingRepository.save(onboarding);

    this.eventEmitter.emit('onboarding.step.completed', {
      onboardingId: savedOnboarding.id,
      step: OnboardingStep.IDENTIFICATION,
      companyId,
    });

    return this.mapToResponseDto(savedOnboarding);
  }

  /**
   * Update account preferences step
   */
  async updateAccountPreferences(
    onboardingId: string,
    companyId: string,
    dto: UpdateAccountPreferencesDto,
  ): Promise<OnboardingResponseDto> {
    const onboarding = await this.findOnboardingByIdAndCompany(onboardingId, companyId);

    if (!onboarding.isPending) {
      throw new BadRequestException('Onboarding is not in a state that allows updates');
    }

    if (onboarding.isExpired) {
      throw new BadRequestException('Onboarding session has expired');
    }

    // Store account preferences
    onboarding.accountPreferences = {
      accountType: dto.accountType,
      accountName: dto.accountName,
      currency: dto.currency,
      openingBalance: dto.openingBalance,
      smsNotifications: dto.smsNotifications,
      emailNotifications: dto.emailNotifications,
      preferredLanguage: dto.preferredLanguage,
    };

    // Update customer preferences
    const preferencesData = {
      preferredLanguage: dto.preferredLanguage,
      preferredCurrency: dto.currency,
      smsNotifications: dto.smsNotifications,
      emailNotifications: dto.emailNotifications,
    };

    onboarding.updateCustomerData(preferencesData);
    onboarding.completeStep(OnboardingStep.ACCOUNT_CREATION, preferencesData);

    const savedOnboarding = await this.onboardingRepository.save(onboarding);

    this.eventEmitter.emit('onboarding.step.completed', {
      onboardingId: savedOnboarding.id,
      step: OnboardingStep.ACCOUNT_CREATION,
      companyId,
    });

    return this.mapToResponseDto(savedOnboarding);
  }

  /**
   * Upload document
   */
  async uploadDocument(
    onboardingId: string,
    companyId: string,
    dto: UploadDocumentDto,
  ): Promise<OnboardingResponseDto> {
    const onboarding = await this.findOnboardingByIdAndCompany(onboardingId, companyId);

    if (!onboarding.isPending) {
      throw new BadRequestException('Onboarding is not in a state that allows updates');
    }

    if (onboarding.isExpired) {
      throw new BadRequestException('Onboarding session has expired');
    }

    // TODO: In a real implementation: { roadmap: { phases: [], _dependencies: any, milestones: [] }, _resourcePlan: any, budget: 0, _timeline: any, riskAssessment: { risks: [], _mitigation: any, probability: 0, _impact: any, you would upload the file to cloud storage
    // For now, we'll store the content as metadata
    const documentUrl = await this.uploadDocumentToStorage(dto);

    onboarding.addDocument({
      type: dto.documentType,
      url: documentUrl,
      fileName: dto.fileName,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
    });

    // Auto-verify certain document types for basic KYC
    if (onboarding.kycLevel === 1 && this.isAutoVerifiableDocument(dto.documentType)) {
      onboarding.verifyDocument(dto.documentType, true);
    }

    // Check if document upload step is complete
    if (onboarding.documentCompletionRate >= 100) {
      onboarding.completeStep(OnboardingStep.DOCUMENT_UPLOAD);
    }

    const savedOnboarding = await this.onboardingRepository.save(onboarding);

    this.eventEmitter.emit('onboarding.document.uploaded', {
      onboardingId: savedOnboarding.id,
      documentType: dto.documentType,
      companyId,
    });

    return this.mapToResponseDto(savedOnboarding);
  }

  /**
   * Verify uploaded document
   */
  async verifyDocument(
    onboardingId: string,
    companyId: string,
    dto: VerifyDocumentDto,
    verifiedBy: string,
  ): Promise<OnboardingResponseDto> {
    const onboarding = await this.findOnboardingByIdAndCompany(onboardingId, companyId);

    onboarding.verifiedBy = verifiedBy;
    onboarding.verifyDocument(dto.documentType, dto.verified, dto.rejectionReason);

    // Update KYC level based on verified documents
    if (dto.verified) {
      const newKycLevel = this.calculateKycLevel(onboarding.documentsCompleted);
      if (newKycLevel > onboarding.kycLevel) {
        onboarding.setKycLevel(newKycLevel);
      }
    }

    const savedOnboarding = await this.onboardingRepository.save(onboarding);

    this.eventEmitter.emit('onboarding.document.verified', {
      onboardingId: savedOnboarding.id,
      documentType: dto.documentType,
      verified: dto.verified,
      verifiedBy,
      companyId,
    });

    return this.mapToResponseDto(savedOnboarding);
  }

  /**
   * Submit onboarding for verification
   */
  async submitOnboarding(
    onboardingId: string,
    companyId: string,
    dto: SubmitOnboardingDto,
  ): Promise<OnboardingResponseDto> {
    const onboarding = await this.findOnboardingByIdAndCompany(onboardingId, companyId);

    if (!onboarding.isPending) {
      throw new BadRequestException('Onboarding is not in a state that allows submission');
    }

    if (onboarding.isExpired) {
      throw new BadRequestException('Onboarding session has expired');
    }

    // Validate completion
    if (onboarding.progressPercentage < 100) {
      throw new BadRequestException('Onboarding is not complete');
    }

    if (dto.notes) {
      onboarding.notes = dto.notes;
    }

    if (!onboarding.submit()) {
      throw new BadRequestException('Unable to submit onboarding');
    }

    const savedOnboarding = await this.onboardingRepository.save(onboarding);

    this.eventEmitter.emit('onboarding.submitted', {
      onboardingId: savedOnboarding.id,
      companyId,
      agentId: onboarding.agentId,
    });

    return this.mapToResponseDto(savedOnboarding);
  }

  /**
   * Approve onboarding and optionally create customer and account
   */
  async approveOnboarding(
    onboardingId: string,
    companyId: string,
    dto: ApproveOnboardingDto,
    approvedBy: string,
  ): Promise<OnboardingResponseDto> {
    const onboarding = await this.findOnboardingByIdAndCompany(onboardingId, companyId);

    if (onboarding.status !== OnboardingStatus.PENDING_VERIFICATION) {
      throw new BadRequestException('Onboarding is not pending verification');
    }

    onboarding.approve(approvedBy, dto.notes);

    let customerId: string | undefined;

    if (dto.createAccount) {
      // Create customer record
      const customer = await this.createCustomerFromOnboarding(onboarding);
      customerId = customer.id;
      onboarding.customerId = customerId;

      // Create account if preferences are set
      if (onboarding.accountPreferences) {
        await this.createAccountFromPreferences(customer, onboarding.accountPreferences, onboarding.agentId);
      }
    }

    const savedOnboarding = await this.onboardingRepository.save(onboarding);

    this.eventEmitter.emit('onboarding.approved', {
      onboardingId: savedOnboarding.id,
      customerId,
      companyId,
      approvedBy,
    });

    return this.mapToResponseDto(savedOnboarding);
  }

  /**
   * Reject onboarding
   */
  async rejectOnboarding(
    onboardingId: string,
    companyId: string,
    dto: RejectOnboardingDto,
    rejectedBy: string,
  ): Promise<OnboardingResponseDto> {
    const onboarding = await this.findOnboardingByIdAndCompany(onboardingId, companyId);

    if (onboarding.status !== OnboardingStatus.PENDING_VERIFICATION) {
      throw new BadRequestException('Onboarding is not pending verification');
    }

    onboarding.reject(rejectedBy, dto.reason);

    if (dto.allowResubmission) {
      onboarding.metadata = {
        ...onboarding.metadata,
        allowResubmission: true,
        rejectionCount: (onboarding.metadata?.rejectionCount || 0) + 1,
      };
    }

    const savedOnboarding = await this.onboardingRepository.save(onboarding);

    this.eventEmitter.emit('onboarding.rejected', {
      onboardingId: savedOnboarding.id,
      reason: dto.reason,
      companyId,
      rejectedBy,
    });

    return this.mapToResponseDto(savedOnboarding);
  }

  /**
   * Get onboarding by ID
   */
  async getOnboarding(_onboardingId: any, companyId: string): Promise<OnboardingResponseDto> {
    const onboarding = await this.findOnboardingByIdAndCompany(onboardingId, companyId);
    return this.mapToResponseDto(onboarding);
  }

  /**
   * List onboardings with filtering and pagination
   */
  async listOnboardings(_companyId: any, query: OnboardingQueryDto): Promise<OnboardingListResponseDto> {
    const queryBuilder = this.onboardingRepository.createQueryBuilder('onboarding')
      .where('onboarding.companyId = :companyId', { companyId });

    // Apply filters
    if (query.status) {
      queryBuilder.andWhere('onboarding.status = :status', { status: query.status });
    }

    if (query.agentId) {
      queryBuilder.andWhere('onboarding.agentId = :agentId', { agentId: query.agentId });
    }

    if (query.currentStep) {
      queryBuilder.andWhere('onboarding.currentStep = :currentStep', { currentStep: query.currentStep });
    }

    if (query.dateFrom) {
      queryBuilder.andWhere('onboarding.createdAt >= :dateFrom', { dateFrom: query.dateFrom });
    }

    if (query.dateTo) {
      queryBuilder.andWhere('onboarding.createdAt <= :dateTo', { dateTo: query.dateTo });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(onboarding.agentName ILIKE :search OR onboarding.agentPhone ILIKE :search OR onboarding.customerData::text ILIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    if (query.expired !== undefined) {
      if (query.expired) {
        queryBuilder.andWhere('onboarding.expiresAt < NOW()');
      } else {
        queryBuilder.andWhere('onboarding.expiresAt >= NOW()');
      }
    }

    // Apply sorting
    queryBuilder.orderBy(`onboarding.${query.sortBy}`, query.sortOrder);

    // Apply pagination
    const limit = query.limit || 20;
    const page = query.page || 1;
    const offset = (page - 1) * limit;

    queryBuilder.skip(offset).take(limit);

    const [onboardings, total] = await queryBuilder.getManyAndCount();

    return {
      onboardings: onboardings.map(onboarding => this.mapToResponseDto(onboarding)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get onboarding statistics
   */
  async getOnboardingStats(_companyId: any, dateFrom?: string, dateTo?: string): Promise<OnboardingStatsResponseDto> {
    const queryBuilder = this.onboardingRepository.createQueryBuilder('onboarding')
      .where('onboarding.companyId = :companyId', { companyId });

    if (dateFrom) {
      queryBuilder.andWhere('onboarding.createdAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('onboarding.createdAt <= :dateTo', { dateTo });
    }

    const onboardings = await queryBuilder.getMany();

    const stats = {
      total: Object.values(onboardings).length,
      completed: onboardings.filter(o => o.status === OnboardingStatus.COMPLETED).length,
      pending: onboardings.filter(o => o.isPending).length,
      rejected: onboardings.filter(o => o.status === OnboardingStatus.REJECTED).length,
      abandoned: onboardings.filter(o => o.status === OnboardingStatus.ABANDONED).length,
      expired: onboardings.filter(o => o.status === OnboardingStatus.EXPIRED).length,
      completionRate: 0,
      averageCompletionTime: 0,
      averageRiskScore: 0,
      stepStats: {} as any,
      agentStats: [] as any[],
    };

    if (stats.total > 0) {
      stats.completionRate = (stats.completed / stats.total) * 100;
      
      const completedOnboardings = onboardings.filter(o => o.isCompleted);
      if (Object.values(completedOnboardings).length > 0) {
        stats.averageCompletionTime = Object.values(completedOnboardings).reduce((sum, o) => sum + (o.totalTimeMinutes || 0), 0) / Object.values(completedOnboardings).length;
        stats.averageRiskScore = Object.values(completedOnboardings).reduce((sum, o) => sum + o.riskScore, 0) / Object.values(completedOnboardings).length;
      }

      // Calculate step statistics
      const steps = OnboardingStep;
      stats.stepStats = Object.values(steps).reduce((acc, step) => {
        const stepOnboardings = onboardings.filter(o => o.completedSteps.includes(step));
        acc[step] = {
          started: onboardings.filter(o => o.currentStep === step || o.completedSteps.includes(step)).length,
          completed: Object.values(stepOnboardings).length,
          averageTimeMinutes: Object.values(stepOnboardings).length > 0 
            ? Object.values(stepOnboardings).reduce((sum, o) => sum + (o.stepDurations?.[step] || 0), 0) / Object.values(stepOnboardings).length
            : 0,
        };
        return acc;
      }, {} as any);

      // Calculate agent statistics
      const agentGroups = Object.values(onboardings).reduce((acc, o) => {
        if (!acc[o.agentId]) {
          acc[o.agentId] = {
            agentId: o.agentId,
            agentName: o.agentName,
            onboardings: [],
          };
        }
        acc[o.agentId].onboardings.push(o);
        return acc;
      }, {} as any);

      stats.agentStats = agentGroups.map((_group: any) => {
        const completed = group.onboardings.filter((_o: any) => o.isCompleted).length;
        return {
          agentId: group.agentId,
          agentName: group.agentName,
          total: Object.values(group.onboardings).length,
          completed,
          completionRate: (completed / Object.values(group.onboardings).length) * 100,
          averageTime: completed > 0 
            ? group.onboardings.filter((_o: any) => o.isCompleted).reduce((_sum: any, o: any) => sum + (o.totalTimeMinutes || 0), 0) / completed
            : 0,
        };
      });
    }

    return stats;
  }

  /**
   * Abandon onboarding
   */
  async abandonOnboarding(
    onboardingId: string,
    companyId: string,
    reason?: string,
  ): Promise<OnboardingResponseDto> {
    const onboarding = await this.findOnboardingByIdAndCompany(onboardingId, companyId);

    if (!onboarding.isPending) {
      throw new BadRequestException('Onboarding is not in a state that allows abandoning');
    }

    onboarding.abandon(reason);

    const savedOnboarding = await this.onboardingRepository.save(onboarding);

    this.eventEmitter.emit('onboarding.abandoned', {
      onboardingId: savedOnboarding.id,
      reason,
      companyId,
    });

    return this.mapToResponseDto(savedOnboarding);
  }

  /**
   * Process expired onboardings
   */
  async processExpiredOnboardings(): Promise<number> {
    const expiredOnboardings = await this.onboardingRepository.find({
      where: {
        status: In([OnboardingStatus.STARTED, OnboardingStatus.IN_PROGRESS, OnboardingStatus.PENDING_VERIFICATION]),
        expiresAt: Between(new Date(0), new Date()),
      },
    });

    let processedCount = 0;

    for (const onboarding of expiredOnboardings) {
      onboarding.expire();
      await this.onboardingRepository.save(onboarding);
      
      this.eventEmitter.emit('onboarding.expired', {
        onboardingId: onboarding.id,
        companyId: onboarding.companyId,
      });
      
      processedCount++;
    }

    if (processedCount > 0) {
      this.logger.log(`Processed ${processedCount} expired onboardings`);
    }

    return processedCount;
  }

  // Private helper methods

  private async findOnboardingByIdAndCompany(_id: any, companyId: string): Promise<CustomerOnboarding> {
    const onboarding = await this.onboardingRepository.findOne({
      where: { id, companyId },
    });

    if (!onboarding) {
      throw new NotFoundException('Onboarding record not found');
    }

    return onboarding;
  }

  private mapToResponseDto(_onboarding: any): OnboardingResponseDto {
    return {
      id: onboarding.id,
      onboardingNumber: onboarding.onboardingNumber,
      companyId: onboarding.companyId,
      customerId: onboarding.customerId,
      status: onboarding.status,
      currentStep: onboarding.currentStep,
      progressPercentage: onboarding.progressPercentage,
      completedSteps: onboarding.completedSteps,
      agent: {
        id: onboarding.agentId,
        name: onboarding.agentName,
        phone: onboarding.agentPhone,
      },
      timeRemaining: onboarding.timeRemaining,
      timeElapsed: onboarding.timeElapsed,
      isExpired: onboarding.isExpired,
      customerData: onboarding.customerData || {},
      accountPreferences: onboarding.accountPreferences || {},
      documents: onboarding.collectedDocuments.map(doc => ({
        type: doc.type,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        uploadedAt: doc.uploadedAt,
        verified: doc.verified,
        rejectionReason: doc.rejectionReason,
        url: doc.url,
      })),
      riskScore: onboarding.riskScore,
      kycLevel: onboarding.kycLevel,
      verificationRequired: onboarding.verificationRequired,
      verificationNotes: onboarding.verificationNotes,
      rejectionReason: onboarding.rejectionReason,
      createdAt: onboarding.createdAt.toISOString(),
      updatedAt: onboarding.updatedAt.toISOString(),
      completedAt: onboarding.completedAt?.toISOString(),
      expiresAt: onboarding.expiresAt.toISOString(),
    };
  }

  private calculateAge(_birthDate: any): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private calculatePersonalInfoRisk(_dto: any, age: number): { totalScore: number; factors: Array<{ factor: string; score: number; description: string }> } {
    const factors = [];
    let totalScore = 10; // Base risk score

    // Age factor
    if (age < 25) {
      factors.push({ factor: 'young_age', _score: any, description: 'Customer is under 25 years old' });
      totalScore += 5;
    } else if (age > 65) {
      factors.push({ factor: 'senior_age', _score: any, description: 'Customer is over 65 years old' });
      totalScore += 3;
    }

    // Business customer factor
    if (dto.isBusiness) {
      factors.push({ factor: 'business_customer', _score: any, description: 'Business customer requires enhanced due diligence' });
      totalScore += 10;
    }

    return { totalScore: Math.min(100, totalScore), factors };
  }

  private requiresAmlCheck(_identificationNumber: any, customerData: any): boolean {
    // Implement AML screening logic
    // For now, require AML check for all business customers and high-value individuals
    return customerData?.isBusiness || false;
  }

  private async uploadDocumentToStorage(_dto: any): Promise<string> {
    // TODO: Implement actual file upload to cloud storage (AWS S3, Google Cloud Storage, etc.)
    // For now, return a mock URL
    return `https://storage.sabs.com/documents/${Date.now()}-${dto.fileName}`;
  }

  private isAutoVerifiableDocument(_documentType: any): boolean {
    // Only auto-verify basic documents for Level 1 KYC
    return [DocumentType.PASSPORT_PHOTO, DocumentType.SIGNATURE].includes(documentType);
  }

  private calculateKycLevel(_verifiedDocuments: any): number {
    const hasIdDocument = verifiedDocuments.some(doc => 
      [DocumentType.IDENTIFICATION_FRONT, DocumentType.IDENTIFICATION_BACK].includes(doc)
    );
    
    const hasProofOfAddress = verifiedDocuments.includes(DocumentType.UTILITY_BILL);
    const hasProofOfIncome = verifiedDocuments.includes(DocumentType.PROOF_OF_INCOME);

    if (hasIdDocument && hasProofOfAddress && hasProofOfIncome) {
      return 3; // Full KYC
    } else if (hasIdDocument && hasProofOfAddress) {
      return 2; // Enhanced KYC
    } else if (hasIdDocument) {
      return 1; // Basic KYC
    }

    return 1;
  }

  private async createCustomerFromOnboarding(_onboarding: any): Promise<Customer> {
    const customerData = Customer.createBasicCustomer({
      companyId: onboarding.companyId,
      firstName: onboarding.customerData.firstName,
      lastName: onboarding.customerData.lastName,
      phoneNumber: onboarding.customerData.phoneNumber,
      dateOfBirth: new Date(onboarding.customerData.dateOfBirth),
      gender: onboarding.customerData.gender,
      addressLine1: onboarding.customerData.addressLine1,
      city: onboarding.customerData.city,
      region: onboarding.customerData.region,
      identificationType: onboarding.customerData.identificationType,
      identificationNumber: onboarding.customerData.identificationNumber,
      onboardedBy: onboarding.agentId,
    });

    // Apply additional data from onboarding
    Object.assign(customerData, {
      middleName: onboarding.customerData.middleName,
      email: onboarding.customerData.email,
      addressLine2: onboarding.customerData.addressLine2,
      postalCode: onboarding.customerData.postalCode,
      country: onboarding.customerData.country,
      identificationExpiry: onboarding.customerData.identificationExpiry 
        ? new Date(onboarding.customerData.identificationExpiry)
        : undefined,
      emergencyContactName: onboarding.customerData.emergencyContactName,
      emergencyContactPhone: onboarding.customerData.emergencyContactPhone,
      emergencyContactRelationship: onboarding.customerData.emergencyContactRelationship,
      isBusiness: onboarding.customerData.isBusiness,
      businessName: onboarding.customerData.businessName,
      businessRegistrationNumber: onboarding.customerData.businessRegistrationNumber,
      businessType: onboarding.customerData.businessType,
      kycLevel: onboarding.kycLevel,
      riskScore: onboarding.riskScore,
      onboardingLocation: onboarding.agentLocation,
      onboardingIp: onboarding.agentIp,
      preferredLanguage: onboarding.customerData.preferredLanguage,
      preferredCurrency: onboarding.customerData.preferredCurrency,
      smsNotifications: onboarding.customerData.smsNotifications,
      emailNotifications: onboarding.customerData.emailNotifications,
    });

    const customer = this.customerRepository.create(customerData);
    return await this.customerRepository.save(customer);
  }

  private async createAccountFromPreferences(_customer: any, preferences: any, _createdBy: any): Promise<void> {
    // This will be implemented in the accounts service
    // For now, we'll emit an event to handle account creation
    this.eventEmitter.emit('customer.account.create', {
      customerId: customer.id,
      companyId: customer.companyId,
      preferences,
      createdBy,
    });
  }
}