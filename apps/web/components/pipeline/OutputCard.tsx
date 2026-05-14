'use client'

import { useState } from 'react'

interface OutputCardProps {
  type: 'community' | 'article' | 'email' | 'social'
  content: string | Record<string, unknown>
  accentColor: string
  label: string
  actionLabel: string
  onPublish: () => void
  onRegenerate: () => void
  publishing: boolean
}

export function OutputCard({ type, content, accentColor, label, actionLabel, onPublish, onRegenerate, publishing }: OutputCardProps) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(
    typeof content === 'string' ? content : JSON.stringify(content, null, 2)
  )

  const displayText = typeof content === 'string'
    ? content
    : type === 'article' ? (content as Record<string, string>).body ?? ''
    : type === 'email' ? `Subject: ${(content as Record<string, string>).subject}\n\n${(content as Record<string, string>).body}`
    : type === 'social' ? `LinkedIn:\n${(content as Record<string, string>).linkedin}\n\nX:\n${(content as Record<string, string>).twitter}`
    : JSON.stringify(content, null, 2)

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#111926', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `2px solid ${accentColor}` }}>
        <span className="font-condensed font-bold uppercase tracking-[0.14em] text-[12px]" style={{ color: accentColor }}>
          {label}
        </span>
        <button type="button" onClick={onRegenerate} className="font-condensed text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Regenerate
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {editing ? (
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={8}
            className="w-full rounded px-2 py-1.5 text-[12px] font-body resize-y outline-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', lineHeight: '1.6' }}
          />
        ) : (
          <p className="font-body text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {displayText}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          type="button"
          onClick={() => setEditing(!editing)}
          className="font-condensed text-[12px] px-2 py-1 rounded"
          style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {editing ? 'Preview' : 'Edit'}
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={publishing}
          className="font-condensed font-bold uppercase tracking-[0.1em] text-[12px] px-4 py-1.5 rounded transition-opacity hover:opacity-90"
          style={{ backgroundColor: accentColor, color: '#0A0F18', opacity: publishing ? 0.5 : 1 }}
        >
          {publishing ? 'Publishing...' : actionLabel}
        </button>
      </div>
    </div>
  )
}
