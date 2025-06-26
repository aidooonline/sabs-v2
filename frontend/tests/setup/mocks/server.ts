import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { TestFramework } from '../testFramework';

// API response generators
const generateWorkflowList = (count = 10) => {
  return Array.from({ length: count }, () => TestFramework.generateWorkflow());
};

const generateUserList = (count = 5) => {
  return Array.from({ length: count }, () => TestFramework.generateUser());
};

// Mock API handlers
export const handlers = [
  // Workflow endpoints
  rest.get('/api/workflows', (req: any, res: any, ctx: any) => {
    const page = req.url.searchParams.get('page') || '1';
    const limit = req.url.searchParams.get('limit') || '10';
    const status = req.url.searchParams.get('status');
    
    let workflows = generateWorkflowList(parseInt(limit));
    
    if (status) {
      workflows = workflows.filter(w => w.status === status);
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        workflows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: workflows.length,
          totalPages: Math.ceil(workflows.length / parseInt(limit))
        }
      })
    );
  }),

  rest.get('/api/workflows/:id', (req, res, ctx) => {
    const { id } = req.params;
    const workflow = TestFramework.generateWorkflow({ id });
    
    return res(
      ctx.status(200),
      ctx.json({
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
      })
    );
  }),

  rest.post('/api/workflows/:id/approve', (req, res, ctx) => {
    const { id } = req.params;
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Workflow approved successfully',
        workflowId: id,
        approvedAt: new Date().toISOString()
      })
    );
  }),

  rest.post('/api/workflows/:id/reject', (req, res, ctx) => {
    const { id } = req.params;
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Workflow rejected successfully',
        workflowId: id,
        rejectedAt: new Date().toISOString()
      })
    );
  }),

  rest.post('/api/workflows/:id/escalate', (req, res, ctx) => {
    const { id } = req.params;
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Workflow escalated successfully',
        workflowId: id,
        escalatedAt: new Date().toISOString()
      })
    );
  }),

  rest.post('/api/workflows/:id/comments', (req, res, ctx) => {
    const { id } = req.params;
    
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        comment: {
          id: 'COM-' + Math.random().toString(36).substr(2, 9),
          workflowId: id,
          content: 'Test comment',
          author: 'Test User',
          createdAt: new Date().toISOString(),
          isInternal: false
        }
      })
    );
  }),

  // Dashboard endpoints
  rest.get('/api/dashboard/stats', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        totalPending: 125,
        highPriority: 23,
        overdueCount: 8,
        avgProcessingTime: 4.5,
        completionRate: 92.3,
        slaCompliance: 89.7,
        todayProcessed: 45,
        weeklyTrend: [32, 45, 38, 42, 51, 39, 45]
      })
    );
  }),

  rest.get('/api/dashboard/queue-distribution', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
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
      })
    );
  }),

  // User management endpoints
  rest.get('/api/users', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        users: generateUserList(10)
      })
    );
  }),

  rest.get('/api/users/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({
        user: TestFramework.generateUser({ id })
      })
    );
  }),

  // Security endpoints
  rest.get('/api/security/audit-events', (req, res, ctx) => {
    const events = Array.from({ length: 20 }, () => TestFramework.generateAuditEvent());
    
    return res(
      ctx.status(200),
      ctx.json({
        events,
        total: events.length
      })
    );
  }),

  rest.get('/api/security/compliance-violations', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
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
      })
    );
  }),

  // Risk assessment endpoints
  rest.post('/api/risk/assess/:workflowId', (req, res, ctx) => {
    const { workflowId } = req.params;
    
    return res(
      ctx.status(200),
      ctx.json({
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
      })
    );
  }),

  // Notification endpoints
  rest.get('/api/notifications', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
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
      })
    );
  }),

  rest.post('/api/notifications/:id/mark-read', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ success: true })
    );
  }),

  // WebSocket simulation endpoint
  rest.get('/api/websocket/status', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        connected: true,
        connectionId: 'WS-' + Math.random().toString(36).substr(2, 9),
        lastHeartbeat: new Date().toISOString()
      })
    );
  }),

  // Error simulation endpoints for testing error handling
  rest.get('/api/test/error/:code', (req, res, ctx) => {
    const { code } = req.params;
    const statusCode = parseInt(code as string);
    
    return res(
      ctx.status(statusCode),
      ctx.json({
        error: `Simulated ${statusCode} error`,
        message: 'This is a test error for testing error handling'
      })
    );
  }),

  // Slow response simulation for performance testing
  rest.get('/api/test/slow/:delay', (req, res, ctx) => {
    const { delay } = req.params;
    const delayMs = parseInt(delay as string);
    
    return res(
      ctx.delay(delayMs),
      ctx.status(200),
      ctx.json({
        message: `Response delayed by ${delayMs}ms`,
        timestamp: new Date().toISOString()
      })
    );
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
    
    if (mockApiEndpoints[endpoint]) {
      mockApiEndpoints[endpoint].called = true;
      mockApiEndpoints[endpoint].callCount++;
    }
    
    return originalResolver(...args);
  };
});