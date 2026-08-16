'use client'

import { useState } from 'react'

/**
 * "Changed your mind?" — clears unsubscribed_at via the token-gated POST.
 * Client-side because the outcome is a small inline state change, not a
 * navigation; the token is already in the URL the visitor arrived on.
 */
export function ResubscribeButton({ token }: { token: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')

  if (state === 'done') {
    return (
      <p
        role="status"
        className="font-body text-[14px]"
        style={{ color: 'var(--text-primary)', margin: 0 }}
      >
        You&rsquo;re back on the list — welcome back.
      </p>
    )
  }

  async function resubscribe() {
    setState('busy')
    try {
      const res = await fetch('/api/email/resubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      setState(res.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void resubscribe()}
        disabled={state === 'busy'}
        className="ep-pressable ep-touch-target font-condensed font-bold uppercase"
        style={{
          minHeight: 44,
          padding: '12px 22px',
          fontSize: 12,
          letterSpacing: '0.18em',
          background: 'transparent',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 2,
          cursor: state === 'busy' ? 'wait' : 'pointer',
          opacity: state === 'busy' ? 0.6 : 1,
        }}
      >
        {state === 'busy' ? 'Working…' : 'Resubscribe me'}
      </button>
      {state === 'error' && (
        <p
          role="alert"
          className="font-body text-[13px]"
          style={{ color: 'var(--brand-red-hot)', margin: '10px 0 0' }}
        >
          That didn&rsquo;t work. The link may have expired — email
          george@evolvex360.com and we&rsquo;ll sort it out.
        </p>
      )}
    </div>
  )
}
