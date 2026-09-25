/**
 * Response headers for /media/preview.
 * Kept free of node:crypto so middleware (edge) can import it.
 */

export const PREVIEW_ROBOTS_TAG = 'noindex, nofollow'
export const PREVIEW_CACHE_CONTROL = 'private, no-store'

export function isMediaPreviewPath(pathname: string): boolean {
  return pathname === '/media/preview' || pathname.startsWith('/media/preview/')
}

export function applyPreviewResponseHeaders(headers: { set: (name: string, value: string) => void }): void {
  headers.set('X-Robots-Tag', PREVIEW_ROBOTS_TAG)
  headers.set('Cache-Control', PREVIEW_CACHE_CONTROL)
}
