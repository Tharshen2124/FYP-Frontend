/**
 * One evening's entry. `dayIndex` is 0 = Monday … 6 = Sunday — the same indexing as
 * `tasks.day_of_week` and `getWeekDays()` in lib/date.ts, so `getWeekDays(week)[dayIndex]` is the
 * date it was written for. Day names are a label, never an identity: the mock used to key
 * reflections by "Monday", which is why nothing could be sent to a week-scoped endpoint.
 */
export interface DayReflection {
  dayIndex: number
  text: string
  updatedAt: string
}

/** Generated once per week and never regenerated. */
export interface WeekSummary {
  text: string
  generatedAt: string
}

/** One row of the sidebar. Counts only — the text belongs to the week actually being viewed. */
export interface WeekMeta {
  weekStart: string
  reflectionCount: number
  hasSummary: boolean
}
