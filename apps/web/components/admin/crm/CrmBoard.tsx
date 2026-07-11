'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  CRM_COLUMNS,
  CRM_STAGE_META,
  followUpLabel,
  formatMoney,
  formatShortDate,
  parseProspectsCsv,
  prospectsToCsv,
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
type FollowFilter = 'all' | 'overdue' | 'today' | 'week'

const FOLLOW_FILTERS: { key: FollowFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'today', label: 'Due today' },
  { key: 'week', label: 'This week' },
]

/** Bucket a follow-up date relative to the start of today. */
function followBucket(iso: string | null): 'none' | 'overdue' | 'today' | 'soon' {
  if (!iso) return 'none'
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return 'none'
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const days = Math.ceil((t - start.getTime()) / 86_400_000)
  if (days < 0) return 'overdue'
  if (days === 0) return 'today'
  if (days <= 7) return 'soon'
  return 'none'
}

function matchesFollowFilter(p: CrmProspect, f: FollowFilter): boolean {
  if (f === 'all') return true
  const b = followBucket(p.next_follow_up_at)
  if (f === 'overdue') return b === 'overdue'
  if (f === 'today') return b === 'today'
  // "This week" = anything needing attention now through the next 7 days.
  return b === 'overdue' || b === 'today' || b === 'soon'
}

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
  const [followFilter, setFollowFilter] = useState<FollowFilter>('all')
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return prospects.filter(p => {
      if (!matchesFollowFilter(p, followFilter)) return false
      if (!q) return true
      return (
        p.full_name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.company ?? '').toLowerCase().includes(q) ||
        (p.notes ?? '').toLowerCase().includes(q)
      )
    })
  }, [prospects, query, followFilter])

  const board = useMemo(() => groupByStage(filtered), [filtered])

  const pipelineMrr = useMemo(() => {
    return prospects.reduce((sum, p) => {
      if (p.status === 'lost') return sum
      return sum + prospectValue(p)
    }, 0)
  }, [prospects])

  // Count of prospects needing follow-up attention now (overdue + due today) —
  // powers the "Overdue" chip badge so the admin sees the daily work at a glance.
  const followCounts = useMemo(() => {
    let overdue = 0, today = 0
    for (const p of prospects) {
      const b = followBucket(p.next_follow_up_at)
      if (b === 'overdue') overdue++
      else if (b === 'today') today++
    }
    return { overdue, today }
  }, [prospects])

  const showFlash = (msg: string) => {
    setFlash(msg)
    window.setTimeout(() => setFlash(null), 3000)
  }

  function handleExportCsv() {
    const csv = prospectsToCsv(prospects)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `evolved-pros-crm-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    showFlash(`Exported ${prospects.length} prospect${prospects.length === 1 ? '' : 's'}`)
  }

  async function handleImportCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-importing the same filename
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const { rows, skipped, error } = parseProspectsCsv(text)
      if (error) { showFlash(error); return }
      if (rows.length === 0) { showFlash(`No valid rows found${skipped ? ` (${skipped} skipped)` : ''}`); return }
      const res = await fetch('/api/admin/crm/prospects/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      const json = (await res.json().catch(() => ({}))) as {
        inserted?: number; skipped?: number; prospects?: CrmProspect[]; error?: string
      }
      if (!res.ok) { showFlash(json.error ?? 'Import failed'); return }
      if (json.prospects?.length) setProspects(list => [...json.prospects!, ...list])
      const totalSkipped = skipped + (json.skipped ?? 0)
      showFlash(
        `Imported ${json.inserted ?? 0} lead${json.inserted === 1 ? '' : 's'}` +
          (totalSkipped ? ` · ${totalSkipped} skipped` : ''),
      )
    } catch {
      showFlash('Import error — check the CSV format')
    } finally {
      setImporting(false)
    }
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
            style={{ color: 'var(--text-primary, #112535)', margin: 0 }}
          >
            Prospects CRM
          </h1>
          <p
            className="font-condensed text-[12px] mt-0.5"
            style={{ color: 'var(--text-tertiary, #7a8a96)', margin: 0 }}
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
              style={{ color: 'var(--text-tertiary, #7a8a96)', margin: 0 }}
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
              background: 'var(--bg-surface, #fff)',
              color: 'var(--text-primary, #1b3c5a)',
            }}
          />
          {/* CSV export + import (import loads rows into the Lead stage) */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="font-condensed font-bold uppercase tracking-[0.12em] text-[12px] rounded px-3 py-2 transition-all"
            style={{
              background: 'var(--bg-surface, #fff)',
              color: '#1b3c5a',
              border: '1px solid rgba(27,60,90,0.22)',
              minHeight: 40,
            }}
            title="Download all prospects as CSV"
          >
            ↓ Export
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="font-condensed font-bold uppercase tracking-[0.12em] text-[12px] rounded px-3 py-2 transition-all"
            style={{
              background: 'var(--bg-surface, #fff)',
              color: '#0ABFA3',
              border: '1px solid rgba(10,191,163,0.4)',
              minHeight: 40,
              cursor: importing ? 'wait' : 'pointer',
              opacity: importing ? 0.6 : 1,
            }}
            title="Import a CSV of leads (name, email required) into the Lead stage"
          >
            {importing ? 'Importing…' : '↑ Import CSV → Lead'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleImportCsv}
            style={{ display: 'none' }}
            aria-hidden="true"
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

      {/* Follow-up quick-filters — triage the pipeline by what needs attention. */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span
          className="font-condensed font-bold uppercase tracking-[0.16em] text-[10px]"
          style={{ color: 'var(--text-tertiary, #7a8a96)' }}
        >
          Follow-up
        </span>
        {FOLLOW_FILTERS.map(f => {
          const active = followFilter === f.key
          const badge = f.key === 'overdue' ? followCounts.overdue : f.key === 'today' ? followCounts.today : 0
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFollowFilter(f.key)}
              className="font-condensed font-bold uppercase tracking-[0.1em] text-[11px] rounded-full px-3 py-1.5 transition-all inline-flex items-center gap-1.5"
              style={{
                background: active ? '#1b3c5a' : 'var(--bg-surface, #fff)',
                color: active ? '#fff' : 'var(--text-secondary, #5a6a76)',
                border: `1px solid ${active ? '#1b3c5a' : 'rgba(27,60,90,0.18)'}`,
                cursor: 'pointer',
                minHeight: 32,
              }}
            >
              {f.label}
              {badge > 0 && (
                <span
                  className="text-[10px] rounded-full px-1.5"
                  style={{
                    background: active ? 'rgba(255,255,255,0.22)' : 'rgba(239,14,48,0.12)',
                    color: active ? '#fff' : '#ef0e30',
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
          )
        })}
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
                  background: 'var(--bg-elevated, rgba(27,60,90,0.02))',
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
                      style={{ color: 'var(--text-tertiary, #7a8a96)', margin: 0 }}
                    >
                      {col.desc}
                    </p>
                    {/* Per-column pipeline stat: value/mo · deal count */}
                    <p
                      className="font-condensed font-bold text-[11px] mt-1"
                      style={{ color: colValue > 0 ? '#c9a84c' : 'var(--text-tertiary, #7a8a96)', margin: 0 }}
                    >
                      {colValue > 0 ? `$${colValue}/mo · ` : ''}{cards.length} deal{cards.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span
                    className="font-condensed font-bold text-[11px] px-2 py-0.5 rounded min-w-[24px] text-center shrink-0"
                    style={{
                      background: 'var(--bg-surface, #fff)',
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
                      style={{ color: 'var(--text-tertiary, #7a8a96)' }}
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
