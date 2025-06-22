import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@sabs/database';
import { CompaniesModule } from './companies/companies.module';
import { ServiceCreditsModule } from './service-credits/service-credits.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    
    // Database connection
    DatabaseModule,
    
    // Feature modules
    CompaniesModule,
    ServiceCreditsModule,
    HealthModule,
  ],
})
export class AppModule {}