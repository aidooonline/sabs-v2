import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const loginSuccessRate = new Rate('login_success_rate');
const transactionSuccessRate = new Rate('transaction_success_rate');
const apiResponseTime = new Trend('api_response_time');
const errorCount = new Counter('error_count');

// Test configuration
export const options = {
  stages: [
    // Ramp-up
    { duration: '2m', target: 10 },   // Ramp up to 10 users over 2 minutes
    { duration: '5m', target: 50 },   // Increase to 50 users over 5 minutes
    { duration: '10m', target: 100 }, // Peak load: 100 concurrent users for 10 minutes
    { duration: '5m', target: 50 },   // Scale down to 50 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  
  thresholds: {
    // Performance thresholds
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate should be below 10%
    login_success_rate: ['rate>0.95'], // Login success rate should be above 95%
    transaction_success_rate: ['rate>0.99'], // Transaction success rate should be above 99%
  },
  
  // Test data
  ext: {
    loadimpact: {
      projectID: parseInt(__ENV.K6_PROJECT_ID),
      name: 'Sabs v2 Load Test'
    }
  }
};

// Test data
const BASE_URL = __ENV.TEST_URL || 'https://staging.sabs-v2.com';
const testUsers = [
  { email: 'admin@accrafinancial.com', password: 'test123', role: 'admin' },
  { email: 'agent@accrafinancial.com', password: 'test123', role: 'agent' },
  { email: 'clerk@accrafinancial.com', password: 'test123', role: 'clerk' },
];

const testCustomers = [
  { phone: '+233201123456', name: 'Akosua Boateng' },
  { phone: '+233201234567', name: 'Kwaku Appiah' },
  { phone: '+233201345678', name: 'Abena Darko' },
];

// Utility functions
function generateTransactionReference() {
  return `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function getRandomCustomer() {
  return testCustomers[Math.floor(Math.random() * testCustomers.length)];
}

function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

// Authentication helper
function authenticate(user) {
  const loginPayload = {
    email: user.email,
    password: user.password,
  };
  
  const loginResponse = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify(loginPayload), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'login' },
  });
  
  const loginSuccess = check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login response has token': (r) => r.json('accessToken') !== undefined,
    'login response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  loginSuccessRate.add(loginSuccess);
  apiResponseTime.add(loginResponse.timings.duration, { endpoint: 'login' });
  
  if (!loginSuccess) {
    errorCount.add(1, { error_type: 'login_failed' });
    return null;
  }
  
  return loginResponse.json('accessToken');
}

// API Test scenarios
export default function() {
  const user = getRandomUser();
  const token = authenticate(user);
  
  if (!token) {
    console.warn('Authentication failed, skipping user session');
    return;
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
  
  // Test scenario weights
  const scenario = Math.random();
  
  if (scenario < 0.3) {
    // 30% - Customer management operations
    testCustomerManagement(headers);
  } else if (scenario < 0.7) {
    // 40% - Transaction processing
    testTransactionProcessing(headers);
  } else if (scenario < 0.9) {
    // 20% - Reporting and analytics
    testReportingAnalytics(headers);
  } else {
    // 10% - System administration
    testSystemAdmin(headers);
  }
  
  // Random think time between operations
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

function testCustomerManagement(headers) {
  // Get customer list
  const listResponse = http.get(`${BASE_URL}/api/v1/customers?limit=20`, {
    headers,
    tags: { name: 'list_customers' },
  });
  
  check(listResponse, {
    'list customers status is 200': (r) => r.status === 200,
    'list customers response time < 300ms': (r) => r.timings.duration < 300,
    'list customers has data': (r) => r.json('data').length > 0,
  });
  
  apiResponseTime.add(listResponse.timings.duration, { endpoint: 'list_customers' });
  
  sleep(0.5);
  
  // Search for a customer
  const customer = getRandomCustomer();
  const searchResponse = http.get(`${BASE_URL}/api/v1/customers/search?q=${customer.phone}`, {
    headers,
    tags: { name: 'search_customers' },
  });
  
  check(searchResponse, {
    'search customers status is 200': (r) => r.status === 200,
    'search customers response time < 400ms': (r) => r.timings.duration < 400,
  });
  
  apiResponseTime.add(searchResponse.timings.duration, { endpoint: 'search_customers' });
  
  sleep(0.3);
  
  // Get customer details if found
  if (searchResponse.json('data').length > 0) {
    const customerId = searchResponse.json('data')[0].id;
    const detailResponse = http.get(`${BASE_URL}/api/v1/customers/${customerId}`, {
      headers,
      tags: { name: 'get_customer' },
    });
    
    check(detailResponse, {
      'get customer status is 200': (r) => r.status === 200,
      'get customer response time < 200ms': (r) => r.timings.duration < 200,
      'get customer has balance': (r) => r.json('data.balance') !== undefined,
    });
    
    apiResponseTime.add(detailResponse.timings.duration, { endpoint: 'get_customer' });
  }
}

function testTransactionProcessing(headers) {
  // Get a random customer for transaction
  const customer = getRandomCustomer();
  
  // Create a deposit transaction
  const transactionPayload = {
    customerPhone: customer.phone,
    type: 'deposit',
    amount: Math.floor(Math.random() * 1000) + 50, // 50-1050 GHS
    description: 'Load test deposit',
    reference: generateTransactionReference(),
  };
  
  const createTxnResponse = http.post(
    `${BASE_URL}/api/v1/transactions`,
    JSON.stringify(transactionPayload),
    {
      headers,
      tags: { name: 'create_transaction' },
    }
  );
  
  const txnSuccess = check(createTxnResponse, {
    'create transaction status is 201': (r) => r.status === 201,
    'create transaction response time < 800ms': (r) => r.timings.duration < 800,
    'create transaction has id': (r) => r.json('data.id') !== undefined,
    'create transaction has reference': (r) => r.json('data.reference') !== undefined,
  });
  
  transactionSuccessRate.add(txnSuccess);
  apiResponseTime.add(createTxnResponse.timings.duration, { endpoint: 'create_transaction' });
  
  if (!txnSuccess) {
    errorCount.add(1, { error_type: 'transaction_failed' });
    return;
  }
  
  sleep(0.5);
  
  // Get transaction details
  const transactionId = createTxnResponse.json('data.id');
  const getTxnResponse = http.get(`${BASE_URL}/api/v1/transactions/${transactionId}`, {
    headers,
    tags: { name: 'get_transaction' },
  });
  
  check(getTxnResponse, {
    'get transaction status is 200': (r) => r.status === 200,
    'get transaction response time < 200ms': (r) => r.timings.duration < 200,
    'get transaction status is completed': (r) => r.json('data.status') === 'completed',
  });
  
  apiResponseTime.add(getTxnResponse.timings.duration, { endpoint: 'get_transaction' });
  
  sleep(0.3);
  
  // List recent transactions
  const listTxnResponse = http.get(`${BASE_URL}/api/v1/transactions?limit=10&sort=-createdAt`, {
    headers,
    tags: { name: 'list_transactions' },
  });
  
  check(listTxnResponse, {
    'list transactions status is 200': (r) => r.status === 200,
    'list transactions response time < 400ms': (r) => r.timings.duration < 400,
    'list transactions has data': (r) => r.json('data').length > 0,
  });
  
  apiResponseTime.add(listTxnResponse.timings.duration, { endpoint: 'list_transactions' });
}

function testReportingAnalytics(headers) {
  // Get dashboard statistics
  const dashboardResponse = http.get(`${BASE_URL}/api/v1/analytics/dashboard`, {
    headers,
    tags: { name: 'dashboard_analytics' },
  });
  
  check(dashboardResponse, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard response time < 600ms': (r) => r.timings.duration < 600,
    'dashboard has metrics': (r) => r.json('data.totalTransactions') !== undefined,
  });
  
  apiResponseTime.add(dashboardResponse.timings.duration, { endpoint: 'dashboard' });
  
  sleep(0.5);
  
  // Get transaction report for last 7 days
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const reportResponse = http.get(
    `${BASE_URL}/api/v1/reports/transactions?startDate=${startDate}&endDate=${endDate}&groupBy=day`,
    {
      headers,
      tags: { name: 'transaction_report' },
    }
  );
  
  check(reportResponse, {
    'report status is 200': (r) => r.status === 200,
    'report response time < 1000ms': (r) => r.timings.duration < 1000,
    'report has data': (r) => r.json('data').length >= 0,
  });
  
  apiResponseTime.add(reportResponse.timings.duration, { endpoint: 'report' });
  
  sleep(0.3);
  
  // Get commission report
  const commissionResponse = http.get(
    `${BASE_URL}/api/v1/reports/commissions?startDate=${startDate}&endDate=${endDate}`,
    {
      headers,
      tags: { name: 'commission_report' },
    }
  );
  
  check(commissionResponse, {
    'commission report status is 200': (r) => r.status === 200,
    'commission report response time < 800ms': (r) => r.timings.duration < 800,
  });
  
  apiResponseTime.add(commissionResponse.timings.duration, { endpoint: 'commission_report' });
}

function testSystemAdmin(headers) {
  // Get system health
  const healthResponse = http.get(`${BASE_URL}/api/v1/system/health`, {
    headers,
    tags: { name: 'system_health' },
  });
  
  check(healthResponse, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 100ms': (r) => r.timings.duration < 100,
    'system is healthy': (r) => r.json('status') === 'healthy',
  });
  
  apiResponseTime.add(healthResponse.timings.duration, { endpoint: 'health' });
  
  sleep(0.3);
  
  // Get system metrics
  const metricsResponse = http.get(`${BASE_URL}/api/v1/system/metrics`, {
    headers,
    tags: { name: 'system_metrics' },
  });
  
  check(metricsResponse, {
    'metrics status is 200': (r) => r.status === 200,
    'metrics response time < 300ms': (r) => r.timings.duration < 300,
    'metrics has data': (r) => r.json('data') !== undefined,
  });
  
  apiResponseTime.add(metricsResponse.timings.duration, { endpoint: 'metrics' });
  
  sleep(0.2);
  
  // Check audit logs
  const auditResponse = http.get(`${BASE_URL}/api/v1/audit/logs?limit=10`, {
    headers,
    tags: { name: 'audit_logs' },
  });
  
  check(auditResponse, {
    'audit logs status is 200': (r) => r.status === 200,
    'audit logs response time < 400ms': (r) => r.timings.duration < 400,
  });
  
  apiResponseTime.add(auditResponse.timings.duration, { endpoint: 'audit_logs' });
}

// Setup function - runs once before the test
export function setup() {
  console.log(`🚀 Starting load test against: ${BASE_URL}`);
  console.log(`📊 Test duration: ~24 minutes`);
  console.log(`👥 Peak concurrent users: 100`);
  
  // Verify system is accessible
  const healthCheck = http.get(`${BASE_URL}/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`System health check failed: ${healthCheck.status}`);
  }
  
  console.log('✅ System health check passed');
  return { baseUrl: BASE_URL };
}

// Teardown function - runs once after the test
export function teardown(data) {
  console.log('📊 Load test completed');
  console.log(`🎯 Target URL: ${data.baseUrl}`);
  
  // Generate summary report
  const summary = {
    testUrl: data.baseUrl,
    testDuration: '24 minutes',
    peakUsers: 100,
    scenarios: ['Customer Management', 'Transaction Processing', 'Reporting', 'System Admin'],
    completedAt: new Date().toISOString(),
  };
  
  console.log('📋 Test Summary:', JSON.stringify(summary, null, 2));
}