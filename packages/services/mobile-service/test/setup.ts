import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

// Global test setup
beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long';
});

beforeEach(() => {
  jest.clearAllMocks();
});

// Test data generators for mobile service
export const TestDataGenerators = {
  mobileUser: (overrides = {}) => ({
    id: 'test-mobile-user-id',
    deviceId: 'test-device-id',
    userId: 'test-user-id',
    companyId: 'test-company-id',
    deviceType: 'android',
    appVersion: '1.0.0',
    isActive: true,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    ...overrides,
  }),
  
  mobileSession: (overrides = {}) => ({
    id: 'test-session-id',
    userId: 'test-user-id',
    deviceId: 'test-device-id',
    token: 'test-mobile-token',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    isActive: true,
    createdAt: new Date(),
    ...overrides,
  }),
};