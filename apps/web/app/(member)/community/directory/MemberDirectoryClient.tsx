'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { MemberBadge } from '@/components/ui/MemberBadge'
import type { MemberSummary } from '@/lib/community/types'
import { getAvatarColor } from '@/lib/community/types'

type TierFilter = 'all' | 'pro' | 'community'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatJoinDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

type MemberWithDate = MemberSummary & { created_at?: string }

const FILTER_OPTIONS: { key: TierFilter; label: string }[] = [
  { key: 'all', label: 'All Members' },
  { key: 'pro', label: 'Pro' },
  { key: 'community', label: 'Community' },
]

export function MemberDirectoryClient() {
  const [members, setMembers] = useState<MemberWithDate[]>([])
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
      const data = (await res.json()) as { members: MemberWithDate[]; hasMore: boolean }
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
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [search, tierFilter, fetchMembers])

  return (
    <div className="p-6 space-y-5">
      {/* Page header */}
      <div>
        <h1
          className="font-display font-bold text-white mb-1"
          style={{ fontSize: '26px' }}
        >
          Member Directory
        </h1>
        <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Browse and connect with fellow Evolved Pros members.
        </p>
      </div>

      {/* Search + filters */}
      <div
        className="rounded-lg p-4 space-y-3"
        style={{ backgroundColor: '#112535' }}
      >
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or title…"
          className="w-full px-3 py-2.5 rounded font-body text-sm placeholder:text-[#7a8a96] focus:outline-none transition-colors"
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'white',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#68a2b9')}
          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
        />
        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setTierFilter(opt.key)}
              className="font-condensed font-semibold uppercase tracking-wide text-xs rounded-full px-3 py-1 transition-all"
              style={
                tierFilter === opt.key
                  ? { backgroundColor: '#68a2b9', color: '#0d1c27' }
                  : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading && members.length === 0 ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin h-6 w-6" style={{ color: '#7a8a96' }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : members.length === 0 ? (
        <div
          className="rounded-lg p-12 text-center"
          style={{ backgroundColor: '#112535' }}
        >
          <p className="font-condensed font-bold uppercase tracking-widest text-xs" style={{ color: '#7a8a96' }}>
            No members found
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {members.map(member => {
              const avatarBg = getAvatarColor(member.id)
              return (
                <Link
                  key={member.id}
                  href={`/profile/${member.id}`}
                  className="group rounded-lg overflow-hidden transition-all hover:scale-[1.02]"
                  style={{
                    backgroundColor: '#112535',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Card top accent */}
                  <div
                    className="h-1 w-full"
                    style={{
                      backgroundColor: member.tier === 'pro' ? '#ef0e30' : '#68a2b9',
                    }}
                  />

                  <div className="p-4">
                    {/* Avatar + badge row */}
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-14 h-14 rounded flex-shrink-0 flex items-center justify-center overflow-hidden"
                        style={{ backgroundColor: avatarBg }}
                      >
                        {member.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={member.avatarUrl}
                            alt={member.displayName}
                            className="w-14 h-14 object-cover"
                          />
                        ) : (
                          <span className="font-condensed font-bold text-white text-lg">
                            {getInitials(member.displayName)}
                          </span>
                        )}
                      </div>
                      {member.tier && (
                        <MemberBadge tier={member.tier} size="sm" />
                      )}
                    </div>

                    {/* Name */}
                    <h3
                      className="font-body font-semibold text-white text-[15px] leading-snug mb-0.5 group-hover:text-[#68a2b9] transition-colors"
                    >
                      {member.displayName}
                    </h3>

                    {/* Title */}
                    {member.roleTitle && (
                      <p
                        className="font-condensed font-semibold uppercase tracking-wide text-[10px] mb-3 truncate"
                        style={{ color: '#68a2b9' }}
                      >
                        {member.roleTitle}
                      </p>
                    )}

                    {/* Stats row */}
                    <div
                      className="flex items-center justify-between pt-3"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div>
                        <p
                          className="font-display font-bold text-white text-sm leading-none"
                        >
                          {member.points.toLocaleString()}
                        </p>
                        <p
                          className="font-condensed uppercase tracking-widest text-[8px] mt-0.5"
                          style={{ color: 'rgba(255,255,255,0.35)' }}
                        >
                          Points
                        </p>
                      </div>
                      {member.created_at && (
                        <div className="text-right">
                          <p
                            className="font-condensed text-[10px]"
                            style={{ color: 'rgba(255,255,255,0.35)' }}
                          >
                            Joined {formatJoinDate(member.created_at)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {hasMore && !loading && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => fetchMembers(search, tierFilter, false)}
                className="font-condensed font-semibold text-xs uppercase tracking-widest px-5 py-2.5 rounded transition-colors"
                style={{
                  backgroundColor: 'rgba(104,162,185,0.15)',
                  color: '#68a2b9',
                  border: '1px solid rgba(104,162,185,0.3)',
                }}
              >
                Load More
              </button>
            </div>
          )}

          {loading && members.length > 0 && (
            <div className="flex justify-center py-4">
              <svg className="animate-spin h-5 w-5" style={{ color: '#7a8a96' }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
        </>
      )}
    </div>
  )
}
