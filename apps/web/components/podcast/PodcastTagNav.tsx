import Link from 'next/link'

const FBC = 'var(--font-barlow-condensed)'

// Crawlable topic filter for the public podcast index (SPRINT L, Task 2).
// Every tag is a real <a href="/podcast?tag=…"> so search engines can discover
// and index each filtered view — this is deliberately NOT the client-state
// pillar filter in PodcastGrid, which lives only in memory and is uncrawlable.
// The server page reads searchParams.tag and filters the query with
// .contains('tags', [tag]); this component just renders the links.
interface PodcastTagNavProps {
  allTags: string[]
  activeTag: string | null
}

const PILL_BASE: React.CSSProperties = {
  minHeight: 36,
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0 12px',
  borderRadius: 0,
  fontFamily: FBC,
  fontWeight: 700,
  fontSize: 12,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  transition: 'all 120ms ease',
}

export function PodcastTagNav({ allTags, activeTag }: PodcastTagNavProps) {
  if (!allTags.length) return null

  return (
    <nav
      aria-label="Filter episodes by topic"
      style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}
    >
      <span
        style={{
          fontFamily: FBC,
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: 'var(--podcast-text-4)',
          marginRight: 4,
        }}
      >
        Topics
      </span>

      <Link
        href="/podcast"
        aria-current={activeTag ? undefined : 'page'}
        style={{
          ...PILL_BASE,
          background: activeTag ? 'transparent' : 'var(--brand-gold)',
          color: activeTag ? 'var(--brand-gold)' : 'var(--bg-page)',
          border: `1px solid ${activeTag ? 'color-mix(in srgb, var(--brand-gold) 40%, transparent)' : 'var(--brand-gold)'}`,
        }}
      >
        All
      </Link>

      {allTags.map(tag => {
        const active = tag === activeTag
        return (
          <Link
            key={tag}
            href={`/podcast?tag=${encodeURIComponent(tag)}`}
            aria-current={active ? 'page' : undefined}
            style={{
              ...PILL_BASE,
              background: active ? 'var(--podcast-text-strong)' : 'transparent',
              color: active ? 'var(--podcast-bg-page)' : 'var(--podcast-text-3)',
              border: `1px solid ${active ? 'var(--podcast-text-strong)' : 'var(--podcast-border-strong)'}`,
            }}
          >
            {tag}
          </Link>
        )
      })}
    </nav>
  )
}
