import {
  FIT_ARCHITECTURE_KICKER,
  FIT_ARCHITECTURE_LINE,
  FIT_GUIDES_EYEBROW,
} from '@/lib/fit/copy'
import { canAccessFitLibrary } from '@/lib/fit/gating'
import { teaseFitMoves } from '@/lib/fit/moves'
import { FitMastheadLockup, FitVipPill } from '@/components/fit/FitMasthead'
import { FitTeaseRotator } from '@/components/fit/FitTeaseRotator'

export function HomeFitTeaseBand({
  viewerTier,
}: {
  viewerTier: string | null | undefined
}) {
  const locked = !canAccessFitLibrary(viewerTier)
  const moves = teaseFitMoves()
  if (moves.length === 0) return null

  return (
    <section className="ep-fit-home" aria-label={FIT_GUIDES_EYEBROW}>
      <div className="ep-fit-home-card">
        <header className="ep-fit-home-head">
          <FitMastheadLockup compact />
          <FitVipPill />
        </header>
        <p className="ep-fit-arch">
          <span>{FIT_ARCHITECTURE_KICKER}</span>
          {FIT_ARCHITECTURE_LINE}
        </p>
        <FitTeaseRotator moves={moves} locked={locked} eyebrow={FIT_GUIDES_EYEBROW} />
      </div>
    </section>
  )
}
