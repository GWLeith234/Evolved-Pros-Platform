'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CRM_COLUMNS,
  CRM_STAGE_META,
  followUpLabel,
  formatMoney,
  formatShortDate,
  prospectValue,
  relativeContact,
  type CrmProspect,
  type CrmStage,
  type CrmStatus,
} from '@/lib/admin/crm'
import { CrmCard } from './CrmCard'
import { CrmProspectModal, type CrmSavePayload } from './CrmProspectModal'

type BoardData = Record<CrmStage, CrmProspect[]>
type ViewMode = 'board' | 'table'

function groupByStage(list: CrmProspect[]): BoardData {
  const empty: BoardData = {
    lead: [],
    prospect: [],
    community: [],
    vip: [],
    professional: [],
  }
  for (const p of list) {
    const stage = (p.stage in empty ? p.stage : 'lead') as CrmStage
    empty[stage].push(p)
  }
  return empty
}

interface CrmBoardProps {
  initialProspects: CrmProspect[]
}

export function CrmBoard({ initialProspects }: CrmBoardProps) {
  const [prospects, setProspects] = useState<CrmProspect[]>(initialProspects)
  const [dragging, setDragging] = useState<{ id: string; from: CrmStage } | null>(null)
  const [overStage, setOverStage] = useState<CrmStage | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CrmProspect | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [view, setView] = useState<ViewMode>('board')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return prospects
    return prospects.filter(
      p =>
        p.full_name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.company ?? '').toLowerCase().includes(q) ||
        (p.notes ?? '').toLowerCase().includes(q),
    )
  }, [prospects, query])

  const board = useMemo(() => groupByStage(filtered), [filtered])

  const pipelineMrr = useMemo(() => {
    return prospects.reduce((sum, p) => {
      if (p.status === 'lost') return sum
      return sum + prospectValue(p)
    }, 0)
  }, [prospects])

  const showFlash = (msg: string) => {
    setFlash(msg)
    window.setTimeout(() => setFlash(null), 2000)
  }

  const patchProspect = useCallback(
    async (id: string, body: Record<string, unknown>, optimistic?: Partial<CrmProspect>) => {
      setBusyId(id)
      const prev = prospects
      if (optimistic) {
        setProspects(list =>
          list.map(p => (p.id === id ? { ...p, ...optimistic, updated_at: new Date().toISOString() } : p)),
        )
      }
      try {
        const res = await fetch(`/api/admin/crm/prospects/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          setProspects(prev)
          const err = (await res.json().catch(() => ({}))) as { error?: string }
          showFlash(err.error ?? 'Update failed')
          return null
        }
        const json = (await res.json()) as { prospect: CrmProspect }
        setProspects(list => list.map(p => (p.id === id ? { ...p, ...json.prospect } : p)))
        return json.prospect
      } catch {
        setProspects(prev)
        showFlash('Network error')
        return null
      } finally {
        setBusyId(null)
      }
    },
    [prospects],
  )

  async function handleDrop(toStage: CrmStage) {
    if (!dragging) return
    const { id, from } = dragging
    setDragging(null)
    setOverStage(null)
    if (from === toStage) return

    await patchProspect(
      id,
      { stage: toStage },
      { stage: toStage, value_monthly: CRM_STAGE_META[toStage].mrr },
    )
    showFlash(`Moved to ${CRM_STAGE_META[toStage].label}`)
  }

  async function handleMarkContacted(id: string) {
    const result = await patchProspect(
      id,
      { mark_contacted: true, status: 'contacted' },
      {
        status: 'contacted' as CrmStatus,
        last_contacted_at: new Date().toISOString(),
      },
    )
    if (result) showFlash('Marked contacted')
  }

  async function handleUpgrade(id: string, to: CrmStage) {
    const result = await patchProspect(
      id,
      { stage: to, value_monthly: CRM_STAGE_META[to].mrr },
      { stage: to, value_monthly: CRM_STAGE_META[to].mrr },
    )
    if (result) showFlash(`Upgraded → ${CRM_STAGE_META[to].label}`)
  }

  async function handleSave(payload: CrmSavePayload) {
    if (payload.id) {
      const result = await patchProspect(payload.id, payload as unknown as Record<string, unknown>, payload)
      if (result) {
        setModalOpen(false)
        setEditing(null)
        showFlash('Prospect updated')
      }
      return
    }

    setBusyId('new')
    try {
      const res = await fetch('/api/admin/crm/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        showFlash(err.error ?? 'Create failed')
        return
      }
      const json = (await res.json()) as { prospect: CrmProspect }
      setProspects(list => [json.prospect, ...list])
      setModalOpen(false)
      setEditing(null)
      showFlash('Prospect added')
    } catch {
      showFlash('Network error')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id)
    const prev = prospects
    setProspects(list => list.filter(p => p.id !== id))
    try {
      const res = await fetch(`/api/admin/crm/prospects/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        setProspects(prev)
        showFlash('Delete failed')
        return
      }
      setModalOpen(false)
      setEditing(null)
      showFlash('Prospect removed')
    } catch {
      setProspects(prev)
      showFlash('Network error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      {/* Header controls */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1
            className="font-display font-black text-[28px]"
            style={{ color: '#112535', margin: 0 }}
          >
            Prospects CRM
          </h1>
          <p
            className="font-condensed text-[12px] mt-0.5"
            style={{ color: '#7a8a96', margin: 0 }}
          >
            Lead → Prospect → Community → VIP ($9) → Professional ($49) · drag to move stages
          </p>
          <p className="mt-1">
            <Link
              href="/admin/products"
              className="font-condensed font-bold uppercase text-[11px] tracking-wider"
              style={{ color: '#68a2b9', textDecoration: 'none' }}
            >
              Products & membership →
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {flash && (
            <span
              className="font-condensed font-bold uppercase text-[11px] tracking-wider px-3 py-1.5 rounded"
              style={{
                background: 'rgba(10,191,163,0.12)',
                color: '#0ABFA3',
                border: '1px solid rgba(10,191,163,0.28)',
              }}
            >
              {flash}
            </span>
          )}
          <div className="text-right hidden sm:block">
            <p
              className="font-condensed font-bold text-[10px] uppercase tracking-[0.16em]"
              style={{ color: '#7a8a96', margin: 0 }}
            >
              Pipeline value
            </p>
            <p className="font-display font-black text-[22px]" style={{ color: '#c9a84c', margin: 0 }}>
              ${pipelineMrr.toLocaleString('en-US')}/mo
            </p>
          </div>

          {/* View toggle */}
          <div
            className="inline-flex rounded overflow-hidden"
            style={{ border: '1px solid rgba(27,60,90,0.14)' }}
          >
            {(['board', 'table'] as ViewMode[]).map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className="font-condensed font-bold uppercase text-[11px] tracking-wider px-3 py-2"
                style={{
                  background: view === v ? '#1b3c5a' : '#fff',
                  color: view === v ? '#fff' : '#1b3c5a',
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: 40,
                }}
              >
                {v}
              </button>
            ))}
          </div>

          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search name, email…"
            className="font-body text-[13px] rounded px-3 py-2"
            style={{
              minWidth: 180,
              minHeight: 40,
              border: '1px solid var(--border-color, rgba(27,60,90,0.14))',
              background: '#fff',
              color: '#1b3c5a',
            }}
          />
          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
            className="font-condensed font-bold uppercase tracking-[0.12em] text-[12px] rounded px-4 py-2 transition-all"
            style={{ backgroundColor: '#1b3c5a', color: 'white', minHeight: 40 }}
          >
            + Add Prospect
          </button>
        </div>
      </div>

      {view === 'board' ? (
        <div
          className="crm-board-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(210px, 1fr))',
            gap: 12,
            minHeight: 420,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 8,
          }}
        >
          {CRM_COLUMNS.map(col => {
            const cards = board[col.stage]
            const isDropTarget = overStage === col.stage && dragging !== null
            const colValue = cards.reduce((s, p) => s + prospectValue(p), 0)
            return (
              <div
                key={col.stage}
                className="flex flex-col rounded-lg overflow-hidden min-w-[210px]"
                style={{
                  border: `1px solid ${isDropTarget ? col.accent : 'var(--border-color, rgba(27,60,90,0.10))'}`,
                  background: 'rgba(27,60,90,0.02)',
                  transition: 'border-color 120ms ease, background 120ms ease',
                }}
                onDragOver={e => {
                  e.preventDefault()
                  setOverStage(col.stage)
                }}
                onDragLeave={() => {
                  setOverStage(prev => (prev === col.stage ? null : prev))
                }}
                onDrop={() => void handleDrop(col.stage)}
              >
                <div
                  className="px-3 py-3 flex items-start justify-between gap-2 flex-shrink-0"
                  style={{
                    borderBottom: '1px solid var(--border-color, rgba(27,60,90,0.08))',
                    background: col.accentSoft,
                  }}
                >
                  <div className="min-w-0">
                    <p
                      className="font-condensed font-bold uppercase tracking-[0.14em] text-[11px]"
                      style={{ color: col.accent, margin: 0 }}
                    >
                      {col.label}
                    </p>
                    <p
                      className="font-condensed text-[11px] mt-0.5"
                      style={{ color: '#7a8a96', margin: 0 }}
                    >
                      {col.desc}
                      {colValue > 0 ? ` · $${colValue}/mo` : ''}
                    </p>
                  </div>
                  <span
                    className="font-condensed font-bold text-[11px] px-2 py-0.5 rounded min-w-[24px] text-center shrink-0"
                    style={{
                      background: '#fff',
                      color: col.accent,
                      border: `1px solid ${col.accent}33`,
                    }}
                  >
                    {cards.length}
                  </span>
                </div>

                <div
                  className="flex-1 p-2 overflow-y-auto"
                  style={{
                    minHeight: 240,
                    maxHeight: 'calc(100vh - 280px)',
                    background: isDropTarget ? `${col.accent}0A` : 'transparent',
                  }}
                >
                  {cards.length === 0 ? (
                    <p
                      className="font-condensed text-[11px] text-center mt-6"
                      style={{ color: '#7a8a96' }}
                    >
                      Drop cards here
                    </p>
                  ) : (
                    cards.map(p => (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={() => setDragging({ id: p.id, from: col.stage })}
                        onDragEnd={() => {
                          setDragging(null)
                          setOverStage(null)
                        }}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <CrmCard
                          prospect={p}
                          busy={busyId === p.id}
                          onMarkContacted={handleMarkContacted}
                          onUpgrade={handleUpgrade}
                          onEdit={pr => {
                            setEditing(pr)
                            setModalOpen(true)
                          }}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Table view with Stage · Value · Last Contacted · Next Follow-up columns */
        <div
          className="rounded-lg overflow-x-auto"
          style={{ background: '#fff', border: '1px solid rgba(27,60,90,0.10)' }}
        >
          <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 820 }}>
            <thead>
              <tr style={{ background: 'rgba(27,60,90,0.04)' }}>
                {['Name', 'Email', 'Stage', 'Value', 'Last Contacted', 'Next Follow-up', 'Actions'].map(h => (
                  <th
                    key={h}
                    className="font-condensed font-bold uppercase tracking-[0.12em] text-[10px] text-left px-3 py-3"
                    style={{ color: '#7a8a96', borderBottom: '1px solid rgba(27,60,90,0.08)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center font-condensed text-[12px]" style={{ color: '#7a8a96' }}>
                    No prospects match.
                  </td>
                </tr>
              ) : (
                filtered.map(p => {
                  const meta = CRM_STAGE_META[p.stage]
                  const val = prospectValue(p)
                  const follow = followUpLabel(p.next_follow_up_at)
                  return (
                    <tr key={p.id} style={{ opacity: busyId === p.id ? 0.5 : 1 }}>
                      <td className="px-3 py-2.5" style={{ borderBottom: '1px solid rgba(27,60,90,0.06)' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(p)
                            setModalOpen(true)
                          }}
                          className="font-body font-semibold text-[13px] text-left"
                          style={{ background: 'none', border: 'none', color: '#1b3c5a', cursor: 'pointer', padding: 0 }}
                        >
                          {p.full_name}
                        </button>
                        {p.company && (
                          <p className="font-condensed text-[11px] m-0" style={{ color: '#7a8a96' }}>{p.company}</p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-condensed text-[12px]" style={{ borderBottom: '1px solid rgba(27,60,90,0.06)', color: '#5a6a76' }}>
                        {p.email}
                      </td>
                      <td className="px-3 py-2.5" style={{ borderBottom: '1px solid rgba(27,60,90,0.06)' }}>
                        <span
                          className="font-condensed font-bold uppercase text-[10px] tracking-wider px-2 py-0.5 rounded"
                          style={{ background: meta.accentSoft, color: meta.accent }}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-condensed font-bold text-[13px]" style={{ borderBottom: '1px solid rgba(27,60,90,0.06)', color: val > 0 ? '#C9A84C' : '#7a8a96' }}>
                        {val === 0 ? 'Free' : `${formatMoney(val)}/mo`}
                      </td>
                      <td className="px-3 py-2.5 font-condensed text-[12px]" style={{ borderBottom: '1px solid rgba(27,60,90,0.06)', color: '#5a6a76' }}>
                        {relativeContact(p.last_contacted_at)}
                        {p.last_contacted_at && (
                          <span className="block text-[10px]" style={{ color: '#7a8a96' }}>{formatShortDate(p.last_contacted_at)}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-condensed text-[12px]" style={{ borderBottom: '1px solid rgba(27,60,90,0.06)', color: follow.overdue ? '#ef0e30' : '#5a6a76' }}>
                        {follow.text}
                      </td>
                      <td className="px-3 py-2.5" style={{ borderBottom: '1px solid rgba(27,60,90,0.06)' }}>
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            className="crm-qa"
                            style={tableQa}
                            disabled={busyId === p.id}
                            onClick={() => void handleMarkContacted(p.id)}
                          >
                            Contacted
                          </button>
                          {p.stage === 'community' && (
                            <>
                              <button
                                type="button"
                                className="crm-qa"
                                style={{ ...tableQa, color: '#C9A84C', borderColor: 'rgba(201,168,76,0.4)' }}
                                disabled={busyId === p.id}
                                onClick={() => void handleUpgrade(p.id, 'vip')}
                              >
                                → VIP
                              </button>
                              <button
                                type="button"
                                className="crm-qa"
                                style={{ ...tableQa, color: '#C9302A', borderColor: 'rgba(201,48,42,0.35)' }}
                                disabled={busyId === p.id}
                                onClick={() => void handleUpgrade(p.id, 'professional')}
                              >
                                → Pro
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <CrmProspectModal
          prospect={editing}
          busy={busyId === 'new' || (editing != null && busyId === editing.id)}
          onClose={() => {
            setModalOpen(false)
            setEditing(null)
          }}
          onSave={handleSave}
          onDelete={editing ? () => void handleDelete(editing.id) : undefined}
        />
      )}
    </div>
  )
}

const tableQa: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 28,
  padding: '4px 8px',
  fontFamily: '"Barlow Condensed", sans-serif',
  fontWeight: 700,
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#68a2b9',
  background: 'transparent',
  border: '1px solid rgba(104,162,185,0.4)',
  borderRadius: 3,
  cursor: 'pointer',
}
