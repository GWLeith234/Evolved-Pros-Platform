import '@/lib/polyfills/file'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { resolveGuestEngagement } from '@/lib/guest/engagement'

// POST /api/guest/upload — a guest uploads their headshot during intake.
// multipart/form-data: { token, file }. Token-gated (the signed token is the
// credential); stores under Branding/guests/headshot-{engagementId}.{ext} so
// re-uploads overwrite in place. Returns the public URL for the intake form.
const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export async function POST(request: Request) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const token = String(formData.get('token') ?? '').trim()
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
  if (blob.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image too large (max 8MB).' }, { status: 422 })
  }
  const contentType = blob.type || 'image/jpeg'
  if (!ALLOWED.has(contentType)) {
    return NextResponse.json({ error: 'Unsupported image type.' }, { status: 422 })
  }

  const ext = contentType === 'image/png' ? 'png'
    : contentType === 'image/webp' ? 'webp'
    : contentType === 'image/gif' ? 'gif'
    : 'jpg'
  const path = `guests/headshot-${resolved.engagement.engagement_id}.${ext}`

  const buffer = Buffer.from(await blob.arrayBuffer())
  const { error: uploadError } = await adminClient.storage
    .from('Branding')
    .upload(path, buffer, { contentType, upsert: true })
  if (uploadError) {
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
  }

  const { data: { publicUrl } } = adminClient.storage.from('Branding').getPublicUrl(path)
  return NextResponse.json({ url: publicUrl })
}
