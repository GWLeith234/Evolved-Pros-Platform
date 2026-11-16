/**
 * Public origin helpers.
 *
 * These two env vars are NOT duplicates:
 *
 *   NEXT_PUBLIC_APP_URL  — app origin other callers still read (Stripe return
 *                          URLs, emails, guest links). Production is often
 *                          https://platform.evolvedpros.com. Auth redirects do
 *                          not use this raw value. lib/auth/authOrigin.ts
 *                          canonicalizes brand hosts to
 *                          https://www.evolvedpros.com.
 *
 *   NEXT_PUBLIC_SITE_URL — brand / SEO origin for callers that read this env.
 *                          Falls back to APP_URL when unset so a missing
 *                          SITE_URL cannot break callers. The code default
 *                          remains https://platform.evolvedpros.com. Public
 *                          sitemap and HTML canonicals use CANONICAL_ORIGIN
 *                          (https://www.evolvedpros.com) directly.
 *
 * Each helper accepts the other as a fallback alias so existing callers that
 * only set one var keep working. Do not invent a third name.
 */

const DEFAULT_APP_URL = 'https://platform.evolvedpros.com'
const DEFAULT_SITE_URL = 'https://platform.evolvedpros.com'

function trimOrigin(value: string | undefined): string | undefined {
  const trimmed = value?.trim().replace(/\/+$/, '')
  return trimmed ? trimmed : undefined
}

/** App origin — platform.evolvedpros.com. Prefer APP_URL, then SITE_URL. */
export function getAppUrl(
  appUrl: string | undefined = process.env.NEXT_PUBLIC_APP_URL,
  siteUrl: string | undefined = process.env.NEXT_PUBLIC_SITE_URL,
): string {
  return trimOrigin(appUrl) ?? trimOrigin(siteUrl) ?? DEFAULT_APP_URL
}

/** Brand / SEO origin. Prefer SITE_URL, then APP_URL. */
export function getSiteUrl(
  siteUrl: string | undefined = process.env.NEXT_PUBLIC_SITE_URL,
  appUrl: string | undefined = process.env.NEXT_PUBLIC_APP_URL,
): string {
  return trimOrigin(siteUrl) ?? trimOrigin(appUrl) ?? DEFAULT_SITE_URL
}
