/** Habit / commitment shapes for the member Home accountability band. */

export interface DailyPulseHabit {
  id: string
  name: string
  pillar: string | null
  completedToday: boolean
  recentCount: number
}

export interface DailyPulseCommitment {
  id: string
  commitment: string
  is_completed: boolean
}
