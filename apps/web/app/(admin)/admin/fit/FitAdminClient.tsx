'use client'

import { useMemo, useState } from 'react'
import {
  AdminButton,
  AdminChip,
  AdminMetricCard,
  AdminMetricRow,
  AdminPageHeader,
  AdminStatusChip,
  AdminTable,
  AdminTd,
  AdminTh,
  AdminToggle,
} from '@/components/admin/template'
import {
  FIT_ADMIN_DEK,
  FIT_ADMIN_DRAFT_HINT,
  FIT_ADMIN_MOVES_LABEL,
  FIT_ADMIN_NEW,
  FIT_ADMIN_PILOT_HINT,
  FIT_ADMIN_PUBLISHED_HINT,
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

const COLS = ['Move', 'Code', 'Focus', 'Location', 'Status', 'Featured', 'Published', 'Edit'] as const

export function FitAdminClient() {
  const [moves, setMoves] = useState<FitMove[]>(() => [...FIT_MOVES])
  const [flash, setFlash] = useState<string | null>(null)
  const stats = useMemo(() => fitLibraryStats(moves), [moves])

  function sync() {
    setMoves([...FIT_MOVES])
    setFlash('Library synced from fixtures. Apply 092_fit_moves.sql to persist.')
  }

  return (
    <div className="ep-admin-el-page">
      <AdminPageHeader
        title={FIT_ADMIN_TITLE}
        subline={FIT_ADMIN_DEK}
        secondary={
          <AdminButton type="button" onClick={sync}>
            {FIT_ADMIN_SYNC}
          </AdminButton>
        }
        primary={
          <AdminButton variant="primary" aria-disabled="true">
            + {FIT_ADMIN_NEW}
          </AdminButton>
        }
      />

      {flash ? <p className="ep-fit-tease-dek">{flash}</p> : null}

      <AdminMetricRow columns={3}>
        <AdminMetricCard label="Published" value={stats.published} hint={FIT_ADMIN_PUBLISHED_HINT} />
        <AdminMetricCard label="Pilot" value={stats.pilot} hint={FIT_ADMIN_PILOT_HINT} />
        <AdminMetricCard label="Draft" value={stats.draft} hint={FIT_ADMIN_DRAFT_HINT} />
      </AdminMetricRow>

      <AdminTable title={FIT_ADMIN_MOVES_LABEL} count={`${stats.total} moves`}>
        <thead>
          <tr>
            {COLS.map(h => (
              <AdminTh key={h}>{h}</AdminTh>
            ))}
          </tr>
        </thead>
        <tbody>
          {moves.map(move => (
            <tr key={move.id}>
              <AdminTd label="Move">
                <span className="ep-admin-el-move">{move.title}</span>
                {move.hipMod ? <AdminChip tone="gold">{FIT_HIP_MOD_LABEL}</AdminChip> : null}
              </AdminTd>
              <AdminTd label="Code">{move.code}</AdminTd>
              <AdminTd label="Focus">{move.focus}</AdminTd>
              <AdminTd label="Location">
                <AdminChip tone="data">{move.location}</AdminChip>
              </AdminTd>
              <AdminTd label="Status">
                <AdminStatusChip status={move.status} />
              </AdminTd>
              <AdminTd label="Featured">
                <AdminToggle on={move.featured} label={move.featured ? 'Featured' : 'Not featured'} />
              </AdminTd>
              <AdminTd label="Published">{formatFitAdminDate(move.publishedAt)}</AdminTd>
              <AdminTd label="Edit">
                <span className="ep-admin-el-edit">Edit</span>
              </AdminTd>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </div>
  )
}
