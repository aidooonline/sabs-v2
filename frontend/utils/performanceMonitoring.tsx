// Performance monitoring and optimization utilities for Dashboard Enhancement Sprint AC7

import React, { useEffect, useCallback, useRef } from 'react';

// Performance metrics interface
export interface PerformanceMetrics {
  componentName: string;
  loadTime: number;
  renderTime: number;
  interactionTime?: number;
  bundleSize?: number;
  timestamp: number;
}

// Performance thresholds for dashboard components (AC7 requirements)
export const PERFORMANCE_THRESHOLDS = {
  LOAD_TIME: 2000, // 2 seconds max load time
  RENDER_TIME: 100, // 100ms max render time
  INTERACTION_TIME: 50, // 50ms max interaction response
  BUNDLE_SIZE: 250000, // 250KB max bundle size
  FCP: 1500, // First Contentful Paint < 1.5s
  LCP: 2500, // Largest Contentful Paint < 2.5s
  CLS: 0.1, // Cumulative Layout Shift < 0.1
  FID: 100, // First Input Delay < 100ms
} as const;

// Performance monitoring hook for dashboard components
export const usePerformanceMonitoring = (componentName: string) => {
  const startTimeRef = useRef<number>(Date.now());
  const renderStartRef = useRef<number>(Date.now());
  const metricsRef = useRef<PerformanceMetrics | null>(null);

  useEffect(() => {
    const loadTime = Date.now() - startTimeRef.current;
    const renderTime = Date.now() - renderStartRef.current;

    metricsRef.current = {
      componentName,
      loadTime,
      renderTime,
      timestamp: Date.now(),
    };

    // Log performance warning if thresholds exceeded
    if (loadTime > PERFORMANCE_THRESHOLDS.LOAD_TIME) {
      console.warn(`⚠️ Performance Warning: ${componentName} load time (${loadTime}ms) exceeds threshold (${PERFORMANCE_THRESHOLDS.LOAD_TIME}ms)`);
    }

    if (renderTime > PERFORMANCE_THRESHOLDS.RENDER_TIME) {
      console.warn(`⚠️ Performance Warning: ${componentName} render time (${renderTime}ms) exceeds threshold (${PERFORMANCE_THRESHOLDS.RENDER_TIME}ms)`);
    }

    // Send metrics to monitoring service in production
    if (process.env.NEXT_PUBLIC_PERFORMANCE_MONITORING === 'true') {
      sendPerformanceMetrics(metricsRef.current);
    }
  }, [componentName]);

  const trackInteraction = useCallback((action: string) => {
    const interactionStart = Date.now();
    return () => {
      const interactionTime = Date.now() - interactionStart;
      if (interactionTime > PERFORMANCE_THRESHOLDS.INTERACTION_TIME) {
        console.warn(`⚠️ Performance Warning: ${componentName} ${action} interaction (${interactionTime}ms) exceeds threshold (${PERFORMANCE_THRESHOLDS.INTERACTION_TIME}ms)`);
      }
    };
  }, [componentName]);

  return {
    metrics: metricsRef.current,
    trackInteraction,
  };
};

// Send performance metrics to monitoring service
const sendPerformanceMetrics = async (metrics: PerformanceMetrics) => {
  try {
    await fetch('/api/monitoring/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metrics),
    });
  } catch (error) {
    console.error('Failed to send performance metrics:', error);
  }
};

// Web Vitals monitoring for Core Web Vitals compliance
export const measureWebVitals = () => {
  if (typeof window === 'undefined') return;

  // First Contentful Paint (FCP)
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        const fcp = entry.startTime;
        if (fcp > PERFORMANCE_THRESHOLDS.FCP) {
          console.warn(`⚠️ FCP Warning: ${fcp.toFixed(2)}ms exceeds threshold (${PERFORMANCE_THRESHOLDS.FCP}ms)`);
        }
      }
    }
  });

  observer.observe({ entryTypes: ['paint'] });

  // Largest Contentful Paint (LCP)
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as any;
    const lcp = lastEntry.renderTime || lastEntry.loadTime;
    
    if (lcp > PERFORMANCE_THRESHOLDS.LCP) {
      console.warn(`⚠️ LCP Warning: ${lcp.toFixed(2)}ms exceeds threshold (${PERFORMANCE_THRESHOLDS.LCP}ms)`);
    }
  });

  lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

  // First Input Delay (FID)
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const fid = (entry as any).processingStart - entry.startTime;
      if (fid > PERFORMANCE_THRESHOLDS.FID) {
        console.warn(`⚠️ FID Warning: ${fid.toFixed(2)}ms exceeds threshold (${PERFORMANCE_THRESHOLDS.FID}ms)`);
      }
    }
  });

  fidObserver.observe({ entryTypes: ['first-input'] });

  // Cumulative Layout Shift (CLS)
  const clsObserver = new PerformanceObserver((list) => {
    let clsValue = 0;
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
      }
    }
    
    if (clsValue > PERFORMANCE_THRESHOLDS.CLS) {
      console.warn(`⚠️ CLS Warning: ${clsValue.toFixed(4)} exceeds threshold (${PERFORMANCE_THRESHOLDS.CLS})`);
    }
  });

  clsObserver.observe({ entryTypes: ['layout-shift'] });
};

// Bundle size analyzer for development
export const analyzeBundleSize = async (componentPath: string) => {
  if (process.env.NODE_ENV !== 'development') return;

  try {
    const stats = await import(`bundle-analyzer:${componentPath}`);
    const size = stats.default?.size || 0;
    
    if (size > PERFORMANCE_THRESHOLDS.BUNDLE_SIZE) {
      console.warn(`⚠️ Bundle Size Warning: ${componentPath} (${(size / 1024).toFixed(2)}KB) exceeds threshold (${(PERFORMANCE_THRESHOLDS.BUNDLE_SIZE / 1024).toFixed(2)}KB)`);
    }
    
    return size;
  } catch (error) {
    console.log('Bundle analysis not available in this environment');
  }
};

// Performance optimization utilities
export const optimizeComponent = {
  // Lazy load component with fallback
  lazy: <T extends React.ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>,
    fallback?: React.ComponentType
  ) => {
    const LazyComponent = React.lazy(importFunc);
    
    return (props: React.ComponentProps<T>) => (
      <React.Suspense fallback={fallback ? React.createElement(fallback) : <div>Loading...</div>}>
        <LazyComponent {...props} />
      </React.Suspense>
    );
  },

  // Memoize expensive components
  memo: <T extends React.ComponentType<any>>(
    Component: T,
    propsAreEqual?: (prevProps: React.ComponentProps<T>, nextProps: React.ComponentProps<T>) => boolean
  ) => {
    return React.memo(Component, propsAreEqual);
  },

  // Debounce function for expensive operations
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): T => {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    }) as T;
  },

  // Throttle function for high-frequency events
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): T => {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    }) as T;
  },
};

// Image optimization helper
export const optimizeImage = (src: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
}) => {
  if (typeof window === 'undefined') return src;

  const params = new URLSearchParams();
  if (options?.width) params.set('w', options.width.toString());
  if (options?.height) params.set('h', options.height.toString());
  if (options?.quality) params.set('q', options.quality.toString());
  if (options?.format && options.format !== 'auto') params.set('f', options.format);

  return `/_next/image?url=${encodeURIComponent(src)}&${params.toString()}`;
};

// Service Worker for offline capability (AC7 requirement)
export const registerServiceWorker = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('SW registered: ', registration);
    
    // Update available
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, refresh the page
            if (confirm('New version available! Refresh to update?')) {
              window.location.reload();
            }
          }
        });
      }
    });
  } catch (error) {
    console.log('SW registration failed: ', error);
  }
};