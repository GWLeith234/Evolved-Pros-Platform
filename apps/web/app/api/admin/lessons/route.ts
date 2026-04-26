import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

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

  // RLS-FIX: adminClient bypasses the lessons RLS admin-role check that
  // breaks for users where auth.uid() ≠ public.users.id.
  const { data, error } = await adminClient
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
