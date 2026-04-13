console.log('[upload-guest-photo] MODULE LOADED')

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  console.log('[upload-guest-photo] HANDLER START', request.method)
  try {
    // Auth check
    let userId: string
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      userId = user.id
      console.log('[upload-guest-photo] AUTH OK user:', userId)
    } catch (authErr) {
      console.error('[upload-guest-photo] AUTH CATCH:', authErr)
      return NextResponse.json({ error: 'Auth check failed', detail: String(authErr) }, { status: 500 })
    }

    // Parse form data
    let formData: FormData
    try {
      formData = await request.formData()
      console.log('[upload-guest-photo] FORMDATA OK, keys:', [...formData.keys()])
    } catch (formErr) {
      console.error('[upload-guest-photo] FORMDATA CATCH:', formErr)
      return NextResponse.json({ error: 'Invalid form data', detail: String(formErr) }, { status: 400 })
    }

    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      console.log('[upload-guest-photo] NO FILE, got:', typeof file)
      return NextResponse.json({ error: 'file is required' }, { status: 422 })
    }

    const blob = file as Blob
    const episodeId = formData.get('episodeId')
    const idSegment = typeof episodeId === 'string' && episodeId.trim() ? episodeId.trim() : 'new'
    const timestamp = Date.now()
    const fileName = 'name' in blob && typeof (blob as Record<string, unknown>).name === 'string'
      ? (blob as Record<string, unknown>).name as string
      : 'photo.jpg'
    const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `episodes/guest-${idSegment}-${timestamp}.${ext}`

    console.log('[upload-guest-photo] UPLOADING path:', path, 'size:', blob.size, 'type:', blob.type)

    const arrayBuffer = await blob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('Branding')
      .upload(path, buffer, {
        contentType: blob.type || 'image/jpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error('[upload-guest-photo] STORAGE ERROR:', uploadError.message)
      return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = adminClient.storage.from('Branding').getPublicUrl(path)
    console.log('[upload-guest-photo] SUCCESS url:', publicUrl)
    return NextResponse.json({ url: publicUrl })
  } catch (err: unknown) {
    console.error('[upload-guest-photo] OUTER CATCH:', err)
    return NextResponse.json(
      { error: 'Unhandled server error', detail: String(err) },
      { status: 500 },
    )
  }
}
