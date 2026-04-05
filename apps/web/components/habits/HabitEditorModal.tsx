'use client'

import { useState, useEffect, useRef } from 'react'
import type { Habit } from '@/types/habits'
import { PILLAR_COLORS } from '@/types/habits'

const PILLARS = Object.keys(PILLAR_COLORS)

const labelClass = 'block font-condensed text-xs uppercase tracking-widest text-white/50 mb-1.5'
const inputClass = 'w-full px-3 py-2.5 rounded font-body text-sm outline-none transition-colors bg-[#0A0F18] border border-white/10 text-white placeholder:text-white/25'

interface HabitEditorModalProps {
  habit: Habit | null
  onClose: () => void
  onSave: (habit: Habit) => void
}

export function HabitEditorModal({ habit, onClose, onSave }: HabitEditorModalProps) {
  const [title, setTitle]             = useState(habit?.title ?? '')
  const [pillar, setPillar]           = useState(habit?.pillar ?? '')
  const [description, setDescription] = useState(habit?.description ?? '')
  const [frequency, setFrequency]     = useState(habit?.frequency ?? 'daily')
  const [isActive, setIsActive]       = useState(habit?.is_active ?? true)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSave() {
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError(null)

    try {
      const isNew = !habit?.id
      const url    = isNew ? '/api/habits' : `/api/habits/${habit!.id}`
      const method = isNew ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: title.trim(), frequency }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Save failed')
        return
      }

      const data = await res.json() as { habit: { id: string; name: string } }
      onSave({
        id:        data.habit.id,
        title:     data.habit.name,
        pillar,
        description,
        frequency,
        is_active: isActive,
      })
      onClose()
    } catch {
      setError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl overflow-hidden bg-[#111926] border border-white/10"
        style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <p className="font-condensed font-bold text-[13px] uppercase tracking-[0.12em] text-[#C9A84C]">
            {habit?.id ? 'Edit Habit' : 'New Habit'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded text-white/40 hover:text-white/70 transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="3" x2="13" y2="13" />
              <line x1="13" y1="3" x2="3" y2="13" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-5 flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className={labelClass}>Habit Title *</label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Morning walk"
              className={inputClass}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor = '')}
            />
          </div>

          {/* Pillar */}
          <div>
            <label className={labelClass}>Pillar</label>
            <select
              value={pillar}
              onChange={e => setPillar(e.target.value)}
              className={`${inputClass} appearance-none`}
              style={{ color: pillar ? PILLAR_COLORS[pillar] ?? undefined : undefined }}
            >
              <option value="" style={{ color: 'rgba(255,255,255,0.3)', backgroundColor: '#111926' }}>— No pillar —</option>
              {PILLARS.map(p => (
                <option key={p} value={p} style={{ color: PILLAR_COLORS[p], backgroundColor: '#111926' }}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Why does this habit matter?"
              className={`${inputClass} resize-none`}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor = '')}
            />
          </div>

          {/* Frequency */}
          <div>
            <label className={labelClass}>Frequency</label>
            <div className="flex gap-2">
              {(['daily', 'weekdays'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className="flex-1 py-2 rounded font-condensed font-semibold text-[11px] uppercase tracking-[0.08em] transition-all border"
                  style={{
                    backgroundColor: frequency === f ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                    borderColor:     frequency === f ? 'rgba(201,168,76,0.4)'  : 'rgba(255,255,255,0.1)',
                    color:           frequency === f ? '#C9A84C'               : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {f === 'daily' ? 'Every Day' : 'Weekdays Only'}
                </button>
              ))}
            </div>
            {frequency === 'weekdays' && (
              <p className="mt-1.5 font-body text-[11px] text-white/30">
                Skip weekends — Sat &amp; Sun
              </p>
            )}
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between">
            <span className={labelClass} style={{ marginBottom: 0 }}>Active</span>
            <button
              type="button"
              onClick={() => setIsActive(a => !a)}
              className="relative w-10 h-5 rounded-full transition-colors"
              style={{ backgroundColor: isActive ? '#0ABFA3' : 'rgba(255,255,255,0.12)' }}
              aria-checked={isActive}
              role="switch"
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: isActive ? '22px' : '2px' }}
              />
            </button>
          </div>

          {error && (
            <p className="font-body text-sm text-[#F87171]">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/[0.07]">
          <button
            type="button"
            onClick={onClose}
            className="font-condensed font-bold text-[11px] uppercase tracking-[0.1em] px-4 py-2 rounded text-white/40 hover:text-white/70 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="font-condensed font-bold text-[11px] uppercase tracking-[0.1em] px-5 py-2 rounded bg-[#C9302A] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Habit'}
          </button>
        </div>
      </div>
    </div>
  )
}
