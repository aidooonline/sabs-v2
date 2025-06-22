import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { CompaniesService, CompanyQueryParams } from './companies.service';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  CompanyResponseDto,
  AddServiceCreditsDto,
  CompanyStatsDto,
  BulkOperationDto,
} from './dto/company.dto';
import { Company, CompanyStatus } from './entities/company.entity';

// Note: These guards would be imported from the identity service
// For now, creating placeholder interfaces
interface JwtAuthGuard {}
interface RolesGuard {}
interface Roles {}

// Mock decorators - these would come from @sabs/common
const JwtAuthGuard = () => (target: any) => target;
const RolesGuard = () => (target: any) => target;
const Roles = (...roles: string[]) => (target: any, propertyKey?: string) => {};
const CurrentUser = () => (target: any, propertyKey: string, parameterIndex: number) => {};

@ApiTags('companies')
@ApiBearerAuth()
@Controller('companies')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Roles('super_admin')
  @ApiOperation({ 
    summary: 'Create a new company',
    description: 'Create a new company on the platform. Only Super Admins can create companies.'
  })
  @ApiResponse({
    status: 201,
    description: 'Company created successfully',
    type: CompanyResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Company with email already exists' })
  async create(@Body() createCompanyDto: CreateCompanyDto): Promise<Company> {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  @Roles('super_admin')
  @ApiOperation({ 
    summary: 'Get all companies with pagination and filtering',
    description: 'Retrieve all companies with support for pagination, search, and filtering. Super Admin only.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in company name and email' })
  @ApiQuery({ name: 'status', required: false, enum: CompanyStatus, description: 'Filter by company status' })
  @ApiQuery({ name: 'subscriptionPlan', required: false, type: String, description: 'Filter by subscription plan' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'createdAt', 'updatedAt', 'status'], description: 'Sort by field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order' })
  @ApiResponse({
    status: 200,
    description: 'Companies retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/CompanyResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async findAll(@Query() query: CompanyQueryParams) {
    // Validate and sanitize query parameters
    const params: CompanyQueryParams = {
      page: Math.max(1, parseInt(query.page?.toString() || '1')),
      limit: Math.min(100, Math.max(1, parseInt(query.limit?.toString() || '20'))),
      search: query.search?.toString().trim(),
      status: query.status,
      subscriptionPlan: query.subscriptionPlan?.toString(),
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'DESC',
    };

    return this.companiesService.findAll(params);
  }

  @Get('dashboard')
  @Roles('super_admin')
  @ApiOperation({ 
    summary: 'Get dashboard summary statistics',
    description: 'Get high-level statistics for the Super Admin dashboard'
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard summary retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalCompanies: { type: 'number' },
        activeCompanies: { type: 'number' },
        trialCompanies: { type: 'number' },
        suspendedCompanies: { type: 'number' },
        lowCreditCompanies: { type: 'number' },
        recentSignups: { type: 'number' },
        conversionRate: { type: 'string' },
      },
    },
  })
  async getDashboardSummary() {
    return this.companiesService.getDashboardSummary();
  }

  @Get('expiring-trials')
  @Roles('super_admin')
  @ApiOperation({ 
    summary: 'Get companies with expiring trials',
    description: 'Get list of companies whose trial periods are expiring soon'
  })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Days from now to check (default: 7)' })
  @ApiResponse({
    status: 200,
    description: 'Expiring trials retrieved successfully',
    type: [CompanyResponseDto],
  })
  async getExpiringTrials(@Query('days') days?: string) {
    const daysFromNow = days ? parseInt(days) : 7;
    return this.companiesService.getExpiringTrials(daysFromNow);
  }

  @Get(':id')
  @Roles('super_admin', 'company_admin')
  @ApiOperation({ 
    summary: 'Get company by ID',
    description: 'Retrieve a specific company by ID. Super Admins can access any company, Company Admins only their own.'
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Company ID' })
  @ApiResponse({
    status: 200,
    description: 'Company retrieved successfully',
    type: CompanyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Company> {
    return this.companiesService.findOne(id);
  }

  @Get(':id/stats')
  @Roles('super_admin', 'company_admin')
  @ApiOperation({ 
    summary: 'Get company statistics',
    description: 'Get detailed statistics for a specific company'
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Company ID' })
  @ApiResponse({
    status: 200,
    description: 'Company statistics retrieved successfully',
    type: CompanyStatsDto,
  })
  async getCompanyStats(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<CompanyStatsDto> {
    return this.companiesService.getCompanyStats(id);
  }

  @Patch(':id')
  @Roles('super_admin', 'company_admin')
  @ApiOperation({ 
    summary: 'Update company',
    description: 'Update company information. Super Admins can update any company, Company Admins only their own.'
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Company ID' })
  @ApiResponse({
    status: 200,
    description: 'Company updated successfully',
    type: CompanyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Company not found' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @Roles('super_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Soft delete company',
    description: 'Soft delete a company (sets status to inactive). Only Super Admins can delete companies.'
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Company ID' })
  @ApiResponse({ status: 204, description: 'Company deleted successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.companiesService.remove(id);
  }

  // Service Credit Management Endpoints
  @Post(':id/service-credits')
  @Roles('super_admin')
  @ApiOperation({ 
    summary: 'Add service credits to company',
    description: 'Add SMS or AI credits to a company account. Super Admin only.'
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Company ID' })
  @ApiResponse({
    status: 200,
    description: 'Service credits added successfully',
    type: CompanyResponseDto,
  })
  async addServiceCredits(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addCreditsDto: AddServiceCreditsDto,
  ): Promise<Company> {
    return this.companiesService.addServiceCredits(id, addCreditsDto);
  }

  @Get(':id/service-credits/:serviceType')
  @Roles('super_admin', 'company_admin')
  @ApiOperation({ 
    summary: 'Get service credit balance',
    description: 'Get current balance for a specific service type'
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Company ID' })
  @ApiParam({ name: 'serviceType', enum: ['sms', 'ai'], description: 'Service type' })
  @ApiResponse({
    status: 200,
    description: 'Credit balance retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        serviceType: { type: 'string', enum: ['sms', 'ai'] },
        balance: { type: 'number' },
        companyId: { type: 'string' },
      },
    },
  })
  async getServiceCreditBalance(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('serviceType') serviceType: 'sms' | 'ai',
  ): Promise<{ serviceType: string; balance: number; companyId: string }> {
    const balance = await this.companiesService.getServiceCreditBalance(id, serviceType);
    return { serviceType, balance, companyId: id };
  }

  @Patch(':id/subscription')
  @Roles('super_admin')
  @ApiOperation({ 
    summary: 'Update company subscription plan',
    description: 'Update the subscription plan and related features for a company'
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Company ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription updated successfully',
    type: CompanyResponseDto,
  })
  async updateSubscription(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: { plan: string; features?: Record<string, any> },
  ): Promise<Company> {
    return this.companiesService.updateSubscriptionPlan(
      id,
      updateData.plan,
      updateData.features,
    );
  }

  // Bulk Operations
  @Patch('bulk/status')
  @Roles('super_admin')
  @ApiOperation({ 
    summary: 'Bulk update company status',
    description: 'Update status for multiple companies at once. Super Admin only.'
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk operation completed',
    schema: {
      type: 'object',
      properties: {
        updated: { type: 'number' },
        failed: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async bulkUpdateStatus(
    @Body() bulkOperationDto: BulkOperationDto,
  ): Promise<{ updated: number; failed: string[] }> {
    return this.companiesService.bulkUpdateStatus(bulkOperationDto);
  }
}