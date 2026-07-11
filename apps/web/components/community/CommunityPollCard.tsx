'use client'

/**
 * Compact theme-aware poll for the community right rail.
 * Hits /api/polls/active (community first, media fallback) so members
 * can vote without leaving the feed — DAU interaction surface.
 */

import { useState, useEffect, useCallback } from 'react'

interface PollOption {
  id: string
  option_text: string
  display_order: number
}

interface Poll {
  id: string
  question: string
  status: string
  closes_at: string | null
  poll_options: PollOption[]
}

interface ActivePollResponse {
  poll: Poll | null
  voteCounts: Record<string, number>
  totalVotes: number
  userVoteOptionId: string | null
}

async function fetchActivePoll(): Promise<ActivePollResponse | null> {
  for (const context of ['community', 'media'] as const) {
    try {
      const res = await fetch(`/api/polls/active?context=${context}`)
      if (!res.ok) continue
      const data = (await res.json()) as ActivePollResponse
      if (data.poll) return data
    } catch {
      /* try next context */
    }
  }
  return null
}

export function CommunityPollCard() {
  const [loading, setLoading] = useState(true)
  const [poll, setPoll] = useState<Poll | null>(null)
  const [options, setOptions] = useState<PollOption[]>([])
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({})
  const [totalVotes, setTotalVotes] = useState(0)
  const [hasVoted, setHasVoted] = useState(false)
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null)
  const [voting, setVoting] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const data = await fetchActivePoll()
      if (cancelled || !data?.poll) {
        if (!cancelled) setLoading(false)
        return
      }
      setPoll(data.poll)
      const opts = Array.isArray(data.poll.poll_options)
        ? data.poll.poll_options.slice().sort((a, b) => a.display_order - b.display_order)
        : []
      setOptions(opts)
      setVoteCounts(data.voteCounts ?? {})
      setTotalVotes(data.totalVotes ?? 0)
      if (data.userVoteOptionId) {
        setHasVoted(true)
        setVotedOptionId(data.userVoteOptionId)
      } else {
        const stored = localStorage.getItem(`poll-voted-${data.poll.id}`)
        if (stored) {
          setHasVoted(true)
          setVotedOptionId(stored)
        }
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const castVote = useCallback(
    async (optionId: string) => {
      if (!poll || voting || hasVoted) return
      setVoting(true)
      try {
        const res = await fetch('/api/polls/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ poll_id: poll.id, option_id: optionId }),
        })
        if (!res.ok) return
        localStorage.setItem(`poll-voted-${poll.id}`, optionId)
        setVotedOptionId(optionId)
        setHasVoted(true)
        setVoteCounts(prev => ({
          ...prev,
          [optionId]: (prev[optionId] ?? 0) + 1,
        }))
        setTotalVotes(t => t + 1)
      } finally {
        setVoting(false)
      }
    },
    [poll, voting, hasVoted],
  )

  // Soft empty state — keeps the rail slot reserved for upcoming polls
  if (!loading && !poll) {
    return (
      <section
        aria-label="Polls"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          padding: '14px',
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 800,
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--brand-red, #C9302A)',
          }}
        >
          Polls
        </p>
        <p
          style={{
            margin: '8px 0 0',
            fontFamily: '"Barlow", sans-serif',
            fontSize: 13,
            lineHeight: 1.4,
            color: 'var(--text-secondary)',
          }}
        >
          Next poll drops soon. Check back to cast your vote.
        </p>
      </section>
    )
  }

  if (loading || !poll) return null

  const showResults = hasVoted

  return (
    <section
      aria-label="Active poll"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '10px 14px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-elevated)',
        }}
      >
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 800,
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--brand-red, #C9302A)',
          }}
        >
          Active Poll
        </span>
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
          }}
        >
          {showResults ? 'Results' : 'Vote now'}
        </span>
      </header>

      <div style={{ padding: '12px 14px 14px' }}>
        <p
          style={{
            margin: '0 0 10px',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: 14,
            lineHeight: 1.3,
            color: 'var(--text-primary)',
          }}
        >
          {poll.question}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {options.map(o => {
            const count = voteCounts[o.id] ?? 0
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
            const isVoted = votedOptionId === o.id
            if (showResults) {
              return (
                <div
                  key={o.id}
                  style={{
                    position: 'relative',
                    border: isVoted
                      ? '1px solid var(--brand-red, #C9302A)'
                      : '1px solid var(--border-color)',
                    padding: '8px 10px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: `${pct}%`,
                      background: 'rgba(201,168,76,0.18)',
                      transition: 'width 400ms ease',
                    }}
                  />
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8,
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      fontFamily: '"Barlow", sans-serif',
                    }}
                  >
                    <span>{o.option_text}</span>
                    <span
                      style={{
                        fontFamily: '"Barlow Condensed", sans-serif',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {pct}%
                    </span>
                  </div>
                </div>
              )
            }
            return (
              <button
                key={o.id}
                type="button"
                disabled={voting}
                onClick={() => void castVote(o.id)}
                style={{
                  textAlign: 'left',
                  padding: '8px 10px',
                  fontSize: 12,
                  fontFamily: '"Barlow", sans-serif',
                  color: 'var(--text-primary)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                  cursor: voting ? 'wait' : 'pointer',
                  transition: 'border-color 120ms ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--brand-red, #C9302A)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-color)'
                }}
              >
                {o.option_text}
              </button>
            )
          })}
        </div>

        {showResults && totalVotes > 0 && (
          <p
            style={{
              margin: '10px 0 0',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
            }}
          >
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
          </p>
        )}
      </div>
    </section>
  )
}
