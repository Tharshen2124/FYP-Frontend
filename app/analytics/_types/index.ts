/** Date selection — the public API for all filtered components. */
export interface DateSelection {
  day: number    // 1–31
  month: number  // 0-indexed  (0 = Jan, 11 = Dec)
  year: number
}

export type WeekId = "w1" | "w2" | "w3" | "w4" | "w5"

export interface WeekRegistryEntry {
  id: WeekId
  label: string
  start: Date
  end: Date
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

export type Trend = "up" | "down" | "flat"

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
  trend: Trend
}
