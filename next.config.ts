import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Security headers — iframe/embed protections are prod-only so local
  // dev previews can render the site in tooling iframes.
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=(), payment=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          ...(isProd
            ? [
                { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
                { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
              ]
            : []),
        ],
      },
      // API routes - more restrictive
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // Redirect HTTP to HTTPS in production
  async redirects() {
    return [];
  },

  // Rewrite configuration
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: 'NEXUS AI',
  },

  // Optimize production builds
  productionBrowserSourceMaps: false,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Compression
  compress: true,

  // React strict mode for development
  reactStrictMode: true,

  // Experimental features
  experimental: {
    // Enable modern JavaScript for better performance
    optimizePackageImports: ['@/components', '@/lib'],
  },
};

export default nextConfig;
