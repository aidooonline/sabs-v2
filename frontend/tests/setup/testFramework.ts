import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { server } from './mocks/server';
import { mockEndpoints } from './mocks/apiMocks';

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
});

// Setup MSW server for API mocking
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});

afterAll(() => {
  server.close();
});

// Global test utilities
export const TestFramework = {
  // Mock data generators
  generateWorkflow: (overrides = {}) => ({
    id: 'WF-' + Math.random().toString(36).substr(2, 9),
    customerId: 'CUST-' + Math.random().toString(36).substr(2, 9),
    customerName: 'Test Customer',
    amount: Math.floor(Math.random() * 100000) + 1000,
    currency: 'GHS',
    type: 'withdrawal',
    status: 'pending_review',
    priority: 'medium',
    riskScore: Math.floor(Math.random() * 100),
    submittedAt: new Date().toISOString(),
    assignedTo: null,
    slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides
  }),

  generateUser: (overrides = {}) => ({
    id: 'USER-' + Math.random().toString(36).substr(2, 9),
    name: 'Test User',
    email: 'test@example.com',
    role: 'clerk',
    permissions: ['view_workflows', 'approve_workflows'],
    isActive: true,
    lastLogin: new Date().toISOString(),
    ...overrides
  }),

  generateAuditEvent: (overrides = {}) => ({
    id: 'AUD-' + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    userId: 'USER-123',
    userName: 'Test User',
    action: 'approve_workflow',
    resource: 'workflow',
    resourceId: 'WF-123',
    severity: 'medium',
    category: 'workflow',
    outcome: 'success',
    riskScore: Math.floor(Math.random() * 100),
    ...overrides
  }),

  // Test helpers
  waitForApiCall: (apiEndpoint: string, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkForCall = () => {
        if (mockEndpoints[apiEndpoint]?.called) {
          resolve(mockEndpoints[apiEndpoint]);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`API call to ${apiEndpoint} not made within ${timeout}ms`));
        } else {
          setTimeout(checkForCall, 100);
        }
      };
      checkForCall();
    });
  },

  // Performance testing helpers
  measureRenderTime: async (renderFn: () => void) => {
    const start = performance.now();
    await renderFn();
    const end = performance.now();
    return end - start;
  },

  // Accessibility testing helpers
  checkAccessibility: async (container: HTMLElement) => {
    const { axe } = await import('@axe-core/react');
    const results = await axe(container);
    return results;
  },

  // Memory leak detection
  detectMemoryLeaks: () => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    return {
      getMemoryUsage: () => {
        const currentMemory = (performance as any).memory?.usedJSHeapSize || 0;
        return currentMemory - initialMemory;
      }
    };
  }
};

// Custom matchers
expect.extend({
  toBeWithinSLA(received: string, slaHours: number) {
    const deadline = new Date(received);
    const now = new Date();
    const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    const pass = hoursRemaining <= slaHours && hoursRemaining >= 0;
    
    return {
      message: () => `expected ${received} to be within ${slaHours} hours SLA`,
      pass,
    };
  },

  toHaveValidRiskScore(received: number) {
    const pass = received >= 0 && received <= 100 && Number.isInteger(received);
    
    return {
      message: () => `expected ${received} to be a valid risk score (0-100)`,
      pass,
    };
  },

  toBeAccessible(received: HTMLElement) {
    // This would integrate with axe-core for real accessibility testing
    const hasAriaLabels = received.querySelectorAll('[aria-label], [aria-labelledby]').length > 0;
    const hasProperHeadings = received.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0;
    
    const pass = hasAriaLabels || hasProperHeadings;
    
    return {
      message: () => `expected element to be accessible`,
      pass,
    };
  }
});

// Export types for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinSLA(slaHours: number): R;
      toHaveValidRiskScore(): R;
      toBeAccessible(): R;
    }
  }
}