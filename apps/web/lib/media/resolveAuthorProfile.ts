import 'server-only'
import { adminClient } from '@/lib/supabase/admin'
import { pickAuthorProfile, type AuthorProfileRow } from './authorProfile'

const AUTHOR_COLUMNS = 'full_name, display_name, first_name, last_name, avatar_url, role, current_pillar'

function escapeIlike(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

function usersByName() {
  return adminClient
    .from('users')
    .select(AUTHOR_COLUMNS)
    .order('created_at', { ascending: true })
    .limit(8)
}

/**
 * Look up a media byline against public.users. Returns null when the photo
 * is optional / unmatched — callers must not treat a miss as an error.
 */
export async function resolveAuthorProfile(
  author: string | null | undefined,
): Promise<AuthorProfileRow | null> {
  const name = (author ?? '').trim().replace(/\s+/g, ' ')
  if (!name) return null

  const needle = escapeIlike(name)
  const { data: byFull } = await usersByName().ilike('full_name', needle)
  const fromFull = pickAuthorProfile(name, (byFull ?? []) as AuthorProfileRow[])
  if (fromFull) return fromFull

  const { data: byDisplay } = await usersByName().ilike('display_name', needle)
  const fromDisplay = pickAuthorProfile(name, (byDisplay ?? []) as AuthorProfileRow[])
  if (fromDisplay) return fromDisplay

  const parts = name.split(' ')
  if (parts.length >= 2) {
    const { data: byParts } = await usersByName()
      .ilike('first_name', escapeIlike(parts[0]))
      .ilike('last_name', escapeIlike(parts[parts.length - 1]))
    const fromParts = pickAuthorProfile(name, (byParts ?? []) as AuthorProfileRow[])
    if (fromParts) return fromParts
  }

  return null
}
