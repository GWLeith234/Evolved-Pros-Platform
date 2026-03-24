'use client'

import { useState } from 'react'

type TriOption = 'immediate' | 'digest' | 'off'
type BinOption = 'immediate' | 'off'

interface Prefs {
  community_reply: TriOption
  community_mention: TriOption
  event_reminder: BinOption
  course_unlock: BinOption
  system_billing: 'immediate'
}

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

export function EmailPrefsForm({ initialPrefs }: EmailPrefsFormProps) {
  const [prefs, setPrefs] = useState<Prefs>(initialPrefs)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_preferences: prefs }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Save failed')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  function RadioGroup<T extends string>({
    label,
    value,
    options,
    onChange,
    disabled,
  }: {
    label: string
    value: T
    options: { value: T; label: string }[]
    onChange: (v: T) => void
    disabled?: boolean
  }) {
    return (
      <div
        className="flex items-center justify-between py-3 px-4"
        style={{ borderBottom: '1px solid rgba(27,60,90,0.06)' }}
      >
        <span className="font-body font-medium text-[13px] text-[#1b3c5a]">{label}</span>
        <div className="flex items-center gap-1">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className="font-condensed font-semibold uppercase text-[10px] rounded px-3 py-1.5 transition-all"
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
        className="rounded-lg overflow-hidden mb-5"
        style={{ border: '1px solid rgba(27,60,90,0.1)' }}
      >
        <div style={{ backgroundColor: 'rgba(27,60,90,0.03)' }}>
          <div className="grid grid-cols-[1fr_auto] px-4 py-2">
            <span className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96]">
              Notification Type
            </span>
            <span className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96]">
              Frequency
            </span>
          </div>
        </div>

        <RadioGroup
          label="Community Replies"
          value={prefs.community_reply}
          options={TRI_OPTIONS}
          onChange={v => setPrefs(p => ({ ...p, community_reply: v }))}
        />
        <RadioGroup
          label="Community Mentions"
          value={prefs.community_mention}
          options={TRI_OPTIONS}
          onChange={v => setPrefs(p => ({ ...p, community_mention: v }))}
        />
        <RadioGroup
          label="Event Reminders"
          value={prefs.event_reminder}
          options={BIN_OPTIONS}
          onChange={v => setPrefs(p => ({ ...p, event_reminder: v }))}
        />
        <RadioGroup
          label="Course Unlocks"
          value={prefs.course_unlock}
          options={BIN_OPTIONS}
          onChange={v => setPrefs(p => ({ ...p, course_unlock: v }))}
        />
        <RadioGroup
          label="Billing / System"
          value={prefs.system_billing}
          options={[{ value: 'immediate' as const, label: 'Immediate' }]}
          onChange={() => {/* cannot disable */}}
          disabled={true}
        />
      </div>

      {error && (
        <p className="font-condensed text-[11px] text-[#ef0e30] mb-3">{error}</p>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-6 py-2.5 transition-all"
          style={{ backgroundColor: '#1b3c5a', color: 'white', opacity: saving ? 0.7 : 1 }}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
        {saved && (
          <span className="font-condensed text-[11px]" style={{ color: '#68a2b9' }}>
            Saved ✓
          </span>
        )}
      </div>
    </div>
  )
}
