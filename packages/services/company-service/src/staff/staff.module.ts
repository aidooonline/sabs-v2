import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Company } from '../companies/entities/company.entity';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Company]),
  ],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService], // Export for use in other modules
})
export class StaffModule {}