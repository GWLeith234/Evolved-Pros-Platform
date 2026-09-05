import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LogoMark } from '@/components/ui/LogoMark'
import { footerCopyright } from '@/lib/layout/publicFooter'
import {
  HERO_IMAGE_ALT,
  HERO_IMAGE_HEIGHT,
  HERO_IMAGE_SRC,
  HERO_IMAGE_WIDTH,
  HOME_ARIA,
  HOME_BOOK,
  HOME_EPISODES_LINK,
  HOME_EPISODES_TITLE,
  HOME_H1,
  HOME_JOIN_FREE,
  HOME_LADDER,
  HOME_LADDER_LINE,
  HOME_LADDER_SUB,
  HOME_NAV_LINKS,
  HOME_OPEN_PLATFORM,
  HOME_OPEN_PLATFORM_HREF,
  HOME_PRIMARY_CTA,
  HOME_SECONDARY_CTA,
  HOME_SIGN_IN,
  HOME_SUB,
  JOIN_FREE_HREF,
  SEE_PRICING_HREF,
  homeEpisodeKicker,
  homeEpisodeMeta,
  type HomeLadderCard,
} from '@/lib/home/conversion'

export interface ConversionEpisode {
  slug: string
  title: string
  guestName: string | null
  episodeNumber: number | null
  publishedAt: string | null
  durationSeconds: number | null
  stillUrl: string | null
}

export function ConversionHome({
  signedIn,
  episodes,
}: {
  signedIn: boolean
  episodes: ConversionEpisode[]
}) {
  return (
    <div className="ep-conversion-home min-h-dvh bg-paper text-navy">
      <header className="border-b border-navy">
        <div className="mx-auto max-w-6xl px-5 py-3 md:py-4">
          <div className="flex h-10 items-center justify-between gap-3 md:h-auto">
            <Link href="/" aria-label={HOME_ARIA} className="shrink-0">
              <LogoMark variant="dark" height={28} />
            </Link>
            <div className="flex min-w-0 items-center justify-end gap-3">
              <nav
                aria-label="Primary"
                className="hidden min-w-0 items-center gap-x-3.5 md:flex"
              >
                {HOME_NAV_LINKS.map(link => (
                  <NavLink key={link.href} href={link.href} live={'live' in link && link.live}>
                    {link.label}
                  </NavLink>
                ))}
                {signedIn ? (
                  <NavLink href={HOME_OPEN_PLATFORM_HREF}>{HOME_OPEN_PLATFORM}</NavLink>
                ) : (
                  <NavLink href="/login">{HOME_SIGN_IN}</NavLink>
                )}
              </nav>
              {signedIn ? (
                <Link
                  href={HOME_OPEN_PLATFORM_HREF}
                  className="inline-flex min-h-10 items-center bg-red px-4 font-condensed text-[13px] font-bold uppercase tracking-[0.14em] text-white no-underline md:hidden"
                >
                  {HOME_OPEN_PLATFORM}
                </Link>
              ) : (
                <Link
                  href={JOIN_FREE_HREF}
                  className="inline-flex min-h-10 shrink-0 items-center bg-red px-4 font-condensed text-[13px] font-bold uppercase tracking-[0.14em] text-white no-underline"
                >
                  {HOME_JOIN_FREE}
                </Link>
              )}
            </div>
          </div>
          <nav
            aria-label="Sections"
            className="mt-1 flex h-9 items-center gap-x-3 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden"
          >
            {HOME_NAV_LINKS.map(link => (
              <NavLink key={link.href} href={link.href} live={'live' in link && link.live} compact>
                {link.label}
              </NavLink>
            ))}
            {signedIn ? null : (
              <NavLink href="/login" compact>
                {HOME_SIGN_IN}
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section
          aria-label={HERO_IMAGE_ALT}
          className="relative aspect-[3/2] w-full overflow-hidden bg-page"
        >
          <Image
            src={HERO_IMAGE_SRC}
            alt={HERO_IMAGE_ALT}
            width={HERO_IMAGE_WIDTH}
            height={HERO_IMAGE_HEIGHT}
            priority
            className="h-full w-full object-cover"
            sizes="100vw"
          />
        </section>

        <section className="mx-auto max-w-3xl px-5 pb-12 pt-10 text-center">
          <h1 className="font-display text-[clamp(1.75rem,4.5vw,2.75rem)] font-bold leading-tight text-navy">
            {HOME_H1}
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-body text-lg leading-relaxed text-navy/70">
            {HOME_SUB}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {signedIn ? (
              <PrimaryCta href={HOME_OPEN_PLATFORM_HREF} label={HOME_OPEN_PLATFORM} />
            ) : (
              <PrimaryCta href={JOIN_FREE_HREF} label={HOME_PRIMARY_CTA} />
            )}
            <GhostCta href={SEE_PRICING_HREF} label={HOME_SECONDARY_CTA} />
          </div>
        </section>

        {episodes.length > 0 ? (
          <section className="mx-auto max-w-6xl border-t border-navy/15 px-5 py-12">
            <div className="mb-5 flex items-baseline justify-between gap-4">
              <h2 className="font-condensed text-[13px] font-bold uppercase tracking-[0.2em] text-navy">
                {HOME_EPISODES_TITLE}
              </h2>
              <Link
                href="/podcast"
                className="font-condensed text-xs font-bold uppercase tracking-[0.14em] text-teal no-underline"
              >
                {HOME_EPISODES_LINK}
              </Link>
            </div>
            <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
              {episodes.map(episode => {
                const heading = episode.guestName || episode.title
                const meta = homeEpisodeMeta(episode.publishedAt, episode.durationSeconds)
                return (
                  <li key={episode.slug} className="min-w-0">
                    <Link href={`/podcast/${episode.slug}`} className="block bg-paper-card no-underline">
                      <div className="relative aspect-video overflow-hidden bg-navy/10">
                        {episode.stillUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={episode.stillUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="border border-navy/15 border-t-0 px-4 py-4">
                        <p className="font-condensed text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
                          {homeEpisodeKicker(episode.episodeNumber)}
                        </p>
                        <h3 className="mt-1 font-display text-xl font-bold leading-snug text-navy">
                          {heading}
                        </h3>
                        {meta ? (
                          <p className="mt-2 font-condensed text-xs font-semibold uppercase tracking-[0.12em] text-navy/55">
                            {meta}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        ) : null}

        <section className="mx-auto max-w-6xl border-t border-navy/15 px-5 py-14">
          <h2 className="text-center font-display text-[clamp(1.4rem,3vw,2rem)] font-bold text-navy">
            {HOME_LADDER_LINE}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center font-body text-sm leading-relaxed text-navy/65">
            {HOME_LADDER_SUB}
          </p>
          <ol className="mt-10 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-3">
            {HOME_LADDER.map(card => (
              <li key={card.name}>
                <LadderCard card={card} />
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16">
          <div className="flex flex-wrap items-center justify-between gap-6 border border-navy/15 bg-paper-card px-6 py-8">
            <div>
              <p className="font-condensed text-[11px] font-bold uppercase tracking-[0.2em] text-red">
                {HOME_BOOK.kicker}
              </p>
              <h2 className="mt-1 font-bebas text-5xl tracking-wide text-navy">{HOME_BOOK.title}</h2>
              <p className="mt-1 font-body text-sm text-navy/65">{HOME_BOOK.release}</p>
            </div>
            <GhostCta href={HOME_BOOK.href} label={HOME_BOOK.cta} />
          </div>
        </section>
      </main>

      <footer className="border-t border-navy/15">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6">
          <p className="font-body text-xs text-navy/45">{footerCopyright()}</p>
          <nav aria-label="Legal" className="flex gap-4">
            <Link
              href="/privacy"
              className="font-condensed text-xs font-semibold uppercase tracking-[0.12em] text-teal no-underline"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="font-condensed text-xs font-semibold uppercase tracking-[0.12em] text-teal no-underline"
            >
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}

function NavLink({
  href,
  children,
  live,
  compact,
}: {
  href: string
  children: ReactNode
  live?: boolean
  compact?: boolean
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center font-condensed font-bold uppercase text-navy no-underline ${
        compact
          ? 'h-9 text-[12px] tracking-[0.12em]'
          : 'min-h-11 text-[13px] tracking-[0.14em]'
      }`}
    >
      {live ? (
        <span className="mr-1.5 text-red" aria-hidden>
          •
        </span>
      ) : null}
      {children}
    </Link>
  )
}

function LadderCard({ card }: { card: HomeLadderCard }) {
  return (
    <article
      className={`flex h-full flex-col bg-paper-card px-5 py-6 ${
        card.featured ? 'border border-navy/15 border-t-2 border-t-gold' : 'border border-navy/15'
      }`}
    >
      <p className="font-condensed text-[11px] font-bold uppercase tracking-[0.18em] text-red">
        {card.step} {card.name}
      </p>
      <p className="mt-3 font-bebas text-4xl tracking-wide text-navy">{card.price}</p>
      <p className="mt-1 font-condensed text-sm font-bold uppercase tracking-[0.12em] text-navy">
        {card.tagline}
      </p>
      <p className="mt-3 flex-1 font-body text-sm leading-relaxed text-navy/70">{card.body}</p>
      <div className="mt-6">
        {card.tone === 'primary' ? (
          <PrimaryCta href={card.href} label={card.cta} wide />
        ) : (
          <GhostCta href={card.href} label={card.cta} wide />
        )}
      </div>
    </article>
  )
}

function PrimaryCta({
  href,
  label,
  wide,
}: {
  href: string
  label: string
  wide?: boolean
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center bg-red px-6 text-center font-condensed text-sm font-bold uppercase tracking-[0.14em] text-white no-underline ${
        wide ? 'w-full' : ''
      }`}
    >
      {label}
    </Link>
  )
}

function GhostCta({
  href,
  label,
  wide,
}: {
  href: string
  label: string
  wide?: boolean
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center border border-navy px-6 text-center font-condensed text-sm font-bold uppercase tracking-[0.14em] text-navy no-underline ${
        wide ? 'w-full' : ''
      }`}
    >
      {label}
    </Link>
  )
}
