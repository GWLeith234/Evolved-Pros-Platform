'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Habit, HabitApiRow } from '@/types/habits'
import { habitFromRow } from '@/types/habits'
import { CompoundHero } from './CompoundHero'
import { WeekBar } from './WeekBar'
import { HabitCard } from './HabitCard'
import { PillarHealth } from './PillarHealth'
import { HabitEditorModal } from './HabitEditorModal'
import { ParticleBurst } from './ParticleBurst'
import { CelebrationOverlay } from './CelebrationOverlay'
import { ReturnBar } from './ReturnBar'
import { NudgeCard } from './NudgeCard'
import { useToast } from '@/lib/toast'

interface CompoundBoardClientProps {
  userId: string
  activePillar?: string  // undefined or 'All' = show all pillars
}

interface BurstState {
  active: boolean
  x: number
  y: number
}

interface StreakData {
  currentStreak: number
  longestStreak: number
  lastCompletedDate: string | null
}

export function CompoundBoardClient({ userId: _userId, activePillar }: CompoundBoardClientProps) {
  const { showToast } = useToast()
  const [habits, setHabits]             = useState<Habit[]>([])
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading]           = useState(true)
  const [editingHabit, setEditingHabit] = useState<Habit | null | undefined>(undefined)
  const [burst, setBurst]               = useState<BurstState>({ active: false, x: 0, y: 0 })
  const [streak, setStreak]             = useState<StreakData>({ currentStreak: 0, longestStreak: 0, lastCompletedDate: null })
  const [showCelebration, setShowCelebration] = useState(false)
  const [showReturnBar, setShowReturnBar]     = useState(false)
  const celebrationFiredRef = useRef(false)
  const dragSourceId = useRef<string | null>(null)

  // ── Fetch habits ─────────────────────────────────────────────────────────
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

  // ── Fetch streak ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/habits/streak')
      .then(r => r.ok ? r.json() : null)
      .then((d: StreakData | null) => {
        if (!d) return
        setStreak(d)

        // Show ReturnBar if last completed date is not yesterday
        if (d.lastCompletedDate) {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = yesterday.toISOString().split('T')[0]
          if (d.lastCompletedDate < yesterdayStr) {
            setShowReturnBar(true)
          }
        }
      })
      .catch(() => {/* non-critical */})
  }, [])

  useEffect(() => { fetchHabits() }, [fetchHabits])

  // ── Celebration trigger ───────────────────────────────────────────────────
  const activeHabits = habits
    .filter(h => h.is_active)
    .filter(h => !activePillar || h.pillar === activePillar)
  const completedActiveCount = [...completedIds].filter(id => activeHabits.some(h => h.id === id)).length

  useEffect(() => {
    if (
      activeHabits.length > 0 &&
      completedActiveCount === activeHabits.length &&
      !celebrationFiredRef.current
    ) {
      celebrationFiredRef.current = true
      setShowCelebration(true)
    }
  }, [completedActiveCount, activeHabits.length])

  // ── Toggle completion ─────────────────────────────────────────────────────
  const handleToggle = useCallback(async (id: string, originX: number, originY: number) => {
    const wasCompleted = completedIds.has(id)

    setCompletedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

    if (!wasCompleted) {
      setBurst({ active: false, x: originX, y: originY })
      requestAnimationFrame(() => setBurst({ active: true, x: originX, y: originY }))
    }

    try {
      const res = await fetch(`/api/habits/${id}/complete`, { method: 'POST' })
      if (!res.ok) {
        setCompletedIds(prev => {
          const next = new Set(prev)
          next.has(id) ? next.delete(id) : next.add(id)
          return next
        })
        showToast('Something went wrong. Please try again.', 'error')
      } else if (!wasCompleted) {
        showToast('Habit completed ✓', 'success')
      }
    } catch {
      setCompletedIds(prev => {
        const next = new Set(prev)
        next.has(id) ? next.delete(id) : next.add(id)
        return next
      })
      showToast('Something went wrong. Please try again.', 'error')
    }
  }, [completedIds, showToast])

  // ── Drag reorder ──────────────────────────────────────────────────────────
  const handleDragStart = useCallback((_e: React.DragEvent, id: string) => {
    dragSourceId.current = id
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, _id: string) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const sourceId = dragSourceId.current
    if (!sourceId || sourceId === targetId) return

    setHabits(prev => {
      const next = [...prev]
      const fromIdx = next.findIndex(h => h.id === sourceId)
      const toIdx   = next.findIndex(h => h.id === targetId)
      if (fromIdx === -1 || toIdx === -1) return prev
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      fetch('/api/habits/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: next.map(h => h.id) }),
      }).catch(() => {/* non-critical */})
      return next
    })
    dragSourceId.current = null
  }, [])

  // ── Editor modal ──────────────────────────────────────────────────────────
  const handleSave = useCallback((saved: Habit) => {
    setHabits(prev => {
      const idx = prev.findIndex(h => h.id === saved.id)
      if (idx === -1) return [...prev, saved]
      const next = [...prev]
      next[idx] = saved
      return next
    })
  }, [])

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

  return (
    <>
      <div className="p-6 space-y-4 max-w-2xl mx-auto">
        {/* Return bar — missed yesterday */}
        {showReturnBar && (
          <ReturnBar onDismiss={() => setShowReturnBar(false)} />
        )}

        <CompoundHero
          completedCount={completedActiveCount}
          totalCount={activeHabits.length}
          currentStreak={streak.currentStreak}
        />

        <WeekBar />

        {activeHabits.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center px-6">
            <p
              className="font-condensed font-bold uppercase tracking-[0.15em] mb-2"
              style={{ fontSize: '14px', color: '#C9A84C' }}
            >
              No Habits Yet
            </p>
            <p
              className="font-body mb-6"
              style={{ fontSize: '14px', color: 'var(--text-tertiary)', maxWidth: '280px' }}
            >
              Add your first habit to start tracking your compound progress.
            </p>
            <button
              type="button"
              onClick={() => setEditingHabit(null)}
              className="font-condensed font-bold uppercase tracking-[0.1em] px-5 py-2.5 rounded transition-opacity hover:opacity-90"
              style={{ fontSize: '11px', backgroundColor: '#C9302A', color: '#ffffff' }}
            >
              + Add Habit
            </button>
          </div>
        ) : (
          <>
            {/* Nudge card */}
            <NudgeCard habits={activeHabits} completedIds={completedIds} />

            {/* Habit list */}
            <div className="flex items-center justify-between">
              <p
                className="font-condensed font-bold uppercase tracking-[0.18em]"
                style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}
              >
                Today&apos;s Habits
              </p>
              <button
                type="button"
                onClick={() => setEditingHabit(null)}
                className="font-condensed font-bold uppercase tracking-[0.1em] transition-opacity hover:opacity-70"
                style={{ fontSize: '10px', color: '#C9A84C' }}
              >
                + Add
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {activeHabits.map((habit, i) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  completed={completedIds.has(habit.id)}
                  index={i}
                  onToggle={handleToggle}
                  onEdit={setEditingHabit}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              ))}
            </div>

            <PillarHealth habits={activeHabits} completedIds={completedIds} />
          </>
        )}
      </div>

      {/* Overlays */}
      <ParticleBurst active={burst.active} originX={burst.x} originY={burst.y} />

      {showCelebration && (
        <CelebrationOverlay
          streak={streak.currentStreak}
          onDismiss={() => setShowCelebration(false)}
        />
      )}

      {editingHabit !== undefined && (
        <HabitEditorModal
          habit={editingHabit}
          onClose={() => setEditingHabit(undefined)}
          onSave={handleSave}
        />
      )}
    </>
  )
}
