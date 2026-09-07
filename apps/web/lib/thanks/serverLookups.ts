import 'server-only'
import { adminClient } from '@/lib/supabase/admin'
import type { FogInviteSnapshot, MemberSnapshot } from './eligibility'

export async function loadMembersByEmail(emails: string[]): Promise<Map<string, MemberSnapshot>> {
  const map = new Map<string, MemberSnapshot>()
  if (emails.length === 0) return map
  const { data } = await adminClient
    .from('users')
    .select('email, tier, tier_status, stripe_subscription_id, stripe_customer_id, role')
    .in('email', emails)
  for (const row of data ?? []) {
    const email = (row.email ?? '').toLowerCase()
    if (!email) continue
    map.set(email, {
      email,
      tier: row.tier,
      tier_status: row.tier_status,
      stripe_subscription_id: (row as { stripe_subscription_id?: string | null }).stripe_subscription_id ?? null,
      stripe_customer_id: (row as { stripe_customer_id?: string | null }).stripe_customer_id ?? null,
      role: row.role,
    })
  }
  return map
}

export async function loadFogByEmail(emails: string[]): Promise<Map<string, FogInviteSnapshot>> {
  const map = new Map<string, FogInviteSnapshot>()
  if (emails.length === 0) return map
  const { data } = await (adminClient as any)
    .from('friend_invites')
    .select('email, status')
    .in('email', emails)
  for (const row of data ?? []) {
    const email = String(row.email ?? '').toLowerCase()
    if (!email) continue
    map.set(email, { email, status: String(row.status ?? '') })
  }
  return map
}

export async function loadExistingThanksEmails(emails: string[]): Promise<Set<string>> {
  const set = new Set<string>()
  if (emails.length === 0) return set
  const { data } = await (adminClient as any)
    .from('community_thanks_invites')
    .select('email')
    .in('email', emails)
  for (const row of data ?? []) {
    const email = String(row.email ?? '').toLowerCase()
    if (email) set.add(email)
  }
  return set
}
