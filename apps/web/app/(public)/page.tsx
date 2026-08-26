import type { Metadata } from 'next'
import Link from 'next/link'
import { LogoMark } from '@/components/ui/LogoMark'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { listPublicMediaStories } from '@/lib/media/sitemap'
import { SITE_URL, getPublishedEpisodes } from '@/lib/podcast/public'

/**
 * The public front door (SPRINT GATE-1).
 *
 * www.evolvedpros.com now points here. This route used to be four lines of
 * redirect('/login'), so anyone typing the bare domain — a prospect, a
 * podcast listener, Googlebot — was handed a login form and nothing else.
 *
 * Two rules this page must keep:
 *
 *  1. It NEVER redirects. A signed-in visitor gets the same page with a
 *     different top-right link. Redirecting / to /home would take the landing
 *     page away from crawlers the moment a session cookie existed.
 *
 *  2. Every section renders real rows or does not render at all. There are no
 *     testimonials, member counts, or outcome claims here, because we do not
 *     have any we can stand behind. The copy is structural — what the platform
 *     verifiably IS — not promotional. Positioning copy is George's call and
 *     has not been approved; this ships the vessel, not the pitch.
 *
 * The (public) layout is a pass-through, so this page owns its own chrome. It
 * deliberately does NOT mount TopNav or BottomTabBar — those are member
 * surfaces. Unlike /pricing and /live it is theme-aware, so every colour here
 * is a semantic token that flips with the app theme.
 */

const LOGO_CIRCLE_DARK = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Branding/logo_circle_dark.png`

export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
  openGraph: {
    url: SITE_URL,
    images: [{ url: LOGO_CIRCLE_DARK }],
  },
  twitter: {
    images: [LOGO_CIRCLE_DARK],
  },
}

interface LandingEpisode {
  slug: string
  title: string
  guestName: string | null
}

interface LandingStory {
  slug: string
  pillar: string
  title: string
}

/** At most three, and never a hard failure — the door stays open regardless. */
async function loadEpisodes(): Promise<LandingEpisode[]> {
  try {
    const episodes = await getPublishedEpisodes()
    return episodes.slice(0, 3).map(e => ({
      slug: e.slug,
      title: e.title,
      guestName: e.guest_name,
    }))
  } catch {
    // A DB hiccup must not blank the front door — the section just won't render.
    return []
  }
}

async function loadStories(): Promise<LandingStory[]> {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('media_stories')
      .select('title, slug, pillar, is_published, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(12)
    // listPublicMediaStories, never the raw is_published filter alone: two
    // slugs are denylisted in UNPUBLISHED_MEDIA_PATHS despite is_published
    // being true, and a raw query would put them on the front door.
    return listPublicMediaStories(data ?? [])
      .slice(0, 3)
      .map(s => ({ slug: s.slug as string, pillar: s.pillar as string, title: s.title as string }))
  } catch {
    return []
  }
}

export default async function LandingPage() {
  // PUBLIC. resolveCurrentUser returns null for an anonymous visitor and this
  // page never redirects on the result — it only swaps one link.
  const [profile, episodes, stories] = await Promise.all([
    resolveCurrentUser(),
    loadEpisodes(),
    loadStories(),
  ])
  const signedIn = profile !== null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          maxWidth: 1120,
          margin: '0 auto',
          padding: '20px 20px',
        }}
      >
        {/* Pure-CSS wordmark swap, the same one BrandedLoading uses: exactly one
            variant displays per theme. TopNav does this with useTheme(), but
            that is a client hook and this page is a server component — the CSS
            toggle needs no client JS and never flashes the wrong variant.
            The class goes on a WRAPPER, not on LogoMark: LogoMark sets
            display:block inline, and an inline style beats the class rule, so
            classing the img directly renders BOTH wordmarks at once. */}
        <span style={{ alignItems: 'center' }}>
          <span className="ep-loader-logo--dark">
            <LogoMark variant="light" height={30} />
          </span>
          <span className="ep-loader-logo--light">
            <LogoMark variant="dark" height={30} />
          </span>
        </span>

        {/* Sign in is deliberately modest — /pricing is the primary action. */}
        <Link
          href={signedIn ? '/home' : '/login'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: 44,
            padding: '0 4px',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
          }}
        >
          {signedIn ? 'Open the platform' : 'Sign in'}
        </Link>
      </header>

      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '0 20px 72px' }}>
        {/* Structural, not promotional. Says what the platform is; claims
            nothing about what it does for you. */}
        <section style={{ padding: '48px 0 40px', maxWidth: 720 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: '"Bebas Neue", Impact, sans-serif',
              fontSize: 'clamp(40px, 7vw, 68px)',
              lineHeight: 1.02,
              letterSpacing: '0.01em',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
            }}
          >
            Evolved Pros
          </h1>
          <p
            style={{
              margin: '16px 0 0',
              fontFamily: '"Barlow", sans-serif',
              fontSize: 18,
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
            }}
          >
            A membership community for sales and business professionals, with a podcast, an
            academy, and live events.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 28 }}>
            <Link
              href="/pricing"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: 48,
                padding: '0 26px',
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                background: 'var(--brand-red)',
                color: 'var(--white)',
                textDecoration: 'none',
              }}
            >
              See membership
            </Link>
            <NavLink href="/podcast" label="Podcast" />
            <NavLink href="/media" label="Media" />
            <NavLink href="/live" label="Live" />
          </div>
        </section>

        {/* Renders only with real rows. No episodes → no section, no empty state
            pretending to be one. Transcripts are never printed here. */}
        {episodes.length > 0 && (
          <Panel title="Latest episodes" href="/podcast" linkLabel="All episodes">
            {episodes.map(e => (
              <Card key={e.slug} href={`/podcast/${e.slug}`} title={e.title} meta={e.guestName} />
            ))}
          </Panel>
        )}

        {stories.length > 0 && (
          <Panel title="From Evolved Media" href="/media" linkLabel="All stories">
            {stories.map(s => (
              <Card key={s.slug} href={`/media/${s.pillar}/${s.slug}`} title={s.title} meta={null} />
            ))}
          </Panel>
        )}
      </main>
    </div>
  )
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 48,
        padding: '0 18px',
        fontFamily: '"Barlow Condensed", sans-serif',
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
        textDecoration: 'none',
      }}
    >
      {label}
    </Link>
  )
}

function Panel({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string
  href: string
  linkLabel: string
  children: React.ReactNode
}) {
  return (
    <section style={{ padding: '32px 0', borderTop: '1px solid var(--border-color)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 18,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--brand-red)',
          }}
        >
          {title}
        </h2>
        <Link
          href={href}
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
            textDecoration: 'none',
          }}
        >
          {linkLabel}
        </Link>
      </div>
      <ul
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
          margin: 0,
          padding: 0,
          listStyle: 'none',
        }}
      >
        {children}
      </ul>
    </section>
  )
}

function Card({ href, title, meta }: { href: string; title: string; meta: string | null }) {
  return (
    <li style={{ minWidth: 0 }}>
      <Link
        href={href}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          height: '100%',
          padding: 16,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          textDecoration: 'none',
        }}
      >
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1.25,
            color: 'var(--text-primary)',
          }}
        >
          {title}
        </span>
        {meta && (
          <span style={{ fontFamily: '"Barlow", sans-serif', fontSize: 13, color: 'var(--text-tertiary)' }}>
            {meta}
          </span>
        )}
      </Link>
    </li>
  )
}
