import Link from 'next/link'
import { EpWordmark } from '@/components/brand/EpWordmark'
import { PublicGlobalNav } from '@/components/layout/PublicGlobalNav'
import {
  MEDIA_KIT_BIO,
  MEDIA_KIT_BIO_KICKER,
  MEDIA_KIT_BOOK_NOTE,
  MEDIA_KIT_CONTACT_HREF,
  MEDIA_KIT_CONTACT_LABEL,
  MEDIA_KIT_DOWNLOADS,
  MEDIA_KIT_DOWNLOAD_KICKER,
  MEDIA_KIT_DOWNLOAD_TITLE,
  MEDIA_KIT_EYEBROW,
  MEDIA_KIT_H1,
  MEDIA_KIT_SECTIONS,
  MEDIA_KIT_SUMMARY,
} from '@/lib/mediaKit/copy'

/**
 * Public /media-kit. Same desk chrome as /media: the global nav, the
 * .ep-media-masthead bar on --bg-page (paper in light mode), and the
 * .ep-media-home column. The masthead mark is the EVOLVED·PROS wordmark
 * with the red interpunct (EpWordmark, the Magic Link bar), not the
 * megaphone MEDIA lockup, because the kit speaks for the whole brand.
 * The footer comes from the (public) layout, same as /media.
 */
export function MediaKitPage() {
  return (
    <div className="min-h-screen media-desk-root ep-no-x-scroll" style={{ maxWidth: '100vw' }}>
      <PublicGlobalNav />
      <header className="ep-media-masthead">
        <div className="ep-media-masthead-inner ep-media-kit-masthead-inner">
          <div className="ep-media-masthead-utility">
            <Link href="/home" className="ep-media-masthead-back">
              Back to platform
            </Link>
            <Link href="/pricing" className="ep-media-masthead-join">
              Join Evolved Pros
            </Link>
          </div>
          <div className="ep-media-masthead-wordmark ep-media-kit-wordmark">
            <Link href="/" aria-label="Evolved Pros home">
              <EpWordmark
                as="span"
                className="ep-media-kit-wordmark-mark"
                style={{ fontSize: 'clamp(30px, 6vw, 56px)', letterSpacing: '0.12em' }}
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="media-desk-shell">
        <div className="ep-media-home ep-media-kit" data-media-surface="media-kit">
          <div className="ep-media-home-inner ep-media-kit-inner">
            <header className="ep-media-section-hero">
              <p className="ep-media-section-eyebrow">{MEDIA_KIT_EYEBROW}</p>
              <h1 className="ep-media-section-title">{MEDIA_KIT_H1}</h1>
              <p className="ep-media-kit-summary">{MEDIA_KIT_SUMMARY}</p>
            </header>

            <section className="ep-media-kit-downloads" aria-labelledby="media-kit-downloads">
              <p className="ep-media-kit-kicker">{MEDIA_KIT_DOWNLOAD_KICKER}</p>
              <h2 id="media-kit-downloads" className="ep-media-kit-h2">
                {MEDIA_KIT_DOWNLOAD_TITLE}
              </h2>
              <ul className="ep-media-kit-download-list">
                {MEDIA_KIT_DOWNLOADS.map(item => (
                  <li key={item.id}>
                    <a
                      href={item.href}
                      download={item.filename}
                      type="application/pdf"
                      className={`ep-media-kit-download ep-media-kit-download--${item.id}`}
                      data-media-kit-download={item.id}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="ep-media-kit-note" data-media-kit-note>
                {MEDIA_KIT_BOOK_NOTE}
              </p>
            </section>

            <section className="ep-media-kit-bio" aria-labelledby="media-kit-bio">
              <h2 id="media-kit-bio" className="ep-media-kit-kicker">
                {MEDIA_KIT_BIO_KICKER}
              </h2>
              <p className="ep-media-kit-bio-text" data-media-kit-bio>
                {MEDIA_KIT_BIO}
              </p>
            </section>

            <div className="ep-media-kit-sections">
              {MEDIA_KIT_SECTIONS.map(section => (
                <section key={section.kicker} className="ep-media-kit-section">
                  <h2 className="ep-media-kit-kicker">{section.kicker}</h2>
                  {section.body.map(line => (
                    <p key={line} className="ep-media-kit-body">
                      {line}
                    </p>
                  ))}
                  <Link href={section.link.href} className="ep-media-kit-link">
                    {section.link.label}
                  </Link>
                </section>
              ))}
            </div>

            <p className="ep-media-kit-contact">
              <Link href={MEDIA_KIT_CONTACT_HREF} className="ep-media-kit-link">
                {MEDIA_KIT_CONTACT_LABEL}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
