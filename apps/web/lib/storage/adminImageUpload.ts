/**
 * Gate for POST /api/admin/images/upload.
 *
 * Branding is a public bucket with no mime allowlist and no size ceiling.
 * This route writes with the service role, so a client-supplied bucket name
 * or Content-Type is not a boundary: an SVG or HTML body labeled
 * image/svg+xml or text/html would be stored and served inline. The object
 * type is taken from the byte signature, the key extension is taken from
 * that type, and the bucket stays Branding.
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

  const size = input.bytes ? input.bytes.byteLength : input.byteLength
  if (size > ADMIN_IMAGE_MAX_BYTES) {
    return { ok: false, status: 413, error: 'File too large (max 10MB).' }
  }
  if (size <= 0) return { ok: false, status: 400, error: 'File is empty.' }

  const declared = normalizeImageMime(input.declaredType)
  if (declared && !(declared in EXT_BY_MIME)) {
    return { ok: false, status: 415, error: 'Unsupported image type.' }
  }

  const sniffed = input.bytes ? sniffImageMime(input.bytes) : null
  if (!sniffed || (declared && declared !== sniffed)) {
    return { ok: false, status: 415, error: 'Unsupported image type.' }
  }

  const now = input.now ?? Date.now()
  return {
    ok: true,
    bucket,
    path: `${folder}/${now}.${EXT_BY_MIME[sniffed]}`,
    contentType: sniffed,
  }
}
