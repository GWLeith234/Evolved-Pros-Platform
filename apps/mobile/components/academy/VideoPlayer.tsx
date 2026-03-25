import React, { useRef, useCallback, useEffect } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import Video, { OnProgressData, VideoRef } from 'react-native-video'
import { colors } from '@/lib/theme'
import { supabase } from '@/lib/supabase'

interface VideoPlayerProps {
  playbackId: string | null | undefined
  token: string | null
  lessonId: string
  initialProgress?: number
  onComplete?: () => void
}

export function VideoPlayer({
  playbackId,
  token,
  lessonId,
  initialProgress = 0,
  onComplete,
}: VideoPlayerProps) {
  const videoRef = useRef<VideoRef>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const latestTimeRef = useRef(initialProgress)
  const hasCompletedRef = useRef(false)

  // Build Mux HLS URL — signed or unsigned
  const uri = playbackId
    ? `https://stream.mux.com/${playbackId}.m3u8${token ? `?token=${token}` : ''}`
    : null

  const saveProgress = useCallback(async (currentTime: number, completed = false) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('lesson_progress').upsert(
      {
        user_id:             user.id,
        lesson_id:           lessonId,
        watch_time_seconds:  Math.floor(currentTime),
        completed_at:        completed ? new Date().toISOString() : undefined,
      },
      { onConflict: 'user_id,lesson_id', ignoreDuplicates: false },
    )
  }, [lessonId])

  const handleProgress = useCallback((data: OnProgressData) => {
    latestTimeRef.current = data.currentTime
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveProgress(data.currentTime), 10_000)

    if (!hasCompletedRef.current && data.seekableDuration > 0) {
      if (data.currentTime / data.seekableDuration > 0.9) {
        hasCompletedRef.current = true
        saveProgress(data.currentTime, true)
        onComplete?.()
      }
    }
  }, [saveProgress, onComplete])

  // Resume from saved position
  const handleLoad = useCallback(() => {
    if (initialProgress > 0 && videoRef.current) {
      videoRef.current.seek(initialProgress)
    }
  }, [initialProgress])

  // Save on unmount
  useEffect(() => {
    return () => {
      clearTimeout(saveTimerRef.current)
      saveProgress(latestTimeRef.current)
    }
  }, [saveProgress])

  if (!uri) {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator color={colors.teal} size="large" />
        <Text style={styles.placeholderText}>Loading video…</Text>
      </View>
    )
  }

  return (
    <Video
      ref={videoRef}
      source={{ uri }}
      style={styles.video}
      resizeMode="contain"
      controls
      onProgress={handleProgress}
      onLoad={handleLoad}
    />
  )
}

const styles = StyleSheet.create({
  video: {
    width:       '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.navyDeep,
  },
  placeholder: {
    width:          '100%',
    aspectRatio:    16 / 9,
    backgroundColor: colors.navyDeep,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
  },
  placeholderText: {
    color:      'rgba(255,255,255,0.4)',
    fontSize:   12,
    fontWeight: '600',
  },
})
