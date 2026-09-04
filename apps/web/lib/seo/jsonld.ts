/**
 * Public JSON-LD builders. Podcast and article routes keep their inline
 * schemas; home is the only surface that was shipping without a script.
 *
 * Brand lock: Evolved Pros. Never Evolved Media.
 */

import { HOME_SUB } from '@/lib/home/conversion'
import { CANONICAL_ORIGIN, SITE_NAME } from '@/lib/seo/canonical'

export function homeOrganizationJsonLd() {
  return {
    '@type': 'Organization',
    name: SITE_NAME,
    url: CANONICAL_ORIGIN,
  }
}

/** WebSite + nested Organization for `/`. Matches article publisher naming. */
export function homeJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: CANONICAL_ORIGIN,
    description: HOME_SUB,
    publisher: homeOrganizationJsonLd(),
  }
}
