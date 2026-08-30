import type { ReactNode } from 'react'

/**
 * Shared shell for the public legal / contact pages (SPRINT FOOTER-1):
 * /terms, /privacy, /contact.
 *
 * One narrow reading column on the themed page background. Every colour is a
 * semantic token, so all three pages invert correctly between light and dark
 * (STYLEGUIDE §1/§2) and carry zero raw hex.
 */
export function LegalPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string
  title: string
  intro?: ReactNode
  children: ReactNode
}) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      style={{
        background: 'var(--bg-page)',
        color: 'var(--text-primary)',
        maxWidth: '100%',
        overflowX: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '56px 20px 72px',
          minWidth: 0,
        }}
      >
        <p
          style={{
            margin: '0 0 12px',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--brand-red-hot)',
          }}
        >
          {eyebrow}
        </p>
        <h1
          style={{
            margin: '0 0 20px',
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 'clamp(1.9rem, 6vw, 2.75rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            color: 'var(--text-primary)',
          }}
        >
          {title}
        </h1>
        {intro ? (
          <div
            style={{
              fontFamily: '"Barlow", sans-serif',
              fontSize: 16,
              lineHeight: 1.65,
              color: 'var(--text-secondary)',
            }}
          >
            {intro}
          </div>
        ) : null}
        {children}
      </div>
    </main>
  )
}

/** One numbered-feel section heading plus its body copy. */
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginTop: 36 }}>
      <h2
        style={{
          margin: '0 0 12px',
          fontFamily: '"Barlow Condensed", sans-serif',
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '0.04em',
          lineHeight: 1.25,
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </h2>
      <div
        style={{
          fontFamily: '"Barlow", sans-serif',
          fontSize: 15,
          lineHeight: 1.7,
          color: 'var(--text-secondary)',
        }}
      >
        {children}
      </div>
    </section>
  )
}

/** Body paragraph inside a LegalSection. */
export function LegalP({ children }: { children: ReactNode }) {
  return <p style={{ margin: '0 0 12px' }}>{children}</p>
}

/** Bulleted list inside a LegalSection. */
export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul style={{ margin: '0 0 12px', paddingLeft: 20, listStyle: 'disc' }}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: 6 }}>
          {item}
        </li>
      ))}
    </ul>
  )
}

/**
 * An unresolved legal blank.
 *
 * FOOTER-1 rule: do not invent legal copy. Registered office / mailing
 * address, governing law and venue, and refund / cancellation language are
 * George's and counsel's to write — they ship as this literal marker and
 * nothing more. Grep `TODO GEORGE / COUNSEL` to find every one of them.
 */
export const LEGAL_TODO = 'TODO GEORGE / COUNSEL'

export function LegalTodo({ label }: { label: string }) {
  return (
    <p style={{ margin: '0 0 12px' }}>
      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{label}:</span>{' '}
      <span
        style={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: 'var(--brand-red-hot)',
        }}
      >
        {LEGAL_TODO}
      </span>
    </p>
  )
}

/** mailto link that reads as body copy, not a button. */
export function LegalMail({ address }: { address: string }) {
  return (
    <a
      href={`mailto:${address}`}
      style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}
    >
      {address}
    </a>
  )
}
