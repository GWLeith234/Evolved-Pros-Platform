import React from 'react'
import { Text, TextStyle, StyleSheet } from 'react-native'
import { colors, fonts } from '@/lib/theme'

interface TypographyProps {
  children: React.ReactNode
  style?: TextStyle
}

export function Heading({ children, style }: TypographyProps) {
  return <Text style={[styles.heading, style]}>{children}</Text>
}

export function Subheading({ children, style }: TypographyProps) {
  return <Text style={[styles.subheading, style]}>{children}</Text>
}

export function Label({ children, style }: TypographyProps) {
  return <Text style={[styles.label, style]}>{children}</Text>
}

export function Body({ children, style }: TypographyProps) {
  return <Text style={[styles.body, style]}>{children}</Text>
}

export function Caption({ children, style }: TypographyProps) {
  return <Text style={[styles.caption, style]}>{children}</Text>
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: fonts.serif,
    fontSize:   22,
    fontWeight: '700',
    color:      colors.navyDark,
    lineHeight: 28,
  },
  subheading: {
    fontFamily:    fonts.condensed,
    fontSize:      16,
    fontWeight:    '700',
    color:         colors.navyDark,
    letterSpacing: 0.2,
  },
  label: {
    fontFamily:    fonts.condensed,
    fontSize:      10,
    fontWeight:    '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color:         colors.textMuted,
  },
  body: {
    fontFamily: fonts.body,
    fontSize:   14,
    color:      colors.navyDark,
    lineHeight: 22,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize:   12,
    color:      colors.textMuted,
    lineHeight: 18,
  },
})
