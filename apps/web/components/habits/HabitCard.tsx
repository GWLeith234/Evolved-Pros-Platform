'use client'

import { useState, useRef } from 'react'
import type { Habit } from '@/types/habits'
import { pillarColor } from '@/types/habits'

interface HabitCardProps {
  habit: Habit
  completed: boolean
  index: number
  onToggle: (id: string, originX: number, originY: number) => void
  onEdit: (habit: Habit) => void
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragOver: (e: React.DragEvent, id: string) => void
  onDrop: (e: React.DragEvent, id: string) => void
}

function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <circle cx="4" cy="3" r="1.2" />
      <circle cx="4" cy="7" r="1.2" />
      <circle cx="4" cy="11" r="1.2" />
      <circle cx="9" cy="3" r="1.2" />
      <circle cx="9" cy="7" r="1.2" />
      <circle cx="9" cy="11" r="1.2" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

export function HabitCard({
  habit,
  completed,
  index,
  onToggle,
  onEdit,
  onDragStart,
  onDragOver,
  onDrop,
}: HabitCardProps) {
  const [hovering, setHovering] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const checkRef = useRef<HTMLButtonElement>(null)
  const color = pillarColor(habit.pillar)

  function handleToggle() {
    if (checkRef.current) {
      const rect = checkRef.current.getBoundingClientRect()
      onToggle(habit.id, rect.left + rect.width / 2, rect.top + rect.height / 2)
    } else {
      onToggle(habit.id, 0, 0)
    }
  }

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, habit.id)}
      onDragOver={e => { e.preventDefault(); setIsDragOver(true); onDragOver(e, habit.id) }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={e => { setIsDragOver(false); onDrop(e, habit.id) }}
      className="rounded-lg px-4 py-3 flex items-center gap-3"
      style={{
        backgroundColor: completed ? 'rgba(10,191,163,0.08)' : 'var(--bg-surface)',
        border: `1px solid ${isDragOver ? 'rgba(201,168,76,0.4)' : completed ? `${color}40` : 'rgba(255,255,255,0.08)'}`,
        transition: 'background-color 400ms ease, border-color 200ms ease, opacity 200ms ease',
        opacity: completed ? 0.85 : 1,
        cursor: 'grab',
        animationName: 'cardMount',
        animationDuration: '280ms',
        animationTimingFunction: 'ease-out',
        animationFillMode: 'both',
        animationDelay: `${index * 60}ms`,
        // Shimmer on completion
        backgroundImage: completed
          ? 'none'
          : undefined,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Grip handle */}
      <div
        className="flex-shrink-0 cursor-grab active:cursor-grabbing"
        style={{ color: 'rgba(255,255,255,0.2)', lineHeight: 0 }}
      >
        <GripIcon />
      </div>

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
            color: completed ? 'rgba(255,255,255,0.60)' : 'var(--text-primary)',
            textDecoration: completed ? 'line-through' : 'none',
            transition: 'color 300ms ease',
          }}
        >
          {habit.title}
        </p>
        {habit.pillar && (
          <p
            className="font-condensed uppercase tracking-[0.1em] mt-0.5"
            style={{ fontSize: '9px', color }}
          >
            {habit.pillar}
          </p>
        )}
      </div>

      {/* Edit button */}
      <button
        type="button"
        onClick={() => onEdit(habit)}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded transition-opacity"
        style={{ color: 'rgba(255,255,255,0.2)', opacity: hovering ? 1 : 0 }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        aria-label="Edit habit"
      >
        <PencilIcon />
      </button>

      {/* Checkbox */}
      <button
        ref={checkRef}
        type="button"
        onClick={handleToggle}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center"
        style={{
          backgroundColor: completed ? color : hovering ? `${color}20` : 'rgba(255,255,255,0.06)',
          border: `1.5px solid ${completed ? color : hovering ? color : 'rgba(255,255,255,0.2)'}`,
          transition: 'background-color 200ms ease, border-color 200ms ease',
        }}
        aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {completed && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2 6 5 9 10 3" />
          </svg>
        )}
      </button>

      {/* Shimmer sweep on completion */}
      {completed && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(10,191,163,0.12) 50%, transparent 100%)',
            animation: 'shimmerSweep 400ms ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      )}

      <style>{`
        @keyframes cardMount {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerSweep {
          from { transform: translateX(-100%); }
          to   { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
