/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations for AC7
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react'],
  },
  
  // Bundle optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Bundle splitting for dashboard components
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            priority: -10,
            chunks: 'all',
            maxSize: 244000, // 244KB max chunk size
          },
          dashboard: {
            test: /[\\/]components[\\/]dashboard[\\/]/,
            name: 'dashboard',
            priority: 10,
            chunks: 'all',
            maxSize: 200000, // 200KB max for dashboard components
          },
          charts: {
            test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
            name: 'charts',
            priority: 20,
            chunks: 'all',
            maxSize: 150000, // 150KB max for chart libraries
          },
        },
      };
    }
    
    // Optimize imports
    config.resolve.alias = {
      ...config.resolve.alias,
      'recharts': 'recharts/es6',
    };
    
    return config;
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year cache
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Compression and caching
  compress: true,
  poweredByHeader: false,
  
  // Headers for performance and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/dashboard/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=600',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Redirect optimization
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard/overview',
        permanent: false,
      },
    ];
  },
  
  // Environment-specific optimizations
  env: {
    NEXT_PUBLIC_PERFORMANCE_MONITORING: process.env.NODE_ENV === 'production' ? 'true' : 'false',
  },
};

module.exports = nextConfig;