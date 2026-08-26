/**
 * Site-wide public URL helpers for the www cutover.
 *
 * Dual host (platform.evolvedpros.com + www.evolvedpros.com) serves the same
 * public pages. Canonicals and og:url must always name the www brand host so
 * Google does not index both. Do not hardcode platform here, and do not read
 * the request host — a preview or platform request still canonicalizes to www.
 *
 * Runtime-dependency-free (type-only `next` import). Same reason as
 * publicRoutes.ts: anything that touches @/lib/supabase/admin throws at
 * import time under vitest.
 */

import type { Metadata } from 'next'

/** Brand origin for every public indexable URL. Apex 301s here. */
export const CANONICAL_ORIGIN = 'https://www.evolvedpros.com'

const EVOLVED_PROS_HOSTS = new Set([
  'www.evolvedpros.com',
  'evolvedpros.com',
  'platform.evolvedpros.com',
])

/**
 * Resolve the public canonical origin from an env value.
 *
 * platform / apex / missing / unparseable / preview hosts all collapse to
 * www.evolvedpros.com. App/email links that must stay on platform should use
 * NEXT_PUBLIC_APP_URL, not this helper.
 */
export function resolveCanonicalOrigin(raw?: string | null): string {
  if (!raw) return CANONICAL_ORIGIN
  try {
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`)
    const host = url.hostname.toLowerCase()
    if (EVOLVED_PROS_HOSTS.has(host) || host.endsWith('.evolvedpros.com')) {
      return CANONICAL_ORIGIN
    }
    return CANONICAL_ORIGIN
  } catch {
    return CANONICAL_ORIGIN
  }
}

/** Path shape used in sitemap locs and canonical tags: `/`, `/media`, `/media/a/b`. */
export function canonicalizePath(pathname: string): string {
  if (!pathname) return '/'
  const withLeading = pathname.startsWith('/') ? pathname : `/${pathname}`
  const stripped = withLeading.replace(/\/+$/, '')
  return stripped === '' ? '/' : stripped
}

/** Absolute www URL for a public path. Never the platform host. */
export function canonicalUrl(pathname: string = '/'): string {
  const path = canonicalizePath(pathname)
  return path === '/' ? CANONICAL_ORIGIN : `${CANONICAL_ORIGIN}${path}`
}

/** Root-layout OG fields Next.js will drop when a child sets `openGraph`. */
export const DEFAULT_OPEN_GRAPH = {
  type: 'website' as const,
  siteName: 'Evolved Pros',
}

function metadataString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

/**
 * Metadata fragment every public indexable page should spread or return.
 * Sets rel=canonical and the matching og:url. Extra title/description/og
 * fields merge on top; canonical + og:url always win so a caller cannot
 * accidentally reintroduce the platform host.
 *
 * Next.js only shallow-merges metadata: a child `openGraph` replaces the
 * parent object, so this helper re-applies siteName / type (and copies
 * title / description onto og tags) instead of relying on layout inherit.
 */
export function publicPageMetadata(
  pathname: string,
  extra: Metadata = {},
): Metadata {
  const url = canonicalUrl(pathname)
  const { openGraph, alternates, ...rest } = extra
  const title = metadataString(extra.title)
  const description = metadataString(extra.description)
  return {
    ...rest,
    alternates: { ...alternates, canonical: url },
    openGraph: {
      ...DEFAULT_OPEN_GRAPH,
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...openGraph,
      url,
    },
  }
}
