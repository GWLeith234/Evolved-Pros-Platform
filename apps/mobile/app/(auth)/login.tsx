import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '@/lib/supabase'
import { colors, spacing, fonts } from '@/lib/theme'

export default function LoginScreen() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleLogin() {
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: 'evolvedpros://auth/callback',
      },
    })
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setSent(true)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          {/* Logo area */}
          <View style={styles.logoArea}>
            <View style={styles.logoMark}>
              <Text style={styles.logoMarkText}>EP</Text>
            </View>
            <Text style={styles.brand}>Evolved Pros</Text>
            <Text style={styles.tagline}>
              The platform for ambitious agency owners
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {sent ? (
              <View style={styles.sentState}>
                <Text style={styles.sentIcon}>📬</Text>
                <Text style={styles.sentTitle}>Check your inbox</Text>
                <Text style={styles.sentBody}>
                  We sent a magic link to{'\n'}
                  <Text style={styles.sentEmail}>{email}</Text>
                </Text>
                <TouchableOpacity
                  onPress={() => { setSent(false); setEmail('') }}
                  style={styles.resendBtn}
                >
                  <Text style={styles.resendText}>Use a different email</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.cardTitle}>Sign in</Text>
                <Text style={styles.cardSubtitle}>
                  Enter your email — we'll send you a magic link.
                </Text>

                {error && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  style={styles.input}
                  onSubmitEditing={handleLogin}
                  returnKeyType="send"
                />

                <TouchableOpacity
                  style={[styles.btn, (!email.trim() || loading) && styles.btnDisabled]}
                  onPress={handleLogin}
                  disabled={!email.trim() || loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.btnText}>Send Magic Link</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={styles.footer}>
            Members only — contact your account manager to get access.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: colors.navyDark,
  },
  flex: { flex: 1 },
  container: {
    flex:            1,
    justifyContent:  'center',
    paddingHorizontal: spacing.lg,
    paddingVertical:   spacing.xl,
    gap:               spacing.lg,
  },
  logoArea: {
    alignItems: 'center',
    gap:        spacing.sm,
  },
  logoMark: {
    width:           56,
    height:          56,
    borderRadius:    8,
    backgroundColor: colors.red,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    spacing.xs,
  },
  logoMarkText: {
    fontFamily:  fonts.serif,
    fontSize:    24,
    fontWeight:  '700',
    color:       colors.white,
    letterSpacing: 1,
  },
  brand: {
    fontFamily:    fonts.serif,
    fontSize:      26,
    fontWeight:    '700',
    color:         colors.white,
    letterSpacing: 0.5,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize:   13,
    color:      'rgba(255,255,255,0.4)',
    textAlign:  'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius:    12,
    padding:         spacing.lg,
    gap:             spacing.md,
  },
  cardTitle: {
    fontFamily:  fonts.serif,
    fontSize:    22,
    fontWeight:  '700',
    color:       colors.navyDark,
  },
  cardSubtitle: {
    fontFamily: fonts.body,
    fontSize:   14,
    color:      colors.textMuted,
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(239,14,48,0.08)',
    borderRadius:    6,
    borderWidth:     1,
    borderColor:     'rgba(239,14,48,0.2)',
    padding:         spacing.sm,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize:   13,
    color:      colors.red,
  },
  input: {
    borderWidth:   1,
    borderColor:   colors.border,
    borderRadius:  6,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.sm + 4,
    fontFamily:    fonts.body,
    fontSize:      15,
    color:         colors.navyDark,
    backgroundColor: colors.offWhite,
  },
  btn: {
    backgroundColor: colors.red,
    borderRadius:    6,
    paddingVertical: 14,
    alignItems:      'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    fontFamily:    fonts.condensed,
    fontSize:      13,
    fontWeight:    '700',
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    color:         colors.white,
  },
  sentState: {
    alignItems: 'center',
    gap:        spacing.sm,
    paddingVertical: spacing.md,
  },
  sentIcon: {
    fontSize: 36,
  },
  sentTitle: {
    fontFamily:  fonts.serif,
    fontSize:    20,
    fontWeight:  '700',
    color:       colors.navyDark,
  },
  sentBody: {
    fontFamily: fonts.body,
    fontSize:   14,
    color:      colors.textMuted,
    textAlign:  'center',
    lineHeight: 22,
  },
  sentEmail: {
    color:      colors.navy,
    fontWeight: '700',
  },
  resendBtn: {
    paddingVertical: spacing.sm,
  },
  resendText: {
    fontFamily:    fonts.condensed,
    fontSize:      12,
    fontWeight:    '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color:         colors.textMuted,
  },
  footer: {
    fontFamily: fonts.body,
    fontSize:   11,
    color:      'rgba(255,255,255,0.3)',
    textAlign:  'center',
    lineHeight: 17,
  },
})
