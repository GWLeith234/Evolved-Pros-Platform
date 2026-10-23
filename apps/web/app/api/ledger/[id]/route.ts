export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { clientSafeError } from '@/lib/http/clientError'

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  // Only delete if this entry belongs to the authenticated user
  const { error } = await supabase
    .from('ledger_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', profile.id)

  if (error) {
    return NextResponse.json(
      { error: clientSafeError('[DELETE /api/ledger/[id]]', error, 'Could not delete that entry.') },
      { status: 500 },
    )
  }

  return NextResponse.json({ deleted: id })
}
