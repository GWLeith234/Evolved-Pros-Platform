import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')

function src(rel: string) {
  return readFileSync(resolve(root, rel), 'utf8')
}

const FOG_FILES = [
  'app/welcome/page.tsx',
  'app/welcome/WelcomeClaim.tsx',
  'app/api/welcome/claim/route.ts',
  'app/api/admin/friends/invite/route.ts',
  'lib/resend/emails/friend-invite.ts',
  'lib/resend/emails/FriendInvite.tsx',
  'lib/admin/fog.ts',
]

const THANKS_FILES = [
  'app/invite/thanks/page.tsx',
  'app/invite/thanks/ThanksClaim.tsx',
  'app/api/invite/thanks/claim/route.ts',
  'app/api/admin/thanks/batch/route.ts',
  'app/api/admin/thanks/send/route.ts',
  'lib/thanks/constants.ts',
  'lib/resend/emails/community-thanks.ts',
  'lib/resend/emails/CommunityThanks.tsx',
]

describe('FOG lane stays on /welcome + FRIENDSOFGEORGE', () => {
  it('welcome claim still uses lookup_friend_invite and friend_invites', () => {
    const welcome = src('app/welcome/page.tsx')
    const claim = src('app/api/welcome/claim/route.ts')
    expect(welcome).toContain("rpc('lookup_friend_invite'")
    expect(welcome).toContain('Friends of George')
    expect(welcome).not.toContain('lookup_thanks_invite')
    expect(welcome).not.toContain('THANKS_COMMUNITY')
    expect(claim).toContain("rpc('lookup_friend_invite'")
    expect(claim).toContain('FRIENDSOFGEORGE')
    expect(claim).toContain("from('friend_invites')")
    expect(claim).not.toContain('THANKS_COMMUNITY')
    expect(claim).not.toContain('/invite/thanks')
  })

  it('admin FOG invite still emails /welcome, never /invite/thanks', () => {
    const invite = src('app/api/admin/friends/invite/route.ts')
    expect(invite).toContain('/welcome?token=')
    expect(invite).toContain('FRIENDSOFGEORGE')
    expect(invite).not.toContain('/invite/thanks')
    expect(invite).not.toContain('THANKS_COMMUNITY')
  })

  it('FOG files never import the thank-you lane', () => {
    for (const file of FOG_FILES) {
      const text = src(file)
      expect(text, file).not.toContain('THANKS_COMMUNITY')
      expect(text, file).not.toContain('community_thanks_invites')
      expect(text, file).not.toContain('lookup_thanks_invite')
    }
  })
})

describe('thank-you lane stays off FOG rails', () => {
  it('claim uses lookup_thanks_invite and THANKS_COMMUNITY only', () => {
    const page = src('app/invite/thanks/page.tsx')
    const claim = src('app/api/invite/thanks/claim/route.ts')
    expect(page).toContain("rpc('lookup_thanks_invite'")
    expect(page).not.toContain('lookup_friend_invite')
    expect(claim).toContain('THANKS_PROMO_CODE')
    expect(claim).toContain("rpc('lookup_thanks_invite'")
    expect(claim).toContain("from('community_thanks_invites')")
    expect(claim.includes("from('friend_invites')")).toBe(false)
    expect(claim).toContain("tier: THANKS_GRANTS_TIER")
    expect(claim).not.toContain("tier: 'pro'")
    expect(claim).not.toContain("tier: 'vip'")
    expect(claim).toContain("promo.code === 'FRIENDSOFGEORGE'")
    expect(claim).not.toMatch(/eq\('code',\s*'FRIENDSOFGEORGE'\)/)
  })

  it('thanks files never send people to /welcome or grant FOG promo', () => {
    for (const file of THANKS_FILES) {
      const text = src(file)
      expect(text, file).not.toMatch(/eq\('code',\s*'FRIENDSOFGEORGE'\)/)
      expect(text, file).not.toMatch(/\/welcome\?token=/)
    }
  })

  it('keeps /invite public and does not move /welcome into the matcher', () => {
    const mw = src('middleware.ts')
    expect(mw).toContain("'/invite'")
    expect(mw).toContain("'/api/invite'")
    expect(mw).not.toContain("'/welcome'")
    expect(mw).not.toMatch(/matcher:[\s\S]*\/welcome/)
  })

  it('migration seeds THANKS_COMMUNITY and leaves friend_invites alone', () => {
    const sql = readFileSync(
      resolve(root, '../../supabase/migrations/091_community_thanks_invites.sql'),
      'utf8',
    )
    expect(sql).toContain("VALUES ('THANKS_COMMUNITY', 'Thank you Community', 'community')")
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.community_thanks_invites')
    expect(sql).toContain("CHECK (status IN ('pending', 'sent', 'redeemed', 'stopped', 'expired'))")
    expect(sql).toContain('lookup_thanks_invite')
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY')
    expect(sql).not.toContain('CREATE POLICY')
    expect(sql).not.toContain('ALTER TABLE public.friend_invites')
    expect(sql).not.toMatch(/VALUES\s*\(\s*'FRIENDSOFGEORGE'/)
  })
})
