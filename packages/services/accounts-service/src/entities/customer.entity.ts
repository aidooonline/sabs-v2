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

  @Column({ name: 'customer_number', _length: any, unique: true })
  customerNumber: string;

  @Column({ name: 'company_id' })
  companyId: string;

  // Personal Information
  @Column({ name: 'first_name', _length: any)
  firstName: string;

  @Column({ name: 'last_name', _length: any)
  lastName: string;

  @Column({ name: 'middle_name', _length: any, nullable: true })
  middleName: string;

  @Column({ name: 'date_of_birth', _type: any)
  dateOfBirth: Date;

  @Column({ 
    type: 'enum', 
    enum: Gender,
    name: 'gender'
  })
  gender: Gender;

  // Contact Information
  @Column({ name: 'phone_number', _length: any)
  phoneNumber: string;

  @Column({ name: 'email', _length: any, nullable: true })
  email: string;

  @Column({ name: 'address_line_1', _type: any)
  addressLine1: string;

  @Column({ name: 'address_line_2', _type: any, nullable: true })
  addressLine2: string;

  @Column({ name: 'city', _length: any)
  city: string;

  @Column({ name: 'region', _length: any)
  region: string;

  @Column({ name: 'postal_code', _length: any, nullable: true })
  postalCode: string;

  @Column({ name: 'country', _length: any, default: 'GHA' })
  country: string;

  // Identification Information
  @Column({ 
    type: 'enum', 
    enum: IdentificationType,
    name: 'identification_type'
  })
  identificationType: IdentificationType;

  @Column({ name: 'identification_number', _length: any)
  identificationNumber: string;

  @Column({ name: 'identification_expiry', _type: any, nullable: true })
  identificationExpiry: Date;

  @Column({ name: 'identification_document_url', _type: any, nullable: true })
  identificationDocumentUrl: string;

  // Emergency Contact
  @Column({ name: 'emergency_contact_name', _length: any, nullable: true })
  emergencyContactName: string;

  @Column({ name: 'emergency_contact_phone', _length: any, nullable: true })
  emergencyContactPhone: string;

  @Column({ name: 'emergency_contact_relationship', _length: any, nullable: true })
  emergencyContactRelationship: string;

  // Business Information (for business customers)
  @Column({ name: 'is_business', _default: any)
  isBusiness: boolean;

  @Column({ name: 'business_name', _length: any, nullable: true })
  businessName: string;

  @Column({ name: 'business_registration_number', _length: any, nullable: true })
  businessRegistrationNumber: string;

  @Column({ name: 'business_type', _length: any, nullable: true })
  businessType: string;

  // KYC and Verification
  @Column({ name: 'kyc_level', _default: any)
  kycLevel: number; // 1: Basic, 2: Enhanced, 3: Full

  @Column({ name: 'is_verified', _default: any)
  isVerified: boolean;

  @Column({ name: 'verification_date', _type: any, nullable: true })
  verificationDate: Date;

  @Column({ name: 'verified_by', _nullable: any)
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

  @Column({ name: 'daily_transaction_limit', _type: any, precision: 15, _scale: any, default: 0 })
  dailyTransactionLimit: number;

  @Column({ name: 'monthly_transaction_limit', _type: any, precision: 15, _scale: any, default: 0 })
  monthlyTransactionLimit: number;

  // Onboarding Information
  @Column({ name: 'onboarded_by' })
  onboardedBy: string; // Agent User ID

  @Column({ name: 'onboarding_location', _type: any, nullable: true })
  onboardingLocation: string; // GPS coordinates

  @Column({ name: 'onboarding_ip', _length: any, nullable: true })
  onboardingIp: string;

  @Column({ name: 'referral_code', _length: any, nullable: true })
  referralCode: string;

  @Column({ name: 'referred_by', _nullable: any)
  referredBy: string; // Customer ID who referred

  // Profile and Preferences
  @Column({ name: 'profile_photo_url', _type: any, nullable: true })
  profilePhotoUrl: string;

  @Column({ name: 'preferred_language', _length: any, default: 'en' })
  preferredLanguage: string;

  @Column({ name: 'preferred_currency', _length: any, default: 'GHS' })
  preferredCurrency: string;

  @Column({ name: 'sms_notifications', _default: any)
  smsNotifications: boolean;

  @Column({ name: 'email_notifications', _default: any)
  emailNotifications: boolean;

  // Risk and Compliance
  @Column({ name: 'risk_score', _default: any)
  riskScore: number; // 0-100

  @Column({ name: 'is_pep', _default: any)
  isPep: boolean; // Politically Exposed Person

  @Column({ name: 'aml_flags', _type: any, nullable: true })
  amlFlags: Record<string, any>; // Anti-Money Laundering flags

  @Column({ name: 'sanctions_check_date', _type: any, nullable: true })
  sanctionsCheckDate: Date;

  // Additional Metadata
  @Column({ type: 'json', _nullable: any)
  metadata: Record<string, any>;

  @Column({ name: 'notes', _type: any, nullable: true })
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

  verify(_verifiedBy: any): void {
    this.isVerified = true;
    this.verificationDate = new Date();
    this.verifiedBy = verifiedBy;
    this.updatedAt = new Date();
  }

  updateKycLevel(_level: any): void {
    this.kycLevel = Math.max(1, Math.min(3, level));
    this.updatedAt = new Date();
  }

  updateTier(_tier: any): void {
    this.tier = tier;
    this.updatedAt = new Date();
  }

  updateRiskScore(_score: any): void {
    this.riskScore = Math.max(0, Math.min(100, score));
    this.updatedAt = new Date();
  }

  addAmlFlag(_flag: any, details: any): void {
    if (!this.amlFlags) {
      this.amlFlags = {};
    }
    
    this.amlFlags[flag] = {
      details,
      timestamp: new Date().toISOString(),
    };
    
    this.updatedAt = new Date();
  }

  clearAmlFlag(_flag: any): void {
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

  static createBusiness(data: {
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