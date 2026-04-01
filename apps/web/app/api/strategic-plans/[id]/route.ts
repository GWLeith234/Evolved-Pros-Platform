export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const content = body.content
  if (content === undefined) return NextResponse.json({ error: 'content is required' }, { status: 422 })

  const { data, error } = await supabase
    .from('strategic_plans')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select('id, course_id, domain, content, status, updated_at')
    .single()

  if (error || !data) {
    console.error('[PATCH /api/strategic-plans/[id]]', error)
    return NextResponse.json({ error: error?.message ?? 'Not found or not authorised' }, { status: 500 })
  }

  return NextResponse.json({ plan: data })
}
