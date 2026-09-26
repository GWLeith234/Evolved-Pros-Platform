import { generateKeyPairSync } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { FIT_MUX_TOKEN_EXPIRY } from '@/lib/mux/client'

const state = vi.hoisted(() => ({
  profile: null as { tier: string; tier_status: string | null } | null,
  move: null as {
    id: string
    status: string
    video_status: string
    mux_playback_id: string | null
  } | null,
  selects: 0,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({}),
}))

vi.mock('@/lib/auth/resolveCurrentUser', () => ({
  resolveCurrentUser: async () => state.profile,
}))

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    from: (table: string) => {
      if (table !== 'fit_moves') throw new Error(`unexpected table ${table}`)
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => {
              state.selects += 1
              return { data: state.move, error: null }
            },
          }),
        }),
      }
    },
  },
}))

import { GET } from '@/app/api/fit/[moveId]/mux-token/route'

const MOVE_ID = '11111111-1111-4111-8111-111111111111'

function readyMove() {
  state.move = {
    id: MOVE_ID,
    status: 'published',
    video_status: 'ready',
    mux_playback_id: 'play-ready',
  }
}

async function call() {
  return GET(new Request('http://localhost/api/fit/move/mux-token'), {
    params: { moveId: MOVE_ID },
  })
}

describe('Fit mux token route', () => {
  beforeAll(() => {
    const { privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    })
    process.env.MUX_SIGNING_KEY = 'fit-test-signing-key'
    process.env.MUX_PRIVATE_KEY = privateKey
  })

  beforeEach(() => {
    state.profile = null
    state.move = null
    state.selects = 0
  })

  it('signs a 15 minute token for VIP', async () => {
    state.profile = { tier: 'vip', tier_status: 'active' }
    readyMove()
    const before = Math.floor(Date.now() / 1000)
    const res = await call()
    const after = Math.floor(Date.now() / 1000)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.playbackId).toBe('play-ready')
    expect(typeof body.token).toBe('string')
    const payload = JSON.parse(Buffer.from(String(body.token).split('.')[1], 'base64url').toString()) as {
      aud?: string
      sub?: string
      exp?: number
      iat?: number
    }
    expect(payload.aud).toBe('v')
    expect(payload.sub).toBe('play-ready')
    expect(payload.exp).toEqual(expect.any(Number))
    const exp = payload.exp as number
    expect(exp).toBeGreaterThanOrEqual(before + 15 * 60)
    expect(exp).toBeLessThanOrEqual(after + 15 * 60)
    if (typeof payload.iat === 'number') {
      expect(exp - payload.iat).toBe(15 * 60)
    }
    expect(FIT_MUX_TOKEN_EXPIRY).toBe('15m')
  })

  it('signs for Pro as well', async () => {
    state.profile = { tier: 'pro', tier_status: 'active' }
    readyMove()
    const res = await call()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.token).toEqual(expect.any(String))
  })

  it('returns 403 with no token for community', async () => {
    state.profile = { tier: 'community', tier_status: 'active' }
    readyMove()
    const res = await call()
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body).toEqual({ error: 'Upgrade required' })
    expect(body.token).toBeUndefined()
    expect(body.playbackId).toBeUndefined()
    expect(state.selects).toBe(0)
  })

  it('returns 403 for a lapsed VIP before reading the playback id', async () => {
    state.profile = { tier: 'vip', tier_status: 'expired' }
    readyMove()
    const res = await call()
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Upgrade required' })
    expect(state.selects).toBe(0)
  })

  it('returns 401 with no token when signed out', async () => {
    state.profile = null
    readyMove()
    const res = await call()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ error: 'Unauthorized' })
    expect(body.token).toBeUndefined()
    expect(state.selects).toBe(0)
  })

  it('leaves the lesson signer on a 12 hour expiry', () => {
    const lesson = readFileSync(
      resolve(__dirname, '../../app/api/lessons/[lessonId]/mux-token/route.ts'),
      'utf8',
    )
    const client = readFileSync(resolve(__dirname, '../mux/client.ts'), 'utf8')
    expect(lesson).toContain('generateMuxToken')
    expect(lesson).not.toContain('generateFitMuxToken')
    expect(lesson).not.toContain('15m')
    expect(client).toMatch(/expiration:\s*'12h'/)
    expect(client).toMatch(/expiration:\s*FIT_MUX_TOKEN_EXPIRY/)
  })
})
