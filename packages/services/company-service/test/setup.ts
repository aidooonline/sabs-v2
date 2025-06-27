import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Global test setup
beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '5432';
  process.env.DB_NAME = 'sabs_v2_test';
  process.env.DB_USERNAME = 'test';
  process.env.DB_PASSWORD = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long';
});

afterAll(async () => {
  // Cleanup after all tests
});

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
});

// Test database configuration
export const getTestTypeOrmConfig = () => ({
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'test',
  password: process.env.DB_PASSWORD || 'test',
  database: process.env.DB_NAME || 'sabs_v2_test',
  entities: ['src/**/*.entity.ts'],
  synchronize: true,
  dropSchema: true,
  logging: false,
});

// Helper function to create test module
export const createTestingModule = async (providers: any[] = [], imports: any[] = []) => {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
      }),
      TypeOrmModule.forRoot(getTestTypeOrmConfig()),
      ...imports,
    ],
    providers,
  }).compile();
};

// Test data generators for company service
export const TestDataGenerators = {
  company: (overrides = {}) => ({
    id: 'test-company-id',
    name: 'Test Company Ltd',
    email: 'admin@testcompany.com',
    phone: '+233123456789',
    address: 'Test Address, Accra, Ghana',
    registrationNumber: 'REG123456',
    taxId: 'TAX123456',
    industry: 'Microfinance',
    isActive: true,
    subscriptionTier: 'premium',
    maxUsers: 100,
    maxCustomers: 10000,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  serviceCredit: (overrides = {}) => ({
    id: 'test-service-credit-id',
    companyId: 'test-company-id',
    serviceType: 'SMS',
    credits: 1000,
    usedCredits: 150,
    remainingCredits: 850,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  staff: (overrides = {}) => ({
    id: 'test-staff-id',
    companyId: 'test-company-id',
    userId: 'test-user-id',
    role: 'manager',
    department: 'Operations',
    isActive: true,
    permissions: ['read:customers', 'write:transactions'],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  companySettings: (overrides = {}) => ({
    id: 'test-settings-id',
    companyId: 'test-company-id',
    autoApprovalLimit: 5000,
    requireTwoFactorAuth: true,
    allowMobileAccess: true,
    businessHours: '08:00-17:00',
    timezone: 'Africa/Accra',
    currency: 'GHS',
    language: 'en',
    ...overrides,
  }),
};