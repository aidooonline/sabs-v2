import '@testing-library/jest-dom'

// ===== MSW POLYFILLS FOR NODE.JS ENVIRONMENT =====
// Required for MSW to work in Node.js test environment
import { TextEncoder, TextDecoder } from 'util';

// Add polyfills for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Add ReadableStream polyfill if needed
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = class ReadableStream {
    constructor() {}
    getReader() {
      return {
        read: () => Promise.resolve({ done: true }),
        cancel: () => Promise.resolve(),
        releaseLock: () => {}
      };
    }
  };
}

// Add BroadcastChannel polyfill for MSW
if (typeof global.BroadcastChannel === 'undefined') {
  global.BroadcastChannel = class BroadcastChannel {
    constructor(name) {
      this.name = name;
    }
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() { return true; }
  };
}

// Add other MSW required polyfills
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// ===== BROWSER API MOCKS =====

// Mock ResizeObserver - Required for chart libraries and responsive components
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver - Often needed alongside ResizeObserver
global.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock window.matchMedia - Required for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Request object for test environment
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init.method || 'GET';
      this.headers = new Headers(init.headers);
      this.body = init.body || null;
      this.mode = init.mode || 'cors';
      this.credentials = init.credentials || 'same-origin';
      this.cache = init.cache || 'default';
      this.redirect = init.redirect || 'follow';
      this.referrer = init.referrer || '';
      this.referrerPolicy = init.referrerPolicy || '';
      this.integrity = init.integrity || '';
      this.keepalive = init.keepalive || false;
      this.signal = init.signal || null;
    }

    async arrayBuffer() {
      if (typeof this.body === 'string') {
        return new TextEncoder().encode(this.body).buffer;
      }
      return this.body || new ArrayBuffer(0);
    }

    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
    }

    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }

    clone() {
      const cloned = new Request(this.url, {
        method: this.method,
        headers: this.headers,
        body: this.body,
        mode: this.mode,
        credentials: this.credentials,
        cache: this.cache,
        redirect: this.redirect,
        referrer: this.referrer,
        referrerPolicy: this.referrerPolicy,
        integrity: this.integrity,
        keepalive: this.keepalive,
        signal: this.signal
      });
      return cloned;
    }
  };
}

// Mock Response object for test environment
if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = new Headers(init.headers);
      this.ok = this.status >= 200 && this.status < 300;
      this.url = '';
    }

    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }

    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
    }

    async arrayBuffer() {
      if (typeof this.body === 'string') {
        return new TextEncoder().encode(this.body).buffer;
      }
      return this.body || new ArrayBuffer(0);
    }

    clone() {
      return new Response(this.body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers
      });
    }
  };
}

// Mock Headers if not available
if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init = {}) {
      this.headers = new Map();
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      }
    }

    get(name) {
      return this.headers.get(name.toLowerCase());
    }

    set(name, value) {
      this.headers.set(name.toLowerCase(), value);
    }

    has(name) {
      return this.headers.has(name.toLowerCase());
    }

    delete(name) {
      this.headers.delete(name.toLowerCase());
    }

    entries() {
      return this.headers.entries();
    }

    forEach(callback) {
      this.headers.forEach(callback);
    }
  };
}

// Only set up custom fetch mock if MSW is not being used
// MSW provides its own fetch mocking that's more comprehensive
if (typeof global.fetch === 'undefined') {
  // Basic fetch implementation for tests that don't use MSW
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      clone() {
        return {
          ok: this.ok,
          status: this.status,
          statusText: this.statusText,
          json: () => Promise.resolve({}),
          text: () => Promise.resolve(''),
          headers: new Headers(),
        };
      },
      headers: new Headers(),
    })
  );
}

// ===== WEBSOCKET MOCK =====
// Mock WebSocket for testing
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url;
  onopen = null;
  onclose = null;
  onmessage = null;
  onerror = null;

  constructor(url) {
    this.url = url;
    // Simulate async connection without causing act() warnings
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // Mock sending - in tests you can override this
  }

  close(code = 1000, reason = 'Normal closure') {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      const closeEvent = new CloseEvent('close', { code, reason });
      this.onclose(closeEvent);
    }
  }

  // Test helper methods
  simulateMessage(data) {
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

global.WebSocket = MockWebSocket;

// Note: MSW will handle fetch mocking when used, so no need for custom fetch reset

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock scrollTo
global.scrollTo = jest.fn();

// Mock performance.clearMarks and clearMeasures
Object.defineProperty(global.performance, 'clearMarks', {
  writable: true,
  value: jest.fn(),
});

Object.defineProperty(global.performance, 'clearMeasures', {
  writable: true,
  value: jest.fn(),
});

// Extend window.performance to have the same methods
if (typeof window !== 'undefined' && window.performance) {
  window.performance.clearMarks = jest.fn();
  window.performance.clearMeasures = jest.fn();
  window.performance.mark = jest.fn();
  window.performance.measure = jest.fn();
  window.performance.getEntriesByType = jest.fn(() => []);
  window.performance.getEntriesByName = jest.fn(() => []);
}

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));

// Mock chart and visualization libraries that use ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver 
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock getBoundingClientRect - Enhanced for Recharts ResponsiveContainer
Element.prototype.getBoundingClientRect = jest.fn(() => ({
  width: 1024,
  height: 768,
  top: 0,
  left: 0,
  bottom: 768,
  right: 1024,
  x: 0,
  y: 0,
  toJSON: jest.fn(),
}));

// Ensure HTMLElement also has the mock
HTMLElement.prototype.getBoundingClientRect = jest.fn(() => ({
  width: 1024,
  height: 768,
  top: 0,
  left: 0,
  bottom: 768,
  right: 1024,
  x: 0,
  y: 0,
  toJSON: jest.fn(),
}));

// Mock for SVG elements used by Recharts
if (typeof SVGElement !== 'undefined') {
  SVGElement.prototype.getBoundingClientRect = jest.fn(() => ({
    width: 1024,
    height: 768,
    top: 0,
    left: 0,
    bottom: 768,
    right: 1024,
    x: 0,
    y: 0,
    toJSON: jest.fn(),
  }));
}

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock Recharts ResponsiveContainer specific behavior
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children, width = 1024, height = 768 }) => (
      <div style={{ width, height }}>{children}</div>
    ),
  };
});

// Increase memory limit for tests
if (typeof process !== 'undefined' && process.env) {
  process.env.NODE_OPTIONS = '--max-old-space-size=4096';
}