export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function resolveUserId(email: string): Promise<string | null> {
  const { data } = await adminClient
    .from('users')
    .select('id')
    .eq('email', email)
    .single()
  return data?.id ?? null
}

async function readAttendingCount(eventId: string): Promise<number> {
  // events.attending_count is added in migration 034 — types regen lands
  // after the migration runs, so cast through `any` until then.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (adminClient as any)
    .from('events')
    .select('attending_count')
    .eq('id', eventId)
    .single() as { data: { attending_count: number } | null }
  return data?.attending_count ?? 0
}

export async function POST(
  _request: Request,
  { params }: { params: { eventId: string } },
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await resolveUserId(user.email)
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Idempotent — clicking "Add to my events" twice doesn't error.
  // `event_rsvps` is added in migration 034 — types.ts is regenerated after
  // the migration runs, so cast through `any` until that lands.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient as any)
    .from('event_rsvps')
    .upsert(
      { user_id: userId, event_id: params.eventId },
      { onConflict: 'user_id,event_id', ignoreDuplicates: true },
    )
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const attending_count = await readAttendingCount(params.eventId)
  return NextResponse.json({ ok: true, attending_count })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { eventId: string } },
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await resolveUserId(user.email)
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient as any)
    .from('event_rsvps')
    .delete()
    .eq('user_id', userId)
    .eq('event_id', params.eventId)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const attending_count = await readAttendingCount(params.eventId)
  return NextResponse.json({ ok: true, attending_count })
}
