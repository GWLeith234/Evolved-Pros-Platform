/**
 * Public static files. Middleware treats /academy and /events as the member
 * app, so brand stills must live under /brand and stay off those prefixes.
 */

export const PUBLIC_BRAND_PREFIX = '/brand' as const

const PUBLIC_BRAND_STATIC_EXT = /\.(?:svg|png|jpe?g|webp|gif|ico|woff2?)$/i

export function isPublicBrandAsset(pathname: string): boolean {
  if (!pathname.startsWith(`${PUBLIC_BRAND_PREFIX}/`)) return false
  return PUBLIC_BRAND_STATIC_EXT.test(pathname)
}
