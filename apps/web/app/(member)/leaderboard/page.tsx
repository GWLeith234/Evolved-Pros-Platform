import Link from 'next/link'
import Image from 'next/image'
import { headers } from 'next/headers'
import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { getAvatarColor } from '@/lib/community/types'

export const dynamic = 'force-dynamic'

const FB = 'Barlow, sans-serif'
const FBC = 'Barlow Condensed, sans-serif'
const FBN = 'Bebas Neue, sans-serif'

const PAGE_BG = '#0A0F18'
const SURFACE = '#111926'
const BORDER = '#1E2535'
const GOLD = '#C9A84C'
const TEAL = '#0ABFA3'
const SILVER = '#C0C5CC'
const BRONZE = '#B07642'
const TEXT = 'rgba(255,255,255,0.85)'
const MUTED = 'rgba(255,255,255,0.45)'

type LeaderboardRow = {
  id: string
  display_name: string | null
  full_name: string | null
  email: string | null
  avatar_url: string | null
  tier: 'vip' | 'pro' | null
  points: number | null
}

function resolveDisplayName(row: LeaderboardRow): string {
  const display = row.display_name?.trim()
  if (display) return display
  const full = row.full_name?.trim()
  if (full) return full
  const email = row.email?.trim()
  if (email) return email[0].toUpperCase()
  return 'Member'
}

function getInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
}

function rankAccent(rank: number): string {
  if (rank === 1) return GOLD
  if (rank === 2) return SILVER
  if (rank === 3) return BRONZE
  return MUTED
}

function tierBadge(tier: 'vip' | 'pro' | null) {
  if (!tier) return null
  const isPro = tier === 'pro'
  const color = isPro ? GOLD : TEAL
  return (
    <span
      style={{
        fontFamily: FBC,
        fontWeight: 700,
        fontSize: 9,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        padding: '3px 7px',
        borderRadius: 2,
        background: `${color}26`,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {tier}
    </span>
  )
}

export default async function LeaderboardPage() {
  // RSC prefetch guard — matches (member)/layout.tsx pattern. Real
  // navigations still re-run the full page; prefetches skip the fetch.
  const h = headers()
  if (h.get('Next-Router-Prefetch') === '1') {
    return null
  }

  // isMe detection via the canonical public.users id resolver (handles
  // legacy accounts where auth.uid() ≠ public.users.id — see
  // lib/auth/resolveCurrentUser.ts).
  const supabase = createClient()
  const me = await resolveCurrentUser(supabase)

  const { data } = await adminClient
    .from('users')
    .select('id, display_name, full_name, email, avatar_url, tier, points')
    .in('tier', ['vip', 'pro'])
    .order('points', { ascending: false, nullsFirst: false })
    .limit(50)

  const rows = (data ?? []) as LeaderboardRow[]

  return (
    <div style={{ background: PAGE_BG, minHeight: '100%' }}>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 20px 80px' }}>
        <Link
          href="/community"
          style={{
            display: 'inline-block',
            marginBottom: 24,
            fontFamily: FBC,
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: MUTED,
            textDecoration: 'none',
          }}
        >
          ← Back to Community
        </Link>

        <header style={{ marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${BORDER}` }}>
          <p
            style={{
              margin: 0,
              fontFamily: FBC,
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: MUTED,
            }}
          >
            All Time
          </p>
          <h1
            style={{
              margin: '6px 0 0',
              fontFamily: FBN,
              fontSize: 44,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#fff',
              lineHeight: 1,
            }}
          >
            Leaderboard
          </h1>
        </header>

        <section
          style={{
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            padding: 20,
          }}
        >
          {rows.length === 0 ? (
            <p
              style={{
                margin: 0,
                fontFamily: FBC,
                fontSize: 12,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: MUTED,
              }}
            >
              No members on the leaderboard yet.
            </p>
          ) : (
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rows.map((row, i) => {
                const rank = i + 1
                const displayName = resolveDisplayName(row)
                const avatarBg = getAvatarColor(row.id)
                const isMe = me?.id === row.id
                const accent = rankAccent(rank)
                return (
                  <li key={row.id}>
                    <Link
                      href={`/profile/${row.id}`}
                      className="cursor-pointer hover:bg-white/5 transition-colors rounded"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '36px 40px 1fr auto',
                        alignItems: 'center',
                        gap: 14,
                        padding: '10px 12px',
                        background: isMe ? 'rgba(255,255,255,0.04)' : 'transparent',
                        border: isMe ? '1px solid rgba(255,255,255,0.35)' : '1px solid transparent',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: FBN,
                          fontSize: 22,
                          lineHeight: 1,
                          color: accent,
                          fontVariantNumeric: 'tabular-nums',
                          textAlign: 'right',
                        }}
                      >
                        {rank}
                      </span>

                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          background: avatarBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {row.avatar_url ? (
                          <Image
                            src={row.avatar_url}
                            alt=""
                            width={40}
                            height={40}
                            style={{ width: 40, height: 40, objectFit: 'cover' }}
                          />
                        ) : (
                          <span
                            style={{
                              fontFamily: FBC,
                              fontWeight: 800,
                              fontSize: 13,
                              color: '#0A0F18',
                            }}
                          >
                            {getInitials(displayName)}
                          </span>
                        )}
                      </div>

                      <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <p
                          style={{
                            margin: 0,
                            fontFamily: FB,
                            fontWeight: isMe ? 700 : 600,
                            fontSize: 15,
                            lineHeight: 1.2,
                            color: TEXT,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            minWidth: 0,
                            flex: '0 1 auto',
                          }}
                        >
                          {displayName}
                        </p>
                        {tierBadge(row.tier)}
                        {isMe && (
                          <span
                            style={{
                              fontFamily: FBC,
                              fontWeight: 700,
                              fontSize: 9,
                              letterSpacing: '0.22em',
                              textTransform: 'uppercase',
                              padding: '3px 7px',
                              borderRadius: 2,
                              background: 'rgba(255,255,255,0.1)',
                              color: '#fff',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            You
                          </span>
                        )}
                      </div>

                      <span
                        style={{
                          fontFamily: FBC,
                          fontWeight: 800,
                          fontSize: 13,
                          letterSpacing: '0.06em',
                          color: rank <= 3 ? accent : TEXT,
                          fontVariantNumeric: 'tabular-nums',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {(row.points ?? 0).toLocaleString()}
                        <span style={{ marginLeft: 4, color: MUTED, fontWeight: 700 }}>pts</span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}
