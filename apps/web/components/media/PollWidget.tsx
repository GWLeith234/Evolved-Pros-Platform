'use client'

import { useState, useEffect } from 'react'

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
}

export function PollWidget() {
  const [loading, setLoading] = useState(true)
  const [poll, setPoll] = useState<Poll | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [voting, setVoting] = useState(false)
  const [options, setOptions] = useState<PollOption[]>([])
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({})
  const [totalVotes, setTotalVotes] = useState(0)

  useEffect(() => {
    console.log('[PollWidget] mounted, fetching...')
    fetch('/api/polls/active?context=media')
      .then(r => r.json())
      .then((data: ActivePollResponse) => {
        console.log('[PollWidget] response:', JSON.stringify(data))
        if (data.poll) {
          setPoll(data.poll)
          const opts = Array.isArray(data.poll.poll_options)
            ? data.poll.poll_options.slice().sort((a, b) => a.display_order - b.display_order)
            : []
          setOptions(opts)
          setVoteCounts(data.voteCounts ?? {})
          setTotalVotes(data.totalVotes ?? 0)
          const key = `poll_voted_${data.poll.id}`
          if (localStorage.getItem(key)) setHasVoted(true)
        }
      })
      .catch(err => {
        console.error('[PollWidget] fetch error:', err)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null
  if (!poll) return null

  const maxVotes = Math.max(...options.map(o => voteCounts[o.id] ?? 0), 1)

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
        setVoteCounts(prev => ({ ...prev, [selected]: (prev[selected] ?? 0) + 1 }))
        setTotalVotes(prev => prev + 1)
        setHasVoted(true)
        localStorage.setItem(`poll_voted_${poll.id}`, '1')
      }
    } finally {
      setVoting(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#fff', border: '0.5px solid rgba(43,58,90,0.1)', borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
      <div style={{ backgroundColor: '#2B3A5A', padding: '7px 10px' }}>
        <span style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 11, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Quick Poll
        </span>
      </div>

      <div style={{ padding: '10px 12px' }}>
        <p style={{ fontFamily: 'var(--font-condensed)', fontWeight: 800, fontSize: 13, color: '#2B3A5A', margin: '0 0 8px', lineHeight: 1.3 }}>
          {poll.question}
        </p>

        {hasVoted ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {options.map(o => {
              const count = voteCounts[o.id] ?? 0
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
              const isWinner = count === maxVotes && totalVotes > 0
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
