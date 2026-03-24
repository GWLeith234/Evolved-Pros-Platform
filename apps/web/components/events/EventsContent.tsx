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

export function EventsContent({ events, registeredEventIds, userTier, registrationCount }: EventsContentProps) {
  const [activeView, setActiveView] = useState<'upcoming' | 'registrations' | 'recordings'>('upcoming')
  const [typeFilter, setTypeFilter] = useState<EventType | null>(null)

  const handleDayClick = useCallback((_date: Date) => {
    // Day click just scrolls to upcoming view — future enhancement could filter by date
    setActiveView('upcoming')
  }, [])

  return (
    <div className="flex" style={{ minHeight: '100%' }}>
      {/* Events sidebar */}
      <EventSidebar
        activeView={activeView}
        activeType={typeFilter}
        registrationCount={registrationCount}
        onViewChange={setActiveView}
        onTypeChange={setTypeFilter}
      />

      {/* Main content */}
      <div className="flex-1 px-8 py-6" style={{ backgroundColor: '#faf9f7' }}>
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
  )
}
