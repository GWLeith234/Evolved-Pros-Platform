export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: current } = await supabase
    .from('events')
    .select('is_published')
    .eq('id', params.id)
    .single()

  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('events')
    .update({ is_published: !current.is_published })
    .eq('id', params.id)
    .select('id, is_published')
    .single()

  if (error || !data) return NextResponse.json({ error: 'Toggle failed' }, { status: 500 })
  return NextResponse.json({ id: data.id, isPublished: data.is_published })
}
