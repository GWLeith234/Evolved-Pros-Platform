export const dynamic = 'force-dynamic'

import { requireAdminApi } from '@/lib/admin/helpers'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  req: Request,
  { params }: { params: { lessonId: string } }
) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  let body: { content_blocks?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!Array.isArray(body.content_blocks)) {
    return NextResponse.json({ error: 'content_blocks must be an array' }, { status: 422 })
  }

  const supabase = createClient()
  const { error } = await supabase
    .from('lessons')
    .update({ content_blocks: body.content_blocks })
    .eq('id', params.lessonId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
