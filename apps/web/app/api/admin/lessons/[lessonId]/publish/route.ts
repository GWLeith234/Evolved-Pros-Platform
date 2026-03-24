import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function PATCH(
  _req: Request,
  { params }: { params: { lessonId: string } },
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: current } = await supabase
    .from('lessons')
    .select('is_published')
    .eq('id', params.lessonId)
    .single()

  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('lessons')
    .update({ is_published: !current.is_published })
    .eq('id', params.lessonId)
    .select('id, is_published')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ isPublished: data.is_published })
}
