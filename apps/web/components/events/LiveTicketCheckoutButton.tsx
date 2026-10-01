'use client'

import { useState } from 'react'

/**
 * Buys one LIVE ticket. Sends the event id only. The server looks up the
 * list price and the signed-in tier. A tier or percent on this request
 * would be ignored, so this component does not send either.
 */
export function LiveTicketCheckoutButton({ eventId }: { eventId: string }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function buy() {
    if (pending) return
    setPending(true)
    setError(null)
    try {
      const res = await fetch(`/api/events/${eventId}/ticket`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ eventId }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Checkout failed. Please try again.')
        setPending(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Network error. Please try again.')
      setPending(false)
    }
  }

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 6 }}>
      <button
        type="button"
        onClick={buy}
        disabled={pending}
        style={{
          padding: '14px 32px',
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 15,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          background: 'rgb(201, 48, 42)',
          color: 'rgb(255, 255, 255)',
          border: 'none',
          borderRadius: 0,
          cursor: pending ? 'wait' : 'pointer',
          minWidth: 180,
        }}
      >
        {pending ? 'Starting checkout' : 'Buy ticket'}
      </button>
      {error && (
        <span style={{ fontFamily: 'sans-serif', fontSize: 12, letterSpacing: 0, textTransform: 'none', color: 'rgb(255, 180, 180)' }}>
          {error}
        </span>
      )}
    </span>
  )
}
