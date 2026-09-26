import crypto from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Call = {
  table: string
  op: 'insert' | 'update'
  values: unknown
  column?: string
  value?: unknown
}

const calls = vi.hoisted(() => [] as Call[])

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    from: (table: string) => ({
      insert: (values: unknown) => {
        calls.push({ table, op: 'insert', values })
        return Promise.resolve({ error: null })
      },
      update: (values: unknown) => ({
        eq: (column: string, value: unknown) => {
          calls.push({ table, op: 'update', values, column, value })
          return Promise.resolve({ error: null })
        },
      }),
    }),
  },
}))

import { POST } from '@/app/api/webhooks/mux/route'

const SECRET = 'test-mux-webhook-secret'
const PREV_SECRET = process.env.MUX_WEBHOOK_SECRET

function signature(body: string, secret = SECRET, ts = Math.floor(Date.now() / 1000)) {
  const v1 = crypto.createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex')
  return `t=${ts},v1=${v1}`
}

function request(body: string, header: string | null) {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (header) headers.set('mux-signature', header)
  return new Request('http://localhost/api/webhooks/mux', {
    method: 'POST',
    headers,
    body,
  })
}

function updates() {
  return calls.filter(call => call.op === 'update')
}

describe('Mux webhook fit vs lesson branching', () => {
  beforeEach(() => {
    process.env.MUX_WEBHOOK_SECRET = SECRET
    calls.length = 0
  })

  afterEach(() => {
    if (PREV_SECRET === undefined) delete process.env.MUX_WEBHOOK_SECRET
    else process.env.MUX_WEBHOOK_SECRET = PREV_SECRET
  })

  it('fails closed when the webhook secret is missing', async () => {
    delete process.env.MUX_WEBHOOK_SECRET
    const body = JSON.stringify({
      type: 'video.asset.ready',
      data: { id: 'asset-1', playback_ids: [{ id: 'play-1', policy: 'signed' }] },
    })
    const res = await POST(request(body, signature(body)))
    expect(res.status).toBe(503)
    expect(calls).toEqual([])
  })

  it('rejects a bad signature before any write', async () => {
    const body = JSON.stringify({
      type: 'video.asset.ready',
      data: { id: 'asset-1', playback_ids: [{ id: 'play-1', policy: 'signed' }] },
    })
    const res = await POST(request(body, signature(body, 'other-secret')))
    expect(res.status).toBe(401)
    expect(calls).toEqual([])
  })

  it('updates lessons and fit_moves when an asset is ready', async () => {
    const body = JSON.stringify({
      type: 'video.asset.ready',
      data: { id: 'asset-ready', playback_ids: [{ id: 'play-ready', policy: 'signed' }] },
    })
    const res = await POST(request(body, signature(body)))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ received: true })
    expect(updates()).toEqual([
      {
        table: 'lessons',
        op: 'update',
        values: { mux_playback_id: 'play-ready' },
        column: 'mux_asset_id',
        value: 'asset-ready',
      },
      {
        table: 'fit_moves',
        op: 'update',
        values: { mux_playback_id: 'play-ready', video_status: 'ready' },
        column: 'mux_asset_id',
        value: 'asset-ready',
      },
    ])
  })

  it('does not write a playback id when ready has none', async () => {
    const body = JSON.stringify({
      type: 'video.asset.ready',
      data: { id: 'asset-empty', playback_ids: [] },
    })
    const res = await POST(request(body, signature(body)))
    expect(res.status).toBe(200)
    expect(updates()).toEqual([])
    expect(calls.some(call => call.table === 'mux_webhooks' && call.op === 'insert')).toBe(true)
  })

  it('marks fit_moves errored and leaves lessons alone', async () => {
    const body = JSON.stringify({
      type: 'video.asset.errored',
      data: { id: 'asset-bad', playback_ids: [{ id: 'play-bad', policy: 'signed' }] },
    })
    const res = await POST(request(body, signature(body)))
    expect(res.status).toBe(200)
    expect(updates()).toEqual([
      {
        table: 'fit_moves',
        op: 'update',
        values: { video_status: 'errored' },
        column: 'mux_asset_id',
        value: 'asset-bad',
      },
    ])
    expect(updates().some(call => call.table === 'lessons')).toBe(false)
  })

  it('logs other events without updating lessons or fit_moves', async () => {
    const body = JSON.stringify({
      type: 'video.asset.created',
      data: { id: 'asset-new' },
    })
    const res = await POST(request(body, signature(body)))
    expect(res.status).toBe(200)
    expect(updates()).toEqual([])
    expect(calls).toEqual([
      expect.objectContaining({ table: 'mux_webhooks', op: 'insert' }),
    ])
  })
})
