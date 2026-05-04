import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@evolved-pros/db'
import { adminClient } from '@/lib/supabase/admin'

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
 * Parallel helpers:
 *   - lib/admin/helpers.ts:requireAdminApi  → admin role check (subset)
 *   - lib/academy/fetchers.ts:fetchUserProfile → academy variant
 * Both already use the same id-then-email pattern; future cleanup can
 * fold them onto resolveCurrentUser.
 */
export async function resolveCurrentUser(
  supabase: SupabaseClient<Database>,
): Promise<CurrentUserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Try id-match first via adminClient (RLS-bypass). Works for new
  // accounts where auth.uid() === public.users.id.
  const { data: byId } = await adminClient
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()
  if (byId) return byId

  if (!user.email) return null

  // Fallback: resolve by email — covers the auth.uid() ≠ public.users.id
  // drift documented across B1 / B2 / UI-3 / MR-HOME-1.
  const { data: byEmail } = await adminClient
    .from('users')
    .select('*')
    .eq('email', user.email)
    .maybeSingle()
  return byEmail ?? null
}
