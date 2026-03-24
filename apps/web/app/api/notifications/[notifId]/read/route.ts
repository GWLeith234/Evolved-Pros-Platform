import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function PATCH(
  _req: Request,
  { params }: { params: { notifId: string } },
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', params.notifId)
    .eq('user_id', user.id)  // security: only own notifications

  if (error) return NextResponse.json({ error: 'Failed to mark read' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
