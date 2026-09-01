import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@evolved-pros/db'

/**
 * Single source of truth for a member's public post count.
 *
 * The Home scoreboard and the member Profile both display "posts by this
 * author". They had drifted (Profile counted every row → 43; Home's number
 * excluded a removed post → 42). This helper defines the one canonical rule —
 * count a member's posts but exclude `rejected` (moderator-removed) rows, which
 * aren't really "their posts" — so every surface lands on the same number.
 *
 * Pass any client with read access to `posts` (callers use the service-role
 * adminClient so RLS can't shadow the count).
 */
export async function countUserPosts(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<number> {
  const { count } = await client
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', userId)
    .neq('status', 'rejected')
  return count ?? 0
}
