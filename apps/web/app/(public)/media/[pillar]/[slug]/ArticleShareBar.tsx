'use client'

import { useState } from 'react'

interface Props {
  articleUrl: string
  articleTitle: string
  label?: string
}

export function ArticleShareBar({ articleUrl, articleTitle, label = 'Share' }: Props) {
  const [copied, setCopied] = useState(false)
  const encodedUrl = encodeURIComponent(articleUrl)
  const encodedTitle = encodeURIComponent(articleTitle)

  return (
    <div className="ep-media-share" data-media-module="share">
      <span className="ep-media-share-label">{label}</span>
      <button
        type="button"
        className="ep-media-share-btn"
        onClick={() => {
          window.location.href = `mailto:?subject=${encodedTitle}&body=${encodedUrl}`
        }}
      >
        Email
      </button>
      <button
        type="button"
        className="ep-media-share-btn"
        onClick={() =>
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank', 'noopener')
        }
      >
        Facebook
      </button>
      <button
        type="button"
        className="ep-media-share-btn"
        onClick={() =>
          window.open(
            `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
            '_blank',
            'noopener',
          )
        }
      >
        X
      </button>
      <button
        type="button"
        className="ep-media-share-btn"
        onClick={() =>
          window.open(`https://linkedin.com/shareArticle?url=${encodedUrl}`, '_blank', 'noopener')
        }
      >
        LinkedIn
      </button>
      <button
        type="button"
        className="ep-media-share-btn"
        onClick={() => window.print()}
      >
        Print
      </button>
      <button
        type="button"
        className="ep-media-share-btn ep-media-share-btn--ghost"
        onClick={() => {
          void navigator.clipboard.writeText(articleUrl)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}
