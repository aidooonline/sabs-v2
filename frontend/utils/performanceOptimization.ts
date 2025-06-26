// Performance Optimization Utilities for Production Deployment

// Cache Configuration
export interface CacheConfig {
  strategy: 'lru' | 'lfu' | 'fifo' | 'ttl';
  maxSize: number;
  ttl?: number; // Time to live in milliseconds
  updatePolicy?: 'lazy' | 'eager' | 'periodic';
}

// Memory Management
export class MemoryCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; hits: number }>();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  set(key: string, value: T): void {
    // Implement cache eviction based on strategy
    if (this.cache.size >= this.config.maxSize) {
      this.evict();
    }

    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      hits: 0
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check TTL if configured
    if (this.config.ttl && Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count for LFU strategy
    entry.hits++;
    return entry.data;
  }

  private evict(): void {
    if (this.cache.size === 0) return;

    let keyToEvict: string;
    
    switch (this.config.strategy) {
      case 'lru':
        // Evict least recently used
        keyToEvict = Array.from(this.cache.keys())[0];
        break;
      case 'lfu':
        // Evict least frequently used
        keyToEvict = Array.from(this.cache.entries())
          .sort(([, a], [, b]) => a.hits - b.hits)[0][0];
        break;
      case 'fifo':
        // Evict first in
        keyToEvict = Array.from(this.cache.keys())[0];
        break;
      case 'ttl':
        // Evict expired entries first, then oldest
        const now = Date.now();
        const expired = Array.from(this.cache.entries())
          .find(([, entry]) => now - entry.timestamp > (this.config.ttl || 0));
        keyToEvict = expired ? expired[0] : Array.from(this.cache.keys())[0];
        break;
      default:
        keyToEvict = Array.from(this.cache.keys())[0];
    }

    this.cache.delete(keyToEvict);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): { size: number; hitRate: number; memoryUsage: number } {
    const totalHits = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.hits, 0);
    const averageHits = this.cache.size > 0 ? totalHits / this.cache.size : 0;
    
    return {
      size: this.cache.size,
      hitRate: averageHits,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in bytes
    return this.cache.size * 1024; // Assume 1KB per entry on average
  }
}

// Data Prefetching Strategy
export class DataPrefetcher {
  private prefetchQueue = new Set<string>();
  private prefetchCallbacks = new Map<string, () => Promise<any>>();

  register(key: string, fetchFn: () => Promise<any>): void {
    this.prefetchCallbacks.set(key, fetchFn);
  }

  schedule(key: string, delay = 0): void {
    setTimeout(() => {
      if (!this.prefetchQueue.has(key)) {
        this.prefetchQueue.add(key);
        this.executePrefetch(key);
      }
    }, delay);
  }

  private async executePrefetch(key: string): Promise<void> {
    const fetchFn = this.prefetchCallbacks.get(key);
    if (!fetchFn) return;

    try {
      await fetchFn();
    } catch (error) {
      console.warn(`Prefetch failed for ${key}:`, error);
    } finally {
      this.prefetchQueue.delete(key);
    }
  }

  clear(): void {
    this.prefetchQueue.clear();
  }
}

// Performance Monitoring
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();
  private observers = new Map<string, PerformanceObserver>();

  startMeasuring(name: string): void {
    performance.mark(`${name}-start`);
  }

  endMeasuring(name: string): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measures = performance.getEntriesByName(name, 'measure') as PerformanceEntry[];
    const duration = measures[measures.length - 1]?.duration || 0;
    
    this.recordMetric(name, duration);
    return duration;
  }

  private recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetrics(name: string): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    return {
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  }

  observeResourceTiming(): void {
    if (!this.observers.has('resource')) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.recordMetric(`resource-${entry.name}`, entry.duration);
          }
        }
      });
      
      observer.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', observer);
    }
  }

  observeNavigationTiming(): void {
    if (!this.observers.has('navigation')) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('domContentLoaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
            this.recordMetric('loadComplete', navEntry.loadEventEnd - navEntry.loadEventStart);
          }
        }
      });
      
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', observer);
    }
  }

  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Virtual Scrolling for Large Lists
export interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  overscan: number; // Number of items to render outside visible area
}

export class VirtualScrollCalculator {
  private config: VirtualScrollConfig;

  constructor(config: VirtualScrollConfig) {
    this.config = config;
  }

  calculateVisibleRange(scrollTop: number, totalItems: number): { start: number; end: number; offset: number } {
    const { itemHeight, containerHeight, overscan } = this.config;
    
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      totalItems - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight)
    );

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(totalItems - 1, visibleEnd + overscan);
    const offset = start * itemHeight;

    return { start, end, offset };
  }

  getTotalHeight(totalItems: number): number {
    return totalItems * this.config.itemHeight;
  }
}

// Debounced and Throttled Functions
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Lazy Loading Utilities
export class LazyLoader {
  private observer: IntersectionObserver;
  private callbacks = new Map<Element, () => void>();

  constructor(options: IntersectionObserverInit = {}) {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const callback = this.callbacks.get(entry.target);
          if (callback) {
            callback();
            this.unobserve(entry.target);
          }
        }
      });
    }, { threshold: 0.1, ...options });
  }

  observe(element: Element, callback: () => void): void {
    this.callbacks.set(element, callback);
    this.observer.observe(element);
  }

  unobserve(element: Element): void {
    this.callbacks.delete(element);
    this.observer.unobserve(element);
  }

  disconnect(): void {
    this.observer.disconnect();
    this.callbacks.clear();
  }
}

// Bundle Optimization Utilities
export class BundleOptimizer {
  static async loadChunk(chunkName: string): Promise<any> {
    try {
      const module = await import(/* webpackChunkName: "[request]" */ `../chunks/${chunkName}`);
      return module.default || module;
    } catch (error) {
      console.error(`Failed to load chunk ${chunkName}:`, error);
      throw error;
    }
  }

  static preloadChunk(chunkName: string): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = `/chunks/${chunkName}.js`;
    document.head.appendChild(link);
  }

  static prefetchChunk(chunkName: string): void {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `/chunks/${chunkName}.js`;
    document.head.appendChild(link);
  }
}

// Memory Leak Detection
export class MemoryLeakDetector {
  private references = new Set<any>();
  private checkInterval: NodeJS.Timeout | null = null;

  startMonitoring(interval = 30000): void {
    this.checkInterval = setInterval(() => {
      this.checkForLeaks();
    }, interval);
  }

  addReference(obj: any): void {
    // Store reference with timestamp for tracking
    this.references.add({ ref: obj, timestamp: Date.now() });
  }

  private checkForLeaks(): void {
    const now = Date.now();
    const oldReferences = Array.from(this.references).filter((item: any) => now - item.timestamp > 300000); // 5 minutes
    
    if (oldReferences.length > 100) {
      console.warn(`Potential memory leak detected: ${oldReferences.length} old references found`);
    }

    if (this.references.size > 1000) {
      console.warn('Large number of references detected, consider manual cleanup');
      // Clear old references
      this.references = new Set(Array.from(this.references).filter((item: any) => now - item.timestamp <= 300000));
    }
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Global Performance Configuration
export const performanceConfig = {
  cache: {
    customerData: new MemoryCache({ strategy: 'lru', maxSize: 1000, ttl: 300000 }), // 5 minutes
    transactionData: new MemoryCache({ strategy: 'ttl', maxSize: 5000, ttl: 60000 }), // 1 minute
    reportData: new MemoryCache({ strategy: 'lfu', maxSize: 100, ttl: 900000 }), // 15 minutes
  },
  prefetcher: new DataPrefetcher(),
  monitor: new PerformanceMonitor(),
  lazyLoader: new LazyLoader(),
  memoryDetector: new MemoryLeakDetector(),
  virtualScroll: {
    customerList: new VirtualScrollCalculator({ itemHeight: 80, containerHeight: 600, overscan: 5 }),
    transactionList: new VirtualScrollCalculator({ itemHeight: 60, containerHeight: 400, overscan: 10 }),
  }
};

// Initialize performance monitoring
export function initializePerformanceOptimization(): void {
  const { monitor, memoryDetector } = performanceConfig;
  
  // Start monitoring
  monitor.observeResourceTiming();
  monitor.observeNavigationTiming();
  memoryDetector.startMonitoring();

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    monitor.disconnect();
    memoryDetector.stopMonitoring();
  });

  console.log('Performance optimization initialized');
}