import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Entities
import { Customer } from './entities/customer.entity';
import { Account } from './entities/account.entity';
import { CustomerOnboarding } from './entities/customer-onboarding.entity';
import { Transaction } from './entities/transaction.entity';
import { ApprovalWorkflow } from './entities/approval-workflow.entity';

// Services
import { CustomerOnboardingService } from './services/onboarding.service';
import { TransactionService } from './services/transaction.service';
import { ApprovalService } from './services/approval.service';
import { TransactionProcessingService } from './services/transaction-processing.service';
import { TransactionHistoryService } from './services/transaction-history.service';
import { NotificationService } from './services/notification.service';
import { AuditComplianceService } from './services/audit-compliance.service';

// Controllers
import { OnboardingController } from './controllers/onboarding.controller';
import { TransactionController } from './controllers/transaction.controller';
import { ApprovalController } from './controllers/approval.controller';
import { TransactionProcessingController } from './controllers/transaction-processing.controller';
import { TransactionHistoryController } from './controllers/transaction-history.controller';
import { NotificationController } from './controllers/notification.controller';
import { AuditComplianceController } from './controllers/audit-compliance.controller';

// Shared modules
import { DatabaseModule } from '@sabs/database';


@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_NAME', 'sabs_accounts'),
        entities: [Customer, Account, CustomerOnboarding, Transaction, ApprovalWorkflow],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
        migrations: ['dist/migrations/*{.ts,.js}'],
        migrationsRun: true,
        // Connection pooling for performance
        extra: {
          max: 20,
          min: 5,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        },
      }),
    }),

    // Feature modules
    TypeOrmModule.forFeature([
      Customer,
      Account,
      CustomerOnboarding,
      Transaction,
      ApprovalWorkflow,
    ]),

    // Event system for inter-service communication
    EventEmitterModule.forRoot({
      // Use this to emit events to other services
      wildcard: true,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),

    // Caching for performance
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: 'redis',
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
        db: configService.get('REDIS_DB', 0),
        ttl: 300, // 5 minutes default TTL
        max: 1000, // Maximum number of items in cache
      }),
    }),

    // Background job processing
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB', 1), // Use different DB for queues
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      }),
    }),

    // Background queues for processing
    BullModule.registerQueue(
      { name: 'onboarding' },
      { name: 'transactions' },
      { name: 'notifications' },
      { name: 'compliance' },
      { name: 'approvals' },
      { name: 'processing' },
    ),

    // Shared modules (when available)
    // DatabaseModule,
    // CommonModule,
  ],
  controllers: [
    OnboardingController,
    TransactionController,
    ApprovalController,
    TransactionProcessingController,
    TransactionHistoryController,
    NotificationController,
    AuditComplianceController,
  ],
  providers: [
    CustomerOnboardingService,
    TransactionService,
    ApprovalService,
    TransactionProcessingService,
    TransactionHistoryService,
    NotificationService,
    AuditComplianceService,
  ],
  exports: [
    CustomerOnboardingService,
    TransactionService,
    ApprovalService,
    TransactionProcessingService,
    TransactionHistoryService,
    NotificationService,
    AuditComplianceService,
    TypeOrmModule,
  ],
})
export class AppModule {
  constructor() {
    console.log('🏦 Accounts Service Module Initialized');
    console.log('📊 Features: Customer Onboarding, Account Management, KYC Processing');
    console.log('📱 Communication: Multi-channel Notifications, Template Management, Real-time Alerts');
    console.log('🔍 Compliance: Comprehensive Audit Trails, Regulatory Compliance, Risk Assessment');
  }
}