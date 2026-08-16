import { Tooltip } from '@/components/ui/Tooltip'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'

interface ProfileStatsProps {
  posts: number
  points: number
  lessons: number
  badges: number[]
}

const PILLAR_NUMBERS = [1, 2, 3, 4, 5, 6] as const

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-condensed), sans-serif',
  fontWeight: 600,
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.22em',
  color: '#7a8a96',
  margin: 0,
}

const valueStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display), Georgia, serif',
  fontWeight: 700,
  fontSize: '22px',
  color: '#F5F0E8',
  margin: '4px 0 0',
  lineHeight: 1.1,
}

export function ProfileStats({ posts, points, lessons, badges }: ProfileStatsProps) {
  const earned = new Set(badges)

  return (
    <div
      className="grid grid-cols-2 min-[480px]:grid-cols-4 gap-6"
      style={{
        backgroundColor: '#111926',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '8px',
        padding: '20px 24px',
      }}
    >
      <div>
        <p style={labelStyle}>Posts</p>
        <p style={valueStyle}>{posts}</p>
      </div>
      <div>
        <p style={labelStyle}>Points</p>
        <p style={valueStyle}>{points}</p>
      </div>
      <div>
        <p style={labelStyle}>Lessons</p>
        <p style={valueStyle}>{lessons}</p>
      </div>
      <div>
        <p style={labelStyle}>Badges</p>
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
          {PILLAR_NUMBERS.map(n => {
            const isEarned = earned.has(n)
            const cfg = PILLAR_CONFIG[n]
            return (
              <Tooltip key={n} content={cfg.label}>
                <span
                  aria-label={`${cfg.label} pillar ${isEarned ? 'earned' : 'not earned'}`}
                  style={{
                    display: 'inline-block',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: isEarned ? cfg.color : '#2a2f3a',
                    boxShadow: isEarned ? `0 0 0 2px ${cfg.color}22` : 'none',
                  }}
                />
              </Tooltip>
            )
          })}
        </div>
      </div>
    </div>
  )
}
