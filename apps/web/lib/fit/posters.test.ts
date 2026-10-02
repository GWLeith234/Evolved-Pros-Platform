import { generateKeyPairSync } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { generateFitMuxToken } from '@/lib/mux/client'
import { featuredFitMove, type FitMove } from './moves'

const state = vi.hoisted(() => ({
  rows: null as Array<{
    id: string
    status: string
    video_status: string
    mux_playback_id: string | null
    thumbnail_time: number | null
    thumbnail_url?: string | null
  }> | null,
  error: null as { message: string } | null,
  selects: 0,
  columns: '',
  signedUrl: null as string | null,
  storage: [] as Array<{ bucket: string; key: string; expiresIn: number }>,
}))

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    from: (table: string) => {
      if (table !== 'fit_moves') throw new Error(`unexpected table ${table}`)
      return {
        select: (columns: string) => ({
          in: async () => {
            state.selects += 1
            state.columns = columns
            return { data: state.rows, error: state.error }
          },
        }),
      }
    },
    storage: {
      from: (bucket: string) => ({
        createSignedUrl: async (key: string, expiresIn: number) => {
          state.storage.push({ bucket, key, expiresIn })
          return {
            data: state.signedUrl ? { signedUrl: state.signedUrl } : null,
            error: state.signedUrl ? null : { message: 'no poster object' },
          }
        },
      }),
    },
  },
}))

import { attachLockedFitPosters, fitMovesForViewer, FIT_STORAGE_POSTER_TTL_SECONDS, publicFitPosterUrl } from './posters'

const MOVE_ID = '11111111-1111-4111-8111-111111111111'

function guide(): FitMove {
  return { ...featuredFitMove(), id: MOVE_ID, videoStatus: 'ready' }
}

function payload(token: string): { aud?: string; sub?: string; time?: unknown } {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()) as {
    aud?: string
    sub?: string
    time?: unknown
  }
}

describe('locked Fit card posters', () => {
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
    state.rows = null
    state.error = null
    state.selects = 0
    state.columns = ''
    state.signedUrl = null
    state.storage = []
  })

  it('locked card data has a thumbnail poster and no playback token or video url', async () => {
    state.rows = [{
      id: MOVE_ID,
      status: 'published',
      video_status: 'ready',
      mux_playback_id: 'play-locked',
      thumbnail_time: 3.5,
    }]
    const videoToken = await generateFitMuxToken('play-locked')
    expect(videoToken).toEqual(expect.any(String))
    const dirty = {
      ...guide(),
      mux_playback_id: 'play-locked',
      token: videoToken,
      playbackId: 'play-locked',
      videoUrl: `https://stream.mux.com/play-locked.m3u8?token=${videoToken}`,
    } as FitMove
    const [card] = await attachLockedFitPosters([dirty])
    const json = JSON.stringify(card)
    expect(json).not.toContain(videoToken)
    expect(json).not.toContain('stream.mux.com')
    expect(json).not.toContain('.m3u8')
    expect(card).not.toHaveProperty('mux_playback_id')
    expect(card).not.toHaveProperty('mux_asset_id')
    expect(card).not.toHaveProperty('token')
    expect(card).not.toHaveProperty('thumbnailToken')
    expect(card).not.toHaveProperty('playbackId')
    expect(card).not.toHaveProperty('playbackToken')
    expect(card).not.toHaveProperty('videoUrl')
    expect(card?.posterUrl).toMatch(
      /^https:\/\/image\.mux\.com\/play-locked\/thumbnail\.jpg\?token=/,
    )
    const thumb = new URL(card!.posterUrl!).searchParams.get('token')
    const claims = payload(thumb!)
    expect(claims.aud).toBe('t')
    expect(claims.sub).toBe('play-locked')
    expect(claims.time).toBe('3.5')
    expect(state.columns).toContain('thumbnail_time')
    expect(state.columns).toContain('thumbnail_url')
    expect(state.columns).toContain('mux_playback_id')
  })

  it('signs thumbnail posters for viewers who can play, still without a video token', async () => {
    state.rows = [{
      id: MOVE_ID,
      status: 'published',
      video_status: 'ready',
      mux_playback_id: 'play-locked',
      thumbnail_time: 3.5,
    }]
    const videoToken = await generateFitMuxToken('play-locked')
    const vip = await fitMovesForViewer([guide()], 'vip')
    const pro = await fitMovesForViewer([guide()], 'pro')
    expect(state.selects).toBe(2)
    const vipPoster = vip[0]?.posterUrl
    expect(vipPoster).toMatch(/^https:\/\/image\.mux\.com\/play-locked\/thumbnail\.jpg\?token=/)
    expect(pro[0]?.posterUrl).toMatch(/^https:\/\/image\.mux\.com\/play-locked\/thumbnail\.jpg\?token=/)
    const claims = payload(new URL(vipPoster!).searchParams.get('token')!)
    expect(claims.aud).toBe('t')
    expect(claims.sub).toBe('play-locked')
    expect(JSON.stringify(vip)).not.toContain(videoToken)
    expect(JSON.stringify(vip)).not.toContain('.m3u8')
    expect(vip[0]).not.toHaveProperty('mux_playback_id')
  })

  it('signs thumbnail posters for logged-out and community viewers', async () => {
    state.rows = [{
      id: MOVE_ID,
      status: 'published',
      video_status: 'ready',
      mux_playback_id: 'play-locked',
      thumbnail_time: null,
    }]
    const loggedOut = await fitMovesForViewer([guide()], null)
    expect(state.selects).toBe(1)
    const token = new URL(loggedOut[0]!.posterUrl!).searchParams.get('token')
    const claims = payload(token!)
    expect(claims.aud).toBe('t')
    expect(claims.time).toBeUndefined()

    const community = await fitMovesForViewer([guide()], 'community')
    expect(community[0]?.posterUrl).toEqual(expect.any(String))
    expect(JSON.stringify(community[0])).not.toContain('stream.mux.com')
  })

  it('falls back to no poster when the lookup fails or the video is not ready', async () => {
    state.error = { message: 'column thumbnail_time does not exist' }
    const failed = await attachLockedFitPosters([guide()])
    expect(failed[0]?.posterUrl).toBeNull()
    expect(failed[0]).not.toHaveProperty('mux_playback_id')

    state.error = null
    state.rows = [{
      id: MOVE_ID,
      status: 'published',
      video_status: 'processing',
      mux_playback_id: 'play-locked',
      thumbnail_time: 3.5,
    }]
    const processing = await attachLockedFitPosters([guide()])
    expect(processing[0]?.posterUrl).toBeNull()
    expect(JSON.stringify(processing)).not.toContain('play-locked')
  })

  it('builds a signed storage URL when Mux signing is unavailable and never returns the relative path', async () => {
    state.rows = [{
      id: MOVE_ID,
      status: 'published',
      video_status: 'ready',
      mux_playback_id: null,
      thumbnail_time: 3.5,
      thumbnail_url: 'fit-media/FO55-035/poster-1920x1080.png',
    }]
    state.signedUrl =
      'https://abc.supabase.co/storage/v1/object/sign/fit-media/FO55-035/poster-1920x1080.png?token=poster'
    const [card] = await attachLockedFitPosters([guide()])
    expect(card?.posterUrl).toBe(state.signedUrl)
    expect(card?.posterUrl).not.toBe('fit-media/FO55-035/poster-1920x1080.png')
    expect(state.storage).toEqual([{
      bucket: 'fit-media',
      key: 'FO55-035/poster-1920x1080.png',
      expiresIn: FIT_STORAGE_POSTER_TTL_SECONDS,
    }])
    expect(JSON.stringify(card)).not.toContain('.m3u8')

    state.signedUrl = null
    const [missing] = await attachLockedFitPosters([guide()])
    expect(missing?.posterUrl).toBeNull()
    expect(JSON.stringify(missing)).not.toContain('fit-media/FO55-035')
  })

  it('rejects a playback token or a video url as a poster', async () => {
    const videoToken = await generateFitMuxToken('play-locked')
    expect(publicFitPosterUrl(
      `https://image.mux.com/play-locked/thumbnail.jpg?token=${videoToken}`,
    )).toBeNull()
    expect(publicFitPosterUrl('https://stream.mux.com/play-locked.m3u8?token=abc')).toBeNull()
    expect(publicFitPosterUrl('https://image.mux.com/play-locked/thumbnail.jpg')).toBeNull()
  })
})

describe('107 thumbnail_time migration', () => {
  const sql = readFileSync(
    resolve(__dirname, '../../../../supabase/migrations/107_fit_moves_thumbnail_time.sql'),
    'utf8',
  )

  it('adds thumbnail_time and documents the rollback without seeding', () => {
    expect(sql).toMatch(/ALTER TABLE public\.fit_moves ADD COLUMN thumbnail_time numeric;/)
    expect(sql).toMatch(/ALTER TABLE public\.fit_moves DROP COLUMN IF EXISTS thumbnail_time;/)
    expect(sql).not.toContain('3.5')
    expect(sql).not.toMatch(/\bUPDATE\b/i)
    expect(sql).not.toMatch(/\bINSERT\b/i)
    expect(sql).not.toContain('mux_playback_id')
  })
})

describe('Fit poster wiring', () => {
  it('keeps thumbnail signing off the playback signer and on the fit page', () => {
    const posters = readFileSync(resolve(__dirname, './posters.ts'), 'utf8')
    const page = readFileSync(resolve(__dirname, '../../app/(public)/fit/page.tsx'), 'utf8')
    const player = readFileSync(resolve(__dirname, '../../components/fit/FitMuxPlayer.tsx'), 'utf8')
    expect(posters).toContain('generateFitMuxThumbnailToken')
    expect(posters).not.toMatch(/generateFitMuxToken\(/)
    expect(page).toContain('fitMovesForViewer')
    expect(player).toContain('thumbnail: playback.thumbnailToken')
    expect(player).not.toMatch(/thumbnailTime/)
    expect(player).toContain('playsInline')
    expect(player).toContain('fitPreferPlayback')
  })
})
