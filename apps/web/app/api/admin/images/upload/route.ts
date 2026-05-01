// Polyfill File for Node 18
if (typeof globalThis.File === 'undefined') {
  ;(globalThis as any).File = class File extends Blob {
    name: string; lastModified: number
    constructor(bits: BlobPart[], name: string, options?: FilePropertyBag) {
      super(bits, options); this.name = name; this.lastModified = options?.lastModified ?? Date.now()
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

    const bucket = typeof formData.get('bucket') === 'string'
      ? (formData.get('bucket') as string)
      : 'Branding'

    const blob = file as Blob
    const fileName = 'name' in blob && typeof (blob as Record<string, unknown>).name === 'string'
      ? (blob as Record<string, unknown>).name as string
      : 'upload.jpg'
    const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg'
    const folder = typeof formData.get('folder') === 'string'
      ? (formData.get('folder') as string)
      : 'uploads'
    const path = `${folder}/${Date.now()}.${ext}`

    const arrayBuffer = await blob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await adminClient.storage
      .from(bucket)
      .upload(path, buffer, { contentType: blob.type || 'image/jpeg', upsert: true })

    if (uploadError) {
      console.error('[images/upload] Storage failed:', uploadError.message)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = adminClient.storage.from(bucket).getPublicUrl(path)
    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[images/upload] Unhandled error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
