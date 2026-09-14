import Link from 'next/link'
import { type MemberHomeNextAction } from '@/lib/home/bands'

export function HomeNextActionBand({ action }: { action: MemberHomeNextAction }) {
  return (
    <section
      aria-label="Next action"
      className="ep-surface-card overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-4"
        style={{ padding: 'var(--space-card, 20px) var(--space-card-lg, 24px)' }}
      >
        <div className="min-w-0">
          <p className="font-condensed text-ep-label font-extrabold uppercase tracking-[0.18em] m-0" style={{ color: 'var(--teal)' }}>
            {action.eyebrow}
          </p>
          <h2 className="font-bebas text-[26px] sm:text-[30px] leading-none tracking-[0.03em] uppercase text-primary mt-2 mb-0">
            {action.title}
          </h2>
        </div>
        <Link
          href={action.href}
          className="inline-flex items-center justify-center shrink-0 font-condensed text-[13px] font-extrabold uppercase tracking-[0.14em] no-underline"
          style={{
            minHeight: 44,
            padding: '10px 18px',
            color: 'var(--bg-page)',
            background: 'var(--teal)',
          }}
        >
          {action.cta}
        </Link>
      </div>
    </section>
  )
}
