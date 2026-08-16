import type { ModalState } from "../_types"

export const DAYS_FULL  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
export const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export const CAL_START = 6    // 6 AM
export const CAL_END   = 22   // 10 PM
export const TOTAL_HRS = CAL_END - CAL_START
export const HR_PX     = 64   // pixels per hour → 1 min = HR_PX/60 px

export const COLORS = ["#B13BFF", "#FFCC00", "#14b8a6", "#f97316", "#f43f5e", "#3b82f6", "#22c55e", "#471396"]

export const EMPTY_MODAL: ModalState = {
  open: false,
  mode: "add",
  dayIndex: 0,
  startTime: "09:00",
  endTime: "10:00",
  title: "",
  description: "",
}
