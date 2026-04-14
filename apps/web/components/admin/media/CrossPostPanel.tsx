'use client'

import { useState, useRef } from 'react'

interface CrossPostPanelProps {
  title: string
  body: string
  slug: string
  pillar: string
}

type Tab = 'linkedin' | 'thread' | 'email'

const TAB_LABELS: Record<Tab, string> = {
  linkedin: 'LinkedIn',
  thread: 'X Thread',
  email: 'Email',
}

export function CrossPostPanel({ title, body, slug, pillar }: CrossPostPanelProps) {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [linkedin, setLinkedin] = useState('')
  const [thread, setThread] = useState<string[]>([])
  const [email, setEmail] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('linkedin')
  const [copied, setCopied] = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/media/crosspost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, slug, pillar }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setLinkedin(data.linkedin ?? '')
      setThread(data.thread ?? [])
      setEmail(data.email ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate')
    } finally {
      setGenerating(false)
    }
  }

  function handleCopy() {
    if (textRef.current) {
      textRef.current.select()
      document.execCommand('copy')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const hasContent = linkedin || thread.length > 0 || email

  const currentContent =
    activeTab === 'linkedin' ? linkedin :
    activeTab === 'thread' ? thread.map((t, i) => `${i + 1}/ ${t}`).join('\n\n') :
    email

  const charCount = activeTab === 'linkedin' ? linkedin.length :
    activeTab === 'thread' ? thread.map(t => t.length) : null

  return (
    <div
      className="rounded-lg p-5 mt-6"
      style={{ backgroundColor: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.2)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px]" style={{ color: '#C9A84C' }}>
            Cross-Post Kit
          </p>
          <p className="font-condensed text-[11px]" style={{ color: '#7a8a96' }}>
            Generate LinkedIn, X, and email content from this article
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="font-condensed font-bold uppercase tracking-[0.1em] text-[11px] px-4 py-2 rounded transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#C9A84C', color: '#fff', opacity: generating ? 0.5 : 1 }}
        >
          {generating ? 'Generating...' : hasContent ? 'Regenerate' : 'Generate Social Content'}
        </button>
      </div>

      {error && (
        <p className="font-condensed text-[11px] mb-3" style={{ color: '#ef0e30' }}>{error}</p>
      )}

      {hasContent && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-3" style={{ borderBottom: '1px solid rgba(27,60,90,0.08)' }}>
            {(Object.keys(TAB_LABELS) as Tab[]).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => { setActiveTab(tab); setCopied(false) }}
                className="font-condensed font-semibold uppercase tracking-[0.12em] text-[10px] px-4 py-2 transition-colors"
                style={{
                  color: activeTab === tab ? '#1b3c5a' : '#7a8a96',
                  borderBottom: activeTab === tab ? '2px solid #1b3c5a' : '2px solid transparent',
                }}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          {/* Content */}
          <textarea
            ref={textRef}
            value={currentContent}
            readOnly
            rows={10}
            className="w-full rounded px-3 py-2.5 font-body text-[13px] text-[#1b3c5a] resize-y outline-none"
            style={{ border: '1px solid rgba(27,60,90,0.15)', backgroundColor: '#fff', lineHeight: '1.6' }}
          />

          {/* Char count + Copy */}
          <div className="flex items-center justify-between mt-2">
            <div className="font-condensed text-[10px]" style={{ color: '#7a8a96' }}>
              {activeTab === 'linkedin' && `${linkedin.length}/1300 chars`}
              {activeTab === 'thread' && thread.map((t, i) => (
                <span key={i} style={{ marginRight: 8, color: t.length > 280 ? '#ef0e30' : '#7a8a96' }}>
                  Tweet {i + 1}: {t.length}/280
                </span>
              ))}
              {activeTab === 'email' && `${email.length} chars`}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="font-condensed font-bold uppercase tracking-[0.1em] text-[10px] px-3 py-1.5 rounded transition-colors"
              style={{
                backgroundColor: copied ? 'rgba(34,197,94,0.1)' : 'rgba(27,60,90,0.06)',
                color: copied ? '#22c55e' : '#1b3c5a',
                border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(27,60,90,0.1)'}`,
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
