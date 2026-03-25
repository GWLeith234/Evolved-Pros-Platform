import { createClient } from '@/lib/supabase/server'
import { mux } from '@/lib/mux/client'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function requireAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user }
}

export async function PATCH(
  req: Request,
  { params }: { params: { lessonId: string } },
) {
  const supabase = createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) return auth.error

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

  const { data, error } = await supabase
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
  const supabase = createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) return auth.error

  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', params.lessonId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
