import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function requireAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user }
}

export async function POST(req: Request) {
  const supabase = createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) return auth.error

  const body = await req.json() as {
    course_id: string
    title: string
    slug: string
    description?: string | null
    sort_order?: number
    duration_seconds?: number | null
    is_published?: boolean
  }

  if (!body.course_id || !body.title?.trim() || !body.slug?.trim()) {
    return NextResponse.json({ error: 'course_id, title, and slug are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('lessons')
    .insert({
      course_id: body.course_id,
      title: body.title.trim(),
      slug: body.slug.trim(),
      description: body.description ?? null,
      sort_order: body.sort_order ?? 1,
      duration_seconds: body.duration_seconds ?? null,
      is_published: body.is_published ?? false,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lesson: data }, { status: 201 })
}
