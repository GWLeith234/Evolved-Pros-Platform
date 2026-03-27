'use client'

import { useState } from 'react'

interface NotificationPrefs {
  new_replies: boolean
  new_likes: boolean
  new_members: boolean
  event_reminders: boolean
  weekly_digest: boolean
}

interface NotificationPrefsFormProps {
  initialPrefs: NotificationPrefs
}

const DEFAULT_PREFS: NotificationPrefs = {
  new_replies:     true,
  new_likes:       true,
  new_members:     false,
  event_reminders: true,
  weekly_digest:   true,
}

const TOGGLE_ITEMS: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  {
    key:         'new_replies',
    label:       'New Replies',
    description: 'When someone replies to your post',
  },
  {
    key:         'new_likes',
    label:       'New Likes',
    description: 'When someone likes your post',
  },
  {
    key:         'new_members',
    label:       'New Members',
    description: 'When a new member joins the community',
  },
  {
    key:         'event_reminders',
    label:       'Event Reminders',
    description: '24 hours before an event you registered for',
  },
  {
    key:         'weekly_digest',
    label:       'Weekly Digest',
    description: 'A weekly summary of community activity',
  },
]

export function NotificationPrefsForm({ initialPrefs }: NotificationPrefsFormProps) {
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    ...DEFAULT_PREFS,
    ...initialPrefs,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleToggle(key: keyof NotificationPrefs) {
    const newPrefs = { ...prefs, [key]: !prefs[key] }
    // Optimistic update
    setPrefs(newPrefs)
    setSaved(false)
    setError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_preferences: newPrefs }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Save failed')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      // Revert on failure
      setPrefs(prefs)
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: '1px solid rgba(27,60,90,0.1)' }}
      >
        {TOGGLE_ITEMS.map((item, idx) => (
          <div
            key={item.key}
            className="flex items-center justify-between px-5 py-4"
            style={{
              borderBottom: idx < TOGGLE_ITEMS.length - 1 ? '1px solid rgba(27,60,90,0.06)' : 'none',
            }}
          >
            <div className="flex-1 min-w-0 mr-4">
              <p className="font-body font-semibold text-[13px]" style={{ color: '#1b3c5a' }}>
                {item.label}
              </p>
              <p className="font-body text-[12px] mt-0.5" style={{ color: '#7a8a96' }}>
                {item.description}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[item.key]}
              disabled={saving}
              onClick={() => { void handleToggle(item.key) }}
              className="flex-shrink-0 relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none"
              style={{
                width: '40px',
                height: '22px',
                backgroundColor: prefs[item.key] ? '#1b3c5a' : 'rgba(27,60,90,0.15)',
                opacity: saving ? 0.7 : 1,
                cursor: saving ? 'default' : 'pointer',
              }}
            >
              <span
                className="inline-block rounded-full bg-white transition-transform duration-200"
                style={{
                  width: '16px',
                  height: '16px',
                  transform: prefs[item.key] ? 'translateX(21px)' : 'translateX(3px)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 h-5 flex items-center">
        {error && (
          <p className="font-condensed text-[11px]" style={{ color: '#ef0e30' }}>{error}</p>
        )}
        {saved && !error && (
          <p className="font-condensed text-[11px]" style={{ color: '#68a2b9' }}>Saved</p>
        )}
      </div>
    </div>
  )
}
