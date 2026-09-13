'use client'

import Link from 'next/link'
import {
  FIT_FEATURED_EYEBROW,
  FIT_GUIDES_EYEBROW,
  FIT_HIP_MOD_LABEL,
  FIT_LOCKED_BAR,
  FIT_NEXT_LABEL,
  FIT_PHONE_FOOT,
  FIT_TEASE_DEK,
  FIT_UNLOCKS_LINE,
  FIT_UPGRADE_CTA,
} from '@/lib/fit/copy'
import { fitUpgradeHref } from '@/lib/fit/gating'
import { fitTeaseMeta, type FitMove } from '@/lib/fit/moves'

export function FitTeaseCard({
  move,
  locked,
  index,
  total,
  onNext,
  eyebrow = FIT_FEATURED_EYEBROW,
}: {
  move: FitMove
  locked: boolean
  index?: number
  total?: number
  onNext?: () => void
  eyebrow?: string
}) {
  const upgradeHref = fitUpgradeHref()
  const dots = typeof total === 'number' && total > 1 ? total : 0

  return (
    <article className="ep-fit-tease" aria-label={move.title}>
      <p className="ep-fit-kicker">{eyebrow}</p>

      <div className="ep-fit-player" data-locked={locked ? 'true' : 'false'}>
        <div className="ep-fit-player-chrome">
          <span>{move.code}</span>
          <span>{move.durationLabel}</span>
        </div>
        <div className="ep-fit-player-stage" aria-hidden="true">
          <span className="ep-fit-play" />
        </div>
        {locked ? (
          <p className="ep-fit-player-lock">
            <span className="ep-fit-lock-icon" aria-hidden="true" />
            {FIT_LOCKED_BAR}
          </p>
        ) : null}
      </div>

      <h3 className="ep-fit-tease-title">{move.title}</h3>
      <p className="ep-fit-tease-meta">{fitTeaseMeta(move)}</p>

      {move.hipMod && move.hipModNote ? (
        <p className="ep-fit-hip-chip">
          <span>{FIT_HIP_MOD_LABEL}</span>
          {move.hipModNote}
        </p>
      ) : null}

      <p className="ep-fit-tease-dek">{FIT_TEASE_DEK}</p>

      {locked ? (
        <>
          <Link href={upgradeHref} className="ep-fit-cta">
            {FIT_UPGRADE_CTA}
          </Link>
          <p className="ep-fit-unlocks">
            <span className="ep-fit-lock-icon" aria-hidden="true" />
            {FIT_UNLOCKS_LINE}
          </p>
        </>
      ) : (
        <p className="ep-fit-tease-dek">{FIT_GUIDES_EYEBROW}</p>
      )}

      {dots > 0 && onNext ? (
        <div className="ep-fit-pager">
          <div className="ep-fit-dots" role="tablist" aria-label={FIT_GUIDES_EYEBROW}>
            {Array.from({ length: dots }, (_, i) => (
              <span
                key={i}
                className={i === (index ?? 0) ? 'is-on' : undefined}
                aria-current={i === (index ?? 0) ? 'true' : undefined}
              />
            ))}
          </div>
          <button type="button" className="ep-fit-next" onClick={onNext}>
            <span>{FIT_NEXT_LABEL}</span>
            <span aria-hidden="true">›</span>
          </button>
        </div>
      ) : null}

      <p className="ep-fit-phone-foot">
        <span className="ep-fit-lock-icon" aria-hidden="true" />
        {FIT_PHONE_FOOT}
      </p>
    </article>
  )
}
