import Link from 'next/link'
import {
  FIT_HIP_MOD_LABEL,
  FIT_LIBRARY_DEK,
  FIT_LIBRARY_EMPTY,
  FIT_LIBRARY_TITLE,
  FIT_LOCKED_BAR,
  FIT_VIDEO_PROCESSING,
  FIT_VIDEO_UNAVAILABLE,
} from '@/lib/fit/copy'
import { fitTeaseMeta, type FitMove } from '@/lib/fit/moves'
import { FitLockedPoster } from '@/components/fit/FitLockedPoster'
import { FitMuxPlayer } from '@/components/fit/FitMuxPlayer'

/**
 * Card chrome from PR 199, kept inline so globals.css stays untouched.
 * The li is still the grid item of .ep-fit-library-list (PR 206).
 */
const CARD_STYLE = {
  padding: 16,
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-color)',
  borderRadius: 18,
  minWidth: 0,
} as const

export type FitLibraryCta = {
  href: string
  label: string
}

export function FitLibrary({
  moves,
  canPlay = false,
  cta,
}: {
  moves: FitMove[]
  canPlay?: boolean
  cta?: FitLibraryCta
}) {
  return (
    <section className="ep-fit-library" aria-labelledby="fit-library-title">
      <p className="ep-fit-kicker">{FIT_LIBRARY_TITLE}</p>
      <h2 id="fit-library-title" className="ep-fit-section-title">
        {FIT_LIBRARY_DEK}
      </h2>
      {moves.length === 0 ? (
        <p className="ep-fit-tease-dek">{FIT_LIBRARY_EMPTY}</p>
      ) : (
        <ul className="ep-fit-library-list">
          {moves.map(move => (
            <FitLibraryCard key={move.id} move={move} canPlay={canPlay} cta={cta} />
          ))}
        </ul>
      )}
    </section>
  )
}

/**
 * One published guide in the library grid.
 * Playable (VIP) cards mount the player with the poster. Locked cards
 * add focus and location, show the signed poster image (or nothing when
 * there is no poster), a lock line, and the join or upgrade CTA. Locked
 * cards never mount the player, so they never request a playback token.
 */
export function FitLibraryCard({
  move,
  canPlay = false,
  cta,
}: {
  move: FitMove
  canPlay?: boolean
  cta?: FitLibraryCta
}) {
  const locked = !canPlay

  return (
    <li data-locked={locked ? 'true' : 'false'} style={CARD_STYLE}>
      <p className="ep-fit-library-code">{move.code}</p>
      <h3>{move.title}</h3>
      <p>{fitTeaseMeta(move)}</p>
      {locked ? (
        <>
          <p className="ep-fit-tease-meta">{move.focus}</p>
          <p className="ep-fit-tease-meta">{move.location}</p>
        </>
      ) : null}
      {move.description ? <p className="ep-fit-tease-dek">{move.description}</p> : null}
      {canPlay && move.videoStatus === 'ready' ? (
        <div className="ep-fit-library-player">
          <FitMuxPlayer moveId={move.id} title={move.title} poster={move.posterUrl} />
        </div>
      ) : move.posterUrl ? (
        <div className="ep-fit-library-player">
          <FitLockedPoster posterUrl={move.posterUrl} />
        </div>
      ) : null}
      {canPlay && move.videoStatus === 'processing' ? (
        <p className="ep-fit-player-note">{FIT_VIDEO_PROCESSING}</p>
      ) : null}
      {canPlay && move.videoStatus === 'errored' ? (
        <p className="ep-fit-player-note">{FIT_VIDEO_UNAVAILABLE}</p>
      ) : null}
      {move.hipMod && move.hipModNote ? (
        <p className="ep-fit-hip-chip">
          <span>{FIT_HIP_MOD_LABEL}</span>
          {move.hipModNote}
        </p>
      ) : null}
      {locked ? (
        <>
          <p className="ep-fit-unlocks" style={{ justifyContent: 'flex-start' }}>
            <span className="ep-fit-lock-icon" aria-hidden="true" />
            {FIT_LOCKED_BAR}
          </p>
          {cta ? (
            <Link href={cta.href} className="ep-fit-cta" style={{ marginTop: 12 }}>
              {cta.label}
            </Link>
          ) : null}
        </>
      ) : null}
    </li>
  )
}
