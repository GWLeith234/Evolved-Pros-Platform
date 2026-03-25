import React from 'react'
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native'
import { colors, spacing, fonts } from '@/lib/theme'
import { Channel } from '@/lib/types'

interface ChannelListProps {
  channels: Channel[]
  active: string
  onSelect: (slug: string) => void
}

export function ChannelList({ channels, active, onSelect }: ChannelListProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {channels.map(ch => {
        const isActive = ch.slug === active
        return (
          <TouchableOpacity
            key={ch.slug}
            onPress={() => onSelect(ch.slug)}
            style={[styles.chip, isActive && styles.chipActive]}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {ch.label}
            </Text>
            {(ch.unreadCount ?? 0) > 0 && !isActive && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{ch.unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    maxHeight: 48,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.sm,
    gap:               spacing.xs,
    flexDirection:     'row',
    alignItems:        'center',
  },
  chip: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical:   6,
    borderRadius:      20,
    backgroundColor:  'rgba(27,60,90,0.06)',
    gap:               4,
  },
  chipActive: {
    backgroundColor: colors.teal,
  },
  chipText: {
    fontFamily:    fonts.condensed,
    fontSize:      11,
    fontWeight:    '700',
    letterSpacing: 0.5,
    color:         colors.textMuted,
  },
  chipTextActive: {
    color: colors.white,
  },
  unreadBadge: {
    backgroundColor: colors.red,
    borderRadius:    8,
    paddingHorizontal: 5,
    paddingVertical:   1,
    minWidth:          16,
    alignItems:        'center',
  },
  unreadText: {
    color:      colors.white,
    fontSize:   9,
    fontWeight: '700',
  },
})
