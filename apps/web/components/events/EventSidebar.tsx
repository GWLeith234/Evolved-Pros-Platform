'use client'

import type { EventType } from '@/lib/events/types'

interface EventSidebarProps {
  activeView: 'upcoming' | 'registrations' | 'recordings'
  activeType: EventType | null
  registrationCount: number
  onViewChange: (view: 'upcoming' | 'registrations' | 'recordings') => void
  onTypeChange: (type: EventType | null) => void
}

const VIEW_ITEMS: { key: EventSidebarProps['activeView']; label: string }[] = [
  { key: 'upcoming',      label: 'Upcoming' },
  { key: 'registrations', label: 'My Registrations' },
  { key: 'recordings',    label: 'Recordings' },
]

const TYPE_ITEMS: { key: EventType; label: string }[] = [
  { key: 'live',     label: 'Live Sessions' },
  { key: 'virtual',  label: 'Virtual' },
  { key: 'inperson', label: 'In-Person' },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-5 mt-5 mb-1 font-condensed font-bold uppercase tracking-[0.22em] text-[9px]"
      style={{ color: 'rgba(255,255,255,0.2)' }}>
      {children}
    </p>
  )
}

function SidebarBtn({
  active, onClick, children, badge,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  badge?: number
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 py-[9px] transition-all duration-150 text-left"
      style={{
        color: active ? '#68a2b9' : 'rgba(255,255,255,0.5)',
        backgroundColor: active ? 'rgba(255,255,255,0.06)' : 'transparent',
        borderLeft: active ? '2px solid #68a2b9' : '2px solid transparent',
        paddingLeft: active ? '18px' : '20px',
      }}
      onMouseEnter={e => {
        if (!active) {
          const el = e.currentTarget as HTMLElement
          el.style.backgroundColor = 'rgba(255,255,255,0.04)'
          el.style.color = 'rgba(255,255,255,0.8)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          const el = e.currentTarget as HTMLElement
          el.style.backgroundColor = 'transparent'
          el.style.color = 'rgba(255,255,255,0.5)'
        }
      }}
    >
      <span className="font-condensed font-semibold text-[12px] tracking-wide flex-1 truncate">
        {children}
      </span>
      {badge !== undefined && badge > 0 && (
        <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full font-condensed font-bold text-[9px] text-white flex items-center justify-center"
          style={{ backgroundColor: '#68a2b9' }}>
          {badge}
        </span>
      )}
    </button>
  )
}

export function EventSidebar({
  activeView, activeType, registrationCount, onViewChange, onTypeChange,
}: EventSidebarProps) {
  return (
    <aside
      className="w-[220px] flex-shrink-0 flex flex-col py-3 overflow-y-auto"
      style={{ backgroundColor: '#112535', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      <SectionLabel>View</SectionLabel>
      {VIEW_ITEMS.map(item => (
        <SidebarBtn
          key={item.key}
          active={activeView === item.key}
          onClick={() => onViewChange(item.key)}
          badge={item.key === 'registrations' ? registrationCount : undefined}
        >
          {item.label}
        </SidebarBtn>
      ))}

      <SectionLabel>Filter by Type</SectionLabel>
      <SidebarBtn
        active={activeType === null}
        onClick={() => onTypeChange(null)}
      >
        All Types
      </SidebarBtn>
      {TYPE_ITEMS.map(item => (
        <SidebarBtn
          key={item.key}
          active={activeType === item.key}
          onClick={() => onTypeChange(activeType === item.key ? null : item.key)}
        >
          {item.label}
        </SidebarBtn>
      ))}
    </aside>
  )
}
