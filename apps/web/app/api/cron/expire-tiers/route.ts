/**
 * Daily cron job — expire memberships whose tier_expires_at has passed.
 *
 * Schedule: run once per day BEFORE renewal-reminders (e.g. "0 8 * * *")
 * Protected by CRON_SECRET to prevent unauthorized execution.
 *
 * Sets tier_status = 'expired' for any active user whose tier_expires_at
 * is in the past. This is the enforcement counterpart to the Vendasta
 * webhook (which sets 'cancelled' on order.cancelled) — natural expirations
 * (no renewal, card decline, annual plan lapse) are caught here.
 */

export const dynamic = 'force-dynamic'

import { adminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[Cron] CRON_SECRET is not set')
    return Response.json({ error: 'Server misconfiguration' }, { status: 500 })
  }
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await adminClient
    .from('users')
    .update({ tier_status: 'expired' })
    .eq('tier_status', 'active')
    .lt('tier_expires_at', new Date().toISOString())
    .select('id, email')

  if (error) {
    console.error('[Cron] expire-tiers failed:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }

  const expired = data ?? []
  if (expired.length > 0) {
    console.log(`[Cron] expire-tiers: expired ${expired.length} members:`, expired.map(u => u.email))
  }

  return Response.json({ ok: true, expired: expired.length })
}
