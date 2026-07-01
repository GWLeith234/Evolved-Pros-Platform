'use client'

import { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'

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

interface VoteResponse {
  ok: true
  optionId: string
  status: 'voted' | 'changed' | 'unchanged'
}

function formatCountdown(closesAt: string | null, now: number): string | null {
  if (!closesAt) return null
  const end = new Date(closesAt).getTime()
  const diff = end - now
  if (diff <= 0) return 'POLL CLOSED'
  const s = Math.floor(diff / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (s > 86400) return `CLOSES IN ${d}D ${h}H`
  if (s > 3600) return `CLOSES IN ${h}H ${m}M`
  return `CLOSES IN ${m}M ${sec}S`
}

export function PollWidget() {
  const [loading, setLoading] = useState(true)
  const [poll, setPoll] = useState<Poll | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null)
  const [voting, setVoting] = useState(false)
  const [options, setOptions] = useState<PollOption[]>([])
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({})
  const [totalVotes, setTotalVotes] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [barsVisible, setBarsVisible] = useState(false)

  useEffect(() => {
    fetch('/api/polls/active?context=media')
      .then(r => r.json())
      .then((data: ActivePollResponse) => {
        if (data.poll) {
          setPoll(data.poll)
          const opts = Array.isArray(data.poll.poll_options)
            ? data.poll.poll_options.slice().sort((a, b) => a.display_order - b.display_order)
            : []
          setOptions(opts)
          setVoteCounts(data.voteCounts ?? {})
          setTotalVotes(data.totalVotes ?? 0)
          if (data.userVoteOptionId) {
            // Server truth (this poll, this authenticated user) — always wins.
            // Sync localStorage to it so a stale/mismatched local value from
            // another device doesn't resurface next load.
            setHasVoted(true)
            setVotedOptionId(data.userVoteOptionId)
            localStorage.setItem(`poll-voted-${data.poll.id}`, data.userVoteOptionId)
          } else {
            // No server-known vote — either logged out, or genuinely hasn't
            // voted. localStorage is a fast local hint only in this case.
            const stored = localStorage.getItem(`poll-voted-${data.poll.id}`)
            if (stored) {
              setHasVoted(true)
              setVotedOptionId(stored)
            }
          }
        }
      })
      .catch(err => {
        console.error('[PollWidget] fetch error:', err)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(id)
  }, [])

  const isExpired = !!poll?.closes_at && new Date(poll.closes_at).getTime() <= now
  const countdown = poll ? formatCountdown(poll.closes_at, now) : null
  const showResults = hasVoted || isExpired

  useEffect(() => {
    if (showResults) {
      const t = setTimeout(() => setBarsVisible(true), 50)
      return () => clearTimeout(t)
    }
  }, [showResults])

  if (loading) return null
  if (!poll) return null

  // Casts a first vote, or changes an existing one to a different option.
  // Shared by the pre-vote "Vote" button and the clickable result rows below.
  async function castVote(optionId: string) {
    if (!poll || voting || isExpired) return
    if (hasVoted && votedOptionId === optionId) return // already this option — no-op

    const previousOptionId = votedOptionId
    const wasAlreadyVoted = hasVoted

    setVoting(true)
    try {
      const res = await fetch('/api/polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poll_id: poll.id, option_id: optionId }),
      })
      if (res.ok) {
        const data = await res.json() as VoteResponse
        localStorage.setItem(`poll-voted-${poll.id}`, data.optionId)
        setVotedOptionId(data.optionId)
        setHasVoted(true)
        if (data.status !== 'unchanged') {
          confetti({
            particleCount: 80,
            spread: 60,
            startVelocity: 35,
            origin: { x: 0.5, y: 0.5 },
            colors: ['#C9A84C', '#C9302A', '#1B2A4A'],
            ticks: 120,
          })
        }
        try {
          const refreshed = await fetch('/api/polls/active?context=media').then(r => r.json()) as ActivePollResponse
          setVoteCounts(refreshed.voteCounts ?? {})
          setTotalVotes(refreshed.totalVotes ?? 0)
        } catch {
          setVoteCounts(prev => {
            const next = { ...prev }
            if (wasAlreadyVoted && previousOptionId && previousOptionId !== data.optionId) {
              // Vote changed — move the tally, total voter count is unchanged.
              next[previousOptionId] = Math.max(0, (next[previousOptionId] ?? 0) - 1)
              next[data.optionId] = (next[data.optionId] ?? 0) + 1
            } else if (!wasAlreadyVoted) {
              next[data.optionId] = (next[data.optionId] ?? 0) + 1
            }
            return next
          })
          if (!wasAlreadyVoted) setTotalVotes(prev => prev + 1)
        }
      }
    } finally {
      setVoting(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#fff', border: '0.5px solid rgba(27,42,74,0.1)', borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
      <div style={{ backgroundColor: '#1B2A4A', padding: '7px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 11, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {showResults ? 'Results' : 'Quick Poll'}
        </span>
        {countdown && (
          <span style={{ backgroundColor: '#C9A84C', color: '#1B2A4A', fontFamily: 'var(--font-logo)', fontSize: 10, letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 2 }}>
            {countdown}
          </span>
        )}
      </div>

      <div style={{ padding: '10px 12px' }}>
        <p style={{ fontFamily: 'var(--font-condensed)', fontWeight: 800, fontSize: 13, color: '#1B2A4A', margin: '0 0 8px', lineHeight: 1.3 }}>
          {poll.question}
        </p>

        {showResults ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {options.map(o => {
              const count = voteCounts[o.id] ?? 0
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
              const isVoted = votedOptionId === o.id
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => castVote(o.id)}
                  disabled={voting || isExpired}
                  style={{
                    position: 'relative',
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    font: 'inherit',
                    background: '#fff',
                    border: isVoted ? '2px solid #C9302A' : '1px solid rgba(27,42,74,0.15)',
                    padding: '8px 10px',
                    overflow: 'hidden',
                    cursor: isExpired ? 'default' : 'pointer',
                    opacity: voting ? 0.7 : 1,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: barsVisible ? `${pct}%` : '0%',
                      background: 'rgba(201,168,76,0.35)',
                      transition: 'width 600ms ease-out',
                    }}
                  />
                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#1B2A4A' }}>
                      {isVoted && (
                        <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0 }} aria-hidden="true">
                          <path d="M2.5 6.5L5 9L9.5 3.5" stroke="#C9302A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                      )}
                      {o.option_text}
                    </span>
                    <span style={{ fontFamily: 'var(--font-condensed)', fontWeight: 600, fontSize: 10, color: '#1B2A4A', whiteSpace: 'nowrap' }}>
                      {pct}% · {count}
                    </span>
                  </div>
                </button>
              )
            })}
            {totalVotes > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <span style={{ fontFamily: 'var(--font-logo)', fontSize: 10, letterSpacing: '0.08em', color: 'rgba(27,42,74,0.5)' }}>
                  {totalVotes} {totalVotes === 1 ? 'VOTE' : 'VOTES'}
                </span>
                {hasVoted && (
                  <span style={{ fontFamily: 'var(--font-logo)', fontSize: 10, letterSpacing: '0.08em', color: '#C9302A' }}>
                    YOU VOTED · TAP TO CHANGE
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {options.map(o => (
              <button
                key={o.id}
                type="button"
                onClick={() => setSelected(o.id)}
                style={{
                  textAlign: 'left', padding: '6px 10px', borderRadius: 4,
                  border: selected === o.id ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(27,42,74,0.1)',
                  backgroundColor: selected === o.id ? 'rgba(201,168,76,0.06)' : 'transparent',
                  color: '#1B2A4A', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {o.option_text}
              </button>
            ))}
            <button
              type="button"
              onClick={() => selected && castVote(selected)}
              disabled={!selected || voting}
              style={{
                fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 10,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                padding: '5px 12px', borderRadius: 3, border: 'none', marginTop: 2,
                cursor: selected ? 'pointer' : 'not-allowed',
                backgroundColor: selected ? '#C9A84C' : 'rgba(201,168,76,0.3)',
                color: '#1B2A4A', opacity: voting ? 0.5 : 1,
              }}
            >
              {voting ? 'Voting...' : 'Vote'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
