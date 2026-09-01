import Link from 'next/link'
import type { Metadata } from 'next'
import {
  resolveGuestEngagement,
  ensureGuestPersona,
  markEngagementViewed,
} from '@/lib/guest/engagement'
import { GuestIntakeForm } from './GuestIntakeForm'

export const metadata: Metadata = {
  title: 'Your Guest Guide — Evolved Pros',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

interface Props {
  params: { token: string }
}

const CREAM = '#F5F0E8'
const RED = '#C9302A'
const GOLD = '#C9A84C'
const BG = '#0A0F18'
const dim = (a: number) => `rgba(245,240,232,${a})`

// Public, unauthenticated guest intake. The signed token is the credential —
// validated (signature → existence → expiry) before anything renders. Not in
// the middleware matcher; /guest is in PUBLIC_ROUTES. Committed to the dark
// marketing palette, matching /welcome and /pricing.
export default async function GuestGuidePage({ params }: Props) {
  const token = typeof params.token === 'string' ? params.token.trim() : ''
  const resolved = await resolveGuestEngagement(token)

  if (!resolved.ok) {
    const revoked = resolved.reason === 'revoked'
    const expired = resolved.reason === 'expired'
    return (
      <Shell>
        <p className="font-condensed font-bold uppercase tracking-[0.2em] text-[10px] mb-3" style={{ color: RED }}>
          {revoked ? 'Invite revoked' : expired ? 'Link expired' : 'Invite not found'}
        </p>
        <h1 className="font-display font-bold text-3xl sm:text-4xl mb-4" style={{ color: CREAM }}>
          {revoked
            ? 'This guest link is no longer active.'
            : expired
              ? 'This guest link has expired.'
              : "We couldn't find that guest link."}
        </h1>
        <p className="font-body text-sm mb-8" style={{ color: dim(0.5) }}>
          The link may be mistyped or out of date. Reach out to the Evolved Pros team
          and we&rsquo;ll send you a fresh one.
        </p>
        <Link
          href="/podcast"
          className="inline-block py-3 px-6 rounded-lg font-condensed font-bold uppercase tracking-[0.1em] text-[12px] transition-opacity hover:opacity-90"
          style={{ backgroundColor: dim(0.08), color: CREAM, border: `1px solid ${dim(0.14)}` }}
        >
          Explore the show
        </Link>
      </Shell>
    )
  }

  const eng = resolved.engagement
  // Idempotent: keep the persona/entitlement correct and advance invited → viewed.
  await ensureGuestPersona(eng.user_id)
  await markEngagementViewed(eng.engagement_id, eng.status)

  const firstName = (eng.guest_first_name || eng.guest_full_name?.split(' ')[0] || 'there').trim()
  const episodeTitle = eng.episode_title

  return (
    <div style={{ backgroundColor: BG, minHeight: '100vh' }} className="flex flex-col">
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: `1px solid ${dim(0.06)}` }}
      >
        <Link
          href="/"
          className="font-condensed font-bold tracking-[0.18em] text-[14px]"
          style={{ color: CREAM, textDecoration: 'none' }}
        >
          EVOLVED<span style={{ color: RED }}>·</span>PROS
        </Link>
        <span className="font-condensed uppercase tracking-[0.18em] text-[10px]" style={{ color: dim(0.4) }}>
          Guest Guide
        </span>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        {/* Hero */}
        <p className="font-condensed font-bold uppercase tracking-[0.2em] text-[10px] mb-3" style={{ color: GOLD }}>
          {episodeTitle ? 'You’re booked on the show' : 'Welcome to the show'}
        </p>
        <h1 className="font-display font-bold text-3xl sm:text-5xl mb-4" style={{ color: CREAM }}>
          Welcome, {firstName}.
        </h1>
        <p className="font-body text-[15px] leading-relaxed mb-2" style={{ color: dim(0.7) }}>
          We&rsquo;re thrilled to have you as a guest on{' '}
          <span style={{ color: CREAM, fontWeight: 600 }}>Evolved Pros</span>
          {episodeTitle ? (
            <>
              {' '}for <span style={{ color: CREAM, fontWeight: 600 }}>&ldquo;{episodeTitle}&rdquo;</span>
            </>
          ) : null}
          . This guide walks you through what to expect, how to prep, and the few details we
          need to make you look great.
        </p>
        <p className="font-body text-[14px] mb-10" style={{ color: dim(0.45) }}>
          As our guest you also get complimentary{' '}
          <span style={{ color: CREAM, fontWeight: 600 }}>Professional</span> access to the
          Evolved Pros platform — the full 6-Pillar Academy and community, on us.
        </p>

        {/* Guide sections */}
        <div className="grid gap-4 sm:grid-cols-2 mb-12">
          <GuideCard
            n="01"
            title="What to expect"
            body="A relaxed 45–60 minute conversation, recorded on video. No script — George will guide it. We edit for clarity, never to change your meaning."
          />
          <GuideCard
            n="02"
            title="How to prep"
            body="Come with 2–3 stories or ideas you're excited to share. The best episodes are specific: real numbers, real moments, real lessons."
          />
          <GuideCard
            n="03"
            title="Your tech check"
            body="Wired headphones, a quiet room, and the camera at eye level. Join from a laptop or desktop (not a phone). We'll send a link before we roll."
          />
          <GuideCard
            n="04"
            title="After we record"
            body="We produce the episode, then share it across the show, YouTube, and social. You'll get assets to share with your own audience."
          />
        </div>

        {/* Intake */}
        <div className="mb-6">
          <p className="font-condensed font-bold uppercase tracking-[0.2em] text-[10px] mb-2" style={{ color: RED }}>
            One quick step
          </p>
          <h2 className="font-display font-bold text-2xl sm:text-3xl mb-2" style={{ color: CREAM }}>
            Tell us about you
          </h2>
          <p className="font-body text-[14px]" style={{ color: dim(0.55) }}>
            This is how we&rsquo;ll introduce you on air and in the show notes. It takes about
            three minutes. You can come back and edit anytime with this same link.
          </p>
        </div>

        <GuestIntakeForm
          token={token}
          initial={{
            first_name: eng.guest_first_name ?? '',
            last_name: eng.guest_last_name ?? '',
            company: eng.guest_company ?? '',
            role_title: eng.guest_role_title ?? '',
            one_liner: eng.one_liner ?? '',
            short_bio: eng.short_bio ?? eng.guest_bio ?? '',
            headshot_url: eng.headshot_url ?? eng.guest_avatar_url ?? '',
            topics: normalizeTopics(eng.topics),
            links: normalizeLinks(eng.links),
            av_notes: eng.av_notes ?? '',
            tee_size: eng.tee_size ?? '',
            linkedin_url: eng.guest_linkedin_url ?? '',
            twitter_handle: eng.guest_twitter_handle ?? '',
            consent_release: eng.consent_release ?? false,
          }}
          alreadySubmitted={eng.status === 'submitted' || eng.status === 'confirmed'}
        />
      </main>

      <footer className="px-6 py-8 text-center">
        <p className="font-body text-[12px]" style={{ color: dim(0.3) }}>
          Questions? Just reply to the email that brought you here.
        </p>
      </footer>
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: BG, minHeight: '100vh' }} className="flex flex-col">
      <header className="flex items-center px-6 py-4" style={{ borderBottom: `1px solid ${dim(0.06)}` }}>
        <Link
          href="/"
          className="font-condensed font-bold tracking-[0.18em] text-[14px]"
          style={{ color: CREAM, textDecoration: 'none' }}
        >
          EVOLVED<span style={{ color: RED }}>·</span>PROS
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg text-center">{children}</div>
      </div>
    </div>
  )
}

function GuideCard({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: 'rgba(245,240,232,0.035)', border: `1px solid ${dim(0.08)}` }}
    >
      <span className="font-display font-black text-[22px]" style={{ color: 'rgba(201,168,76,0.5)' }}>
        {n}
      </span>
      <h3 className="font-condensed font-bold uppercase tracking-[0.08em] text-[13px] mt-1 mb-1.5" style={{ color: CREAM }}>
        {title}
      </h3>
      <p className="font-body text-[13px] leading-relaxed" style={{ color: dim(0.55) }}>
        {body}
      </p>
    </div>
  )
}

function normalizeTopics(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map(x => (typeof x === 'string' ? x : '')).filter(Boolean)
}

function normalizeLinks(v: unknown): { label: string; url: string }[] {
  if (!Array.isArray(v)) return []
  const out: { label: string; url: string }[] = []
  for (const item of v) {
    if (typeof item === 'string') out.push({ label: '', url: item })
    else if (item && typeof item === 'object') {
      out.push({
        label: String((item as any).label ?? ''),
        url: String((item as any).url ?? ''),
      })
    }
  }
  return out
}
