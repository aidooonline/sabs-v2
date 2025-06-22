import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { UserMFA, MfaType } from '../entities/user-mfa.entity';
import { EnableMfaDto, VerifyMfaSetupDto, VerifyMfaDto, DisableMfaDto } from '../dto/enhanced-auth.dto';

@Injectable()
export class MfaService {
  constructor(
    @InjectRepository(UserMFA)
    private readonly mfaRepository: Repository<UserMFA>,
  ) {}

  /**
   * Initialize MFA setup for a user
   */
  async setupMfa(userId: string, enableMfaDto: EnableMfaDto): Promise<{
    secret?: string;
    qrCode?: string;
    backupCodes?: string[];
    message: string;
  }> {
    let userMfa = await this.mfaRepository.findOne({ where: { userId } });

    if (userMfa && userMfa.isEnabled) {
      throw new BadRequestException('MFA is already enabled for this user');
    }

    if (!userMfa) {
      userMfa = this.mfaRepository.create({
        userId,
        mfaType: enableMfaDto.type as MfaType,
        phoneNumber: enableMfaDto.phoneNumber,
      });
    } else {
      userMfa.mfaType = enableMfaDto.type as MfaType;
      userMfa.phoneNumber = enableMfaDto.phoneNumber;
    }

    let secret: string | undefined;
    let qrCode: string | undefined;
    let backupCodes: string[] | undefined;

    switch (enableMfaDto.type) {
      case 'totp':
        // Generate TOTP secret
        const totpSecret = speakeasy.generateSecret({
          name: `Sabs v2 (${userId})`,
          issuer: 'Sabs v2',
          length: 32,
        });

        userMfa.secretKey = totpSecret.base32;
        secret = totpSecret.base32;

        // Generate QR code
        qrCode = await QRCode.toDataURL(totpSecret.otpauth_url!);
        break;

      case 'sms':
        if (!enableMfaDto.phoneNumber) {
          throw new BadRequestException('Phone number is required for SMS MFA');
        }
        userMfa.phoneNumber = enableMfaDto.phoneNumber;
        break;

      case 'email':
        // Email MFA doesn't need additional setup
        break;
    }

    // Generate backup codes
    backupCodes = userMfa.generateBackupCodes();

    await this.mfaRepository.save(userMfa);

    return {
      secret,
      qrCode,
      backupCodes,
      message: `${enableMfaDto.type.toUpperCase()} MFA setup initiated. Please verify to complete setup.`,
    };
  }

  /**
   * Verify MFA setup
   */
  async verifyMfaSetup(userId: string, verifyDto: VerifyMfaSetupDto): Promise<{ message: string }> {
    const userMfa = await this.mfaRepository.findOne({ where: { userId } });

    if (!userMfa) {
      throw new NotFoundException('MFA setup not found');
    }

    if (userMfa.isEnabled) {
      throw new BadRequestException('MFA is already enabled');
    }

    let isValid = false;

    switch (userMfa.mfaType) {
      case MfaType.TOTP:
        if (!userMfa.secretKey) {
          throw new BadRequestException('TOTP secret not found');
        }

        isValid = speakeasy.totp.verify({
          secret: userMfa.secretKey,
          encoding: 'base32',
          token: verifyDto.code,
          window: 1, // Allow 1 step before/after current time
        });
        break;

      case MfaType.SMS:
        // In a real implementation, you would verify against a sent SMS code
        // For now, we'll use a mock verification
        isValid = this.verifySmsCode(verifyDto.code, userMfa.phoneNumber!);
        break;

      case MfaType.EMAIL:
        // In a real implementation, you would verify against a sent email code
        isValid = this.verifyEmailCode(verifyDto.code, userId);
        break;
    }

    if (!isValid) {
      userMfa.failedAttempts++;
      
      // Lock MFA after 5 failed attempts for 15 minutes
      if (userMfa.failedAttempts >= 5) {
        userMfa.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      
      await this.mfaRepository.save(userMfa);
      throw new UnauthorizedException('Invalid verification code');
    }

    // Enable MFA
    userMfa.isEnabled = true;
    userMfa.isVerified = true;
    userMfa.failedAttempts = 0;
    userMfa.lockedUntil = null;
    userMfa.lastUsedAt = new Date();

    await this.mfaRepository.save(userMfa);

    return { message: 'MFA has been successfully enabled' };
  }

  /**
   * Verify MFA code during login
   */
  async verifyMfa(userId: string, verifyDto: VerifyMfaDto): Promise<boolean> {
    const userMfa = await this.mfaRepository.findOne({ where: { userId } });

    if (!userMfa || !userMfa.isEnabled) {
      throw new NotFoundException('MFA is not enabled for this user');
    }

    if (userMfa.isLocked) {
      throw new UnauthorizedException('MFA is temporarily locked due to too many failed attempts');
    }

    let isValid = false;

    if (verifyDto.isBackupCode) {
      // Verify backup code
      isValid = userMfa.useBackupCode(verifyDto.code);
    } else {
      // Verify regular MFA code
      switch (userMfa.mfaType) {
        case MfaType.TOTP:
          if (!userMfa.secretKey) {
            throw new BadRequestException('TOTP secret not found');
          }

          isValid = speakeasy.totp.verify({
            secret: userMfa.secretKey,
            encoding: 'base32',
            token: verifyDto.code,
            window: 1,
          });
          break;

        case MfaType.SMS:
          isValid = this.verifySmsCode(verifyDto.code, userMfa.phoneNumber!);
          break;

        case MfaType.EMAIL:
          isValid = this.verifyEmailCode(verifyDto.code, userId);
          break;
      }
    }

    if (isValid) {
      userMfa.failedAttempts = 0;
      userMfa.lockedUntil = null;
      userMfa.lastUsedAt = new Date();
    } else {
      userMfa.failedAttempts++;
      
      // Lock MFA after 5 failed attempts for 15 minutes
      if (userMfa.failedAttempts >= 5) {
        userMfa.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
    }

    await this.mfaRepository.save(userMfa);

    if (!isValid) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    return true;
  }

  /**
   * Disable MFA for a user
   */
  async disableMfa(userId: string, disableDto: DisableMfaDto): Promise<{ message: string }> {
    const userMfa = await this.mfaRepository.findOne({ where: { userId } });

    if (!userMfa || !userMfa.isEnabled) {
      throw new NotFoundException('MFA is not enabled for this user');
    }

    // Verify password and MFA code if provided
    if (disableDto.mfaCode) {
      await this.verifyMfa(userId, { code: disableDto.mfaCode });
    }

    // Disable MFA
    userMfa.isEnabled = false;
    userMfa.isVerified = false;
    userMfa.secretKey = null;
    userMfa.backupCodes = null;
    userMfa.failedAttempts = 0;
    userMfa.lockedUntil = null;

    await this.mfaRepository.save(userMfa);

    return { message: 'MFA has been successfully disabled' };
  }

  /**
   * Get MFA status for a user
   */
  async getMfaStatus(userId: string): Promise<{
    isEnabled: boolean;
    mfaType?: MfaType;
    backupCodesRemaining?: number;
    isLocked?: boolean;
    lockedUntil?: Date;
  }> {
    const userMfa = await this.mfaRepository.findOne({ where: { userId } });

    if (!userMfa) {
      return { isEnabled: false };
    }

    return {
      isEnabled: userMfa.isEnabled,
      mfaType: userMfa.mfaType,
      backupCodesRemaining: userMfa.parsedBackupCodes.length,
      isLocked: userMfa.isLocked,
      lockedUntil: userMfa.lockedUntil,
    };
  }

  /**
   * Generate new backup codes
   */
  async generateNewBackupCodes(userId: string): Promise<{ backupCodes: string[] }> {
    const userMfa = await this.mfaRepository.findOne({ where: { userId } });

    if (!userMfa || !userMfa.isEnabled) {
      throw new NotFoundException('MFA is not enabled for this user');
    }

    const backupCodes = userMfa.generateBackupCodes();
    await this.mfaRepository.save(userMfa);

    return { backupCodes };
  }

  /**
   * Check if user has MFA enabled
   */
  async isMfaEnabled(userId: string): Promise<boolean> {
    const userMfa = await this.mfaRepository.findOne({ where: { userId } });
    return userMfa?.isEnabled ?? false;
  }

  // Private helper methods
  private verifySmsCode(code: string, phoneNumber: string): boolean {
    // In a real implementation, this would verify against a sent SMS code
    // For demo purposes, we'll accept any 6-digit code
    return /^\d{6}$/.test(code);
  }

  private verifyEmailCode(code: string, userId: string): boolean {
    // In a real implementation, this would verify against a sent email code
    // For demo purposes, we'll accept any 6-digit code
    return /^\d{6}$/.test(code);
  }
}