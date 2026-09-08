import 'server-only'
import { adminClient } from '@/lib/supabase/admin'
import type { FogInviteSnapshot, MemberSnapshot } from './eligibility'

export async function loadMembersByEmail(emails: string[]): Promise<Map<string, MemberSnapshot>> {
  const map = new Map<string, MemberSnapshot>()
  if (emails.length === 0) return map
  // Generated Database types omit stripe_* (migration 065). Select typed
  // columns only so tsc stays green. Paid still maps to already_member /
  // leave_alone because any existing users row is already_member.
  const { data } = await adminClient
    .from('users')
    .select('email, tier, tier_status, role')
    .in('email', emails)
  for (const row of data ?? []) {
    const email = (row.email ?? '').toLowerCase()
    if (!email) continue
    map.set(email, {
      email,
      tier: row.tier,
      tier_status: row.tier_status,
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
