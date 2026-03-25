import React from 'react'
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native'
import { colors } from '@/lib/theme'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[styles.base, styles[variant], isDisabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.white : colors.navy} size="small" />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 20,
    paddingVertical:   10,
    borderRadius:      4,
    alignItems:        'center',
    justifyContent:    'center',
  },
  primary: {
    backgroundColor: colors.red,
  },
  secondary: {
    backgroundColor: colors.navy,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth:     1,
    borderColor:     colors.navy,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize:      11,
    fontWeight:    '700',
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },
  primaryLabel: {
    color: colors.white,
  },
  secondaryLabel: {
    color: colors.white,
  },
  ghostLabel: {
    color: colors.navy,
  },
})
