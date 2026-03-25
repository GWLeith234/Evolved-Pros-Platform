import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, fonts } from '@/lib/theme'
import { EventCard } from './EventCard'
import { Event } from '@/lib/types'

interface EventCalendarProps {
  events: Event[]
}

export function EventCalendar({ events }: EventCalendarProps) {
  if (events.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No upcoming events scheduled</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.sm,
  },
  empty: {
    padding:    spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize:   14,
    color:      colors.textMuted,
  },
})
