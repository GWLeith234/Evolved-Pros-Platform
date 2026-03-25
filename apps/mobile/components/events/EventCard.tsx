import React from 'react'
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native'
import { colors, spacing, fonts } from '@/lib/theme'
import { Event } from '@/lib/types'
import { Badge } from '@/components/shared/Badge'

interface EventCardProps {
  event: Event
}

type BadgeVariant = 'teal' | 'red' | 'gold'

const TYPE_VARIANT: Record<Event['type'], BadgeVariant> = {
  'Live':      'red',
  'Virtual':   'teal',
  'In-Person': 'gold',
}

function formatDate(iso: string): { day: string; month: string; time: string } {
  const d = new Date(iso)
  return {
    day:   d.getDate().toString(),
    month: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
    time:  d.toLocaleString('en', { hour: 'numeric', minute: '2-digit', hour12: true }),
  }
}

export function EventCard({ event }: EventCardProps) {
  const { day, month, time } = formatDate(event.starts_at)

  return (
    <View style={styles.card}>
      <View style={styles.dateBlock}>
        <Text style={styles.dateDay}>{day}</Text>
        <Text style={styles.dateMonth}>{month}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Badge label={event.type} variant={TYPE_VARIANT[event.type]} />
          <Text style={styles.time}>{time}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
        {event.description && (
          <Text style={styles.description} numberOfLines={2}>{event.description}</Text>
        )}
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
}

const styles = StyleSheet.create({
  card: {
    flexDirection:   'row',
    backgroundColor: colors.white,
    borderRadius:    8,
    marginHorizontal: spacing.md,
    marginBottom:    spacing.sm,
    padding:         spacing.md,
    borderWidth:     1,
    borderColor:     colors.border,
    gap:             spacing.md,
    alignItems:      'flex-start',
  },
  dateBlock: {
    backgroundColor: colors.navyDark,
    borderRadius:    6,
    width:           48,
    height:          52,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  dateDay: {
    fontFamily: fonts.serif,
    fontSize:   22,
    fontWeight: '700',
    color:      colors.white,
    lineHeight: 24,
  },
  dateMonth: {
    fontFamily:    fonts.condensed,
    fontSize:      9,
    fontWeight:    '700',
    letterSpacing: 0.8,
    color:         'rgba(255,255,255,0.5)',
  },
  body: {
    flex: 1,
    gap:  4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.sm,
  },
  time: {
    fontFamily: fonts.body,
    fontSize:   11,
    color:      colors.textMuted,
  },
  title: {
    fontFamily:  fonts.condensed,
    fontSize:    14,
    fontWeight:  '700',
    color:       colors.navyDark,
    lineHeight:  20,
  },
  description: {
    fontFamily: fonts.body,
    fontSize:   12,
    color:      colors.textMuted,
    lineHeight: 17,
  },
  registerBtn: {
    backgroundColor:   colors.red,
    paddingHorizontal: spacing.sm,
    paddingVertical:   6,
    borderRadius:      4,
    flexShrink:        0,
    alignSelf:         'center',
  },
  registerText: {
    fontFamily:    fonts.condensed,
    fontSize:      9,
    fontWeight:    '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color:         colors.white,
  },
})
