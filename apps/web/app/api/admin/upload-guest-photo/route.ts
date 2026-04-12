export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  console.log('[upload-guest-photo] POST called')

  try {
    // Auth check
    let userId: string
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('[upload-guest-photo] No auth user')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') {
        console.log('[upload-guest-photo] Not admin:', profile?.role)
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      userId = user.id
      console.log('[upload-guest-photo] Auth OK, user:', userId)
    } catch (authErr) {
      console.error('[upload-guest-photo] Auth error:', authErr)
      return NextResponse.json({ error: 'Auth check failed' }, { status: 500 })
    }

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

    console.log('[upload-guest-photo] upload result:', uploadError ? `ERROR: ${uploadError.message}` : `OK: ${JSON.stringify(uploadData)}`)

    if (uploadError) {
      return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = adminClient.storage.from('Branding').getPublicUrl(path)
    console.log('[upload-guest-photo] returning url:', publicUrl)

    return NextResponse.json({ url: publicUrl })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[upload-guest-photo] Unhandled error:', message, err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
