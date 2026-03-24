'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { getAvatarColor } from '@/lib/community/types'
import type { MemberSummary } from '@/lib/community/types'

interface MemberDirectoryModalProps {
  onClose: () => void
}

type TierFilter = 'all' | 'pro' | 'community'

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export function MemberDirectoryModal({ onClose }: MemberDirectoryModalProps) {
  const [members, setMembers] = useState<MemberSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<TierFilter>('all')
  const [hasMore, setHasMore] = useState(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchMembers = useCallback(async (q: string, tier: TierFilter, reset = true) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('search', q)
      if (tier !== 'all') params.set('tier', tier)
      const res = await fetch(`/api/members?${params}`)
      if (!res.ok) return
      const data = await res.json() as { members: MemberSummary[]; hasMore: boolean }
      setMembers(reset ? data.members : prev => [...prev, ...data.members])
      setHasMore(data.hasMore)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMembers('', 'all')
  }, [fetchMembers])

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      fetchMembers(search, tierFilter)
    }, 300)
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [search, tierFilter, fetchMembers])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const FILTER_OPTIONS: { key: TierFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pro', label: 'Pro' },
    { key: 'community', label: 'Community' },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(13,28,39,0.8)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-xl bg-white rounded-xl overflow-hidden flex flex-col"
        style={{ maxHeight: '80vh' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(27,60,90,0.08)' }}
        >
          <h2 className="font-display font-bold text-[#1b3c5a]" style={{ fontSize: '20px' }}>
            Member Directory
          </h2>
          <button
            onClick={onClose}
            className="text-[#7a8a96] hover:text-[#1b3c5a] transition-colors"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search + filter */}
        <div className="px-6 py-3 flex-shrink-0 space-y-3" style={{ borderBottom: '1px solid rgba(27,60,90,0.08)' }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search members…"
            className="w-full px-3 py-2.5 rounded border font-body text-sm text-[#1b3c5a] placeholder:text-[#7a8a96] focus:outline-none transition-colors"
            style={{ borderColor: 'rgba(27,60,90,0.2)' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#68a2b9')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(27,60,90,0.2)')}
          />
          <div className="flex items-center gap-2">
            {FILTER_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setTierFilter(opt.key)}
                className="font-condensed font-semibold uppercase tracking-wide text-xs rounded-full px-3 py-1 transition-all"
                style={
                  tierFilter === opt.key
                    ? { backgroundColor: '#1b3c5a', color: 'white' }
                    : { backgroundColor: 'rgba(27,60,90,0.06)', color: '#7a8a96' }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Member list */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          {loading && members.length === 0 ? (
            <div className="flex justify-center py-8">
              <svg className="animate-spin h-5 w-5 text-[#7a8a96]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : members.length === 0 ? (
            <p className="text-center py-8 font-condensed text-xs uppercase tracking-widest text-[#7a8a96]">
              No members found
            </p>
          ) : (
            members.map(member => {
              const avatarBg = getAvatarColor(member.id)
              const tierColor = member.tier === 'pro' ? '#c9a84c' : '#68a2b9'
              const tierBorder = member.tier === 'pro' ? 'rgba(201,168,76,0.3)' : 'rgba(104,162,185,0.3)'

              return (
                <Link
                  key={member.id}
                  href={`/profile/${member.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 py-3 group"
                  style={{ borderBottom: '1px solid rgba(27,60,90,0.06)' }}
                >
                  {/* Avatar */}
                  <div
                    className="w-11 h-11 rounded flex-shrink-0 flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: avatarBg }}
                  >
                    {member.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.avatarUrl} alt={member.displayName} className="w-11 h-11 object-cover" />
                    ) : (
                      <span className="font-condensed font-bold text-white text-sm">
                        {getInitials(member.displayName)}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-body font-semibold text-[14px] text-[#1b3c5a] group-hover:text-[#68a2b9] transition-colors">
                        {member.displayName}
                      </span>
                      {member.tier && (
                        <span
                          className="font-condensed font-bold uppercase text-[9px] rounded px-2 py-0.5"
                          style={{
                            color: tierColor,
                            border: `1px solid ${tierBorder}`,
                            backgroundColor: `${tierColor}15`,
                          }}
                        >
                          {member.tier === 'pro' ? 'Pro' : 'Community'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {member.roleTitle && (
                        <span className="font-condensed text-[11px] text-[#7a8a96] truncate">
                          {member.roleTitle}
                        </span>
                      )}
                      {member.location && (
                        <span className="font-condensed text-[11px] text-[#7a8a96]">
                          · {member.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Points */}
                  <div className="flex-shrink-0 text-right">
                    <p className="font-condensed font-bold text-[12px] text-[#1b3c5a]">
                      {member.points.toLocaleString()}
                    </p>
                    <p className="font-condensed text-[9px] uppercase text-[#7a8a96]">pts</p>
                  </div>
                </Link>
              )
            })
          )}

          {hasMore && !loading && (
            <div className="flex justify-center py-4">
              <button
                onClick={() => fetchMembers(search, tierFilter, false)}
                className="font-condensed font-semibold text-xs uppercase tracking-wide text-[#68a2b9] hover:underline"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
