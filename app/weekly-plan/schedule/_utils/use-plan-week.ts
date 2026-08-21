"use client"

import { useMemo } from "react"
import { useCurrentWeek } from "@/hooks/use-current-week"
import { getWeekDays, localDateParam, parseLocalDate } from "@/lib/date"

export interface PlanWeekDays {
  /** The seven dates of the week being planned, Monday first. */
  dayDates: Date[]
  /** Today's column, or -1 when the week being planned is not the current one. */
  todayIdx: number
}

/**
 * The dates the calendar should print for the week being planned.
 *
 * The tabs used `useCurrentWeek()` for this, which is always *this* week — so planning the week
 * ahead drew a calendar headed `Mon 17, Tue 18…` with Monday to Wednesday greyed out as already
 * gone. Days in the future were dimmed as past, and the dates named a week the user was not
 * editing.
 *
 * "Today" still has to come from the client clock, so it keeps coming from `useCurrentWeek`, and
 * it only applies when the week on screen is the one today falls in.
 */
export function usePlanWeekDays(weekStart: string): PlanWeekDays | null {
  const current = useCurrentWeek()

  return useMemo(() => {
    if (!weekStart || current == null) return null

    const isCurrentWeek = localDateParam(current.dayDates[0]) === weekStart

    return {
      dayDates: getWeekDays(parseLocalDate(weekStart)),
      todayIdx: isCurrentWeek ? current.todayIdx : -1,
    }
  }, [weekStart, current])
}
