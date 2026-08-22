/**
 * Guards the S1 fix on the public media index (`app/(public)/media/page.tsx`).
 *
 * The page is reachable logged-out, so its `createClient()` is an anonymous
 * PostgREST context. The author-avatar join against public.users must run on
 * the service-role client instead, with a narrow column allowlist — and it must
 * still degrade to initials (an empty avatar map) when that lookup fails.
 *
 * Lives under lib/ because vitest.config.ts only collects `lib/**` specs; the
 * module under test is imported through the `@/` alias.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── Mocks ───────────────────────────────────────────────────────────────────

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

/** Terminal builder node that rejects when awaited. */
function rejects(error: unknown) {
  const node: Record<string, unknown> = {
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.reject(error).then(resolve, reject),
  }
  for (const method of ['select', 'eq', 'order', 'limit', 'in']) {
    node[method] = () => node
  }
  return node
}

const STORIES = [
  { id: 's1', title: 'Stay in the Fight', slug: 'stay-in-the-fight', author: 'George Leith' },
  { id: 's2', title: 'Close the Gap', slug: 'close-the-gap', author: 'Chaela Leith' },
]

/** Records every `.select()` argument list the admin client sees. */
const adminSelectCalls: unknown[][] = []
/** Tables read through the anon (request) client. */
const anonTables: string[] = []
/** Tables read through the service-role client. */
const adminTables: string[] = []

let usersLookup: () => Record<string, unknown> = () =>
  result({ data: [{ full_name: 'George Leith', avatar_url: 'https://cdn.test/george.jpg' }] })

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    from: (table: string) => {
      adminTables.push(table)
      const node = usersLookup()
      const select = node.select as () => Record<string, unknown>
      node.select = (...args: unknown[]) => {
        adminSelectCalls.push(args)
        return select()
      }
      return node
    },
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: (table: string) => {
      anonTables.push(table)
      if (table === 'media_stories') return result({ data: STORIES })
      if (table === 'episodes') return result({ data: [] })
      // The anon client must never be the one reading public.users.
      throw new Error(`unexpected anon read of "${table}"`)
    },
  }),
}))

function MediaPortalClientMock() {
  return null
}
vi.mock('@/app/(public)/media/MediaPortalClient', () => ({
  MediaPortalClient: MediaPortalClientMock,
}))
vi.mock('@/components/media/Masthead', () => ({ Masthead: () => null }))

// ── Helpers ─────────────────────────────────────────────────────────────────

type Element = { type?: unknown; props?: { children?: unknown } }

/** Depth-first search for the rendered MediaPortalClient element. */
function findPortal(node: unknown): Element | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const hit = findPortal(child)
      if (hit) return hit
    }
    return null
  }
  if (!node || typeof node !== 'object') return null
  const el = node as Element
  if (el.type === MediaPortalClientMock) return el
  return findPortal(el.props?.children)
}

async function renderMediaIndex() {
  const { default: MediaPage } = await import('@/app/(public)/media/page')
  const portal = findPortal(await MediaPage())
  if (!portal) throw new Error('MediaPortalClient was not rendered')
  return portal.props as { authorAvatars: Record<string, string> }
}

// ── Specs ───────────────────────────────────────────────────────────────────

describe('public media index — author avatar lookup', () => {
  beforeEach(() => {
    adminSelectCalls.length = 0
    adminTables.length = 0
    anonTables.length = 0
    vi.resetModules()
  })

  it('renders author avatars when the users lookup succeeds', async () => {
    usersLookup = () =>
      result({ data: [{ full_name: 'George Leith', avatar_url: 'https://cdn.test/george.jpg' }] })

    const props = await renderMediaIndex()

    expect(props.authorAvatars).toEqual({ 'George Leith': 'https://cdn.test/george.jpg' })
  })

  it('falls back to initials (empty avatar map) when the users lookup throws', async () => {
    usersLookup = () => rejects(new Error('permission denied for table users'))

    const props = await renderMediaIndex()

    expect(props.authorAvatars).toEqual({})
  })

  it('reads public.users through the service-role client, never the anon client', async () => {
    usersLookup = () => result({ data: [] })

    await renderMediaIndex()

    expect(adminTables).toContain('users')
    expect(anonTables).not.toContain('users')
    // media_stories / episodes stay on the request client — intentionally public.
    expect(anonTables).toEqual(expect.arrayContaining(['media_stories', 'episodes']))
  })

  it('keeps the users column allowlist narrow and free of email', async () => {
    usersLookup = () => result({ data: [] })

    await renderMediaIndex()

    expect(adminSelectCalls).toEqual([['full_name, avatar_url']])
    expect(JSON.stringify(adminSelectCalls)).not.toContain('email')
  })
})
