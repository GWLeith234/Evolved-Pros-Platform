export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get('course_id')
  const domain   = searchParams.get('domain')

  let query = supabase
    .from('strategic_plans')
    .select('id, course_id, domain, content, status, updated_at, created_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (courseId) query = query.eq('course_id', courseId)
  if (domain)   query = query.eq('domain', domain)

  const { data, error } = await query
  if (error) {
    console.error('[GET /api/strategic-plans]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ plans: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const courseId = typeof body.course_id === 'string' ? body.course_id.trim() : null
  const domain   = typeof body.domain    === 'string' ? body.domain.trim()    : null
  const content  = body.content ?? null

  if (!courseId) return NextResponse.json({ error: 'course_id is required' }, { status: 422 })
  if (!domain)   return NextResponse.json({ error: 'domain is required' }, { status: 422 })
  if (!content)  return NextResponse.json({ error: 'content is required' }, { status: 422 })

  // Upsert — one WIG per user+domain
  const { data, error } = await supabase
    .from('strategic_plans')
    .upsert(
      {
        user_id: user.id,
        course_id: courseId,
        domain,
        content,
        status: 'active',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,domain' },
    )
    .select('id, course_id, domain, content, status, updated_at, created_at')
    .single()

  if (error || !data) {
    console.error('[POST /api/strategic-plans]', error)
    return NextResponse.json({ error: error?.message ?? 'Failed to save plan' }, { status: 500 })
  }

  return NextResponse.json({ plan: data }, { status: 201 })
}
