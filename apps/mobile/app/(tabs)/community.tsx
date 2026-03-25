import React, { useState, useEffect, useCallback } from 'react'
import { View, FlatList, SafeAreaView, StyleSheet, Text, ListRenderItem } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '@/lib/supabase'
import { useRealtimePosts } from '@/hooks/useRealtime'
import { colors, spacing, fonts } from '@/lib/theme'
import { Post, Channel } from '@/lib/types'
import { PostCard } from '@/components/community/PostCard'
import { ComposeBar } from '@/components/community/ComposeBar'
import { ChannelList } from '@/components/community/ChannelList'

const CHANNELS: Channel[] = [
  { slug: 'general',    label: 'General' },
  { slug: 'wins',       label: 'Wins' },
  { slug: 'questions',  label: 'Questions' },
  { slug: 'marketing',  label: 'Marketing' },
  { slug: 'sales',      label: 'Sales' },
  { slug: 'operations', label: 'Operations' },
]

export default function CommunityScreen() {
  const [activeChannel, setActiveChannel] = useState('general')
  const [posts, setPosts]                 = useState<Post[]>([])
  const [loading, setLoading]             = useState(true)

  const loadPosts = useCallback(async (channel: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('posts')
      .select(`
        id, user_id, channel_slug, body, pillar_number, like_count, reply_count, created_at,
        author:users!posts_user_id_fkey(id, full_name, display_name, avatar_url, tier)
      `)
      .eq('channel_slug', channel)
      .order('created_at', { ascending: false })
      .limit(30)
    setPosts((data ?? []) as Post[])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadPosts(activeChannel)
  }, [activeChannel, loadPosts])

  const handleNewPost = useCallback((post: Post) => {
    setPosts(prev => [post, ...prev])
  }, [])

  useRealtimePosts(activeChannel, handleNewPost)

  function handleChannelChange(slug: string) {
    setActiveChannel(slug)
    setPosts([])
  }

  const renderPost: ListRenderItem<Post> = ({ item }) => (
    <PostCard post={item} />
  )

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
      </View>
      <ChannelList
        channels={CHANNELS}
        active={activeChannel}
        onSelect={handleChannelChange}
      />
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={p => p.id}
        style={styles.list}
        ListHeaderComponent={
          <ComposeBar
            channelSlug={activeChannel}
            onPost={() => loadPosts(activeChannel)}
          />
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No posts yet — be the first!</Text>
            </View>
          )
        }
      />
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
  list: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  empty: {
    padding:    spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize:   14,
    color:      colors.textMuted,
  },
})
