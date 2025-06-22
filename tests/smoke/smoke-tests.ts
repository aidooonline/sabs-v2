import axios, { AxiosInstance } from 'axios';
import { performance } from 'perf_hooks';

interface SmokeTestConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  environment: 'staging' | 'production';
}

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  duration: number;
  error?: string;
  details?: any;
}

interface SmokeTestReport {
  environment: string;
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  duration: number;
  results: TestResult[];
  overallStatus: 'PASS' | 'FAIL';
}

export class SmokeTestRunner {
  private client: AxiosInstance;
  private config: SmokeTestConfig;
  private results: TestResult[] = [];

  constructor(config: SmokeTestConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Sabs-v2-SmokeTest/1.0',
      },
    });
  }

  private async runTest(
    name: string,
    testFn: () => Promise<any>
  ): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      console.log(`🧪 Running: ${name}`);
      const details = await testFn();
      const duration = performance.now() - startTime;
      
      console.log(`✅ PASS: ${name} (${Math.round(duration)}ms)`);
      return {
        name,
        status: 'PASS',
        duration,
        details,
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.log(`❌ FAIL: ${name} (${Math.round(duration)}ms) - ${errorMessage}`);
      return {
        name,
        status: 'FAIL',
        duration,
        error: errorMessage,
      };
    }
  }

  private async retryRequest(fn: () => Promise<any>, retries: number = this.config.retries): Promise<any> {
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
      }
    }
  }

  // ============================================================================
  // BASIC CONNECTIVITY TESTS
  // ============================================================================

  async testHealthEndpoint(): Promise<TestResult> {
    return this.runTest('Health Endpoint', async () => {
      const response = await this.retryRequest(() => this.client.get('/health'));
      
      if (response.status !== 200) {
        throw new Error(`Health check failed with status: ${response.status}`);
      }
      
      const data = response.data;
      if (data.status !== 'healthy' && data.status !== 'ok') {
        throw new Error(`Health status is not healthy: ${data.status}`);
      }
      
      return {
        status: data.status,
        timestamp: data.timestamp || new Date().toISOString(),
        services: data.services || {},
      };
    });
  }

  async testApiVersionEndpoint(): Promise<TestResult> {
    return this.runTest('API Version', async () => {
      const response = await this.retryRequest(() => this.client.get('/api/v1/version'));
      
      if (response.status !== 200) {
        throw new Error(`Version endpoint failed with status: ${response.status}`);
      }
      
      return {
        version: response.data.version,
        environment: response.data.environment,
        buildHash: response.data.buildHash,
      };
    });
  }

  // ============================================================================
  // DATABASE CONNECTIVITY TESTS
  // ============================================================================

  async testDatabaseConnectivity(): Promise<TestResult> {
    return this.runTest('Database Connectivity', async () => {
      const response = await this.retryRequest(() => 
        this.client.get('/api/v1/system/health/database')
      );
      
      if (response.status !== 200) {
        throw new Error(`Database health check failed: ${response.status}`);
      }
      
      const data = response.data;
      if (data.status !== 'connected') {
        throw new Error(`Database is not connected: ${data.status}`);
      }
      
      return {
        status: data.status,
        responseTime: data.responseTime,
        connections: data.connections,
      };
    });
  }

  // ============================================================================
  // AUTHENTICATION TESTS
  // ============================================================================

  async testAuthenticationFlow(): Promise<TestResult> {
    return this.runTest('Authentication Flow', async () => {
      // Test invalid credentials
      try {
        await this.client.post('/api/v1/auth/login', {
          email: 'invalid@test.com',
          password: 'wrongpassword',
        });
        throw new Error('Login should have failed with invalid credentials');
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status !== 401) {
          throw new Error(`Expected 401 for invalid login, got: ${error.response?.status}`);
        }
      }
      
      // Test login endpoint structure (without valid credentials in smoke tests)
      const response = await this.client.post('/api/v1/auth/login', {
        email: 'test@example.com',
        password: 'test',
      }).catch(err => err.response);
      
      // Should return 401 or proper error structure
      if (response.status !== 401 && response.status !== 400) {
        throw new Error(`Unexpected auth response status: ${response.status}`);
      }
      
      return {
        loginEndpointAvailable: true,
        properErrorHandling: response.status === 401 || response.status === 400,
      };
    });
  }

  // ============================================================================
  // API ENDPOINT TESTS
  // ============================================================================

  async testPublicEndpoints(): Promise<TestResult> {
    return this.runTest('Public API Endpoints', async () => {
      const endpoints = [
        '/api/v1/health',
        '/api/v1/version',
        '/api/v1/docs', // API documentation
      ];
      
      const results = {};
      
      for (const endpoint of endpoints) {
        try {
          const response = await this.retryRequest(() => this.client.get(endpoint));
          results[endpoint] = {
            status: response.status,
            accessible: response.status === 200,
          };
        } catch (error) {
          results[endpoint] = {
            status: axios.isAxiosError(error) ? error.response?.status : 'ERROR',
            accessible: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }
      
      return results;
    });
  }

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  async testResponseTimes(): Promise<TestResult> {
    return this.runTest('Response Time Performance', async () => {
      const endpoints = [
        { path: '/health', maxTime: 100 },
        { path: '/api/v1/version', maxTime: 200 },
        { path: '/api/v1/health', maxTime: 300 },
      ];
      
      const results = {};
      
      for (const endpoint of endpoints) {
        const startTime = performance.now();
        try {
          await this.retryRequest(() => this.client.get(endpoint.path));
          const responseTime = performance.now() - startTime;
          
          results[endpoint.path] = {
            responseTime: Math.round(responseTime),
            withinLimit: responseTime <= endpoint.maxTime,
            limit: endpoint.maxTime,
          };
          
          if (responseTime > endpoint.maxTime) {
            console.warn(`⚠️ ${endpoint.path} response time ${Math.round(responseTime)}ms exceeds limit ${endpoint.maxTime}ms`);
          }
        } catch (error) {
          results[endpoint.path] = {
            error: error instanceof Error ? error.message : String(error),
            withinLimit: false,
          };
        }
      }
      
      return results;
    });
  }

  // ============================================================================
  // SECURITY TESTS
  // ============================================================================

  async testSecurityHeaders(): Promise<TestResult> {
    return this.runTest('Security Headers', async () => {
      const response = await this.retryRequest(() => this.client.get('/api/v1/health'));
      
      const requiredHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'strict-transport-security',
      ];
      
      const results = {};
      
      for (const header of requiredHeaders) {
        const value = response.headers[header] || response.headers[header.toLowerCase()];
        results[header] = {
          present: !!value,
          value: value || null,
        };
      }
      
      return results;
    });
  }

  // ============================================================================
  // ENVIRONMENT-SPECIFIC TESTS
  // ============================================================================

  async testEnvironmentConfig(): Promise<TestResult> {
    return this.runTest('Environment Configuration', async () => {
      const response = await this.retryRequest(() => this.client.get('/api/v1/version'));
      const data = response.data;
      
      // Verify environment matches expected
      if (data.environment !== this.config.environment) {
        throw new Error(`Environment mismatch: expected ${this.config.environment}, got ${data.environment}`);
      }
      
      // Production-specific checks
      if (this.config.environment === 'production') {
        if (data.debug === true || data.development === true) {
          throw new Error('Debug/development mode should be disabled in production');
        }
      }
      
      return {
        environment: data.environment,
        version: data.version,
        debug: data.debug,
        configValid: true,
      };
    });
  }

  // ============================================================================
  // MAIN TEST RUNNER
  // ============================================================================

  async runAllTests(): Promise<SmokeTestReport> {
    console.log(`🚀 Starting smoke tests for ${this.config.environment} environment`);
    console.log(`🎯 Target: ${this.config.baseUrl}`);
    console.log(`⏱️ Timeout: ${this.config.timeout}ms, Retries: ${this.config.retries}`);
    console.log('='.repeat(60));
    
    const startTime = performance.now();
    
    // Run all tests
    this.results = await Promise.all([
      this.testHealthEndpoint(),
      this.testApiVersionEndpoint(),
      this.testDatabaseConnectivity(),
      this.testAuthenticationFlow(),
      this.testPublicEndpoints(),
      this.testResponseTimes(),
      this.testSecurityHeaders(),
      this.testEnvironmentConfig(),
    ]);
    
    const totalDuration = performance.now() - startTime;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    
    const report: SmokeTestReport = {
      environment: this.config.environment,
      timestamp: new Date().toISOString(),
      totalTests: this.results.length,
      passed,
      failed,
      duration: Math.round(totalDuration),
      results: this.results,
      overallStatus: failed === 0 ? 'PASS' : 'FAIL',
    };
    
    this.printReport(report);
    return report;
  }

  private printReport(report: SmokeTestReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('               SMOKE TEST REPORT');
    console.log('='.repeat(60));
    console.log(`Environment: ${report.environment}`);
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Duration: ${report.duration}ms`);
    console.log(`Overall Status: ${report.overallStatus === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`\nResults: ${report.passed}/${report.totalTests} tests passed`);
    
    if (report.failed > 0) {
      console.log('\n🚨 Failed Tests:');
      report.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`  ❌ ${result.name}: ${result.error}`);
        });
    }
    
    console.log('\n📊 Test Details:');
    report.results.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      console.log(`  ${status} ${result.name} (${Math.round(result.duration)}ms)`);
    });
    
    console.log('='.repeat(60) + '\n');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const envFlag = args.find(arg => arg.startsWith('--env='));
  const urlFlag = args.find(arg => arg.startsWith('--url='));
  
  const environment = envFlag ? envFlag.split('=')[1] as 'staging' | 'production' : 'staging';
  const baseUrl = urlFlag ? urlFlag.split('=')[1] : 
    environment === 'production' ? 'https://app.sabs-v2.com' : 'https://staging.sabs-v2.com';
  
  const config: SmokeTestConfig = {
    baseUrl,
    timeout: 10000, // 10 seconds
    retries: 2,
    environment,
  };
  
  const runner = new SmokeTestRunner(config);
  
  try {
    const report = await runner.runAllTests();
    
    // Exit with error code if tests failed
    process.exit(report.overallStatus === 'PASS' ? 0 : 1);
  } catch (error) {
    console.error('💥 Smoke tests failed to run:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  main().catch(console.error);
}