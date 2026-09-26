import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { publishedFitMoves } from './moves'
import {
  PUBLIC_FIT_MOVE_COLUMNS,
  resolvePublishedFitMoves,
  type FitMoveRow,
} from './rows'

function row(overrides: Partial<FitMoveRow> = {}): FitMoveRow {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    code: 'FO55-070',
    slug: 'db-wall-hinge',
    title: 'DB wall hinge',
    focus: 'Hinge, balance',
    location: 'Hotel',
    status: 'published',
    featured: true,
    hip_mod: true,
    hip_mod_note: 'Soft hinge',
    reps: '3 reps',
    duration_minutes: 2,
    duration_label: '~2 min',
    required_tier: 'vip',
    published_at: '2026-09-12',
    description: 'A short guide.',
    video_status: 'ready',
    ...overrides,
  }
}

describe('published fit_moves catalog', () => {
  it('does not select playback or asset ids', () => {
    const cols = PUBLIC_FIT_MOVE_COLUMNS.split(',').map(col => col.trim())
    expect(cols).not.toContain('mux_playback_id')
    expect(cols).not.toContain('mux_asset_id')
    expect(cols).toContain('video_status')
    expect(cols).toContain('description')
    expect(cols).toContain('status')
  })

  it('renders published table rows and drops playback ids', () => {
    const moves = resolvePublishedFitMoves({
      rows: [{ ...row(), mux_playback_id: 'secret-playback' } as FitMoveRow & { mux_playback_id: string }],
      error: null,
    })
    expect(moves).toHaveLength(1)
    expect(moves[0]?.code).toBe('FO55-070')
    expect(moves[0]?.videoStatus).toBe('ready')
    expect(moves[0]?.description).toBe('A short guide.')
    expect(JSON.stringify(moves)).not.toContain('secret-playback')
    expect(moves[0]).not.toHaveProperty('mux_playback_id')
    expect(moves[0]).not.toHaveProperty('mux_asset_id')
  })

  it('ignores draft and pilot rows', () => {
    const moves = resolvePublishedFitMoves({
      rows: [
        row({ id: 'draft-id', status: 'draft', code: 'FO55-071', slug: 'draft-move' }),
        row({ id: 'pilot-id', status: 'pilot', code: 'FO55-072', slug: 'pilot-move' }),
        row(),
      ],
      error: null,
    })
    expect(moves.map(move => move.status)).toEqual(['published'])
    expect(moves.map(move => move.code)).toEqual(['FO55-070'])
  })

  it('falls back to the fixture when the table is empty or the query errors', () => {
    const fixtures = publishedFitMoves()
    expect(resolvePublishedFitMoves({ rows: [], error: null }).map(move => move.code)).toEqual(
      fixtures.map(move => move.code),
    )
    expect(resolvePublishedFitMoves({ rows: null, error: 'relation fit_moves does not exist' })[0]?.code).toBe(
      'FO55-035',
    )
    expect(
      resolvePublishedFitMoves({
        rows: [row({ status: 'draft', code: 'FO55-071', slug: 'only-draft' })],
        error: null,
      }).map(move => move.code),
    ).toEqual(fixtures.map(move => move.code))
  })
})

describe('102 fit video migration', () => {
  const sql = readFileSync(
    resolve(__dirname, '../../../../supabase/migrations/102_fit_video_private.sql'),
    'utf8',
  )

  it('hides playback ids and keeps the fit-media bucket private', () => {
    expect(sql).toContain('REVOKE SELECT ON TABLE public.fit_moves FROM PUBLIC, anon, authenticated')
    const grantStart = sql.indexOf('GRANT SELECT (')
    const grantEnd = sql.indexOf(') ON public.fit_moves TO anon, authenticated')
    const grant = sql.slice(grantStart, grantEnd)
    expect(grant).not.toContain('mux_playback_id')
    expect(grant).not.toContain('mux_asset_id')
    expect(grant).toContain('video_status')
    expect(grant).toContain('description')
    expect(sql).toContain('GRANT ALL ON TABLE public.fit_moves TO service_role')
    expect(sql).toMatch(/'fit-media',\s*'fit-media',\s*false/)
    expect(sql).toContain("CHECK (video_status IN ('draft', 'processing', 'ready', 'errored'))")
    expect(sql).toContain('fit_moves_mux_asset_id_uidx')
    expect(sql).not.toMatch(/CREATE POLICY[\s\S]*TO anon/i)
    expect(sql).not.toMatch(/CREATE POLICY[\s\S]*TO authenticated/i)
    expect(sql).toContain('TO service_role')
  })
})
