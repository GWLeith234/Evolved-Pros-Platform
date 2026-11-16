/**
 * Gate for image uploads that write the public Branding bucket with the
 * service role. A client-supplied Content-Type is not a boundary: an SVG or
 * HTML body labeled image/svg+xml or text/html would be stored and served
 * inline. The object type is taken from the byte signature and the key
 * extension is taken from that type.
 *
 * image/jpg and image/pjpeg are non-standard labels for JPEG (some Android
 * content providers and older clients send them). application/octet-stream
 * means the client did not know the type, same as an omitted type, so the
 * signature decides. The filename is never consulted.
 */

export const ADMIN_IMAGE_MAX_BYTES = 10 * 1024 * 1024
export const ADMIN_IMAGE_BUCKET = 'Branding'

const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
} as const

export type AdminImageMime = keyof typeof EXT_BY_MIME

const FOLDER_RE = /^[a-z0-9][a-z0-9_-]{0,40}$/i

export type AdminImageDecision =
  | {
      ok: true
      bucket: typeof ADMIN_IMAGE_BUCKET
      path: string
      contentType: AdminImageMime
    }
  | { ok: false; status: 400 | 413 | 415; error: string }

export function normalizeImageMime(type: string | null | undefined): string {
  return (type ?? '').toLowerCase().split(';')[0].trim()
}

/** Declared type used for the mismatch check. '' means "unspecified, sniff". */
export function canonicalDeclaredMime(type: string | null | undefined): string {
  const normalized = normalizeImageMime(type)
  if (normalized === 'application/octet-stream') return ''
  if (normalized === 'image/jpg' || normalized === 'image/pjpeg' || normalized === 'image/jpe') {
    return 'image/jpeg'
  }
  return normalized
}

export type ImageByteDecision =
  | { ok: true; contentType: AdminImageMime; ext: string }
  | { ok: false; status: 400 | 413 | 415; error: string }

export function validateImageBytes(input: {
  declaredType: string | null | undefined
  byteLength: number
  bytes?: Uint8Array | null
  maxBytes?: number
  tooLargeError?: string
}): ImageByteDecision {
  const maxBytes = input.maxBytes ?? ADMIN_IMAGE_MAX_BYTES
  const size = input.bytes ? input.bytes.byteLength : input.byteLength
  if (size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024))
    return {
      ok: false,
      status: 413,
      error: input.tooLargeError ?? `File too large (max ${mb}MB).`,
    }
  }
  if (size <= 0) return { ok: false, status: 400, error: 'File is empty.' }

  const declared = canonicalDeclaredMime(input.declaredType)
  if (declared && !(declared in EXT_BY_MIME)) {
    return { ok: false, status: 415, error: 'Unsupported image type.' }
  }

  const sniffed = input.bytes ? sniffImageMime(input.bytes) : null
  if (!sniffed || (declared && declared !== sniffed)) {
    return { ok: false, status: 415, error: 'Unsupported image type.' }
  }

  return { ok: true, contentType: sniffed, ext: EXT_BY_MIME[sniffed] }
}

/**
 * One storage-key segment. Rejects slashes and `..` so a caller-supplied
 * slug or id cannot leave its prefix.
 */
export function safeStorageSegment(value: string): string | null {
  const segment = value.trim()
  if (segment.length < 1 || segment.length > 512) return null
  if (segment.includes('..')) return null
  if (!/^[A-Za-z0-9_-][A-Za-z0-9._-]*$/.test(segment)) return null
  return segment
}

export function sniffImageMime(bytes: Uint8Array): AdminImageMime | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  if (
    bytes.length >= 8
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return 'image/png'
  }
  if (bytes.length >= 6) {
    const sig = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5])
    if (sig === 'GIF87a' || sig === 'GIF89a') return 'image/gif'
  }
  if (
    bytes.length >= 12
    && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
    && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return 'image/webp'
  }
  return null
}

function resolveBucket(bucket: unknown): typeof ADMIN_IMAGE_BUCKET | null {
  if (bucket == null || bucket === '') return ADMIN_IMAGE_BUCKET
  if (bucket !== ADMIN_IMAGE_BUCKET) return null
  return ADMIN_IMAGE_BUCKET
}

function resolveFolder(folder: unknown): string | null {
  if (folder == null || folder === '') return 'uploads'
  if (typeof folder !== 'string' || !FOLDER_RE.test(folder)) return null
  return folder
}

export function validateAdminImageUpload(input: {
  bucket: unknown
  folder: unknown
  declaredType: string | null | undefined
  byteLength: number
  bytes?: Uint8Array | null
  now?: number
}): AdminImageDecision {
  const bucket = resolveBucket(input.bucket)
  if (!bucket) return { ok: false, status: 400, error: 'Unsupported bucket.' }

  const folder = resolveFolder(input.folder)
  if (!folder) return { ok: false, status: 400, error: 'Unsupported folder.' }

  const image = validateImageBytes({
    declaredType: input.declaredType,
    byteLength: input.byteLength,
    bytes: input.bytes,
  })
  if (!image.ok) return image

  const now = input.now ?? Date.now()
  return {
    ok: true,
    bucket,
    path: `${folder}/${now}.${image.ext}`,
    contentType: image.contentType,
  }
}
