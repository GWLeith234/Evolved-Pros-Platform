import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', profile.id)
    .eq('is_read', false)

  if (error) return NextResponse.json({ error: 'Failed to mark read' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
