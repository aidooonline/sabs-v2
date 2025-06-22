import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ServiceCreditsService } from './service-credits.service';

// Mock decorators - these would come from @sabs/common
const JwtAuthGuard = () => (target: any) => target;
const RolesGuard = () => (target: any) => target;
const Roles = (...roles: string[]) => (target: any, propertyKey?: string) => {};

@ApiTags('service-credits')
@ApiBearerAuth()
@Controller('service-credits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiceCreditsController {
  constructor(private readonly serviceCreditsService: ServiceCreditsService) {}

  @Get('companies/:companyId/balances')
  @Roles('super_admin', 'company_admin')
  @ApiOperation({
    summary: 'Get all service credit balances for a company',
    description: 'Retrieve SMS and AI credit balances with total value',
  })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Credit balances retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        smsCredits: { type: 'number' },
        aiCredits: { type: 'number' },
        totalValue: { type: 'number' },
      },
    },
  })
  async getAllCreditBalances(@Param('companyId', ParseUUIDPipe) companyId: string) {
    return this.serviceCreditsService.getAllCreditBalances(companyId);
  }

  @Post('companies/:companyId/purchase')
  @Roles('super_admin', 'company_admin')
  @ApiOperation({
    summary: 'Purchase service credit package',
    description: 'Purchase a predefined service credit package',
  })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Credits purchased successfully',
  })
  async purchaseCredits(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() purchaseData: {
      packageType: 'sms-small' | 'sms-medium' | 'sms-large' | 'ai-small' | 'ai-medium' | 'ai-large';
      paymentReference?: string;
    },
  ) {
    return this.serviceCreditsService.purchaseCredits(
      companyId,
      purchaseData.packageType,
      purchaseData.paymentReference,
    );
  }

  @Get('companies/:companyId/usage/:serviceType/stats')
  @Roles('super_admin', 'company_admin')
  @ApiOperation({
    summary: 'Get service usage statistics',
    description: 'Get detailed usage statistics for a service type within a date range',
  })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'serviceType', enum: ['sms', 'ai'] })
  @ApiQuery({ name: 'startDate', type: 'string', format: 'date' })
  @ApiQuery({ name: 'endDate', type: 'string', format: 'date' })
  @ApiResponse({
    status: 200,
    description: 'Usage statistics retrieved successfully',
  })
  async getUsageStats(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('serviceType') serviceType: 'sms' | 'ai',
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.serviceCreditsService.getUsageStats(
      companyId,
      serviceType,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('companies/:companyId/usage/monthly/:year/:month')
  @Roles('super_admin', 'company_admin')
  @ApiOperation({
    summary: 'Get monthly usage report',
    description: 'Get comprehensive usage report for a specific month',
  })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'year', type: 'number' })
  @ApiParam({ name: 'month', type: 'number', description: 'Month (1-12)' })
  @ApiResponse({
    status: 200,
    description: 'Monthly usage report retrieved successfully',
  })
  async getMonthlyUsageReport(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.serviceCreditsService.getMonthlyUsageReport(companyId, year, month);
  }

  @Post('companies/:companyId/deduct')
  @Roles('super_admin')
  @ApiOperation({
    summary: 'Deduct service credits (Internal use)',
    description: 'Deduct credits for service usage. Typically called by other services.',
  })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Credits deducted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        remainingCredits: { type: 'number' },
      },
    },
  })
  async deductCredits(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() deductData: {
      serviceType: 'sms' | 'ai';
      amount: number;
      reason?: string;
      metadata?: Record<string, any>;
    },
  ) {
    return this.serviceCreditsService.deductCredits(
      companyId,
      deductData.serviceType,
      deductData.amount,
      deductData.reason,
      deductData.metadata,
    );
  }

  @Get('warnings/low-credits')
  @Roles('super_admin')
  @ApiOperation({
    summary: 'Get low credit warnings',
    description: 'Get list of companies with low service credits that need attention',
  })
  @ApiResponse({
    status: 200,
    description: 'Low credit warnings retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          companyId: { type: 'string' },
          companyName: { type: 'string' },
          serviceType: { type: 'string', enum: ['sms', 'ai'] },
          currentCredits: { type: 'number' },
          threshold: { type: 'number' },
          severity: { type: 'string', enum: ['warning', 'critical'] },
        },
      },
    },
  })
  async getLowCreditWarnings() {
    return this.serviceCreditsService.checkLowCreditWarnings();
  }

  @Get('packages')
  @Roles('super_admin', 'company_admin')
  @ApiOperation({
    summary: 'Get available credit packages',
    description: 'Get list of available service credit packages and pricing',
  })
  @ApiResponse({
    status: 200,
    description: 'Available packages retrieved successfully',
  })
  async getAvailablePackages() {
    return {
      sms: [
        { type: 'sms-small', credits: 1000, cost: 50, description: 'Small SMS Package' },
        { type: 'sms-medium', credits: 5000, cost: 200, description: 'Medium SMS Package' },
        { type: 'sms-large', credits: 10000, cost: 350, description: 'Large SMS Package' },
      ],
      ai: [
        { type: 'ai-small', credits: 500, cost: 50, description: 'Small AI Package' },
        { type: 'ai-medium', credits: 2500, cost: 200, description: 'Medium AI Package' },
        { type: 'ai-large', credits: 5000, cost: 350, description: 'Large AI Package' },
      ],
    };
  }
}