import type { ApiAnalyticsWeek } from "@/lib/api"
import { formatWeekRange, parseLocalDate } from "@/lib/date"
import { getColor } from "@/lib/role-colors"
import {
  SHARPEN_THE_SAW_DIMENSIONS,
  type SharpenTheSawDimensionId,
} from "@/lib/sharpen-the-saw-dimensions"
import { COMPLETION_WEEKS_SHOWN, DAY_LABELS } from "../_constants/analytics"
import type {
  AnalyticsWeek,
  DailyPriorityDay,
  DateSelection,
  RoleTaskStat,
  SharpenDimension,
  WeeklyCompletion,
} from "../_types"

const DIMENSION_IDS = new Set<string>(SHARPEN_THE_SAW_DIMENSIONS.map(d => d.id))

/**
 * The API speaks snake_case and stores only ids; the page speaks camelCase and hex. Colours are
 * resolved here rather than server-side for the reason `/roles` and `/history` resolve theirs here:
 * the palettes live on the client (`lib/role-colors.ts`, `lib/sharpen-the-saw-dimensions.ts`).
 */
export function toAnalyticsWeek(week: ApiAnalyticsWeek): AnalyticsWeek {
  return {
    weekStart: week.week_start,
    endDate: week.end_date,
    // A dimension the client does not know how to draw is dropped rather than rendered nameless.
    dimensions: week.dimensions
      .filter(d => DIMENSION_IDS.has(d.dimension))
      .map(d => ({
        dimension: d.dimension as SharpenTheSawDimensionId,
        completed: d.completed,
        total: d.total,
      })),
    roles: week.roles.map(r => ({
      roleId: String(r.role_id),
      name: r.name,
      color: getColor(r.color_id ?? ""),
      completed: r.completed,
      total: r.total,
    })),
    dailyPriorities: week.daily_priorities.map(d => ({
      dayOfWeek: d.day_of_week,
      completed: d.completed,
      total: d.total,
    })),
    goals: week.goals,
  }
}

export function toDate(sel: DateSelection): Date {
  return new Date(sel.year, sel.month, sel.day)
}

/** A `DateSelection` for the Monday `weekStart` names, for seeding the selectors from real weeks. */
export function toSelection(weekStart: string): DateSelection {
  const d = parseLocalDate(weekStart)
  return { day: d.getDate(), month: d.getMonth(), year: d.getFullYear() }
}

/**
 * The years the selectors offer: those the fetched weeks touch, plus the current one so the
 * dropdown is never empty for a user with no history yet.
 */
export function availableYears(weeks: AnalyticsWeek[]): number[] {
  const years = new Set<number>([new Date().getFullYear()])
  for (const week of weeks) {
    years.add(parseLocalDate(week.weekStart).getFullYear())
    years.add(parseLocalDate(week.endDate).getFullYear())
  }
  return [...years].sort((a, b) => a - b)
}

/** Every fetched week that intersects the given range, newest first as the API returns them. */
export function getWeeksInRange(
  weeks: AnalyticsWeek[],
  from: DateSelection,
  to: DateSelection
): AnalyticsWeek[] {
  const a = toDate(from)
  const b = toDate(to)
  const [lo, hi] = a <= b ? [a, b] : [b, a]
  return weeks.filter(w => parseLocalDate(w.weekStart) <= hi && parseLocalDate(w.endDate) >= lo)
}

export function getWeekForDate(weeks: AnalyticsWeek[], date: DateSelection): AnalyticsWeek | null {
  const d = toDate(date)
  return (
    weeks.find(w => parseLocalDate(w.weekStart) <= d && parseLocalDate(w.endDate) >= d) ?? null
  )
}

/**
 * Per-dimension renewal scores across the range: of the tasks scheduled against activities in that
 * dimension, the share completed.
 *
 * The counts are pooled across the range rather than the per-week percentages averaged. Pooling is
 * the correct aggregation for a ratio, and it also handles the common case cleanly — a week that
 * scheduled nothing in a dimension contributes nothing, instead of a zero that drags the average
 * down as if the user had tried and failed.
 */
export function getSharpenData(
  weeks: AnalyticsWeek[],
  from: DateSelection,
  to: DateSelection
): SharpenDimension[] {
  const range = getWeeksInRange(weeks, from, to)

  return SHARPEN_THE_SAW_DIMENSIONS.map(meta => {
    let completed = 0
    let total = 0
    for (const week of range) {
      for (const d of week.dimensions) {
        if (d.dimension !== meta.id) continue
        completed += d.completed
        total += d.total
      }
    }

    return {
      dimension: meta.label,
      color: meta.color,
      score: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  })
}

/**
 * Per-role completed/total task counts, summed across every week in the range.
 *
 * Roles are unioned across the range rather than taken from any one week: a role only used in some
 * of the weeks still belongs in the table, and a role archived part-way through the range still
 * owned the tasks it owned.
 */
export function getRoleStats(
  weeks: AnalyticsWeek[],
  from: DateSelection,
  to: DateSelection
): RoleTaskStat[] {
  const byRole = new Map<string, RoleTaskStat>()

  for (const week of getWeeksInRange(weeks, from, to)) {
    for (const role of week.roles) {
      const held = byRole.get(role.roleId)
      if (held) {
        held.completed += role.completed
        held.total += role.total
      } else {
        byRole.set(role.roleId, {
          role: role.name,
          color: role.color,
          completed: role.completed,
          total: role.total,
        })
      }
    }
  }

  // Busiest first, then by name, so the order does not shuffle as counts change.
  return [...byRole.values()].sort((a, b) => b.total - a.total || a.role.localeCompare(b.role))
}

/**
 * The seven days of the week containing the date. Days with nothing starred come back as 0/0 rather
 * than being absent, so the chart always draws a full week; `[]` means no planned week covers it.
 */
export function getDailyPriority(
  weeks: AnalyticsWeek[],
  date: DateSelection
): DailyPriorityDay[] {
  const week = getWeekForDate(weeks, date)
  if (!week) return []

  return DAY_LABELS.map((day, index) => {
    const counts = week.dailyPriorities.find(d => d.dayOfWeek === index)
    return { day, completed: counts?.completed ?? 0, total: counts?.total ?? 0 }
  })
}

/** Week label for the matched week (shown in the daily priority card header). */
export function getWeekLabel(weeks: AnalyticsWeek[], date: DateSelection): string {
  const week = getWeekForDate(weeks, date)
  return week ? formatWeekRange(week.weekStart) : "No matching week"
}

/**
 * The most recent planned weeks, newest first. Unplanned weeks are skipped rather than shown as
 * 0/0: a week the user never planned is not a week they failed, and a run of zeroes would drag the
 * trend line through the floor.
 */
export function getWeeklyCompletions(
  weeks: AnalyticsWeek[],
  count: number = COMPLETION_WEEKS_SHOWN
): WeeklyCompletion[] {
  return weeks.slice(0, count).map(week => ({
    id: week.weekStart,
    label: formatWeekRange(week.weekStart),
    completed: week.goals.achieved,
    total: week.goals.total,
    dropped: week.goals.dropped,
  }))
}
