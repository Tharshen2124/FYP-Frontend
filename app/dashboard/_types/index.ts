export interface CalEvent {
  id: string
  title: string
  dayIndex: number
  startMins: number
  endMins: number
  color: string
  isFixed?: boolean
  isDailyPriority?: boolean
  linkLabel?: string
}

export type CalItem = Pick<CalEvent, "id" | "dayIndex" | "startMins" | "endMins">

/** One task as `GET /weekly-plans` returns it. */
export interface ApiTask {
  task_id: number
  title: string
  description: string | null
  day_of_week: number
  start_time: string
  end_time: string
  is_fixed_appointment: boolean
  is_daily_priority: boolean
  is_completed: boolean
  link_kind: "goal" | "activity" | null
  link_text: string | null
  role_name: string | null
  dimension: string | null
}

export interface ApiWeeklyPlan {
  weekly_plan_id: number
  start_date: string
  end_date: string
  tasks: ApiTask[]
}
