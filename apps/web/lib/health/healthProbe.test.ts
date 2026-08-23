/**
 * Guards the S1-P3-B fix on the Railway healthcheck (`app/api/health/route.ts`).
 *
 * `@/lib/supabase/admin` builds its client at module scope with
 * createClient(url!, serviceRoleKey!), and supabase-js throws
 * 'supabaseKey is required' on a falsy key. A static top-level import therefore
 * made the probe die during module evaluation on exactly the broken deploy it
 * exists to diagnose — an opaque 500 instead of its own `misconfigured` body.
 *
 * Two invariants: the service-role key is part of the critical-env gate (503,
 * with serviceRole:false in the reported env), and the admin import is lazy and
 * inside the try, so an import-time throw degrades to `unreachable`/200 rather
 * than taking the route down.
 *
 * Lives under lib/ because vitest.config.ts only collects `lib/**` specs; the
 * route is imported through the `@/` alias.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ── Mocks ───────────────────────────────────────────────────────────────────

/** Records every `.select()` argument list the admin client sees. */
const adminSelectCalls: unknown[][] = []
/** Tables read through the service-role client. */
const adminTables: string[] = []

/** Terminal builder node: chainable *and* awaitable. */
function result(value: unknown) {
  const node: Record<string, unknown> = {
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(value).then(resolve, reject),
  }
  for (const method of ['select', 'eq', 'order', 'limit', 'in']) {
    node[method] = () => node
  }
  return node
}

/** Stubs @/lib/supabase/admin with a client whose users query resolves `value`. */
function mockAdminClient(value: unknown) {
  vi.doMock('@/lib/supabase/admin', () => ({
    adminClient: {
      from: (table: string) => {
        adminTables.push(table)
        const node = result(value)
        const select = node.select as () => Record<string, unknown>
        node.select = (...args: unknown[]) => {
          adminSelectCalls.push(args)
          return select()
        }
        return node
      },
    },
  }))
}

// ── Env plumbing ────────────────────────────────────────────────────────────

const ENV_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

const saved = new Map<string, string | undefined>()

function setEnv(key: (typeof ENV_KEYS)[number], value: string | undefined) {
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}

// ── Helpers ─────────────────────────────────────────────────────────────────

interface HealthBody {
  status: string
  ready: boolean
  supabase: string
  env: Record<string, boolean>
}

async function probe(): Promise<{ status: number; body: HealthBody }> {
  const { GET } = await import('@/app/api/health/route')
  const res = await GET()
  return { status: res.status, body: (await res.json()) as HealthBody }
}

// ── Specs ───────────────────────────────────────────────────────────────────

describe('railway health probe — service-role env gate and lazy admin import', () => {
  beforeEach(() => {
    adminSelectCalls.length = 0
    adminTables.length = 0
    saved.clear()
    for (const key of ENV_KEYS) saved.set(key, process.env[key])
    // Valid baseline; individual specs knock out what they are testing.
    setEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co')
    setEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')
    setEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key')
    vi.resetModules()
  })

  afterEach(() => {
    for (const key of ENV_KEYS) setEnv(key, saved.get(key))
    vi.doUnmock('@/lib/supabase/admin')
  })

  it('reports misconfigured (503) with serviceRole:false when the key is absent', async () => {
    setEnv('SUPABASE_SERVICE_ROLE_KEY', undefined)
    // Present but never reached — the gate short-circuits before the import.
    mockAdminClient({ error: null })

    const { status, body } = await probe()

    expect(status).toBe(503)
    expect(body.status).toBe('misconfigured')
    expect(body.ready).toBe(false)
    expect(body.env.serviceRole).toBe(false)
    // Env is still fully reported so the broken var is identifiable.
    expect(body.env.supabaseUrl).toBe(true)
    expect(body.env.supabaseKey).toBe(true)
    // The admin module must not have been touched at all.
    expect(adminTables).toEqual([])
  })

  it('degrades to unreachable (200) when the admin module throws on import', async () => {
    vi.doMock('@/lib/supabase/admin', () => {
      throw new Error('supabaseKey is required')
    })

    const { status, body } = await probe()

    // 200, not 503: env is valid, so Railway must not flap on a cold start.
    expect(status).toBe(200)
    expect(body.status).toBe('degraded')
    expect(body.supabase).toBe('unreachable')
    expect(body.ready).toBe(false)
  })

  it('reports ok/ready (200) when the head-only users count succeeds', async () => {
    mockAdminClient({ error: null })

    const { status, body } = await probe()

    expect(status).toBe(200)
    expect(body.status).toBe('ok')
    expect(body.ready).toBe(true)
    expect(body.supabase).toBe('connected')
    // Head-only count, no row data — the probe has no business reading rows.
    expect(adminTables).toEqual(['users'])
    expect(adminSelectCalls).toEqual([['id', { head: true, count: 'exact' }]])
  })
})
