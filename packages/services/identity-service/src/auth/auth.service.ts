import { 
  Injectable, 
  UnauthorizedException, 
  BadRequestException,
  ConflictException,
  NotFoundException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { JwtPayload, LoginResponse, AuthUser } from './interfaces/jwt-payload.interface';
import { RegisterDto, ChangePasswordDto, ResetPasswordDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly jwtExpiresIn = '24h';
  private readonly refreshTokenExpiresIn = '7d';
  private readonly saltRounds = 12;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validate user credentials for authentication
   */
  async validateUser(email: string, password: string): Promise<AuthUser | null> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      return null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }

    // Return user without password
    const { password: _password, ...result } = user;
    return result as AuthUser;
  }

  /**
   * Generate JWT tokens for authenticated user
   */
  async login(user: AuthUser): Promise<LoginResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.jwtExpiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.refreshTokenExpiresIn,
    });

    return {
      accessToken,
      refreshToken,
      user,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
    };
  }

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<LoginResponse> {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, this.saltRounds);

    // Create user
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    // Generate tokens and return
    const { password: _password, ...userWithoutPassword } = user;
    return this.login(userWithoutPassword as AuthUser);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token: user not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      const { password: _password, ...userWithoutPassword } = user;
      return this.login(userWithoutPassword as AuthUser);
    } catch (_error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      this.saltRounds
    );

    // Update password
    await this.usersService.updatePassword(userId, hashedNewPassword);
  }

  /**
   * Initiate password reset process
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      // Don't reveal if email exists for security
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token to user
    await this.usersService.updateResetToken(user.id, resetToken, resetTokenExpiry);

    // TODO: Send email with reset link
    // await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  /**
   * Reset password using reset token
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByResetToken(resetPasswordDto.token);

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      resetPasswordDto.newPassword,
      this.saltRounds
    );

    // Update password and clear reset token
    await this.usersService.resetPassword(user.id, hashedPassword);

    return { message: 'Password has been reset successfully' };
  }

  /**
   * Logout user (invalidate token - in practice, this would be handled client-side
   * or with a token blacklist for enhanced security)
   */
  async logout(_userId: string): Promise<{ message: string }> {
    // TODO: Add token to blacklist if implementing server-side token invalidation
    return { message: 'Logged out successfully' };
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<AuthUser> {
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword as AuthUser;
  }

  /**
   * Hash password utility
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify password utility
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}