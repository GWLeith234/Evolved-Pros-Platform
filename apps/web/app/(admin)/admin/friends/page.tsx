import { headers } from 'next/headers'
import { adminClient } from '@/lib/supabase/admin'
import { FriendsClient, type FriendInvite, type CompCode } from './FriendsClient'
import { BetaResetPanel, type SuspendedMember } from './BetaResetPanel'

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://platform.evolvedpros.com'

// SPRINT P — Friends of George admin: manage the shared comp code, send
// invites (email + copy-link fallback), and track redemptions. Admin-only via
// the (admin) layout guard. Light-mode admin palette (matches sibling pages).
export default async function AdminFriendsPage() {
  const h = headers()
  if (h.get('RSC') === '1' || h.get('Next-Router-Prefetch') === '1') return null

  const [codeRes, invitesRes, activeCountRes, suspendedRes] = await Promise.all([
    (adminClient as any)
      .from('promo_codes')
      .select('id, code, label, grants_tier, active, redemption_count, max_redemptions')
      .eq('code', 'FRIENDSOFGEORGE')
      .maybeSingle(),
    (adminClient as any)
      .from('friend_invites')
      .select('id, email, status, token, sent_at, redeemed_at')
      .order('sent_at', { ascending: false }),
    // Beta reset — members the "Pause all" action would affect right now:
    // non-admin, non-comped, currently active. Keyed on comp_promo_code_id.
    adminClient
      .from('users')
      .select('id', { count: 'exact', head: true })
      .neq('role', 'admin')
      .is('comp_promo_code_id', null)
      .eq('access_status', 'active'),
    adminClient
      .from('users')
      .select('id, email, full_name, display_name')
      .eq('access_status', 'suspended')
      .order('email', { ascending: true }),
  ])

  const code = (codeRes.data ?? null) as CompCode | null
  const invites = (invitesRes.data ?? []) as FriendInvite[]
  const activeCount = activeCountRes.count ?? 0
  const suspended = (suspendedRes.data ?? []) as SuspendedMember[]

  return (
    <div className="px-4 sm:px-8 py-6">
      <div className="mb-6">
        <h1 className="font-display font-black text-[28px] text-[color:var(--admin-text-strong)]">Friends of George</h1>
        <p className="font-condensed text-[12px] text-[color:var(--admin-text-2)] mt-0.5">
          Comp Professional access · invite by email or shareable link · track redemptions
        </p>
      </div>
      <FriendsClient code={code} invites={invites} appUrl={APP_URL} />

      <div className="mt-8">
        <BetaResetPanel initialActiveCount={activeCount} initialSuspended={suspended} />
      </div>
    </div>
  )
}
