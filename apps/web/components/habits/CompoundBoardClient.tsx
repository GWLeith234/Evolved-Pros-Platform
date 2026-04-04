'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Habit, HabitApiRow } from '@/types/habits'
import { habitFromRow } from '@/types/habits'
import { CompoundHero } from './CompoundHero'
import { WeekBar } from './WeekBar'
import { HabitCard } from './HabitCard'
import { PillarHealth } from './PillarHealth'

interface CompoundBoardClientProps {
  userId: string
}

export function CompoundBoardClient({ userId: _userId }: CompoundBoardClientProps) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const fetchHabits = useCallback(async () => {
    try {
      const res = await fetch('/api/habits')
      if (!res.ok) return
      const data = await res.json() as { habits: HabitApiRow[]; completedIds: string[] }
      setHabits((data.habits ?? []).map(habitFromRow))
      setCompletedIds(new Set(data.completedIds ?? []))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchHabits() }, [fetchHabits])

  const handleToggle = useCallback(async (id: string) => {
    // Optimistic update
    setCompletedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })

    try {
      const res = await fetch(`/api/habits/${id}/complete`, { method: 'POST' })
      if (!res.ok) {
        // Revert on failure
        setCompletedIds(prev => {
          const next = new Set(prev)
          if (next.has(id)) next.delete(id)
          else next.add(id)
          return next
        })
      }
    } catch {
      // Revert on network error
      setCompletedIds(prev => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
    }
  }, [])

  const activeHabits = habits.filter(h => h.is_active)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div
          className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }}
        />
      </div>
    )
  }

  if (activeHabits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-6">
        <p
          className="font-condensed font-bold uppercase tracking-[0.15em] mb-2"
          style={{ fontSize: '14px', color: '#C9A84C' }}
        >
          No Habits Yet
        </p>
        <p
          className="font-body"
          style={{ fontSize: '14px', color: 'var(--text-tertiary)', maxWidth: '280px' }}
        >
          Add your first habit in the Academy execution module to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto">
      <CompoundHero
        completedCount={completedIds.size}
        totalCount={activeHabits.length}
      />

      <WeekBar />

      <div className="space-y-2">
        {activeHabits.map(habit => (
          <HabitCard
            key={habit.id}
            habit={habit}
            completed={completedIds.has(habit.id)}
            onToggle={handleToggle}
          />
        ))}
      </div>

      <PillarHealth habits={activeHabits} completedIds={completedIds} />
    </div>
  )
}
