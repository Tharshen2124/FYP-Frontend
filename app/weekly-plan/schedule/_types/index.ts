export type LinkType = "role-goal" | "sharpen-the-saw"

export interface Appt {
  id: string
  title: string
  description: string
  dayIndex: number
  startMins: number
  endMins: number
  color: string
}

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

export type PendingTaskAction =
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

export type PendingApptAction =
  | { type: "drop"; draggedId: string; dayIndex: number; newStart: number }
  | { type: "save"; editId: string; title: string; description: string; dayIndex: number; startMins: number; endMins: number }

export type CalItem = {
  id: string
  dayIndex: number
  startMins: number
  endMins: number
}
