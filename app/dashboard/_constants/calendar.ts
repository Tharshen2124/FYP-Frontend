export const DAYS_FULL  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
export const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export const CAL_START = 6
export const CAL_END   = 22
export const TOTAL_HRS = CAL_END - CAL_START
export const HR_PX     = 64

// Same colours the onboarding scheduler uses, so a task looks the same on the dashboard as it did
// when the user placed it.
export const FIXED_COLOR = "#3b82f6"
export const TASK_COLOR  = "#B13BFF"

/* Re-exported rather than repeated: the reserved yellow is one fact about the whole app, and the
   role palette is where it is defined precisely because no role may take it. */
export { WEEKLY_PRIORITY_COLOR } from "@/lib/role-colors"
