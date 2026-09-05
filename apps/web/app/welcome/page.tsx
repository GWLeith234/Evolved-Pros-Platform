import Link from 'next/link'
import type { Metadata } from 'next'
import { adminClient } from '@/lib/supabase/admin'
import { PublicChromeHeader } from '@/components/layout/PublicChromeHeader'
import { WelcomeClaim } from './WelcomeClaim'

export const metadata: Metadata = {
  title: 'Welcome — Evolved Pros',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

// SPRINT P — Friends of George redemption landing. Public + unauthenticated
// (not in the middleware matcher). Resolves the invite token via the
// SECURITY DEFINER RPC and lets the invitee claim in one click. This page is
// committed to the dark marketing palette (no theme toggle), matching /pricing.
export default async function WelcomePage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = typeof searchParams.token === 'string' ? searchParams.token.trim() : ''

  let invite:
    | { invite_id: string; email: string; promo_code_id: string | null; status: string }
    | null = null
  if (token) {
    const { data } = await (adminClient as any).rpc('lookup_friend_invite', { p_token: token })
    invite = (Array.isArray(data) ? data[0] : data) ?? null
  }

  const invalid = !token || !invite
  const revoked = invite?.status === 'revoked'

  return (
    <div
      style={{ backgroundColor: '#0A0F18', minHeight: '100vh' }}
      className="flex flex-col"
    >
      <PublicChromeHeader />

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg text-center">
          {invalid || revoked ? (
            <>
              <p
                className="font-condensed font-bold uppercase tracking-[0.2em] text-[10px] mb-3"
                style={{ color: '#C9302A' }}
              >
                {revoked ? 'Invite revoked' : 'Invite not found'}
              </p>
              <h1 className="font-display font-bold text-3xl sm:text-4xl mb-4" style={{ color: '#F5F0E8' }}>
                {revoked ? 'This invite is no longer active.' : "We couldn't find that invite."}
              </h1>
              <p className="font-body text-sm mb-8" style={{ color: 'rgba(245,240,232,0.5)' }}>
                {revoked
                  ? 'Reach out to George if you think this is a mistake.'
                  : 'The link may be mistyped or expired. Check with whoever sent it, or explore membership options.'}
              </p>
              <Link
                href="/pricing"
                className="inline-block py-3 px-6 rounded-lg font-condensed font-bold uppercase tracking-[0.1em] text-[12px] transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'rgba(245,240,232,0.08)', color: '#F5F0E8', border: '1px solid rgba(245,240,232,0.14)' }}
              >
                View membership
              </Link>
            </>
          ) : (
            <>
              <p
                className="font-condensed font-bold uppercase tracking-[0.2em] text-[10px] mb-3"
                style={{ color: '#C9A84C' }}
              >
                Friends of George
              </p>
              <h1 className="font-display font-bold text-3xl sm:text-5xl mb-5" style={{ color: '#F5F0E8' }}>
                You&rsquo;re invited.
              </h1>
              <p className="font-body text-[15px] leading-relaxed mb-2" style={{ color: 'rgba(245,240,232,0.65)' }}>
                George Leith invited you to Evolved Pros with full{' '}
                <span style={{ color: '#F5F0E8', fontWeight: 600 }}>Professional</span> access —
                the complete 6-Pillar Academy, the accountability system, and the bi-weekly
                mastermind.
              </p>
              <p className="font-body text-[15px] mb-8" style={{ color: 'rgba(245,240,232,0.45)' }}>
                On the house. No card, no catch.
              </p>
              <WelcomeClaim token={token} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
