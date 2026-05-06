import { SPONSOR_TEXT_FAINT } from './types'

export function SponsorDisclosure({ inline = false }: { inline?: boolean }) {
  return (
    <span
      style={{
        fontFamily: '"Barlow Condensed", sans-serif',
        fontWeight: 600,
        fontSize: inline ? 9 : 10,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: SPONSOR_TEXT_FAINT,
        whiteSpace: 'nowrap',
      }}
    >
      Paid partner — curated by Evolved Pros
    </span>
  )
}
