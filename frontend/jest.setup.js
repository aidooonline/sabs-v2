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
}