'use client'

import type { Database } from '@evolved-pros/db'

type NotifType = Database['public']['Tables']['notifications']['Row']['type']
type FilterValue = NotifType | 'all'

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
  { value: 'community_reply',   label: 'Community' },
  { value: 'course_unlock',     label: 'Academy' },
  { value: 'event_reminder',    label: 'Events' },
  { value: 'system_billing',    label: 'System' },
]

export function NotifFilter({ active, counts, onChange }: NotifFilterProps) {
  return (
    <aside
      className="w-[220px] flex-shrink-0 flex flex-col pt-5 pb-4"
      style={{ backgroundColor: '#112535', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      <p
        className="px-5 mb-1 font-condensed font-bold uppercase tracking-[0.2em] text-[9px]"
        style={{ color: 'rgba(255,255,255,0.25)' }}
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
              color: isActive ? '#68a2b9' : 'rgba(255,255,255,0.5)',
              backgroundColor: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
              borderLeft: isActive ? '2px solid #68a2b9' : '2px solid transparent',
              paddingLeft: isActive ? '18px' : '20px',
            }}
          >
            <span className="font-condensed font-semibold uppercase tracking-[0.12em] text-[12px]">
              {f.label}
            </span>
            {count > 0 && (
              <span
                className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full font-condensed font-bold text-[9px] text-white flex items-center justify-center"
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
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <a
          href="/notifications/preferences"
          className="font-condensed text-[11px] tracking-wide transition-colors"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)' }}
        >
          Email Preferences →
        </a>
      </div>
    </aside>
  )
}
