import Image from 'next/image'
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
      <Image
        src={sponsor.logo_url}
        alt={`${sponsor.name} logo`}
        width={size}
        height={size}
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
        fontFamily: '"Barlow Condensed", sans-serif',
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
