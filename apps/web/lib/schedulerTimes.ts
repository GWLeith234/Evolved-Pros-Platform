export interface OptimalSlot {
  day: string
  dayIndex: number // 0=Sunday ... 6=Saturday
  utcHour: number
  minute: number
  displayTime: string
  label: string
  tier: 'peak' | 'good'
}

// MST = UTC-7 (Mountain Standard Time, no DST)
export const OPTIMAL_SLOTS: OptimalSlot[] = [
  { day: 'Monday',    dayIndex: 1, utcHour: 14, minute: 0, displayTime: '7:00 AM MST',  label: 'Morning motivation',     tier: 'good' },
  { day: 'Tuesday',   dayIndex: 2, utcHour: 14, minute: 0, displayTime: '7:00 AM MST',  label: 'Peak engagement window', tier: 'peak' },
  { day: 'Wednesday', dayIndex: 3, utcHour: 19, minute: 0, displayTime: '12:00 PM MST', label: 'Midweek lunch window',   tier: 'peak' },
  { day: 'Thursday',  dayIndex: 4, utcHour: 14, minute: 0, displayTime: '7:00 AM MST',  label: 'Peak engagement window', tier: 'peak' },
  { day: 'Friday',    dayIndex: 5, utcHour: 0,  minute: 0, displayTime: '5:00 PM MST',  label: 'End-of-week reflection', tier: 'good' },
  { day: 'Saturday',  dayIndex: 6, utcHour: 15, minute: 0, displayTime: '8:00 AM MST',  label: 'High-performer weekend', tier: 'good' },
  { day: 'Sunday',    dayIndex: 0, utcHour: 2,  minute: 0, displayTime: '7:00 PM MST',  label: 'Sunday prep mindset',    tier: 'good' },
]

export const PILLAR_NAMES = [
  'Foundation', 'Identity', 'Mental Toughness',
  'Strategy', 'Accountability', 'Execution',
]

/** Returns 7 scheduled_at timestamps starting from next Monday in UTC */
export function getNextWeekSlots(): Date[] {
  const now = new Date()
  const dayOfWeek = now.getUTCDay()
  const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 7 : 8 - dayOfWeek
  const nextMonday = new Date(now)
  nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday)
  nextMonday.setUTCHours(0, 0, 0, 0)

  return OPTIMAL_SLOTS.map((slot, i) => {
    // Days from Monday: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
    const daysFromMonday = i // slots are ordered Mon through Sun
    const date = new Date(nextMonday)
    date.setUTCDate(nextMonday.getUTCDate() + daysFromMonday)
    date.setUTCHours(slot.utcHour, slot.minute, 0, 0)
    return date
  })
}
