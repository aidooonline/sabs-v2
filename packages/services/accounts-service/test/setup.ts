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

beforeEach(() => {
  jest.clearAllMocks();
});

// Test data generators for accounts service
export const TestDataGenerators = {
  customer: (overrides = {}) => ({
    id: 'test-customer-id',
    companyId: 'test-company-id',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+233123456789',
    address: 'Test Address, Accra, Ghana',
    dateOfBirth: new Date('1990-01-01'),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  account: (overrides = {}) => ({
    id: 'test-account-id',
    customerId: 'test-customer-id',
    companyId: 'test-company-id',
    accountNumber: 'ACC001',
    accountType: 'savings',
    balance: 5000.00,
    currency: 'GHS',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  transaction: (overrides = {}) => ({
    id: 'test-transaction-id',
    accountId: 'test-account-id',
    companyId: 'test-company-id',
    type: 'deposit',
    amount: 1000.00,
    description: 'Test transaction',
    status: 'completed',
    createdAt: new Date(),
    ...overrides,
  }),
};