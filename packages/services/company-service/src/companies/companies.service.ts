import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, In, Between } from 'typeorm';
import { Company, CompanyStatus } from './entities/company.entity';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  AddServiceCreditsDto,
  CompanyStatsDto,
  BulkOperationDto,
} from './dto/company.dto';

export interface CompanyQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CompanyStatus;
  subscriptionPlan?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'status';
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    this.logger.log(`Creating new company: ${createCompanyDto.name}`);

    // Check if company with this email already exists
    const existingCompany = await this.companyRepository.findOne({
      where: { email: createCompanyDto.email },
    });

    if (existingCompany) {
      throw new ConflictException('Company with this email already exists');
    }

    // Set default trial end date if not provided and status is trial
    if (
      createCompanyDto.status === CompanyStatus.TRIAL || 
      !createCompanyDto.status
    ) {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 30); // 30-day trial
      createCompanyDto.trialEndsAt = trialEndDate.toISOString();
    }

    // Set default settings if not provided
    if (!createCompanyDto.settings) {
      createCompanyDto.settings = {
        notifications: {
          email: true,
          sms: true,
          push: true,
        },
        features: {
          advancedAnalytics: false,
          bulkTransactions: false,
          customReports: false,
        },
        limits: {
          maxAgents: 10,
          maxCustomers: 1000,
          dailyTransactionLimit: 50000,
        },
        branding: {},
      };
    }

    const company = this.companyRepository.create({
      ...createCompanyDto,
      trialEndsAt: createCompanyDto.trialEndsAt 
        ? new Date(createCompanyDto.trialEndsAt) 
        : undefined,
    });

    const savedCompany = await this.companyRepository.save(company);
    this.logger.log(`Company created successfully: ${savedCompany.id}`);

    return savedCompany;
  }

  async findAll(params: CompanyQueryParams = {}): Promise<PaginatedResponse<Company>> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      subscriptionPlan,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = params;

    const skip = (page - 1) * limit;
    
    // Build query conditions
    const baseCondition: FindOptionsWhere<Company> = {};

    if (status) {
      baseCondition.status = status;
    }

    if (subscriptionPlan) {
      baseCondition.subscriptionPlan = subscriptionPlan;
    }

    let findOptions: { where: FindOptionsWhere<Company> | FindOptionsWhere<Company>[]; skip: number; take: number; order: Record<string, any> };

    if (search) {
      // Search across multiple fields using array syntax for OR conditions
      findOptions = {
        where: [
          { ...baseCondition, name: Like(`%${search}%`) },
          { ...baseCondition, email: Like(`%${search}%`) },
        ],
        skip,
        take: limit,
        order: { [sortBy]: sortOrder },
      };
    } else {
      findOptions = {
        where: baseCondition,
        skip,
        take: limit,
        order: { [sortBy]: sortOrder },
      };
    }

    const [companies, total] = await this.companyRepository.findAndCount(findOptions);

    return {
      data: companies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return company;
  }

  async findByEmail(email: string): Promise<Company | null> {
    return this.companyRepository.findOne({
      where: { email },
    });
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<Company> {
    this.logger.log(`Updating company: ${id}`);

    const company = await this.findOne(id);

    // Check if email is being changed and if new email already exists
    if (updateCompanyDto.email && updateCompanyDto.email !== company.email) {
      const existingCompany = await this.findByEmail(updateCompanyDto.email);
      if (existingCompany) {
        throw new ConflictException('Company with this email already exists');
      }
    }

    // Convert trialEndsAt string to Date if provided
    if (updateCompanyDto.trialEndsAt) {
      (updateCompanyDto as any).trialEndsAt = new Date(updateCompanyDto.trialEndsAt);
    }

    Object.assign(company, updateCompanyDto);
    const updatedCompany = await this.companyRepository.save(company);

    this.logger.log(`Company updated successfully: ${id}`);
    return updatedCompany;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removing company: ${id}`);

    const company = await this.findOne(id);
    
    // Soft delete by changing status to inactive instead of hard delete
    // This preserves referential integrity with users and transactions
    company.status = CompanyStatus.INACTIVE;
    await this.companyRepository.save(company);

    this.logger.log(`Company soft-deleted successfully: ${id}`);
  }

  // Service Credit Management
  async addServiceCredits(
    id: string,
    addCreditsDto: AddServiceCreditsDto,
  ): Promise<Company> {
    this.logger.log(
      `Adding ${addCreditsDto.amount} ${addCreditsDto.serviceType} credits to company: ${id}`
    );

    const company = await this.findOne(id);
    
    company.addServiceCredits(addCreditsDto.serviceType, addCreditsDto.amount);
    const updatedCompany = await this.companyRepository.save(company);

    this.logger.log(
      `Service credits added successfully. New balance: ${
        addCreditsDto.serviceType === 'sms' 
          ? updatedCompany.smsCredits 
          : updatedCompany.aiCredits
      }`
    );

    return updatedCompany;
  }

  async deductServiceCredits(
    id: string,
    serviceType: 'sms' | 'ai',
    amount: number = 1,
  ): Promise<boolean> {
    const company = await this.findOne(id);
    
    const success = company.deductServiceCredit(serviceType, amount);
    
    if (success) {
      await this.companyRepository.save(company);
      this.logger.log(
        `Deducted ${amount} ${serviceType} credits from company: ${id}`
      );
    } else {
      this.logger.warn(
        `Failed to deduct ${amount} ${serviceType} credits from company: ${id} (insufficient credits)`
      );
    }

    return success;
  }

  async getServiceCreditBalance(
    id: string,
    serviceType: 'sms' | 'ai',
  ): Promise<number> {
    const company = await this.findOne(id);
    return serviceType === 'sms' ? company.smsCredits : company.aiCredits;
  }

  // Statistics and Analytics
  async getCompanyStats(id: string): Promise<CompanyStatsDto> {
    const company = await this.findOne(id);

    // Note: These would typically involve joins with Users, Customers, and Transactions tables
    // For now, returning mock data structure. In a real implementation, 
    // you'd query the related entities.
    
    const stats: CompanyStatsDto = {
      totalUsers: 0, // COUNT users WHERE company_id = id
      activeUsers: 0, // COUNT users WHERE company_id = id AND last_login_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
      totalCustomers: 0, // COUNT customers WHERE company_id = id
      monthlyTransactions: 0, // COUNT transactions WHERE company_id = id AND created_at >= start_of_month
      monthlyVolume: 0, // SUM transaction amounts for current month
      serviceUsage: {
        smsUsed: 0, // Calculate from service_usage table
        aiQueriesUsed: 0, // Calculate from service_usage table
      },
    };

    return stats;
  }

  async getDashboardSummary() {
    const [
      totalCompanies,
      activeCompanies,
      trialCompanies,
      suspendedCompanies,
    ] = await Promise.all([
      this.companyRepository.count(),
      this.companyRepository.count({
        where: { status: CompanyStatus.ACTIVE },
      }),
      this.companyRepository.count({
        where: { status: CompanyStatus.TRIAL },
      }),
      this.companyRepository.count({
        where: { status: CompanyStatus.SUSPENDED },
      }),
    ]);

    // Get companies with low service credits
    const lowCreditCompanies = await this.companyRepository
      .createQueryBuilder('company')
      .where('company.smsCredits < 100 OR company.aiCredits < 50')
      .andWhere('company.status IN (:...activeStatuses)', {
        activeStatuses: [CompanyStatus.ACTIVE, CompanyStatus.TRIAL],
      })
      .getCount();

    // Get recent signups (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSignups = await this.companyRepository.count({
      where: {
        createdAt: Between(thirtyDaysAgo, new Date()),
      },
    });

    return {
      totalCompanies,
      activeCompanies,
      trialCompanies,
      suspendedCompanies,
      lowCreditCompanies,
      recentSignups,
      conversionRate: totalCompanies > 0 
        ? ((activeCompanies / totalCompanies) * 100).toFixed(2) 
        : 0,
    };
  }

  // Bulk Operations (Super Admin only)
  async bulkUpdateStatus(bulkOperationDto: BulkOperationDto): Promise<{
    updated: number;
    failed: string[];
  }> {
    this.logger.log(
      `Bulk updating ${bulkOperationDto.companyIds.length} companies to status: ${bulkOperationDto.status}`
    );

    const results = await this.companyRepository.update(
      { id: In(bulkOperationDto.companyIds) },
      { status: bulkOperationDto.status }
    );

    return {
      updated: results.affected || 0,
      failed: [], // In a real implementation, you'd track which IDs failed
    };
  }

  async getExpiringTrials(daysFromNow: number = 7): Promise<Company[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysFromNow);

    return this.companyRepository
      .createQueryBuilder('company')
      .where('company.status = :status', { status: CompanyStatus.TRIAL })
      .andWhere('company.trialEndsAt <= :futureDate', { futureDate })
      .andWhere('company.trialEndsAt > :now', { now: new Date() })
      .orderBy('company.trialEndsAt', 'ASC')
      .getMany();
  }

  // Utility methods
  async validateCompanyAccess(companyId: string): Promise<boolean> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    return company?.isActive || company?.isOnTrial || false;
  }

  async getCompanyTimezone(companyId: string): Promise<string> {
    const company = await this.findOne(companyId);
    return company.timezone;
  }

  async updateSubscriptionPlan(
    id: string,
    plan: string,
    features?: Record<string, any>,
  ): Promise<Company> {
    const company = await this.findOne(id);
    
    company.subscriptionPlan = plan;
    
    if (features) {
      company.settings = {
        ...company.settings,
        features: {
          ...company.settings.features,
          ...features,
        },
      };
    }

    return this.companyRepository.save(company);
  }
}