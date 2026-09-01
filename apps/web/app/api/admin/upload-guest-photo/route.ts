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
    const fileName = 'name' in blob && typeof (blob as Record<string, unknown>).name === 'string'
      ? (blob as Record<string, unknown>).name as string
      : 'photo.jpg'
    const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg'

    // Canonical path: Branding/episodes/guest-{slug}.jpg. Slug-keyed (not
    // timestamped) so re-uploads overwrite in place instead of orphaning files.
    // Falls back to the episode id, then 'new', when no slug is supplied.
    const slugVal = formData.get('slug')
    const episodeId = formData.get('episodeId')
    const segment =
      typeof slugVal === 'string' && slugVal.trim() ? slugVal.trim()
      : typeof episodeId === 'string' && episodeId.trim() ? episodeId.trim()
      : `new-${Date.now()}`
    const path = `episodes/guest-${segment}.${ext}`

    const arrayBuffer = await blob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse form data
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (formErr) {
      console.error('[upload-guest-photo] FormData parse error:', formErr)
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
    }

    const file = formData.get('file')
    console.log('[upload-guest-photo] file received:', file ? `type=${typeof file}, isString=${typeof file === 'string'}` : 'null')

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'file is required' }, { status: 422 })
    }

    // Build upload path
    const blob = file as Blob
    const episodeId = formData.get('episodeId')
    const idSegment = typeof episodeId === 'string' && episodeId.trim() ? episodeId.trim() : 'new'
    const timestamp = Date.now()
    const fileName = 'name' in blob && typeof (blob as Record<string, unknown>).name === 'string'
      ? (blob as Record<string, unknown>).name as string
      : 'photo.jpg'
    const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `episodes/guest-${idSegment}-${timestamp}.${ext}`

    console.log('[upload-guest-photo] path:', path, 'size:', blob.size, 'type:', blob.type)

    // Read file into buffer
    const arrayBuffer = await blob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log('[upload-guest-photo] buffer created, bytes:', buffer.length)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('Branding')
      .upload(path, buffer, {
        contentType: blob.type || 'image/jpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error('[upload-guest-photo] Storage failed:', uploadError.message)
      return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = adminClient.storage.from('Branding').getPublicUrl(path)
    return NextResponse.json({ url: publicUrl })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[upload-guest-photo] Unhandled error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
