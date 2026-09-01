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
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'

const MAX_BYTES = 10 * 1024 * 1024
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const profile = await resolveCurrentUser(supabase)
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let formData: FormData
    try { formData = await request.formData() } catch {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
    }

    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'file is required' }, { status: 422 })
    }

    const blob = file as Blob
    if (blob.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 })
    }
    if (blob.type && !ACCEPTED_TYPES.has(blob.type)) {
      return NextResponse.json({ error: 'Unsupported image type' }, { status: 415 })
    }

    const fileName = 'name' in blob && typeof (blob as Record<string, unknown>).name === 'string'
      ? (blob as Record<string, unknown>).name as string
      : 'upload.jpg'
    const ext = (fileName.split('.').pop() || 'jpg').toLowerCase()
    const path = `avatars/${profile.id}/${Date.now()}.${ext}`

    const arrayBuffer = await blob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await adminClient.storage
      .from('Branding')
      .upload(path, buffer, { contentType: blob.type || 'image/jpeg', upsert: true })

    if (uploadError) {
      console.error('[user/avatar] Storage failed:', uploadError.message)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = adminClient.storage.from('Branding').getPublicUrl(path)
    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[user/avatar] Unhandled error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
