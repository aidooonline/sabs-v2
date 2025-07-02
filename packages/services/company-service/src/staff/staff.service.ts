import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, In, Between, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { Company } from '../companies/entities/company.entity';
import {
  CreateStaffDto,
  UpdateStaffDto,
  StaffFilterDto,
  StaffOnboardingDto,
  LocationUpdateDto,
  BulkStaffOperationDto,
  StaffStatsDto,
  StaffPerformanceDto,
  PasswordResetDto,
} from './dto/staff.dto';

export interface PaginatedStaffResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  // Staff CRUD Operations
  async createStaff(
    companyId: string,
    createStaffDto: CreateStaffDto,
    createdBy: string,
  ): Promise<User> {
    this.logger.log(`Creating new staff member for company ${companyId}`);

    // Verify company exists and is active
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    if (!company.isActive) {
      throw new BadRequestException('Cannot add staff to inactive company');
    }

    // Check if email already exists within the company
    const existingUser = await this.userRepository.findOne({
      where: { 
        email: createStaffDto.email,
        companyId: companyId,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists within this company');
    }

    // Check if agent code already exists (if provided)
    if (createStaffDto.agentCode) {
      const existingAgent = await this.userRepository.findOne({
        where: {
          agentCode: createStaffDto.agentCode,
          companyId: companyId,
        },
      });

      if (existingAgent) {
        throw new ConflictException('Agent code already exists within this company');
      }
    }

    // Generate temporary password
    const temporaryPassword = this.generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    // Create the staff member
    const staff = this.userRepository.create({
      ...createStaffDto,
      companyId,
      passwordHash,
      status: UserStatus.PENDING,
      location: createStaffDto.location ? {
        ...createStaffDto.location,
        lastUpdated: new Date(),
      } : undefined,
    });

    const savedStaff = await this.userRepository.save(staff);

    // Log the action
    this.logger.log(
      `Staff member created: ${savedStaff.id} (${savedStaff.email}) by ${createdBy}`
    );

    // TODO: Send welcome email if requested
    if (createStaffDto.sendWelcomeEmail) {
      await this.sendWelcomeEmail(savedStaff, temporaryPassword);
    }

    return savedStaff;
  }

  async findAllStaff(
    companyId: string,
    filters: StaffFilterDto = {},
  ): Promise<PaginatedStaffResponse<User>> {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      status,
      agentCode,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    const skip = (page - 1) * limit;

    // Build query conditions
    const where: FindOptionsWhere<User> = {
      companyId,
      // Exclude super admins and company admins from staff list
      role: role || In([UserRole.FIELD_AGENT, UserRole.CLERK]),
    };

    if (status) {
      where.status = status;
    }

    if (agentCode) {
      where.agentCode = Like(`%${agentCode}%`);
    }

    let queryBuilder = this.userRepository.createQueryBuilder('user')
      .where(where);

    // Add search functionality
    if (search) {
      queryBuilder = queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply sorting and pagination
    queryBuilder = queryBuilder
      .orderBy(`user.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit);

    const [staff, total] = await queryBuilder.getManyAndCount();

    return {
      data: staff,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findStaffById(companyId: string, staffId: string): Promise<User> {
    const staff = await this.userRepository.findOne({
      where: { 
        id: staffId,
        companyId,
        role: In([UserRole.FIELD_AGENT, UserRole.CLERK]),
      },
      relations: ['company'],
    });

    if (!staff) {
      throw new NotFoundException(`Staff member with ID ${staffId} not found`);
    }

    return staff;
  }

  async updateStaff(
    companyId: string,
    staffId: string,
    updateStaffDto: UpdateStaffDto,
    updatedBy: string,
  ): Promise<User> {
    this.logger.log(`Updating staff member ${staffId} for company ${companyId}`);

    const staff = await this.findStaffById(companyId, staffId);

    // Check if email is being changed and validate uniqueness
    if (updateStaffDto.email && updateStaffDto.email !== staff.email) {
      const existingUser = await this.userRepository.findOne({
        where: { 
          email: updateStaffDto.email,
          companyId,
          id: Not(staffId),
        },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists within this company');
      }
    }

    // Check agent code uniqueness if being changed
    if (updateStaffDto.agentCode && updateStaffDto.agentCode !== staff.agentCode) {
      const existingAgent = await this.userRepository.findOne({
        where: {
          agentCode: updateStaffDto.agentCode,
          companyId,
          id: Not(staffId),
        },
      });

      if (existingAgent) {
        throw new ConflictException('Agent code already exists within this company');
      }
    }

    // Update location with timestamp if provided
    if (updateStaffDto.location) {
      updateStaffDto.location = {
        ...updateStaffDto.location,
        lastUpdated: new Date(),
      } as any;
    }

    Object.assign(staff, updateStaffDto);
    const updatedStaff = await this.userRepository.save(staff);

    this.logger.log(`Staff member updated: ${staffId} by ${updatedBy}`);

    return updatedStaff;
  }

  async deleteStaff(
    companyId: string,
    staffId: string,
    deletedBy: string,
    reason?: string,
  ): Promise<void> {
    this.logger.log(`Deactivating staff member ${staffId} for company ${companyId}`);

    const staff = await this.findStaffById(companyId, staffId);

    // Soft delete by changing status to inactive
    staff.status = UserStatus.INACTIVE;
    await this.userRepository.save(staff);

    this.logger.log(
      `Staff member deactivated: ${staffId} by ${deletedBy}. Reason: ${reason || 'Not specified'}`
    );
  }

  // Staff Performance and Analytics
  async getStaffStats(companyId: string): Promise<StaffStatsDto> {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const [
      totalStaff,
      activeStaff,
      fieldAgents,
      clerks,
      pendingStaff,
      suspendedStaff,
      newHiresThisMonth,
    ] = await Promise.all([
      this.userRepository.count({
        where: { 
          companyId,
          role: In([UserRole.FIELD_AGENT, UserRole.CLERK]),
        },
      }),
      this.userRepository.count({
        where: { 
          companyId,
          role: In([UserRole.FIELD_AGENT, UserRole.CLERK]),
          status: UserStatus.ACTIVE,
        },
      }),
      this.userRepository.count({
        where: { companyId, role: UserRole.FIELD_AGENT },
      }),
      this.userRepository.count({
        where: { companyId, role: UserRole.CLERK },
      }),
      this.userRepository.count({
        where: { 
          companyId,
          role: In([UserRole.FIELD_AGENT, UserRole.CLERK]),
          status: UserStatus.PENDING,
        },
      }),
      this.userRepository.count({
        where: { 
          companyId,
          role: In([UserRole.FIELD_AGENT, UserRole.CLERK]),
          status: UserStatus.SUSPENDED,
        },
      }),
      this.userRepository.count({
        where: { 
          companyId,
          role: In([UserRole.FIELD_AGENT, UserRole.CLERK]),
          createdAt: Between(currentMonth, new Date()),
        },
      }),
    ]);

    // TODO: Calculate average performance score from transaction data
    const averagePerformanceScore = 75; // Placeholder

    // TODO: Get top performer from transaction data
    const topPerformer = undefined; // Placeholder

    return {
      totalStaff,
      activeStaff,
      fieldAgents,
      clerks,
      pendingStaff,
      suspendedStaff,
      newHiresThisMonth,
      averagePerformanceScore,
      topPerformer,
    };
  }

  async getStaffPerformance(
    companyId: string,
    staffId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<StaffPerformanceDto> {
    const staff = await this.findStaffById(companyId, staffId);

    // TODO: Calculate performance metrics from transaction data
    // This would typically involve joins with transactions table
    const performance: StaffPerformanceDto = {
      staffId: staff.id,
      staffName: staff.fullName,
      role: staff.role,
      monthlyTransactions: 0, // COUNT transactions
      monthlyVolume: 0, // SUM transaction amounts
      customerCount: 0, // COUNT DISTINCT customers
      commissionEarned: 0, // SUM commissions
      averageTransactionValue: 0, // AVG transaction amount
      lastActiveDate: staff.lastLoginAt || staff.createdAt,
      performanceScore: 75, // Calculated based on various metrics
      ranking: 1, // Ranking within company
    };

    return performance;
  }

  // Staff Onboarding and Account Management
  async onboardStaff(
    companyId: string,
    onboardingDto: StaffOnboardingDto,
    onboardedBy: string,
  ): Promise<User> {
    this.logger.log(`Onboarding staff member ${onboardingDto.staffId}`);

    const staff = await this.findStaffById(companyId, onboardingDto.staffId);

    if (staff.status !== UserStatus.PENDING) {
      throw new BadRequestException('Staff member is not in pending status');
    }

    // Hash the temporary password
    const passwordHash = await bcrypt.hash(onboardingDto.temporaryPassword, 12);

    // Update staff status and password
    staff.passwordHash = passwordHash;
    staff.status = UserStatus.ACTIVE;
    staff.metadata = {
      ...staff.metadata,
      forcePasswordChange: onboardingDto.forcePasswordChange,
      onboardedBy,
      onboardedAt: new Date().toISOString(),
    };

    const updatedStaff = await this.userRepository.save(staff);

    // TODO: Send onboarding email if requested
    if (onboardingDto.sendOnboardingEmail) {
      await this.sendOnboardingEmail(
        updatedStaff,
        onboardingDto.temporaryPassword,
        onboardingDto.customMessage,
      );
    }

    this.logger.log(`Staff member onboarded: ${staff.id} by ${onboardedBy}`);

    return updatedStaff;
  }

  async resetPassword(
    companyId: string,
    resetDto: PasswordResetDto,
    resetBy: string,
  ): Promise<void> {
    this.logger.log(`Resetting password for staff member ${resetDto.staffId}`);

    const staff = await this.findStaffById(companyId, resetDto.staffId);

    // Generate new temporary password
    const newPassword = this.generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password and set force change flag
    staff.passwordHash = passwordHash;
    staff.metadata = {
      ...staff.metadata,
      forcePasswordChange: true,
      passwordResetBy: resetBy,
      passwordResetAt: new Date().toISOString(),
    };

    await this.userRepository.save(staff);

    // TODO: Send password reset email if requested
    if (resetDto.sendEmail) {
      await this.sendPasswordResetEmail(
        staff,
        newPassword,
        resetDto.customMessage,
      );
    }

    this.logger.log(`Password reset for staff member: ${staff.id} by ${resetBy}`);
  }

  async updateLocation(
    companyId: string,
    staffId: string,
    locationDto: LocationUpdateDto,
  ): Promise<User> {
    const staff = await this.findStaffById(companyId, staffId);

    staff.updateLocation(locationDto.lat, locationDto.lng, locationDto.address);
    const updatedStaff = await this.userRepository.save(staff);

    this.logger.log(`Location updated for staff member: ${staffId}`);

    return updatedStaff;
  }

  // Bulk Operations
  async bulkUpdateStaff(
    companyId: string,
    bulkOperation: BulkStaffOperationDto,
    operatedBy: string,
  ): Promise<{ updated: number; failed: string[] }> {
    this.logger.log(
      `Bulk updating ${bulkOperation.staffIds.length} staff members for company ${companyId}`
    );

    const staffMembers = await this.userRepository.find({
      where: { 
        id: In(bulkOperation.staffIds),
        companyId,
        role: In([UserRole.FIELD_AGENT, UserRole.CLERK]),
      },
    });

    const failed: string[] = [];
    let updated = 0;

    for (const staff of staffMembers) {
      try {
        if (bulkOperation.status) {
          staff.status = bulkOperation.status;
        }

        await this.userRepository.save(staff);
        updated++;

        // TODO: Send notification if requested
        if (bulkOperation.sendNotification) {
          await this.sendStatusChangeNotification(staff, bulkOperation.reason);
        }
      } catch (error) {
        failed.push(staff.id);
        if (error instanceof Error) {
          this.logger.error(`Failed to update staff ${staff.id}: ${error.message}`);
        } else {
          this.logger.error(`Failed to update staff ${staff.id}: ${JSON.stringify(error)}`);
        }
      }
    }

    this.logger.log(
      `Bulk operation completed: ${updated} updated, ${failed.length} failed`
    );

    return { updated, failed };
  }

  // Utility methods
  async findByAgentCode(companyId: string, agentCode: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { 
        agentCode,
        companyId,
        role: UserRole.FIELD_AGENT,
      },
    });
  }

  async validateStaffAccess(
    currentUser: User,
    targetStaffId: string,
  ): Promise<boolean> {
    // Super admin has access to all staff
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Company admin can access staff in their company
    if (currentUser.role === UserRole.COMPANY_ADMIN) {
      const targetStaff = await this.userRepository.findOne({
        where: { id: targetStaffId },
      });

      return targetStaff?.companyId === currentUser.companyId;
    }

    // Staff can only access their own record
    return currentUser.id === targetStaffId;
  }

  // Private helper methods
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private async sendWelcomeEmail(
    staff: User,
    temporaryPassword: string,
  ): Promise<void> {
    // TODO: Implement email sending logic
    this.logger.log(`Sending welcome email to ${staff.email}`);
  }

  private async sendOnboardingEmail(
    staff: User,
    temporaryPassword: string,
    customMessage?: string,
  ): Promise<void> {
    // TODO: Implement email sending logic
    this.logger.log(`Sending onboarding email to ${staff.email}`);
  }

  private async sendPasswordResetEmail(
    staff: User,
    newPassword: string,
    customMessage?: string,
  ): Promise<void> {
    // TODO: Implement email sending logic
    this.logger.log(`Sending password reset email to ${staff.email}`);
  }

  private async sendStatusChangeNotification(
    staff: User,
    reason?: string,
  ): Promise<void> {
    // TODO: Implement notification logic
    this.logger.log(`Sending status change notification to ${staff.email}`);
  }
}