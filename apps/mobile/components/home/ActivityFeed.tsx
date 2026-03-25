import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, fonts } from '@/lib/theme'
import { ActivityItem } from '@/lib/types'
import { Label } from '@/components/shared/Typography'

interface ActivityFeedProps {
  items?: ActivityItem[]
}

const DOT_COLOR: Record<ActivityItem['type'], string> = {
  lesson_complete: colors.success,
  post:            colors.teal,
  event_register:  colors.gold,
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function ActivityFeed({ items = [] }: ActivityFeedProps) {
  return (
    <View style={styles.container}>
      <Label style={styles.sectionLabel}>Recent Activity</Label>
      {items.length === 0 ? (
        <Text style={styles.empty}>No recent activity</Text>
      ) : (
        items.slice(0, 5).map(item => (
          <View key={item.id} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: DOT_COLOR[item.type] }]} />
            <Text style={styles.text} numberOfLines={1}>{item.text}</Text>
            <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
          </View>
        ))
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.lg,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    paddingVertical: spacing.xs + 2,
    gap:           spacing.sm,
  },
  dot: {
    width:        8,
    height:       8,
    borderRadius: 4,
    flexShrink:   0,
  },
  text: {
    flex:       1,
    fontFamily: fonts.body,
    fontSize:   13,
    color:      colors.navyDark,
  },
  time: {
    fontFamily: fonts.body,
    fontSize:   11,
    color:      colors.textMuted,
    flexShrink: 0,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize:   13,
    color:      colors.textMuted,
    paddingVertical: spacing.sm,
  },
})
