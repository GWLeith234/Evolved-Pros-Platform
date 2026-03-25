import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, spacing, fonts } from '@/lib/theme'
import { LessonWithProgress } from '@/lib/types'

interface LessonRowProps {
  lesson: LessonWithProgress
  index: number
  onPress: () => void
  isLocked?: boolean
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function LessonRow({ lesson, index, onPress, isLocked = false }: LessonRowProps) {
  const isCompleted = !!lesson.completedAt

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLocked}
      activeOpacity={0.7}
      style={[styles.row, isLocked && styles.rowLocked]}
    >
      {/* Status indicator */}
      <View style={[styles.status, isCompleted && styles.statusCompleted]}>
        {isCompleted ? (
          <Text style={styles.checkmark}>✓</Text>
        ) : (
          <Text style={styles.number}>{index + 1}</Text>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{lesson.title}</Text>
        {lesson.duration_seconds && (
          <Text style={styles.duration}>{formatDuration(lesson.duration_seconds)}</Text>
        )}
      </View>

      {isLocked ? (
        <Text style={styles.lockIcon}>🔒</Text>
      ) : (
        <Text style={styles.chevron}>›</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap:               spacing.md,
  },
  rowLocked: {
    opacity: 0.5,
  },
  status: {
    width:          28,
    height:         28,
    borderRadius:   14,
    backgroundColor: 'rgba(27,60,90,0.08)',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  statusCompleted: {
    backgroundColor: colors.success,
  },
  checkmark: {
    color:      colors.white,
    fontSize:   14,
    fontWeight: '700',
  },
  number: {
    fontFamily:  fonts.condensed,
    fontSize:    12,
    fontWeight:  '700',
    color:       colors.textMuted,
  },
  info: {
    flex: 1,
    gap:  2,
  },
  title: {
    fontFamily:  fonts.condensed,
    fontSize:    13,
    fontWeight:  '600',
    color:       colors.navyDark,
  },
  duration: {
    fontFamily: fonts.body,
    fontSize:   11,
    color:      colors.textMuted,
  },
  lockIcon: {
    fontSize: 14,
  },
  chevron: {
    fontSize:   20,
    color:      colors.textMuted,
    lineHeight: 22,
  },
})
