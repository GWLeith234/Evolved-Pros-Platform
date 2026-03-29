'use client'

import { useState, useCallback } from 'react'
import { EventSidebar } from './EventSidebar'
import { CalendarStrip } from './CalendarStrip'
import { EventList } from './EventList'
import type { EventItem, EventType } from '@/lib/events/types'

interface EventsContentProps {
  events: EventItem[]
  registeredEventIds: string[]
  userTier: string | null
  registrationCount: number
}

const VIEW_ITEMS: { key: 'upcoming' | 'registrations' | 'recordings'; label: string }[] = [
  { key: 'upcoming',      label: 'Upcoming' },
  { key: 'registrations', label: 'My Registrations' },
  { key: 'recordings',    label: 'Recordings' },
]

const TYPE_ITEMS: { key: EventType | null; label: string }[] = [
  { key: null,       label: 'All Types' },
  { key: 'live',     label: 'Live' },
  { key: 'virtual',  label: 'Virtual' },
  { key: 'inperson', label: 'In-Person' },
]

export function EventsContent({ events, registeredEventIds, userTier, registrationCount }: EventsContentProps) {
  const [activeView, setActiveView] = useState<'upcoming' | 'registrations' | 'recordings'>('upcoming')
  const [typeFilter, setTypeFilter] = useState<EventType | null>(null)

  const handleDayClick = useCallback((_date: Date) => {
    // Day click just scrolls to upcoming view — future enhancement could filter by date
    setActiveView('upcoming')
  }, [])

  return (
    <div className="flex" style={{ minHeight: '100%' }}>
      {/* Events sidebar — hidden on mobile */}
      <div className="hidden md:flex flex-shrink-0">
        <EventSidebar
          activeView={activeView}
          activeType={typeFilter}
          registrationCount={registrationCount}
          onViewChange={setActiveView}
          onTypeChange={setTypeFilter}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0" style={{ backgroundColor: '#faf9f7' }}>
        {/* Mobile filter row — hidden on desktop */}
        <div
          className="md:hidden flex-shrink-0 overflow-x-auto"
          style={{ backgroundColor: '#112535', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* View pills */}
          <div className="flex gap-2 px-4 pt-2 pb-1">
            {VIEW_ITEMS.map(item => {
              const active = activeView === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveView(item.key)}
                  className="flex-shrink-0 font-condensed font-semibold uppercase tracking-wide"
                  style={{
                    fontSize: '11px',
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    backgroundColor: active ? 'rgba(104,162,185,0.2)' : 'rgba(255,255,255,0.06)',
                    color: active ? '#68a2b9' : 'rgba(255,255,255,0.5)',
                    border: `1px solid ${active ? 'rgba(104,162,185,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.label}{item.key === 'registrations' && registrationCount > 0 ? ` (${registrationCount})` : ''}
                </button>
              )
            })}
          </div>
          {/* Type filter pills */}
          <div className="flex gap-2 px-4 pb-2 pt-1">
            {TYPE_ITEMS.map(item => {
              const active = typeFilter === item.key
              return (
                <button
                  key={item.key ?? 'all'}
                  onClick={() => setTypeFilter(item.key)}
                  className="flex-shrink-0 font-condensed font-semibold uppercase tracking-wide"
                  style={{
                    fontSize: '10px',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    backgroundColor: active ? 'rgba(239,14,48,0.15)' : 'rgba(255,255,255,0.04)',
                    color: active ? '#ef0e30' : 'rgba(255,255,255,0.4)',
                    border: `1px solid ${active ? 'rgba(239,14,48,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 px-4 md:px-8 py-6">
          <div className="max-w-3xl mx-auto">
            <CalendarStrip events={events} onDayClick={handleDayClick} />

            <EventList
              events={events}
              registeredEventIds={registeredEventIds}
              userTier={userTier}
              view={activeView}
              typeFilter={typeFilter}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
