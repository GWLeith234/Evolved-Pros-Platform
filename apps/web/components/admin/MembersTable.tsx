'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { getVendastaCrmUrl } from '@/lib/admin/utils'
import type { EngagementLevel } from '@/lib/admin/utils'

export interface MemberRow {
  id: string
  email: string
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
  pro:       { bg: 'rgba(201,168,76,0.1)',  color: '#a07c1e', border: 'rgba(201,168,76,0.3)' },
  community: { bg: 'rgba(27,60,90,0.06)',   color: '#1b3c5a', border: 'rgba(27,60,90,0.18)' },
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

const FILTERS = ['All', 'Pro', 'Community', 'Trial', 'Cancelled'] as const
type Filter = typeof FILTERS[number]

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}
function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export function MembersTable({ initialMembers }: { initialMembers: MemberRow[] }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('All')

  const filtered = useMemo(() => {
    let list = initialMembers
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(m =>
        (m.displayName ?? '').toLowerCase().includes(q) ||
        (m.fullName ?? '').toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q),
      )
    }
    if (filter === 'Pro')        list = list.filter(m => m.tier === 'pro')
    if (filter === 'Community')  list = list.filter(m => m.tier === 'community')
    if (filter === 'Trial')      list = list.filter(m => m.tierStatus === 'trial')
    if (filter === 'Cancelled')  list = list.filter(m => m.tierStatus === 'cancelled' || m.tierStatus === 'expired')
    return list
  }, [initialMembers, search, filter])

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search members…"
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
        <div className="flex items-center gap-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="font-condensed font-bold uppercase tracking-[0.1em] text-[10px] px-3 py-1.5 rounded transition-all"
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
        <span className="font-condensed text-[11px] text-[#7a8a96] ml-auto">
          {filtered.length} of {initialMembers.length}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(27,60,90,0.1)', backgroundColor: 'white' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(27,60,90,0.1)', backgroundColor: 'rgba(27,60,90,0.03)' }}>
              {['Member', 'Plan', 'Status', 'Joined', 'MRR', 'Engagement', 'Vendasta', ''].map(h => (
                <th
                  key={h}
                  className="px-4 py-3 text-left font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96]"
                >
                  {h}
                </th>
              ))}
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
                const name = m.displayName ?? m.fullName ?? m.email
                const tierStyle = TIER_COLORS[m.tier ?? ''] ?? TIER_COLORS.community
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
                          className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden text-white font-condensed font-bold text-[10px]"
                          style={{ backgroundColor: '#1b3c5a' }}
                        >
                          {m.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.avatarUrl} alt={name} className="w-7 h-7 rounded-full object-cover" />
                          ) : getInitials(name)}
                        </div>
                        <div>
                          <p className="font-body font-semibold text-[12px] text-[#112535] leading-tight">{name}</p>
                          <p className="font-condensed text-[10px] text-[#7a8a96]">{m.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3">
                      {m.tier ? (
                        <span
                          className="font-condensed font-bold uppercase text-[9px] px-2 py-0.5 rounded capitalize"
                          style={{ backgroundColor: tierStyle.bg, color: tierStyle.color, border: `1px solid ${tierStyle.border}` }}
                        >
                          {m.tier}
                        </span>
                      ) : (
                        <span className="font-condensed text-[10px] text-[#7a8a96]">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className="font-condensed font-bold uppercase text-[9px] px-2 py-0.5 rounded capitalize"
                        style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                      >
                        {m.tierStatus ?? 'unknown'}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3">
                      <span className="font-condensed text-[11px] text-[#7a8a96]">{fmtDate(m.joinedAt)}</span>
                    </td>

                    {/* MRR */}
                    <td className="px-4 py-3">
                      <span className="font-condensed font-bold text-[13px] text-[#1b3c5a]">
                        {m.mrr > 0 ? `$${m.mrr}` : '—'}
                      </span>
                    </td>

                    {/* Engagement */}
                    <td className="px-4 py-3">
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
                        <span className="font-condensed font-bold uppercase text-[9px]" style={{ color: engStyle.text }}>
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
                          className="font-condensed font-bold uppercase text-[9px] px-2 py-0.5 rounded transition-colors"
                          style={{
                            backgroundColor: 'rgba(104,162,185,0.08)',
                            color: '#68a2b9',
                            border: '1px solid rgba(104,162,185,0.2)',
                          }}
                        >
                          {m.vendastaContactId.slice(0, 10)}…
                        </a>
                      ) : (
                        <span className="font-condensed text-[10px] text-[#7a8a96]">Not linked</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/members/${m.id}`}
                        className="font-condensed font-semibold uppercase tracking-wide text-[10px] px-3 py-1.5 rounded transition-all"
                        style={{
                          color: '#1b3c5a',
                          border: '1px solid rgba(27,60,90,0.25)',
                        }}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
