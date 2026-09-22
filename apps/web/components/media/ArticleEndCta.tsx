'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  articleCtaCopy,
  toArticleCtaState,
  type ArticleCtaState,
} from '@/lib/media/articleCta'

/**
 * The door out of an article and into the platform (SPRINT M).
 *
 * Renders the signed-out copy immediately - that is what an anonymous crawler
 * and a cold first paint should both see - then asks /api/media/viewer who is
 * actually reading and swaps to the upgrade copy for a free-tier member, or
 * removes itself entirely for someone who already pays. Doing it this way
 * keeps the article route ISR; see the route's own comment.
 *
 * No tier logic lives here. The server decides; this renders.
 */
export function ArticleEndCta() {
  const [state, setState] = useState<ArticleCtaState>('anon')

  useEffect(() => {
    let live = true
    fetch('/api/media/viewer', { credentials: 'same-origin' })
      .then(res => (res.ok ? res.json() : null))
      .then((data: { state?: unknown } | null) => {
        if (live && data) setState(toArticleCtaState(data.state))
      })
      .catch(() => {
        // Leave the free-door copy up. Failing to a sell that is merely
        // redundant beats failing to a blank end-of-article.
      })
    return () => {
      live = false
    }
  }, [])

  const copy = articleCtaCopy(state)
  if (!copy) return null

  return (
    <section
      className="ep-media-soft-cta"
      data-media-module="article-end-cta"
      data-cta-state={state}
    >
      <p className="ep-media-soft-cta-kicker">{copy.kicker}</p>
      <h2>{copy.headline}</h2>
      <p>{copy.body}</p>
      <div className="ep-media-soft-cta-row">
        <Link href={copy.primary.href}>{copy.primary.label}</Link>
        {copy.secondary ? (
          <Link href={copy.secondary.href} className="ep-media-soft-cta-ghost">
            {copy.secondary.label}
          </Link>
        ) : null}
      </div>
    </section>
  )
}
