export const dynamic = 'force-dynamic'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function getAuthUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: scoreboard } = await (adminClient as any)
    .from('scoreboards')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!scoreboard) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const updateDate = typeof body.update_date === 'string'
    ? body.update_date
    : new Date().toISOString().split('T')[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient as any)
    .from('scoreboard_updates')
    .upsert(
      {
        scoreboard_id: params.id,
        user_id:       user.id,
        lag_value:     Number(body.lag_value    ?? 0),
        lead_1_count:  Number(body.lead_1_count ?? 0),
        lead_2_count:  Number(body.lead_2_count ?? 0),
        update_date:   updateDate,
      },
      { onConflict: 'scoreboard_id,update_date' },
    )
    .select('id, scoreboard_id, lag_value, lead_1_count, lead_2_count, update_date, created_at')
    .single()

  if (error || !data) {
    console.error('[POST /api/scoreboards/[id]/update]', error)
    return NextResponse.json({ error: error?.message ?? 'Failed to save update' }, { status: 500 })
  }

  return NextResponse.json({ update: data }, { status: 201 })
}
