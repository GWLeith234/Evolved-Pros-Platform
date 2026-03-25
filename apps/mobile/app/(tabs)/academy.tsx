import React, { useState, useEffect, useCallback } from 'react'
import { ScrollView, SafeAreaView, View, Text, StyleSheet, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/hooks/useAuth'
import { colors, spacing, fonts } from '@/lib/theme'
import { CourseWithProgress } from '@/lib/types'
import { CourseCard } from '@/components/academy/CourseCard'

async function loadCourses(userId: string): Promise<{
  courses: CourseWithProgress[]
  overallPct: number
  userTier: string
}> {
  const [coursesRes, profileRes] = await Promise.all([
    supabase
      .from('courses')
      .select('id, slug, pillar_number, title, description, required_tier, is_published, sort_order')
      .eq('is_published', true)
      .order('sort_order'),
    supabase.from('users').select('tier').eq('id', userId).single(),
  ])

  const rawCourses = coursesRes.data ?? []
  const userTier   = profileRes.data?.tier ?? 'community'

  if (!rawCourses.length) return { courses: [], overallPct: 0, userTier }

  const courseIds = rawCourses.map(c => c.id)

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, course_id')
    .in('course_id', courseIds)
    .eq('is_published', true)

  const lessonIds = (lessons ?? []).map(l => l.id)

  const { data: progress } = lessonIds.length > 0
    ? await supabase
        .from('lesson_progress')
        .select('lesson_id, completed_at')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds)
    : { data: [] }

  const completedSet = new Set(
    (progress ?? []).filter(p => p.completed_at).map(p => p.lesson_id),
  )

  let totalLessons = 0
  let totalCompleted = 0

  const courses: CourseWithProgress[] = rawCourses.map(course => {
    const courseLessons = (lessons ?? []).filter(l => l.course_id === course.id)
    const completed     = courseLessons.filter(l => completedSet.has(l.id)).length
    const total         = courseLessons.length
    const pct           = total > 0 ? Math.round((completed / total) * 100) : 0
    const hasAccess     = course.required_tier === 'community' || userTier === 'pro'

    totalLessons   += total
    totalCompleted += completed

    return { ...course, totalLessons: total, completedLessons: completed, progressPct: pct, hasAccess }
  })

  const overallPct = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0

  return { courses, overallPct, userTier }
}

export default function AcademyScreen() {
  const router        = useRouter()
  const { session }   = useAuthStore()
  const userId        = session?.user?.id ?? ''

  const [courses, setCourses]       = useState<CourseWithProgress[]>([])
  const [overallPct, setOverallPct] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!userId) return
    const result = await loadCourses(userId)
    setCourses(result.courses)
    setOverallPct(result.overallPct)
  }, [userId])

  useEffect(() => { load() }, [load])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Academy</Text>
        {overallPct > 0 && (
          <Text style={styles.progress}>{overallPct}% complete</Text>
        )}
      </View>

      {/* Overall progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${overallPct}%` as `${number}%` }]} />
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.sectionLabel}>6 Pillars of Growth</Text>
        {courses.map(course => (
          <CourseCard
            key={course.id}
            course={course}
            onPress={() => router.push({
              pathname: '/academy/[lessonId]',
              params:   { lessonId: course.slug },
            })}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.offWhite },
  header: {
    backgroundColor:   colors.navyDark,
    paddingHorizontal: spacing.lg,
    paddingVertical:   spacing.md,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
  },
  title: {
    fontFamily:    fonts.serif,
    fontSize:      22,
    fontWeight:    '700',
    color:         colors.white,
    letterSpacing: 0.3,
  },
  progress: {
    fontFamily:    fonts.condensed,
    fontSize:      11,
    fontWeight:    '700',
    letterSpacing: 0.6,
    color:         colors.teal,
    textTransform: 'uppercase',
  },
  progressBar: {
    height:          3,
    backgroundColor: 'rgba(27,60,90,0.08)',
  },
  progressFill: {
    height:          3,
    backgroundColor: colors.teal,
  },
  scroll: { flex: 1 },
  content: {
    paddingTop:    spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionLabel: {
    fontFamily:        fonts.condensed,
    fontSize:          9,
    fontWeight:        '700',
    letterSpacing:     1.4,
    textTransform:     'uppercase',
    color:             colors.textMuted,
    paddingHorizontal: spacing.md,
    marginBottom:      spacing.sm,
  },
})
