// Simple API mocking solution without external dependencies
interface MockResponse {
  status: number;
  data: any;
  delay?: number;
}

interface MockEndpoint {
  method: string;
  url: string;
  response: MockResponse;
  called: boolean;
  callCount: number;
  lastCall?: any;
}

// Mock data generators
export const MockDataGenerators = {
  workflow: (overrides: any = {}) => ({
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

  user: (overrides: any = {}) => ({
    id: 'USER-' + Math.random().toString(36).substr(2, 9),
    name: 'Test User',
    email: 'test@example.com',
    role: 'clerk',
    permissions: ['view_workflows', 'approve_workflows'],
    isActive: true,
    lastLogin: new Date().toISOString(),
    ...overrides
  }),

  dashboardStats: () => ({
    totalPending: 125,
    highPriority: 23,
    overdueCount: 8,
    avgProcessingTime: 4.5,
    completionRate: 92.3,
    slaCompliance: 89.7,
    todayProcessed: 45,
    weeklyTrend: [32, 45, 38, 42, 51, 39, 45]
  }),

  notification: (overrides: any = {}) => ({
    id: 'NOT-' + Math.random().toString(36).substr(2, 9),
    type: 'workflow_assignment',
    title: 'New workflow assigned',
    message: 'Workflow WF-123 has been assigned to you',
    isRead: false,
    createdAt: new Date().toISOString(),
    ...overrides
  })
};

// Mock endpoints configuration
export const mockEndpoints: Record<string, MockEndpoint> = {
  'GET /api/approval-workflow/workflows': {
    method: 'GET',
    url: '/api/approval-workflow/workflows',
    response: {
      status: 200,
      data: {
        workflows: Array.from({ length: 10 }, () => MockDataGenerators.workflow()),
        pagination: {
          page: 1,
          limit: 10,
          totalCount: 100,
          totalPages: 10,
          currentPage: 1
        }
      }
    },
    called: false,
    callCount: 0
  },

  'GET /api/approval-workflow/workflows/:id': {
    method: 'GET',
    url: '/api/approval-workflow/workflows/:id',
    response: {
      status: 200,
      data: {
        workflow: {
          ...MockDataGenerators.workflow(),
          customer: {
            id: 'CUST-123',
            name: 'Test Customer',
            email: 'customer@example.com',
            phone: '+233123456789',
            accountNumber: 'ACC-123456',
            tier: 'gold',
            kycStatus: 'verified',
            riskProfile: 'medium'
          },
          transactionContext: {
            accountBalance: 150000,
            monthlyWithdrawals: 45000,
            last30DaysTransactions: 12,
            averageTransactionAmount: 8500,
            lastWithdrawal: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        }
      }
    },
    called: false,
    callCount: 0
  },

  'POST /api/approval-workflow/workflows/:id/approve': {
    method: 'POST',
    url: '/api/approval-workflow/workflows/:id/approve',
    response: {
      status: 200,
      data: {
        success: true,
        message: 'Workflow approved successfully',
        workflowId: 'WF-123',
        approvedAt: new Date().toISOString()
      }
    },
    called: false,
    callCount: 0
  },

  'POST /api/approval-workflow/workflows/:id/reject': {
    method: 'POST',
    url: '/api/approval-workflow/workflows/:id/reject',
    response: {
      status: 200,
      data: {
        success: true,
        message: 'Workflow rejected successfully',
        workflowId: 'WF-123',
        rejectedAt: new Date().toISOString()
      }
    },
    called: false,
    callCount: 0
  },

  'GET /api/approval-workflow/dashboard/stats': {
    method: 'GET',
    url: '/api/approval-workflow/dashboard/stats',
    response: {
      status: 200,
      data: MockDataGenerators.dashboardStats()
    },
    called: false,
    callCount: 0
  },

  'GET /api/approval-workflow/dashboard/queue-metrics': {
    method: 'GET',
    url: '/api/approval-workflow/dashboard/queue-metrics',
    response: {
      status: 200,
      data: {
        totalPending: 125,
        totalApproved: 890,
        totalRejected: 45,
        averageProcessingTime: 4.5,
        slaCompliance: 89.7,
        riskDistribution: [
          { riskLevel: 'low', count: 45 },
          { riskLevel: 'medium', count: 67 },
          { riskLevel: 'high', count: 13 }
        ]
      }
    },
    called: false,
    callCount: 0
  },

  'GET /api/notifications': {
    method: 'GET',
    url: '/api/notifications',
    response: {
      status: 200,
      data: {
        notifications: Array.from({ length: 5 }, () => MockDataGenerators.notification())
      }
    },
    called: false,
    callCount: 0
  }
};

// Mock fetch implementation
export class MockFetch {
  private originalFetch: typeof global.fetch;

  constructor() {
    this.originalFetch = global.fetch;
  }

  install() {
    global.fetch = this.mockFetch.bind(this);
  }

  restore() {
    global.fetch = this.originalFetch;
  }

  private async mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method || 'GET';
    const key = `${method} ${url}`;

    // Find matching endpoint (handle URL parameters)
    const endpoint = this.findMatchingEndpoint(method, url);
    
    if (endpoint) {
      // Track the API call
      endpoint.called = true;
      endpoint.callCount++;
      endpoint.lastCall = { url, method, body: init?.body };

      // Simulate network delay if specified
      if (endpoint.response.delay) {
        await new Promise(resolve => setTimeout(resolve, endpoint.response.delay));
      }

      // Create mock response
      const response = new Response(
        JSON.stringify(endpoint.response.data),
        {
          status: endpoint.response.status,
          statusText: endpoint.response.status === 200 ? 'OK' : 'Error',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response;
    }

    // Fallback to original fetch for unmocked endpoints
    return this.originalFetch(input, init);
  }

  private findMatchingEndpoint(method: string, url: string): MockEndpoint | undefined {
    const normalizedUrl = this.normalizeUrl(url);
    
    // Try exact match first
    const exactKey = `${method} ${normalizedUrl}`;
    if (mockEndpoints[exactKey]) {
      return mockEndpoints[exactKey];
    }

    // Try pattern matching for parameterized URLs
    for (const [key, endpoint] of Object.entries(mockEndpoints)) {
      if (endpoint.method === method && this.urlMatches(endpoint.url, normalizedUrl)) {
        return endpoint;
      }
    }

    return undefined;
  }

  private normalizeUrl(url: string): string {
    // Remove query parameters and hash for matching
    return url.split('?')[0].split('#')[0];
  }

  private urlMatches(pattern: string, url: string): boolean {
    // Convert URL pattern to regex (e.g., /api/workflows/:id -> /api/workflows/[^/]+)
    const regex = pattern.replace(/:[\w]+/g, '[^/]+');
    return new RegExp(`^${regex}$`).test(url);
  }

  // Test utilities
  resetCallHistory() {
    Object.values(mockEndpoints).forEach(endpoint => {
      endpoint.called = false;
      endpoint.callCount = 0;
      endpoint.lastCall = undefined;
    });
  }

  getCallHistory(endpointKey: string) {
    return mockEndpoints[endpointKey];
  }

  getAllCallHistory() {
    return Object.entries(mockEndpoints).reduce((history, [key, endpoint]) => {
      history[key] = {
        called: endpoint.called,
        callCount: endpoint.callCount,
        lastCall: endpoint.lastCall
      };
      return history;
    }, {} as Record<string, any>);
  }

  // Dynamic endpoint modification for tests
  setEndpointResponse(endpointKey: string, response: MockResponse) {
    if (mockEndpoints[endpointKey]) {
      mockEndpoints[endpointKey].response = response;
    }
  }

  setEndpointDelay(endpointKey: string, delay: number) {
    if (mockEndpoints[endpointKey]) {
      mockEndpoints[endpointKey].response.delay = delay;
    }
  }

  // Error simulation
  simulateError(endpointKey: string, status: number, message: string) {
    this.setEndpointResponse(endpointKey, {
      status,
      data: {
        error: message,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Network simulation
  simulateSlowNetwork(endpointKey: string, delay: number) {
    this.setEndpointDelay(endpointKey, delay);
  }
}

// Global mock instance
export const mockFetch = new MockFetch();

// Test setup helpers
export const setupApiMocks = () => {
  beforeEach(() => {
    mockFetch.install();
    mockFetch.resetCallHistory();
  });

  afterEach(() => {
    mockFetch.restore();
  });
};

// Custom test assertions
export const ApiAssertions = {
  wasApiCalled: (endpointKey: string) => {
    const endpoint = mockEndpoints[endpointKey];
    return endpoint ? endpoint.called : false;
  },

  getApiCallCount: (endpointKey: string) => {
    const endpoint = mockEndpoints[endpointKey];
    return endpoint ? endpoint.callCount : 0;
  },

  getLastApiCall: (endpointKey: string) => {
    const endpoint = mockEndpoints[endpointKey];
    return endpoint ? endpoint.lastCall : null;
  },

  expectApiCalled: (endpointKey: string, times?: number) => {
    const endpoint = mockEndpoints[endpointKey];
    expect(endpoint?.called).toBe(true);
    if (times !== undefined) {
      expect(endpoint?.callCount).toBe(times);
    }
  },

  expectApiNotCalled: (endpointKey: string) => {
    const endpoint = mockEndpoints[endpointKey];
    expect(endpoint?.called).toBe(false);
  }
};