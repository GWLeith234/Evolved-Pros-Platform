import Image from 'next/image'
import {
  LIVE_TESTIMONIALS_EYEBROW,
  LIVE_TESTIMONIALS_KICKER,
  LIVE_TESTIMONIALS_TITLE,
  groupLiveTestimonials,
  headshotSources,
  type LiveTestimonial,
  type LiveTestimonialBandId,
} from '@/lib/live/testimonials'
import { LiveSectionHeader } from './LiveSectionHeader'

function Logo({ item }: { item: LiveTestimonial }) {
  if (!item.logoUrl) return null
  return (
    <div className="live-t-logo">
      <Image src={item.logoUrl} alt="" width={180} height={32} />
    </div>
  )
}

function Headshot({ item }: { item: LiveTestimonial }) {
  if (item.headshotUrl) {
    const sources = headshotSources(item.headshotUrl)
    return (
      <div className="live-t-avatar live-t-avatar--photo">
        <picture>
          {sources.webp ? <source srcSet={sources.webp} type="image/webp" /> : null}
          {/* picture needs an img for the jpg fallback beside the webp source */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sources.src} alt={item.author} width={52} height={52} />
        </picture>
      </div>
    )
  }
  if (!item.initials) return null
  return (
    <div className="live-t-avatar" aria-label={`Photo pending for ${item.author}`}>
      <span className="live-t-initials">{item.initials}</span>
      <span className="live-t-pending">photo</span>
    </div>
  )
}

function SourceLine({ item }: { item: LiveTestimonial }) {
  if (!item.href || !item.sourceLabel) return null
  return (
    <p className="live-t-source">
      Source:{' '}
      <a href={item.href} target="_blank" rel="noopener noreferrer">
        {item.sourceLabel}
      </a>
    </p>
  )
}

function CardMeta({ item }: { item: LiveTestimonial }) {
  return (
    <div className="live-t-meta">
      <Headshot item={item} />
      <div className="live-t-meta-text">
        <p className="live-t-author">{item.author}</p>
        <p className="live-t-role">{item.role}</p>
        <p className="live-t-event">{item.event}</p>
        <SourceLine item={item} />
      </div>
    </div>
  )
}

function QuoteBody({ item }: { item: LiveTestimonial }) {
  return (
    <>
      <p className="live-t-mark" aria-hidden="true">
        &ldquo;
      </p>
      <p className={item.featured ? 'live-t-quote live-t-quote--featured' : 'live-t-quote'}>{item.quote}</p>
    </>
  )
}

function AwardBody({ item }: { item: LiveTestimonial }) {
  return (
    <>
      <p className="live-t-award-mark">{item.mark}</p>
      <p className="live-t-award-sub">{item.quote}</p>
    </>
  )
}

function ReviewsBody({ item }: { item: LiveTestimonial }) {
  const [score, count] = (item.ratingLabel ?? '').split(' · ')
  const stars = Math.round(Number.parseFloat(score || '5')) || 5
  return (
    <>
      <div className="live-t-reviews-head">
        <p className="live-t-stars" aria-label={`${stars} stars`}>
          {'★'.repeat(stars)}
        </p>
        <p className="live-t-rating">
          {score || item.ratingLabel}
          {count ? <span>· {count}</span> : null}
        </p>
      </div>
      <div className="live-t-review-lines">
        {(item.reviews ?? []).map(line => (
          <p key={line.text} className="live-t-review-line">
            {line.text}
          </p>
        ))}
      </div>
    </>
  )
}

function cardClass(item: LiveTestimonial): string {
  if (item.kind === 'award') return 'live-t-card live-t-card--award'
  if (item.kind === 'reviews') return 'live-t-card live-t-card--reviews'
  if (item.featured) return 'live-t-card live-t-card--featured'
  return 'live-t-card'
}

function TestimonialCard({ item }: { item: LiveTestimonial }) {
  return (
    <article className={cardClass(item)} data-kind={item.kind} data-author={item.author}>
      <Logo item={item} />
      {item.kind === 'award' ? <AwardBody item={item} /> : null}
      {item.kind === 'reviews' ? <ReviewsBody item={item} /> : null}
      {item.kind === 'quote' ? <QuoteBody item={item} /> : null}
      <CardMeta item={item} />
    </article>
  )
}

function Band({
  id,
  layout,
  items,
}: {
  id: LiveTestimonialBandId
  layout: 'featured' | 'full' | 'pair' | 'existing'
  items: LiveTestimonial[]
}) {
  return (
    <div className="live-t-band" data-band={id}>
      <div className={`live-t-grid live-t-grid--${layout}`}>
        {items.map(item => (
          <TestimonialCard key={`${item.kind}-${item.author}-${item.event}`} item={item} />
        ))}
      </div>
    </div>
  )
}

export function LiveTestimonials() {
  const groups = groupLiveTestimonials()
  return (
    <section className="live-section-pad live-testimonials" data-testid="live-testimonials" style={{ margin: '72px auto 0' }} aria-label={LIVE_TESTIMONIALS_TITLE}>
      <LiveSectionHeader
        eyebrow={LIVE_TESTIMONIALS_EYEBROW}
        title={LIVE_TESTIMONIALS_TITLE}
        kicker={LIVE_TESTIMONIALS_KICKER}
      />
      <Band id="featured" layout="featured" items={groups.featured} />
      <Band id="industry" layout="full" items={groups.industry} />
      <Band id="reviews" layout="full" items={groups.reviews} />
      <Band id="recognition" layout="pair" items={groups.recognition} />
      <Band id="existing" layout="existing" items={groups.existing} />
    </section>
  )
}
