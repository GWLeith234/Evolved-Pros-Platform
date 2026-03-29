'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Reaction } from '@/lib/community/types'

export const REACTIONS = [
  { type: 'heart',        emoji: '❤️', label: 'Love' },
  { type: 'thumbs_up',   emoji: '👍', label: 'Thumbs Up' },
  { type: 'clap',        emoji: '👏', label: 'Clap' },
  { type: 'thumbs_down', emoji: '👎', label: 'Thumbs Down' },
  { type: 'celebration', emoji: '🎉', label: 'Celebration' },
]

interface ReactionPickerProps {
  postId: string
  reactions: Reaction[]
  myReaction: string | null
  onReact: (postId: string, reactionType: string) => void
}

export function ReactionPicker({ postId, reactions, myReaction, onReact }: ReactionPickerProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 })
  const wrapperRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close on outside click — check both the wrapper and the portal
  useEffect(() => {
    if (!pickerOpen) return
    function onOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        wrapperRef.current?.contains(target) ||
        pickerRef.current?.contains(target)
      ) return
      setPickerOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [pickerOpen])

  // Top 3 by count
  const topReactions = [...reactions].sort((a, b) => b.count - a.count).slice(0, 3)

  function handlePick(type: string) {
    onReact(postId, type)
    setPickerOpen(false)
  }

  function openPicker() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPickerPos({ top: rect.bottom + 6, left: rect.left })
    }
    setPickerOpen(true)
  }

  return (
    <div ref={wrapperRef} className="flex items-center gap-1.5 flex-wrap">
      {/* Reaction chips — top 3 by count */}
      {topReactions.map(r => {
        const def = REACTIONS.find(x => x.type === r.type)
        const isMine = myReaction === r.type
        return (
          <button
            key={r.type}
            type="button"
            onClick={() => handlePick(r.type)}
            className="flex items-center gap-1 rounded-full font-condensed font-semibold text-[11px] transition-colors"
            style={{
              padding: '2px 8px',
              backgroundColor: isMine ? 'rgba(239,14,48,0.08)' : 'rgba(27,60,90,0.06)',
              border: `1px solid ${isMine ? 'rgba(239,14,48,0.30)' : 'rgba(27,60,90,0.10)'}`,
              color: isMine ? '#ef0e30' : '#7a8a96',
              flexShrink: 0,
              minWidth: 'fit-content',
            }}
            title={def?.label}
          >
            <span style={{ fontSize: '13px', lineHeight: 1 }}>{def?.emoji ?? r.type}</span>
            <span>{r.count}</span>
          </button>
        )
      })}

      {/* + React trigger — always visible when picker is closed */}
      {!pickerOpen && (
        <button
          ref={triggerRef}
          type="button"
          onClick={openPicker}
          className="font-condensed font-semibold uppercase text-[11px] tracking-wide transition-colors"
          style={{ color: '#7a8a96' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ef0e30')}
          onMouseLeave={e => (e.currentTarget.style.color = '#7a8a96')}
        >
          + React
        </button>
      )}

      {/* Emoji picker rendered as a portal to escape parent overflow constraints */}
      {pickerOpen && typeof window !== 'undefined' && createPortal(
        <div
          ref={pickerRef}
          className="flex items-center gap-0.5 rounded-full"
          style={{
            position: 'fixed',
            top: pickerPos.top,
            left: pickerPos.left,
            zIndex: 9999,
            padding: '4px 10px',
            backgroundColor: 'white',
            border: '1px solid rgba(27,60,90,0.14)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          }}
        >
          {REACTIONS.map(r => (
            <button
              key={r.type}
              type="button"
              onClick={() => handlePick(r.type)}
              className="transition-transform hover:scale-125"
              style={{
                fontSize: '18px',
                lineHeight: 1,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '3px 4px',
                opacity: myReaction === r.type ? 1 : 0.8,
                filter: myReaction === r.type ? 'drop-shadow(0 0 2px rgba(239,14,48,0.6))' : 'none',
              }}
              title={r.label}
            >
              {r.emoji}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
