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

const ALLOWED_PATCH_FIELDS = [
  'wig_statement', 'lag_label', 'lag_current', 'lag_target', 'lag_unit',
  'lead_1_label', 'lead_1_weekly_target', 'lead_2_label', 'lead_2_weekly_target',
]

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: scoreboard, error } = await (adminClient as any)
    .from('scoreboards')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !scoreboard) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updates } = await (adminClient as any)
    .from('scoreboard_updates')
    .select('id, scoreboard_id, lag_value, lead_1_count, lead_2_count, update_date, created_at')
    .eq('scoreboard_id', params.id)
    .order('update_date', { ascending: false })
    .limit(4)

  return NextResponse.json({ scoreboard, updates: updates ?? [] })
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of ALLOWED_PATCH_FIELDS) {
    if (key in body) patch[key] = body[key]
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient as any)
    .from('scoreboards')
    .update(patch)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select('id, user_id, course_id, wig_statement, lag_label, lag_current, lag_target, lag_unit, lead_1_label, lead_1_weekly_target, lead_2_label, lead_2_weekly_target, created_at, updated_at')
    .single()

  if (error || !data) {
    console.error('[PATCH /api/scoreboards/[id]]', error)
    return NextResponse.json({ error: error?.message ?? 'Not found or not authorised' }, { status: 500 })
  }

  return NextResponse.json({ scoreboard: data })
}
