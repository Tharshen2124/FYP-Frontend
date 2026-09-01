import type { ElementType } from "react"

export type LinkType = "role-goal" | "sharpen-the-saw"

export interface Task {
  id: string
  title: string
  dayIndex: number
  startMins: number
  endMins: number
  linkType: LinkType
  linkId: string
  linkLabel: string
  /** The colour of the role or the dimension behind this task — its *category's*, never the
   *  reserved yellow a weekly priority paints over it. Kept apart so the legend can go on naming
   *  the role: a yellow card still belongs to one. */
  color: string
  /** Whether the goal behind this task is one of the week's priorities. Derived from the link, not
   *  chosen here — the calendar reserves one colour for it. */
  isWeeklyPriority: boolean
  isDailyPriority: boolean
}

export interface ModalState {
  open: boolean
  mode: "add" | "edit"
  editId?: string
  dayIndex: number
  startTime: string
  endTime: string
  title: string
  linkType: LinkType
  selectedRoleId: string
  selectedGoalId: string
  selectedDimensionId: string
  selectedActivityId: string
  isDailyPriority: boolean
}

export type PendingAction =
  | { type: "drop"; draggedId: string; dayIndex: number; newStart: number }
  | { type: "save"; task: Task }

export type CalItem = {
  id: string
  dayIndex: number
  startMins: number
  endMins: number
}

export interface FixedAppt {
  id: string
  title: string
  dayIndex: number
  startMins: number
  endMins: number
}

export interface ApiGoal {
  id: string
  text: string
  isWeeklyPriority: boolean
}

export interface ApiRole {
  id: string
  name: string
  /** Resolved from the stored id against the palette in `lib/role-colors`. */
  color: string
  goals: ApiGoal[]
}

export interface ApiActivity {
  id: string
  text: string
  dimension: string
}

/** The standing activity library, bucketed by the dimension each activity renews. */
export type ActivitiesByDimension = Record<string, ApiActivity[]>

export interface DimensionMeta {
  id: string
  label: string
  icon: ElementType
  color: string
}
