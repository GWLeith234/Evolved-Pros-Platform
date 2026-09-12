'use client'

import { useMemo, useState } from 'react'
import {
  FIT_ADMIN_DEK,
  FIT_ADMIN_EYEBROW,
  FIT_ADMIN_MOVES_LABEL,
  FIT_ADMIN_NEW,
  FIT_ADMIN_SYNC,
  FIT_ADMIN_TITLE,
  FIT_HIP_MOD_LABEL,
} from '@/lib/fit/copy'
import {
  FIT_MOVES,
  fitLibraryStats,
  formatFitAdminDate,
  type FitMove,
} from '@/lib/fit/moves'

export function FitAdminClient() {
  const [moves, setMoves] = useState<FitMove[]>(() => [...FIT_MOVES])
  const [flash, setFlash] = useState<string | null>(null)
  const stats = useMemo(() => fitLibraryStats(moves), [moves])

  function sync() {
    setMoves([...FIT_MOVES])
    setFlash('Library synced from fixtures. Apply 092_fit_moves.sql to persist.')
  }

  return (
    <div className="ep-fit-admin">
      <div className="ep-fit-admin-head">
        <div>
          <p>{FIT_ADMIN_EYEBROW}</p>
          <h1>{FIT_ADMIN_TITLE}</h1>
          <p style={{ marginTop: 8, textTransform: 'none', letterSpacing: 0 }}>{FIT_ADMIN_DEK}</p>
        </div>
        <div className="ep-fit-admin-actions">
          <button type="button" className="ep-fit-admin-btn" onClick={sync}>
            {FIT_ADMIN_SYNC}
          </button>
          <span className="ep-fit-admin-btn ep-fit-admin-btn--primary" aria-disabled="true">
            + {FIT_ADMIN_NEW}
          </span>
        </div>
      </div>

      {flash ? <p className="ep-fit-tease-dek">{flash}</p> : null}

      <div className="ep-fit-admin-stats">
        <div className="ep-fit-admin-stat">
          <strong>{stats.published}</strong>
          <span>Published</span>
        </div>
        <div className="ep-fit-admin-stat">
          <strong>{stats.pilot}</strong>
          <span>Pilot</span>
        </div>
        <div className="ep-fit-admin-stat">
          <strong>{stats.draft}</strong>
          <span>Draft</span>
        </div>
      </div>

      <div className="ep-fit-admin-table-wrap">
        <span className="ep-fit-admin-count">{stats.total} moves</span>
        <h2>{FIT_ADMIN_MOVES_LABEL}</h2>
        <table className="ep-fit-admin-table">
          <thead>
            <tr>
              {['Move', 'Code', 'Focus', 'Location', 'Status', 'Featured', 'Published', 'Edit'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {moves.map(move => (
              <tr key={move.id}>
                <td>
                  <span className="ep-fit-admin-move">{move.title}</span>
                  {move.hipMod ? <span className="ep-fit-admin-chip">{FIT_HIP_MOD_LABEL}</span> : null}
                </td>
                <td>{move.code}</td>
                <td>{move.focus}</td>
                <td>{move.location}</td>
                <td>
                  <span className={`ep-fit-admin-status ep-fit-admin-status--${move.status}`}>
                    {move.status}
                  </span>
                </td>
                <td>
                  <span
                    className={`ep-fit-admin-toggle${move.featured ? ' is-on' : ''}`}
                    aria-label={move.featured ? 'Featured' : 'Not featured'}
                  />
                </td>
                <td>{formatFitAdminDate(move.publishedAt)}</td>
                <td>
                  <span className="ep-fit-admin-edit">Edit</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
