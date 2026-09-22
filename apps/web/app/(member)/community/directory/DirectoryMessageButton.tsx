'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * SPRINT Q1 - the directory's Message control, in both states.
 *
 * Disabled is a real state, not a hidden button: a community or VIP member
 * should see that reaching people is a thing this platform does, and what it
 * takes. Hiding it would remove the upgrade prompt from the surface where it
 * is most persuasive.
 *
 * `enabled` comes from the server's `detail` flag. /api/conversations refuses
 * independently, so a tampered prop buys nothing.
 */
export function DirectoryMessageButton({
  recipientId,
  enabled,
  lockedCopy,
}: {
  recipientId: string
  enabled: boolean
  lockedCopy: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (!enabled) {
    return (
      <span
        aria-disabled="true"
        title={lockedCopy}
        className="inline-flex w-full items-center justify-center font-condensed font-bold uppercase tracking-[0.12em] text-[11px]"
        style={{
          minHeight: 36,
          padding: '0 10px',
          borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.38)',
          backgroundColor: 'transparent',
          cursor: 'default',
        }}
      >
        Message
        <span className="ep-sr-only"> unavailable. {lockedCopy}</span>
      </span>
    )
  }

  async function handleClick(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId }),
      })
      if (res.ok) {
        const conv = (await res.json()) as { id: string }
        router.push(`/messages?c=${conv.id}`)
        return
      }
    } catch {
      // Leave the button usable; a failed open is retryable.
    }
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex w-full items-center justify-center font-condensed font-bold uppercase tracking-[0.12em] text-[11px] transition-opacity"
      style={{
        minHeight: 36,
        padding: '0 10px',
        borderRadius: 4,
        border: '1px solid #68a2b9',
        color: '#68a2b9',
        backgroundColor: 'transparent',
        opacity: loading ? 0.6 : 1,
        cursor: loading ? 'wait' : 'pointer',
      }}
    >
      {loading ? 'Opening…' : 'Message'}
    </button>
  )
}
