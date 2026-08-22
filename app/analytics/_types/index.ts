import type { SharpenTheSawDimensionId } from "@/lib/sharpen-the-saw-dimensions"

/** Date selection — the public API for all filtered components. */
export interface DateSelection {
  day: number    // 1–31
  month: number  // 0-indexed  (0 = Jan, 11 = Dec)
  year: number
}

/**
 * One planned week, as the page holds it: the API's counts in camelCase with colours already
 * resolved. Every card derives what it draws from a list of these, so changing a range never costs
 * a request — the whole window is fetched once.
 */
export interface AnalyticsWeek {
  weekStart: string  // ISO Monday
  endDate: string
  dimensions: { dimension: SharpenTheSawDimensionId; completed: number; total: number }[]
  roles: { roleId: string; name: string; color: string; completed: number; total: number }[]
  dailyPriorities: { dayOfWeek: number; completed: number; total: number }[]
  goals: { achieved: number; total: number; dropped: number }
}

export interface SharpenDimension {
  dimension: string
  score: number
  color: string
}

export interface RoleTaskStat {
  role: string
  color: string
  completed: number
  total: number
}

export interface DailyPriorityDay {
  day: string
  completed: number
  total: number
}

export interface WeeklyCompletion {
  id: string
  label: string
  completed: number
  /**
   * The achieved-vs-total denominator. Goals dropped mid-week are NOT counted here — they are
   * reported separately, so pruning a goal neither reads as a failure nor quietly inflates the
   * percentage.
   */
  total: number
  dropped: number
}
