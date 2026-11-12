/**
 * Migration 109 is the grant and policy lock for poll voting. It is scanned
 * here and is not applied to a database by the test.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../../..')
const migrationsDir = resolve(repoRoot, 'supabase/migrations')
const migrationPath = resolve(migrationsDir, '109_lock_down_poll_votes.sql')
const migration = readFileSync(migrationPath, 'utf8')

const TABLE_PRIVILEGES = [
  'SELECT',
  'INSERT',
  'UPDATE',
  'DELETE',
  'TRUNCATE',
  'REFERENCES',
  'TRIGGER',
] as const

type Role = 'anon' | 'authenticated' | 'service_role'
type TableName = 'polls' | 'poll_options' | 'poll_votes'

function stripSqlComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '')
}

function grantsAfterMigration(sql: string): Map<TableName, Map<Role, Set<string>>> {
  // Start from the live anon and authenticated grants (every table privilege)
  // so a missing REVOKE cannot look like the tightened result.
  const grants = new Map<TableName, Map<Role, Set<string>>>()
  const tables: TableName[] = ['polls', 'poll_options', 'poll_votes']
  const roles: Role[] = ['anon', 'authenticated']
  for (const table of tables) {
    const tableGrants = new Map<Role, Set<string>>()
    for (const role of roles) tableGrants.set(role, new Set(TABLE_PRIVILEGES))
    grants.set(table, tableGrants)
  }

  for (const rawLine of stripSqlComments(sql).split('\n')) {
    const line = rawLine.replace(/\s+/g, ' ').trim().replace(/;$/, '')
    const revoke = line.match(/^REVOKE ALL ON TABLE public\.(polls|poll_options|poll_votes) FROM (.+)$/i)
    if (revoke) {
      const table = revoke[1] as TableName
      const revokedRoles = revoke[2].split(',').map(role => role.trim().toLowerCase())
      const tableGrants = grants.get(table)
      if (!tableGrants) continue
      for (const role of revokedRoles) {
        if (role === 'anon' || role === 'authenticated' || role === 'service_role') {
          tableGrants.set(role, new Set())
        }
      }
      continue
    }

    const grant = line.match(/^GRANT ([A-Z ,]+) ON TABLE public\.(polls|poll_options|poll_votes) TO ([a-z_]+)$/i)
    if (!grant) continue
    const table = grant[2] as TableName
    const role = grant[3].toLowerCase() as Role
    const listed = grant[1].toUpperCase() === 'ALL'
      ? TABLE_PRIVILEGES
      : grant[1].split(',').map(privilege => privilege.trim().toUpperCase())
    const tableGrants = grants.get(table)
    if (!tableGrants) continue
    const held = tableGrants.get(role) ?? new Set<string>()
    for (const privilege of listed) held.add(privilege)
    tableGrants.set(role, held)
  }

  return grants
}

function privilegeList(grants: Map<TableName, Map<Role, Set<string>>>, table: TableName, role: Role): string[] {
  return [...(grants.get(table)?.get(role) ?? new Set<string>())].sort()
}

describe('109_lock_down_poll_votes', () => {
  it('is the only 109 migration', () => {
    const names = readdirSync(migrationsDir).filter(name => name.startsWith('109_'))
    expect(names).toEqual(['109_lock_down_poll_votes.sql'])
  })

  it('drops the open insert policy and keeps the public read policies', () => {
    const executable = stripSqlComments(migration)
    expect(executable).toContain('DROP POLICY IF EXISTS "Anyone can vote" ON public.poll_votes')
    expect(executable.toLowerCase()).not.toMatch(/drop policy[^;]*public read/)
    expect(executable).toContain('v_user_id uuid := auth.uid()')
    expect(executable).toContain("v_status is distinct from 'active'")
    expect(executable).toContain('v_closes_at is not null and v_closes_at <= now()')
    expect(executable).toContain('on conflict (poll_id, user_id)')
    expect(executable).toMatch(/function public\.increment_poll_vote\(p_option_id uuid\)/i)
    expect(executable).not.toMatch(/p_user_id/)
    expect(executable).toContain('REVOKE ALL ON FUNCTION public.increment_poll_vote(uuid) FROM PUBLIC, anon')
    expect(executable).toContain('GRANT EXECUTE ON FUNCTION public.increment_poll_vote(uuid) TO authenticated, service_role')
  })

  it('leaves anon and authenticated with only the privileges the app queries use', () => {
    const grants = grantsAfterMigration(migration)

    expect(privilegeList(grants, 'polls', 'anon')).toEqual(['SELECT'])
    expect(privilegeList(grants, 'polls', 'authenticated')).toEqual(['INSERT', 'SELECT'])
    expect(privilegeList(grants, 'poll_options', 'anon')).toEqual(['SELECT'])
    expect(privilegeList(grants, 'poll_options', 'authenticated')).toEqual(['INSERT', 'SELECT'])
    expect(privilegeList(grants, 'poll_votes', 'anon')).toEqual([])
    expect(privilegeList(grants, 'poll_votes', 'authenticated')).toEqual(['SELECT'])

    for (const line of stripSqlComments(migration).split('\n')) {
      const compact = line.replace(/\s+/g, ' ').trim()
      if (/^revoke\b/i.test(compact) && /on table public\.poll/i.test(compact)) {
        expect(compact.toLowerCase()).not.toContain('service_role')
      }
      if (/^grant\b/i.test(compact) && /on table public\.poll_votes/i.test(compact)) {
        expect(compact.toLowerCase()).not.toMatch(/\binsert\b/)
        expect(compact.toLowerCase()).not.toContain(' to anon')
      }
    }
  })
})
