export interface OptimalSlot {
  day: string
  dayIndex: number // 0=Sunday ... 6=Saturday
  hour: number
  minute: number
  label: string
  tier: 'peak' | 'good'
}

export const OPTIMAL_SLOTS: OptimalSlot[] = [
  { day: 'Monday',    dayIndex: 1, hour: 7,  minute: 0,  label: 'Morning motivation',     tier: 'good' },
  { day: 'Tuesday',   dayIndex: 2, hour: 7,  minute: 0,  label: 'Peak engagement window', tier: 'peak' },
  { day: 'Wednesday', dayIndex: 3, hour: 12, minute: 0,  label: 'Midweek lunch window',   tier: 'peak' },
  { day: 'Thursday',  dayIndex: 4, hour: 7,  minute: 0,  label: 'Peak engagement window', tier: 'peak' },
  { day: 'Friday',    dayIndex: 5, hour: 17, minute: 0,  label: 'End-of-week reflection', tier: 'good' },
  { day: 'Saturday',  dayIndex: 6, hour: 8,  minute: 0,  label: 'High-performer weekend', tier: 'good' },
  { day: 'Sunday',    dayIndex: 0, hour: 19, minute: 0,  label: 'Sunday prep mindset',    tier: 'good' },
]

export const PILLAR_NAMES = [
  'Foundation', 'Identity', 'Mental Toughness',
  'Strategy', 'Accountability', 'Execution',
]

/** Returns 7 scheduled_at timestamps starting from next Monday in MST */
export function getNextWeekSlots(): Date[] {
  const now = new Date()
  // Find next Monday
  const dayOfWeek = now.getUTCDay() // 0=Sun
  const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 7 : 8 - dayOfWeek
  const nextMonday = new Date(now)
  nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday)
  nextMonday.setUTCHours(0, 0, 0, 0)

  // MST = UTC-7
  const MST_OFFSET = 7

  return OPTIMAL_SLOTS.map(slot => {
    // Days from Monday: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
    const daysFromMonday = slot.dayIndex === 0 ? 6 : slot.dayIndex - 1
    const date = new Date(nextMonday)
    date.setUTCDate(nextMonday.getUTCDate() + daysFromMonday)
    date.setUTCHours(slot.hour + MST_OFFSET, slot.minute, 0, 0)
    return date
  })
}
