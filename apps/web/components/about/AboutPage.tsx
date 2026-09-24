import Link from 'next/link'
import { LogoMark } from '@/components/ui/LogoMark'
import {
  ABOUT_ARCH_KICKER,
  ABOUT_ARCH_TITLE,
  ABOUT_BYLINE,
  ABOUT_CLOSE_BODY,
  ABOUT_CLOSE_TITLE,
  ABOUT_GEORGE,
  ABOUT_GEORGE_KICKER,
  ABOUT_GEORGE_LINKS,
  ABOUT_GEORGE_NAME,
  ABOUT_H1,
  ABOUT_HERO_KICKER,
  ABOUT_JOIN_HREF,
  ABOUT_JOIN_LABEL,
  ABOUT_MISSION,
  ABOUT_NOTS,
  ABOUT_OPEN_HREF,
  ABOUT_OPEN_LABEL,
  ABOUT_PORTRAIT_CAPTION,
  ABOUT_PRICING_HREF,
  ABOUT_PRICING_LABEL,
  ABOUT_ROLE,
  ABOUT_SIGN_IN_HREF,
  ABOUT_SIGN_IN_LABEL,
  ABOUT_START_KICKER,
  ABOUT_START_TITLE,
  ABOUT_STEPS,
  ABOUT_SURFACES,
  ABOUT_WHAT,
  ABOUT_WHAT_KICKER,
  ABOUT_WHAT_TITLE,
  ABOUT_WHO_FOR,
  ABOUT_WHO_FOR_LABEL,
  ABOUT_WHO_KICKER,
  ABOUT_WHO_NOT,
  ABOUT_WHO_NOT_LABEL,
  ABOUT_WHO_TITLE,
  ABOUT_WHY_KICKER,
  HOME_NAV_LINKS,
} from '@/lib/about/copy'

/**
 * Marketing About page. Paper, navy, red, and teal from the public shell.
 * Section order follows the approved mock. Copy is lib/about/copy.ts.
 * Primary nav does not gain an About item.
 */
export function AboutPage() {
  return (
    <div className="ep-about">
      <header className="ep-about-header">
        <div className="ep-about-wrap ep-about-header-inner">
          <Link href="/" aria-label="Evolved Pros home" className="ep-about-logo">
            <LogoMark variant="dark" height={28} alt="" />
          </Link>
          <nav aria-label="Primary" className="ep-about-nav">
            {HOME_NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href}>
                {'live' in link && link.live ? (
                  <span className="ep-about-live-dot" aria-hidden="true">
                    •
                  </span>
                ) : null}
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="ep-about-header-tools">
            <Link href={ABOUT_SIGN_IN_HREF} className="ep-about-signin">
              {ABOUT_SIGN_IN_LABEL}
            </Link>
            <span className="ep-about-header-divider" aria-hidden="true" />
            <Link href={ABOUT_JOIN_HREF} className="ep-about-btn ep-about-btn-primary ep-about-btn-compact">
              {ABOUT_JOIN_LABEL}
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="ep-about-hero" aria-labelledby="about-h1" data-about-section="hero">
          <div className="ep-about-wrap">
            <p className="ep-about-kicker ep-about-kicker-center">{ABOUT_HERO_KICKER}</p>
            <h1 id="about-h1" className="ep-about-h1">
              {ABOUT_H1}
            </h1>
            <hr className="ep-about-rule" />
            <div className="ep-about-hero-grid">
              <div>
                <p className="ep-about-kicker ep-about-kicker-teal">{ABOUT_WHY_KICKER}</p>
                <p className="ep-about-byline">{ABOUT_BYLINE}</p>
                <p className="ep-about-role">{ABOUT_ROLE}</p>
              </div>
              <div>
                <div className="ep-about-prose">
                  {ABOUT_MISSION.map(paragraph => (
                    <p className="ep-about-copy" key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                <div className="ep-about-hero-ctas">
                  <Link href={ABOUT_JOIN_HREF} className="ep-about-btn ep-about-btn-primary">
                    {ABOUT_JOIN_LABEL}
                  </Link>
                  <Link href={ABOUT_PRICING_HREF} className="ep-about-btn ep-about-btn-ghost">
                    {ABOUT_PRICING_LABEL}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="ep-about-what" aria-labelledby="about-what" data-about-section="what">
          <div className="ep-about-wrap ep-about-what-grid">
            <div>
              <p className="ep-about-kicker">{ABOUT_WHAT_KICKER}</p>
              <h2 id="about-what" className="ep-about-h2">
                {ABOUT_WHAT_TITLE}
              </h2>
            </div>
            <div>
              <div className="ep-about-prose">
                {ABOUT_WHAT.map(paragraph => (
                  <p className="ep-about-copy" key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <ul className="ep-about-nots">
                {ABOUT_NOTS.map(item => (
                  <li key={item.title}>
                    <p className="ep-about-not-kicker">{item.kicker}</p>
                    <p className="ep-about-not-title">{item.title}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section
          className="ep-about-arch ep-about-on-navy"
          aria-labelledby="about-arch"
          data-about-section="architecture"
        >
          <div className="ep-about-wrap">
            <p className="ep-about-kicker ep-about-kicker-teal">{ABOUT_ARCH_KICKER}</p>
            <h2 id="about-arch" className="ep-about-h2">
              {ABOUT_ARCH_TITLE}
            </h2>
            <ol className="ep-about-arch-grid">
              {ABOUT_SURFACES.map(surface => (
                <li key={surface.n}>
                  <article className="ep-about-arch-card">
                    <div className="ep-about-arch-top">
                      <p className="ep-about-arch-n">{surface.n}</p>
                      {surface.beta ? <p className="ep-about-beta">Beta</p> : null}
                    </div>
                    <h3>{surface.title}</h3>
                    <SurfaceBody body={surface.body} />
                    <Link href={surface.href} className="ep-about-arch-link">
                      {surface.link}
                      <span aria-hidden="true"> →</span>
                    </Link>
                  </article>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="ep-about-george" aria-labelledby="about-george" data-about-section="george">
          <div className="ep-about-wrap ep-about-george-grid">
            <figure className="ep-about-portrait">
              <figcaption>{ABOUT_PORTRAIT_CAPTION}</figcaption>
            </figure>
            <div>
              <p className="ep-about-kicker">{ABOUT_GEORGE_KICKER}</p>
              <h2 id="about-george" className="ep-about-h2 ep-about-h2-name">
                {ABOUT_GEORGE_NAME}
              </h2>
              <div className="ep-about-prose">
                {ABOUT_GEORGE.map(paragraph => (
                  <p className="ep-about-copy" key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <nav aria-label="George Leith" className="ep-about-george-links">
                {ABOUT_GEORGE_LINKS.map(link => (
                  <Link key={link.href} href={link.href}>
                    {link.label}
                    <span aria-hidden="true"> →</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </section>

        <section className="ep-about-who" aria-labelledby="about-who" data-about-section="who">
          <div className="ep-about-wrap">
            <p className="ep-about-kicker">{ABOUT_WHO_KICKER}</p>
            <h2 id="about-who" className="ep-about-h2 ep-about-h2-narrow">
              {ABOUT_WHO_TITLE}
            </h2>
            <div className="ep-about-who-grid">
              <div className="ep-about-who-cell">
                <h3 className="ep-about-who-label">{ABOUT_WHO_FOR_LABEL}</h3>
                <p className="ep-about-copy">{ABOUT_WHO_FOR}</p>
              </div>
              <div className="ep-about-who-cell">
                <h3 className="ep-about-who-label ep-about-who-label-not">{ABOUT_WHO_NOT_LABEL}</h3>
                <p className="ep-about-copy">{ABOUT_WHO_NOT}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="ep-about-start" aria-labelledby="about-start" data-about-section="start">
          <div className="ep-about-wrap">
            <p className="ep-about-kicker">{ABOUT_START_KICKER}</p>
            <h2 id="about-start" className="ep-about-h2 ep-about-h2-narrow">
              {ABOUT_START_TITLE}
            </h2>
            <ol className="ep-about-steps">
              {ABOUT_STEPS.map(step => (
                <li key={step.n}>
                  <article className="ep-about-step">
                    <p className="ep-about-step-kicker">Step {step.n}</p>
                    <h3>{step.title}</h3>
                    <p className="ep-about-copy">{step.body}</p>
                  </article>
                </li>
              ))}
            </ol>
            <Link href={ABOUT_PRICING_HREF} className="ep-about-text-link">
              {ABOUT_PRICING_LABEL}
              <span aria-hidden="true"> →</span>
            </Link>
          </div>
        </section>

        <section className="ep-about-close ep-about-on-navy" aria-labelledby="about-close" data-about-section="close">
          <div className="ep-about-wrap ep-about-close-inner">
            <h2 id="about-close" className="ep-about-h2">
              {ABOUT_CLOSE_TITLE}
            </h2>
            <p className="ep-about-close-body">{ABOUT_CLOSE_BODY}</p>
            <Link href={ABOUT_JOIN_HREF} className="ep-about-btn ep-about-btn-primary">
              {ABOUT_JOIN_LABEL}
            </Link>
            <Link href={ABOUT_OPEN_HREF} className="ep-about-close-secondary">
              {ABOUT_OPEN_LABEL}
              <span aria-hidden="true"> →</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

function SurfaceBody({ body }: { body: string }) {
  if (body.startsWith('EVOLVED ')) {
    return (
      <p className="ep-about-copy">
        <em>EVOLVED</em>
        {body.slice('EVOLVED'.length)}
      </p>
    )
  }
  return <p className="ep-about-copy">{body}</p>
}
