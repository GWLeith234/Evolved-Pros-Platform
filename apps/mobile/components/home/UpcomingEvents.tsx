import React from 'react'
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native'
import { colors, spacing, fonts } from '@/lib/theme'
import { Event } from '@/lib/types'
import { Label } from '@/components/shared/Typography'

interface UpcomingEventsProps {
  events?: Event[]
}

function formatDate(iso: string): { day: string; month: string } {
  const d = new Date(iso)
  return {
    day:   d.getDate().toString(),
    month: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
  }
}

export function UpcomingEvents({ events = [] }: UpcomingEventsProps) {
  return (
    <View style={styles.container}>
      <Label style={styles.sectionLabel}>Upcoming Events</Label>
      {events.length === 0 ? (
        <Text style={styles.empty}>No upcoming events</Text>
      ) : (
        events.slice(0, 2).map(event => {
          const { day, month } = formatDate(event.starts_at)
          return (
            <View key={event.id} style={styles.card}>
              <View style={styles.dateBlock}>
                <Text style={styles.dateDay}>{day}</Text>
                <Text style={styles.dateMonth}>{month}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
              </View>
              {event.registration_url && (
                <TouchableOpacity
                  style={styles.registerBtn}
                  onPress={() => Linking.openURL(event.registration_url!)}
                >
                  <Text style={styles.registerText}>Register</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        })
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingBottom:     spacing.xl,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: colors.white,
    borderRadius:    8,
    padding:         spacing.md,
    marginBottom:    spacing.sm,
    borderWidth:     1,
    borderColor:     colors.border,
    gap:             spacing.md,
  },
  dateBlock: {
    backgroundColor: colors.navyDark,
    borderRadius:    6,
    width:           44,
    height:          44,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  dateDay: {
    fontFamily:  fonts.serif,
    fontSize:    18,
    fontWeight:  '700',
    color:       colors.white,
    lineHeight:  20,
  },
  dateMonth: {
    fontFamily:    fonts.condensed,
    fontSize:      8,
    fontWeight:    '700',
    letterSpacing: 0.8,
    color:         'rgba(255,255,255,0.5)',
  },
  info: {
    flex: 1,
  },
  title: {
    fontFamily:  fonts.condensed,
    fontSize:    13,
    fontWeight:  '600',
    color:       colors.navyDark,
    lineHeight:  18,
  },
  registerBtn: {
    backgroundColor: colors.red,
    paddingHorizontal: spacing.sm,
    paddingVertical:   6,
    borderRadius:      4,
    flexShrink:        0,
  },
  registerText: {
    fontFamily:    fonts.condensed,
    fontSize:      10,
    fontWeight:    '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color:         colors.white,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize:   13,
    color:      colors.textMuted,
    paddingVertical: spacing.sm,
  },
})
