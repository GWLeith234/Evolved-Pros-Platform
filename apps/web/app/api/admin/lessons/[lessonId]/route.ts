import { adminClient } from '@/lib/supabase/admin'
import { mux } from '@/lib/mux/client'
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: Request,
  { params }: { params: { lessonId: string } },
) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  const body = await req.json() as Record<string, unknown>

  // If muxUploadId provided, resolve asset ID from Mux then persist it
  if (body.muxUploadId && typeof body.muxUploadId === 'string') {
    try {
      const upload = await mux.video.uploads.retrieve(body.muxUploadId)
      if (upload.asset_id) {
        body.mux_asset_id = upload.asset_id
      }
    } catch (err) {
      console.error('[Mux] Failed to retrieve upload:', err)
    }
    delete body.muxUploadId
  }

  const allowed = ['title', 'slug', 'description', 'sort_order', 'duration_seconds', 'is_published', 'mux_asset_id', 'mux_playback_id'] as const
  type AllowedKey = typeof allowed[number]
  const update = Object.fromEntries(
    allowed
      .filter(k => k in body)
      .map(k => [k, body[k as AllowedKey]])
  )

  // RLS-FIX: adminClient — see lessons/route.ts.
  const { data, error } = await adminClient
    .from('lessons')
    .update(update)
    .eq('id', params.lessonId)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lesson: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: { lessonId: string } },
) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  const { error } = await adminClient
    .from('lessons')
    .delete()
    .eq('id', params.lessonId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
