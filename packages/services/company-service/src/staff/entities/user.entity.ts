import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Company } from '../../companies/entities/company.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  COMPANY_ADMIN = 'company_admin',
  CLERK = 'clerk',
  FIELD_AGENT = 'field_agent',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export interface UserLocation {
  lat: number;
  lng: number;
  address?: string;
  lastUpdated: Date;
}

export interface AgentPerformance {
  monthlyTransactions: number;
  monthlyVolume: number;
  customerCount: number;
  commissionEarned: number;
  averageTransactionValue: number;
  lastActiveDate: Date;
}

@Entity('users')
@Index(['companyId'])
@Index(['email', 'companyId'], { unique: true })
@Index(['agentCode', 'companyId'], { unique: true })
@Index(['role'])
@Index(['status'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude()
  passwordHash: string;

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  lastName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  // Agent-specific fields
  @Column({ type: 'varchar', length: 20, name: 'agent_code', nullable: true })
  agentCode?: string;

  @Column({ type: 'jsonb', nullable: true })
  location?: UserLocation;

  // Authentication fields
  @Column({ type: 'timestamp with time zone', name: 'email_verified_at', nullable: true })
  emailVerifiedAt?: Date;

  @Column({ type: 'timestamp with time zone', name: 'last_login_at', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'integer', name: 'login_attempts', default: 0 })
  loginAttempts: number;

  @Column({ type: 'timestamp with time zone', name: 'locked_until', nullable: true })
  lockedUntil?: Date;

  // Metadata for additional information
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  // Computed properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  get isLocked(): boolean {
    return !!(this.lockedUntil && this.lockedUntil > new Date());
  }

  get isEmailVerified(): boolean {
    return !!this.emailVerifiedAt;
  }

  get isAgent(): boolean {
    return this.role === UserRole.FIELD_AGENT;
  }

  get isClerk(): boolean {
    return this.role === UserRole.CLERK;
  }

  get isCompanyAdmin(): boolean {
    return this.role === UserRole.COMPANY_ADMIN;
  }

  get displayRole(): string {
    const roleMap = {
      [UserRole.SUPER_ADMIN]: 'Super Admin',
      [UserRole.COMPANY_ADMIN]: 'Company Admin',
      [UserRole.CLERK]: 'Clerk',
      [UserRole.FIELD_AGENT]: 'Field Agent',
    };
    return roleMap[this.role];
  }

  // Business methods
  canManageStaff(): boolean {
    return this.role === UserRole.COMPANY_ADMIN || this.role === UserRole.SUPER_ADMIN;
  }

  canProcessTransactions(): boolean {
    return this.role === UserRole.FIELD_AGENT;
  }

  canApproveTransactions(): boolean {
    return this.role === UserRole.CLERK || this.role === UserRole.COMPANY_ADMIN;
  }

  hasAccessToCompany(companyId: string): boolean {
    if (this.role === UserRole.SUPER_ADMIN) return true;
    return this.companyId === companyId;
  }

  updateLocation(lat: number, lng: number, address?: string): void {
    this.location = {
      lat,
      lng,
      address,
      lastUpdated: new Date(),
    };
  }

  lockAccount(durationHours: number = 24): void {
    const lockUntil = new Date();
    lockUntil.setHours(lockUntil.getHours() + durationHours);
    this.lockedUntil = lockUntil;
  }

  unlockAccount(): void {
    this.lockedUntil = null;
    this.loginAttempts = 0;
  }

  incrementLoginAttempts(): void {
    this.loginAttempts += 1;
    
    // Auto-lock after 5 failed attempts
    if (this.loginAttempts >= 5) {
      this.lockAccount(24); // Lock for 24 hours
    }
  }

  resetLoginAttempts(): void {
    this.loginAttempts = 0;
    this.lastLoginAt = new Date();
  }

  // Lifecycle hooks
  @BeforeInsert()
  @BeforeUpdate()
  normalizeData() {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
    if (this.firstName) {
      this.firstName = this.firstName.trim();
    }
    if (this.lastName) {
      this.lastName = this.lastName.trim();
    }
  }

  @BeforeInsert()
  generateAgentCode() {
    if (this.role === UserRole.FIELD_AGENT && !this.agentCode) {
      // Generate agent code: AGT + random 6 digits
      this.agentCode = 'AGT' + Math.floor(100000 + Math.random() * 900000).toString();
    }
  }
}