export type LinkType = "role-goal" | "sharpen-the-saw"

/**
 * `id` is only ever a React key. `taskId` is the server's — present on anything loaded back, absent
 * on anything added in this session, and it is what tells the server to update a row in place
 * rather than replace it. Replacing would reset `isCompleted` and orphan the week's history.
 */
export interface Appt {
  id: string
  taskId?: number
  title: string
  description: string
  dayIndex: number
  startMins: number
  endMins: number
  color: string
  isCompleted: boolean
}

export interface Task {
  id: string
  taskId?: number
  title: string
  dayIndex: number
  startMins: number
  endMins: number
  color: string
  linkType: LinkType
  /** The goal or activity id the task serves. Kept as an id, not recovered from `linkLabel`. */
  linkId: string
  linkLabel: string
  isDailyPriority: boolean
  isCompleted: boolean
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

export interface ApptModalState {
  open: boolean
  mode: "add" | "edit"
  editId?: string
  dayIndex: number
  startTime: string
  endTime: string
  title: string
  description: string
}

// Both tabs carry the whole record through the clash dialog rather than a field list, so adding
// and editing take the same path -- and so adding is clash-checked too, which it was not before.
export type PendingTaskAction =
  | { type: "drop"; draggedId: string; dayIndex: number; newStart: number }
  | { type: "save"; task: Task }

export type PendingApptAction =
  | { type: "drop"; draggedId: string; dayIndex: number; newStart: number }
  | { type: "save"; appt: Appt }

export type CalItem = {
  id: string
  dayIndex: number
  startMins: number
  endMins: number
}
