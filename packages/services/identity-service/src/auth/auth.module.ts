import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { TenantGuard } from './guards/tenant.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
        signOptions: { 
          expiresIn: '24h',
          issuer: 'sabs-v2',
          audience: 'sabs-v2-api',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    JwtAuthGuard,
    RolesGuard,
    TenantGuard,
    // Apply JWT guard globally to all routes by default
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Apply roles guard globally after JWT guard
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // Apply tenant guard globally for multi-tenancy
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
  ],
  exports: [AuthService, JwtAuthGuard, RolesGuard, TenantGuard],
})
export class AuthModule {}