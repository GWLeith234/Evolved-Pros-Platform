export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function requireAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user }
}

export async function PATCH(
  req: Request,
  { params }: { params: { lessonId: string } }
) {
  const supabase = createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) return auth.error

  let body: { content_blocks?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!Array.isArray(body.content_blocks)) {
    return NextResponse.json({ error: 'content_blocks must be an array' }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('lessons')
    .update({ content_blocks: body.content_blocks })
    .eq('id', params.lessonId)
    .select('id, content_blocks')
    .single()

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Update failed' }, { status: 500 })
  return NextResponse.json({ lesson: data })
}
