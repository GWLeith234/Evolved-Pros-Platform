'use client'

import { useState } from 'react'

interface Props {
  articleUrl: string
  articleTitle: string
  label: string
}

const btnBase = {
  fontFamily: 'var(--font-condensed)',
  fontWeight: 700,
  fontSize: 11,
  padding: '6px 14px',
  borderRadius: 2,
  border: 'none',
  cursor: 'pointer',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
}

export function ArticleShareBar({ articleUrl, articleTitle, label }: Props) {
  const [copied, setCopied] = useState(false)

  return (
    <div style={{ borderTop: '2px solid #2B3A5A', borderBottom: '1px solid rgba(43,58,90,0.12)', padding: '10px 0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 10, color: '#2B3A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 4 }}>
        {label}
      </span>
      <button
        type="button"
        onClick={() => window.open(`https://linkedin.com/shareArticle?url=${encodeURIComponent(articleUrl)}`, '_blank', 'noopener')}
        style={{ ...btnBase, backgroundColor: '#0077B5', color: '#fff' }}
      >
        in LinkedIn
      </button>
      <button
        type="button"
        onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(articleTitle)}`, '_blank', 'noopener')}
        style={{ ...btnBase, backgroundColor: '#000', color: '#fff' }}
      >
        𝕏 Twitter
      </button>
      <button
        type="button"
        onClick={() => { window.location.href = `mailto:?subject=${encodeURIComponent(articleTitle)}&body=${encodeURIComponent(articleUrl)}` }}
        style={{ ...btnBase, backgroundColor: '#2B3A5A', color: '#fff' }}
      >
        ✉ Email
      </button>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(articleUrl)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}
        style={{ ...btnBase, backgroundColor: 'transparent', color: '#2B3A5A', border: '1px solid rgba(43,58,90,0.2)' }}
      >
        {copied ? '✓ Copied!' : '⎘ Copy link'}
      </button>
    </div>
  )
}
