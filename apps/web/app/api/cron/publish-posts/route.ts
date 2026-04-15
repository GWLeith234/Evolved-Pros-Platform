export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function GET() {
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
  if (count > 0) console.log(`[cron/publish-posts] Published ${count} scheduled posts`)
  return NextResponse.json({ published: count })
}
