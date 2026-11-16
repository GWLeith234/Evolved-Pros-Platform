// Polyfill File for Node 18 — Supabase storage-js references File internally.
if (typeof globalThis.File === 'undefined') {
  ;(globalThis as any).File = class File extends Blob {
    name: string
    lastModified: number
    constructor(bits: BlobPart[], name: string, options?: FilePropertyBag) {
      super(bits, options)
      this.name = name
      this.lastModified = options?.lastModified ?? Date.now()
    }
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { resolveGuestEngagement } from '@/lib/guest/engagement'
import { parseGuestToken } from '@/lib/guest/intakePayload'
import { clientSafeError } from '@/lib/http/clientError'
import { safeStorageSegment, validateImageBytes } from '@/lib/storage/adminImageUpload'

// POST /api/guest/upload — a guest uploads their headshot during intake.
// multipart/form-data: { token, file }. Token-gated (the signed token is the
// credential); stores under Branding/guests/headshot-{engagementId}.{ext} so
// re-uploads overwrite in place. Returns the public URL for the intake form.
const MAX_BYTES = 8 * 1024 * 1024

export async function POST(request: Request) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const rawToken = formData.get('token')
  const token = typeof rawToken === 'string' ? parseGuestToken(rawToken) : ''
  if (token === null) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  const resolved = await resolveGuestEngagement(token)
  if (!resolved.ok) {
    const status = resolved.reason === 'expired' ? 410 : resolved.reason === 'invalid' ? 401 : 404
    return NextResponse.json({ error: `This guest link is ${resolved.reason}.` }, { status })
  }

  const file = formData.get('file')
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'file is required' }, { status: 422 })
  }
  const blob = file as Blob
  const withinCap = blob.size > 0 && blob.size <= MAX_BYTES
  const bytes = withinCap ? Buffer.from(await blob.arrayBuffer()) : null
  const decision = validateImageBytes({
    declaredType: blob.type,
    byteLength: bytes ? bytes.length : blob.size,
    bytes,
    maxBytes: MAX_BYTES,
    tooLargeError: 'Image too large (max 8MB).',
  })
  if (!decision.ok || !bytes) {
    return NextResponse.json(
      { error: decision.ok ? 'Unsupported image type.' : decision.error },
      { status: decision.ok ? 415 : decision.status },
    )
  }

  const owner = safeStorageSegment(resolved.engagement.engagement_id)
  if (!owner) {
    return NextResponse.json({ error: 'Invalid upload path.' }, { status: 400 })
  }
  const path = `guests/headshot-${owner}.${decision.ext}`

  const { error: uploadError } = await adminClient.storage
    .from('Branding')
    .upload(path, bytes, { contentType: decision.contentType, upsert: true })
  if (uploadError) {
    return NextResponse.json(
      { error: clientSafeError('[POST /api/guest/upload]', uploadError, 'Upload failed.') },
      { status: 500 },
    )
  }

  const { data: { publicUrl } } = adminClient.storage.from('Branding').getPublicUrl(path)
  return NextResponse.json({ url: publicUrl })
}
