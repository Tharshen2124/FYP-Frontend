export interface Appt {
  id: string
  title: string
  description: string
  dayIndex: number
  startMins: number
  endMins: number
  color: string
}

export interface ModalState {
  open: boolean
  mode: "add" | "edit"
  editId?: string
  dayIndex: number
  startTime: string
  endTime: string
  title: string
  description: string
}

/** An action held back by the clash-warning modal until the user confirms. */
export type PendingAction =
  | { type: "drop"; draggedId: string; dayIndex: number; newStart: number }
  | { type: "save"; editId: string; title: string; description: string; dayIndex: number; startMins: number; endMins: number }

export type CalItem = Pick<Appt, "id" | "dayIndex" | "startMins" | "endMins">
