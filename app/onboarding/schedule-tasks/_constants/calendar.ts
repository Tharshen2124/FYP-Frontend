import type { ModalState } from "../_types"

export const DAYS_FULL  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
export const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export const CAL_START  = 6
export const CAL_END    = 22
export const TOTAL_HRS  = CAL_END - CAL_START
export const HR_PX      = 64

/** What a task links to when its role carries no colour — roles predate the palette server-side. */
export const TASK_COLOR = "#B13BFF"

/* Re-exported rather than repeated: the reserved yellow and the fixed-appointment blue are facts
   about the whole app, and the role palette is where they are defined precisely because no role
   and no Sharpen the Saw dimension may take either. */
export { FIXED_COLOR, WEEKLY_PRIORITY_COLOR } from "@/lib/role-colors"

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
