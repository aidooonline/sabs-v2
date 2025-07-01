// Browser API Mocks for Testing Environment
import { act } from 'react-dom/test-utils';

// Mock WebSocket for testing
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // Mock sending - in tests you can override this
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      const closeEvent = new CloseEvent('close', { code: code || 1000, reason });
      this.onclose(closeEvent);
    }
  }

  // Test helper methods
  simulateMessage(data: any) {
    if (this.onmessage) {
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify(data)
      });
      this.onmessage(messageEvent);
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  simulateClose(code = 1000, reason = 'Normal closure') {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      const closeEvent = new CloseEvent('close', { code, reason });
      this.onclose(closeEvent);
    }
  }
}

// Mock DOM APIs that might be missing in jsdom
export const setupBrowserMocks = () => {
  // WebSocket mock
  global.WebSocket = MockWebSocket as any;

  // Mock DOM methods
  Object.defineProperty(window.HTMLElement.prototype, 'scrollTo', {
    value: jest.fn(),
    writable: true
  });

  Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
    value: jest.fn(),
    writable: true
  });

  Object.defineProperty(window.HTMLElement.prototype, 'offsetHeight', {
    get: () => 100,
    configurable: true
  });

  Object.defineProperty(window.HTMLElement.prototype, 'offsetWidth', {
    get: () => 100,
    configurable: true
  });

  // Mock getBoundingClientRect
  Element.prototype.getBoundingClientRect = jest.fn(() => ({
    width: 100,
    height: 50,
    top: 0,
    left: 0,
    bottom: 50,
    right: 100,
    x: 0,
    y: 0,
    toJSON: () => ({})
  }));

  // Mock ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
  }));

  // Mock requestAnimationFrame
  global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
  global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

  // Mock performance API
  Object.defineProperty(window, 'performance', {
    value: {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn(),
      clearMarks: jest.fn(),
      clearMeasures: jest.fn(),
      getEntriesByType: jest.fn(() => []),
      getEntriesByName: jest.fn(() => []),
      memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000
      }
    },
    writable: true
  });

  // Mock console methods to avoid noise in tests (optional)
  const originalConsole = { ...console };
  global.console = {
    ...originalConsole,
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn()
  };

  // Cleanup function
  return () => {
    global.console = originalConsole;
  };
};

// Helper to safely trigger React state updates in tests
export const actAsync = async (callback: () => Promise<void> | void) => {
  await act(async () => {
    await callback();
  });
};

// WebSocket test utilities
export const createMockWebSocket = () => {
  const mockWs = new MockWebSocket('ws://localhost:3001/test');
  return {
    instance: mockWs,
    simulateMessage: (data: any) => mockWs.simulateMessage(data),
    simulateError: () => mockWs.simulateError(),
    simulateClose: (code?: number, reason?: string) => mockWs.simulateClose(code, reason)
  };
};

export { MockWebSocket };