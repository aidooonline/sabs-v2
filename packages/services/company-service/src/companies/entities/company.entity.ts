import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '@sabs/database';

export enum CompanyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
}

export interface CompanySettings {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  features: {
    advancedAnalytics: boolean;
    bulkTransactions: boolean;
    customReports: boolean;
  };
  limits: {
    maxAgents: number;
    maxCustomers: number;
    dailyTransactionLimit: number;
  };
  branding: {
    logo?: string;
    primaryColor?: string;
    customDomain?: string;
  };
}

export interface CommissionRates {
  deposit: number;
  withdrawal: number;
  transfer?: number;
  billPayment?: number;
  loanDisbursement?: number;
}

@Entity('companies')
export class Company extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 3, default: 'GH' })
  countryCode: string;

  @Column({ type: 'varchar', length: 3, default: 'GHS' })
  currency: string;

  @Column({ type: 'varchar', length: 50, default: 'Africa/Accra' })
  timezone: string;

  @Column({
    type: 'enum',
    enum: CompanyStatus,
    default: CompanyStatus.TRIAL,
  })
  status: CompanyStatus;

  @Column({ type: 'jsonb', default: {} })
  settings: CompanySettings;

  @Column({ type: 'varchar', length: 50, default: 'basic' })
  subscriptionPlan: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  trialEndsAt?: Date;

  // Service Credits
  @Column({ type: 'integer', default: 0 })
  smsCredits: number;

  @Column({ type: 'integer', default: 0 })
  aiCredits: number;

  // Commission Settings
  @Column({ type: 'jsonb', default: { deposit: 0.02, withdrawal: 0.03 } })
  commissionRates: CommissionRates;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Computed properties
  get isActive(): boolean {
    return this.status === CompanyStatus.ACTIVE;
  }

  get isOnTrial(): boolean {
    return this.status === CompanyStatus.TRIAL && 
           this.trialEndsAt && 
           this.trialEndsAt > new Date();
  }

  get trialDaysRemaining(): number {
    if (!this.trialEndsAt) return 0;
    const now = new Date();
    const diffTime = this.trialEndsAt.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Business methods
  canUseService(serviceType: 'sms' | 'ai'): boolean {
    if (!this.isActive && !this.isOnTrial) return false;
    
    switch (serviceType) {
      case 'sms':
        return this.smsCredits > 0;
      case 'ai':
        return this.aiCredits > 0;
      default:
        return false;
    }
  }

  deductServiceCredit(serviceType: 'sms' | 'ai', amount: number = 1): boolean {
    if (!this.canUseService(serviceType)) return false;

    switch (serviceType) {
      case 'sms':
        if (this.smsCredits >= amount) {
          this.smsCredits -= amount;
          return true;
        }
        break;
      case 'ai':
        if (this.aiCredits >= amount) {
          this.aiCredits -= amount;
          return true;
        }
        break;
    }
    return false;
  }

  addServiceCredits(serviceType: 'sms' | 'ai', amount: number): void {
    switch (serviceType) {
      case 'sms':
        this.smsCredits += amount;
        break;
      case 'ai':
        this.aiCredits += amount;
        break;
    }
  }
}