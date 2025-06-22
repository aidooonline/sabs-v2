import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

@Entity('service_usage')
@Index(['companyId', 'serviceType', 'createdAt'])
@Index(['companyId', 'createdAt'])
@Index(['serviceType', 'createdAt'])
export class ServiceUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'varchar', length: 50, name: 'service_type' })
  serviceType: string; // 'sms', 'ai_query', 'transaction_processing', etc.

  @Column({ type: 'integer', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0.0000 })
  cost: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId?: string;

  @Column({ type: 'uuid', name: 'transaction_id', nullable: true })
  transactionId?: string;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;
}