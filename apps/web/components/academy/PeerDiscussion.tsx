'use client'

import { useState, useEffect } from 'react'

const CRIMSON = '#F87171'
const GOLD = '#C9A84C'

interface Author {
  display_name: string | null
  avatar_url: string | null
}

interface Reply {
  id: string
  body: string
  like_count: number
  created_at: string
  author: Author
}

interface Post {
  id: string
  body: string
  like_count: number
  created_at: string
  author: Author
  replies: Reply[]
}

interface Props {
  courseId: string
  moduleNumber: number
  title?: string
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function PeerDiscussion({ courseId, moduleNumber, title }: Props) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [newBody, setNewBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [replyingPosting, setReplyingPosting] = useState(false)
  const [likingId, setLikingId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/discussion?course_id=${encodeURIComponent(courseId)}&module_number=${moduleNumber}`)
      .then(r => r.json())
      .then((data: { posts?: Post[] }) => {
        if (data.posts) setPosts(data.posts)
      })
      .catch(() => {/* ignore */})
      .finally(() => setLoading(false))
  }, [courseId, moduleNumber])

  async function handlePost() {
    const trimmed = newBody.trim()
    if (!trimmed || posting) return
    setPosting(true)
    try {
      const res = await fetch('/api/discussion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, module_number: moduleNumber, body: trimmed }),
      })
      const json = await res.json() as { post?: Post; error?: string }
      if (res.ok && json.post) {
        setPosts(prev => [{ ...json.post!, replies: [] }, ...prev])
        setNewBody('')
      }
    } finally {
      setPosting(false)
    }
  }

  async function handleReply(parentId: string) {
    const trimmed = replyBody.trim()
    if (!trimmed || replyingPosting) return
    setReplyingPosting(true)
    try {
      const res = await fetch('/api/discussion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, module_number: moduleNumber, body: trimmed, parent_id: parentId }),
      })
      const json = await res.json() as { post?: Reply; error?: string }
      if (res.ok && json.post) {
        setPosts(prev => prev.map(p =>
          p.id === parentId
            ? { ...p, replies: [...p.replies, json.post!] }
            : p
        ))
        setReplyBody('')
        setReplyingTo(null)
      }
    } finally {
      setReplyingPosting(false)
    }
  }

  async function handleLike(postId: string, isReply?: boolean, parentId?: string) {
    if (likingId === postId) return
    setLikingId(postId)
    try {
      await fetch(`/api/discussion/${postId}`, { method: 'PATCH' })
      if (isReply && parentId) {
        setPosts(prev => prev.map(p =>
          p.id === parentId
            ? { ...p, replies: p.replies.map(r => r.id === postId ? { ...r, like_count: r.like_count + 1 } : r) }
            : p
        ))
      } else {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, like_count: p.like_count + 1 } : p))
      }
    } finally {
      setLikingId(null)
    }
  }

  return (
    <div style={{ backgroundColor: '#111926', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{
          fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
          fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase',
          color: GOLD, margin: '0 0 4px',
        }}>
          Peer Discussion
        </p>
        <p style={{ color: '#faf9f7', fontSize: '15px', fontWeight: 600, margin: 0 }}>
          {title ?? 'Module Discussion'}
        </p>
      </div>

      {/* Post input */}
      <div style={{ marginBottom: '24px' }}>
        <textarea
          value={newBody}
          onChange={e => setNewBody(e.target.value)}
          placeholder="Share a reflection, question, or insight with the group…"
          rows={3}
          style={{
            width: '100%', backgroundColor: 'rgba(255,255,255,0.03)',
            border: `1px solid ${newBody.trim() ? CRIMSON + '44' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '6px', padding: '12px 14px', color: '#faf9f7',
            fontSize: '13px', lineHeight: 1.6, resize: 'vertical', outline: 'none',
            fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button
            type="button"
            onClick={handlePost}
            disabled={!newBody.trim() || posting}
            style={{
              backgroundColor: newBody.trim() ? CRIMSON : `${CRIMSON}22`,
              color: newBody.trim() ? '#0A0F18' : `${CRIMSON}55`,
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase',
              padding: '9px 22px', borderRadius: '4px', border: 'none',
              cursor: newBody.trim() ? 'pointer' : 'default', transition: 'all 0.15s',
            }}
          >
            {posting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>

      {/* Thread */}
      {loading ? (
        <p style={{ color: 'rgba(250,249,247,0.2)', fontSize: '12px', fontFamily: '"Barlow Condensed", sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Loading…
        </p>
      ) : posts.length === 0 ? (
        <p style={{ color: 'rgba(250,249,247,0.2)', fontSize: '13px', fontStyle: 'italic' }}>
          No posts yet. Be the first to share.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {posts.map(post => (
            <div key={post.id}>
              <PostCard
                post={post}
                onReply={() => {
                  setReplyingTo(replyingTo === post.id ? null : post.id)
                  setReplyBody('')
                }}
                onLike={() => handleLike(post.id)}
                likingId={likingId}
              />

              {/* Replies */}
              {post.replies.length > 0 && (
                <div style={{ marginLeft: '44px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {post.replies.map(reply => (
                    <PostCard
                      key={reply.id}
                      post={reply}
                      isReply
                      onLike={() => handleLike(reply.id, true, post.id)}
                      likingId={likingId}
                    />
                  ))}
                </div>
              )}

              {/* Reply input */}
              {replyingTo === post.id && (
                <div style={{ marginLeft: '44px', marginTop: '8px' }}>
                  <textarea
                    value={replyBody}
                    onChange={e => setReplyBody(e.target.value)}
                    placeholder="Write a reply…"
                    rows={2}
                    autoFocus
                    style={{
                      width: '100%', backgroundColor: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${replyBody.trim() ? CRIMSON + '33' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '6px', padding: '10px 12px', color: '#faf9f7',
                      fontSize: '13px', lineHeight: 1.6, resize: 'none', outline: 'none',
                      fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleReply(post.id)}
                      disabled={!replyBody.trim() || replyingPosting}
                      style={{
                        backgroundColor: replyBody.trim() ? CRIMSON : `${CRIMSON}22`,
                        color: replyBody.trim() ? '#0A0F18' : `${CRIMSON}55`,
                        fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                        fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
                        padding: '7px 16px', borderRadius: '4px', border: 'none',
                        cursor: replyBody.trim() ? 'pointer' : 'default',
                      }}
                    >
                      {replyingPosting ? 'Posting…' : 'Reply'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setReplyingTo(null); setReplyBody('') }}
                      style={{
                        background: 'none', border: 'none',
                        fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                        fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: 'rgba(250,249,247,0.25)', cursor: 'pointer', padding: '7px 0',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PostCard({
  post, isReply = false, onReply, onLike, likingId,
}: {
  post: Post | Reply
  isReply?: boolean
  onReply?: () => void
  onLike: () => void
  likingId: string | null
}) {
  const name = post.author.display_name ?? 'Member'
  const initials = getInitials(name)

  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      {/* Avatar */}
      {post.author.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.author.avatar_url}
          alt={name}
          style={{
            flexShrink: 0, width: isReply ? '28px' : '36px', height: isReply ? '28px' : '36px',
            borderRadius: '50%', objectFit: 'cover',
          }}
        />
      ) : (
        <div style={{
          flexShrink: 0, width: isReply ? '28px' : '36px', height: isReply ? '28px' : '36px',
          borderRadius: '50%', backgroundColor: '#ef0e30',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
            fontSize: isReply ? '10px' : '12px', color: 'white',
          }}>
            {initials}
          </span>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontWeight: 600, fontSize: '13px', color: '#faf9f7' }}>{name}</span>
          <span style={{ fontSize: '11px', color: 'rgba(250,249,247,0.3)' }}>{relativeTime(post.created_at)}</span>
        </div>
        <p style={{ color: 'rgba(250,249,247,0.75)', fontSize: '13px', lineHeight: 1.6, margin: '0 0 8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {post.body}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Like */}
          <button
            type="button"
            onClick={onLike}
            disabled={likingId === post.id}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', gap: '4px',
              color: 'rgba(250,249,247,0.3)', fontSize: '12px',
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              letterSpacing: '0.06em', transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = CRIMSON)}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(250,249,247,0.3)')}
          >
            <span style={{ fontSize: '13px' }}>♥</span>
            {post.like_count > 0 && <span>{post.like_count}</span>}
          </button>
          {/* Reply */}
          {onReply && (
            <button
              type="button"
              onClick={onReply}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'rgba(250,249,247,0.25)', transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(250,249,247,0.6)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(250,249,247,0.25)')}
            >
              Reply
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
