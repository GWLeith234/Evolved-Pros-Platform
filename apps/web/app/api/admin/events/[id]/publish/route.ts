export const dynamic = 'force-dynamic'

import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'
import { notifyEventPublished } from '@/lib/notifications/fanout'

export async function PATCH(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  const { data: current } = await adminClient
    .from('events')
    .select('is_published, title, event_type')
    .eq('id', params.id)
    .single()

  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // RLS-FIX: adminClient — see events/route.ts.
  const { data, error } = await adminClient
    .from('events')
    .update({ is_published: !current.is_published })
    .eq('id', params.id)
    .select('id, is_published, title, event_type')
    .single()

  if (error || !data) return NextResponse.json({ error: 'Toggle failed' }, { status: 500 })
  if (!current.is_published && data.is_published) {
    void notifyEventPublished({
      eventId: data.id,
      title: data.title,
      eventType: data.event_type,
    })
  }
  return NextResponse.json({ id: data.id, isPublished: data.is_published })
}
