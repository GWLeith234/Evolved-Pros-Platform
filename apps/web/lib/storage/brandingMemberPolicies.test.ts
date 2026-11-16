/**
 * Migration 111 locks member writes on the public Branding bucket to
 * avatars/<auth.uid()>/ and banners/<auth.uid()>/, drops the broad and
 * dead policies, and sets the mime allowlist. It reads the SQL files.
 * It does not connect to a database and it does not apply the migration.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../../..')
const migrationsDir = resolve(repoRoot, 'supabase/migrations')
const migrationPath = resolve(migrationsDir, '111_branding_member_own_folder.sql')
const migration = readFileSync(migrationPath, 'utf8')

const SELF = '365a3ddd-1111-4111-8111-111111111111'
const OTHER = '09c059f1-2222-4222-8222-222222222222'

const DROPPED = [
  'Members can upload avatars and banners',
  'Members can update their avatar and banner',
  'Users can upload their own avatar or banner',
  'Users can update their own avatar or banner',
  'Banner upload by owner',
  'Banner update by owner',
  'Anyone can view branding files',
  'Users can upload their own banners',
  'Members upload own avatar and banner',
  'Members update own avatar and banner',
] as const

const ADMIN_POLICIES = ['Branding admin upload', 'Branding admin update'] as const
const PUBLIC_READ = 'Branding read public'

type Command = 'INSERT' | 'UPDATE' | 'SELECT' | 'DELETE' | 'ALL'

interface StoragePolicy {
  name: string
  command: Command
  roles: string[] | null
  using: string | null
  withCheck: string | null
}

interface Actor {
  uid: string
  role: 'authenticated' | 'anon'
  admin: boolean
}

const member: Actor = { uid: SELF, role: 'authenticated', admin: false }
const admin: Actor = { uid: SELF, role: 'authenticated', admin: true }

function stripSqlComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '')
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

function extractParen(source: string): { inner: string; rest: string } {
  const start = source.indexOf('(')
  if (start === -1) throw new Error(`Expected parentheses in: ${source}`)
  let depth = 0
  let inSingle = false
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i]
    if (ch === "'") inSingle = !inSingle
    if (!inSingle && ch === '(') depth += 1
    if (!inSingle && ch === ')') {
      depth -= 1
      if (depth === 0) {
        return { inner: source.slice(start + 1, i), rest: source.slice(i + 1) }
      }
    }
  }
  throw new Error(`Unbalanced parentheses in: ${source}`)
}

function parsePolicy(statement: string): StoragePolicy | null {
  const compact = statement.replace(/\s+/g, ' ').trim()
  const head = compact.match(/^CREATE POLICY(?: IF NOT EXISTS)? "([^"]+)" ON storage\.objects FOR (INSERT|UPDATE|SELECT|DELETE|ALL)\b/i)
  if (!head) return null
  let rest = compact.slice(head[0].length).trim()
  let roles: string[] | null = null
  const to = rest.match(/^TO ([a-z_]+(?:\s*,\s*[a-z_]+)*)\s+/i)
  if (to) {
    roles = to[1].split(',').map(role => role.trim().toLowerCase()).filter(Boolean)
    rest = rest.slice(to[0].length).trim()
  }
  let using: string | null = null
  let withCheck: string | null = null
  if (/^USING\b/i.test(rest)) {
    const extracted = extractParen(rest.slice('USING'.length))
    using = extracted.inner
    rest = extracted.rest.trim()
  }
  if (/^WITH CHECK\b/i.test(rest)) {
    const extracted = extractParen(rest.slice('WITH CHECK'.length))
    withCheck = extracted.inner
    rest = extracted.rest.trim()
  }
  if (rest.length > 0) throw new Error(`Unparsed policy tail: ${rest}`)
  return {
    name: head[1],
    command: head[2].toUpperCase() as Command,
    roles,
    using,
    withCheck,
  }
}

function policiesIn(sql: string): StoragePolicy[] {
  const found: StoragePolicy[] = []
  for (const statement of statements(stripSqlComments(sql))) {
    const policy = parsePolicy(statement)
    if (policy) found.push(policy)
  }
  return found
}

function migrationFiles(): string[] {
  return readdirSync(migrationsDir)
    .filter(name => /^\d+_.+\.sql$/.test(name))
    .sort((a, b) => Number(a.split('_')[0]) - Number(b.split('_')[0]) || a.localeCompare(b))
}

function effectivePolicies(): StoragePolicy[] {
  const policies = new Map<string, StoragePolicy>()
  for (const name of migrationFiles()) {
    const sql = readFileSync(resolve(migrationsDir, name), 'utf8')
    for (const statement of statements(stripSqlComments(sql))) {
      const compact = statement.replace(/\s+/g, ' ').trim()
      const dropped = compact.match(/^DROP POLICY IF EXISTS "([^"]+)" ON storage\.objects$/i)
      if (dropped) {
        policies.delete(dropped[1])
        continue
      }
      const created = parsePolicy(statement)
      if (created) policies.set(created.name, created)
    }
  }
  return [...policies.values()]
}

function foldername(objectName: string): string[] {
  const parts = objectName.split('/')
  if (parts.length <= 1) return []
  return parts.slice(0, -1)
}

function splitTop(expr: string, op: 'and' | 'or'): string[] | null {
  const needle = ` ${op} `
  const parts: string[] = []
  let current = ''
  let depth = 0
  let inSingle = false
  for (let i = 0; i < expr.length; i += 1) {
    const ch = expr[i]
    if (ch === "'") inSingle = !inSingle
    if (!inSingle && ch === '(') depth += 1
    if (!inSingle && ch === ')') depth -= 1
    if (!inSingle && depth === 0 && expr.slice(i, i + needle.length).toLowerCase() === needle) {
      parts.push(current.trim())
      current = ''
      i += needle.length - 1
      continue
    }
    current += ch
  }
  if (parts.length === 0) return null
  parts.push(current.trim())
  return parts
}

function unwrap(expr: string): string {
  let current = expr.trim()
  for (;;) {
    if (!current.startsWith('(') || !current.endsWith(')')) return current
    let depth = 0
    let inSingle = false
    let wraps = true
    for (let i = 0; i < current.length; i += 1) {
      const ch = current[i]
      if (ch === "'") inSingle = !inSingle
      if (!inSingle && ch === '(') depth += 1
      if (!inSingle && ch === ')') depth -= 1
      if (depth === 0 && i < current.length - 1) {
        wraps = false
        break
      }
    }
    if (!wraps || depth !== 0) return current
    current = current.slice(1, -1).trim()
  }
}

function evalAtom(atom: string, objectName: string, actor: Actor): boolean {
  const s = atom.replace(/\s+/g, ' ').trim()
  const bucketEq = s.match(/^bucket_id = '([^']*)'$/i)
  if (bucketEq) return bucketEq[1] === 'Branding'

  if (/^auth\.uid\(\) is not null$/i.test(s)) return actor.uid.length > 0

  const roleEq = s.match(/^auth\.role\(\) = '([^']*)'$/i)
  if (roleEq) return actor.role === roleEq[1]

  const folderEq = s.match(/^\(storage\.foldername\(name\)\)\[(\d+)\] = '([^']*)'$/i)
  if (folderEq) {
    const folders = foldername(objectName)
    return folders[Number(folderEq[1]) - 1] === folderEq[2]
  }

  const folderIn = s.match(/^\(storage\.foldername\(name\)\)\[(\d+)\] in \((.*)\)$/i)
  if (folderIn) {
    const options = [...folderIn[2].matchAll(/'([^']*)'/g)].map(match => match[1])
    const value = foldername(objectName)[Number(folderIn[1]) - 1]
    return value != null && options.includes(value)
  }

  if (
    /^\(storage\.foldername\(name\)\)\[2\] = \(auth\.uid\(\)\)::text$/i.test(s)
    || /^\(storage\.foldername\(name\)\)\[2\] = auth\.uid\(\)::text$/i.test(s)
  ) {
    return foldername(objectName)[1] === actor.uid
  }

  const like = s.match(/^name (?:like|~~) '([^']*)'$/i)
  if (like) {
    if (!like[1].endsWith('%')) throw new Error(`Unsupported LIKE pattern: ${like[1]}`)
    return objectName.startsWith(like[1].slice(0, -1))
  }

  if (/^exists\b/i.test(s)) {
    if (!/role\s*=\s*'admin'/i.test(s) || !/auth\.uid\(\)/i.test(s)) {
      throw new Error(`Unrecognized EXISTS: ${s}`)
    }
    return actor.admin
  }

  throw new Error(`Unrecognized predicate: ${s}`)
}

function evalExpr(expr: string, objectName: string, actor: Actor): boolean {
  const current = unwrap(expr.replace(/\s+/g, ' ').trim())
  const orParts = splitTop(current, 'or')
  if (orParts) return orParts.some(part => evalExpr(part, objectName, actor))
  const andParts = splitTop(current, 'and')
  if (andParts) return andParts.every(part => evalExpr(part, objectName, actor))
  return evalAtom(current, objectName, actor)
}

function applies(policy: StoragePolicy, actor: Actor): boolean {
  if (!policy.roles || policy.roles.includes('public')) return true
  return policy.roles.includes(actor.role)
}

function commandAllows(
  policies: StoragePolicy[],
  command: 'INSERT' | 'UPDATE',
  objectName: string,
  actor: Actor,
): boolean {
  return policies.some(policy => {
    if (policy.command !== command && policy.command !== 'ALL') return false
    if (!applies(policy, actor)) return false
    if (command === 'INSERT') {
      if (!policy.withCheck) return false
      return evalExpr(policy.withCheck, objectName, actor)
    }
    if (!policy.using || !evalExpr(policy.using, objectName, actor)) return false
    const check = policy.withCheck ?? policy.using
    return evalExpr(check, objectName, actor)
  })
}

function createdNames(sql: string): string[] {
  return policiesIn(sql).map(policy => policy.name)
}

describe('111_branding_member_own_folder', () => {
  const executable = stripSqlComments(migration)
  const created = policiesIn(migration)
  const effective = effectivePolicies()

  it('is the only 111 migration', () => {
    const names = readdirSync(migrationsDir).filter(name => name.startsWith('111_'))
    expect(names).toEqual(['111_branding_member_own_folder.sql'])
  })

  it('drops the broad, superseded, and dead policies and does not recreate them', () => {
    for (const name of DROPPED) {
      expect(executable).toContain(`DROP POLICY IF EXISTS "${name}" ON storage.objects`)
    }
    expect(createdNames(migration)).toEqual([
      'Members upload own avatar and banner',
      'Members update own avatar and banner',
    ])
    for (const name of DROPPED) {
      if (name.startsWith('Members upload') || name.startsWith('Members update')) continue
      expect(executable).not.toContain(`CREATE POLICY "${name}"`)
    }
    expect(executable).not.toContain("bucket_id = 'branding'")
    expect(executable).not.toContain('LIKE')
  })

  it('restates member INSERT and UPDATE with the own-folder check', () => {
    expect(created.map(policy => policy.name)).toEqual([
      'Members upload own avatar and banner',
      'Members update own avatar and banner',
    ])
    const insert = created[0]
    const update = created[1]
    expect(insert.command).toBe('INSERT')
    expect(insert.using).toBeNull()
    expect(update.command).toBe('UPDATE')
    expect(update.withCheck).toBe(update.using)
    for (const expr of [insert.withCheck, update.using, update.withCheck]) {
      const text = (expr ?? '').replace(/\s+/g, ' ')
      expect(text).toContain("bucket_id = 'Branding'")
      expect(text).toContain("auth.role() = 'authenticated'")
      expect(text).toContain("(storage.foldername(name))[1] IN ('avatars', 'banners')")
      expect(text).toContain('(storage.foldername(name))[2] = (auth.uid())::text')
    }
    for (const policy of created) {
      const dropAt = executable.indexOf(`DROP POLICY IF EXISTS "${policy.name}" ON storage.objects`)
      const createAt = executable.indexOf(`CREATE POLICY "${policy.name}"`)
      expect(dropAt).toBeGreaterThanOrEqual(0)
      expect(createAt).toBeGreaterThan(dropAt)
    }
  })

  it('refuses a member write in another member folder, a flat key, or an admin preset path', () => {
    const denied = [
      `avatars/${OTHER}/1.jpg`,
      `banners/${OTHER}/1.jpg`,
      `avatars/${OTHER}-1.jpg`,
      'avatars/930ce556-3333-4333-8333-333333333333.jpg',
      'banners/preset_abc.png',
      'banners/custom_1.jpg',
      'ads/1.png',
      'logos/logo_dark.png',
    ]
    const memberUpdate = effective.find(policy => policy.name === 'Members update own avatar and banner')
    expect(memberUpdate?.using).toBeTruthy()
    for (const objectName of denied) {
      expect(commandAllows(effective, 'INSERT', objectName, member), objectName).toBe(false)
      expect(commandAllows(effective, 'UPDATE', objectName, member), objectName).toBe(false)
      expect(evalExpr(memberUpdate?.using ?? '', objectName, member), objectName).toBe(false)
    }
    for (const objectName of [`avatars/${SELF}/1.jpg`, `banners/${SELF}/1.png`]) {
      expect(commandAllows(effective, 'INSERT', objectName, member), objectName).toBe(true)
      expect(commandAllows(effective, 'UPDATE', objectName, member), objectName).toBe(true)
      expect(evalExpr(memberUpdate?.using ?? '', objectName, member), objectName).toBe(true)
    }
  })

  it('still catches the old broad policy, which lets a member write anywhere under avatars/ or banners/', () => {
    const oldSql = readFileSync(resolve(migrationsDir, '025_storage_avatar_policies.sql'), 'utf8')
    const old = policiesIn(oldSql)
    expect(old.map(policy => policy.name)).toEqual([
      'Users can upload their own avatar or banner',
      'Users can update their own avatar or banner',
    ])
    expect(commandAllows(old, 'INSERT', `avatars/${OTHER}/1.jpg`, member)).toBe(true)
    expect(commandAllows(old, 'UPDATE', 'banners/preset_abc.png', member)).toBe(true)
    expect(commandAllows(old, 'INSERT', `banners/${OTHER}/1.jpg`, member)).toBe(true)
    expect(effective.find(policy => policy.name === old[0].name)).toBeUndefined()
    expect(effective.find(policy => policy.name === old[1].name)).toBeUndefined()
  })

  it('keeps admin upload and update, which cover banners/preset_* and banners/custom_*', () => {
    for (const name of ADMIN_POLICIES) {
      expect(executable).not.toContain(`DROP POLICY IF EXISTS "${name}"`)
      expect(executable).not.toContain(`CREATE POLICY "${name}"`)
    }
    expect(executable).not.toContain(`DROP POLICY IF EXISTS "${PUBLIC_READ}"`)
    const upload = effective.find(policy => policy.name === 'Branding admin upload')
    const update = effective.find(policy => policy.name === 'Branding admin update')
    expect(upload?.command).toBe('INSERT')
    expect(update?.command).toBe('UPDATE')
    for (const policy of [upload, update]) {
      const text = `${policy?.using ?? ''} ${policy?.withCheck ?? ''}`
      expect(text).toContain("bucket_id = 'Branding'")
      expect(text).toContain("role = 'admin'")
      expect(text).not.toContain('foldername')
      expect(text).not.toContain('preset_')
      expect(text).not.toContain('custom_')
      expect(text.toLowerCase()).not.toContain('like')
    }
    for (const objectName of ['banners/preset_abc.png', 'banners/custom_1.jpg', 'logos/logo.png', 'ads/1.png']) {
      expect(commandAllows(effective, 'INSERT', objectName, admin), objectName).toBe(true)
      expect(commandAllows(effective, 'UPDATE', objectName, admin), objectName).toBe(true)
      expect(commandAllows(effective, 'INSERT', objectName, member), objectName).toBe(false)
    }
  })

  it('sets the mime allowlist and a 10MB file size limit', () => {
    const match = executable.match(/UPDATE storage\.buckets\s+SET allowed_mime_types = ARRAY\[([\s\S]*?)\]\s*,\s*file_size_limit = 10485760\s+WHERE id = 'Branding'/i)
    expect(match).not.toBeNull()
    const mimes = [...(match?.[1] ?? '').matchAll(/'([^']+)'/g)].map(item => item[1])
    expect(mimes).toEqual(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'text/plain'])
    expect(executable).toMatch(/file_size_limit = 10485760/)
    expect(executable).not.toContain("'application/pdf'")
    expect(executable).not.toContain("'image/svg+xml'")
  })
})
