import Link from 'next/link'
import {
  FIT_BUILT_FOR_TITLE,
  FIT_CLOSING_TITLE,
  FIT_EYEBROW,
  FIT_FOOTER_LINKS,
  FIT_HERO_BODY,
  FIT_HERO_TITLE,
  FIT_HIP_MOD_DEK,
  FIT_HIP_MOD_LABEL,
  FIT_HOW_STEPS,
  FIT_HOW_TITLE,
  FIT_UNLOCKS_LINE,
  FIT_UPGRADE_CTA,
  FIT_VIP_PILL,
  FIT_WATCH_ANYWHERE_DEK,
  FIT_WATCH_ANYWHERE_TITLE,
} from '@/lib/fit/copy'
import { canAccessFitLibrary, fitUpgradeHref } from '@/lib/fit/gating'
import { featuredFitMove, publishedFitMoves } from '@/lib/fit/moves'
import { FIT_LOCKUP_DARK, FIT_LOCKUP_LABEL, FIT_LOCKUP_LIGHT } from '@/lib/lockups'
import { FitLibrary } from '@/components/fit/FitLibrary'
import { FitTeaseCard } from '@/components/fit/FitTeaseCard'
import { FitTeaseRotator } from '@/components/fit/FitTeaseRotator'

export function FitMarketing({
  viewerTier,
}: {
  viewerTier: string | null
}) {
  const vip = canAccessFitLibrary(viewerTier)
  const featured = featuredFitMove()
  const published = publishedFitMoves()
  const upgradeHref = fitUpgradeHref()

  return (
    <div className="ep-fit-page">
      <section className="ep-fit-hero" aria-labelledby="fit-hero-title">
        <p className="ep-fit-kicker">{FIT_EYEBROW}</p>
        <h2 id="fit-hero-title" className="ep-fit-hero-title">
          {FIT_HERO_TITLE}
        </h2>
        <p className="ep-fit-hero-body">{FIT_HERO_BODY}</p>
        {!vip ? (
          <>
            <Link href={upgradeHref} className="ep-fit-cta">
              {FIT_UPGRADE_CTA}
            </Link>
            <p className="ep-fit-unlocks">
              <span className="ep-fit-lock-icon" aria-hidden="true" />
              {FIT_UNLOCKS_LINE}
            </p>
          </>
        ) : null}
      </section>

      <section className="ep-fit-promise" aria-label={FIT_BUILT_FOR_TITLE}>
        <p className="ep-fit-kicker">{FIT_BUILT_FOR_TITLE}</p>
        <div className="ep-fit-promise-grid">
          <div>
            <p className="ep-fit-promise-label">{FIT_HIP_MOD_LABEL}</p>
            <p>{FIT_HIP_MOD_DEK}</p>
          </div>
          <div>
            <p className="ep-fit-promise-label">{FIT_WATCH_ANYWHERE_TITLE}</p>
            <p>{FIT_WATCH_ANYWHERE_DEK}</p>
          </div>
        </div>
      </section>

      <section className="ep-fit-featured" aria-label="Featured instructional guide">
        {vip ? (
          <FitTeaseRotator moves={published} locked={false} />
        ) : (
          <FitTeaseCard move={featured} locked />
        )}
      </section>

      {vip ? <FitLibrary moves={published} /> : null}

      <section className="ep-fit-how" aria-labelledby="fit-how-title">
        <p className="ep-fit-kicker">Membership</p>
        <h2 id="fit-how-title" className="ep-fit-section-title">
          {FIT_HOW_TITLE}
        </h2>
        <ol className="ep-fit-steps">
          {FIT_HOW_STEPS.map(step => (
            <li key={step.n}>
              <span>{step.n}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="ep-fit-close" aria-labelledby="fit-close-title">
        <p className="ep-fit-kicker">{FIT_EYEBROW}</p>
        <h2 id="fit-close-title" className="ep-fit-close-title">
          {FIT_CLOSING_TITLE}
        </h2>
        {!vip ? (
          <>
            <Link href={upgradeHref} className="ep-fit-cta">
              {FIT_UPGRADE_CTA}
            </Link>
            <p className="ep-fit-close-price">{FIT_VIP_PILL}</p>
          </>
        ) : null}
      </section>

      <FitPageFooter />
    </div>
  )
}

function FitPageFooter() {
  return (
    <footer className="ep-fit-page-footer">
      <p className="ep-fit-page-footer-mark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={FIT_LOCKUP_DARK} alt={FIT_LOCKUP_LABEL} width={1358} height={207} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={FIT_LOCKUP_LIGHT} alt="" width={1358} height={207} />
      </p>
      <nav aria-label="Fit">
        {FIT_FOOTER_LINKS.map(link => (
          <Link key={link.href + link.label} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  )
}

