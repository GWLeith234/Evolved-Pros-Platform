import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@evolved-pros/db'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { effectiveTier } from '@/lib/tier'

export type CurrentUserProfile = Database['public']['Tables']['users']['Row']

/**
 * Resolves the public.users row for the currently-authenticated caller.
 *
 * Why this exists: a non-trivial number of accounts on this platform have
 * auth.uid() ≠ public.users.id (legacy accounts created before the
 * Supabase Auth ↔ public.users sync was enforced). Any query that does
 *   .eq('user_id', user.id)   on a user-keyed public table, or
 *   .eq('id', user.id)        on public.users
 * will silently return zero rows for those accounts. Five user-visible
 * bugs in one week traced back to this footgun (B1, B2, UI-3, MR-HOME-1,
 * and the unread-badge / event-registration regressions on home).
 *
 * Usage pattern at the top of any server route or page that needs to
 * key on the user:
 *
 *   const profile = await resolveCurrentUser(supabase)
 *   if (!profile) return  401 / redirect / null
 *   …
 *   .eq('user_id', profile.id)   // canonical public.users.id
 *
 * The helper goes through adminClient so RLS on the users table can't
 * block the lookup — a regular SSR client SELECT keyed by email would
 * still hit "users can read own row WHERE id = auth.uid()" policies and
 * return null in the same drift cases this is meant to fix.
 *
 * PERF: React.cache() dedupes within a single request/RSC render tree so
 * middleware-adjacent layout + page + nested fetchers share one auth +
 * profile round-trip. The optional supabase arg is accepted for call-site
 * back-compat but ignored — cookies() make createClient() request-scoped.
 *
 * Parallel helpers:
 *   - lib/admin/helpers.ts:requireAdminApi  → admin role check (subset)
 *   - lib/academy/fetchers.ts:fetchUserProfile → academy variant
 * Both already use the same id-then-email pattern; future cleanup can
 * fold them onto resolveCurrentUser.
 */
const resolveCurrentUserCached = cache(async (): Promise<CurrentUserProfile | null> => {
  // dev_session bypass: gated on NODE_ENV === 'development', inert in production
  // builds. Completes the same audited dev-login affordance already implemented
  // in middleware.ts, (member)/layout.tsx, and (admin)/admin/layout.tsx so that
  // member pages (which resolve the caller here, e.g. app/(member)/home/page.tsx)
  // render locally without a live Supabase backend. The cookie payload is a
  // subset of the users row; unknown columns read as undefined in dev.
  if (process.env.NODE_ENV === 'development') {
    const devSession = cookies().get('dev_session')?.value
    if (devSession) {
      try {
        return JSON.parse(devSession) as CurrentUserProfile
      } catch {
        // Malformed cookie — fall through to real Supabase auth below.
      }
    }
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Member access gate: a dead subscription (tier_status unpaid/canceled/
  // cancelled) drops the caller to community-tier access. Applied here so the
  // whole member session sees the effective tier through one resolver — every
  // downstream hasTierAccess(profile.tier, …) check inherits it, with no extra
  // query (the row is already selected). Fails open on every other status.
  const withEffectiveTier = (row: CurrentUserProfile): CurrentUserProfile => {
    row.tier = effectiveTier(row.tier, row.tier_status)
    return row
  }

  // Try id-match first via adminClient (RLS-bypass). Works for new
  // accounts where auth.uid() === public.users.id.
  const { data: byId } = await adminClient
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()
  if (byId) return withEffectiveTier(byId)

  if (!user.email) return null

  // Fallback: resolve by email — covers the auth.uid() ≠ public.users.id
  // drift documented across B1 / B2 / UI-3 / MR-HOME-1.
  const { data: byEmail } = await adminClient
    .from('users')
    .select('*')
    .eq('email', user.email)
    .maybeSingle()
  return byEmail ? withEffectiveTier(byEmail) : null
})

export async function resolveCurrentUser(
  _supabase?: SupabaseClient<Database>,
): Promise<CurrentUserProfile | null> {
  return resolveCurrentUserCached()
}
