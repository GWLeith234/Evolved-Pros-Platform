import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { adminClient } from '@/lib/supabase/admin'
import { PILLAR_LABELS } from '@/lib/community/types'
import type { PillarTag } from '@/lib/community/types'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import { mediaSectionTitle } from '@/lib/media/brand'
import { publicPageMetadata } from '@/lib/seo/canonical'

export const revalidate = 120

export const metadata: Metadata = publicPageMetadata('/media/community', {
  title: mediaSectionTitle('Community'),
  description: 'See what 10,000 high-performing sales professionals are talking about inside Evolved Pros.',
})

// ── Types ────────────────────────────────────────────────────────────────────

interface PostRow {
  id: string
  body: string
  pillar_tag: string | null
  created_at: string
  like_count: number
  reply_count: number
  users: {
    id: string
    full_name: string | null
    avatar_url: string | null
    tier: string | null
  } | null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function pillarLabel(tag: string | null): string {
  if (!tag) return ''
  return PILLAR_LABELS[tag as PillarTag] ?? ''
}

function pillarColor(tag: string | null): string {
  if (!tag) return '#7a8a96'
  const num = parseInt(tag.replace('p', ''))
  return PILLAR_CONFIG[num]?.color ?? '#7a8a96'
}

// ── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post, blurred }: { post: PostRow; blurred?: boolean }) {
  const author = post.users
  const pTag = pillarLabel(post.pillar_tag)
  const pColor = pillarColor(post.pillar_tag)

  return (
    <div
      style={{
        backgroundColor: '#fff',
        border: '1px solid #E0D8CC',
        borderRadius: 4,
        padding: '12px 14px',
        ...(blurred ? { filter: 'blur(4px)', opacity: 0.7, pointerEvents: 'none' as const, userSelect: 'none' as const } : {}),
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {author?.avatar_url ? (
          <Image src={author.avatar_url} alt={author.full_name ?? ''} width={32} height={32} className="rounded-full object-cover" style={{ flexShrink: 0 }} />
        ) : (
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#2B3A5A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700, fontFamily: 'var(--font-condensed)', flexShrink: 0 }}>
            {getInitials(author?.full_name ?? null)}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: '#2B3A5A' }}>
              {author?.full_name ?? 'Member'}
            </span>
            {author?.tier && (
              <span style={{ fontSize: 8, fontWeight: 700, fontFamily: 'var(--font-condensed)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '1px 5px', borderRadius: 2, backgroundColor: author.tier === 'pro' ? 'rgba(201,48,42,0.12)' : author.tier === 'vip' ? 'rgba(201,168,76,0.12)' : 'rgba(104,162,185,0.12)', color: author.tier === 'pro' ? '#C9302A' : author.tier === 'vip' ? '#C9A84C' : '#68a2b9' }}>
                {author.tier}
              </span>
            )}
            {pTag && (
              <span style={{ fontSize: 8, fontWeight: 700, fontFamily: 'var(--font-condensed)', textTransform: 'uppercase', letterSpacing: '0.06em', color: pColor }}>
                {pTag}
              </span>
            )}
          </div>
          <span suppressHydrationWarning style={{ fontSize: 9, color: 'rgba(43,58,90,0.4)', fontFamily: 'var(--font-body)' }}>
            {timeAgo(post.created_at)}
          </span>
        </div>
      </div>

      {/* Body */}
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, lineHeight: 1.6, color: '#3a4a56', margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {post.body}
      </p>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12 }}>
        <span style={{ fontSize: 10, color: 'rgba(43,58,90,0.4)', fontFamily: 'var(--font-body)' }}>
          {post.like_count} {post.like_count === 1 ? 'like' : 'likes'}
        </span>
        <span style={{ fontSize: 10, color: 'rgba(43,58,90,0.4)', fontFamily: 'var(--font-body)' }}>
          {post.reply_count} {post.reply_count === 1 ? 'reply' : 'replies'}
        </span>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function MediaCommunityPage() {
  const { data } = await adminClient
    .from('posts')
    .select('id, body, pillar_tag, created_at, like_count, reply_count, users!posts_author_id_fkey(id, full_name, avatar_url, tier)')
    .order('like_count', { ascending: false })
    .limit(8)

  const posts = ((data ?? []) as unknown as PostRow[])
  const visible = posts.slice(0, 3)
  const blurred = posts.slice(3, 8)

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 24px 0' }}>
      {/* Section header */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 10, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>
          Evolved Pros Community
        </p>
        <h1 style={{ fontFamily: 'var(--font-condensed)', fontWeight: 900, fontSize: 28, color: '#2B3A5A', textTransform: 'uppercase', lineHeight: 1.1, margin: '0 0 6px' }}>
          What the community is talking about
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(43,58,90,0.5)', fontFamily: 'var(--font-body)' }}>
          Join 10,000 high-performing sales professionals.
        </p>
      </div>

      {/* Top 3 — fully visible */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 0 }}>
        {visible.map(p => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>

      {/* Posts 4-8 — blurred */}
      {blurred.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10, position: 'relative' }}>
          {blurred.map(p => (
            <PostCard key={p.id} post={p} blurred />
          ))}
        </div>
      )}

      {/* Join wall */}
      <div style={{ backgroundColor: '#2B3A5A', borderRadius: 4, padding: 20, textAlign: 'center', margin: '20px 0 40px' }}>
        <h2 style={{ fontFamily: 'var(--font-condensed)', fontWeight: 900, fontSize: 22, color: '#fff', textTransform: 'uppercase', lineHeight: 1.15, margin: '0 0 6px' }}>
          Join the conversation
        </h2>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-body)', margin: '0 0 14px' }}>
          Read-only from here. Join Evolved Pros to reply, post, and connect.
        </p>
        <Link
          href="/pricing"
          style={{
            display: 'inline-block',
            fontFamily: 'var(--font-condensed)',
            fontWeight: 700,
            fontSize: 13,
            color: '#2B3A5A',
            backgroundColor: '#C9A84C',
            padding: '10px 24px',
            borderRadius: 3,
            textDecoration: 'none',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Join Evolved Pros — Free →
        </Link>
      </div>

      {posts.length === 0 && (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <span style={{ fontSize: 13, color: 'rgba(43,58,90,0.35)', fontFamily: 'var(--font-body)' }}>
            No community posts yet.
          </span>
        </div>
      )}
    </div>
  )
}
