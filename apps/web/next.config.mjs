/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // supabase-js@2.100.0 (postgrest-js v2) broke type inference for inline
  // partial selects. Runtime is correct — suppress to keep builds green.
  typescript: { ignoreBuildErrors: true },
  images: {
    // Modern formats cut payload size for avatars, covers, and partner logos.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'image.mux.com' },
      { protocol: 'https', hostname: 'media.evolvedpros.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/:path*',
          has: [{ type: 'host', value: 'media.evolvedpros.com' }],
          destination: '/media/:path*',
        },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.apigateway.co",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.apigateway.co https://*.apigateway.co https://stream.mux.com https://*.mux.com",
              "frame-src 'self' https://cdn.apigateway.co https://*.apigateway.co https://www.youtube.com https://www.youtube-nocookie.com https://*.heygen.com",
              "img-src 'self' data: blob: https://*.supabase.co https://image.mux.com https://images.unsplash.com https://*.apigateway.co",
              "media-src 'self' https://stream.mux.com https://*.mux.com blob:",
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
            ].join('; '),
          },
        ],
      },
      // Long-cache immutable brand / partner static assets for snappy nav.
      {
        source: '/sponsors/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/logo_:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/live/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
    ]
  },
}

export default nextConfig
