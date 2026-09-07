import { headers } from 'next/headers'
import { adminClient } from '@/lib/supabase/admin'
import { EpWordmark } from '@/components/brand/EpWordmark'
import { computeThanksCounts } from '@/lib/thanks/counts'
import { THANKS_PROMO_CODE, THANKS_WWW_ORIGIN } from '@/lib/thanks/constants'
import { ThanksClient, type ThanksInvite, type ThanksNudge, type ThanksPromo } from './ThanksClient'

export const dynamic = 'force-dynamic'

export default async function AdminThanksPage() {
  const h = headers()
  if (h.get('RSC') === '1' || h.get('Next-Router-Prefetch') === '1') return null

  const [codeRes, invitesRes, sendsRes, queueRes] = await Promise.all([
    (adminClient as any)
      .from('promo_codes')
      .select('id, code, label, grants_tier, active, redemption_count')
      .eq('code', THANKS_PROMO_CODE)
      .maybeSingle(),
    (adminClient as any)
      .from('community_thanks_invites')
      .select('id, email, first_name, status, token, cadence_step, expires_at, next_send_at, last_sent_at, sent_at, redeemed_at, stopped_reason, delivered_count, opened_at, batch_id, created_at')
      .order('created_at', { ascending: false }),
    (adminClient as any)
      .from('community_thanks_sends')
      .select('id, invite_id, cadence_step, status, opened_at, created_at'),
    (adminClient as any)
      .from('community_thanks_nudge_queue')
      .select('id, invite_id, cadence_step, due_at, status, created_at, community_thanks_invites ( email, first_name, token, status )')
      .eq('status', 'pending_approval')
      .order('due_at', { ascending: true }),
  ])

  const invites = (invitesRes.data ?? []) as ThanksInvite[]
  const sends = (sendsRes.data ?? []) as Array<{ status: string; opened_at: string | null }>
  const counts = computeThanksCounts(invites, sends)
  const queue = (queueRes.data ?? []) as ThanksNudge[]

  return (
    <div className="px-4 sm:px-8 py-6">
      <div className="mb-6">
        <EpWordmark tone="dark" style={{ marginBottom: 12 }} />
        <h1 className="font-display font-black text-[28px] text-[color:var(--admin-text-strong)]">
          Thank-you Community
        </h1>
        <p className="font-condensed text-[12px] text-[color:var(--admin-text-2)] mt-0.5">
          Free Community invites · D0 / D7 / D14 / D28 · explicit YES to send · never auto-fire
        </p>
      </div>
      <ThanksClient
        code={(codeRes.data ?? null) as ThanksPromo | null}
        invites={invites}
        queue={queue}
        counts={counts}
        wwwOrigin={THANKS_WWW_ORIGIN}
      />
    </div>
  )
}
