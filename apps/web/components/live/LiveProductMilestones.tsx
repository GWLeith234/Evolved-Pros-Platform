import {
  formatMilestoneDate,
  milestoneDateTime,
  PRODUCT_LAUNCHES_EYEBROW,
  PRODUCT_LAUNCHES_KICKER,
  PRODUCT_LAUNCHES_TITLE,
  sortedProductMilestones,
  type ProductMilestone,
} from '@/lib/live/product-milestones'
import { LiveSectionHeader } from './LiveSectionHeader'

/**
 * Product / platform milestones Timeline. Kept off the speaking calendar.
 * Visual language matches the GOLD mock (navy, gold dates, white titles,
 * grey deks, gold CTAs). Tokens remap for light theme outside the navy shell.
 */
export function LiveProductMilestones() {
  const milestones = sortedProductMilestones()
  if (!milestones.length) return null

  return (
    <section className="live-section-pad live-milestones" style={{ margin: '56px auto 0' }}>
      <LiveSectionHeader
        eyebrow={PRODUCT_LAUNCHES_EYEBROW}
        title={PRODUCT_LAUNCHES_TITLE}
        kicker={PRODUCT_LAUNCHES_KICKER}
      />
      <ol className="live-milestones-timeline" aria-label="Product launch milestones">
        {milestones.map(m => (
          <MilestoneRow key={m.id} milestone={m} />
        ))}
      </ol>
    </section>
  )
}

function MilestoneRow({ milestone: m }: { milestone: ProductMilestone }) {
  const external = Boolean(m.linkUrl?.startsWith('http'))
  const inner = (
    <>
      <time className="live-milestones-date" dateTime={milestoneDateTime(m.date)}>
        {formatMilestoneDate(m.date)}
      </time>
      <span className="live-milestones-rail" aria-hidden="true">
        <span className="live-milestones-node" />
      </span>
      <span className="live-milestones-body">
        <span className="live-milestones-title">{m.title}</span>
        {m.detail ? <span className="live-milestones-dek">{m.detail}</span> : null}
      </span>
      {m.linkUrl ? (
        <span className="live-milestones-cta" aria-hidden={Boolean(m.linkUrl)}>
          {m.linkLabel ?? 'Open'} →
        </span>
      ) : null}
    </>
  )

  return (
    <li className="live-milestones-item">
      {m.linkUrl ? (
        <a
          className="live-milestones-row ep-pressable"
          href={m.linkUrl}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          aria-label={`${m.linkLabel ?? 'Open'}: ${m.title}`}
        >
          {inner}
        </a>
      ) : (
        <div className="live-milestones-row">{inner}</div>
      )}
    </li>
  )
}
