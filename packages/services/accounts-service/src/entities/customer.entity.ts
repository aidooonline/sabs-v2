import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, Index, BeforeInsert } from 'typeorm';
import { Account } from './account.entity';
import { CustomerOnboarding } from './customer-onboarding.entity';
import { nanoid } from 'nanoid';

export enum CustomerStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  BLOCKED = 'blocked',
}

export enum CustomerTier {
  BASIC = 'basic',
  SILVER = 'silver',
  GOLD = 'gold',
  PREMIUM = 'premium',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum IdentificationType {
  NATIONAL_ID = 'national_id',
  PASSPORT = 'passport',
  DRIVERS_LICENSE = 'drivers_license',
  VOTER_ID = 'voter_id',
  BIRTH_CERTIFICATE = 'birth_certificate',
}

@Entity('customers')
@Index(['companyId', 'customerNumber'])
@Index(['companyId', 'phoneNumber'])
@Index(['companyId', 'email'])
@Index(['companyId', 'identificationNumber'])
@Index(['onboardedBy'])
@Index(['status'])
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_number', length: 20, unique: true })
  customerNumber: string;

  @Column({ name: 'company_id' })
  companyId: string;

  // Personal Information
  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ name: 'middle_name', length: 100, nullable: true })
  middleName: string;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: Date;

  @Column({ 
    type: 'enum', 
    enum: Gender,
    name: 'gender'
  })
  gender: Gender;

  // Contact Information
  @Column({ name: 'phone_number', length: 20 })
  phoneNumber: string;

  @Column({ name: 'email', length: 255, nullable: true })
  email: string;

  @Column({ name: 'address_line_1', type: 'text' })
  addressLine1: string;

  @Column({ name: 'address_line_2', type: 'text', nullable: true })
  addressLine2: string;

  @Column({ name: 'city', length: 100 })
  city: string;

  @Column({ name: 'region', length: 100 })
  region: string;

  @Column({ name: 'postal_code', length: 20, nullable: true })
  postalCode: string;

  @Column({ name: 'country', length: 3, default: 'GHA' })
  country: string;

  // Identification Information
  @Column({ 
    type: 'enum', 
    enum: IdentificationType,
    name: 'identification_type'
  })
  identificationType: IdentificationType;

  @Column({ name: 'identification_number', length: 50 })
  identificationNumber: string;

  @Column({ name: 'identification_expiry', type: 'date', nullable: true })
  identificationExpiry: Date;

  @Column({ name: 'identification_document_url', type: 'text', nullable: true })
  identificationDocumentUrl: string;

  // Emergency Contact
  @Column({ name: 'emergency_contact_name', length: 200, nullable: true })
  emergencyContactName: string;

  @Column({ name: 'emergency_contact_phone', length: 20, nullable: true })
  emergencyContactPhone: string;

  @Column({ name: 'emergency_contact_relationship', length: 50, nullable: true })
  emergencyContactRelationship: string;

  // Business Information (for business customers)
  @Column({ name: 'is_business', default: false })
  isBusiness: boolean;

  @Column({ name: 'business_name', length: 200, nullable: true })
  businessName: string;

  @Column({ name: 'business_registration_number', length: 50, nullable: true })
  businessRegistrationNumber: string;

  @Column({ name: 'business_type', length: 100, nullable: true })
  businessType: string;

  // KYC and Verification
  @Column({ name: 'kyc_level', default: 1 })
  kycLevel: number; // 1: Basic, 2: Enhanced, 3: Full

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'verification_date', type: 'timestamp', nullable: true })
  verificationDate: Date;

  @Column({ name: 'verified_by', nullable: true })
  verifiedBy: string; // User ID who verified

  // Account Status and Limits
  @Column({ 
    type: 'enum', 
    enum: CustomerStatus,
    name: 'status',
    default: CustomerStatus.PENDING
  })
  status: CustomerStatus;

  @Column({ 
    type: 'enum', 
    enum: CustomerTier,
    name: 'tier',
    default: CustomerTier.BASIC
  })
  tier: CustomerTier;

  @Column({ name: 'daily_transaction_limit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  dailyTransactionLimit: number;

  @Column({ name: 'monthly_transaction_limit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  monthlyTransactionLimit: number;

  // Onboarding Information
  @Column({ name: 'onboarded_by' })
  onboardedBy: string; // Agent User ID

  @Column({ name: 'onboarding_location', type: 'point', nullable: true })
  onboardingLocation: string; // GPS coordinates

  @Column({ name: 'onboarding_ip', length: 45, nullable: true })
  onboardingIp: string;

  @Column({ name: 'referral_code', length: 20, nullable: true })
  referralCode: string;

  @Column({ name: 'referred_by', nullable: true })
  referredBy: string; // Customer ID who referred

  // Profile and Preferences
  @Column({ name: 'profile_photo_url', type: 'text', nullable: true })
  profilePhotoUrl: string;

  @Column({ name: 'preferred_language', length: 10, default: 'en' })
  preferredLanguage: string;

  @Column({ name: 'preferred_currency', length: 3, default: 'GHS' })
  preferredCurrency: string;

  @Column({ name: 'sms_notifications', default: true })
  smsNotifications: boolean;

  @Column({ name: 'email_notifications', default: false })
  emailNotifications: boolean;

  // Risk and Compliance
  @Column({ name: 'risk_score', default: 0 })
  riskScore: number; // 0-100

  @Column({ name: 'is_pep', default: false })
  isPep: boolean; // Politically Exposed Person

  @Column({ name: 'aml_flags', type: 'json', nullable: true })
  amlFlags: Record<string, any>; // Anti-Money Laundering flags

  @Column({ name: 'sanctions_check_date', type: 'timestamp', nullable: true })
  sanctionsCheckDate: Date;

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
  @OneToMany(() => Account, account => account.customer)
  accounts: Account[];

  @OneToMany(() => CustomerOnboarding, onboarding => onboarding.customer)
  onboardingRecords: CustomerOnboarding[];

  // Computed properties
  get fullName(): string {
    return `${this.firstName} ${this.middleName ? this.middleName + ' ' : ''}${this.lastName}`;
  }

  get age(): number {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  get isActive(): boolean {
    return this.status === CustomerStatus.ACTIVE;
  }

  get isMinor(): boolean {
    return this.age < 18;
  }

  get hasValidIdentification(): boolean {
    if (!this.identificationExpiry) return true;
    return new Date() < this.identificationExpiry;
  }

  get fullAddress(): string {
    const parts = [
      this.addressLine1,
      this.addressLine2,
      this.city,
      this.region,
      this.postalCode,
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  get canTransact(): boolean {
    return this.isActive && this.isVerified && this.hasValidIdentification;
  }

  // Business logic methods
  activate(): void {
    this.status = CustomerStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.status = CustomerStatus.INACTIVE;
    this.updatedAt = new Date();
  }

  suspend(reason?: string): void {
    this.status = CustomerStatus.SUSPENDED;
    this.updatedAt = new Date();
    
    if (reason) {
      this.metadata = { ...this.metadata, suspensionReason: reason };
    }
  }

  block(reason?: string): void {
    this.status = CustomerStatus.BLOCKED;
    this.updatedAt = new Date();
    
    if (reason) {
      this.metadata = { ...this.metadata, blockReason: reason };
    }
  }

  verify(verifiedBy: string): void {
    this.isVerified = true;
    this.verificationDate = new Date();
    this.verifiedBy = verifiedBy;
    this.updatedAt = new Date();
  }

  updateKycLevel(level: number): void {
    this.kycLevel = Math.max(1, Math.min(3, level));
    this.updatedAt = new Date();
  }

  updateTier(tier: CustomerTier): void {
    this.tier = tier;
    this.updatedAt = new Date();
  }

  updateRiskScore(score: number): void {
    this.riskScore = Math.max(0, Math.min(100, score));
    this.updatedAt = new Date();
  }

  addAmlFlag(flag: string, details: any): void {
    if (!this.amlFlags) {
      this.amlFlags = {};
    }
    
    this.amlFlags[flag] = {
      details,
      timestamp: new Date().toISOString(),
    };
    
    this.updatedAt = new Date();
  }

  clearAmlFlag(flag: string): void {
    if (this.amlFlags && this.amlFlags[flag]) {
      delete this.amlFlags[flag];
      this.updatedAt = new Date();
    }
  }

  updateContactInfo(phone?: string, email?: string, address?: Partial<{
    line1: string;
    line2: string;
    city: string;
    region: string;
    postalCode: string;
  }>): void {
    if (phone) this.phoneNumber = phone;
    if (email) this.email = email;
    
    if (address) {
      if (address.line1) this.addressLine1 = address.line1;
      if (address.line2) this.addressLine2 = address.line2;
      if (address.city) this.city = address.city;
      if (address.region) this.region = address.region;
      if (address.postalCode) this.postalCode = address.postalCode;
    }
    
    this.updatedAt = new Date();
  }

  @BeforeInsert()
  generateCustomerNumber(): void {
    if (!this.customerNumber) {
      // Generate customer number: CUST + 8 random characters
      this.customerNumber = 'CUST' + nanoid(8).toUpperCase();
    }
  }

  // Static factory methods
  static createBasicCustomer(data: {
    companyId: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    dateOfBirth: Date;
    gender: Gender;
    addressLine1: string;
    city: string;
    region: string;
    identificationType: IdentificationType;
    identificationNumber: string;
    onboardedBy: string;
  }): Partial<Customer> {
    return {
      ...data,
      status: CustomerStatus.PENDING,
      tier: CustomerTier.BASIC,
      kycLevel: 1,
      isVerified: false,
      country: 'GHA',
      preferredLanguage: 'en',
      preferredCurrency: 'GHS',
      riskScore: 10, // Low initial risk
      smsNotifications: true,
      emailNotifications: false,
    };
  }

  static createBusinessCustomer(data: {
    companyId: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    dateOfBirth: Date;
    gender: Gender;
    addressLine1: string;
    city: string;
    region: string;
    identificationType: IdentificationType;
    identificationNumber: string;
    businessName: string;
    businessRegistrationNumber: string;
    businessType: string;
    onboardedBy: string;
  }): Partial<Customer> {
    return {
      ...Customer.createBasicCustomer(data),
      isBusiness: true,
      businessName: data.businessName,
      businessRegistrationNumber: data.businessRegistrationNumber,
      businessType: data.businessType,
      kycLevel: 2, // Business customers start with enhanced KYC
      riskScore: 20, // Slightly higher initial risk for business
    };
  }
}