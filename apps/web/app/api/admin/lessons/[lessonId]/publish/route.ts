import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'

export const dynamic = 'force-dynamic'

export async function PATCH(
  _req: Request,
  { params }: { params: { lessonId: string } },
) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  const { data: current } = await adminClient
    .from('lessons')
    .select('is_published')
    .eq('id', params.lessonId)
    .single()

  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // RLS-FIX: adminClient — see lessons/route.ts.
  const { data, error } = await adminClient
    .from('lessons')
    .update({ is_published: !current.is_published })
    .eq('id', params.lessonId)
    .select('id, is_published')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ isPublished: data.is_published })
}
