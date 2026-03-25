import React from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { colors } from '@/lib/theme'

type BadgeVariant = 'teal' | 'red' | 'gold' | 'navy' | 'success'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  style?: ViewStyle
}

const VARIANT_COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
  teal:    { bg: 'rgba(104,162,185,0.15)', text: colors.teal },
  red:     { bg: 'rgba(239,14,48,0.10)',   text: colors.red },
  gold:    { bg: 'rgba(201,168,76,0.12)',  text: colors.gold },
  navy:    { bg: 'rgba(27,60,90,0.10)',    text: colors.navy },
  success: { bg: 'rgba(42,157,79,0.10)',   text: colors.success },
}

export function Badge({ label, variant = 'teal', style }: BadgeProps) {
  const { bg, text } = VARIANT_COLORS[variant]
  return (
    <View style={[styles.container, { backgroundColor: bg }, style]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      4,
    alignSelf:         'flex-start',
  },
  label: {
    fontSize:      9,
    fontWeight:    '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
})
