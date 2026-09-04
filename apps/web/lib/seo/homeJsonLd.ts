/**
 * Homepage structured data. Vitest only collects lib/**, so the schema
 * lives here (same reason as publicRoutes / conversion copy locks).
 *
 * DEPENDENCY-LIGHT: canonical origin + homepage copy. No next, no supabase.
 */

import { HOME_SUB } from '@/lib/home/conversion'
import { FOOTER_LEGAL_ENTITY } from '@/lib/layout/publicFooter'
import { CANONICAL_ORIGIN } from './canonical'

export const HOME_JSON_LD_ORG_NAME = 'Evolved Pros'

export function homeOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: HOME_JSON_LD_ORG_NAME,
    legalName: FOOTER_LEGAL_ENTITY,
    url: CANONICAL_ORIGIN,
    description: HOME_SUB,
  }
}

export function homeWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: HOME_JSON_LD_ORG_NAME,
    url: CANONICAL_ORIGIN,
    description: HOME_SUB,
    publisher: {
      '@type': 'Organization',
      name: HOME_JSON_LD_ORG_NAME,
      url: CANONICAL_ORIGIN,
    },
  }
}
