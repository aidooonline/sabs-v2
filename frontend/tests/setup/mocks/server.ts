// MSW Server Setup for Test Environment
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// API response generators
const generateWorkflow = (overrides = {}) => ({
  id: 'WF-' + Math.random().toString(36).substr(2, 9),
  workflowNumber: 'WF-' + Math.random().toString(36).substr(2, 9),
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
  currentStage: 'clerk_review',
  createdAt: new Date().toISOString(),
  dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  withdrawalRequest: {
    customer: {
      fullName: 'Test Customer',
      accountNumber: 'ACC000123',
      phoneNumber: '+233123456789'
    },
    agent: {
      fullName: 'Test Agent',
      id: 'agent-1',
      branch: 'Branch 1'
    },
    amount: Math.floor(Math.random() * 100000) + 1000,
    currency: 'GHS'
  },
  riskAssessment: {
    riskScore: Math.floor(Math.random() * 100),
    riskLevel: 'medium',
    factors: ['Factor 1']
  },
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

// Mock API handlers using MSW v1 syntax
export const handlers = [
  // Workflow endpoints
  rest.get('/api/workflows', (req, res, ctx) => {
    const url = new URL(req.url);
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '10';
    const status = url.searchParams.get('status');
    
    let workflows = generateWorkflowList(parseInt(limit));
    
    if (status) {
      workflows = workflows.filter(w => w.status === status);
    }
    
    return res(
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

  // Approval workflow specific endpoints
  rest.get('/api/approval-workflow/workflows', (req, res, ctx) => {
    const url = new URL(req.url);
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '10';
    const status = url.searchParams.get('status');
    
    const workflows = Array.from({ length: parseInt(limit) }, (_, i) => ({
      id: `WF-${String(i + 1).padStart(3, '0')}`,
      workflowNumber: `WF-${String(i + 1).padStart(3, '0')}`,
      type: ['loan_approval', 'disbursement', 'repayment'][i % 3],
      status: status || ['pending', 'approved', 'rejected'][i % 3],
      priority: ['high', 'medium', 'low'][i % 3],
      currentStage: ['clerk_review', 'manager_review', 'admin_review'][i % 3],
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() + Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
      submittedBy: {
        id: `user-${i + 1}`,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`
      },
      assignedTo: i % 2 === 0 ? {
        id: `approver-${i + 1}`,
        name: `Approver ${i + 1}`,
        email: `approver${i + 1}@example.com`
      } : null,
      withdrawalRequest: {
        amount: Math.floor(Math.random() * 100000) + 1000,
        currency: 'GHS',
        customer: {
          fullName: `Customer ${i + 1}`,
          accountNumber: `ACC${String(i + 1).padStart(6, '0')}`,
          phoneNumber: `+233${String(Math.floor(Math.random() * 100000000)).padStart(9, '0')}`
        },
        agent: {
          fullName: `Agent ${i + 1}`,
          id: `agent-${i + 1}`,
          branch: `Branch ${(i % 5) + 1}`
        }
      },
      riskAssessment: {
        riskScore: Math.floor(Math.random() * 100),
        riskLevel: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        factors: [`Factor ${i % 3 + 1}`, `Risk ${i % 2 + 1}`]
      },
      metadata: {
        clientId: `client-${i + 1}`,
        loanId: `loan-${i + 1}`,
        applicationDate: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString()
      }
    }));
    
    return res(
      ctx.json({
        workflows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(125 / parseInt(limit)),
          totalCount: 125,
          pageSize: parseInt(limit),
          hasNext: parseInt(page) < Math.ceil(125 / parseInt(limit)),
          hasPrevious: parseInt(page) > 1
        }
      })
    );
  }),

  rest.get('/api/workflows/:id', (req, res, ctx) => {
    const { id } = req.params;
    const workflow = generateWorkflow({ id });
    
    return res(
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

  rest.get('/api/approval-workflow/dashboard/stats', (req, res, ctx) => {
    return res(
      ctx.json({
        totalPending: 125,
        totalApproved: 890,
        totalRejected: 45,
        averageProcessingTime: 270,
        todayProcessed: 23,
        weeklyTarget: 100,
        currentWeekProcessed: 78,
        slaCompliance: 0.89,
        topApprovers: [
          { id: 'approver-1', name: 'John Doe', count: 45 },
          { id: 'approver-2', name: 'Jane Smith', count: 38 }
        ]
      })
    );
  }),

  rest.get('/api/approval-workflow/dashboard/queue-metrics', (req, res, ctx) => {
    return res(
      ctx.json({
        totalPending: 125,
        totalApproved: 890,
        totalRejected: 45,
        averageProcessingTime: 270,
        slaCompliance: 0.89,
        riskDistribution: [
          { riskLevel: 'Low', count: 45, percentage: 36 },
          { riskLevel: 'Medium', count: 52, percentage: 42 },
          { riskLevel: 'High', count: 28, percentage: 22 }
        ]
      })
    );
  }),

  rest.get('/api/dashboard/queue-distribution', (req, res, ctx) => {
    return res(
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
      ctx.json({
        users: generateUserList(10)
      })
    );
  }),

  rest.get('/api/users/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.json({
        user: generateUser({ id })
      })
    );
  }),

  // Security endpoints
  rest.get('/api/security/audit-events', (req, res, ctx) => {
    const events = Array.from({ length: 20 }, () => generateAuditEvent());
    
    return res(
      ctx.json({
        events,
        total: events.length
      })
    );
  }),

  rest.get('/api/security/compliance-violations', (req, res, ctx) => {
    return res(
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
    return res(ctx.json({ success: true }));
  }),

  // WebSocket simulation endpoint
  rest.get('/api/websocket/status', (req, res, ctx) => {
    return res(
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
  '/api/dashboard/stats': { called: false, callCount: 0 },
  '/api/approval-workflow/workflows': { called: false, callCount: 0 },
  '/api/approval-workflow/dashboard/stats': { called: false, callCount: 0 },
  '/api/approval-workflow/dashboard/queue-metrics': { called: false, callCount: 0 }
};

// API mocks export for compatibility with existing tests
export const mockEndpoints = mockApiEndpoints;