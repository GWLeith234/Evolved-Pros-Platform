import {
  FIT_HIP_MOD_LABEL,
  FIT_LIBRARY_DEK,
  FIT_LIBRARY_EMPTY,
  FIT_LIBRARY_TITLE,
} from '@/lib/fit/copy'
import { fitTeaseMeta, type FitMove } from '@/lib/fit/moves'

export function FitLibrary({ moves }: { moves: FitMove[] }) {
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
            <li key={move.id}>
              <p className="ep-fit-library-code">{move.code}</p>
              <h3>{move.title}</h3>
              <p>{fitTeaseMeta(move)}</p>
              {move.hipMod && move.hipModNote ? (
                <p className="ep-fit-hip-chip">
                  <span>{FIT_HIP_MOD_LABEL}</span>
                  {move.hipModNote}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
