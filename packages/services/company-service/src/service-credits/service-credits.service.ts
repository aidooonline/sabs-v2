import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Company } from '../companies/entities/company.entity';
import { ServiceUsage } from './entities/service-usage.entity';

export interface ServiceCreditTransaction {
  id: string;
  companyId: string;
  serviceType: 'sms' | 'ai';
  type: 'credit' | 'debit';
  amount: number;
  balance: number;
  reason: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface ServiceUsageStats {
  totalUsage: number;
  dailyUsage: number;
  weeklyUsage: number;
  monthlyUsage: number;
  averageDailyUsage: number;
  peakUsageDay: string;
  costThisMonth: number;
}

@Injectable()
export class ServiceCreditsService {
  private readonly logger = new Logger(ServiceCreditsService.name);

  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(ServiceUsage)
    private readonly serviceUsageRepository: Repository<ServiceUsage>,
  ) {}

  // Service Credit Management
  async addCredits(
    companyId: string,
    serviceType: 'sms' | 'ai',
    amount: number,
    reason: string = 'Manual credit addition',
    metadata?: Record<string, any>,
  ): Promise<Company> {
    this.logger.log(
      `Adding ${amount} ${serviceType} credits to company ${companyId}: ${reason}`
    );

    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    // Add credits using the company entity method
    company.addServiceCredits(serviceType, amount);
    
    // Save the updated company
    const updatedCompany = await this.companyRepository.save(company);

    // Record the credit transaction for audit purposes
    await this.recordCreditTransaction(
      companyId,
      serviceType,
      'credit',
      amount,
      serviceType === 'sms' ? updatedCompany.smsCredits : updatedCompany.aiCredits,
      reason,
      metadata,
    );

    this.logger.log(
      `Successfully added ${amount} ${serviceType} credits. New balance: ${
        serviceType === 'sms' ? updatedCompany.smsCredits : updatedCompany.aiCredits
      }`
    );

    return updatedCompany;
  }

  async deductCredits(
    companyId: string,
    serviceType: 'sms' | 'ai',
    amount: number = 1,
    reason: string = 'Service usage',
    metadata?: Record<string, any>,
  ): Promise<{ success: boolean; remainingCredits: number }> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    // Check if company can use the service
    if (!company.canUseService(serviceType)) {
      this.logger.warn(
        `Cannot deduct ${amount} ${serviceType} credits from company ${companyId}: Service not available or insufficient credits`
      );
      return {
        success: false,
        remainingCredits: serviceType === 'sms' ? company.smsCredits : company.aiCredits,
      };
    }

    // Attempt to deduct credits
    const success = company.deductServiceCredit(serviceType, amount);

    if (success) {
      const updatedCompany = await this.companyRepository.save(company);
      const remainingCredits = serviceType === 'sms' 
        ? updatedCompany.smsCredits 
        : updatedCompany.aiCredits;

      // Record the debit transaction
      await this.recordCreditTransaction(
        companyId,
        serviceType,
        'debit',
        amount,
        remainingCredits,
        reason,
        metadata,
      );

      // Record service usage for billing and analytics
      await this.recordServiceUsage(companyId, serviceType, amount, metadata);

      this.logger.log(
        `Successfully deducted ${amount} ${serviceType} credits from company ${companyId}. Remaining: ${remainingCredits}`
      );

      return { success: true, remainingCredits };
    }

    return {
      success: false,
      remainingCredits: serviceType === 'sms' ? company.smsCredits : company.aiCredits,
    };
  }

  async getCreditBalance(
    companyId: string,
    serviceType: 'sms' | 'ai',
  ): Promise<number> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    return serviceType === 'sms' ? company.smsCredits : company.aiCredits;
  }

  async getAllCreditBalances(companyId: string): Promise<{
    smsCredits: number;
    aiCredits: number;
    totalValue: number;
  }> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    // Calculate total value based on credit prices
    const SMS_CREDIT_VALUE = 0.05; // $0.05 per SMS credit
    const AI_CREDIT_VALUE = 0.10; // $0.10 per AI credit
    
    const totalValue = (company.smsCredits * SMS_CREDIT_VALUE) + 
                      (company.aiCredits * AI_CREDIT_VALUE);

    return {
      smsCredits: company.smsCredits,
      aiCredits: company.aiCredits,
      totalValue: Math.round(totalValue * 100) / 100, // Round to 2 decimal places
    };
  }

  // Service Usage Analytics
  async getUsageStats(
    companyId: string,
    serviceType: 'sms' | 'ai',
    startDate: Date,
    endDate: Date,
  ): Promise<ServiceUsageStats> {
    const usageRecords = await this.serviceUsageRepository.find({
      where: {
        companyId,
        serviceType,
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'ASC' },
    });

    const totalUsage = usageRecords.reduce((sum, record) => sum + record.quantity, 0);
    const totalCost = usageRecords.reduce((sum, record) => sum + record.cost, 0);

    // Calculate daily usage
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dailyUsage = usageRecords
      .filter(record => record.createdAt >= today)
      .reduce((sum, record) => sum + record.quantity, 0);

    // Calculate weekly usage
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyUsage = usageRecords
      .filter(record => record.createdAt >= weekAgo)
      .reduce((sum, record) => sum + record.quantity, 0);

    // Calculate monthly usage
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyUsage = usageRecords
      .filter(record => record.createdAt >= monthStart)
      .reduce((sum, record) => sum + record.quantity, 0);

    // Calculate average daily usage
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const averageDailyUsage = days > 0 ? totalUsage / days : 0;

    // Find peak usage day
    const dailyUsageMap = new Map<string, number>();
    usageRecords.forEach(record => {
      const date = record.createdAt.toISOString().split('T')[0];
      dailyUsageMap.set(date, (dailyUsageMap.get(date) || 0) + record.quantity);
    });

    let peakUsageDay = '';
    let peakUsage = 0;
    for (const [date, usage] of dailyUsageMap.entries()) {
      if (usage > peakUsage) {
        peakUsage = usage;
        peakUsageDay = date;
      }
    }

    return {
      totalUsage,
      dailyUsage,
      weeklyUsage,
      monthlyUsage,
      averageDailyUsage: Math.round(averageDailyUsage * 100) / 100,
      peakUsageDay,
      costThisMonth: Math.round(totalCost * 100) / 100,
    };
  }

  async getMonthlyUsageReport(companyId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const [smsStats, aiStats] = await Promise.all([
      this.getUsageStats(companyId, 'sms', startDate, endDate),
      this.getUsageStats(companyId, 'ai', startDate, endDate),
    ]);

    return {
      period: `${year}-${month.toString().padStart(2, '0')}`,
      sms: smsStats,
      ai: aiStats,
      totalCost: smsStats.costThisMonth + aiStats.costThisMonth,
    };
  }

  // Low Credit Warnings
  async checkLowCreditWarnings(): Promise<Array<{
    companyId: string;
    companyName: string;
    serviceType: 'sms' | 'ai';
    currentCredits: number;
    threshold: number;
    severity: 'warning' | 'critical';
  }>> {
    const companies = await this.companyRepository.find({
      where: [
        { smsCredits: 100 }, // Less than 100 SMS credits
        { aiCredits: 50 },   // Less than 50 AI credits
      ],
    });

    const warnings = [];

    for (const company of companies) {
      // Check SMS credits
      if (company.smsCredits <= 50) {
        warnings.push({
          companyId: company.id,
          companyName: company.name,
          serviceType: 'sms' as const,
          currentCredits: company.smsCredits,
          threshold: 50,
          severity: company.smsCredits <= 10 ? 'critical' as const : 'warning' as const,
        });
      }

      // Check AI credits
      if (company.aiCredits <= 25) {
        warnings.push({
          companyId: company.id,
          companyName: company.name,
          serviceType: 'ai' as const,
          currentCredits: company.aiCredits,
          threshold: 25,
          severity: company.aiCredits <= 5 ? 'critical' as const : 'warning' as const,
        });
      }
    }

    return warnings;
  }

  // Credit Packages and Pricing
  async purchaseCredits(
    companyId: string,
    packageType: 'sms-small' | 'sms-medium' | 'sms-large' | 'ai-small' | 'ai-medium' | 'ai-large',
    paymentReference?: string,
  ): Promise<Company> {
    const packages = {
      'sms-small': { credits: 1000, cost: 50, service: 'sms' as const },
      'sms-medium': { credits: 5000, cost: 200, service: 'sms' as const },
      'sms-large': { credits: 10000, cost: 350, service: 'sms' as const },
      'ai-small': { credits: 500, cost: 50, service: 'ai' as const },
      'ai-medium': { credits: 2500, cost: 200, service: 'ai' as const },
      'ai-large': { credits: 5000, cost: 350, service: 'ai' as const },
    };

    const packageInfo = packages[packageType];
    if (!packageInfo) {
      throw new BadRequestException(`Invalid package type: ${packageType}`);
    }

    return this.addCredits(
      companyId,
      packageInfo.service,
      packageInfo.credits,
      `Credit purchase: ${packageType} (${packageInfo.credits} credits for $${packageInfo.cost})`,
      {
        packageType,
        cost: packageInfo.cost,
        paymentReference,
        purchaseDate: new Date().toISOString(),
      },
    );
  }

  // Private helper methods
  private async recordCreditTransaction(
    companyId: string,
    serviceType: 'sms' | 'ai',
    type: 'credit' | 'debit',
    amount: number,
    balance: number,
    reason: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    // In a real implementation, you'd have a credit_transactions table
    // For now, we'll log this information
    const transaction: ServiceCreditTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      companyId,
      serviceType,
      type,
      amount,
      balance,
      reason,
      metadata,
      createdAt: new Date(),
    };

    this.logger.log(`Credit Transaction: ${JSON.stringify(transaction)}`);
  }

  private async recordServiceUsage(
    companyId: string,
    serviceType: 'sms' | 'ai',
    quantity: number,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const cost = this.calculateServiceCost(serviceType, quantity);

    const usage = this.serviceUsageRepository.create({
      companyId,
      serviceType,
      quantity,
      cost,
      metadata: metadata || {},
    });

    await this.serviceUsageRepository.save(usage);
  }

  private calculateServiceCost(serviceType: 'sms' | 'ai', quantity: number): number {
    const rates = {
      sms: 0.05, // $0.05 per SMS
      ai: 0.10,  // $0.10 per AI query
    };

    return rates[serviceType] * quantity;
  }
}