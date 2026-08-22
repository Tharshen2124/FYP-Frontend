import type { ApiAnalyticsWeek } from "@/lib/api"
import {
  formatWeekRange,
  formatWeekSpan,
  getWeekStart,
  localDateParam,
  parseLocalDate,
} from "@/lib/date"
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
  SharpenBalance,
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

/**
 * What a From/To pair actually covers, spelled out for the card.
 *
 * The filters select *weeks*: a date is only a way of naming the week it falls in, and that whole
 * week is either in or out — `getWeeksInRange` matches any week the range touches, and the API
 * only ever reports whole-week counts, so a half week is never a thing that could be counted.
 * Showing the resolved span under the selectors is what makes that legible rather than implied.
 */
export function getRangeLabel(from: DateSelection, to: DateSelection): string {
  const a = localDateParam(getWeekStart(toDate(from)))
  const b = localDateParam(getWeekStart(toDate(to)))
  const [lo, hi] = a <= b ? [a, b] : [b, a]
  return formatWeekSpan(lo, hi)
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

/** An even split across the four dimensions — the number the card measures balance against. */
export const EVEN_SHARE = 100 / SHARPEN_THE_SAW_DIMENSIONS.length

/**
 * The furthest a split can sit from even: everything in one dimension, which is (100 − 25) away on
 * that one and 25 away on each of the other three.
 */
const MAX_IMBALANCE = 2 * (100 - EVEN_SHARE)

/**
 * Rounds shares to whole percentages that still add up to 100. Rounding each one on its own lands
 * on 99 or 101 often enough to matter, and the four numbers sit in a list on the card where a
 * reader will add them up. Largest-remainder: floor them all, then give the points that were lost
 * back to the shares that lost the most.
 */
function roundToHundred(shares: number[]): number[] {
  const whole = shares.map(Math.floor)
  let remaining = 100 - whole.reduce((sum, n) => sum + n, 0)

  const byRemainder = shares
    .map((share, index) => ({ index, remainder: share - Math.floor(share) }))
    .sort((a, b) => b.remainder - a.remainder)

  for (const { index } of byRemainder) {
    if (remaining <= 0) break
    whole[index] += 1
    remaining -= 1
  }
  return whole
}

/**
 * How the renewal tasks completed across the range were *spread* over the four dimensions.
 *
 * This is a distribution, not four separate completion rates: each dimension's share is its
 * count over the range's total, so the four add up to 100 and an even 25% each is a perfectly
 * balanced spread. Habit 7 is about renewing all four, so the question the card answers is
 * "did I neglect one?" — which a per-dimension completion rate cannot say, since a dimension
 * with a single scheduled task that got done reads 100% while contributing almost nothing.
 *
 * `balance` collapses that into one figure: the total distance from an even split, scaled so 100
 * is perfectly even and 0 is everything in one dimension. Evenly covering k of the four dimensions
 * scores (k − 1) / 3, so one dimension is 0%, two is 33%, three is 67% and all four is 100%.
 *
 * Counts are pooled across the range rather than the weeks' shares averaged: pooling is the
 * correct aggregation for a ratio, and it stops a quiet week from carrying the same weight as a
 * busy one.
 */
export function getSharpenData(
  weeks: AnalyticsWeek[],
  from: DateSelection,
  to: DateSelection
): SharpenBalance {
  const range = getWeeksInRange(weeks, from, to)

  const counts = SHARPEN_THE_SAW_DIMENSIONS.map(meta => {
    let completed = 0
    for (const week of range) {
      for (const d of week.dimensions) {
        if (d.dimension === meta.id) completed += d.completed
      }
    }
    return completed
  })

  const completed = counts.reduce((sum, n) => sum + n, 0)
  const shares = counts.map(n => (completed > 0 ? (n / completed) * 100 : 0))

  // Measured off the exact shares rather than the rounded ones, so the headline figure never moves
  // because a percentage was nudged a point to make the four add up.
  const imbalance = shares.reduce((sum, share) => sum + Math.abs(share - EVEN_SHARE), 0)
  const rounded = completed > 0 ? roundToHundred(shares) : shares

  return {
    completed,
    balance: completed > 0 ? Math.round((1 - imbalance / MAX_IMBALANCE) * 100) : 0,
    dimensions: SHARPEN_THE_SAW_DIMENSIONS.map((meta, index) => ({
      dimension: meta.label,
      color: meta.color,
      share: rounded[index],
      completed: counts[index],
    })),
  }
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
