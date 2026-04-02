'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  displayName: string
  company: string
  onContinue: () => void
}

function buildDefault(displayName: string, company: string): string {
  const name = displayName || 'there'
  const co   = company ? ` from ${company}` : ''
  return `Hey everyone, I'm ${name}${co}. I joined Evolved Pros because I'm committed to levelling up my sales game and building real accountability into my process. Looking forward to connecting with other high performers here. 🚀`
}

export function OnboardingPost({ displayName, company, onContinue }: Props) {
  const [text, setText]               = useState(buildDefault(displayName, company))
  const [channelId, setChannelId]     = useState<string | null>(null)
  const [posting, setPosting]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('channels')
      .select('id')
      .ilike('name', '%general%')
      .limit(1)
      .single()
      .then(({ data }) => { if (data) setChannelId(data.id) })
  }, [])

  async function handlePost() {
    if (!channelId || !text.trim()) { onContinue(); return }
    setPosting(true)
    setError(null)
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId, body: text.trim(), postType: 'update' }),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError((d as { error?: string }).error ?? 'Post failed — try again or skip.')
      setPosting(false)
      return
    }
    setPosting(false)
    onContinue()
  }

  return (
    <div>
      <h2 style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900, fontSize: '26px', color: '#faf9f7', margin: '0 0 6px' }}>
        Introduce yourself.
      </h2>
      <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: '14px', color: 'rgba(250,249,247,0.45)', margin: '0 0 24px' }}>
        The community wants to meet you. One post — no pressure.
      </p>

      <textarea
        value={text}
        onChange={e => setText(e.target.value.slice(0, 500))}
        rows={5}
        style={{
          width: '100%',
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '6px',
          padding: '12px 14px',
          color: '#faf9f7',
          fontSize: '14px',
          fontFamily: 'Barlow, sans-serif',
          lineHeight: 1.55,
          outline: 'none',
          resize: 'vertical',
          boxSizing: 'border-box',
          marginBottom: '6px',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = '#C9A84C' }}
        onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '10px', color: text.length > 450 ? '#ef0e30' : 'rgba(255,255,255,0.25)' }}>
          {text.length}/500
        </span>
      </div>

      {error && (
        <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: '12px', color: '#ef0e30', margin: '0 0 14px' }}>{error}</p>
      )}

      <button
        type="button"
        onClick={handlePost}
        disabled={posting || !text.trim()}
        style={{
          width: '100%',
          padding: '14px 24px',
          backgroundColor: '#C9A84C',
          color: '#0A0F18',
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 900,
          fontSize: '14px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          border: 'none',
          borderRadius: '6px',
          cursor: posting || !text.trim() ? 'not-allowed' : 'pointer',
          opacity: posting || !text.trim() ? 0.5 : 1,
        }}
      >
        {posting ? 'Posting…' : 'Post & Continue →'}
      </button>

      <button
        type="button"
        onClick={onContinue}
        style={{
          display: 'block',
          width: '100%',
          marginTop: '12px',
          padding: '8px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: '"Barlow Condensed", sans-serif',
          fontSize: '11px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.2)',
          textAlign: 'center',
        }}
      >
        Skip intro post
      </button>
    </div>
  )
}
