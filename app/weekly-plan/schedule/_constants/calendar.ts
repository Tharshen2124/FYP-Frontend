import type { ModalState, ApptModalState } from "../_types"
import { MOCK_ROLES, MOCK_DIMENSIONS } from "./mock-data"

export const DAYS_FULL  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
export const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export const CAL_START  = 6
export const CAL_END    = 22
export const TOTAL_HRS  = CAL_END - CAL_START
export const HR_PX      = 64

export const FIXED_COLOR  = "#3b82f6"
export const COLORS        = ["#B13BFF", "#FFCC00", "#14b8a6", "#f97316", "#f43f5e", "#3b82f6", "#22c55e", "#471396"]

export const EMPTY_TASK_MODAL: ModalState = {
  open: false,
  mode: "add",
  dayIndex: 0,
  startTime: "09:00",
  endTime: "10:00",
  title: "",
  linkType: "role-goal",
  selectedRoleId: MOCK_ROLES[0]?.id ?? "",
  selectedGoalId: "",
  selectedDimensionId: MOCK_DIMENSIONS[0]?.id ?? "",
  selectedActivityId: "",
  isDailyPriority: false,
}

export const EMPTY_APPT_MODAL: ApptModalState = {
  open: false,
  mode: "add",
  dayIndex: 0,
  startTime: "09:00",
  endTime: "10:00",
  title: "",
  description: "",
}
