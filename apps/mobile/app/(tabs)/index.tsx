import React, { useState, useEffect, useCallback } from 'react'
import { ScrollView, SafeAreaView, StyleSheet, RefreshControl } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { colors } from '@/lib/theme'
import { HomeData, ActivityItem, Stat } from '@/lib/types'
import { WelcomeBanner } from '@/components/home/WelcomeBanner'
import { StatRow } from '@/components/home/StatRow'
import { ActivityFeed } from '@/components/home/ActivityFeed'
import { UpcomingEvents } from '@/components/home/UpcomingEvents'

async function loadHomeData(userId: string): Promise<HomeData> {
  const [profileRes, progressRes, postsRes, eventsRes, membersRes] = await Promise.all([
    supabase.from('users').select('full_name, display_name, tier').eq('id', userId).single(),
    supabase
      .from('lesson_progress')
      .select('lesson_id, completed_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(5),
    supabase
      .from('posts')
      .select('id, body, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('events')
      .select('id, title, type, starts_at, ends_at, description, registration_url')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at')
      .limit(2),
    supabase.from('users').select('id', { count: 'exact', head: true }),
  ])

  const profile = profileRes.data
  const completedCount = (progressRes.data ?? []).filter(p => p.completed_at).length
  const totalProgress = progressRes.data?.length ?? 0

  const recentActivity: ActivityItem[] = [
    ...(progressRes.data ?? []).filter(p => p.completed_at).slice(0, 3).map(p => ({
      id:         p.lesson_id,
      type:       'lesson_complete' as const,
      text:       'Completed a lesson',
      created_at: p.completed_at!,
    })),
    ...(postsRes.data ?? []).slice(0, 2).map(p => ({
      id:         p.id,
      type:       'post' as const,
      text:       `Posted: ${p.body.slice(0, 50)}…`,
      created_at: p.created_at,
    })),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5)

  const stats: Stat[] = [
    { label: 'Members',  value: membersRes.count ?? '—' },
    { label: 'Lessons',  value: totalProgress },
    { label: 'Complete', value: `${completedCount}`, color: colors.success },
    { label: 'My Posts',  value: postsRes.data?.length ?? 0 },
  ]

  const name = profile?.display_name ?? profile?.full_name ?? 'Member'
  const joinedWeek = 1 // Could be calculated from user created_at

  return {
    userName:       name,
    week:           joinedWeek,
    stats,
    recentActivity,
    upcomingEvents: (eventsRes.data ?? []) as HomeData['upcomingEvents'],
  }
}

export default function HomeScreen() {
  const { session } = useAuthStore()
  const userId = session?.user?.id ?? ''

  const [data, setData]           = useState<HomeData | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useNotifications(userId)

  const load = useCallback(async () => {
    if (!userId) return
    const result = await loadHomeData(userId)
    setData(result)
  }, [userId])

  useEffect(() => { load() }, [load])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />}
      >
        <WelcomeBanner name={data?.userName} week={data?.week} />
        <StatRow stats={data?.stats} />
        <ActivityFeed items={data?.recentActivity} />
        <UpcomingEvents events={data?.upcomingEvents} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.navyDark },
  scroll: { flex: 1, backgroundColor: colors.offWhite },
})
