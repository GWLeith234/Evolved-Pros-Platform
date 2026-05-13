'use client'

import Link from 'next/link'
import Image from 'next/image'
import { getAvatarColor } from '@/lib/community/types'
import type { WeeklyLeaderboardEntry } from '@/lib/community/types'

interface WeeklyLeaderboardRailProps {
  entries: WeeklyLeaderboardEntry[]
}

const FB = 'Barlow, sans-serif'
const FBC = 'Barlow Condensed, sans-serif'
const FBN = 'Bebas Neue, sans-serif'

const SURFACE = '#111926'
const BORDER = '#1E2535'
const GOLD = '#C9A84C'
const TEAL = '#0ABFA3'
const TEXT = 'rgba(255,255,255,0.85)'
const MUTED = 'rgba(255,255,255,0.45)'

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
}

function rankColor(rank: number, isMe: boolean): string {
  if (isMe) return GOLD
  if (rank === 1) return GOLD
  if (rank === 2) return 'rgba(255,255,255,0.85)'
  if (rank === 3) return 'rgba(201,168,76,0.65)'
  return 'rgba(255,255,255,0.35)'
}

export function WeeklyLeaderboardRail({ entries }: WeeklyLeaderboardRailProps) {
  return (
    <aside
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        padding: '20px',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 18,
          paddingBottom: 12,
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontFamily: FBC,
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: '#ef0e30',
            }}
          >
            This Week
          </p>
          <h2
            style={{
              margin: '4px 0 0',
              fontFamily: FBN,
              fontSize: 22,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#fff',
              lineHeight: 1,
            }}
          >
            Leaderboard
          </h2>
        </div>
        <Link
          href="/leaderboard"
          style={{
            fontFamily: FBC,
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: MUTED,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Full →
        </Link>
      </header>

      {entries.length === 0 ? (
        <p
          style={{
            margin: 0,
            fontFamily: FBC,
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: MUTED,
          }}
        >
          No activity yet this week.
        </p>
      ) : (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {entries.map(entry => {
            const isMe = entry.isCurrentUser
            const avatarBg = getAvatarColor(entry.userId)
            return (
<<<<<<< HEAD
              <li
                key={entry.userId}
                suppressHydrationWarning
                style={{
                  display: 'grid',
                  gridTemplateColumns: '24px 32px 1fr auto',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  background: isMe ? 'rgba(201,168,76,0.06)' : 'transparent',
                  border: isMe ? `1px solid ${GOLD}` : '1px solid transparent',
                }}
              >
=======
              <li key={entry.userId}>
                <Link
                  href={`/profile/${entry.userId}`}
                  suppressHydrationWarning
                  className="cursor-pointer hover:bg-white/5 transition-colors rounded"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '24px 32px 1fr auto',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    background: isMe ? 'rgba(201,168,76,0.06)' : 'transparent',
                    border: isMe ? `1px solid ${GOLD}` : '1px solid transparent',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
>>>>>>> ed5716b (Make weekly leaderboard rows link to profile pages)
                <span
                  suppressHydrationWarning
                  style={{
                    fontFamily: FBN,
                    fontSize: 18,
                    lineHeight: 1,
                    color: rankColor(entry.rank, isMe),
                    fontVariantNumeric: 'tabular-nums',
                    textAlign: 'right',
                  }}
                >
                  {entry.rank}
                </span>

                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: avatarBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {entry.avatarUrl ? (
                    <Image
                      src={entry.avatarUrl}
                      alt=""
                      width={32}
                      height={32}
                      style={{ width: 32, height: 32, objectFit: 'cover' }}
                    />
                  ) : (
                    <span
                      style={{
                        fontFamily: FBC,
                        fontWeight: 800,
                        fontSize: 11,
                        color: '#0A0F18',
                      }}
                    >
                      {getInitials(entry.displayName)}
                    </span>
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <p
                    suppressHydrationWarning
                    style={{
                      margin: 0,
                      fontFamily: FB,
                      fontWeight: isMe ? 700 : 600,
                      fontSize: 13,
                      lineHeight: 1.2,
                      color: isMe ? GOLD : TEXT,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {entry.displayName}
                    {isMe && (
                      <span
                        suppressHydrationWarning
                        style={{
                          marginLeft: 6,
                          fontFamily: FBC,
                          fontWeight: 700,
                          fontSize: 9,
                          letterSpacing: '0.2em',
                          textTransform: 'uppercase',
                          color: GOLD,
                        }}
                      >
                        You
                      </span>
                    )}
                  </p>
                  <p
                    style={{
                      margin: '2px 0 0',
                      fontFamily: FBC,
                      fontWeight: 700,
                      fontSize: 11,
                      letterSpacing: '0.06em',
                      color: MUTED,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {entry.points.toLocaleString()} pts
                  </p>
                </div>

                <span
                  title={`${entry.weeklyPosts} ${entry.weeklyPosts === 1 ? 'post' : 'posts'} this week`}
                  style={{
                    fontFamily: FBC,
                    fontWeight: 800,
                    fontSize: 11,
                    letterSpacing: '0.06em',
                    color: TEAL,
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ↑+{entry.weeklyPosts}
                </span>
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </aside>
  )
}
