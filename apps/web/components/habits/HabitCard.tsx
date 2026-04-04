'use client'

import { useState } from 'react'
import type { Habit } from '@/types/habits'
import { pillarColor } from '@/types/habits'

interface HabitCardProps {
  habit: Habit
  completed: boolean
  onToggle: (id: string) => void
}

export function HabitCard({ habit, completed, onToggle }: HabitCardProps) {
  const [hovering, setHovering] = useState(false)
  const color = pillarColor(habit.pillar)

  return (
    <div
      className="rounded-lg px-4 py-3 flex items-center gap-3 transition-all"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: `1px solid ${completed ? `${color}40` : 'rgba(255,255,255,0.08)'}`,
        opacity: completed ? 0.85 : 1,
      }}
    >
      {/* Pillar color tag */}
      <div
        className="flex-shrink-0 rounded-full"
        style={{ width: '4px', height: '36px', backgroundColor: color }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="font-condensed font-semibold leading-tight"
          style={{
            fontSize: '14px',
            color: completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
            textDecoration: completed ? 'line-through' : 'none',
          }}
        >
          {habit.title}
        </p>
        <p
          className="font-condensed uppercase tracking-[0.1em] mt-0.5"
          style={{ fontSize: '9px', color }}
        >
          {habit.pillar}
        </p>
      </div>

      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onToggle(habit.id)}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center transition-all"
        style={{
          backgroundColor: completed
            ? color
            : hovering
            ? `${color}20`
            : 'rgba(255,255,255,0.06)',
          border: `1.5px solid ${completed ? color : hovering ? color : 'rgba(255,255,255,0.2)'}`,
        }}
        aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {completed && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2 6 5 9 10 3" />
          </svg>
        )}
      </button>
    </div>
  )
}
