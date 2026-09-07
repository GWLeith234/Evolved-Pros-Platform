import Link from 'next/link'
import type { Metadata } from 'next'
import { adminClient } from '@/lib/supabase/admin'
import { PublicChromeHeader } from '@/components/layout/PublicChromeHeader'
import { ThanksClaim } from './ThanksClaim'

export const metadata: Metadata = {
  title: 'Community thank you - Evolved Pros',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type ThanksInvite = {
  invite_id: string
  email: string
  first_name: string | null
  status: string
  expires_at: string
}

export default async function ThanksInvitePage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = typeof searchParams.token === 'string' ? searchParams.token.trim() : ''

  let invite: ThanksInvite | null = null
  if (token) {
    const { data } = await (adminClient as any).rpc('lookup_thanks_invite', { p_token: token })
    invite = (Array.isArray(data) ? data[0] : data) ?? null
  }

  const now = Date.now()
  const expired =
    invite != null &&
    (invite.status === 'expired' || new Date(invite.expires_at).getTime() <= now)
  const stopped = invite?.status === 'stopped'
  const invalid = !token || !invite
  const firstName = (invite?.first_name || '').trim()

  return (
    <div
      style={{ backgroundColor: '#0A0F18', minHeight: '100vh' }}
      className="flex flex-col"
    >
      <PublicChromeHeader />

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg text-center">
          {invalid || expired || stopped ? (
            <>
              <p
                className="font-condensed font-bold uppercase tracking-[0.2em] text-[10px] mb-3"
                style={{ color: '#C9302A' }}
              >
                {stopped ? 'Invite closed' : expired ? 'Invite expired' : 'Invite not found'}
              </p>
              <h1 className="font-display font-bold text-3xl sm:text-4xl mb-4" style={{ color: '#F5F0E8' }}>
                {stopped
                  ? 'This Community invite is no longer active.'
                  : expired
                    ? 'This Community invite has expired.'
                    : "We could not find that invite."}
              </h1>
              <p className="font-body text-sm mb-8" style={{ color: 'rgba(245,240,232,0.5)' }}>
                {stopped
                  ? 'Reach out to George if you think this is a mistake.'
                  : expired
                    ? 'Thank-you Community invites stay open for 90 days from the day they were created.'
                    : 'The link may be mistyped or out of date. Check with whoever sent it.'}
              </p>
              <Link
                href="/"
                className="inline-block py-3 px-6 rounded-lg font-condensed font-bold uppercase tracking-[0.1em] text-[12px] transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'rgba(245,240,232,0.08)', color: '#F5F0E8', border: '1px solid rgba(245,240,232,0.14)' }}
              >
                Back to Evolved Pros
              </Link>
            </>
          ) : (
            <>
              <p
                className="font-condensed font-bold uppercase tracking-[0.2em] text-[10px] mb-3"
                style={{ color: '#C9A84C' }}
              >
                Thank you Community
              </p>
              <h1 className="font-display font-bold text-3xl sm:text-5xl mb-5" style={{ color: '#F5F0E8' }}>
                {firstName ? `${firstName}, you are invited.` : 'You are invited.'}
              </h1>
              <p className="font-body text-[15px] leading-relaxed mb-2" style={{ color: 'rgba(245,240,232,0.65)' }}>
                George Leith sent you a free Community seat. No card. No catch.
                This is Community access, not a paid plan.
              </p>
              <p className="font-body text-[15px] mb-8" style={{ color: 'rgba(245,240,232,0.45)' }}>
                Claim below and we will sign you in.
              </p>
              <ThanksClaim token={token} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
