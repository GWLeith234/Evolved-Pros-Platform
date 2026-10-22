/**
 * Daily cron — drop paid members whose period has ended.
 *
 * Schedule: once per day BEFORE renewal-reminders (see .github/workflows/cron.yml).
 * Protected by CRON_SECRET.
 *
 * Calls public.downgrade_expired_paid_members() (migration 099). That function
 * sets tier = community. Active and trial rows also become tier_status
 * 'expired'; cancellations stay 'cancelled'. Comps and admins are skipped.
 * tier_change_log is written by the migration 097 trigger (one row per
 * member). This route does not insert a second audit row.
 */

export const dynamic = 'force-dynamic'

import { adminClient } from '@/lib/supabase/admin'
import { authorizeCronBearer } from '@/lib/cron/authorize'

export async function GET(request: Request) {
  const gate = authorizeCronBearer(request.headers.get('authorization'), process.env.CRON_SECRET)
  if (!gate.ok) {
    if (gate.status === 500) console.error('[Cron] CRON_SECRET is not set')
    return Response.json({ error: gate.error }, { status: gate.status })
  }

  const { data, error } = await (adminClient as unknown as {
    rpc: (fn: string) => Promise<{ data: { user_id: string }[] | null; error: { message: string } | null }>
  }).rpc('downgrade_expired_paid_members')

  if (error) {
    console.error('[Cron] expire-tiers failed:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }

  const expired = data?.length ?? 0
  if (expired > 0) {
    console.log(`[Cron] expire-tiers: downgraded ${expired} members to community`)
  }

  return Response.json({ ok: true, expired })
}
