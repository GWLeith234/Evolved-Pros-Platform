import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'

export const dynamic = 'force-dynamic'

export async function PATCH(
  _req: Request,
  { params }: { params: { notifId: string } },
) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', params.notifId)
    .eq('user_id', profile.id)  // security: only own notifications

  if (error) return NextResponse.json({ error: 'Failed to mark read' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
