import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Controllers
import { AuthController } from './auth.controller';
import { EnhancedAuthController } from './controllers/enhanced-auth.controller';

// Services
import { AuthService } from './auth.service';
import { EnhancedAuthService } from './services/enhanced-auth.service';
import { MfaService } from './services/mfa.service';
import { SessionService } from './services/session.service';
import { AuditService } from './services/audit.service';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { TenantGuard } from './guards/tenant.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

// Entities
import { UserSession } from './entities/user-session.entity';
import { UserMFA } from './entities/user-mfa.entity';
import { AuditLog } from './entities/audit-log.entity';

// Other modules
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([UserSession, UserMFA, AuditLog]),
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
    CacheModule.registerAsync({
      useFactory: () => ({
        store: 'redis',
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        ttl: 3600, // 1 hour default TTL
      }),
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
      {
        name: 'medium',
        ttl: 600000, // 10 minutes
        limit: 100, // 100 requests per 10 minutes
      },
      {
        name: 'long',
        ttl: 3600000, // 1 hour
        limit: 1000, // 1000 requests per hour
      },
    ]),
  ],
  controllers: [
    AuthController,
    EnhancedAuthController,
  ],
  providers: [
    // Core Services
    AuthService,
    EnhancedAuthService,
    MfaService,
    SessionService,
    AuditService,

    // Strategies
    JwtStrategy,
    LocalStrategy,

    // Guards
    JwtAuthGuard,
    RolesGuard,
    TenantGuard,

    // Global Guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [
    AuthService,
    EnhancedAuthService,
    MfaService,
    SessionService,
    AuditService,
    JwtAuthGuard,
    RolesGuard,
    TenantGuard,
  ],
})
export class AuthModule {}