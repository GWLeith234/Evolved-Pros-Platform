'use client'

import { useState } from 'react'
import type { Reply } from '@/lib/community/types'

interface GeorgeReplyAssistProps {
  postId: string
  postBody: string
  authorName: string
  pillarTag?: string
  onReplySent: (reply: Reply) => void
}

const GOLD = '#C9A84C'

export function GeorgeReplyAssist({ postId, postBody, authorName, pillarTag, onReplySent }: GeorgeReplyAssistProps) {
  const [mode, setMode] = useState<'button' | 'loading' | 'options' | 'editing'>('button')
  const [replies, setReplies] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setMode('loading')
    setError(null)
    try {
      const res = await fetch('/api/admin/community/suggest-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postBody, authorName, pillarTag }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setReplies(data.replies ?? [])
      setSelectedIndex(null)
      setMode('options')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate')
      setMode('button')
    }
  }

  async function handleSend(text: string) {
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/posts/${postId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? 'Send failed')
      }
      setMode('button')
      setReplies([])
      setSelectedIndex(null)
      onReplySent(data as Reply)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setSending(false)
    }
  }

  if (mode === 'button') {
    return (
      <button
        type="button"
        onClick={handleGenerate}
        className="font-condensed font-semibold uppercase tracking-[0.1em] text-[12px] transition-opacity hover:opacity-70"
        style={{ color: GOLD, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}
      >
        Reply as George
      </button>
    )
  }

  if (mode === 'loading') {
    return (
      <div className="rounded-lg px-3 py-2.5 mt-2" style={{ backgroundColor: `${GOLD}0A`, border: `1px solid ${GOLD}25` }}>
        <span className="font-condensed text-[12px]" style={{ color: `${GOLD}99` }}>Generating replies...</span>
      </div>
    )
  }

  if (mode === 'editing') {
    return (
      <div className="rounded-lg px-3 py-3 mt-2 space-y-2" style={{ backgroundColor: `${GOLD}0A`, border: `1px solid ${GOLD}25` }}>
        <textarea
          value={editText}
          onChange={e => setEditText(e.target.value)}
          rows={3}
          className="w-full rounded px-3 py-2 text-[12px] font-body resize-none outline-none"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#1b3c5a' }}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleSend(editText)}
            disabled={sending || !editText.trim()}
            className="font-condensed font-bold uppercase tracking-[0.1em] text-[12px] px-4 py-1.5 rounded transition-opacity"
            style={{ backgroundColor: GOLD, color: '#0A0F18', opacity: sending ? 0.5 : 1 }}
          >
            {sending ? 'Sending...' : 'Send reply \u2192'}
          </button>
          <button type="button" onClick={() => setMode('options')} className="font-condensed text-[12px]" style={{ color: 'rgba(27,60,90,0.4)' }}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // mode === 'options'
  return (
    <div className="rounded-lg px-3 py-3 mt-2" style={{ backgroundColor: `${GOLD}0A`, border: `1px solid ${GOLD}25` }}>
      {error && <p className="font-condensed text-[12px] mb-2" style={{ color: '#ef0e30' }}>{error}</p>}

      <p className="font-condensed font-semibold uppercase tracking-[0.14em] text-[8px] mb-2" style={{ color: `${GOLD}99` }}>
        <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', backgroundColor: GOLD, marginRight: 4, verticalAlign: 'middle' }} />
        Reply as George &mdash; 3 options
      </p>

      <div className="space-y-1.5 mb-3">
        {replies.map((reply, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelectedIndex(i)}
            className="w-full text-left rounded px-3 py-2.5 transition-all"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: selectedIndex === i ? `1px solid ${GOLD}40` : '1px solid rgba(27,60,90,0.08)',
              borderLeft: selectedIndex === i ? `3px solid ${GOLD}` : '3px solid transparent',
            }}
          >
            <p className="font-body text-[12px] leading-relaxed" style={{ color: '#1b3c5a' }}>{reply}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => selectedIndex !== null && handleSend(replies[selectedIndex])}
          disabled={selectedIndex === null || sending}
          className="font-condensed font-bold uppercase tracking-[0.1em] text-[12px] px-4 py-1.5 rounded transition-opacity"
          style={{ backgroundColor: GOLD, color: '#0A0F18', opacity: selectedIndex === null || sending ? 0.4 : 1 }}
        >
          {sending ? 'Sending...' : `Send option ${selectedIndex !== null ? selectedIndex + 1 : ''} \u2192`}
        </button>
        <button
          type="button"
          onClick={() => { if (selectedIndex !== null) { setEditText(replies[selectedIndex]); setMode('editing') } }}
          disabled={selectedIndex === null}
          className="font-condensed text-[12px] px-3 py-1.5 rounded"
          style={{ backgroundColor: 'rgba(27,60,90,0.06)', color: 'rgba(27,60,90,0.5)', opacity: selectedIndex === null ? 0.4 : 1 }}
        >
          Edit first
        </button>
        <button
          type="button"
          onClick={handleGenerate}
          className="font-condensed text-[12px] px-3 py-1.5 rounded"
          style={{ backgroundColor: 'rgba(27,60,90,0.06)', color: 'rgba(27,60,90,0.5)' }}
        >
          Regenerate
        </button>
      </div>
    </div>
  )
}
