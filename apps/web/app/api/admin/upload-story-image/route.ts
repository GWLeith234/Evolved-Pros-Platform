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
    const guard = await requireAdminApi()
    if (guard instanceof Response) return guard

    let formData: FormData
    try { formData = await request.formData() } catch {
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

    const storyId = formData.get('storyId')
    const rawId = typeof storyId === 'string' && storyId.trim() ? storyId : 'new'
    const idSegment = safeStorageSegment(rawId)
    if (!idSegment) {
      return NextResponse.json({ error: 'Invalid upload path.' }, { status: 400 })
    }
    const path = `media/${idSegment}-${Date.now()}.${decision.ext}`

    const { error: uploadError } = await adminClient.storage
      .from('Branding')
      .upload(path, bytes, { contentType: decision.contentType, upsert: true })

    if (uploadError) {
      return NextResponse.json(
        { error: clientSafeError('[upload-story-image] Storage failed', uploadError, 'Upload failed.') },
        { status: 500 },
      )
    }

    const { data: { publicUrl } } = adminClient.storage.from('Branding').getPublicUrl(path)

    // Update story record if storyId provided
    if (typeof storyId === 'string' && storyId.trim()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminClient as any)
        .from('media_stories')
        .update({ featured_image_url: publicUrl })
        .eq('id', idSegment)
    }

    return NextResponse.json({ url: publicUrl })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: clientSafeError('[upload-story-image] Unhandled error', err, 'Upload failed.') },
      { status: 500 },
    )
  }
}
