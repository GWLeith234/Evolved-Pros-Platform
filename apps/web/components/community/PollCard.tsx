'use client'

import { useState, useEffect } from 'react'

export interface PollOption {
  id: string
  option_text: string
  display_order: number
}

export interface PollData {
  id: string
  question: string
  status: string
  closes_at: string | null
  poll_options: PollOption[]
}

interface PollCardProps {
  poll: PollData
  currentUserId: string
  voteCounts?: Record<string, number>
  totalVotes?: number
}

export function PollCard({ poll, currentUserId, voteCounts: initialCounts = {}, totalVotes: initialTotal = 0 }: PollCardProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const options = poll.poll_options.slice().sort((a, b) => a.display_order - b.display_order)
  const [voteCounts, setVoteCounts] = useState(initialCounts)
  const [totalVotes, setTotalVotes] = useState(initialTotal)
  const [voting, setVoting] = useState(false)
  // Defers Date comparison to client-only — keeps SSR initial render stable (#425)
  const [isPastClose, setIsPastClose] = useState(false)

  const maxVotes = Math.max(...options.map(o => voteCounts[o.id] ?? 0), 1)

  useEffect(() => {
    const key = `poll_voted_${poll.id}`
    if (localStorage.getItem(key) === currentUserId) {
      setHasVoted(true)
    }
  }, [poll.id, currentUserId])

  useEffect(() => {
    if (poll.closes_at) {
      setIsPastClose(new Date(poll.closes_at) < new Date())
    }
  }, [poll.closes_at])

  async function handleVote() {
    if (!selected || voting) return
    setVoting(true)
    try {
      const res = await fetch('/api/polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poll_id: poll.id, option_id: selected }),
      })
      if (res.ok || res.status === 409) {
        setVoteCounts(prev => ({ ...prev, [selected]: (prev[selected] ?? 0) + 1 }))
        setTotalVotes(prev => prev + 1)
        setHasVoted(true)
        localStorage.setItem(`poll_voted_${poll.id}`, currentUserId)
      }
    } finally {
      setVoting(false)
    }
  }

  const isClosed = poll.status === 'closed' || isPastClose

  return (
    <div style={{ marginTop: 8 }}>
      <p style={{ fontFamily: 'var(--font-condensed)', fontWeight: 800, fontSize: 15, color: 'rgba(255,255,255,0.88)', margin: '0 0 10px' }}>
        {poll.question}
      </p>

      {hasVoted || isClosed ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {options.map(o => {
            const count = voteCounts[o.id] ?? 0
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
            const isWinner = count === maxVotes && totalVotes > 0
            return (
              <div key={o.id} style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${pct}%`, backgroundColor: isWinner ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.15)', transition: 'width 0.5s ease', borderRadius: 6 }} />
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{o.option_text}</span>
                  <span style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 11, color: isWinner ? '#C9A84C' : 'rgba(255,255,255,0.4)', marginLeft: 8 }}>{pct}%</span>
                </div>
              </div>
            )
          })}
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
            {poll.closes_at && !isClosed && ` · Closes ${new Date(poll.closes_at).toLocaleDateString()}`}
            {isClosed && ' · Poll closed'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {options.map(o => (
            <button
              key={o.id}
              type="button"
              onClick={() => setSelected(o.id)}
              style={{
                textAlign: 'left', padding: '10px 14px', borderRadius: 6,
                border: selected === o.id ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: selected === o.id ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.7)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {o.option_text}
            </button>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={handleVote}
              disabled={!selected || voting}
              style={{
                fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                padding: '6px 16px', borderRadius: 4, border: 'none',
                cursor: selected ? 'pointer' : 'not-allowed',
                backgroundColor: selected ? '#C9A84C' : 'rgba(201,168,76,0.3)',
                color: '#0A0F18', opacity: voting ? 0.5 : 1,
              }}
            >
              {voting ? 'Voting...' : 'Vote'}
            </button>
            {poll.closes_at && (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                Closes {new Date(poll.closes_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
