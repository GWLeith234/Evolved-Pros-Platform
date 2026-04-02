export function tierColor(tier: string | null | undefined): string {
  const t = tier?.toLowerCase()
  if (t === 'pro' || t === 'professional') return '#C9A84C'
  if (t === 'vip') return '#0ABFA3'
  return '#68a2b9'
}

export function tierColorRgba(tier: string | null | undefined, alpha: number): string {
  const t = tier?.toLowerCase()
  if (t === 'pro' || t === 'professional') return `rgba(201,168,76,${alpha})`
  if (t === 'vip') return `rgba(10,191,163,${alpha})`
  return `rgba(104,162,185,${alpha})`
}
