export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { clientSafeError } from '@/lib/http/clientError'

export async function GET(request: Request) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get('course_id')

  let query = supabase
    .from('reflections')
    .select('id, course_id, body, created_at')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  if (courseId) {
    query = query.eq('course_id', courseId)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json(
      { error: clientSafeError('[GET /api/reflections]', error, 'Could not load reflections.') },
      { status: 500 },
    )
  }

  return NextResponse.json({ reflections: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const courseId = typeof body.course_id === 'string' ? body.course_id.trim() : null
  const content = typeof body.body === 'string' ? body.body.trim() : ''

  if (!courseId) return NextResponse.json({ error: 'course_id is required' }, { status: 422 })
  if (content.length < 1) return NextResponse.json({ error: 'body is required' }, { status: 422 })

  const { data, error } = await supabase
    .from('reflections')
    .insert({
      user_id: profile.id,
      course_id: courseId,
      body: content,
    })
    .select('id, course_id, body, created_at')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: clientSafeError('[POST /api/reflections]', error, 'Failed to save reflection') },
      { status: 500 },
    )
  }

  return NextResponse.json(data, { status: 201 })
}
