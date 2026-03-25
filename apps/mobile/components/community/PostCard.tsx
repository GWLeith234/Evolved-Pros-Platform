import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, spacing, fonts } from '@/lib/theme'
import { Post } from '@/lib/types'
import { Avatar } from '@/components/shared/Avatar'
import { Badge } from '@/components/shared/Badge'
import { supabase } from '@/lib/supabase'

interface PostCardProps {
  post: Post
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 60)  return `${mins}m`
  if (hours < 24) return `${hours}h`
  return `${days}d`
}

export function PostCard({ post }: PostCardProps) {
  const [likes, setLikes] = useState(post.like_count)

  const displayName = post.author?.display_name ?? post.author?.full_name ?? 'Member'
  const tier = post.author?.tier

  async function handleLike() {
    setLikes(prev => prev + 1)
    await supabase.rpc('increment_post_likes', { post_id: post.id })
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar
          uri={post.author?.avatar_url}
          name={displayName}
          size={36}
        />
        <View style={styles.meta}>
          <View style={styles.metaRow}>
            <Text style={styles.author}>{displayName}</Text>
            {tier === 'pro' && (
              <Badge label="Pro" variant="gold" style={styles.tierBadge} />
            )}
          </View>
          <Text style={styles.time}>{timeAgo(post.created_at)}</Text>
        </View>
        {post.pillar_number != null && (
          <Badge label={`P${post.pillar_number}`} variant="teal" />
        )}
      </View>

      {/* Body */}
      <Text style={styles.body}>{post.body}</Text>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.action} onPress={handleLike}>
          <Text style={styles.actionIcon}>♥</Text>
          <Text style={styles.actionCount}>{likes}</Text>
        </TouchableOpacity>
        <View style={styles.action}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{post.reply_count}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding:           spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           spacing.sm,
    marginBottom:  spacing.sm,
  },
  meta: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.xs,
  },
  author: {
    fontFamily:  fonts.condensed,
    fontSize:    13,
    fontWeight:  '700',
    color:       colors.navyDark,
  },
  tierBadge: {
    marginTop: 0,
  },
  time: {
    fontFamily: fonts.body,
    fontSize:   11,
    color:      colors.textMuted,
    marginTop:  1,
  },
  body: {
    fontFamily: fonts.body,
    fontSize:   14,
    color:      colors.navyDark,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap:           spacing.md,
  },
  action: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  actionIcon: {
    fontSize: 14,
    color:    colors.textMuted,
  },
  actionCount: {
    fontFamily: fonts.body,
    fontSize:   12,
    color:      colors.textMuted,
  },
})
