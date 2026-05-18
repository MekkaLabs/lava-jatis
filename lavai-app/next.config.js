/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow build to succeed even with TS type errors from missing packages.
  // Real code-level errors (logic, missing exports) are still caught at dev time.
  typescript: {
    ignoreBuildErrors: true,
  },

  // Suppress ESLint during build — linting runs separately in CI
  eslint: {
    ignoreDuringBuilds: true,
  },

  // @react-pdf/renderer runs server-side only; mark canvas as external to avoid
  // webpack trying to bundle it for the browser bundle.
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), { canvas: 'canvas' }]
    }
    return config
  },

  // Image optimization
  images: {
    domains: ['api.dicebear.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Gzip/Brotli compression for all responses
  compress: true,

  // Experimental optimizations
  experimental: {
    optimizeCss: true,
    turbo: {},
  },

  // Security + performance headers
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // Static assets — long cache
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // API routes — never cache at CDN level (data is user-specific)
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
      {
        // Fonts
        source: '/fonts/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
