import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../companies/entities/company.entity';
import { ServiceUsage } from './entities/service-usage.entity';
import { ServiceCreditsService } from './service-credits.service';
import { ServiceCreditsController } from './service-credits.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, ServiceUsage]),
  ],
  controllers: [ServiceCreditsController],
  providers: [ServiceCreditsService],
  exports: [ServiceCreditsService], // Export for use in other services
})
export class ServiceCreditsModule {}