import { localWeekStartParam, shiftWeekStart } from "@/lib/date"
import { REQUIRED_DAYS } from "../_constants/reflections"
import type { DayReflection, WeekSummary } from "../_types"

/**
 * The `count` Mondays ending at `latest`, most recent first.
 *
 * The sidebar is generated here rather than taken from the server so that a week the user never
 * planned still appears, reading 0/7. The server only knows about weeks that have a plan, and a
 * strip with holes in it would be harder to read than one that shows the gap.
 */
export function weekStartsBack(latest: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => shiftWeekStart(latest, -i))
}

/**
 * Whether `weekStart` names a week that has finished, and is therefore read-only.
 *
 * This decision belongs to the client: it is the only party that knows the user's local date, the
 * same reason every `week_start` in this app is client-derived (lib/date.ts). The server keeps a
 * deliberately looser backstop so the two can never disagree in a way that blocks a real user.
 *
 * Both values are `YYYY-MM-DD` Mondays, and ISO dates sort lexicographically, so a string compare
 * is the whole comparison — no Date objects and no timezone to get wrong.
 */
export function isPastWeek(weekStart: string, today: Date = new Date()): boolean {
  return weekStart < localWeekStartParam(today)
}

/** True for a week that has not started yet, which the sidebar never offers but a URL can name. */
export function isFutureWeek(weekStart: string, today: Date = new Date()): boolean {
  return weekStart > localWeekStartParam(today)
}

/** A week is writable exactly when it is the one the user is standing in. */
export function isEditableWeek(weekStart: string, today: Date = new Date()): boolean {
  return !isPastWeek(weekStart, today) && !isFutureWeek(weekStart, today)
}

/**
 * Spreads reflections into seven slots by `dayIndex`.
 *
 * Indexed rather than pushed in order, so a week missing Wednesday leaves a hole at 2 instead of
 * shifting Thursday into it and showing the user a week they did not write.
 */
export function toDaySlots(reflections: DayReflection[]): (DayReflection | undefined)[] {
  const slots: (DayReflection | undefined)[] = Array(REQUIRED_DAYS).fill(undefined)
  for (const reflection of reflections) slots[reflection.dayIndex] = reflection
  return slots
}

export function countWritten(slots: (DayReflection | undefined)[]): number {
  return slots.filter(Boolean).length
}

/**
 * Whether this week's summary can be generated. Deliberately independent of whether the week has
 * ended: a week that closed with all seven written is exactly the week most worth summarising, and
 * gating it on the week being live would mean a user who filled in Sunday on Monday never got one.
 */
export function canGenerateSummary(
  { planned, reflectionCount, summary }:
  { planned: boolean; reflectionCount: number; summary: WeekSummary | null }
): boolean {
  return planned && summary === null && reflectionCount === REQUIRED_DAYS
}
