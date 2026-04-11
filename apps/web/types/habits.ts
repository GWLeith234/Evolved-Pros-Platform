export interface Habit {
  id: string
  title: string       // mapped from habit_stacks.name
  pillar: string      // mapped from habit_stacks.course_id or empty string
  description?: string
  frequency: string   // mapped from habit_stacks.time_of_day
  is_active: boolean  // defaults to true
}

/** Raw shape returned by GET /api/habits (habit_stacks table) */
export interface HabitApiRow {
  id: string
  name: string
  time_of_day: string
  sort_order: number
  course_id: string | null
  created_at: string
}

/** Map API row → Habit display type */
export function habitFromRow(row: HabitApiRow): Habit {
  return {
    id: row.id,
    title: row.name,
    pillar: '',           // habit_stacks has no pillar column; left empty
    frequency: row.time_of_day ?? 'daily',
    is_active: true,
  }
}

export const PILLAR_COLORS: Record<string, string> = {
  'Foundation':          '#FFA538',
  'Identity':            '#A78BFA',
  'Mental Toughness':    '#F87171',
  'Strategy':            '#60A5FA',
  'Accountability':      '#C9A84C',
  'Execution':           '#0ABFA3',
}

export function pillarColor(pillar: string): string {
  return PILLAR_COLORS[pillar] ?? 'rgba(255,255,255,0.15)'
}
