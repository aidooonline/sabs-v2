import { HttpException, HttpStatus } from '@nestjs/common';
import { getErrorMessage, getErrorStack, getErrorStatus, UserRole, ReportType, LibraryCapability } from '@sabs/common';
import { 
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CustomerOnboardingService } from '../services/onboarding.service';

  Controller, 
  Post, 
  Get, 
  Put, 
  Patch,
  Delete,
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request,
  HttpStatus,
  Logger,
  ParseUUIDPipe,
  ValidationPipe,
  HttpException,
  HttpCode,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
  StartOnboardingDto,
  UpdatePersonalInfoDto,
  UpdateContactInfoDto,
  UpdateIdentificationDto,
  UpdateAccountPreferencesDto,
  UploadDocumentDto,
  VerifyDocumentDto,
  SubmitOnboardingDto,
  ApproveOnboardingDto,
  RejectOnboardingDto,
  OnboardingQueryDto,
  OnboardingResponseDto,
  OnboardingListResponseDto,
  OnboardingStatsResponseDto,
  UpdateOnboardingStatusDto,
} from '../dto/onboarding.dto';

@ApiTags('onboarding')
@ApiBearerAuth()
@Controller('onboarding')
export class OnboardingController {
  private readonly logger = new Logger(OnboardingController.name);

  constructor(
    private readonly onboardingService: CustomerOnboardingService,
  ) {}

  /**
   * Start a new customer onboarding process
   */
  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Start customer onboarding',
    description: 'Initiates a new customer onboarding process for an agent'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Onboarding started successfully',
    type: OnboardingResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Authentication required' 
  })
  async startOnboarding(
    @Body() dto: StartOnboardingDto,
    @Request() req: any,
  ): Promise<OnboardingResponseDto> {
    try {
      const { user } = req;
      const companyId = user.companyId;
      const agentId = user.sub;
      const agentName = user.fullName || `${user.firstName} ${user.lastName}`;
      const agentPhone = user.phoneNumber;
      const ipAddress = (req as any).ip;

      this.logger.log(`Agent ${agentId} starting onboarding for company ${companyId}`);

      return await this.onboardingService.startOnboarding(
        companyId,
        agentId,
        agentName,
        agentPhone,
        dto,
        ipAddress,
      );
    } catch (error) {
      this.logger.error('Failed to start onboarding', getErrorStack(error));
      throw new HttpException(
        getErrorMessage(error) || 'Failed to start onboarding',
        getErrorStatus(error, HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  /**
   * Update personal information step
   */
  @Put(':id/personal-info')
  @ApiOperation({ 
    summary: 'Update personal information',
    description: 'Updates customer personal information in the onboarding process'
  })
  @ApiParam({ name: 'id', description: 'Onboarding ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Personal information updated successfully',
    type: OnboardingResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Onboarding not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid data or onboarding state' 
  })
  async updatePersonalInfo(
    @Param('id', ParseUUIDPipe) onboardingId: string,
    @Body() dto: UpdatePersonalInfoDto,
    @Request() req: any,
  ): Promise<OnboardingResponseDto> {
    try {
      const companyId = req.user.companyId;
      
      return await this.onboardingService.updatePersonalInfo(
        onboardingId,
        companyId,
        dto,
      );
    } catch (error) {
      this.logger.error(`Failed to update personal info for onboarding ${onboardingId}`, getErrorStack(error));
      throw new HttpException(
        getErrorMessage(error) || 'Failed to update personal information',
        getErrorStatus(error, HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  /**
   * Update contact information step
   */
  @Put(':id/contact-info')
  @ApiOperation({ 
    summary: 'Update contact information',
    description: 'Updates customer contact information in the onboarding process'
  })
  @ApiParam({ name: 'id', description: 'Onboarding ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Contact information updated successfully',
    type: OnboardingResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Phone number or email already exists' 
  })
  async updateContactInfo(
    @Param('id', ParseUUIDPipe) onboardingId: string,
    @Body() dto: UpdateContactInfoDto,
    @Request() req: any,
  ): Promise<OnboardingResponseDto> {
    try {
      const companyId = req.user.companyId;
      
      return await this.onboardingService.updateContactInfo(
        onboardingId,
        companyId,
        dto,
      );
    } catch (error) {
      this.logger.error(`Failed to update contact info for onboarding ${onboardingId}`, getErrorStack(error));
      throw new HttpException(
        getErrorMessage(error) || 'Failed to update contact information',
        getErrorStatus(error, HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  /**
   * Update identification information step
   */
  @Put(':id/identification')
  @ApiOperation({ 
    summary: 'Update identification information',
    description: 'Updates customer identification information in the onboarding process'
  })
  @ApiParam({ name: 'id', description: 'Onboarding ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Identification information updated successfully',
    type: OnboardingResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Identification number already exists' 
  })
  async updateIdentification(
    @Param('id', ParseUUIDPipe) onboardingId: string,
    @Body() dto: UpdateIdentificationDto,
    @Request() req: any,
  ): Promise<OnboardingResponseDto> {
    try {
      const companyId = req.user.companyId;
      
      return await this.onboardingService.updateIdentification(
        onboardingId,
        companyId,
        dto,
      );
    } catch (error) {
      this.logger.error(`Failed to update identification for onboarding ${onboardingId}`, getErrorStack(error));
      throw new HttpException(
        getErrorMessage(error) || 'Failed to update identification information',
        getErrorStatus(error, HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  /**
   * Update account preferences step
   */
  @Put(':id/account-preferences')
  @ApiOperation({ 
    summary: 'Update account preferences',
    description: 'Updates customer account preferences in the onboarding process'
  })
  @ApiParam({ name: 'id', description: 'Onboarding ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Account preferences updated successfully',
    type: OnboardingResponseDto 
  })
  async updateAccountPreferences(
    @Param('id', ParseUUIDPipe) onboardingId: string,
    @Body() dto: UpdateAccountPreferencesDto,
    @Request() req: any,
  ): Promise<OnboardingResponseDto> {
    try {
      const companyId = req.user.companyId;
      
      return await this.onboardingService.updateAccountPreferences(
        onboardingId,
        companyId,
        dto,
      );
    } catch (error) {
      this.logger.error(`Failed to update account preferences for onboarding ${onboardingId}`, getErrorStack(error));
      throw new HttpException(
        getErrorMessage(error) || 'Failed to update account preferences',
        getErrorStatus(error, HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  /**
   * Upload document
   */
  @Post(':id/documents')
  @ApiOperation({ 
    summary: 'Upload document',
    description: 'Uploads a document for the onboarding process'
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Onboarding ID' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Document uploaded successfully',
    type: OnboardingResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid file or file too large' 
  })
  async uploadDocument(
    @Param('id', ParseUUIDPipe) onboardingId: string,
    @Body() dto: UploadDocumentDto,
    @Request() req: any,
  ): Promise<OnboardingResponseDto> {
    try {
      const companyId = req.user.companyId;
      
      return await this.onboardingService.uploadDocument(
        onboardingId,
        companyId,
        dto,
      );
    } catch (error) {
      this.logger.error(`Failed to upload document for onboarding ${onboardingId}`, getErrorStack(error));
      throw new HttpException(
        getErrorMessage(error) || 'Failed to upload document',
        getErrorStatus(error, HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  /**
   * Verify uploaded document
   */
  @Patch(':id/documents/verify')
  @ApiOperation({ 
    summary: 'Verify document',
    description: 'Verifies an uploaded document (requires clerk/admin role)'
  })
  @ApiParam({ name: 'id', description: 'Onboarding ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Document verified successfully',
    type: OnboardingResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions to verify documents' 
  })
  async verifyDocument(
    @Param('id', ParseUUIDPipe) onboardingId: string,
    @Body() dto: VerifyDocumentDto,
    @Request() req: any,
  ): Promise<OnboardingResponseDto> {
    try {
      const companyId = req.user.companyId;
      const verifiedBy = req.user.sub;
      
      return await this.onboardingService.verifyDocument(
        onboardingId,
        companyId,
        dto,
        verifiedBy,
      );
    } catch (error) {
      this.logger.error(`Failed to verify document for onboarding ${onboardingId}`, getErrorStack(error));
      throw new HttpException(
        getErrorMessage(error) || 'Failed to verify document',
        getErrorStatus(error, HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  /**
   * Submit onboarding for verification
   */
  @Post(':id/submit')
  @ApiOperation({ 
    summary: 'Submit onboarding',
    description: 'Submits the onboarding for verification'
  })
  @ApiParam({ name: 'id', description: 'Onboarding ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Onboarding submitted successfully',
    type: OnboardingResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Onboarding incomplete or invalid state' 
  })
  async submitOnboarding(
    @Param('id', ParseUUIDPipe) onboardingId: string,
    @Body() dto: SubmitOnboardingDto,
    @Request() req: any,
  ): Promise<OnboardingResponseDto> {
    try {
      const companyId = req.user.companyId;
      
      return await this.onboardingService.submitOnboarding(
        onboardingId,
        companyId,
        dto,
      );
    } catch (error) {
      this.logger.error(`Failed to submit onboarding ${onboardingId}`, getErrorStack(error));
      throw new HttpException(
        getErrorMessage(error) || 'Failed to submit onboarding',
        getErrorStatus(error, HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  /**
   * Approve onboarding
   */
  @Post(':id/approve')
  @ApiOperation({ 
    summary: 'Approve onboarding',
    description: 'Approves the onboarding and creates customer account (requires clerk/admin role)'
  })
  @ApiParam({ name: 'id', description: 'Onboarding ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Onboarding approved successfully',
    type: OnboardingResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Onboarding not in pending verification state' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions to approve onboarding' 
  })
  async approveOnboarding(
    @Param('id', ParseUUIDPipe) onboardingId: string,
    @Body() dto: ApproveOnboardingDto,
    @Request() req: any,
  ): Promise<OnboardingResponseDto> {
    try {
      const companyId = req.user.companyId;
      const approvedBy = req.user.sub;
      
      return await this.onboardingService.approveOnboarding(
        onboardingId,
        companyId,
        dto,
        approvedBy,
      );
    } catch (error) {
      this.logger.error(`Failed to approve onboarding ${onboardingId}`, getErrorStack(error));
      throw new HttpException(
        getErrorMessage(error) || 'Failed to approve onboarding',
        getErrorStatus(error, HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  /**
   * Reject onboarding
   */
  @Post(':id/reject')
  @ApiOperation({ 
    summary: 'Reject onboarding',
    description: 'Rejects the onboarding with reason (requires clerk/admin role)'
  })
  @ApiParam({ name: 'id', description: 'Onboarding ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Onboarding rejected successfully',
    type: OnboardingResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Onboarding not in pending verification state' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions to reject onboarding' 
  })
  async rejectOnboarding(
    @Param('id', ParseUUIDPipe) onboardingId: string,
    @Body() dto: RejectOnboardingDto,
    @Request() req: any,
  ): Promise<OnboardingResponseDto> {
    try {
      const companyId = req.user.companyId;
      const rejectedBy = req.user.sub;
      
      return await this.onboardingService.rejectOnboarding(
        onboardingId,
        companyId,
        dto,
        rejectedBy,
      );
    } catch (error) {
      this.logger.error(`Failed to reject onboarding ${onboardingId}`, getErrorStack(error));
      throw new HttpException(
        getErrorMessage(error) || 'Failed to reject onboarding',
        getErrorStatus(error, HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  /**
   * Get onboarding by ID
   */
  @Get(':id')
  @ApiOperation({ 
    summary: 'Get onboarding details',
    description: 'Retrieves onboarding details by ID'
  })
  @ApiParam({ name: 'id', description: 'Onboarding ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Onboarding details retrieved successfully',
    type: OnboardingResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Onboarding not found' 
  })
  async getOnboarding(
    @Param('id', ParseUUIDPipe) onboardingId: string,
    @Request() req: any,
  ): Promise<OnboardingResponseDto> {
    try {
      const companyId = req.user.companyId;
      
      return await this.onboardingService.getOnboarding(onboardingId, companyId);
    } catch (error) {
      this.logger.error(`Failed to get onboarding ${onboardingId}`, getErrorStack(error));
      throw new HttpException(
        getErrorMessage(error) || 'Failed to retrieve onboarding',
        getErrorStatus(error, HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  /**
   * List onboardings with filtering and pagination
   */
  @Get()
  @ApiOperation({ 
    summary: 'List onboardings',
    description: 'Lists onboardings with filtering, sorting, and pagination'
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'agentId', required: false, description: 'Filter by agent ID' })
  @ApiQuery({ name: 'currentStep', required: false, description: 'Filter by current step' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Filter by date from (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Filter by date to (YYYY-MM-DD)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by customer name or phone' })
  @ApiQuery({ name: 'expired', required: false, type: Boolean, description: 'Show only expired records' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Onboardings retrieved successfully',
    type: OnboardingListResponseDto 
  })
  async listOnboardings(
    @Query(new ValidationPipe({ transform: true })) query: OnboardingQueryDto,
    @Request() req: any,
  ): Promise<OnboardingListResponseDto> {
    try {
      const companyId = req.user.companyId;
      
      return await this.onboardingService.listOnboardings(companyId, query);
    } catch (error) {
      this.logger.error('Failed to list onboardings', getErrorStack(error));
      throw new HttpException(
        getErrorMessage(error) || 'Failed to retrieve onboardings',
        getErrorStatus(error, HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  /**
   * Get onboarding statistics
   */
  @Get('stats/summary')
  @ApiOperation({ 
    summary: 'Get onboarding statistics',
    description: 'Retrieves onboarding statistics and analytics'
  })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Filter by date from (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Filter by date to (YYYY-MM-DD)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Statistics retrieved successfully',
    type: OnboardingStatsResponseDto 
  })
  async getOnboardingStats(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Request() req?: any,
  ): Promise<OnboardingStatsResponseDto> {
    try {
      const companyId = req.user.companyId;
      
      return await this.onboardingService.getOnboardingStats(companyId, dateFrom, dateTo);
    } catch (error) {
      this.logger.error('Failed to get onboarding statistics', getErrorStack(error));
      throw new HttpException(
        getErrorMessage(error) || 'Failed to retrieve statistics',
        getErrorStatus(error, HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  /**
   * Abandon onboarding
   */
  @Delete(':id/abandon')
  @ApiOperation({ 
    summary: 'Abandon onboarding',
    description: 'Abandons an onboarding process'
  })
  @ApiParam({ name: 'id', description: 'Onboarding ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Onboarding abandoned successfully',
    type: OnboardingResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Onboarding cannot be abandoned in current state' 
  })
  async abandonOnboarding(
    @Param('id', ParseUUIDPipe) onboardingId: string,
    @Body() dto: UpdateOnboardingStatusDto,
    @Request() req: any,
  ): Promise<OnboardingResponseDto> {
    try {
      const companyId = req.user.companyId;
      
      return await this.onboardingService.abandonOnboarding(
        onboardingId,
        companyId,
        dto.reason,
      );
    } catch (error) {
      this.logger.error(`Failed to abandon onboarding ${onboardingId}`, getErrorStack(error));
      throw new HttpException(
        getErrorMessage(error) || 'Failed to abandon onboarding',
        getErrorStatus(error, HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  /**
   * Batch process expired onboardings (admin only)
   */
  @Post('admin/process-expired')
  @ApiOperation({ 
    summary: 'Process expired onboardings',
    description: 'Batch processes expired onboardings (admin only)'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Expired onboardings processed successfully',
    schema: {
      type: 'object',
      properties: {
        processedCount: {
          type: 'number',
          description: 'Number of expired onboardings processed',
          example: 5,
        },
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Admin role required' 
  })
  async processExpiredOnboardings(
    @Request() req: any,
  ): Promise<{ processedCount: number }> {
    try {
      // TODO: Add admin role check
      const processedCount = await this.onboardingService.processExpiredOnboardings();
      
      return { processedCount };
    } catch (error) {
      this.logger.error('Failed to process expired onboardings', getErrorStack(error));
      throw new HttpException(
        getErrorMessage(error) || 'Failed to process expired onboardings',
        getErrorStatus(error, HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  /**
   * Health check endpoint
   */
  @Get('health/check')
  @ApiOperation({ 
    summary: 'Health check',
    description: 'Health check for the onboarding service'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' },
        service: { type: 'string', example: 'customer-onboarding' },
      },
    },
  })
  healthCheck(): { status: string; timestamp: string; service: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'customer-onboarding',
    };
  }
}