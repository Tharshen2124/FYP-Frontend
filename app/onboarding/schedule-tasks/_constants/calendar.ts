import type { ModalState } from "../_types"

export const DAYS_FULL  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
export const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export const CAL_START  = 6
export const CAL_END    = 22
export const TOTAL_HRS  = CAL_END - CAL_START
export const HR_PX      = 64

export const FIXED_COLOR          = "#3b82f6"
export const TASK_COLOR           = "#B13BFF"
export const DAILY_PRIORITY_COLOR = "#FFCC00"

export const EMPTY_MODAL: ModalState = {
  open: false,
  mode: "add",
  dayIndex: 0,
  startTime: "09:00",
  endTime: "10:00",
  title: "",
  linkType: "role-goal",
  selectedRoleId: "",
  selectedGoalId: "",
  selectedDimensionId: "",
  selectedActivityId: "",
  isDailyPriority: false,
}
