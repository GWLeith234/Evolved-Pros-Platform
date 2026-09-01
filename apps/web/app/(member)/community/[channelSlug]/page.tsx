import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { CommunityLayout } from '@/components/community/CommunityLayout'
import { CommunityPermalinkClient } from '@/components/community/CommunityPermalinkClient'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import {
  fetchChannels,
  fetchPosts,
  fetchPinnedPost,
  fetchLeaderboard,
  fetchActiveMembers,
  fetchCurrentUserProfile,
} from '@/lib/community/fetchers'
import {
  POST_ID_RE,
  fetchPermalinkPost,
  fetchPermalinkRow,
} from '@/lib/community/permalinkPost.server'

/**
 * /community/[channelSlug] serves two shapes (SPRINT CM-1):
 *
 *   /community/general                              → channel feed (unchanged)
 *   /community/1f0a…-…-…-…-…  (a post uuid)         → single-post permalink
 *
 * They share one dynamic segment because Next.js forbids two differently-named
 * dynamic segments as siblings ([channelSlug] and [id] at the same level).
 * A uuid is never a channel slug, so the split is unambiguous.
 */

export async function generateMetadata(
  { params }: { params: { channelSlug: string } },
): Promise<Metadata> {
  if (!POST_ID_RE.test(params.channelSlug)) return {}
  const row = await fetchPermalinkRow(params.channelSlug)
  if (!row) return { title: 'Post — Evolved Pros' }
  const author = row.users?.full_name ?? row.users?.display_name ?? 'A member'
  return {
    title: `${author} — Evolved Pros Community`,
    description: row.body ? row.body.slice(0, 160) : 'Shared an image',
  }
}

export default async function ChannelPage({
  params,
}: {
  params: { channelSlug: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  /* ---- Permalink branch ---- */
  if (POST_ID_RE.test(params.channelSlug)) {
    const profile = await resolveCurrentUser(supabase)
    if (!profile) redirect('/login')

    const post = await fetchPermalinkPost(params.channelSlug, profile.id)
    if (!post) notFound()

    return (
      <div className="flex flex-col w-full" style={{ background: 'var(--community-page-bg)' }}>
        <div className="w-full mx-auto px-3 sm:px-4 md:px-6 py-5 sm:py-8" style={{ maxWidth: 760 }}>
          <Link
            href="/community"
            className="font-condensed uppercase"
            style={{
              display: 'inline-block',
              marginBottom: 16,
              fontSize: 12,
              letterSpacing: '0.18em',
              color: 'var(--text-tertiary)',
              textDecoration: 'none',
            }}
          >
            ← Back to community
          </Link>

          <CommunityPermalinkClient
            post={post}
            currentUser={{
              id: profile.id,
              displayName: profile.display_name ?? profile.full_name ?? null,
              avatarUrl: profile.avatar_url ?? null,
            }}
          />
        </div>
      </div>
    )
  }

  /* ---- Channel feed branch (unchanged) ---- */
  const [profile, channels, postsResult, pinnedPost, leaderboard, activeMembers] = await Promise.all([
    fetchCurrentUserProfile(supabase, user.id),
    fetchChannels(supabase),
    fetchPosts(supabase, { channelSlug: params.channelSlug, userId: user.id }),
    fetchPinnedPost(supabase, params.channelSlug),
    fetchLeaderboard(supabase, user.id),
    fetchActiveMembers(supabase),
  ])

  const channel = channels.find(c => c.slug === params.channelSlug)
  if (!channel) notFound()

  return (
    <CommunityLayout
      channels={channels}
      currentChannelSlug={params.channelSlug}
      currentChannelId={channel.id}
      posts={postsResult.posts}
      nextCursor={postsResult.nextCursor}
      hasMore={postsResult.hasMore}
      pinnedPost={pinnedPost}
      leaderboard={leaderboard}
      activeMembers={activeMembers}
      currentUser={{
        id: user.id,
        displayName: profile?.display_name ?? profile?.full_name ?? null,
        avatarUrl: profile?.avatar_url ?? null,
      }}
      unreadCounts={{}}
    />
  )
}
