/**
 * GET /api/polls/active is the public read. Logged-out visitors still receive
 * the poll, its options, and the vote counts. Counts are read with the
 * service role inside this route.
 */
import { describe, expect, it, vi } from 'vitest'

const POLL_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const OPTION_A = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
const OPTION_B = 'ffffffff-ffff-4fff-8fff-ffffffffffff'

const poll = {
  id: POLL_ID,
  question: 'Which pillar is next?',
  status: 'active',
  closes_at: null,
  poll_options: [
    { id: OPTION_A, option_text: 'Foundation', display_order: 0 },
    { id: OPTION_B, option_text: 'Identity', display_order: 1 },
  ],
}

function chain(result: { data: unknown; error: null }) {
  const api: Record<string, unknown> = {}
  const self = () => api
  api.select = self
  api.eq = self
  api.or = self
  api.order = self
  api.limit = self
  api.maybeSingle = async () => result
  api.then = (
    onFulfilled: (value: typeof result) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected)
  return api
}

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    from: (table: string) => {
      if (table === 'polls') return chain({ data: poll, error: null })
      if (table === 'poll_votes') {
        return chain({
          data: [
            { option_id: OPTION_A },
            { option_id: OPTION_A },
            { option_id: OPTION_B },
          ],
          error: null,
        })
      }
      return chain({ data: null, error: null })
    },
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
  }),
}))

vi.mock('@/lib/auth/resolveCurrentUser', () => ({
  resolveCurrentUser: async () => {
    throw new Error('public read must not resolve a session user')
  },
}))

import { GET } from '@/app/api/polls/active/route'

describe('GET /api/polls/active', () => {
  it('returns the poll, its options, and vote counts with no session', async () => {
    const res = await GET(new Request('http://localhost/api/polls/active?context=media'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      poll,
      voteCounts: { [OPTION_A]: 2, [OPTION_B]: 1 },
      totalVotes: 3,
      userVoteOptionId: null,
    })
  })
})
