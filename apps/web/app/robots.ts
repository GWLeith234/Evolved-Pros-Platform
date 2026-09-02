import { MetadataRoute } from 'next'
import { CANONICAL_ORIGIN } from '@/lib/seo/canonical'
import { ROBOTS_DISALLOW, robotsSitemapUrl } from '@/lib/seo/publicRoutes'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...ROBOTS_DISALLOW],
      },
    ],
    // Always www.evolvedpros.com — never platform, never the Railway host.
    sitemap: robotsSitemapUrl(CANONICAL_ORIGIN),
  }
}
