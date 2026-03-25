import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, fonts } from '@/lib/theme'
import { Stat } from '@/lib/types'

interface StatRowProps {
  stats?: Stat[]
}

const PLACEHOLDER_STATS: Stat[] = [
  { label: 'Members',  value: '—' },
  { label: 'Pillars',  value: '—' },
  { label: 'Progress', value: '—' },
  { label: 'Posts',    value: '—' },
]

export function StatRow({ stats = PLACEHOLDER_STATS }: StatRowProps) {
  const displayStats = stats.length > 0 ? stats : PLACEHOLDER_STATS

  return (
    <View style={styles.grid}>
      {displayStats.slice(0, 4).map((stat, i) => (
        <View key={i} style={styles.cell}>
          <Text style={[styles.value, stat.color ? { color: stat.color } : null]}>
            {stat.value}
          </Text>
          <Text style={styles.label}>{stat.label}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    padding:        spacing.md,
    gap:            spacing.sm,
  },
  cell: {
    width:          '47%',
    backgroundColor: colors.white,
    borderRadius:   8,
    padding:        spacing.md,
    borderWidth:    1,
    borderColor:    colors.border,
    alignItems:     'center',
  },
  value: {
    fontFamily:  fonts.serif,
    fontSize:    28,
    fontWeight:  '700',
    color:       colors.navyDark,
    marginBottom: 2,
  },
  label: {
    fontFamily:    fonts.condensed,
    fontSize:      9,
    fontWeight:    '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color:         colors.textMuted,
  },
})
