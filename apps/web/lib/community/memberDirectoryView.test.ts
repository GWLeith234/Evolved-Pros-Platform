import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../../..')

/**
 * Latest migration that defines public.member_directory.
 * PostgREST exposes that view to the authenticated role. It is security
 * definer, so it bypasses users RLS. The effective definition is whatever
 * CREATE VIEW ran last.
 */
function latestMemberDirectoryMigration(): string {
  const dir = join(repoRoot, 'supabase/migrations')
  const files = readdirSync(dir).filter(name => name.endsWith('.sql')).sort()
  let sql = ''
  for (const name of files) {
    const text = readFileSync(join(dir, name), 'utf8')
    if (/CREATE(?: OR REPLACE)? VIEW public\.member_directory\b/.test(text)) sql = text
  }
  if (!sql) throw new Error('no member_directory view migration')
  return sql
}

const WITHHELD = [
  'full_name',
  'bio',
  'company',
  'linkedin_url',
  'twitter_handle',
  'website_url',
  'goal_90day',
] as const

describe('member_directory does not bypass /api/members redaction', () => {
  it('projects nulls for another member’s private profile fields', () => {
    const sql = latestMemberDirectoryMigration()
    for (const column of WITHHELD) {
      expect(sql, column).toMatch(new RegExp(`NULL::text AS ${column}\\b`))
      expect(sql, column).not.toMatch(new RegExp(`^\\s+${column},`, 'm'))
    }
    expect(sql).toMatch(/false AS goal_visible\b/)
    expect(sql).toMatch(/split_part\(/)
    expect(sql).not.toMatch(/^\s+display_name,/m)
    expect(sql).toMatch(/security_barrier\s*=\s*true/)
    expect(sql).toMatch(/REVOKE ALL ON public\.member_directory FROM PUBLIC, anon/)
    expect(sql).not.toMatch(/GRANT SELECT ON public\.member_directory TO[^;]*\banon\b/)
  })
})
