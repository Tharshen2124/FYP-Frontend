import {
  DAILY_RAW,
  DIMENSION_META,
  ROLE_META,
  ROLE_RAW,
  SHARPEN_RAW,
  WEEK_REGISTRY,
} from "../_constants/mock-data"
import type {
  DailyPriorityDay,
  DateSelection,
  RoleTaskStat,
  SharpenDimension,
  WeekId,
} from "../_types"

export function toDate(sel: DateSelection): Date {
  return new Date(sel.year, sel.month, sel.day)
}

/** Every registered week that intersects the given range, in registry order. */
export function getWeeksInRange(from: DateSelection, to: DateSelection): WeekId[] {
  const a = toDate(from)
  const b = toDate(to)
  const [lo, hi] = a <= b ? [a, b] : [b, a]
  return WEEK_REGISTRY.filter(w => w.start <= hi && w.end >= lo).map(w => w.id)
}

export function getWeekForDate(date: DateSelection): WeekId | null {
  const d = toDate(date)
  return WEEK_REGISTRY.find(w => w.start <= d && w.end >= d)?.id ?? null
}

/** Per-dimension renewal scores, averaged across every week in the range. */
export function getSharpenData(from: DateSelection, to: DateSelection): SharpenDimension[] {
  const range = getWeeksInRange(from, to)
  if (!range.length) return DIMENSION_META.map(m => ({ ...m, score: 0 }))
  return DIMENSION_META.map((meta, i) => ({
    ...meta,
    score: Math.round(range.reduce((s, id) => s + SHARPEN_RAW[id][i], 0) / range.length),
  }))
}

/** Per-role completed/total task counts, summed across every week in the range. */
export function getRoleStats(from: DateSelection, to: DateSelection): RoleTaskStat[] {
  const range = getWeeksInRange(from, to)
  if (!range.length) return ROLE_META.map(m => ({ ...m, completed: 0, total: 0 }))
  return ROLE_META.map((meta, i) => ({
    ...meta,
    completed: range.reduce((s, id) => s + ROLE_RAW[id][i][0], 0),
    total:     range.reduce((s, id) => s + ROLE_RAW[id][i][1], 0),
  }))
}

export function getDailyPriority(date: DateSelection): DailyPriorityDay[] {
  const id = getWeekForDate(date)
  return id ? DAILY_RAW[id] : []
}

/** Week label for the matched week (shown in the daily priority card header). */
export function getWeekLabel(date: DateSelection): string {
  const d = toDate(date)
  return WEEK_REGISTRY.find(w => w.start <= d && w.end >= d)?.label ?? "No matching week"
}
