/**
 * Server-side guest-engagement resolution shared by the /guest/[token] page and
 * the /api/guest/* handlers. Centralizes the validation chain so every entry
 * point enforces it identically:
 *   1. signature   — verifyGuestToken (cheap reject before any DB round-trip)
 *   2. existence   — lookup_guest_engagement RPC (SECURITY DEFINER, anon-safe)
 *   3. expiry      — token_expires_at
 *   4. status      — 'revoked' is treated as gone
 */
import { adminClient } from '@/lib/supabase/admin'
import { verifyGuestToken } from '@/lib/guest/token'

export interface GuestEngagement {
  engagement_id: string
  user_id: string
  episode_id: string | null
  status: string
  token_expires_at: string
  one_liner: string | null
  short_bio: string | null
  headshot_url: string | null
  topics: unknown
  links: unknown
  av_notes: string | null
  tee_size: string | null
  consent_release: boolean
  submitted_at: string | null
  guest_email: string | null
  guest_full_name: string | null
  guest_first_name: string | null
  guest_last_name: string | null
  guest_avatar_url: string | null
  guest_bio: string | null
  guest_company: string | null
  guest_role_title: string | null
  guest_linkedin_url: string | null
  guest_twitter_handle: string | null
  episode_title: string | null
  episode_slug: string | null
}

export type GuestResolution =
  | { ok: true; engagement: GuestEngagement }
  | { ok: false; reason: 'invalid' | 'not_found' | 'expired' | 'revoked' }

/** Validate a token end-to-end and return the engagement (or why it failed). */
export async function resolveGuestEngagement(
  token: string | null | undefined,
): Promise<GuestResolution> {
  if (!verifyGuestToken(token)) return { ok: false, reason: 'invalid' }

  const { data, error } = await (adminClient as any).rpc('lookup_guest_engagement', {
    p_token: token,
  })
  if (error) return { ok: false, reason: 'not_found' }

  const row = (Array.isArray(data) ? data[0] : data) as GuestEngagement | undefined
  if (!row) return { ok: false, reason: 'not_found' }
  if (row.status === 'revoked') return { ok: false, reason: 'revoked' }
  if (row.token_expires_at && new Date(row.token_expires_at).getTime() < Date.now()) {
    return { ok: false, reason: 'expired' }
  }
  return { ok: true, engagement: row }
}

/**
 * Idempotently ensure the backing user row carries the guest persona +
 * comped Professional entitlement. Safe to call on every page view ("upsert
 * guest user"): only writes when something actually differs.
 */
export async function ensureGuestPersona(userId: string): Promise<void> {
  const { data: u } = await adminClient
    .from('users')
    .select('role, tier, tier_status')
    .eq('id', userId)
    .maybeSingle()
  if (!u) return
  const patch: Record<string, string> = {}
  if ((u as any).role !== 'guest') patch.role = 'guest'
  if ((u as any).tier !== 'pro') patch.tier = 'pro'
  if ((u as any).tier_status !== 'comp') patch.tier_status = 'comp'
  if (Object.keys(patch).length === 0) return
  await adminClient.from('users').update(patch as any).eq('id', userId)
}

/** Advance status invited → viewed on first open (never downgrades). */
export async function markEngagementViewed(engagementId: string, status: string): Promise<void> {
  if (status !== 'invited') return
  await (adminClient as any)
    .from('guest_engagements')
    .update({ status: 'viewed', updated_at: new Date().toISOString() })
    .eq('id', engagementId)
    .eq('status', 'invited')
}
