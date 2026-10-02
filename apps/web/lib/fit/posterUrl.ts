/**
 * Fit poster URL rules.
 *
 * A stored thumbnail_url like "fit-media/FO55-035/poster-1920x1080.png" is a
 * private bucket key, not a browser URL. Returning it as an img src resolves
 * against the site and 404s. Callers must exchange the key for an https URL
 * or use a signed image.mux.com thumbnail instead.
 */

const POSTER_IMAGE_RE = /\.(png|jpe?g|webp)$/i

/** Object key inside the private fit-media bucket. Null for anything else. */
export function fitMediaObjectKey(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed || /^https?:\/\//i.test(trimmed)) return null
  if (/[\\?#]/.test(trimmed)) return null
  const stripped = trimmed.replace(/^\/+/, '')
  if (!stripped.startsWith('fit-media/')) return null
  const key = stripped.slice('fit-media/'.length)
  if (!key) return null
  const parts = key.split('/')
  if (parts.some(part => part === '' || part === '.' || part === '..')) return null
  if (!POSTER_IMAGE_RE.test(key)) return null
  return key
}

/** True only for an absolute https URL a browser can request directly. */
export function isAbsoluteHttpsUrl(value: string | null | undefined): boolean {
  if (!value) return false
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * A signed Supabase storage URL for one poster object.
 * Relative paths, video files, and non-Supabase hosts are dropped.
 */
export function fitSignedStoragePosterUrl(value: string | null | undefined): string | null {
  if (!isAbsoluteHttpsUrl(value)) return null
  const url = new URL(value!)
  if (!url.hostname.endsWith('.supabase.co')) return null
  if (!url.pathname.includes('/storage/v1/object/')) return null
  if (/\.(m3u8|mp4|webm|mov)(\?|$)/i.test(url.pathname)) return null
  if (/stream\.mux\.com|\.m3u8/i.test(url.href)) return null
  return url.toString()
}
