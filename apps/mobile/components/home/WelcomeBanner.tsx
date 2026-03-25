import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, spacing, fonts } from '@/lib/theme'

interface WelcomeBannerProps {
  name?: string | null
  week?: number
  unreadCount?: number
}

export function WelcomeBanner({ name, week = 1, unreadCount = 0 }: WelcomeBannerProps) {
  const router = useRouter()
  const displayName = name?.split(' ')[0] ?? 'Member'

  return (
    <View style={styles.banner}>
      <View style={styles.weekRow}>
        <Text style={styles.weekLabel}>Week {week} of Your Journey</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unreadCount}</Text>
          </View>
        )}
      </View>
      <Text style={styles.greeting}>Welcome back, {displayName}</Text>
      <View style={styles.ctaRow}>
        <TouchableOpacity
          style={[styles.cta, styles.ctaPrimary]}
          onPress={() => router.push('/(tabs)/academy')}
        >
          <Text style={styles.ctaPrimaryText}>Continue Learning</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cta, styles.ctaSecondary]}
          onPress={() => router.push('/(tabs)/community')}
        >
          <Text style={styles.ctaSecondaryText}>Community</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.navyDark,
    padding:         spacing.lg,
    paddingTop:      spacing.xl,
  },
  weekRow: {
    flexDirection:  'row',
    alignItems:     'center',
    marginBottom:   spacing.xs,
  },
  weekLabel: {
    fontFamily:    fonts.condensed,
    fontSize:      10,
    fontWeight:    '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color:         'rgba(255,255,255,0.4)',
  },
  unreadBadge: {
    marginLeft:      spacing.sm,
    backgroundColor: colors.red,
    borderRadius:    10,
    paddingHorizontal: 6,
    paddingVertical:   1,
  },
  unreadText: {
    color:      colors.white,
    fontSize:   10,
    fontWeight: '700',
  },
  greeting: {
    fontFamily:  fonts.serif,
    fontSize:    26,
    fontWeight:  '700',
    color:       colors.white,
    marginBottom: spacing.lg,
  },
  ctaRow: {
    flexDirection: 'row',
    gap:           spacing.sm,
  },
  cta: {
    flex:              1,
    paddingVertical:   11,
    borderRadius:      4,
    alignItems:        'center',
  },
  ctaPrimary: {
    backgroundColor: colors.red,
  },
  ctaPrimaryText: {
    fontFamily:    fonts.condensed,
    fontSize:      11,
    fontWeight:    '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color:         colors.white,
  },
  ctaSecondary: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  ctaSecondaryText: {
    fontFamily:    fonts.condensed,
    fontSize:      11,
    fontWeight:    '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color:         'rgba(255,255,255,0.7)',
  },
})
