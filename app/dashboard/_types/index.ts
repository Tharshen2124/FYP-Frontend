import type { ApiCheckIn } from "@/lib/api"

export interface CalEvent {
  id: string
  title: string
  dayIndex: number
  startMins: number
  endMins: number
  color: string
  isFixed?: boolean
  isDailyPriority?: boolean
  /** Whether the goal behind this task is one of the week's priorities. It is what earns the card
   *  the reserved yellow, so it is carried separately from `color`. */
  isWeeklyPriority?: boolean
  isCompleted: boolean
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
  /** The goal's flag, not the task's — false for a fixed appointment or a Sharpen the Saw task. */
  is_weekly_priority: boolean
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
  /** This week's check-ins, one per night that has been dealt with. Not necessarily seven. */
  check_ins: ApiCheckIn[]
}

/** One labelled fact about a task, as the detail dialog lists it. */
export interface DetailRow {
  label: string
  value: string
}

/** Everything the detail dialog says about a task beyond its title and its time. */
export interface TaskDetail {
  /** "Fixed appointment" | "Role goal" | "Sharpen the Saw" | "Task" */
  kind: string
  /** The colour the card is drawn in, so the dialog's dot matches the grid. */
  color: string
  rows: DetailRow[]
}
