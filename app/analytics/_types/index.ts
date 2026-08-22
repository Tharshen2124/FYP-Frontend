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
  /** `total` is what was scheduled; the balance card reads `completed`, since the question is
      how Sharpen the Saw work was spread, not how much of the plan survived. */
  dimensions: { dimension: SharpenTheSawDimensionId; completed: number; total: number }[]
  roles: { roleId: string; name: string; color: string; completed: number; total: number }[]
  dailyPriorities: { dayOfWeek: number; completed: number; total: number }[]
  goals: { achieved: number; total: number; dropped: number }
}

export interface SharpenDimension {
  dimension: string
  color: string
  /**
   * This dimension's share of the Sharpen the Saw tasks completed in the range, as a whole percentage.
   * The four shares add up to 100 — the card asks how the work was *spread*, not how much of what
   * was scheduled got done, so an even 25% each is the balanced answer.
   */
  share: number
  /** The count behind the share, so a 50% built on one task can be told from one built on ten. */
  completed: number
}

/** The Sharpen the Saw card's whole reading: the split, what it was measured on, and how even it is. */
export interface SharpenBalance {
  dimensions: SharpenDimension[]
  /** Sharpen the Saw tasks completed across all four dimensions. 0 means there is no split to draw. */
  completed: number
  /** 100 when the four shares are even, 0 when one dimension holds everything. */
  balance: number
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
