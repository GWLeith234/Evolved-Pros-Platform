import type { Metadata } from 'next'
import Link from 'next/link'
import { LogoMark } from '@/components/ui/LogoMark'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { listPublicMediaStories } from '@/lib/media/sitemap'
import { getPublishedEpisodes } from '@/lib/podcast/public'
import { publicPageMetadata } from '@/lib/seo/canonical'
import { getActivePlatformAds } from '@/lib/cache/shared'
import { pickHomePageAds } from '@/lib/sponsors/partners'
import { takeHomeContentRow } from '@/lib/home/contentRow'
import { adMatchesSurface } from '@/lib/ads/iab'
import {
  HomeContentAdGrid,
  HomeEditorialCard,
  HomeEndBox,
} from '@/components/home/HomeContentAdGrid'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'

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

export const metadata: Metadata = publicPageMetadata('/', {
  openGraph: {
    images: [{ url: LOGO_CIRCLE_DARK }],
  },
  twitter: {
    images: [LOGO_CIRCLE_DARK],
  },
})

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

/** At most two editorial cards — the third slot is an IAB, not another story. */
async function loadEpisodes(): Promise<LandingEpisode[]> {
  try {
    const episodes = await getPublishedEpisodes()
    return takeHomeContentRow(episodes).map(e => ({
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
    return takeHomeContentRow(listPublicMediaStories(data ?? [])).map(s => ({
      slug: s.slug as string,
      pillar: s.pillar as string,
      title: s.title as string,
    }))
  } catch {
    return []
  }
}

async function loadLandingAds() {
  try {
    const all = (await getActivePlatformAds()) as SponsorAd[]
    const homePool = all.filter(a => adMatchesSurface(a, 'home'))
    return pickHomePageAds(homePool.length ? homePool : all)
  } catch {
    return pickHomePageAds([])
  }
}

export default async function LandingPage() {
  // PUBLIC. resolveCurrentUser returns null for an anonymous visitor and this
  // page never redirects on the result — it only swaps one link.
  const [profile, episodes, stories, ads] = await Promise.all([
    resolveCurrentUser(),
    loadEpisodes(),
    loadStories(),
    loadLandingAds(),
  ])
  const signedIn = profile !== null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px 16px',
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

        {/* DOORS-1 — the header used to offer "Sign in" and nothing else, so
            the only door on the front page was the one for people who already
            had a key. Join free is now the primary action; Sign in stays as a
            ghost beside it. Podcast / Media / LIVE moved up here from the hero
            button row, where they were competing with the CTA.
            Wraps rather than scrolls: at 360px the nav drops under the
            wordmark instead of pushing the page wide. */}
        <nav
          aria-label="Primary"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '8px 14px',
            minWidth: 0,
          }}
        >
          <HeaderLink href="/podcast" label="Podcast" />
          <HeaderLink href="/media" label="Media" />
          <HeaderLink href="/live" label="LIVE" />
          {signedIn ? (
            <HeaderLink href="/home" label="Open the platform" />
          ) : (
            <>
              <HeaderLink href="/login" label="Sign in" />
              <HeaderCta href="/pricing" label="Join free" />
            </>
          )}
        </nav>
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

          {/* DOORS-1 — exactly one red primary and one ghost. The hero used
              to be a red "See membership" plus three bordered section buttons
              (Podcast / Media / LIVE), which read as four competing CTAs and
              sent the only strong one at the paywall. Those three are now
              header nav links; the primary is Join free → /pricing, not the
              /join 308. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 28 }}>
            {signedIn ? (
              <PrimaryCta href="/home" label="Open the platform" />
            ) : (
              <PrimaryCta href="/pricing" label="Join free — full community, no card" />
            )}
            <NavLink href="/pricing" label="See pricing" />
          </div>

          {/* Verbatim from /pricing (page.tsx:102) — the one line that makes
              "no card" mean something. No other claim is added here. */}
          <p
            style={{
              margin: '16px 0 0',
              fontFamily: '"Barlow", sans-serif',
              fontSize: 14,
              lineHeight: 1.6,
              color: 'var(--text-tertiary)',
            }}
          >
            Everything but the curriculum is free. The Academy is what you upgrade for.
          </p>
        </section>

        {/* Renders only with real rows. No episodes → no section, no empty state
            pretending to be one. Transcripts are never printed here. */}
        {episodes.length > 0 && (
          <HomeContentAdGrid title="Latest episodes" href="/podcast" linkLabel="All episodes" ad={ads.episodeRow}>
            {episodes.map(e => (
              <HomeEditorialCard key={e.slug} href={`/podcast/${e.slug}`} title={e.title} meta={e.guestName} />
            ))}
          </HomeContentAdGrid>
        )}

        {stories.length > 0 && (
          <HomeContentAdGrid title="From Evolved Media" href="/media" linkLabel="All stories" ad={ads.storyRow}>
            {stories.map(s => (
              <HomeEditorialCard
                key={s.slug}
                href={`/media/${s.pillar}/${s.slug}`}
                title={s.title}
                meta={null}
              />
            ))}
          </HomeContentAdGrid>
        )}

        <HomeEndBox ad={ads.endBox} />
      </main>
    </div>
  )
}

/** Compact header nav item. Text only — the header's one button is HeaderCta. */
function HeaderLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 44,
        padding: '0 2px',
        fontFamily: '"Barlow Condensed", sans-serif',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </Link>
  )
}

/** The header's single red CTA. */
function HeaderCta({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 40,
        padding: '0 16px',
        fontFamily: '"Barlow Condensed", sans-serif',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        background: 'var(--brand-red)',
        color: 'var(--white)',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </Link>
  )
}

/** The hero's single red CTA. Wraps rather than overflows on a narrow phone. */
function PrimaryCta({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 48,
        padding: '12px 26px',
        fontFamily: '"Barlow Condensed", sans-serif',
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        background: 'var(--brand-red)',
        color: 'var(--white)',
        textDecoration: 'none',
        maxWidth: '100%',
      }}
    >
      {label}
    </Link>
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

