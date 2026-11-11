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
import { clientSafeError } from '@/lib/http/clientError'
import { ADMIN_IMAGE_MAX_BYTES, validateAdminImageUpload } from '@/lib/storage/adminImageUpload'

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
    const bucketField = formData.get('bucket')
    const folderField = formData.get('folder')
    const withinCap = blob.size > 0 && blob.size <= ADMIN_IMAGE_MAX_BYTES
    const bytes = withinCap ? Buffer.from(await blob.arrayBuffer()) : null

    const decision = validateAdminImageUpload({
      bucket: typeof bucketField === 'string' ? bucketField : null,
      folder: typeof folderField === 'string' ? folderField : null,
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

    const { error: uploadError } = await adminClient.storage
      .from(decision.bucket)
      .upload(decision.path, bytes, {
        contentType: decision.contentType,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: clientSafeError('[images/upload] Storage failed', uploadError, 'Upload failed.') },
        { status: 500 },
      )
    }

    const { data: { publicUrl } } = adminClient.storage.from(decision.bucket).getPublicUrl(decision.path)
    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    return NextResponse.json(
      { error: clientSafeError('[images/upload] Unhandled error', err, 'Upload failed.') },
      { status: 500 },
    )
  }
}
