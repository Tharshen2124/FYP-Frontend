import { generateWeeks } from "../_utils/weeks"

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

/** Fixed reference date so the mock week list is stable between renders. */
const REFERENCE_DATE = new Date(2026, 4, 24) // May 24, 2026

export const INITIAL_WEEKS = generateWeeks(REFERENCE_DATE)

/** Stand-in for the AI-generated weekly summary. */
export const SUMMARY_PLACEHOLDER =
  "This week showed meaningful progress across your daily reflections. You maintained consistency through mid-week, with particular depth on Wednesday and Thursday. Your reflections reveal a recurring theme of gratitude and focus on personal growth. Consider carrying forward your Wednesday insights into next week's planning."

/** Simulated latency of the summary generation call. */
export const SUMMARY_DELAY_MS = 1800
