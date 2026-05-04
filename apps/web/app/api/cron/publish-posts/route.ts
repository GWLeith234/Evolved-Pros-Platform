export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  // CRON_SECRET gate — same Bearer pattern as the other 5 cron routes.
  // CRON-FIX (e5e0956) added /api/cron to PUBLIC_ROUTES so middleware no
  // longer auth-gates these; each handler must verify the header itself.
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
