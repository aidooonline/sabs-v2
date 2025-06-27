import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '5432';
  process.env.DB_NAME = 'sabs_v2_test';
  process.env.DB_USERNAME = 'test';
  process.env.DB_PASSWORD = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long';
  process.env.REDIS_URL = 'redis://localhost:6379';
});

afterAll(async () => {
  // Cleanup after all tests
});

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
});

// Mock external dependencies
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    on: jest.fn(),
  })),
}));

// Mock bcrypt for password hashing
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('salt'),
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocked-jwt-token'),
  verify: jest.fn().mockReturnValue({ sub: 'user-id', email: 'test@example.com' }),
  decode: jest.fn().mockReturnValue({ sub: 'user-id', email: 'test@example.com' }),
}));

// Mock Speakeasy for 2FA
jest.mock('speakeasy', () => ({
  generateSecret: jest.fn().mockReturnValue({
    base32: 'test-secret',
    otpauth_url: 'otpauth://test',
  }),
  totp: {
    verify: jest.fn().mockReturnValue({ delta: 0 }),
    generate: jest.fn().mockReturnValue('123456'),
  },
}));

// Test database configuration
export const getTestTypeOrmConfig = () => ({
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'test',
  password: process.env.DB_PASSWORD || 'test',
  database: process.env.DB_NAME || 'sabs_v2_test',
  entities: ['src/**/*.entity.ts'],
  synchronize: true, // Only for tests
  dropSchema: true, // Clean database for each test
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

// Test data generators
export const TestDataGenerators = {
  user: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    passwordHash: 'hashed-password',
    isEmailVerified: true,
    companyId: 'test-company-id',
    role: 'clerk',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  company: (overrides = {}) => ({
    id: 'test-company-id',
    name: 'Test Company',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  loginCredentials: (overrides = {}) => ({
    email: 'test@example.com',
    password: 'TestPassword123!',
    ...overrides,
  }),
  
  jwtPayload: (overrides = {}) => ({
    sub: 'test-user-id',
    email: 'test@example.com',
    companyId: 'test-company-id',
    role: 'clerk',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
  }),
};