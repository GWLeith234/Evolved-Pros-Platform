/**
 * Migration 110 records the live poll RLS and grants from the 2026-11-13
 * catalog (after 109) and replaces the public poll_votes read with an
 * own-row policy. The test reads the file. It does not connect to a database
 * and it does not apply the migration.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../../..')
const migrationsDir = resolve(repoRoot, 'supabase/migrations')
const migrationPath = resolve(migrationsDir, '110_poll_votes_own_read.sql')
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

/** Live admin USING expression, catalog text from 2026-11-13. */
const LIVE_ADMIN_QUAL = `(EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text))))`

const SERVICE_ROLE_PRIVILEGES = [...TABLE_PRIVILEGES].sort()

function stripSqlComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '')
}

function normalize(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim().toLowerCase()
}

function statements(sql: string): string[] {
  const parts: string[] = []
  let current = ''
  let depth = 0
  let inSingle = false
  for (const ch of sql) {
    if (ch === "'") inSingle = !inSingle
    if (!inSingle && ch === '(') depth += 1
    if (!inSingle && ch === ')' && depth > 0) depth -= 1
    if (!inSingle && depth === 0 && ch === ';') {
      if (current.trim()) parts.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}

type Policy = {
  name: string
  table: TableName
  command: string
  roles: string[]
  using: string
  withCheck: string | null
}

function policiesIn(sql: string): Policy[] {
  const found: Policy[] = []
  for (const statement of statements(stripSqlComments(sql))) {
    const compact = statement.replace(/\s+/g, ' ').trim()
    if (!/^create policy /i.test(compact)) continue
    const match = compact.match(
      /^CREATE POLICY "([^"]+)" ON public\.(polls|poll_options|poll_votes) FOR (SELECT|ALL)(?: TO ([a-z_ ,]+))? USING \((.*)\)(?: WITH CHECK \((.*)\))?$/i,
    )
    if (!match) throw new Error(`Unparsed policy statement: ${compact}`)
    const roles = (match[4] ?? 'public').split(',').map(role => role.trim().toLowerCase()).filter(Boolean)
    found.push({
      name: match[1],
      table: match[2] as TableName,
      command: match[3].toUpperCase(),
      roles,
      using: normalize(match[5]),
      withCheck: match[6] ? normalize(match[6]) : null,
    })
  }
  return found
}

function grantsAfterMigration(sql: string): Map<TableName, Map<Role, Set<string>>> {
  // anon and authenticated start with every privilege so a missing REVOKE
  // cannot look like the live tightened result. service_role starts empty
  // so the file has to grant the live privileges explicitly.
  const grants = new Map<TableName, Map<Role, Set<string>>>()
  const tables: TableName[] = ['polls', 'poll_options', 'poll_votes']
  for (const table of tables) {
    const tableGrants = new Map<Role, Set<string>>()
    tableGrants.set('anon', new Set(TABLE_PRIVILEGES))
    tableGrants.set('authenticated', new Set(TABLE_PRIVILEGES))
    tableGrants.set('service_role', new Set())
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

describe('110_poll_votes_own_read', () => {
  const executable = stripSqlComments(migration)

  it('is the only 110 migration', () => {
    const names = readdirSync(migrationsDir).filter(name => name.startsWith('110_'))
    expect(names).toEqual(['110_poll_votes_own_read.sql'])
  })

  it('enables RLS and leaves it unforced on polls, poll_options, and poll_votes', () => {
    for (const table of ['polls', 'poll_options', 'poll_votes'] as const) {
      expect(executable).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`)
      expect(executable).toContain(`ALTER TABLE public.${table} NO FORCE ROW LEVEL SECURITY`)
    }
    for (const line of executable.split('\n')) {
      if (!/row level security/i.test(line)) continue
      expect(line).toMatch(/ENABLE ROW LEVEL SECURITY|NO FORCE ROW LEVEL SECURITY/)
    }
  })

  it('matches the live policies, with poll_votes SELECT limited to the caller', () => {
    const policies = policiesIn(migration)
    const adminUsing = normalize(LIVE_ADMIN_QUAL)
    expect(policies).toEqual([
      {
        name: 'Public read polls',
        table: 'polls',
        command: 'SELECT',
        roles: ['public'],
        using: 'true',
        withCheck: null,
      },
      {
        name: 'Admin manage polls',
        table: 'polls',
        command: 'ALL',
        roles: ['public'],
        using: adminUsing,
        withCheck: null,
      },
      {
        name: 'Public read poll options',
        table: 'poll_options',
        command: 'SELECT',
        roles: ['public'],
        using: 'true',
        withCheck: null,
      },
      {
        name: 'Admin manage poll options',
        table: 'poll_options',
        command: 'ALL',
        roles: ['public'],
        using: adminUsing,
        withCheck: null,
      },
      {
        name: 'Read own poll vote',
        table: 'poll_votes',
        command: 'SELECT',
        roles: ['authenticated'],
        using: normalize('user_id = auth.uid()'),
        withCheck: null,
      },
    ])

    for (const policy of policies) {
      const dropAt = executable.indexOf(`DROP POLICY IF EXISTS "${policy.name}" ON public.${policy.table}`)
      const createAt = executable.indexOf(`CREATE POLICY "${policy.name}"`)
      expect(dropAt).toBeGreaterThanOrEqual(0)
      expect(createAt).toBeGreaterThan(dropAt)
    }

    expect(executable).toContain('DROP POLICY IF EXISTS "Public read vote counts" ON public.poll_votes')
    expect(executable).toContain('DROP POLICY IF EXISTS "Anyone can vote" ON public.poll_votes')
    expect(executable.toLowerCase()).not.toContain('create policy "public read vote counts"')
    expect(executable.toLowerCase()).not.toContain('with check')
  })

  it('matches the live anon, authenticated, and service_role grants', () => {
    const grants = grantsAfterMigration(migration)

    expect(privilegeList(grants, 'polls', 'anon')).toEqual(['SELECT'])
    expect(privilegeList(grants, 'polls', 'authenticated')).toEqual(['INSERT', 'SELECT'])
    expect(privilegeList(grants, 'polls', 'service_role')).toEqual(SERVICE_ROLE_PRIVILEGES)

    expect(privilegeList(grants, 'poll_options', 'anon')).toEqual(['SELECT'])
    expect(privilegeList(grants, 'poll_options', 'authenticated')).toEqual(['INSERT', 'SELECT'])
    expect(privilegeList(grants, 'poll_options', 'service_role')).toEqual(SERVICE_ROLE_PRIVILEGES)

    expect(privilegeList(grants, 'poll_votes', 'anon')).toEqual([])
    expect(privilegeList(grants, 'poll_votes', 'authenticated')).toEqual(['SELECT'])
    expect(privilegeList(grants, 'poll_votes', 'service_role')).toEqual(SERVICE_ROLE_PRIVILEGES)

    for (const line of executable.split('\n')) {
      const compact = line.replace(/\s+/g, ' ').trim()
      if (/^revoke\b/i.test(compact)) {
        expect(compact.toLowerCase()).not.toContain('service_role')
      }
    }
  })
})
