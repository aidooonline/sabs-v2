import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum MfaType {
  TOTP = 'totp',
  SMS = 'sms',
  EMAIL = 'email',
}

@Entity('user_mfa')
@Index(['userId'])
export class UserMFA {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @Column({ name: 'is_enabled', default: false })
  isEnabled: boolean;

  @Column({ name: 'mfa_type', type: 'enum', enum: MfaType, default: MfaType.TOTP })
  mfaType: MfaType;

  @Column({ name: 'secret_key', length: 255, nullable: true })
  secretKey: string;

  @Column({ name: 'backup_codes', type: 'text', nullable: true })
  backupCodes: string; // JSON string of backup codes

  @Column({ name: 'phone_number', length: 20, nullable: true })
  phoneNumber: string;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @Column({ name: 'failed_attempts', default: 0 })
  failedAttempts: number;

  @Column({ name: 'locked_until', type: 'timestamp', nullable: true })
  lockedUntil: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => User, user => user.mfa)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Computed properties
  get isLocked(): boolean {
    return this.lockedUntil && new Date() < this.lockedUntil;
  }

  get parsedBackupCodes(): string[] {
    return this.backupCodes ? JSON.parse(this.backupCodes) : [];
  }

  // Business logic methods
  generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 8).toUpperCase());
    }
    this.backupCodes = JSON.stringify(codes);
    return codes;
  }

  useBackupCode(code: string): boolean {
    const codes = this.parsedBackupCodes;
    const index = codes.indexOf(code.toUpperCase());
    if (index !== -1) {
      codes.splice(index, 1);
      this.backupCodes = JSON.stringify(codes);
      return true;
    }
    return false;
  }
}