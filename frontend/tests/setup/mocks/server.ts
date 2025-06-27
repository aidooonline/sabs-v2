// Temporary fix for MSW import issue
// import { setupServer } from 'msw/node';
// import { http, HttpResponse } from 'msw';

// Mock server setup - simplified for now
const setupServer = (...handlers: any[]) => ({
  listen: () => {},
  close: () => {},
  resetHandlers: () => {},
});

const http = {
  get: (path: string, handler: any) => ({ path, handler, method: 'GET' }),
  post: (path: string, handler: any) => ({ path, handler, method: 'POST' }),
};

const HttpResponse = {
  json: (data: any, options?: any) => ({ 
    json: () => Promise.resolve(data),
    status: options?.status || 200 
  }),
};

// API response generators
const generateWorkflow = (overrides = {}) => ({
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
});

const generateUser = (overrides = {}) => ({
  id: 'USER-' + Math.random().toString(36).substr(2, 9),
  name: 'Test User',
  email: 'test@example.com',
  role: 'clerk',
  permissions: ['view_workflows', 'approve_workflows'],
  isActive: true,
  lastLogin: new Date().toISOString(),
  ...overrides
});

const generateAuditEvent = (overrides = {}) => ({
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
});

const generateWorkflowList = (count = 10) => {
  return Array.from({ length: count }, () => generateWorkflow());
};

const generateUserList = (count = 5) => {
  return Array.from({ length: count }, () => generateUser());
};

// Mock API handlers
export const handlers = [
  // Workflow endpoints
  http.get('/api/workflows', ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '10';
    const status = url.searchParams.get('status');
    
    let workflows = generateWorkflowList(parseInt(limit));
    
    if (status) {
      workflows = workflows.filter(w => w.status === status);
    }
    
    return HttpResponse.json({
      workflows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: workflows.length,
        totalPages: Math.ceil(workflows.length / parseInt(limit))
      }
    });
  }),

  http.get('/api/workflows/:id', ({ params }) => {
    const { id } = params;
    const workflow = generateWorkflow({ id });
    
    return HttpResponse.json({
      workflow: {
        ...workflow,
        customer: {
          id: workflow.customerId,
          name: workflow.customerName,
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
        },
        documents: [
          {
            id: 'DOC-1',
            type: 'government_id',
            name: 'Ghana Card',
            url: '/api/documents/DOC-1',
            verificationStatus: 'verified',
            uploadedAt: new Date().toISOString()
          }
        ],
        approvalHistory: [
          {
            id: 'APH-1',
            action: 'submitted',
            performedBy: workflow.customerName,
            performedAt: workflow.submittedAt,
            comments: 'Withdrawal request submitted'
          }
        ]
      }
    });
  }),

  http.post('/api/workflows/:id/approve', ({ params }) => {
    const { id } = params;
    
    return HttpResponse.json({
      success: true,
      message: 'Workflow approved successfully',
      workflowId: id,
      approvedAt: new Date().toISOString()
    });
  }),

  http.post('/api/workflows/:id/reject', ({ params }) => {
    const { id } = params;
    
    return HttpResponse.json({
      success: true,
      message: 'Workflow rejected successfully',
      workflowId: id,
      rejectedAt: new Date().toISOString()
    });
  }),

  http.post('/api/workflows/:id/escalate', ({ params }) => {
    const { id } = params;
    
    return HttpResponse.json({
      success: true,
      message: 'Workflow escalated successfully',
      workflowId: id,
      escalatedAt: new Date().toISOString()
    });
  }),

  http.post('/api/workflows/:id/comments', ({ params }) => {
    const { id } = params;
    
    return HttpResponse.json({
      success: true,
      comment: {
        id: 'COM-' + Math.random().toString(36).substr(2, 9),
        workflowId: id,
        content: 'Test comment',
        author: 'Test User',
        createdAt: new Date().toISOString(),
        isInternal: false
      }
    }, { status: 201 });
  }),

  // Dashboard endpoints
  http.get('/api/dashboard/stats', () => {
    return HttpResponse.json({
      totalPending: 125,
      highPriority: 23,
      overdueCount: 8,
      avgProcessingTime: 4.5,
      completionRate: 92.3,
      slaCompliance: 89.7,
      todayProcessed: 45,
      weeklyTrend: [32, 45, 38, 42, 51, 39, 45]
    });
  }),

  http.get('/api/dashboard/queue-distribution', () => {
    return HttpResponse.json({
      byStatus: {
        pending_review: 85,
        in_progress: 32,
        pending_approval: 18,
        approved: 234,
        rejected: 45
      },
      byPriority: {
        low: 45,
        medium: 78,
        high: 23,
        urgent: 5
      },
      byAmount: {
        'under_1k': 89,
        '1k_10k': 156,
        '10k_50k': 67,
        'over_50k': 23
      }
    });
  }),

  // User management endpoints
  http.get('/api/users', () => {
    return HttpResponse.json({
      users: generateUserList(10)
    });
  }),

  http.get('/api/users/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      user: generateUser({ id })
    });
  }),

  // Security endpoints
  http.get('/api/security/audit-events', () => {
    const events = Array.from({ length: 20 }, () => generateAuditEvent());
    
    return HttpResponse.json({
      events,
      total: events.length
    });
  }),

  http.get('/api/security/compliance-violations', () => {
    return HttpResponse.json({
      violations: [
        {
          id: 'VIO-1',
          policyId: 'POL-1',
          policyName: 'Transaction Limits Policy',
          severity: 'high',
          status: 'open',
          userId: 'USER-123',
          userName: 'Test User',
          description: 'Transaction limit exceeded',
          detectedAt: new Date().toISOString()
        }
      ]
    });
  }),

  // Risk assessment endpoints
  http.post('/api/risk/assess/:workflowId', ({ params }) => {
    const { workflowId } = params;
    
    return HttpResponse.json({
      assessmentId: 'RISK-' + Math.random().toString(36).substr(2, 9),
      workflowId,
      overallScore: Math.floor(Math.random() * 100),
      riskLevel: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
      factors: [
        {
          name: 'Transaction Amount',
          score: 65,
          weight: 0.3,
          status: 'warning'
        },
        {
          name: 'Customer History',
          score: 25,
          weight: 0.4,
          status: 'normal'
        }
      ],
      recommendations: [
        'Consider additional verification for high-value transaction',
        'Monitor customer activity for next 30 days'
      ]
    });
  }),

  // Notification endpoints
  http.get('/api/notifications', () => {
    return HttpResponse.json({
      notifications: [
        {
          id: 'NOT-1',
          type: 'workflow_assignment',
          title: 'New workflow assigned',
          message: 'Workflow WF-123 has been assigned to you',
          isRead: false,
          createdAt: new Date().toISOString()
        }
      ]
    });
  }),

  http.post('/api/notifications/:id/mark-read', () => {
    return HttpResponse.json({ success: true });
  }),

  // WebSocket simulation endpoint
  http.get('/api/websocket/status', () => {
    return HttpResponse.json({
      connected: true,
      connectionId: 'WS-' + Math.random().toString(36).substr(2, 9),
      lastHeartbeat: new Date().toISOString()
    });
  }),

  // Error simulation endpoints for testing error handling
  http.get('/api/test/error/:code', ({ params }) => {
    const { code } = params;
    const statusCode = parseInt(code as string);
    
    return HttpResponse.json({
      error: `Simulated ${statusCode} error`,
      message: 'This is a test error for testing error handling'
    }, { status: statusCode });
  }),

  // Slow response simulation for performance testing
  http.get('/api/test/slow/:delay', async ({ params }) => {
    const { delay } = params;
    const delayMs = parseInt(delay as string);
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    return HttpResponse.json({
      message: `Response delayed by ${delayMs}ms`,
      timestamp: new Date().toISOString()
    });
  })
];

// Create and export the server
export const server = setupServer(...handlers);

// Export mock tracking for test assertions
export const mockApiEndpoints = {
  '/api/workflows': { called: false, callCount: 0 },
  '/api/workflows/:id': { called: false, callCount: 0 },
  '/api/workflows/:id/approve': { called: false, callCount: 0 },
  '/api/workflows/:id/reject': { called: false, callCount: 0 },
  '/api/dashboard/stats': { called: false, callCount: 0 }
};

// Intercept handlers to track API calls
handlers.forEach(handler => {
  const originalResolver = (handler as any).resolver;
  (handler as any).resolver = (...args: any[]) => {
    const req = args[0];
    const endpoint = req.url.pathname;
    
    if (mockApiEndpoints[endpoint as keyof typeof mockApiEndpoints]) {
      (mockApiEndpoints[endpoint as keyof typeof mockApiEndpoints] as any).called = true;
      (mockApiEndpoints[endpoint as keyof typeof mockApiEndpoints] as any).callCount++;
    }
    
    return originalResolver(...args);
  };
});