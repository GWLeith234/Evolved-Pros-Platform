import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { FitLibrary } from '@/components/fit/FitLibrary'
import { FitMarketing } from '@/components/fit/FitMarketing'
import { FitTeaseCard } from '@/components/fit/FitTeaseCard'
import { FIT_JOIN_CTA, FIT_LOCKED_BAR, FIT_UPGRADE_CTA, FIT_VIDEO_PROCESSING } from '@/lib/fit/copy'
import { fitJoinHref, fitUpgradeHref } from '@/lib/fit/gating'
import { featuredFitMove, FIT_MOVES, publishedFitMoves, type FitMove } from '@/lib/fit/moves'

function readyMove(): FitMove {
  return { ...featuredFitMove(), videoStatus: 'ready', description: 'Plain guide copy.' }
}

describe('Fit player gating in the UI', () => {
  it('shows the locked upsell and does not mount the player for a locked guide', () => {
    const html = renderToStaticMarkup(<FitTeaseCard move={readyMove()} locked />)
    expect(html).toContain(FIT_LOCKED_BAR)
    expect(html).toContain(FIT_UPGRADE_CTA)
    expect(html).not.toContain('ep-fit-player-stage--video')
    expect(html).not.toContain('/mux-token')
    expect(html).not.toContain('Plain guide copy.')
    expect(html).toContain('class="ep-fit-play"')
    expect(html).not.toContain('ep-fit-poster')
  })

  it('replaces the shared play icon with that move poster and no video url', () => {
    const poster = 'https://image.mux.com/play-locked/thumbnail.jpg?token=thumb-only'
    const html = renderToStaticMarkup(
      <FitTeaseCard move={{ ...readyMove(), posterUrl: poster }} locked />,
    )
    expect(html).toContain('ep-fit-poster')
    expect(html).toContain(poster)
    expect(html).not.toContain('class="ep-fit-play"')
    expect(html).not.toContain('stream.mux.com')
    expect(html).not.toContain('.m3u8')
    expect(html).not.toContain('/mux-token')
    expect(html).not.toContain('ep-fit-player-stage--video')
  })

  it('mounts the player only when the guide is unlocked and ready', () => {
    const html = renderToStaticMarkup(<FitTeaseCard move={readyMove()} locked={false} />)
    expect(html).toContain('ep-fit-player-stage--video')
    expect(html).toContain('Plain guide copy.')
    expect(html).not.toContain(FIT_UPGRADE_CTA)
  })

  it('does not request a token from the library unless playback is allowed', () => {
    const move = readyMove()
    const locked = renderToStaticMarkup(<FitLibrary moves={[move]} />)
    const open = renderToStaticMarkup(<FitLibrary moves={[move]} canPlay />)
    expect(locked).not.toContain('ep-fit-library-player')
    expect(open).toContain('ep-fit-library-player')
    const processing = renderToStaticMarkup(
      <FitLibrary moves={[{ ...move, videoStatus: 'processing' }]} canPlay />,
    )
    expect(processing).toContain(FIT_VIDEO_PROCESSING)
    expect(processing).not.toContain('ep-fit-library-player')
  })

  it('shows a stored poster on a locked library card and does not mount the player', () => {
    const poster = 'https://image.mux.com/play-locked/thumbnail.jpg?token=thumb-only'
    const html = renderToStaticMarkup(
      <FitLibrary moves={[{ ...readyMove(), posterUrl: poster }]} />,
    )
    expect(html).toContain('ep-fit-poster')
    expect(html).toContain(poster)
    expect(html).not.toContain('/mux-token')
  })

  it('keeps the token URL inside the player component', () => {
    const src = readFileSync(resolve(__dirname, '../../components/fit/FitMuxPlayer.tsx'), 'utf8')
    expect(src).toContain('/api/fit/')
    expect(src).toContain('/mux-token')
    expect(src).not.toContain('mux_playback_id')
    expect(src).toContain('playsInline')
    expect(src).toContain('preload="metadata"')
    expect(src).toContain('fitPreferPlayback')
    expect(src).not.toContain('muted')
    expect(src).not.toContain('autoPlay')
  })
})

function librarySection(html: string): string {
  const start = html.indexOf('class="ep-fit-library"')
  if (start === -1) return ''
  const end = html.indexOf('class="ep-fit-how"')
  return html.slice(start, end === -1 ? undefined : end).replace(/&amp;/g, '&')
}

const POSTER = 'https://image.mux.com/grid-locked/thumbnail.jpg?token=thumb-only'

function readyGuide(posterUrl: string | null = POSTER): FitMove {
  return {
    ...featuredFitMove(),
    videoStatus: 'ready',
    description: 'Plain guide copy.',
    posterUrl,
  }
}

function expectNoPlayback(library: string) {
  expect(library).not.toContain('mux-player')
  expect(library).not.toContain('/mux-token')
  expect(library).not.toContain('stream.mux.com')
  expect(library).not.toContain('.m3u8')
}

describe('Fit library grid for every visitor', () => {
  it('renders locked poster cards with a join CTA for logged-out visitors', () => {
    const move = readyGuide()
    const library = librarySection(
      renderToStaticMarkup(<FitMarketing viewerTier={null} signedIn={false} moves={[move]} />),
    )
    expect(library).toContain(move.title)
    expect(library).toContain(move.focus)
    expect(library).toContain(move.location)
    expect(library).toContain('ep-fit-poster')
    expect(library).toContain(POSTER)
    expect(library).toContain('ep-fit-lock-icon')
    expect(library).toContain(FIT_LOCKED_BAR)
    expect(library).toContain(FIT_JOIN_CTA)
    expect(library).toContain(fitJoinHref())
    expect(library).toContain('data-locked="true"')
    expect(library).not.toContain(FIT_UPGRADE_CTA)
    expectNoPlayback(library)
  })

  it('renders locked poster cards with an upgrade CTA for logged-in non-VIPs', () => {
    const move = readyGuide()
    const library = librarySection(
      renderToStaticMarkup(<FitMarketing viewerTier="community" signedIn moves={[move]} />),
    )
    expect(library).toContain(move.title)
    expect(library).toContain('ep-fit-poster')
    expect(library).toContain('ep-fit-lock-icon')
    expect(library).toContain(FIT_UPGRADE_CTA)
    expect(library).toContain(fitUpgradeHref())
    expect(library).not.toContain(FIT_JOIN_CTA)
    expect(library).not.toContain(fitJoinHref())
    expectNoPlayback(library)
  })

  it('treats a signed-in visitor with no tier as an upgrade, not a join', () => {
    const library = librarySection(
      renderToStaticMarkup(<FitMarketing viewerTier={null} signedIn moves={[readyGuide()]} />),
    )
    expect(library).toContain(FIT_UPGRADE_CTA)
    expect(library).toContain(fitUpgradeHref())
    expect(library).not.toContain(fitJoinHref())
  })

  it('keeps the base show rule: no grid for locked visitors when no guide has a poster', () => {
    const library = librarySection(
      renderToStaticMarkup(
        <FitMarketing viewerTier={null} signedIn={false} moves={[readyGuide(null)]} />,
      ),
    )
    expect(library).toBe('')
  })

  it('renders playable cards for VIP and does not lock them', () => {
    const move = readyGuide()
    const library = librarySection(
      renderToStaticMarkup(<FitMarketing viewerTier="vip" signedIn moves={[move]} />),
    )
    expect(library).toContain('data-locked="false"')
    expect(library).toContain('ep-fit-library-player')
    expect(library).toContain(move.title)
    expect(library).not.toContain('ep-fit-lock-icon')
    expect(library).not.toContain(FIT_JOIN_CTA)
    expect(library).not.toContain(FIT_UPGRADE_CTA)
    expect(library).not.toContain(FIT_LOCKED_BAR)
  })

  it('lists every published guide for a logged-out visitor and skips the rest', () => {
    const withPosters = FIT_MOVES.map(move => ({ ...move, posterUrl: POSTER }))
    const library = librarySection(
      renderToStaticMarkup(
        <FitMarketing viewerTier={null} signedIn={false} moves={withPosters} />,
      ),
    )
    const published = publishedFitMoves()
    expect(published.length).toBeGreaterThan(0)
    for (const move of published) {
      expect(library).toContain(move.title)
    }
    for (const move of FIT_MOVES) {
      if (move.status === 'published') continue
      expect(library).not.toContain(move.title)
    }
    expect(library).toContain('Hotel bench incline chest press')
    expectNoPlayback(library)
  })
})
