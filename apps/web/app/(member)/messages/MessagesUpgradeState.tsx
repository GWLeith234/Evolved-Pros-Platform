import Link from 'next/link'
import { DIRECTORY_DM_LOCKED_COPY } from '@/lib/community/directory'

/**
 * SPRINT Q1 - what a community or VIP member sees at /messages.
 *
 * An upgrade state, not a 404. Somebody who cannot use the inbox should be
 * told what it costs and where the room is, not told the page is missing.
 * Colour comes from semantic tokens so it inverts with the theme.
 */
export function MessagesUpgradeState() {
  return (
    <div className="px-4 sm:px-8 py-10 max-w-2xl mx-auto">
      <div
        className="rounded-lg px-6 py-10 text-center"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
        }}
      >
        <p
          className="font-condensed font-bold uppercase tracking-[0.18em] text-[11px] mb-3"
          style={{ color: 'var(--text-secondary)' }}
        >
          The Evolved Pros 99
        </p>
        <h1
          className="font-display font-black text-[24px] mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          Direct messages are part of the room.
        </h1>
        <p
          className="font-body text-[14px] leading-relaxed mb-6 max-w-md mx-auto"
          style={{ color: 'var(--text-secondary)' }}
        >
          {DIRECTORY_DM_LOCKED_COPY} The directory is open to every member, so
          you can see who is here. Reaching them directly comes with a seat.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/pricing?from=messages&tier=pro"
            className="inline-flex items-center font-condensed font-bold uppercase tracking-[0.12em] text-[12px]"
            style={{
              minHeight: 40,
              padding: '0 18px',
              borderRadius: 4,
              background: 'var(--brand-red)',
              color: 'var(--white)',
              textDecoration: 'none',
            }}
          >
            Take a seat
          </Link>
          <Link
            href="/community/directory"
            className="inline-flex items-center font-condensed font-bold uppercase tracking-[0.12em] text-[12px]"
            style={{
              minHeight: 40,
              padding: '0 18px',
              borderRadius: 4,
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              textDecoration: 'none',
            }}
          >
            Browse the directory
          </Link>
        </div>
      </div>
    </div>
  )
}
