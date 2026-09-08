import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { appRedirects } from './lib/seo/appRedirects.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Monorepo: trace workspace packages so standalone includes them, and so
  // the emit path is apps/web/.next/standalone/apps/web/server.js (the path
  // railway.toml / scripts/start-standalone.sh boot).
  outputFileTracingRoot: path.join(__dirname, '../..'),
  // supabase-js@2.100.0 (postgrest-js v2) broke type inference for inline
  // partial selects. Runtime is correct — suppress to keep builds green.
  typescript: { ignoreBuildErrors: true },

  // Sprint 4C — tree-shake barrel imports from the design system.
  experimental: {
    optimizePackageImports: ['@evolved-pros/ui'],
    outputFileTracingIncludes: {
      '/api/admin/thanks/send': ['./lib/resend/emails/community-thanks/v12/**/*'],
      '/api/admin/thanks/batch': ['./lib/resend/emails/community-thanks/v12/**/*'],
    },
  },

  images: {
    // Modern formats cut payload size for avatars, covers, and partner logos.
    formats: ['image/avif', 'image/webp'],
    // Longer CDN cache for remote brand assets (LCP-friendly after first hit).
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'image.mux.com' },
      { protocol: 'https', hostname: 'media.evolvedpros.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },

  // Prefer modern JS for smaller client bundles when browsers support it.
  compiler: {
    // Strip console.* in production except error/warn (noise reduction + bytes).
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
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
  async redirects() {
    // Host + path redirects live in lib/seo/appRedirects.mjs so they can be
    // unit-tested. Do not re-add a platform.evolvedpros.com → www 308:
    // www is still Bluehost WordPress until George YES on DNS.
    return appRedirects()
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.apigateway.co https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://scripts.clarity.ms",
              // Firebase/Firestore + Google hosts: the apigateway webchat widget
              // delivers replies over Firestore's WebChannel (googleapis/firebaseio),
              // resolves an install id (firebaseinstallations), and probes
              // connectivity via www.google.com's long-poll fallback. Without these
              // the reply listener can't connect ("Could not reach Cloud Firestore").
              // Audience analytics (optional, env-gated): GA4 gtag + Clarity.
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.apigateway.co https://*.apigateway.co wss://*.apigateway.co https://stream.mux.com https://*.mux.com https://*.googleapis.com wss://*.googleapis.com https://firestore.googleapis.com https://firebaseinstallations.googleapis.com https://www.google.com https://*.firebaseio.com wss://*.firebaseio.com https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://www.clarity.ms https://*.clarity.ms",
              "frame-src 'self' https://cdn.apigateway.co https://*.apigateway.co https://www.youtube.com https://www.youtube-nocookie.com https://*.heygen.com",
              "img-src 'self' data: blob: https://*.supabase.co https://image.mux.com https://images.unsplash.com https://*.apigateway.co https://www.google.com https://i.ytimg.com https://img.youtube.com https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://*.clarity.ms",
              "media-src 'self' https://stream.mux.com https://*.mux.com blob:",
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.apigateway.co",
              "font-src 'self' https://fonts.gstatic.com https://cdn.apigateway.co",
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
        source: '/brand/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Static Next assets — aggressive cache (hashed filenames).
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

// Optional bundle analysis: ANALYZE=true pnpm --filter web build
let config = nextConfig
if (process.env.ANALYZE === 'true') {
  try {
    const withBundleAnalyzer = (await import('@next/bundle-analyzer')).default({
      enabled: true,
    })
    config = withBundleAnalyzer(nextConfig)
  } catch {
    console.warn(
      '[next.config] @next/bundle-analyzer not installed — run: pnpm add -D @next/bundle-analyzer -w',
    )
  }
}

export default config
