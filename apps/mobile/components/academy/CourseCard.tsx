import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, spacing, fonts, radius } from '@/lib/theme'
import { CourseWithProgress } from '@/lib/types'

interface CourseCardProps {
  course: CourseWithProgress
  onPress: () => void
}

const PILLAR_COLORS = [
  colors.teal,
  colors.navy,
  colors.gold,
  colors.red,
  colors.textMuted,
  colors.navyDeep,
]

export function CourseCard({ course, onPress }: CourseCardProps) {
  const isLocked = !course.hasAccess
  const accentColor = PILLAR_COLORS[(course.pillar_number - 1) % PILLAR_COLORS.length]

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLocked}
      activeOpacity={0.8}
      style={[styles.card, isLocked && styles.cardLocked]}
    >
      {/* Thumbnail strip */}
      <View style={[styles.thumbnail, { backgroundColor: accentColor }]}>
        <Text style={styles.pillarNumber}>P{course.pillar_number}</Text>
        {isLocked && (
          <View style={styles.lockOverlay}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.pillarLabel}>Pillar {course.pillar_number}</Text>
          {course.required_tier === 'pro' && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>Pro</Text>
            </View>
          )}
        </View>
        <Text style={styles.title} numberOfLines={2}>{course.title}</Text>

        {/* Progress bar */}
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${course.progressPct}%` as `${number}%`, backgroundColor: accentColor },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {course.completedLessons}/{course.totalLessons}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection:   'row',
    backgroundColor: colors.white,
    borderRadius:    radius.md,
    marginHorizontal: spacing.md,
    marginBottom:    spacing.sm,
    borderWidth:     1,
    borderColor:     colors.border,
    overflow:        'hidden',
  },
  cardLocked: {
    opacity: 0.7,
  },
  thumbnail: {
    width:          72,
    alignItems:     'center',
    justifyContent: 'center',
    position:       'relative',
  },
  pillarNumber: {
    fontFamily:  fonts.serif,
    fontSize:    24,
    fontWeight:  '700',
    color:       'rgba(255,255,255,0.9)',
  },
  lockOverlay: {
    position:        'absolute',
    top:             0,
    left:            0,
    right:           0,
    bottom:          0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  lockIcon: {
    fontSize: 18,
  },
  content: {
    flex:    1,
    padding: spacing.md,
    gap:     4,
  },
  header: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.xs,
  },
  pillarLabel: {
    fontFamily:    fonts.condensed,
    fontSize:      9,
    fontWeight:    '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color:         colors.textMuted,
  },
  proBadge: {
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderRadius:    3,
    paddingHorizontal: 5,
    paddingVertical:   1,
  },
  proBadgeText: {
    fontFamily:    fonts.condensed,
    fontSize:      8,
    fontWeight:    '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color:         colors.gold,
  },
  title: {
    fontFamily:  fonts.condensed,
    fontSize:    14,
    fontWeight:  '700',
    color:       colors.navyDark,
    lineHeight:  19,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.sm,
    marginTop:     spacing.xs,
  },
  progressTrack: {
    flex:            1,
    height:          4,
    backgroundColor: 'rgba(27,60,90,0.08)',
    borderRadius:    2,
    overflow:        'hidden',
  },
  progressFill: {
    height:       4,
    borderRadius: 2,
  },
  progressLabel: {
    fontFamily: fonts.body,
    fontSize:   11,
    color:      colors.textMuted,
    flexShrink: 0,
  },
})
