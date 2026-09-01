import { MetadataRoute } from 'next'
import { CANONICAL_ORIGIN } from '@/lib/seo/canonical'
import { robotsSitemapUrl } from '@/lib/seo/publicRoutes'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/auth/', '/onboarding', '/dev-login'],
      },
    ],
    // Always www.evolvedpros.com — never platform, never the Railway host.
    sitemap: robotsSitemapUrl(CANONICAL_ORIGIN),
  }
}
