import type { ElementType } from "react"

export type LinkType = "role-goal" | "sharpen-the-saw"

export interface Task {
  id: string
  title: string
  dayIndex: number
  startMins: number
  endMins: number
  color: string
  linkType: LinkType
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
  | {
      type: "save"
      editId: string
      title: string
      dayIndex: number
      startMins: number
      endMins: number
      color: string
      linkType: LinkType
      linkLabel: string
      isDailyPriority: boolean
    }

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

export interface MockGoal {
  id: string
  text: string
}

export interface MockRole {
  id: string
  name: string
  color: string
  goals: MockGoal[]
}

export interface MockActivity {
  id: string
  text: string
}

export interface MockDimension {
  id: string
  label: string
  color: string
  icon: ElementType
  activities: MockActivity[]
}
