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
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { StaffService } from './staff.service';
import {
  CreateStaffDto,
  UpdateStaffDto,
  StaffResponseDto,
  StaffFilterDto,
  StaffOnboardingDto,
  LocationUpdateDto,
  BulkStaffOperationDto,
  StaffStatsDto,
  StaffPerformanceDto,
  PasswordResetDto,
} from './dto/staff.dto';
import { User } from './entities/user.entity';

// Mock decorators - these would come from @sabs/common
const JwtAuthGuard = () => (target: any) => target;
const RolesGuard = () => (target: any) => target;
const Roles = (...roles: string[]) => (target: any, propertyKey?: string) => {};
const CurrentUser = () => (target: any, propertyKey: string, parameterIndex: number) => {};
const CompanyAccess = () => (target: any, propertyKey?: string) => {};

@ApiTags('staff')
@ApiBearerAuth()
@Controller('companies/:companyId/staff')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @Roles('company_admin', 'super_admin')
  @CompanyAccess()
  @ApiOperation({
    summary: 'Create new staff member',
    description: 'Create a new field agent or clerk within the company. Company Admins can only create staff in their own company.',
  })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid', description: 'Company ID' })
  @ApiResponse({
    status: 201,
    description: 'Staff member created successfully',
    type: StaffResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email or agent code already exists' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createStaff(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() createStaffDto: CreateStaffDto,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    return this.staffService.createStaff(companyId, createStaffDto, currentUser.id);
  }

  @Get()
  @Roles('company_admin', 'super_admin')
  @CompanyAccess()
  @ApiOperation({
    summary: 'Get all staff members',
    description: 'Retrieve all staff members (field agents and clerks) with pagination and filtering',
  })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid', description: 'Company ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name or email' })
  @ApiQuery({ name: 'role', required: false, enum: ['field_agent', 'clerk'], description: 'Filter by role' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'suspended', 'pending'], description: 'Filter by status' })
  @ApiQuery({ name: 'agentCode', required: false, type: String, description: 'Filter by agent code' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['firstName', 'lastName', 'email', 'role', 'status', 'createdAt'], description: 'Sort by field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order' })
  @ApiResponse({
    status: 200,
    description: 'Staff members retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/StaffResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async findAllStaff(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Query() filters: StaffFilterDto,
  ) {
    return this.staffService.findAllStaff(companyId, filters);
  }

  @Get('stats')
  @Roles('company_admin', 'super_admin')
  @CompanyAccess()
  @ApiOperation({
    summary: 'Get staff statistics',
    description: 'Get comprehensive staff statistics for the company dashboard',
  })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid', description: 'Company ID' })
  @ApiResponse({
    status: 200,
    description: 'Staff statistics retrieved successfully',
    type: StaffStatsDto,
  })
  async getStaffStats(
    @Param('companyId', ParseUUIDPipe) companyId: string,
  ): Promise<StaffStatsDto> {
    return this.staffService.getStaffStats(companyId);
  }

  @Get(':staffId')
  @Roles('company_admin', 'super_admin')
  @CompanyAccess()
  @ApiOperation({
    summary: 'Get staff member by ID',
    description: 'Retrieve detailed information about a specific staff member',
  })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid', description: 'Company ID' })
  @ApiParam({ name: 'staffId', type: 'string', format: 'uuid', description: 'Staff member ID' })
  @ApiResponse({
    status: 200,
    description: 'Staff member retrieved successfully',
    type: StaffResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  async findStaffById(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
  ): Promise<User> {
    return this.staffService.findStaffById(companyId, staffId);
  }

  @Get(':staffId/performance')
  @Roles('company_admin', 'super_admin')
  @CompanyAccess()
  @ApiOperation({
    summary: 'Get staff performance metrics',
    description: 'Get detailed performance analytics for a specific staff member',
  })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid', description: 'Company ID' })
  @ApiParam({ name: 'staffId', type: 'string', format: 'uuid', description: 'Staff member ID' })
  @ApiQuery({ name: 'startDate', required: false, type: String, format: 'date', description: 'Start date for performance period' })
  @ApiQuery({ name: 'endDate', required: false, type: String, format: 'date', description: 'End date for performance period' })
  @ApiResponse({
    status: 200,
    description: 'Staff performance retrieved successfully',
    type: StaffPerformanceDto,
  })
  async getStaffPerformance(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<StaffPerformanceDto> {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    return this.staffService.getStaffPerformance(companyId, staffId, start, end);
  }

  @Patch(':staffId')
  @Roles('company_admin', 'super_admin')
  @CompanyAccess()
  @ApiOperation({
    summary: 'Update staff member',
    description: 'Update staff member information and settings',
  })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid', description: 'Company ID' })
  @ApiParam({ name: 'staffId', type: 'string', format: 'uuid', description: 'Staff member ID' })
  @ApiResponse({
    status: 200,
    description: 'Staff member updated successfully',
    type: StaffResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  @ApiResponse({ status: 409, description: 'Email or agent code already exists' })
  async updateStaff(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Body() updateStaffDto: UpdateStaffDto,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    return this.staffService.updateStaff(companyId, staffId, updateStaffDto, currentUser.id);
  }

  @Delete(':staffId')
  @Roles('company_admin', 'super_admin')
  @CompanyAccess()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deactivate staff member',
    description: 'Soft delete (deactivate) a staff member. This sets their status to inactive.',
  })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid', description: 'Company ID' })
  @ApiParam({ name: 'staffId', type: 'string', format: 'uuid', description: 'Staff member ID' })
  @ApiResponse({ status: 204, description: 'Staff member deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  async deactivateStaff(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @CurrentUser() currentUser: User,
    @Body() body?: { reason?: string },
  ): Promise<void> {
    return this.staffService.deleteStaff(companyId, staffId, currentUser.id, body?.reason);
  }

  // Staff Onboarding and Account Management
  @Post(':staffId/onboard')
  @Roles('company_admin', 'super_admin')
  @CompanyAccess()
  @ApiOperation({
    summary: 'Onboard staff member',
    description: 'Complete the onboarding process for a pending staff member',
  })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid', description: 'Company ID' })
  @ApiParam({ name: 'staffId', type: 'string', format: 'uuid', description: 'Staff member ID' })
  @ApiResponse({
    status: 200,
    description: 'Staff member onboarded successfully',
    type: StaffResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Staff member is not in pending status' })
  async onboardStaff(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Body() onboardingDto: StaffOnboardingDto,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    // Ensure the staffId matches
    onboardingDto.staffId = staffId;
    return this.staffService.onboardStaff(companyId, onboardingDto, currentUser.id);
  }

  @Post(':staffId/reset-password')
  @Roles('company_admin', 'super_admin')
  @CompanyAccess()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reset staff password',
    description: 'Reset password for a staff member and optionally send email notification',
  })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid', description: 'Company ID' })
  @ApiParam({ name: 'staffId', type: 'string', format: 'uuid', description: 'Staff member ID' })
  @ApiResponse({ status: 204, description: 'Password reset successfully' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  async resetPassword(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Body() resetDto: PasswordResetDto,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    // Ensure the staffId matches
    resetDto.staffId = staffId;
    return this.staffService.resetPassword(companyId, resetDto, currentUser.id);
  }

  @Patch(':staffId/location')
  @Roles('company_admin', 'super_admin', 'field_agent')
  @CompanyAccess()
  @ApiOperation({
    summary: 'Update staff location',
    description: 'Update the current location of a field agent. Agents can update their own location.',
  })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid', description: 'Company ID' })
  @ApiParam({ name: 'staffId', type: 'string', format: 'uuid', description: 'Staff member ID' })
  @ApiResponse({
    status: 200,
    description: 'Location updated successfully',
    type: StaffResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Not authorized to update this location' })
  async updateLocation(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Body() locationDto: LocationUpdateDto,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    // Validate access - agents can only update their own location
    const hasAccess = await this.staffService.validateStaffAccess(currentUser, staffId);
    if (!hasAccess) {
      throw new ForbiddenException('Not authorized to update this location');
    }

    return this.staffService.updateLocation(companyId, staffId, locationDto);
  }

  // Bulk Operations
  @Patch('bulk/update')
  @Roles('company_admin', 'super_admin')
  @CompanyAccess()
  @ApiOperation({
    summary: 'Bulk update staff members',
    description: 'Perform bulk operations on multiple staff members (e.g., status changes)',
  })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid', description: 'Company ID' })
  @ApiResponse({
    status: 200,
    description: 'Bulk operation completed',
    schema: {
      type: 'object',
      properties: {
        updated: { type: 'number', description: 'Number of staff members updated' },
        failed: { type: 'array', items: { type: 'string' }, description: 'IDs of staff members that failed to update' },
      },
    },
  })
  async bulkUpdateStaff(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() bulkOperation: BulkStaffOperationDto,
    @CurrentUser() currentUser: User,
  ): Promise<{ updated: number; failed: string[] }> {
    return this.staffService.bulkUpdateStaff(companyId, bulkOperation, currentUser.id);
  }

  // Utility Endpoints
  @Get('agent-code/:agentCode')
  @Roles('company_admin', 'super_admin', 'clerk')
  @CompanyAccess()
  @ApiOperation({
    summary: 'Find agent by code',
    description: 'Find a field agent by their agent code within the company',
  })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid', description: 'Company ID' })
  @ApiParam({ name: 'agentCode', type: 'string', description: 'Agent code to search for' })
  @ApiResponse({
    status: 200,
    description: 'Agent found',
    type: StaffResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async findByAgentCode(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('agentCode') agentCode: string,
  ): Promise<User> {
    const agent = await this.staffService.findByAgentCode(companyId, agentCode);
    if (!agent) {
      throw new NotFoundException(`Agent with code ${agentCode} not found`);
    }
    return agent;
  }

  @Get('roles/summary')
  @Roles('company_admin', 'super_admin')
  @CompanyAccess()
  @ApiOperation({
    summary: 'Get role summary',
    description: 'Get a summary of staff distribution by role',
  })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid', description: 'Company ID' })
  @ApiResponse({
    status: 200,
    description: 'Role summary retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        fieldAgents: { type: 'number' },
        clerks: { type: 'number' },
        activeStaff: { type: 'number' },
        pendingStaff: { type: 'number' },
        breakdown: {
          type: 'object',
          properties: {
            field_agent: {
              type: 'object',
              properties: {
                active: { type: 'number' },
                pending: { type: 'number' },
                inactive: { type: 'number' },
              },
            },
            clerk: {
              type: 'object',
              properties: {
                active: { type: 'number' },
                pending: { type: 'number' },
                inactive: { type: 'number' },
              },
            },
          },
        },
      },
    },
  })
  async getRoleSummary(
    @Param('companyId', ParseUUIDPipe) companyId: string,
  ) {
    const stats = await this.staffService.getStaffStats(companyId);
    
    return {
      fieldAgents: stats.fieldAgents,
      clerks: stats.clerks,
      activeStaff: stats.activeStaff,
      pendingStaff: stats.pendingStaff,
      breakdown: {
        field_agent: {
          active: Math.floor(stats.fieldAgents * 0.8), // Placeholder calculations
          pending: Math.floor(stats.fieldAgents * 0.15),
          inactive: Math.floor(stats.fieldAgents * 0.05),
        },
        clerk: {
          active: Math.floor(stats.clerks * 0.9),
          pending: Math.floor(stats.clerks * 0.08),
          inactive: Math.floor(stats.clerks * 0.02),
        },
      },
    };
  }
}