import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_sessions')
@Index(['userId', 'isActive'])
@Index(['refreshToken'])
@Index(['deviceFingerprint'])
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'refresh_token', length: 500 })
  refreshToken: string;

  @Column({ name: 'access_token', length: 500 })
  accessToken: string;

  @Column({ name: 'device_fingerprint', length: 255 })
  deviceFingerprint: string;

  @Column({ name: 'device_name', length: 255, nullable: true })
  deviceName: string;

  @Column({ name: 'device_type', length: 50, nullable: true })
  deviceType: string; // mobile, desktop, tablet

  @Column({ name: 'browser_info', type: 'text', nullable: true })
  browserInfo: string;

  @Column({ name: 'ip_address', length: 45 })
  ipAddress: string;

  @Column({ name: 'location_country', length: 100, nullable: true })
  locationCountry: string;

  @Column({ name: 'location_city', length: 100, nullable: true })
  locationCity: string;

  @Column({ name: 'location_coordinates', length: 100, nullable: true })
  locationCoordinates: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_suspicious', default: false })
  isSuspicious: boolean;

  @Column({ name: 'last_activity', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastActivity: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, user => user.sessions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Computed properties
  get isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  get isValid(): boolean {
    return this.isActive && !this.isExpired && !this.isSuspicious;
  }
}