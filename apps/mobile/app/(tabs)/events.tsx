import React, { useState, useEffect, useCallback } from 'react'
import { ScrollView, SafeAreaView, View, Text, StyleSheet, RefreshControl } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '@/lib/supabase'
import { colors, spacing, fonts } from '@/lib/theme'
import { Event } from '@/lib/types'
import { EventCard } from '@/components/events/EventCard'

export default function EventsScreen() {
  const [events, setEvents]         = useState<Event[]>([])
  const [past, setPast]             = useState<Event[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const now = new Date().toISOString()
    const [upcoming, previous] = await Promise.all([
      supabase
        .from('events')
        .select('id, title, type, starts_at, ends_at, description, registration_url')
        .gte('starts_at', now)
        .order('starts_at')
        .limit(20),
      supabase
        .from('events')
        .select('id, title, type, starts_at, ends_at, description, registration_url')
        .lt('starts_at', now)
        .order('starts_at', { ascending: false })
        .limit(5),
    ])
    setEvents((upcoming.data ?? []) as Event[])
    setPast((previous.data ?? []) as Event[])
  }, [])

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
        <Text style={styles.title}>Events</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />}
      >
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Upcoming Events</Text>
          {events.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No upcoming events scheduled</Text>
            </View>
          ) : (
            events.map(event => <EventCard key={event.id} event={event} />)
          )}
        </View>

        {past.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Past Events</Text>
            {past.map(event => <EventCard key={event.id} event={event} />)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.offWhite },
  header: {
    backgroundColor:  colors.navyDark,
    paddingHorizontal: spacing.lg,
    paddingVertical:   spacing.md,
  },
  title: {
    fontFamily:    fonts.serif,
    fontSize:      22,
    fontWeight:    '700',
    color:         colors.white,
    letterSpacing: 0.3,
  },
  scroll: { flex: 1 },
  section: {
    paddingTop: spacing.lg,
  },
  sectionLabel: {
    fontFamily:     fonts.condensed,
    fontSize:       9,
    fontWeight:     '700',
    letterSpacing:  1.4,
    textTransform:  'uppercase',
    color:          colors.textMuted,
    paddingHorizontal: spacing.md,
    marginBottom:   spacing.sm,
  },
  empty: {
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.lg,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize:   14,
    color:      colors.textMuted,
  },
})
