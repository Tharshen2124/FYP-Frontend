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
}

export interface ApiRole {
  id: string
  name: string
  goals: ApiGoal[]
}

export interface ApiActivity {
  id: string
  text: string
  dimension: string
}

export interface DimensionMeta {
  id: string
  label: string
  icon: ElementType
}
