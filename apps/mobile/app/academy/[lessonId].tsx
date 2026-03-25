import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/hooks/useAuth'
import { colors, spacing, fonts } from '@/lib/theme'
import { Lesson } from '@/lib/types'
import { VideoPlayer } from '@/components/academy/VideoPlayer'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

interface LessonData extends Lesson {
  watchTimeSeconds: number
  completedAt: string | null
}

export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>()
  const router       = useRouter()
  const { session }  = useAuthStore()
  const userId       = session?.user?.id ?? ''

  const [lesson, setLesson]       = useState<LessonData | null>(null)
  const [token, setToken]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(true)
  const [completing, setCompleting] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (!lessonId) return

    async function load() {
      setLoading(true)
      try {
        // Fetch lesson data + progress from Supabase directly
        const [lessonRes, progressRes] = await Promise.all([
          supabase
            .from('lessons')
            .select('id, course_id, slug, title, description, mux_playback_id, duration_seconds, sort_order, is_published')
            .eq('id', lessonId)
            .single(),
          supabase
            .from('lesson_progress')
            .select('watch_time_seconds, completed_at')
            .eq('user_id', userId)
            .eq('lesson_id', lessonId)
            .single(),
        ])

        if (lessonRes.data) {
          setLesson({
            ...lessonRes.data,
            watchTimeSeconds: progressRes.data?.watch_time_seconds ?? 0,
            completedAt:      progressRes.data?.completed_at ?? null,
          })
          setCompleted(!!progressRes.data?.completed_at)
        }

        // Fetch signed Mux token from web API (keeps secrets server-side)
        if (lessonRes.data?.mux_playback_id && API_URL) {
          const tokenRes = await fetch(`${API_URL}/api/lessons/${lessonId}/mux-token`)
          if (tokenRes.ok) {
            const { token: t } = await tokenRes.json() as { token: string | null }
            setToken(t)
          }
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [lessonId, userId])

  const handleComplete = useCallback(() => {
    setCompleted(true)
  }, [])

  async function markComplete() {
    if (completed || completing || !lessonId) return
    setCompleting(true)
    try {
      await supabase.from('lesson_progress').upsert(
        {
          user_id:    userId,
          lesson_id:  lessonId,
          completed_at: new Date().toISOString(),
          watch_time_seconds: lesson?.watchTimeSeconds ?? 0,
        },
        { onConflict: 'user_id,lesson_id', ignoreDuplicates: false },
      )
      setCompleted(true)
    } catch {
      Alert.alert('Error', 'Could not mark lesson as complete. Please try again.')
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color={colors.teal} size="large" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />

      {/* Back button */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        {completed && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>✓ Complete</Text>
          </View>
        )}
      </View>

      {/* Video player */}
      <VideoPlayer
        playbackId={lesson?.mux_playback_id}
        token={token}
        lessonId={lessonId ?? ''}
        initialProgress={lesson?.watchTimeSeconds}
        onComplete={handleComplete}
      />

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentPad}>
        <Text style={styles.lessonLabel}>Lesson</Text>
        <Text style={styles.title}>{lesson?.title}</Text>
        {lesson?.description && (
          <Text style={styles.description}>{lesson.description}</Text>
        )}

        {/* Mark Complete */}
        {!completed && (
          <TouchableOpacity
            style={[styles.completeBtn, completing && styles.completeBtnDisabled]}
            onPress={markComplete}
            disabled={completing}
          >
            {completing ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.completeBtnText}>Mark as Complete</Text>
            )}
          </TouchableOpacity>
        )}

        {completed && (
          <View style={styles.completedState}>
            <Text style={styles.completedStateIcon}>✓</Text>
            <Text style={styles.completedStateText}>Lesson Complete!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: colors.navyDeep,
  },
  loadingContainer: {
    flex:            1,
    backgroundColor: colors.navyDeep,
    alignItems:      'center',
    justifyContent:  'center',
  },
  topBar: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.sm,
    backgroundColor:   colors.navyDeep,
  },
  backBtn: {
    paddingVertical: spacing.xs,
  },
  backText: {
    fontFamily:    fonts.condensed,
    fontSize:      14,
    fontWeight:    '700',
    color:         'rgba(255,255,255,0.6)',
    letterSpacing: 0.3,
  },
  completedBadge: {
    backgroundColor: 'rgba(42,157,79,0.2)',
    borderRadius:    4,
    paddingHorizontal: spacing.sm,
    paddingVertical:   4,
  },
  completedText: {
    fontFamily:    fonts.condensed,
    fontSize:      10,
    fontWeight:    '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color:         colors.success,
  },
  content: {
    flex:            1,
    backgroundColor: colors.offWhite,
  },
  contentPad: {
    padding:       spacing.lg,
    paddingBottom: spacing.xl,
    gap:           spacing.sm,
  },
  lessonLabel: {
    fontFamily:    fonts.condensed,
    fontSize:      9,
    fontWeight:    '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color:         colors.textMuted,
  },
  title: {
    fontFamily:   fonts.serif,
    fontSize:     22,
    fontWeight:   '700',
    color:        colors.navyDark,
    lineHeight:   30,
    marginBottom: spacing.xs,
  },
  description: {
    fontFamily: fonts.body,
    fontSize:   14,
    color:      colors.textMuted,
    lineHeight: 22,
  },
  completeBtn: {
    backgroundColor: colors.navy,
    borderRadius:    6,
    paddingVertical: 14,
    alignItems:      'center',
    marginTop:       spacing.lg,
  },
  completeBtnDisabled: {
    opacity: 0.6,
  },
  completeBtnText: {
    fontFamily:    fonts.condensed,
    fontSize:      12,
    fontWeight:    '700',
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    color:         colors.white,
  },
  completedState: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing.sm,
    marginTop:      spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(42,157,79,0.08)',
    borderRadius:    8,
    borderWidth:     1,
    borderColor:     'rgba(42,157,79,0.2)',
  },
  completedStateIcon: {
    fontSize:   20,
    color:      colors.success,
    fontWeight: '700',
  },
  completedStateText: {
    fontFamily:  fonts.condensed,
    fontSize:    14,
    fontWeight:  '700',
    color:       colors.success,
    letterSpacing: 0.5,
  },
})
