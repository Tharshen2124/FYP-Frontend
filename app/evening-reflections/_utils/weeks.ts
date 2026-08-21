import { REQUIRED_DAYS } from "../_constants/reflections"
import type { DayReflection, WeekSummary } from "../_types"

/*
 * `weekStartsBack`, `isPastWeek`, `isFutureWeek` and `isEditableWeek` used to live here. They moved
 * to lib/date.ts when /history grew a week strip of its own: a route may not import another route's
 * private folder, and the alternative to hoisting was a second copy of "has this week passed" —
 * exactly the kind of second place to get wrong that lib/date.ts exists to prevent.
 *
 * What is left is what is genuinely about reflections rather than about weeks.
 */

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
