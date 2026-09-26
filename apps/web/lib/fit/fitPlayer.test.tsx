import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { FitLibrary } from '@/components/fit/FitLibrary'
import { FitTeaseCard } from '@/components/fit/FitTeaseCard'
import { FIT_LOCKED_BAR, FIT_UPGRADE_CTA, FIT_VIDEO_PROCESSING } from '@/lib/fit/copy'
import { featuredFitMove, type FitMove } from '@/lib/fit/moves'

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

  it('keeps the token URL inside the player component', () => {
    const src = readFileSync(resolve(__dirname, '../../components/fit/FitMuxPlayer.tsx'), 'utf8')
    expect(src).toContain('/api/fit/')
    expect(src).toContain('/mux-token')
    expect(src).not.toContain('mux_playback_id')
  })
})
