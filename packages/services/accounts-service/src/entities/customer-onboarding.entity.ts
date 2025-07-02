import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, BeforeInsert } from 'typeorm';
import { Customer } from './customer.entity';
import { nanoid } from 'nanoid';

export enum OnboardingStatus {
  STARTED = 'started',
  IN_PROGRESS = 'in_progress',
  PENDING_VERIFICATION = 'pending_verification',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  ABANDONED = 'abandoned',
  EXPIRED = 'expired',
}

export enum OnboardingStep {
  PERSONAL_INFO = 'personal_info',
  CONTACT_INFO = 'contact_info',
  IDENTIFICATION = 'identification',
  ADDRESS_VERIFICATION = 'address_verification',
  DOCUMENT_UPLOAD = 'document_upload',
  BIOMETRIC_CAPTURE = 'biometric_capture',
  ACCOUNT_CREATION = 'account_creation',
  INITIAL_DEPOSIT = 'initial_deposit',
  VERIFICATION = 'verification',
  ACTIVATION = 'activation',
}

export enum OnboardingChannel {
  AGENT_MOBILE = 'agent_mobile',
  AGENT_TABLET = 'agent_tablet',
  BRANCH = 'branch',
  WEB = 'web',
  USSD = 'ussd',
  ATM = 'atm',
}

export enum DocumentType {
  IDENTIFICATION_FRONT = 'identification_front',
  IDENTIFICATION_BACK = 'identification_back',
  PASSPORT_PHOTO = 'passport_photo',
  SIGNATURE = 'signature',
  UTILITY_BILL = 'utility_bill',
  BUSINESS_REGISTRATION = 'business_registration',
  TAX_CERTIFICATE = 'tax_certificate',
  PROOF_OF_INCOME = 'proof_of_income',
}

@Entity('customer_onboarding')
@Index(['companyId', 'onboardingNumber'])
@Index(['companyId', 'customerId'])
@Index(['companyId', 'agentId'])
@Index(['companyId', 'status'])
@Index(['status', 'createdAt'])
@Index(['expiresAt'])
export class CustomerOnboarding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'onboarding_number', length: 20, unique: true })
  onboardingNumber: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'customer_id', nullable: true })
  customerId: string; // Null until customer is created

  // Onboarding Process Information
  @Column({ 
    type: 'enum', 
    enum: OnboardingStatus,
    name: 'status',
    default: OnboardingStatus.STARTED
  })
  status: OnboardingStatus;

  @Column({ 
    type: 'enum', 
    enum: OnboardingChannel,
    name: 'channel',
    default: OnboardingChannel.AGENT_MOBILE
  })
  channel: OnboardingChannel;

  @Column({ name: 'started_at', type: 'timestamp' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  // Agent Information
  @Column({ name: 'agent_id' })
  agentId: string; // User ID of the agent

  @Column({ name: 'agent_name', length: 200 })
  agentName: string;

  @Column({ name: 'agent_phone', length: 20 })
  agentPhone: string;

  @Column({ name: 'agent_location', type: 'point', nullable: true })
  agentLocation: string; // GPS coordinates

  @Column({ name: 'agent_ip', length: 45, nullable: true })
  agentIp: string;

  @Column({ name: 'agent_device_info', type: 'json', nullable: true })
  agentDeviceInfo: Record<string, any>;

  // Current Step and Progress
  @Column({ 
    type: 'enum', 
    enum: OnboardingStep,
    name: 'current_step',
    default: OnboardingStep.PERSONAL_INFO
  })
  currentStep: OnboardingStep;

  @Column({ name: 'completed_steps', type: 'json', default: '[]' })
  completedSteps: OnboardingStep[];

  @Column({ name: 'progress_percentage', default: 0 })
  progressPercentage: number; // 0-100

  // Customer Information (collected during onboarding)
  @Column({ name: 'customer_data', type: 'json', nullable: true })
  customerData: Record<string, any>;

  @Column({ name: 'account_preferences', type: 'json', nullable: true })
  accountPreferences: Record<string, any>;

  // Document Collection
  @Column({ name: 'collected_documents', type: 'json', default: '[]' })
  collectedDocuments: Array<{
    type: DocumentType;
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
    verified: boolean;
    rejectionReason?: string;
  }>;

  @Column({ name: 'biometric_data', type: 'json', nullable: true })
  biometricData: Record<string, any>;

  // Verification and Approval
  @Column({ name: 'verification_required', default: true })
  verificationRequired: boolean;

  @Column({ name: 'verified_by', nullable: true })
  verifiedBy: string; // User ID who verified

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ name: 'verification_notes', type: 'text', nullable: true })
  verificationNotes: string;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ name: 'rejected_by', nullable: true })
  rejectedBy: string; // User ID who rejected

  @Column({ name: 'rejected_at', type: 'timestamp', nullable: true })
  rejectedAt: Date;

  // Risk Assessment
  @Column({ name: 'risk_score', default: 0 })
  riskScore: number; // 0-100

  @Column({ name: 'risk_factors', type: 'json', nullable: true })
  riskFactors: Array<{
    factor: string;
    score: number;
    description: string;
  }>;

  @Column({ name: 'aml_check_required', default: false })
  amlCheckRequired: boolean;

  @Column({ name: 'aml_check_completed', default: false })
  amlCheckCompleted: boolean;

  @Column({ name: 'aml_check_result', nullable: true })
  amlCheckResult: string; // CLEAR, REVIEW, BLOCKED

  // Compliance and Audit
  @Column({ name: 'kyc_level', default: 1 })
  kycLevel: number; // 1: Basic, 2: Enhanced, 3: Full

  @Column({ name: 'compliance_flags', type: 'json', nullable: true })
  complianceFlags: Array<{
    flag: string;
    severity: string;
    description: string;
    raisedAt: string;
  }>;

  @Column({ name: 'audit_trail', type: 'json', default: '[]' })
  auditTrail: Array<{
    action: string;
    performedBy: string;
    performedAt: string;
    details: Record<string, any>;
    ipAddress: string;
    location?: string;
  }>;

  // Workflow and Automation
  @Column({ name: 'workflow_id', nullable: true })
  workflowId: string;

  @Column({ name: 'automation_rules', type: 'json', nullable: true })
  automationRules: Record<string, any>;

  @Column({ name: 'notifications_sent', type: 'json', default: '[]' })
  notificationsSent: Array<{
    type: string;
    recipient: string;
    sentAt: string;
    status: string;
  }>;

  // Quality Assurance
  @Column({ name: 'qa_required', default: false })
  qaRequired: boolean;

  @Column({ name: 'qa_completed', default: false })
  qaCompleted: boolean;

  @Column({ name: 'qa_score', nullable: true })
  qaScore: number; // 0-100

  @Column({ name: 'qa_notes', type: 'text', nullable: true })
  qaNotes: string;

  @Column({ name: 'qa_reviewed_by', nullable: true })
  qaReviewedBy: string;

  @Column({ name: 'qa_reviewed_at', type: 'timestamp', nullable: true })
  qaReviewedAt: Date;

  // Customer Feedback
  @Column({ name: 'customer_feedback', type: 'json', nullable: true })
  customerFeedback: {
    rating: number; // 1-5
    comments: string;
    submittedAt: string;
  };

  @Column({ name: 'agent_feedback', type: 'json', nullable: true })
  agentFeedback: {
    difficulty: number; // 1-5
    comments: string;
    submittedAt: string;
  };

  // Performance Metrics
  @Column({ name: 'total_time_minutes', nullable: true })
  totalTimeMinutes: number;

  @Column({ name: 'active_time_minutes', nullable: true })
  activeTimeMinutes: number;

  @Column({ name: 'idle_time_minutes', nullable: true })
  idleTimeMinutes: number;

  @Column({ name: 'step_durations', type: 'json', nullable: true })
  stepDurations: Record<OnboardingStep, number>;

  // Additional Metadata
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Customer, customer => customer.onboardingRecords, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  // Computed properties
  get isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  get isCompleted(): boolean {
    return this.status === OnboardingStatus.COMPLETED;
  }

  get isRejected(): boolean {
    return this.status === OnboardingStatus.REJECTED;
  }

  get isPending(): boolean {
    return [
      OnboardingStatus.STARTED,
      OnboardingStatus.IN_PROGRESS,
      OnboardingStatus.PENDING_VERIFICATION
    ].includes(this.status);
  }

  get timeElapsed(): number {
    const now = new Date();
    const started = new Date(this.startedAt);
    return Math.floor((now.getTime() - started.getTime()) / (1000 * 60)); // Minutes
  }

  get timeRemaining(): number {
    const now = new Date();
    const expires = new Date(this.expiresAt);
    return Math.max(0, Math.floor((expires.getTime() - now.getTime()) / (1000 * 60))); // Minutes
  }

  get documentsRequired(): DocumentType[] {
    const required = [DocumentType.IDENTIFICATION_FRONT, DocumentType.PASSPORT_PHOTO];
    
    if (this.customerData?.isBusiness) {
      required.push(DocumentType.BUSINESS_REGISTRATION);
    }
    
    if (this.kycLevel >= 2) {
      required.push(DocumentType.UTILITY_BILL, DocumentType.PROOF_OF_INCOME);
    }
    
    return required;
  }

  get documentsCompleted(): DocumentType[] {
    return this.collectedDocuments
      .filter(doc => doc.verified)
      .map(doc => doc.type);
  }

  get documentCompletionRate(): number {
    const required = this.documentsRequired.length;
    const completed = this.documentsCompleted.length;
    return required > 0 ? Math.round((completed / required) * 100) : 0;
  }

  get canProceedToNextStep(): boolean {
    switch (this.currentStep) {
      case OnboardingStep.PERSONAL_INFO:
        return this.customerData?.firstName && this.customerData?.lastName;
      case OnboardingStep.CONTACT_INFO:
        return this.customerData?.phoneNumber && this.customerData?.email;
      case OnboardingStep.IDENTIFICATION:
        return this.customerData?.identificationType && this.customerData?.identificationNumber;
      case OnboardingStep.DOCUMENT_UPLOAD:
        return this.documentCompletionRate >= 100;
      case OnboardingStep.VERIFICATION:
        return this.verificationRequired ? !!this.verifiedAt : true;
      default:
        return true;
    }
  }

  get nextStep(): OnboardingStep | null {
    const steps = OnboardingStep;
    const currentIndex = steps.indexOf(this.currentStep);
    return currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;
  }

  // Business logic methods
  start(agentId: string, agentName: string, agentPhone: string, location?: string): void {
    this.status = OnboardingStatus.STARTED;
    this.agentId = agentId;
    this.agentName = agentName;
    this.agentPhone = agentPhone;
    this.startedAt = new Date();
    this.agentLocation = location;
    
    // Set expiration to 7 days from now
    this.expiresAt = new Date();
    this.expiresAt.setDate(this.expiresAt.getDate() + 7);
    
    this.addAuditEntry('ONBOARDING_STARTED', agentId, { agentName, agentPhone });
  }

  updateProgress(): void {
    const totalSteps = Object.values(OnboardingStep).length;
    const completed = this.completedSteps.length;
    this.progressPercentage = Math.round((completed / totalSteps) * 100);
  }

  completeStep(step: OnboardingStep, data?: Record<string, any>): boolean {
    if (!this.completedSteps.includes(step)) {
      this.completedSteps.push(step);
    }
    
    if (data) {
      this.customerData = { ...this.customerData, ...data };
    }
    
    this.updateProgress();
    this.addAuditEntry('STEP_COMPLETED', this.agentId, { step, data });
    
    // Move to next step if possible
    if (this.canProceedToNextStep && this.nextStep) {
      this.currentStep = this.nextStep;
    }
    
    return true;
  }

  addDocument(doc: {
    type: DocumentType;
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }): void {
    this.collectedDocuments.push({
      ...doc,
      uploadedAt: new Date().toISOString(),
      verified: false,
    });
    
    this.addAuditEntry('DOCUMENT_UPLOADED', this.agentId, { documentType: doc.type });
  }

  verifyDocument(type: DocumentType, verified: boolean, rejectionReason?: string): void {
    const doc = this.collectedDocuments.find(d => d.type === type);
    if (doc) {
      doc.verified = verified;
      if (rejectionReason) {
        doc.rejectionReason = rejectionReason;
      }
      
      this.addAuditEntry('DOCUMENT_VERIFIED', this.verifiedBy || this.agentId, {
        documentType: type,
        verified,
        rejectionReason,
      });
    }
  }

  submit(): boolean {
    if (this.progressPercentage < 100) {
      return false;
    }
    
    this.status = OnboardingStatus.PENDING_VERIFICATION;
    this.addAuditEntry('ONBOARDING_SUBMITTED', this.agentId);
    
    return true;
  }

  approve(verifiedBy: string, notes?: string): void {
    this.status = OnboardingStatus.COMPLETED;
    this.verifiedBy = verifiedBy;
    this.verifiedAt = new Date();
    this.completedAt = new Date();
    this.verificationNotes = notes;
    
    this.addAuditEntry('ONBOARDING_APPROVED', verifiedBy, { notes });
  }

  reject(rejectedBy: string, reason: string): void {
    this.status = OnboardingStatus.REJECTED;
    this.rejectedBy = rejectedBy;
    this.rejectedAt = new Date();
    this.rejectionReason = reason;
    
    this.addAuditEntry('ONBOARDING_REJECTED', rejectedBy, { reason });
  }

  abandon(reason?: string): void {
    this.status = OnboardingStatus.ABANDONED;
    this.metadata = { ...this.metadata, abandonReason: reason };
    
    this.addAuditEntry('ONBOARDING_ABANDONED', this.agentId, { reason });
  }

  expire(): void {
    if (this.isExpired && this.isPending) {
      this.status = OnboardingStatus.EXPIRED;
      this.addAuditEntry('ONBOARDING_EXPIRED', 'SYSTEM');
    }
  }

  updateRiskScore(score: number, factors?: Array<{ factor: string; score: number; description: string }>): void {
    this.riskScore = Math.max(0, Math.min(100, score));
    if (factors) {
      this.riskFactors = factors;
    }
    
    this.addAuditEntry('RISK_SCORE_UPDATED', this.agentId, { score, factors });
  }

  addComplianceFlag(flag: string, severity: string, description: string): void {
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

  clearComplianceFlag(flag: string): void {
    if (this.complianceFlags) {
      this.complianceFlags = this.complianceFlags.filter(f => f.flag !== flag);
      this.addAuditEntry('COMPLIANCE_FLAG_CLEARED', this.agentId, { flag });
    }
  }

  addAuditEntry(action: string, performedBy: string, details?: Record<string, any>): void {
    this.auditTrail.push({
      action,
      performedBy,
      performedAt: new Date().toISOString(),
      details: details || {},
      ipAddress: this.agentIp || 'unknown',
      location: this.agentLocation,
    });
  }

  sendNotification(type: string, recipient: string): void {
    this.notificationsSent.push({
      type,
      recipient,
      sentAt: new Date().toISOString(),
      status: 'SENT',
    });
  }

  updateCustomerData(data: Record<string, any>): void {
    this.customerData = { ...this.customerData, ...data };
    this.addAuditEntry('CUSTOMER_DATA_UPDATED', this.agentId, { updatedFields: Object.keys(data) });
  }

  setKycLevel(level: number): void {
    this.kycLevel = Math.max(1, Math.min(3, level));
    this.addAuditEntry('KYC_LEVEL_UPDATED', this.agentId, { level });
  }

  requireAmlCheck(): void {
    this.amlCheckRequired = true;
    this.addAuditEntry('AML_CHECK_REQUIRED', this.agentId);
  }

  completeAmlCheck(result: string): void {
    this.amlCheckCompleted = true;
    this.amlCheckResult = result;
    this.addAuditEntry('AML_CHECK_COMPLETED', this.agentId, { result });
  }

  @BeforeInsert()
  generateOnboardingNumber(): void {
    if (!this.onboardingNumber) {
      // Generate onboarding number: ONB + 8 random characters
      this.onboardingNumber = 'ONB' + nanoid(8).toUpperCase();
    }
  }

  // Static factory methods
  static create(data: {
    companyId: string;
    agentId: string;
    agentName: string;
    agentPhone: string;
    channel?: OnboardingChannel;
    location?: string;
    ipAddress?: string;
  }): Partial<CustomerOnboarding> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to complete

    return {
      companyId: data.companyId,
      agentId: data.agentId,
      agentName: data.agentName,
      agentPhone: data.agentPhone,
      channel: data.channel || OnboardingChannel.AGENT_MOBILE,
      status: OnboardingStatus.STARTED,
      currentStep: OnboardingStep.PERSONAL_INFO,
      completedSteps: [],
      progressPercentage: 0,
      startedAt: new Date(),
      expiresAt,
      agentLocation: data.location,
      agentIp: data.ipAddress,
      riskScore: 10, // Low initial risk
      kycLevel: 1,
      verificationRequired: true,
      qaRequired: false,
      collectedDocuments: [],
      auditTrail: [],
      notificationsSent: [],
    };
  }
}