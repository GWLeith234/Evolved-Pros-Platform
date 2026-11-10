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
    const storyId = formData.get('storyId')
    const idSegment = typeof storyId === 'string' && storyId.trim() ? storyId.trim() : 'new'
    const timestamp = Date.now()
    const fileName = 'name' in blob && typeof (blob as Record<string, unknown>).name === 'string'
      ? (blob as Record<string, unknown>).name as string
      : 'image.jpg'
    const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `media/${idSegment}-${timestamp}.${ext}`

    const arrayBuffer = await blob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await adminClient.storage
      .from('Branding')
      .upload(path, buffer, { contentType: blob.type || 'image/jpeg', upsert: true })

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
        .eq('id', storyId)
    }

    return NextResponse.json({ url: publicUrl })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: clientSafeError('[upload-story-image] Unhandled error', err, 'Upload failed.') },
      { status: 500 },
    )
  }
}
