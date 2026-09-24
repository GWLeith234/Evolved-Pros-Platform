export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { authorizeCronBearer } from '@/lib/cron/authorize'

export async function GET(request: Request) {
  // /api/cron is on middleware PUBLIC_ROUTES, so this handler is the only gate.
  const gate = authorizeCronBearer(request.headers.get('authorization'), process.env.CRON_SECRET)
  if (!gate.ok) {
    if (gate.status === 500) console.error('[cron/publish-posts] CRON_SECRET is not set')
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }

  const now = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient as any)
    .from('posts')
    .update({ status: 'published' })
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .select('id')

  if (error) {
    console.error('[cron/publish-posts]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const count = (data ?? []).length
  return NextResponse.json({ published: count })
}
