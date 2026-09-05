'use client'

import type { Database } from '@evolved-pros/db'

type NotifType = Database['public']['Tables']['notifications']['Row']['type']
export type FilterValue = NotifType | 'all' | 'wig' | 'progress' | 'content'

interface FilterItem {
  value: FilterValue
  label: string
  count: number
}

interface NotifFilterProps {
  active: FilterValue
  counts: Partial<Record<FilterValue, number>>
  onChange: (value: FilterValue) => void
}

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all',               label: 'All Notifications' },
  { value: 'wig',               label: 'WIG' },
  { value: 'progress',          label: 'Progress' },
  { value: 'content',           label: 'Content' },
  { value: 'community_reply',   label: 'Community' },
  { value: 'course_unlock',     label: 'Academy' },
  { value: 'event_reminder',    label: 'Events' },
  { value: 'system_billing',    label: 'System' },
]

export function NotifFilter({ active, counts, onChange }: NotifFilterProps) {
  return (
    <aside
      className="w-[220px] flex-shrink-0 flex flex-col pt-5 pb-4"
      style={{ backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border-color)' }}
    >
      <p
        className="px-5 mb-1 font-condensed font-bold uppercase tracking-[0.2em] text-[12px]"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Filter
      </p>

      {FILTERS.map(f => {
        const count = counts[f.value] ?? 0
        const isActive = active === f.value
        return (
          <button
            key={f.value}
            onClick={() => onChange(f.value)}
            className="relative w-full flex items-center justify-between py-[9px] px-5 transition-all duration-150 text-left"
            style={{
              color: isActive ? 'var(--notif-community)' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'var(--notif-unread-wash)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--notif-community)' : '2px solid transparent',
              paddingLeft: isActive ? '18px' : '20px',
            }}
          >
            <span className="font-condensed font-semibold uppercase tracking-[0.12em] text-[12px]">
              {f.label}
            </span>
            {count > 0 && (
              <span
                className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full font-condensed font-bold text-[12px] text-white flex items-center justify-center"
                style={{ backgroundColor: '#ef0e30' }}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}

      <div
        className="mt-auto mx-4 pt-4"
        style={{ borderTop: '1px solid var(--border-color)' }}
      >
        <a
          href="/notifications/preferences"
          className="font-condensed text-[12px] tracking-wide transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)' }}
        >
          Email Preferences →
        </a>
      </div>
    </aside>
  )
}
