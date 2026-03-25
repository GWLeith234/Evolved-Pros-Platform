import React, { useState } from 'react'
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native'
import { colors, spacing, fonts } from '@/lib/theme'
import { supabase } from '@/lib/supabase'

interface ComposeBarProps {
  channelSlug: string
  onPost: () => void
}

const PILLARS = [1, 2, 3, 4, 5, 6]

export function ComposeBar({ channelSlug, onPost }: ComposeBarProps) {
  const [body, setBody] = useState('')
  const [pillar, setPillar] = useState<number | null>(null)
  const [posting, setPosting] = useState(false)

  async function handlePost() {
    if (!body.trim()) return
    setPosting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('posts').insert({
        user_id:       user.id,
        channel_slug:  channelSlug,
        body:          body.trim(),
        pillar_number: pillar,
        like_count:    0,
        reply_count:   0,
      })

      if (error) throw error
      setBody('')
      setPillar(null)
      onPost()
    } catch {
      Alert.alert('Error', 'Failed to post. Please try again.')
    } finally {
      setPosting(false)
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder="Share something with the community…"
        placeholderTextColor={colors.textMuted}
        multiline
        style={styles.input}
        maxLength={2000}
      />
      <View style={styles.footer}>
        {/* Pillar selector */}
        <View style={styles.pillars}>
          {PILLARS.map(p => (
            <TouchableOpacity
              key={p}
              onPress={() => setPillar(pillar === p ? null : p)}
              style={[styles.pillarBtn, pillar === p && styles.pillarBtnActive]}
            >
              <Text style={[styles.pillarText, pillar === p && styles.pillarTextActive]}>
                P{p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.postBtn, (!body.trim() || posting) && styles.postBtnDisabled]}
          onPress={handlePost}
          disabled={!body.trim() || posting}
        >
          <Text style={styles.postBtnText}>{posting ? '…' : 'Post'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding:           spacing.md,
  },
  input: {
    fontFamily:    fonts.body,
    fontSize:      14,
    color:         colors.navyDark,
    minHeight:     64,
    textAlignVertical: 'top',
    marginBottom:  spacing.sm,
  },
  footer: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  pillars: {
    flexDirection: 'row',
    gap:           spacing.xs,
  },
  pillarBtn: {
    width:        28,
    height:       24,
    borderRadius: 4,
    alignItems:   'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(27,60,90,0.06)',
  },
  pillarBtnActive: {
    backgroundColor: colors.teal,
  },
  pillarText: {
    fontFamily:    fonts.condensed,
    fontSize:      9,
    fontWeight:    '700',
    letterSpacing: 0.5,
    color:         colors.textMuted,
  },
  pillarTextActive: {
    color: colors.white,
  },
  postBtn: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingVertical:   7,
    borderRadius:      4,
  },
  postBtnDisabled: {
    opacity: 0.4,
  },
  postBtnText: {
    fontFamily:    fonts.condensed,
    fontSize:      11,
    fontWeight:    '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color:         colors.white,
  },
})
