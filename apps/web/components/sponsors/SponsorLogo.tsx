import { logoLetter, type Sponsor } from './types'

export function SponsorLogo({
  sponsor,
  size,
  color,
}: {
  sponsor: Pick<Sponsor, 'logo_url' | 'name'>
  size: number
  color: string
}) {
  if (sponsor.logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={sponsor.logo_url}
        alt={`${sponsor.name} logo`}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          border: `1px solid ${color}`,
          background: '#000',
          flexShrink: 0,
        }}
      />
    )
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${color}`,
        color,
        fontFamily: 'var(--font-condensed), sans-serif',
        fontWeight: 800,
        fontSize: Math.round(size * 0.5),
        letterSpacing: '0.04em',
        flexShrink: 0,
      }}
      aria-label={`${sponsor.name} logo`}
    >
      {logoLetter(sponsor)}
    </div>
  )
}
