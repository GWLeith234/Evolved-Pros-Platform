/**
 * Publishing a media story requires owned hero art.
 * Owned means the project's Supabase storage public URL
 * (`{NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/...`).
 * Empty art and outside hosts (images.unsplash.com and the like) are refused.
 */

export const PUBLISH_HERO_REQUIRED =
  "Publishing needs owned hero art stored on this project's Supabase storage. An empty image, or a link on another host such as images.unsplash.com, cannot go live."

export const HERO_KEY_MISSING_MESSAGE =
  'Hero art was not generated. XAI_API_KEY is not configured on the server. Set it in the server environment and save the draft again.'

const PUBLIC_OBJECT_MARKER = '/storage/v1/object/public/'

export function isOwnedFeaturedImage(
  url: string | null | undefined,
  supabaseUrl: string | null | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL,
): boolean {
  if (!url || !supabaseUrl) return false
  const trimmed = url.trim()
  if (!trimmed) return false
  let parsed: URL
  let base: URL
  try {
    parsed = new URL(trimmed)
    base = new URL(supabaseUrl)
  } catch {
    return false
  }
  if (parsed.origin !== base.origin) return false
  return parsed.pathname.includes(PUBLIC_OBJECT_MARKER)
}

export function publishGuardDecision(input: {
  isPublished: boolean
  featuredImageUrl: string | null | undefined
  supabaseUrl?: string | null
}): { allow: true } | { allow: false; error: string } {
  if (!input.isPublished) return { allow: true }
  const supabaseUrl = input.supabaseUrl === undefined
    ? process.env.NEXT_PUBLIC_SUPABASE_URL
    : input.supabaseUrl
  if (isOwnedFeaturedImage(input.featuredImageUrl, supabaseUrl)) return { allow: true }
  return { allow: false, error: PUBLISH_HERO_REQUIRED }
}

/** Image that would be stored if this publish request succeeds. */
export function featuredImageForPublish(input: {
  bodyHasImage: boolean
  bodyImage: unknown
  currentImage?: string | null
}): string | null {
  if (!input.bodyHasImage) {
    if (typeof input.currentImage === 'string' && input.currentImage.trim()) {
      return input.currentImage.trim()
    }
    return null
  }
  if (typeof input.bodyImage === 'string' && input.bodyImage.trim()) return input.bodyImage.trim()
  return null
}

export function brandingObjectPathFromPublicUrl(
  publicUrl: string,
  supabaseUrl: string | null | undefined,
): string | null {
  if (!isOwnedFeaturedImage(publicUrl, supabaseUrl)) return null
  if (/%2e%2e|\.\./i.test(publicUrl)) return null
  const parsed = new URL(publicUrl.trim())
  const idx = parsed.pathname.indexOf(PUBLIC_OBJECT_MARKER)
  if (idx < 0) return null
  let rest = ''
  try {
    rest = decodeURIComponent(parsed.pathname.slice(idx + PUBLIC_OBJECT_MARKER.length))
  } catch {
    return null
  }
  const slash = rest.indexOf('/')
  if (slash < 0) return null
  const bucket = rest.slice(0, slash)
  if (bucket !== 'Branding') return null
  const objectPath = rest.slice(slash + 1)
  if (!objectPath || objectPath.includes('..')) return null
  return objectPath
}
