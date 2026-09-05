import Link from 'next/link'
import { LogoMark } from '@/components/ui/LogoMark'

/**
 * Anonymous public chrome: real EVOLVED PROS wordmark (red mic as the O)
 * plus an optional Sign in control. Used on marketing / podcast / pricing
 * so those headers cannot drift back to the EVOLVED interpunct PROS text mark.
 *
 * White wordmark on dark navy. Light parchment surfaces use LogoMark dark
 * in place (ConversionHome, media masthead).
 */
export function PublicChromeHeader({
  homeHref = '/',
  signInHref,
}: {
  homeHref?: string
  signInHref?: string
}) {
  return (
    <header
      className="flex items-center justify-between px-6 py-4"
      style={{ borderBottom: '1px solid var(--topnav-border, rgba(245,240,232,0.06))' }}
    >
      <Link
        href={homeHref}
        aria-label="Evolved Pros home"
        style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
      >
        <LogoMark variant="light" height={32} alt="" />
      </Link>
      {signInHref ? (
        <Link
          href={signInHref}
          className="rounded px-4 py-2 font-condensed text-[11px] font-bold uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
          style={{
            color: 'var(--paper, #F5F0E8)',
            border: '1px solid var(--topnav-border, rgba(245,240,232,0.15))',
            textDecoration: 'none',
          }}
        >
          Sign in
        </Link>
      ) : null}
    </header>
  )
}
