import Link from 'next/link'
import Image from 'next/image'
import { adminClient } from '@/lib/supabase/admin'
import { getAvatarColor } from '@/lib/community/types'

export const dynamic = 'force-dynamic'

const FB = 'Barlow, sans-serif'
const FBC = 'Barlow Condensed, sans-serif'
const FBN = 'Bebas Neue, sans-serif'

const SURFACE = '#111926'
const BORDER = '#1E2535'
const GOLD = '#C9A84C'
const TEXT = 'rgba(255,255,255,0.85)'
const MUTED = 'rgba(255,255,255,0.45)'

type LeaderboardRow = {
  id: string
  full_name: string | null
  avatar_url: string | null
  tier: 'vip' | 'pro' | null
  points: number | null
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
}

function rankColor(rank: number): string {
  if (rank === 1) return GOLD
  if (rank === 2) return 'rgba(255,255,255,0.85)'
  if (rank === 3) return 'rgba(201,168,76,0.65)'
  return 'rgba(255,255,255,0.35)'
}

function tierBadge(tier: 'vip' | 'pro' | null) {
  if (!tier) return null
  const isPro = tier === 'pro'
  return (
    <span
      style={{
        fontFamily: FBC,
        fontWeight: 700,
        fontSize: 9,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        padding: '2px 6px',
        borderRadius: 2,
        background: isPro ? 'rgba(201,48,42,0.18)' : 'rgba(201,168,76,0.18)',
        color: isPro ? '#E66B66' : GOLD,
        whiteSpace: 'nowrap',
      }}
    >
      {tier}
    </span>
  )
}

export default async function LeaderboardPage() {
  const { data } = await adminClient
    .from('users')
    .select('id, full_name, avatar_url, tier, points')
    .in('tier', ['vip', 'pro'])
    .order('points', { ascending: false })
    .limit(50)

  const rows = (data ?? []) as LeaderboardRow[]

  return (
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
              const displayName = row.full_name?.trim() || 'Unnamed Member'
              const avatarBg = getAvatarColor(row.id)
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
                      border: '1px solid transparent',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: FBN,
                        fontSize: 22,
                        lineHeight: 1,
                        color: rankColor(rank),
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

                    <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <p
                        style={{
                          margin: 0,
                          fontFamily: FB,
                          fontWeight: 600,
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
                    </div>

                    <span
                      style={{
                        fontFamily: FBC,
                        fontWeight: 800,
                        fontSize: 13,
                        letterSpacing: '0.06em',
                        color: rank === 1 ? GOLD : TEXT,
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
  )
}
