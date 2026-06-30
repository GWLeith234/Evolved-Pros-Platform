'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { getVendastaCrmUrl } from '@/lib/admin/utils'
import type { EngagementLevel } from '@/lib/admin/utils'
import { AdminEditProfileModal } from './AdminEditProfileModal'

export interface MemberRow {
  id: string
  email: string | null
  displayName: string | null
  fullName: string | null
  avatarUrl: string | null
  tier: string | null
  tierStatus: string | null
  vendastaContactId: string | null
  points: number
  joinedAt: string
  mrr: number
  engagementLevel: EngagementLevel
  engagementScore: number
  postsLast30: number
  lessonsLast30: number
}

const TIER_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  pro:       { bg: 'rgba(201,48,42,0.1)',   color: '#C9302A', border: 'rgba(201,48,42,0.3)' },
  vip:       { bg: 'rgba(201,168,76,0.1)',  color: '#a07c1e', border: 'rgba(201,168,76,0.3)' },
}
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active:    { bg: 'rgba(34,197,94,0.08)',  color: '#15803d' },
  trial:     { bg: 'rgba(201,168,76,0.08)', color: '#92660b' },
  cancelled: { bg: 'rgba(239,14,48,0.08)',  color: '#ef0e30' },
  expired:   { bg: 'rgba(122,138,150,0.08)',color: '#7a8a96' },
}
const ENG_COLORS: Record<EngagementLevel, { bar: string; text: string }> = {
  High: { bar: '#68a2b9', text: '#1b3c5a' },
  Med:  { bar: '#c9a84c', text: '#7a6020' },
  Low:  { bar: '#cbd5e1', text: '#7a8a96' },
}

const FILTERS = ['All', 'Pro', 'VIP', 'Trial', 'Cancelled'] as const
type Filter = typeof FILTERS[number]

// Hydration-safe UTC formatter. toLocaleDateString() depends on the runtime's
// ICU data and timezone — Node and the browser disagreed on borderline rows
// and threw React #418/#425 hydration warnings. UTC + a fixed month table
// produces identical output everywhere.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function fmtDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
}
function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

// Prefer the full legal name when present (e.g. "Jubal Chetty") over the
// shorter displayName ("Jubal") so the admin list shows last names that exist
// in the DB. Falls back to displayName, then to the email local-part.
function resolveDisplayName(m: { fullName: string | null; displayName: string | null; email: string | null }): string {
  const full = m.fullName?.trim()
  if (full) return full
  const display = m.displayName?.trim()
  if (display) return display
  return m.email?.split('@')[0] ?? 'Member'
}

export function MembersTable({ initialMembers }: { initialMembers: MemberRow[] }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('All')
  const [members, setMembers] = useState<MemberRow[]>(initialMembers)
  const [editingMember, setEditingMember] = useState<MemberRow | null>(null)

  const filtered = useMemo(() => {
    let list = members
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(m =>
        (m.displayName ?? '').toLowerCase().includes(q) ||
        (m.fullName ?? '').toLowerCase().includes(q) ||
        (m.email ?? '').toLowerCase().includes(q),
      )
    }
    if (filter === 'Pro')  list = list.filter(m => m.tier === 'pro')
    if (filter === 'VIP')  list = list.filter(m => m.tier === 'vip')
    if (filter === 'Trial')      list = list.filter(m => m.tierStatus === 'trial')
    if (filter === 'Cancelled')  list = list.filter(m => m.tierStatus === 'cancelled' || m.tierStatus === 'expired')
    return list
  }, [members, search, filter])

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search name, email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="font-condensed text-[13px] rounded px-3 py-2 outline-none transition-all"
          style={{
            width: '260px',
            backgroundColor: 'white',
            border: '1px solid rgba(27,60,90,0.18)',
            color: '#112535',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#68a2b9')}
          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(27,60,90,0.18)')}
        />
        <div className="flex items-center gap-1 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="font-condensed font-bold uppercase tracking-[0.1em] text-[12px] px-3 py-1.5 rounded transition-all"
              style={{
                backgroundColor: filter === f ? '#1b3c5a' : 'rgba(27,60,90,0.05)',
                color: filter === f ? 'white' : '#7a8a96',
                border: filter === f ? '1px solid #1b3c5a' : '1px solid rgba(27,60,90,0.12)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="font-condensed text-[12px] text-[#7a8a96] ml-auto">
          {filtered.length} of {initialMembers.length}
        </span>
      </div>

      {/* Mobile: stacked card list (<768px). Desktop table below is hidden
          at that breakpoint. Keeps every column's data visible without
          horizontal scrolling on a 375px viewport. */}
      <div className="md:hidden rounded-lg overflow-hidden" style={{ border: '1px solid rgba(27,60,90,0.1)', backgroundColor: 'white' }}>
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center font-condensed text-[12px] text-[#7a8a96]">No members found.</p>
        ) : (
          filtered.map((m, i) => {
            const name = resolveDisplayName(m)
            const tierStyle = TIER_COLORS[m.tier ?? ''] ?? TIER_COLORS.vip
            const statusStyle = STATUS_COLORS[m.tierStatus ?? ''] ?? STATUS_COLORS.expired
            const engStyle = ENG_COLORS[m.engagementLevel]
            const engPct = Math.min(100, m.engagementScore * 10)
            return (
              <div
                key={m.id}
                className="p-4 flex flex-col gap-3"
                style={{ borderBottom: i === filtered.length - 1 ? 'none' : '1px solid rgba(27,60,90,0.08)' }}
              >
                {/* Row 1: avatar + name + email */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden text-white font-condensed font-bold text-[13px]"
                    style={{ backgroundColor: '#1b3c5a' }}
                  >
                    {m.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.avatarUrl} alt={name} className="w-10 h-10 rounded-full object-cover" />
                    ) : getInitials(name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-body font-semibold text-[14px] text-[#112535] leading-tight truncate">{name}</p>
                    <p className="font-condensed text-[12px] text-[#7a8a96] truncate">{m.email}</p>
                  </div>
                </div>

                {/* Row 2: Plan + Status + Joined */}
                <div className="flex items-center gap-2 flex-wrap">
                  {m.tier ? (
                    <span
                      className="font-condensed font-bold uppercase text-[12px] px-2 py-0.5 rounded"
                      style={{ backgroundColor: tierStyle.bg, color: tierStyle.color, border: `1px solid ${tierStyle.border}` }}
                    >
                      {m.tier.toUpperCase()}
                    </span>
                  ) : null}
                  <span
                    className="font-condensed font-bold uppercase text-[12px] px-2 py-0.5 rounded"
                    style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                  >
                    {(m.tierStatus ?? 'unknown').toUpperCase()}
                  </span>
                  <span className="font-condensed text-[12px] text-[#7a8a96] ml-auto">{fmtDate(m.joinedAt)}</span>
                </div>

                {/* Row 3: MRR + Engagement */}
                <div className="flex items-center justify-between gap-3">
                  <span className="font-condensed font-bold text-[14px] text-[#1b3c5a]">
                    {m.mrr > 0 ? `$${m.mrr} MRR` : 'No MRR'}
                  </span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-[60px] h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'rgba(27,60,90,0.08)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${engPct}%`, backgroundColor: engStyle.bar }}
                      />
                    </div>
                    <span className="font-condensed font-bold uppercase text-[12px]" style={{ color: engStyle.text }}>
                      {m.engagementLevel}
                    </span>
                  </div>
                </div>

                {/* Row 4: Edit (full width) + View */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingMember(m)}
                    className="flex-1 font-condensed font-semibold uppercase tracking-wide text-[13px] px-3 py-2 rounded transition-all"
                    style={{ minHeight: 44, color: '#68a2b9', border: '1px solid rgba(104,162,185,0.3)' }}
                  >
                    Edit
                  </button>
                  <Link
                    href={`/admin/members/${m.id}`}
                    className="font-condensed font-semibold uppercase tracking-wide text-[13px] px-3 py-2 rounded transition-all inline-flex items-center justify-center"
                    style={{ minHeight: 44, color: '#1b3c5a', border: '1px solid rgba(27,60,90,0.25)' }}
                  >
                    View →
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop table (≥768px) */}
      <div className="hidden md:block rounded-lg overflow-x-auto" style={{ border: '1px solid rgba(27,60,90,0.1)', backgroundColor: 'white' }}>
        <table className="w-full min-w-[820px]">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(27,60,90,0.1)', backgroundColor: 'rgba(27,60,90,0.03)' }}>
              {['Member', 'Plan', 'Status', 'Joined', 'MRR', 'Engagement', 'Vendasta', ''].map(h => {
                const isActions = h === ''
                const isEngagement = h === 'Engagement'
                return (
                  <th
                    key={h}
                    className={`${isEngagement ? 'px-2' : 'px-4'} py-3 text-left font-condensed font-bold uppercase tracking-[0.18em] text-[12px] text-[#7a8a96]`}
                    style={isActions ? {
                      position: 'sticky',
                      right: 0,
                      backgroundColor: 'rgb(247,248,249)',
                      boxShadow: 'inset 1px 0 0 rgba(27,60,90,0.06)',
                    } : undefined}
                  >
                    {h}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center font-condensed text-[12px] text-[#7a8a96]">
                  No members found.
                </td>
              </tr>
            ) : (
              filtered.map((m, i) => {
                const name = resolveDisplayName(m)
                const tierStyle = TIER_COLORS[m.tier ?? ''] ?? TIER_COLORS.vip
                const statusStyle = STATUS_COLORS[m.tierStatus ?? ''] ?? STATUS_COLORS.expired
                const engStyle = ENG_COLORS[m.engagementLevel]
                const engPct = Math.min(100, m.engagementScore * 10)

                return (
                  <tr
                    key={m.id}
                    style={{ borderBottom: i === filtered.length - 1 ? 'none' : '1px solid rgba(27,60,90,0.06)' }}
                  >
                    {/* Member */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden text-white font-condensed font-bold text-[12px]"
                          style={{ backgroundColor: '#1b3c5a' }}
                        >
                          {m.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.avatarUrl} alt={name} className="w-7 h-7 rounded-full object-cover" />
                          ) : getInitials(name)}
                        </div>
                        <div>
                          <p className="font-body font-semibold text-[12px] text-[#112535] leading-tight">{name}</p>
                          <p className="font-condensed text-[12px] text-[#7a8a96]">{m.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3">
                      {m.tier ? (
                        <span
                          className="font-condensed font-bold uppercase text-[12px] px-2 py-0.5 rounded"
                          style={{ backgroundColor: tierStyle.bg, color: tierStyle.color, border: `1px solid ${tierStyle.border}` }}
                        >
                          {m.tier.toUpperCase()}
                        </span>
                      ) : (
                        <span className="font-condensed text-[12px] text-[#7a8a96]">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className="font-condensed font-bold uppercase text-[12px] px-2 py-0.5 rounded"
                        style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                      >
                        {(m.tierStatus ?? 'unknown').toUpperCase()}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3">
                      <span className="font-condensed text-[12px] text-[#7a8a96]">{fmtDate(m.joinedAt)}</span>
                    </td>

                    {/* MRR */}
                    <td className="px-4 py-3">
                      <span className="font-condensed font-bold text-[13px] text-[#1b3c5a]">
                        {m.mrr > 0 ? `$${m.mrr}` : '—'}
                      </span>
                    </td>

                    {/* Engagement — narrower bar + compact padding to free up
                        room for the Vendasta + Actions columns on 1280-1440px desktops. */}
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-[40px] h-1.5 rounded-full overflow-hidden"
                          style={{ backgroundColor: 'rgba(27,60,90,0.08)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${engPct}%`, backgroundColor: engStyle.bar }}
                          />
                        </div>
                        <span className="font-condensed font-bold uppercase text-[12px]" style={{ color: engStyle.text }}>
                          {m.engagementLevel}
                        </span>
                      </div>
                    </td>

                    {/* Vendasta */}
                    <td className="px-4 py-3">
                      {m.vendastaContactId ? (
                        <a
                          href={getVendastaCrmUrl(m.vendastaContactId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-condensed font-bold uppercase text-[12px] px-2 py-0.5 rounded transition-colors"
                          style={{
                            backgroundColor: 'rgba(104,162,185,0.08)',
                            color: '#68a2b9',
                            border: '1px solid rgba(104,162,185,0.2)',
                          }}
                        >
                          {m.vendastaContactId.slice(0, 10)}…
                        </a>
                      ) : (
                        <span className="font-condensed text-[12px] text-[#7a8a96]">Not linked</span>
                      )}
                    </td>

                    {/* Actions — sticky-right so Edit/View never clip on narrow desktops. */}
                    <td
                      className="px-4 py-3"
                      style={{
                        position: 'sticky',
                        right: 0,
                        backgroundColor: 'white',
                        boxShadow: 'inset 1px 0 0 rgba(27,60,90,0.06)',
                      }}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingMember(m)}
                          className="font-condensed font-semibold uppercase tracking-wide text-[12px] px-3 py-1.5 rounded transition-all"
                          style={{ color: '#68a2b9', border: '1px solid rgba(104,162,185,0.3)' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(104,162,185,0.06)')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          Edit
                        </button>
                        <Link
                          href={`/admin/members/${m.id}`}
                          className="font-condensed font-semibold uppercase tracking-wide text-[12px] px-3 py-1.5 rounded transition-all"
                          style={{ color: '#1b3c5a', border: '1px solid rgba(27,60,90,0.25)' }}
                        >
                          View →
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {editingMember && (
        <AdminEditProfileModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSaved={updated => {
            setMembers(prev => prev.map(m =>
              m.id === editingMember.id ? { ...m, ...updated } : m,
            ))
            setEditingMember(null)
          }}
        />
      )}
    </div>
  )
}
