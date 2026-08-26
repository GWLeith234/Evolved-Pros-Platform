import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/podcast/public'
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
    // Derived from SITE_URL, never hardcoded: this used to name
    // platform.evolvedpros.com while every canonical tag pointed elsewhere.
    sitemap: robotsSitemapUrl(SITE_URL),
  }
}
