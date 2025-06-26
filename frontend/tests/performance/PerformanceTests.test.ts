import { performance } from 'perf_hooks';
import { TestFramework } from '../setup/testFramework';
import { setupApiMocks, MockDataGenerators, mockFetch } from '../setup/mocks/apiMocks';

interface PerformanceMetrics {
  renderTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  componentCount: number;
  reRenderCount: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
}

interface LoadTestConfig {
  concurrentUsers: number;
  duration: number; // in seconds
  rampUpTime: number; // in seconds
  scenarios: LoadTestScenario[];
}

interface LoadTestScenario {
  name: string;
  weight: number; // percentage of users
  actions: LoadTestAction[];
}

interface LoadTestAction {
  type: 'api_call' | 'component_render' | 'user_interaction' | 'wait';
  endpoint?: string;
  component?: string;
  duration?: number;
  data?: any;
}

describe('Performance and Load Testing', () => {
  setupApiMocks();

  beforeEach(() => {
    // Clear performance marks
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.clearMarks();
      window.performance.clearMeasures();
    }
  });

  describe('Component Rendering Performance', () => {
    it('should render ApprovalDashboard within performance budget', async () => {
      const startTime = performance.now();
      
      // Simulate large dataset
      const largeWorkflowDataset = Array.from({ length: 1000 }, () => 
        MockDataGenerators.workflow()
      );
      
      mockFetch.setEndpointResponse('GET /api/workflows', {
        status: 200,
        data: {
          workflows: largeWorkflowDataset,
          pagination: { total: 1000, page: 1, totalPages: 100 }
        }
      });

      // Measure component render time
      const { render } = await import('@testing-library/react');
      const { default: ApprovalDashboard } = await import('../../app/approval/dashboard/page');
      
             const renderTime = await TestFramework.measureRenderTime(async () => {
         const { unmount } = render(React.createElement(ApprovalDashboard));
         
         // Wait for component to fully load
         await new Promise(resolve => setTimeout(resolve, 100));
         
         unmount();
       });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Performance assertions
      expect(renderTime).toBeLessThan(1000); // Should render within 1 second
      expect(totalTime).toBeLessThan(3000); // Total time including data fetch
    });

    it('should handle large workflow lists efficiently', async () => {
      const memoryTracker = TestFramework.detectMemoryLeaks();
      
      // Test with increasing dataset sizes
      const testSizes = [100, 500, 1000, 2000];
      const results: PerformanceMetrics[] = [];

      for (const size of testSizes) {
        const workflows = Array.from({ length: size }, () => MockDataGenerators.workflow());
        
        mockFetch.setEndpointResponse('GET /api/workflows', {
          status: 200,
          data: { workflows, pagination: { total: size } }
        });

        const startMemory = memoryTracker.getMemoryUsage();
        const startTime = performance.now();

        const { render } = await import('@testing-library/react');
        const { default: ApprovalDashboard } = await import('../../app/approval/dashboard/page');
        
        const { unmount } = render(<ApprovalDashboard />);
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const endTime = performance.now();
        const endMemory = memoryTracker.getMemoryUsage();
        
        unmount();

        results.push({
          renderTime: endTime - startTime,
          apiResponseTime: 0,
          memoryUsage: endMemory - startMemory,
          componentCount: size,
          reRenderCount: 0
        });
      }

      // Performance should scale linearly, not exponentially
      const firstResult = results[0];
      const lastResult = results[results.length - 1];
      
      const renderTimeGrowth = lastResult.renderTime / firstResult.renderTime;
      const memoryGrowth = lastResult.memoryUsage / firstResult.memoryUsage;
      
      expect(renderTimeGrowth).toBeLessThan(testSizes[testSizes.length - 1] / testSizes[0] * 2);
      expect(memoryGrowth).toBeLessThan(testSizes[testSizes.length - 1] / testSizes[0] * 3);
    });

    it('should maintain 60fps during scrolling large lists', async () => {
      const frameTimings: number[] = [];
      let frameCount = 0;
      
      // Mock requestAnimationFrame to track frame timing
      const originalRAF = global.requestAnimationFrame;
      global.requestAnimationFrame = (callback: FrameRequestCallback) => {
        const start = performance.now();
        return originalRAF(() => {
          const end = performance.now();
          frameTimings.push(end - start);
          frameCount++;
          callback(end);
        });
      };

      try {
        const { render, screen } = await import('@testing-library/react');
        const userEvent = (await import('@testing-library/user-event')).default;
        const { default: ApprovalDashboard } = await import('../../app/approval/dashboard/page');
        
        // Large dataset for scrolling test
        const workflows = Array.from({ length: 5000 }, () => MockDataGenerators.workflow());
        mockFetch.setEndpointResponse('GET /api/workflows', {
          status: 200,
          data: { workflows: workflows.slice(0, 100), pagination: { total: 5000 } }
        });

        render(<ApprovalDashboard />);
        
        // Wait for initial render
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Simulate rapid scrolling
        const scrollContainer = screen.getByTestId('workflow-list-container');
        const user = userEvent.setup();
        
        for (let i = 0; i < 20; i++) {
          await user.pointer({ target: scrollContainer, coords: { x: 0, y: i * 50 } });
          await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
        }

        // Calculate average frame time
        const avgFrameTime = frameTimings.reduce((sum, time) => sum + time, 0) / frameTimings.length;
        
        // Should maintain 60fps (16.67ms per frame)
        expect(avgFrameTime).toBeLessThan(20); // Allow some buffer
        
      } finally {
        global.requestAnimationFrame = originalRAF;
      }
    });
  });

  describe('API Performance Testing', () => {
    it('should handle API responses within SLA', async () => {
      const endpoints = [
        'GET /api/workflows',
        'GET /api/dashboard/stats',
        'POST /api/workflows/:id/approve',
        'GET /api/notifications'
      ];

      const responseTimings: Record<string, number[]> = {};

      // Test each endpoint multiple times
      for (const endpoint of endpoints) {
        responseTimings[endpoint] = [];
        
        for (let i = 0; i < 10; i++) {
          const startTime = performance.now();
          
          // Simulate API call
          const response = await fetch(endpoint.replace(':id', 'test-id'), {
            method: endpoint.split(' ')[0]
          });
          
          const endTime = performance.now();
          responseTimings[endpoint].push(endTime - startTime);
          
          expect(response.ok).toBe(true);
        }
      }

      // Check SLA compliance (all APIs should respond within 500ms)
      for (const [endpoint, timings] of Object.entries(responseTimings)) {
        const avgTime = timings.reduce((sum, time) => sum + time, 0) / timings.length;
        const maxTime = Math.max(...timings);
        
        expect(avgTime).toBeLessThan(500); // Average response time
        expect(maxTime).toBeLessThan(1000); // Max response time
        
        // 95th percentile should be under 750ms
        const sorted = timings.sort((a, b) => a - b);
        const p95 = sorted[Math.floor(sorted.length * 0.95)];
        expect(p95).toBeLessThan(750);
      }
    });

    it('should handle concurrent API requests efficiently', async () => {
      const concurrentRequests = 50;
      const requestPromises: Promise<Response>[] = [];

      const startTime = performance.now();

      // Create concurrent requests
      for (let i = 0; i < concurrentRequests; i++) {
        const promise = fetch('/api/workflows', {
          method: 'GET'
        });
        requestPromises.push(promise);
      }

      // Wait for all requests to complete
      const responses = await Promise.all(requestPromises);
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      const avgTimePerRequest = totalTime / concurrentRequests;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });

      // Concurrent requests shouldn't take much longer than sequential
      expect(avgTimePerRequest).toBeLessThan(100); // Average time per request
      expect(totalTime).toBeLessThan(5000); // Total time for all requests
    });

    it('should handle API rate limiting gracefully', async () => {
      // Simulate rate limiting by making many rapid requests
      const rapidRequests = 100;
      const results: { success: boolean; time: number; status: number }[] = [];

      for (let i = 0; i < rapidRequests; i++) {
        const startTime = performance.now();
        
        try {
          const response = await fetch('/api/workflows');
          const endTime = performance.now();
          
          results.push({
            success: response.ok,
            time: endTime - startTime,
            status: response.status
          });
        } catch (error) {
          results.push({
            success: false,
            time: performance.now() - startTime,
            status: 0
          });
        }

        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Should handle at least 90% of requests successfully
      const successfulRequests = results.filter(r => r.success).length;
      const successRate = successfulRequests / rapidRequests;
      
      expect(successRate).toBeGreaterThan(0.9);

      // Rate limited requests should return appropriate status
      const rateLimitedRequests = results.filter(r => r.status === 429);
      if (rateLimitedRequests.length > 0) {
        // Should not exceed 10% rate limiting
        expect(rateLimitedRequests.length / rapidRequests).toBeLessThan(0.1);
      }
    });
  });

  describe('Memory Management', () => {
    it('should not have memory leaks during navigation', async () => {
      const memoryTracker = TestFramework.detectMemoryLeaks();
      const initialMemory = memoryTracker.getMemoryUsage();

      // Simulate navigation between different views
      const views = [
        () => import('../../app/approval/dashboard/page'),
        () => import('../../app/approval/workflow/[id]/page'),
        () => import('../../app/approval/users/page')
      ];

      for (let cycle = 0; cycle < 3; cycle++) {
        for (const viewImport of views) {
          const { render } = await import('@testing-library/react');
          const ViewComponent = (await viewImport()).default;
          
          const { unmount } = render(<ViewComponent />);
          await new Promise(resolve => setTimeout(resolve, 100));
          unmount();
          
          // Force garbage collection if available
          if (global.gc) {
            global.gc();
          }
        }
      }

      const finalMemory = memoryTracker.getMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should clean up event listeners and timers', async () => {
      const initialListeners = (global as any).eventListenerCount || 0;
      const initialTimers = (global as any).activeTimerCount || 0;

      const { render } = await import('@testing-library/react');
      const { default: ApprovalDashboard } = await import('../../app/approval/dashboard/page');
      
      const { unmount } = render(<ApprovalDashboard />);
      
      // Let component set up listeners and timers
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      unmount();
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 500));

      const finalListeners = (global as any).eventListenerCount || 0;
      const finalTimers = (global as any).activeTimerCount || 0;

      // Should clean up properly
      expect(finalListeners).toBeLessThanOrEqual(initialListeners + 1);
      expect(finalTimers).toBeLessThanOrEqual(initialTimers + 1);
    });
  });

  describe('Load Testing Scenarios', () => {
    it('should handle high-volume approval workflow', async () => {
      const testConfig: LoadTestConfig = {
        concurrentUsers: 20,
        duration: 30, // 30 seconds
        rampUpTime: 5,
        scenarios: [
          {
            name: 'dashboard_browsing',
            weight: 40,
            actions: [
              { type: 'api_call', endpoint: 'GET /api/dashboard/stats' },
              { type: 'api_call', endpoint: 'GET /api/workflows' },
              { type: 'wait', duration: 2000 }
            ]
          },
          {
            name: 'workflow_approval',
            weight: 35,
            actions: [
              { type: 'api_call', endpoint: 'GET /api/workflows/:id' },
              { type: 'wait', duration: 5000 }, // Review time
              { type: 'api_call', endpoint: 'POST /api/workflows/:id/approve' }
            ]
          },
          {
            name: 'search_and_filter',
            weight: 25,
            actions: [
              { type: 'api_call', endpoint: 'GET /api/workflows?search=test' },
              { type: 'api_call', endpoint: 'GET /api/workflows?status=pending' },
              { type: 'wait', duration: 1000 }
            ]
          }
        ]
      };

      const results = await runLoadTest(testConfig);

      // Performance assertions for load test
      expect(results.averageResponseTime).toBeLessThan(1000);
      expect(results.errorRate).toBeLessThan(0.05); // Less than 5% error rate
      expect(results.throughput).toBeGreaterThan(10); // At least 10 requests per second
      expect(results.concurrentUsers).toBe(testConfig.concurrentUsers);
    });

    it('should handle peak hour traffic simulation', async () => {
      // Simulate peak hour with varying load
      const peakHourPattern = [
        { users: 5, duration: 5 },   // 9:00 AM - light traffic
        { users: 15, duration: 10 }, // 9:30 AM - increasing
        { users: 30, duration: 15 }, // 10:00 AM - peak
        { users: 25, duration: 10 }, // 10:30 AM - declining
        { users: 10, duration: 5 }   // 11:00 AM - normal
      ];

      const peakResults: any[] = [];

      for (const phase of peakHourPattern) {
        const config: LoadTestConfig = {
          concurrentUsers: phase.users,
          duration: phase.duration,
          rampUpTime: 2,
          scenarios: [
            {
              name: 'mixed_usage',
              weight: 100,
              actions: [
                { type: 'api_call', endpoint: 'GET /api/workflows' },
                { type: 'api_call', endpoint: 'GET /api/dashboard/stats' },
                { type: 'wait', duration: 1000 }
              ]
            }
          ]
        };

        const result = await runLoadTest(config);
        peakResults.push({
          phase: `${phase.users} users`,
          ...result
        });

        // Brief pause between phases
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // System should remain stable throughout peak
      peakResults.forEach(result => {
        expect(result.errorRate).toBeLessThan(0.1);
        expect(result.averageResponseTime).toBeLessThan(2000);
      });

      // Peak performance should be reasonable
      const peakResult = peakResults[2]; // 30 users phase
      expect(peakResult.throughput).toBeGreaterThan(15);
      expect(peakResult.averageResponseTime).toBeLessThan(1500);
    });
  });

  describe('Stress Testing', () => {
    it('should handle system under extreme load', async () => {
      const stressConfig: LoadTestConfig = {
        concurrentUsers: 100,
        duration: 60,
        rampUpTime: 10,
        scenarios: [
          {
            name: 'stress_test',
            weight: 100,
            actions: [
              { type: 'api_call', endpoint: 'GET /api/workflows' },
              { type: 'api_call', endpoint: 'POST /api/workflows/:id/approve' },
              { type: 'api_call', endpoint: 'GET /api/dashboard/stats' }
            ]
          }
        ]
      };

      const stressResults = await runLoadTest(stressConfig);

      // System should degrade gracefully under stress
      expect(stressResults.errorRate).toBeLessThan(0.15); // Up to 15% error rate acceptable
      expect(stressResults.averageResponseTime).toBeLessThan(5000); // Max 5 seconds response
      
      // Should still process minimum throughput
      expect(stressResults.throughput).toBeGreaterThan(5);
    });

    it('should recover after stress period', async () => {
      // First, apply stress
      const stressConfig: LoadTestConfig = {
        concurrentUsers: 50,
        duration: 30,
        rampUpTime: 5,
        scenarios: [{
          name: 'stress',
          weight: 100,
          actions: [{ type: 'api_call', endpoint: 'GET /api/workflows' }]
        }]
      };

      await runLoadTest(stressConfig);

      // Wait for recovery
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Test normal load after stress
      const normalConfig: LoadTestConfig = {
        concurrentUsers: 10,
        duration: 15,
        rampUpTime: 2,
        scenarios: [{
          name: 'normal',
          weight: 100,
          actions: [{ type: 'api_call', endpoint: 'GET /api/workflows' }]
        }]
      };

      const recoveryResults = await runLoadTest(normalConfig);

      // Should return to normal performance
      expect(recoveryResults.errorRate).toBeLessThan(0.05);
      expect(recoveryResults.averageResponseTime).toBeLessThan(1000);
    });
  });
});

// Helper function to run load tests
async function runLoadTest(config: LoadTestConfig): Promise<{
  averageResponseTime: number;
  errorRate: number;
  throughput: number;
  concurrentUsers: number;
  totalRequests: number;
}> {
  const results: { success: boolean; responseTime: number }[] = [];
  const startTime = performance.now();
  
  // Simulate concurrent users
  const userPromises: Promise<void>[] = [];
  
  for (let user = 0; user < config.concurrentUsers; user++) {
    const userPromise = simulateUser(config, user, results);
    userPromises.push(userPromise);
    
    // Ramp up gradually
    if (config.rampUpTime > 0) {
      const delay = (config.rampUpTime * 1000) / config.concurrentUsers;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Wait for all users to complete
  await Promise.all(userPromises);
  
  const endTime = performance.now();
  const totalTime = (endTime - startTime) / 1000; // Convert to seconds
  
  // Calculate metrics
  const successfulRequests = results.filter(r => r.success).length;
  const totalRequests = results.length;
  const errorRate = (totalRequests - successfulRequests) / totalRequests;
  
  const avgResponseTime = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests;
  
  const throughput = totalRequests / totalTime;
  
  return {
    averageResponseTime: avgResponseTime,
    errorRate,
    throughput,
    concurrentUsers: config.concurrentUsers,
    totalRequests
  };
}

// Simulate individual user behavior
async function simulateUser(
  config: LoadTestConfig, 
  userId: number, 
  results: { success: boolean; responseTime: number }[]
): Promise<void> {
  const endTime = Date.now() + (config.duration * 1000);
  
  while (Date.now() < endTime) {
    // Select scenario based on weight
    const scenario = selectScenario(config.scenarios);
    
    for (const action of scenario.actions) {
      if (Date.now() >= endTime) break;
      
      try {
        const startTime = performance.now();
        
        switch (action.type) {
          case 'api_call':
            const response = await fetch(action.endpoint?.replace(':id', `test-${userId}`) || '/api/test');
            const endTime = performance.now();
            
            results.push({
              success: response.ok,
              responseTime: endTime - startTime
            });
            break;
            
          case 'wait':
            await new Promise(resolve => setTimeout(resolve, action.duration || 1000));
            break;
        }
      } catch (error) {
        results.push({
          success: false,
          responseTime: 0
        });
      }
    }
  }
}

// Select scenario based on weights
function selectScenario(scenarios: LoadTestScenario[]): LoadTestScenario {
  const random = Math.random() * 100;
  let cumulative = 0;
  
  for (const scenario of scenarios) {
    cumulative += scenario.weight;
    if (random <= cumulative) {
      return scenario;
    }
  }
  
  return scenarios[0]; // Fallback
}