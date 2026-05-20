/** @type {import('next').NextConfig} */
const nextConfig = {
  // Type errors fail the build. Bugs reais não devem passar invisíveis.
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint roda no build. Warnings não bloqueiam (only errors).
  eslint: {
    ignoreDuringBuilds: false,
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
    turbo: {},
  },

  // Security + performance headers
  async headers() {
    // CSP — bloqueia XSS via script externo, mas precisa permitir Supabase realtime,
    // Cloudflare Turnstile, GA, DiceBear, Next.js inline runtime e fontes do Google.
    // 'unsafe-inline'/'unsafe-eval' em scripts são necessários pro Next.js client runtime.
    // TODO futuro: substituir por nonce-based CSP.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://*.supabase.co https://api.dicebear.com https://www.google-analytics.com https://www.googletagmanager.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://challenges.cloudflare.com",
      "frame-src 'self' https://challenges.cloudflare.com",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; ')

    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
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
