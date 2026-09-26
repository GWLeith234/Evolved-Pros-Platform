import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  INTENT_TYPE,
  MEMBER_ALERT_EXCLUDED_ROLE,
  MEMBER_ALERT_TIER_STATUSES,
  contentCopy,
} from './intents'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../../..')
const migrationPath = resolve(repoRoot, 'supabase/migrations/106_media_publish_notify.sql')
const migration = readFileSync(migrationPath, 'utf8')

function stripSqlComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '')
}

function localPostgres(): boolean {
  try {
    execFileSync('sudo', ['-u', 'postgres', 'psql', '-d', 'postgres', '-c', 'SELECT 1'], {
      stdio: 'ignore',
    })
    return true
  } catch {
    return false
  }
}

const hasLocalPostgres = localPostgres()

describe('media publish trigger contract', () => {
  it('is migration 106 and does not rewrite existing stories', () => {
    const names = readdirSync(resolve(repoRoot, 'supabase/migrations')).filter(name =>
      name.startsWith('106_'),
    )
    expect(names).toEqual(['106_media_publish_notify.sql'])

    const executable = stripSqlComments(migration)
    expect(executable).not.toMatch(/\bupdate\s+(public\.)?(media_stories|notifications|users)\b/i)
    expect(executable).not.toMatch(/\bdelete\s+from\b/i)
    expect(executable).not.toMatch(/insert\s+into\s+(public\.)?media_stories/i)
  })

  it('keeps the Media copy identical to contentCopy', () => {
    const sample = 'Field note'
    const copy = contentCopy('media', sample)
    expect(copy.title).toBe('New Media story')
    expect(INTENT_TYPE.media).toBe('system_general')
    const marker = `**${sample}**`
    expect(copy.body.startsWith(marker)).toBe(true)
    const rest = copy.body.slice(marker.length)
    expect(rest.includes("'")).toBe(false)
    expect(migration).toContain(`'${copy.title}'`)
    expect(migration).toContain(`'system_general'`)
    expect(migration).toContain(`'**'||new.title||'**${rest}'`)
    expect(migration).toContain(
      `'/media/'||coalesce(nullif(nullif(new.pillar, ''), 'null'), 'general')||'/'||new.slug`,
    )
  })

  it('keeps the audience predicate identical to the member-alert constants', () => {
    const tiers = MEMBER_ALERT_TIER_STATUSES.map(status => `'${status}'`).join(', ')
    const compact = migration.replace(/\s+/g, ' ')
    expect(MEMBER_ALERT_TIER_STATUSES).toEqual(['active', 'trial'])
    expect(MEMBER_ALERT_EXCLUDED_ROLE).toBe('admin')
    expect(compact).toContain(`u.tier_status in (${tiers})`)
    expect(compact).toContain(`u.role <> '${MEMBER_ALERT_EXCLUDED_ROLE}'`)

    const nudges = readFileSync(resolve(here, 'nudges.ts'), 'utf8')
    expect(nudges).toContain('MEMBER_ALERT_TIER_STATUSES')
    expect(nudges).toContain('MEMBER_ALERT_EXCLUDED_ROLE')
    expect(nudges).not.toMatch(/\.in\(\s*'tier_status'\s*,\s*\[\s*'active'/)
  })

  it('does not grant the trigger function to anon or authenticated', () => {
    const grants = [...migration.matchAll(/^\s*grant\b[^;]*;/gim)].map(match => match[0])
    expect(grants.join('\n')).not.toMatch(/\banon\b|\bauthenticated\b/i)
    expect(migration.toLowerCase()).toContain('security definer')
    expect(migration.toLowerCase()).toContain('set search_path = public')
    expect(migration.toLowerCase()).toContain('on conflict do nothing')
    expect(migration.toLowerCase()).toContain('revoke all on function public.notify_media_published() from public')
    expect(migration.toLowerCase()).toContain('from anon, authenticated, service_role')
  })

  it('leaves admin publish routes on the trigger, not notifyMediaPublished', () => {
    const post = readFileSync(resolve(here, '../../app/api/admin/media/route.ts'), 'utf8')
    const patch = readFileSync(resolve(here, '../../app/api/admin/media/[id]/route.ts'), 'utf8')
    for (const route of [post, patch]) {
      expect(route).not.toMatch(/notifyMediaPublished\s*\(/)
      expect(route).not.toContain("from '@/lib/notifications/fanout'")
      expect(route).toContain('notify_media_published()')
    }
    const fanout = readFileSync(resolve(here, 'fanout.ts'), 'utf8')
    expect(fanout).toContain('export async function notifyMediaPublished')
    expect(fanout).toContain('notify_media_published()')
  })

  // CI has no local Postgres. The shell proof is the behavioral check:
  // one alert on false/null -> true, none on re-save, none on unpublish
  // then republish (including after 7 days), admins excluded.
  it.skipIf(!hasLocalPostgres)('passes the local postgres proof', () => {
    execFileSync('bash', [resolve(repoRoot, 'supabase/tests/run_106_media_publish_notify.sh')], {
      stdio: 'inherit',
    })
  })
})
