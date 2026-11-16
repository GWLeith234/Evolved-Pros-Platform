// Polyfill File for Node 18 — Supabase storage-js references File internally
if (typeof globalThis.File === 'undefined') {
  ;(globalThis as /* eslint-disable-line @typescript-eslint/no-explicit-any */ any).File = class File extends Blob {
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
import { requireAdminApi } from '@/lib/admin/helpers'
import { clientSafeError } from '@/lib/http/clientError'
import { ADMIN_IMAGE_MAX_BYTES, safeStorageSegment, validateImageBytes } from '@/lib/storage/adminImageUpload'

export async function POST(request: Request) {
  try {
    // Canonical admin gate — resolves role via .eq('email', user.email),
    // avoiding the auth.uid() ≠ public.users.id footgun the previous
    // .eq('id', user.id) lookup hit.
    const guard = await requireAdminApi()
    if (guard instanceof Response) return guard

    // Parse form data
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (formErr) {
      console.error('[upload-guest-photo] FormData parse error:', formErr)
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
    }

    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'file is required' }, { status: 422 })
    }

    const blob = file as Blob
    const withinCap = blob.size > 0 && blob.size <= ADMIN_IMAGE_MAX_BYTES
    const bytes = withinCap ? Buffer.from(await blob.arrayBuffer()) : null
    const decision = validateImageBytes({
      declaredType: blob.type,
      byteLength: bytes ? bytes.length : blob.size,
      bytes,
    })
    if (!decision.ok || !bytes) {
      return NextResponse.json(
        { error: decision.ok ? 'Unsupported image type.' : decision.error },
        { status: decision.ok ? 415 : decision.status },
      )
    }

    // Canonical path: Branding/episodes/guest-{slug}.{ext}. Slug-keyed (not
    // timestamped) so re-uploads overwrite in place. The slug or episode id
    // has to be one safe segment; the extension comes from the byte signature.
    const slugVal = formData.get('slug')
    const episodeId = formData.get('episodeId')
    const rawSegment =
      typeof slugVal === 'string' && slugVal.trim() ? slugVal
      : typeof episodeId === 'string' && episodeId.trim() ? episodeId
      : `new-${Date.now()}`
    const segment = safeStorageSegment(rawSegment)
    if (!segment) {
      return NextResponse.json({ error: 'Invalid upload path.' }, { status: 400 })
    }
    const path = `episodes/guest-${segment}.${decision.ext}`

    const { error: uploadError } = await adminClient.storage
      .from('Branding')
      .upload(path, bytes, {
        contentType: decision.contentType,
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: clientSafeError('[upload-guest-photo] Storage failed', uploadError, 'Upload failed.') },
        { status: 500 },
      )
    }

    const { data: { publicUrl } } = adminClient.storage.from('Branding').getPublicUrl(path)
    return NextResponse.json({ url: publicUrl })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: clientSafeError('[upload-guest-photo] Unhandled error', err, 'Upload failed.') },
      { status: 500 },
    )
  }
}
