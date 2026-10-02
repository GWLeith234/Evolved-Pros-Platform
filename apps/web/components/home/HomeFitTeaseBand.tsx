import {
  FIT_ARCHITECTURE_KICKER,
  FIT_ARCHITECTURE_LINE,
  FIT_GUIDES_EYEBROW,
} from '@/lib/fit/copy'
import { canAccessFitLibrary } from '@/lib/fit/gating'
import { teaseFitMoves, type FitMove } from '@/lib/fit/moves'
import { FitMastheadLockup, FitVipPill } from '@/components/fit/FitMasthead'
import { FitTeaseRotator } from '@/components/fit/FitTeaseRotator'

export function HomeFitTeaseBand({
  viewerTier,
  moves,
}: {
  viewerTier: string | null | undefined
  /** Published guides with poster URLs. Omitted only in tests, which use fixtures. */
  moves?: readonly FitMove[]
}) {
  const locked = !canAccessFitLibrary(viewerTier)
  const pool = teaseFitMoves(moves)
  if (pool.length === 0) return null

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
        <FitTeaseRotator moves={pool} locked={locked} eyebrow={FIT_GUIDES_EYEBROW} />
      </div>
    </section>
  )
}
