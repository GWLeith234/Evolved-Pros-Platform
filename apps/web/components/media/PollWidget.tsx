'use client'

import { useState, useEffect } from 'react'

interface PollOption {
  id: string
  option_text: string
  vote_count: number
  sort_order: number
}

interface Poll {
  id: string
  question: string
  status: string
  closes_at: string | null
  poll_options: PollOption[]
}

export function PollWidget() {
  const [poll, setPoll] = useState<Poll | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [voting, setVoting] = useState(false)
  const [options, setOptions] = useState<PollOption[]>([])

  useEffect(() => {
    fetch('/api/polls/active?context=media')
      .then(r => r.json())
      .then((data: { poll: Poll | null }) => {
        if (data.poll) {
          setPoll(data.poll)
          setOptions(data.poll.poll_options.sort((a, b) => a.sort_order - b.sort_order))
          // Check localStorage for prior vote
          const key = `poll_voted_${data.poll.id}`
          if (localStorage.getItem(key)) setHasVoted(true)
        }
      })
      .catch(() => {})
  }, [])

  if (!poll) return null

  const totalVotes = options.reduce((s, o) => s + o.vote_count, 0)
  const maxVotes = Math.max(...options.map(o => o.vote_count), 1)

  async function handleVote() {
    if (!selected || !poll || voting) return
    setVoting(true)
    try {
      const res = await fetch('/api/polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poll_id: poll.id, option_id: selected }),
      })
      if (res.ok || res.status === 409) {
        setOptions(prev => prev.map(o => o.id === selected ? { ...o, vote_count: o.vote_count + 1 } : o))
        setHasVoted(true)
        localStorage.setItem(`poll_voted_${poll.id}`, '1')
      }
    } finally {
      setVoting(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#fff', border: '0.5px solid rgba(43,58,90,0.1)', borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#2B3A5A', padding: '7px 10px' }}>
        <span style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 11, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Quick Poll
        </span>
      </div>

      <div style={{ padding: '10px 12px' }}>
        {/* Question */}
        <p style={{ fontFamily: 'var(--font-condensed)', fontWeight: 800, fontSize: 13, color: '#2B3A5A', margin: '0 0 8px', lineHeight: 1.3 }}>
          {poll.question}
        </p>

        {hasVoted ? (
          /* Results */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {options.map(o => {
              const pct = totalVotes > 0 ? Math.round((o.vote_count / totalVotes) * 100) : 0
              const isWinner = o.vote_count === maxVotes && totalVotes > 0
              return (
                <div key={o.id} style={{ position: 'relative', borderRadius: 4, overflow: 'hidden', padding: '6px 10px', backgroundColor: 'rgba(43,58,90,0.04)', border: '1px solid rgba(43,58,90,0.08)' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${pct}%`, backgroundColor: isWinner ? 'rgba(201,168,76,0.25)' : 'rgba(43,58,90,0.06)', transition: 'width 0.5s ease', borderRadius: 4 }} />
                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#2B3A5A' }}>{o.option_text}</span>
                    <span style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 10, color: isWinner ? '#AA8C3C' : 'rgba(43,58,90,0.4)' }}>{pct}%</span>
                  </div>
                </div>
              )
            })}
            <p style={{ fontSize: 9, color: 'rgba(43,58,90,0.35)', marginTop: 2 }}>
              {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
            </p>
          </div>
        ) : (
          /* Vote buttons */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {options.map(o => (
              <button
                key={o.id}
                type="button"
                onClick={() => setSelected(o.id)}
                style={{
                  textAlign: 'left', padding: '6px 10px', borderRadius: 4,
                  border: selected === o.id ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(43,58,90,0.1)',
                  backgroundColor: selected === o.id ? 'rgba(201,168,76,0.06)' : 'transparent',
                  color: '#2B3A5A', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {o.option_text}
              </button>
            ))}
            <button
              type="button"
              onClick={handleVote}
              disabled={!selected || voting}
              style={{
                fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 10,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                padding: '5px 12px', borderRadius: 3, border: 'none', marginTop: 2,
                cursor: selected ? 'pointer' : 'not-allowed',
                backgroundColor: selected ? '#C9A84C' : 'rgba(201,168,76,0.3)',
                color: '#0A0F18', opacity: voting ? 0.5 : 1,
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
