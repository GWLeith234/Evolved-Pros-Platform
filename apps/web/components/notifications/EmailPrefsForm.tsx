'use client'

import { useEffect, useRef, useState } from 'react'
import { useToast } from '@/lib/toast'

type TriOption = 'immediate' | 'digest' | 'off'
type BinOption = 'immediate' | 'off'

interface Prefs {
  community_reply: TriOption
  community_mention: TriOption
  event_reminder: BinOption
  course_unlock: BinOption
  system_billing: 'immediate'
}

type PrefKey = keyof Prefs

interface EmailPrefsFormProps {
  initialPrefs: Prefs
}

const TRI_OPTIONS: { value: TriOption; label: string }[] = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'digest',    label: 'Daily Digest' },
  { value: 'off',       label: 'Off' },
]

const BIN_OPTIONS: { value: BinOption; label: string }[] = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'off',       label: 'Off' },
]

const DEBOUNCE_MS = 400

export function EmailPrefsForm({ initialPrefs }: EmailPrefsFormProps) {
  const { showToast } = useToast()
  const [prefs, setPrefs] = useState<Prefs>(initialPrefs)
  const [pendingKey, setPendingKey] = useState<PrefKey | null>(null)

  const latestPrefsRef = useRef<Prefs>(initialPrefs)
  const lastSavedRef = useRef<Prefs>(initialPrefs)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function scheduleSave(key: PrefKey, next: Prefs) {
    latestPrefsRef.current = next
    setPendingKey(key)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { void runSave() }, DEBOUNCE_MS)
  }

  async function runSave() {
    const snapshot = latestPrefsRef.current
    const prevSaved = lastSavedRef.current
    try {
      const res = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_preferences: snapshot }),
      })
      if (!res.ok) throw new Error('Save failed')
      lastSavedRef.current = snapshot
      showToast('Preferences saved', 'success')
    } catch {
      // Revert UI to last successfully saved state on failure
      latestPrefsRef.current = prevSaved
      setPrefs(prevSaved)
      showToast('Could not save preferences. Please try again.', 'error')
    } finally {
      setPendingKey(null)
    }
  }

  function handleChange<K extends PrefKey>(key: K, value: Prefs[K]) {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    scheduleSave(key, next)
  }

  function RadioGroup<T extends string>({
    rowKey,
    label,
    value,
    options,
    onChange,
    disabled,
  }: {
    rowKey: PrefKey
    label: string
    value: T
    options: { value: T; label: string }[]
    onChange: (v: T) => void
    disabled?: boolean
  }) {
    const isSaving = pendingKey === rowKey
    return (
      <div
        className="flex items-center justify-between py-3 px-4"
        style={{ borderBottom: '1px solid rgba(27,60,90,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <span className="font-body font-medium text-[13px] text-[#1b3c5a]">{label}</span>
          {isSaving && (
            <span
              className="inline-block rounded-full border-2 border-[#1b3c5a] border-t-transparent animate-spin"
              style={{ width: 12, height: 12 }}
              aria-label="Saving"
            />
          )}
        </div>
        <div className="flex items-center gap-1">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className="font-condensed font-semibold uppercase text-[12px] rounded px-3 py-1.5 transition-all"
              style={{
                backgroundColor: value === opt.value ? '#1b3c5a' : 'transparent',
                color: value === opt.value ? 'white' : '#7a8a96',
                border: value === opt.value ? '1px solid #1b3c5a' : '1px solid rgba(27,60,90,0.15)',
                opacity: disabled ? 0.6 : 1,
                cursor: disabled ? 'default' : 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        className="rounded-lg overflow-hidden mb-2"
        style={{ border: '1px solid rgba(27,60,90,0.1)' }}
      >
        <div style={{ backgroundColor: 'rgba(27,60,90,0.03)' }}>
          <div className="grid grid-cols-[1fr_auto] px-4 py-2">
            <span className="font-condensed font-bold uppercase tracking-[0.18em] text-[12px] text-[#7a8a96]">
              Notification Type
            </span>
            <span className="font-condensed font-bold uppercase tracking-[0.18em] text-[12px] text-[#7a8a96]">
              Frequency
            </span>
          </div>
        </div>

        <RadioGroup
          rowKey="community_reply"
          label="Community Replies"
          value={prefs.community_reply}
          options={TRI_OPTIONS}
          onChange={v => handleChange('community_reply', v)}
        />
        <RadioGroup
          rowKey="community_mention"
          label="Community Mentions"
          value={prefs.community_mention}
          options={TRI_OPTIONS}
          onChange={v => handleChange('community_mention', v)}
        />
        <RadioGroup
          rowKey="event_reminder"
          label="Event Reminders"
          value={prefs.event_reminder}
          options={BIN_OPTIONS}
          onChange={v => handleChange('event_reminder', v)}
        />
        <RadioGroup
          rowKey="course_unlock"
          label="Course Unlocks"
          value={prefs.course_unlock}
          options={BIN_OPTIONS}
          onChange={v => handleChange('course_unlock', v)}
        />
        <RadioGroup
          rowKey="system_billing"
          label="Billing / System"
          value={prefs.system_billing}
          options={[{ value: 'immediate' as const, label: 'Immediate' }]}
          onChange={() => {/* cannot disable */}}
          disabled={true}
        />
      </div>

      <p className="font-condensed text-[12px] text-[#7a8a96]">
        Changes save automatically.
      </p>
    </div>
  )
}
