export interface HistoryEvent {
  id: string
  title: string
  dayIndex: number // 0=Mon … 6=Sun
  startMins: number
  endMins: number
  color: string
  isFixed?: boolean
  linkLabel?: string
}

export interface HistoryGoal {
  roleId: string
  roleName: string
  roleColor: string
  goalText: string
}

export interface HistoryActivity {
  dimensionId: string
  dimensionLabel: string
  dimensionColor: string
  activityText: string
}

export interface HistoryWeek {
  id: string
  label: string
  /** Monday of that week, used for display */
  weekStart: string // ISO date string "YYYY-MM-DD"
  goals: HistoryGoal[]
  activities: HistoryActivity[]
  events: HistoryEvent[]
}
