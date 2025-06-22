import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto, UserListResponseDto } from './dto/user.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@sabs/common';
import { AuthUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiBody({ type: CreateUserDto })
  async create(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
    @CurrentUser() currentUser: AuthUser,
  ): Promise<UserResponseDto> {
    // Company admins can only create users for their own company
    if (currentUser.role === UserRole.COMPANY_ADMIN) {
      createUserDto.companyId = currentUser.companyId;
    }

    const user = await this.usersService.create(createUserDto);
    
    // Remove sensitive information
    const { password, resetToken, resetTokenExpiry, ...userResponse } = user;
    return userResponse as UserResponseDto;
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get all users with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: UserListResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole, description: 'Filter by role' })
  @ApiQuery({ name: 'companyId', required: false, type: String, description: 'Filter by company ID' })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('role') role?: UserRole,
    @Query('companyId') companyId?: string,
    @CurrentUser() currentUser: AuthUser,
  ): Promise<UserListResponseDto> {
    // Company admins can only see users from their own company
    if (currentUser.role === UserRole.COMPANY_ADMIN) {
      companyId = currentUser.companyId;
    }

    const result = await this.usersService.findAll(companyId, role, page, limit);
    
    // Remove sensitive information from all users
    const users = result.users.map(user => {
      const { password, resetToken, resetTokenExpiry, ...userResponse } = user;
      return userResponse as UserResponseDto;
    });

    return {
      ...result,
      users,
    };
  }

  @Get('search')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.CLERK)
  @ApiOperation({ summary: 'Search users by name or email' })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: [UserResponseDto],
  })
  @ApiQuery({ name: 'q', type: String, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum results' })
  async search(
    @Query('q') query: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @CurrentUser() currentUser: AuthUser,
  ): Promise<UserResponseDto[]> {
    // Non-super-admins can only search within their company
    const companyId = currentUser.role === UserRole.SUPER_ADMIN ? undefined : currentUser.companyId;
    
    const users = await this.usersService.search(query, companyId, limit);
    
    return users.map(user => {
      const { password, resetToken, resetTokenExpiry, ...userResponse } = user;
      return userResponse as UserResponseDto;
    });
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({
    status: 200,
    description: 'User statistics',
  })
  async getStats(@CurrentUser() currentUser: AuthUser) {
    const companyId = currentUser.role === UserRole.SUPER_ADMIN ? undefined : currentUser.companyId;
    
    const stats = {
      totalUsers: companyId 
        ? await this.usersService.countByCompany(companyId)
        : await this.usersService.countByRole(UserRole.FIELD_AGENT),
      adminCount: await this.usersService.countByRole(UserRole.COMPANY_ADMIN, companyId),
      clerkCount: await this.usersService.countByRole(UserRole.CLERK, companyId),
      agentCount: await this.usersService.countByRole(UserRole.FIELD_AGENT, companyId),
    };

    return stats;
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.CLERK)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User found',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthUser,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has permission to view this user
    if (currentUser.role !== UserRole.SUPER_ADMIN && user.companyId !== currentUser.companyId) {
      throw new Error('Access denied');
    }

    const { password, resetToken, resetTokenExpiry, ...userResponse } = user;
    return userResponse as UserResponseDto;
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiBody({ type: UpdateUserDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: AuthUser,
  ): Promise<UserResponseDto> {
    const existingUser = await this.usersService.findById(id);
    
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Check permissions
    if (currentUser.role === UserRole.COMPANY_ADMIN) {
      // Company admins can only update users in their company
      if (existingUser.companyId !== currentUser.companyId) {
        throw new Error('Access denied');
      }
      // Company admins cannot change company ID
      delete updateUserDto.companyId;
    }

    const user = await this.usersService.update(id, updateUserDto);
    
    const { password, resetToken, resetTokenExpiry, ...userResponse } = user;
    return userResponse as UserResponseDto;
  }

  @Patch(':id/activate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate user' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  async activate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthUser,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findById(id);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Check permissions
    if (currentUser.role === UserRole.COMPANY_ADMIN && user.companyId !== currentUser.companyId) {
      throw new Error('Access denied');
    }

    await this.usersService.setActiveStatus(id, true);
    return { message: 'User activated successfully' };
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate user' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthUser,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findById(id);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Check permissions
    if (currentUser.role === UserRole.COMPANY_ADMIN && user.companyId !== currentUser.companyId) {
      throw new Error('Access denied');
    }

    // Prevent deactivating self
    if (user.id === currentUser.id) {
      throw new Error('Cannot deactivate your own account');
    }

    await this.usersService.setActiveStatus(id, false);
    return { message: 'User deactivated successfully' };
  }

  @Patch(':id/unlock')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlock user account' })
  @ApiResponse({ status: 200, description: 'User account unlocked successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  async unlock(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthUser,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findById(id);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Check permissions
    if (currentUser.role === UserRole.COMPANY_ADMIN && user.companyId !== currentUser.companyId) {
      throw new Error('Access denied');
    }

    await this.usersService.unlockAccount(id);
    return { message: 'User account unlocked successfully' };
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete user (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }
}