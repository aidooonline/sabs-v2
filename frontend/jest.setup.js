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

// Mock fetch for RTK Query
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new Headers(),
    clone: () => ({}),
  })
);

// Reset fetch mock before each test
beforeEach(() => {
  global.fetch.mockClear();
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