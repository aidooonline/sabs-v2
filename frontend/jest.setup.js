import '@testing-library/jest-dom'

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

    clone() {
      return new Request(this.url, {
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

// Enhanced Mock fetch for RTK Query with proper endpoint handling and clone support
const createMockFetch = () => {
  // Create mock response storage
  const mockEndpointResponses = new Map();
  const mockEndpointDelays = new Map();
  const mockEndpointErrors = new Map();

  // Helper function to create Response-like object with clone method
  const createMockResponse = (body, options = {}) => {
    const responseData = JSON.stringify(body);
    const response = new Response(responseData, {
      status: options.status || 200,
      statusText: options.statusText || (options.status === 200 ? 'OK' : 'Error'),
      headers: new Headers({ 'Content-Type': 'application/json', ...options.headers })
    });
    
    // Ensure clone method works properly for RTK Query
    const originalClone = response.clone;
    response.clone = function() {
      try {
        return originalClone.call(this);
      } catch (e) {
        // Fallback implementation if native clone fails
        return new Response(responseData, {
          status: this.status,
          statusText: this.statusText,
          headers: this.headers
        });
      }
    };
    
    return response;
  };

  const fetchMock = jest.fn((url, options) => {
    // Check for endpoint-specific configurations
    const endpoint = url;
    
    // Check for error simulation first
    for (const [errorEndpoint, errorConfig] of mockEndpointErrors) {
      if (url.includes(errorEndpoint)) {
        if (errorConfig.status === 0) {
          return Promise.reject(new Error(errorConfig.message || 'Network Error'));
        }
        
        const errorResponse = createMockResponse(
          { message: errorConfig.message }, 
          { status: errorConfig.status, statusText: 'Error' }
        );
        
        return Promise.resolve(errorResponse);
      }
    }
    
    // Check for delay simulation
    for (const [delayEndpoint, delayMs] of mockEndpointDelays) {
      if (url.includes(delayEndpoint)) {
        return new Promise(resolve => {
          setTimeout(() => {
            const response = createMockResponse({});
            resolve(response);
          }, delayMs);
        });
      }
    }
    
    // Check for custom response
    for (const [responseEndpoint, responseConfig] of mockEndpointResponses) {
      if (url.includes(responseEndpoint)) {
        const response = createMockResponse(
          responseConfig.data || {}, 
          { status: responseConfig.status || 200 }
        );
        
        return Promise.resolve(response);
      }
    }
    
    // Default response with proper clone support
    const defaultResponse = createMockResponse({});
    return Promise.resolve(defaultResponse);
  });

  // Add test utility methods that actually work
  fetchMock.setEndpointResponse = jest.fn((endpoint, response) => {
    mockEndpointResponses.set(endpoint, response);
  });

  fetchMock.simulateError = jest.fn((endpoint, status, message) => {
    mockEndpointErrors.set(endpoint, { status, message });
  });

  fetchMock.simulateSlowNetwork = jest.fn((endpoint, delay) => {
    mockEndpointDelays.set(endpoint, delay);
  });

  // Add reset method
  fetchMock.resetMocks = jest.fn(() => {
    mockEndpointResponses.clear();
    mockEndpointDelays.clear();
    mockEndpointErrors.clear();
    fetchMock.mockClear();
  });

  // Store references for debugging
  fetchMock._mockEndpointResponses = mockEndpointResponses;
  fetchMock._mockEndpointDelays = mockEndpointDelays;
  fetchMock._mockEndpointErrors = mockEndpointErrors;

  return fetchMock;
};

global.fetch = createMockFetch();

// Reset fetch mock before each test
beforeEach(() => {
  global.fetch.mockClear();
  if (global.fetch.resetMocks) {
    global.fetch.resetMocks();
  }
  if (global.fetch.setEndpointResponse) {
    global.fetch.setEndpointResponse.mockClear();
  }
  if (global.fetch.simulateError) {
    global.fetch.simulateError.mockClear();
  }
  if (global.fetch.simulateSlowNetwork) {
    global.fetch.simulateSlowNetwork.mockClear();
  }
});

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