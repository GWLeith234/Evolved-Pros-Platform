'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SendMessageButtonProps {
  recipientId: string
}

export function SendMessageButton({ recipientId }: SendMessageButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId }),
      })
      if (res.ok) {
        const conv = await res.json()
        router.push(`/messages?c=${conv.id}`)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded font-condensed font-bold uppercase tracking-wide text-xs transition-opacity"
      style={{
        border: '1px solid #68a2b9',
        color: '#68a2b9',
        backgroundColor: 'transparent',
        opacity: loading ? 0.6 : 1,
        cursor: loading ? 'default' : 'pointer',
      }}
      onMouseEnter={e => {
        if (!loading) {
          ;(e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(104,162,185,0.1)'
        }
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {loading ? 'Opening…' : 'Send Message'}
    </button>
  )
}
