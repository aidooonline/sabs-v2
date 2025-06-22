import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AuditAction {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGIN_BLOCKED = 'login_blocked',
  LOGOUT = 'logout',
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'password_reset_completed',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  MFA_VERIFIED = 'mfa_verified',
  MFA_FAILED = 'mfa_failed',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  SESSION_CREATED = 'session_created',
  SESSION_INVALIDATED = 'session_invalidated',
  DEVICE_REGISTERED = 'device_registered',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
}

export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('audit_logs')
@Index(['userId', 'action'])
@Index(['action', 'createdAt'])
@Index(['severity', 'createdAt'])
@Index(['ipAddress'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'action', type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ name: 'severity', type: 'enum', enum: AuditSeverity, default: AuditSeverity.LOW })
  severity: AuditSeverity;

  @Column({ name: 'ip_address', length: 45 })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ name: 'device_fingerprint', length: 255, nullable: true })
  deviceFingerprint: string;

  @Column({ name: 'location_country', length: 100, nullable: true })
  locationCountry: string;

  @Column({ name: 'location_city', length: 100, nullable: true })
  locationCity: string;

  @Column({ name: 'details', type: 'text', nullable: true })
  details: string;

  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'success', default: true })
  success: boolean;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
}