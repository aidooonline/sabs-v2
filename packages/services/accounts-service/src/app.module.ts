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

// Services
import { CustomerOnboardingService } from './services/onboarding.service';

// Controllers
import { OnboardingController } from './controllers/onboarding.controller';

// Shared modules
import { DatabaseModule } from '@sabs/database';
import { CommonModule } from '@sabs/common';

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
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_NAME', 'sabs_accounts'),
        entities: [Customer, Account, CustomerOnboarding],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
        retryAttempts: 3,
        retryDelay: 3000,
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    TypeOrmModule.forFeature([
      Customer,
      Account,
      CustomerOnboarding,
    ]),

    // Event system for inter-service communication
    EventEmitterModule.forRoot({
      // Use this to emit events to other services
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // Caching for performance
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        store: 'redis',
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
        db: configService.get('REDIS_DB', 0),
        ttl: 300, // 5 minutes default TTL
        max: 1000, // Maximum number of items in cache
      }),
      inject: [ConfigService],
    }),

    // Background job processing
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_QUEUE_DB', 1),
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
      inject: [ConfigService],
    }),

    // Background queues for processing
    BullModule.registerQueue(
      {
        name: 'onboarding-processing',
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 25,
          attempts: 2,
        },
      },
      {
        name: 'document-processing',
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
        },
      },
      {
        name: 'customer-notifications',
        defaultJobOptions: {
          removeOnComplete: 200,
          removeOnFail: 50,
          attempts: 5,
        },
      },
    ),

    // Shared modules (when available)
    // DatabaseModule,
    // CommonModule,
  ],
  controllers: [
    OnboardingController,
  ],
  providers: [
    CustomerOnboardingService,
  ],
  exports: [
    CustomerOnboardingService,
    TypeOrmModule,
  ],
})
export class AppModule {
  constructor() {
    console.log('🏦 Accounts Service Module Initialized');
    console.log('📊 Features: Customer Onboarding, Account Management, KYC Processing');
  }
}