'use client'

import { useState, useRef, useEffect } from 'react'
import type { Reaction } from '@/lib/community/types'

export const REACTIONS = [
  { type: 'heart',       emoji: '❤️', label: 'Love' },
  { type: 'thumbs_up',  emoji: '👍', label: 'Thumbs Up' },
  { type: 'clap',       emoji: '👏', label: 'Clap' },
  { type: 'thumbs_down',emoji: '👎', label: 'Thumbs Down' },
  { type: 'celebration',emoji: '🎉', label: 'Celebration' },
]

interface ReactionPickerProps {
  postId: string
  reactions: Reaction[]
  myReaction: string | null
  onReact: (postId: string, reactionType: string) => void
}

export function ReactionPicker({ postId, reactions, myReaction, onReact }: ReactionPickerProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pickerOpen) return
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
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

  return (
    <div ref={ref} className="flex items-center gap-1.5 flex-wrap">
      {/* Reaction chips — top 3 */}
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
            }}
            title={def?.label}
          >
            <span style={{ fontSize: '13px', lineHeight: 1 }}>{def?.emoji ?? r.type}</span>
            <span>{r.count}</span>
          </button>
        )
      })}

      {/* Inline picker or + React toggle */}
      {pickerOpen ? (
        <div
          className="flex items-center gap-0.5 rounded-full"
          style={{
            padding: '3px 8px',
            backgroundColor: 'rgba(27,60,90,0.06)',
            border: '1px solid rgba(27,60,90,0.12)',
          }}
        >
          {REACTIONS.map(r => (
            <button
              key={r.type}
              type="button"
              onClick={() => handlePick(r.type)}
              className="transition-transform hover:scale-125"
              style={{
                fontSize: '16px',
                lineHeight: 1,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 3px',
                opacity: myReaction === r.type ? 1 : 0.8,
                filter: myReaction === r.type ? 'drop-shadow(0 0 2px rgba(239,14,48,0.6))' : 'none',
              }}
              title={r.label}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="font-condensed font-semibold uppercase text-[11px] tracking-wide transition-colors"
          style={{ color: '#7a8a96' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ef0e30')}
          onMouseLeave={e => (e.currentTarget.style.color = '#7a8a96')}
        >
          + React
        </button>
      )}
    </div>
  )
}
