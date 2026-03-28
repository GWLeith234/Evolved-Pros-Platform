/**
 * Daily cron job — tag contacts whose membership expires in ~30 days.
 *
 * Triggered by an external scheduler (e.g. Vercel Cron, GitHub Actions).
 * Protected by CRON_SECRET to prevent unauthorized execution.
 *
 * Schedule: run once per day (e.g. "0 9 * * *")
 *
 * Tags: adds 'renewal-reminder-due' to contacts expiring in 29–31 days.
 * This tag triggers a Vendasta email template for the renewal reminder.
 * The tag is removed by the webhook handler when order.renewed fires.
 */

export const dynamic = 'force-dynamic'

import { adminClient } from '@/lib/supabase/admin'
import { addContactTag } from '@/lib/vendasta/contacts'

export async function GET(request: Request) {
  // Guard: require CRON_SECRET header
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[Cron] CRON_SECRET is not set')
    return Response.json({ error: 'Server misconfiguration' }, { status: 500 })
  }
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Query users expiring in 29–31 days with an active subscription
  const now     = new Date()
  const from    = new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000)
  const to      = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000)

  const { data: users, error } = await adminClient
    .from('users')
    .select('vendasta_contact_id, email')
    .eq('tier_status', 'active')
    .not('vendasta_contact_id', 'is', null)
    .gte('tier_expires_at', from.toISOString())
    .lte('tier_expires_at', to.toISOString())

  if (error) {
    console.error('[Cron] renewal-reminders DB query failed:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }

  const contacts = (users ?? []).filter(
    (u): u is { vendasta_contact_id: string; email: string } =>
      typeof u.vendasta_contact_id === 'string',
  )

  // Fire-and-forget tags — do not await so one failure doesn't block others
  for (const contact of contacts) {
    void addContactTag(contact.vendasta_contact_id, 'renewal-reminder-due')
  }

  console.log(`[Cron] renewal-reminders: tagged ${contacts.length} contacts`)
  return Response.json({ ok: true, tagged: contacts.length })
}
