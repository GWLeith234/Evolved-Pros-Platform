export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get('course_id')
  const columnType = searchParams.get('column_type')

  let query = supabase
    .from('ledger_entries')
    .select('id, column_type, content, created_at, course_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (courseId) query = query.eq('course_id', courseId)
  if (columnType) query = query.eq('column_type', columnType)

  const { data, error } = await query
  if (error) {
    console.error('[GET /api/ledger]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ entries: data ?? [] })
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
  const columnType = typeof body.column_type === 'string' ? body.column_type.trim() : null
  const content = typeof body.content === 'string' ? body.content.trim() : ''

  if (!courseId) return NextResponse.json({ error: 'course_id is required' }, { status: 422 })
  if (columnType !== 'built' && columnType !== 'burned') {
    return NextResponse.json({ error: 'column_type must be built or burned' }, { status: 422 })
  }
  if (content.length < 1) return NextResponse.json({ error: 'content is required' }, { status: 422 })

  const { data, error } = await supabase
    .from('ledger_entries')
    .insert({ user_id: user.id, course_id: courseId, column_type: columnType, content })
    .select('id, column_type, content, created_at, course_id')
    .single()

  if (error || !data) {
    console.error('[POST /api/ledger]', error)
    return NextResponse.json({ error: error?.message ?? 'Failed to add entry' }, { status: 500 })
  }

  return NextResponse.json({ entry: data }, { status: 201 })
}
