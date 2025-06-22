import { 
  Entity, 
  Column, 
  Index,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';
import { BaseEntity } from '@sabs/database';
import { UserRole } from '@sabs/common';
import { Exclude } from 'class-transformer';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['companyId'])
@Index(['resetToken'])
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude() // Exclude password from serialization
  password: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ 
    type: 'enum', 
    enum: UserRole,
    default: UserRole.FIELD_AGENT 
  })
  role: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'varchar', length: 64, nullable: true })
  @Exclude()
  resetToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  @Exclude()
  resetTokenExpiry?: Date;

  @Column({ type: 'varchar', length: 64, nullable: true })
  @Exclude()
  emailVerificationToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  lastLoginIp?: string;

  @Column({ type: 'int', default: 0 })
  loginAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedUntil?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Virtual property for full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Check if account is locked
  get isLocked(): boolean {
    return !!(this.lockedUntil && this.lockedUntil > new Date());
  }

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail() {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  normalizeName() {
    if (this.firstName) {
      this.firstName = this.firstName.trim();
    }
    if (this.lastName) {
      this.lastName = this.lastName.trim();
    }
  }
}