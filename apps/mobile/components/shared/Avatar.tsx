import React from 'react'
import { View, Image, Text, StyleSheet } from 'react-native'
import { colors } from '@/lib/theme'

interface AvatarProps {
  uri?: string | null
  name?: string | null
  size?: number
}

export function Avatar({ uri, name, size = 36 }: AvatarProps) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const containerStyle = {
    width:        size,
    height:       size,
    borderRadius: size / 2,
  }

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, containerStyle]}
        accessibilityLabel={name ?? 'Avatar'}
      />
    )
  }

  return (
    <View style={[styles.placeholder, containerStyle]}>
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.teal,
  },
  placeholder: {
    backgroundColor: colors.navy,
    alignItems:      'center',
    justifyContent:  'center',
  },
  initials: {
    color:      colors.white,
    fontWeight: '700',
  },
})
