import { 
  Injectable, 
  NotFoundException, 
  ConflictException,
  BadRequestException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from '@sabs/common';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create a new user
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  /**
   * Find all users with pagination and filtering
   */
  async findAll(
    companyId?: string,
    role?: UserRole,
    page: number = 1,
    limit: number = 10
  ): Promise<{ users: User[]; total: number; page: number; totalPages: number }> {
    const offset = (page - 1) * limit;
    
    const whereConditions: FindOptionsWhere<User> = {};
    
    if (companyId) {
      whereConditions.companyId = companyId;
    }
    
    if (role) {
      whereConditions.role = role;
    }

    const [users, total] = await this.userRepository.findAndCount({
      where: whereConditions,
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ 
      where: { email: email.toLowerCase() } 
    });
  }

  /**
   * Find user by reset token
   */
  async findByResetToken(token: string): Promise<User | null> {
    return await this.userRepository.findOne({ 
      where: { resetToken: token } 
    });
  }

  /**
   * Find users by company ID
   */
  async findByCompanyId(companyId: string): Promise<User[]> {
    return await this.userRepository.find({ 
      where: { companyId },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Update user
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check email uniqueness if email is being updated
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    const result = await this.userRepository.update(id, { 
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    });

    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  /**
   * Update reset token
   */
  async updateResetToken(id: string, token: string, expiry: Date): Promise<void> {
    const result = await this.userRepository.update(id, {
      resetToken: token,
      resetTokenExpiry: expiry,
    });

    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  /**
   * Reset password and clear reset token
   */
  async resetPassword(id: string, hashedPassword: string): Promise<void> {
    const result = await this.userRepository.update(id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
      loginAttempts: 0,
      lockedUntil: null,
    });

    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  /**
   * Activate or deactivate user
   */
  async setActiveStatus(id: string, isActive: boolean): Promise<void> {
    const result = await this.userRepository.update(id, { isActive });

    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  /**
   * Update last login information
   */
  async updateLastLogin(id: string, ip?: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
      lastLoginIp: ip,
      loginAttempts: 0,
      lockedUntil: null,
    });
  }

  /**
   * Increment login attempts and lock account if necessary
   */
  async incrementLoginAttempts(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const attempts = user.loginAttempts + 1;
    const updateData: Partial<User> = { loginAttempts: attempts };

    // Lock account after 5 failed attempts for 30 minutes
    if (attempts >= 5) {
      updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }

    await this.userRepository.update(id, updateData);
  }

  /**
   * Unlock user account
   */
  async unlockAccount(id: string): Promise<void> {
    const result = await this.userRepository.update(id, {
      loginAttempts: 0,
      lockedUntil: null,
    });

    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(id: string): Promise<void> {
    const result = await this.userRepository.update(id, {
      isEmailVerified: true,
      emailVerificationToken: null,
    });

    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  /**
   * Set email verification token
   */
  async setEmailVerificationToken(id: string, token: string): Promise<void> {
    const result = await this.userRepository.update(id, {
      emailVerificationToken: token,
    });

    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  /**
   * Delete user (soft delete by deactivating)
   */
  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete by deactivating instead of hard delete
    await this.setActiveStatus(id, false);
  }

  /**
   * Hard delete user (use with caution)
   */
  async hardDelete(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  /**
   * Count users by company
   */
  async countByCompany(companyId: string): Promise<number> {
    return await this.userRepository.count({ 
      where: { companyId, isActive: true } 
    });
  }

  /**
   * Count users by role
   */
  async countByRole(role: UserRole, companyId?: string): Promise<number> {
    const whereConditions: FindOptionsWhere<User> = { role, isActive: true };
    
    if (companyId) {
      whereConditions.companyId = companyId;
    }

    return await this.userRepository.count({ where: whereConditions });
  }

  /**
   * Search users by name or email
   */
  async search(
    query: string, 
    companyId?: string, 
    limit: number = 10
  ): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    
    queryBuilder.where(
      '(user.firstName ILIKE :query OR user.lastName ILIKE :query OR user.email ILIKE :query)',
      { query: `%${query}%` }
    );

    if (companyId) {
      queryBuilder.andWhere('user.companyId = :companyId', { companyId });
    }

    queryBuilder
      .andWhere('user.isActive = :isActive', { isActive: true })
      .orderBy('user.firstName', 'ASC')
      .limit(limit);

    return await queryBuilder.getMany();
  }
}