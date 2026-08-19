"use client"

import { useMemo, useSyncExternalStore } from "react"
import { getDayIndex, getWeekDays } from "@/lib/date"

export interface CurrentWeek {
  /** The seven dates of the current week, Monday first. */
  dayDates: Date[]
  /** Today's column, 0 = Monday … 6 = Sunday. */
  todayIdx: number
}

/** The "store" never changes, so this is a stable no-op subscription. */
const subscribe = () => () => {}

/**
 * The current week, resolved on the client only — `null` on the server render and `null` on the
 * first client render, then the real dates.
 *
 * "Today" is a client fact (see lib/date.ts). Deriving it while rendering on the server would bake
 * the server's clock into the HTML, so a user in another timezone would hydrate against the wrong
 * day. `useSyncExternalStore` is what gives a different value either side of hydration without
 * React flagging a mismatch. Callers should reserve the space they need and fill it once this
 * returns.
 */
export function useCurrentWeek(): CurrentWeek | null {
  const isHydrated = useSyncExternalStore(subscribe, () => true, () => false)

  return useMemo(
    () => (isHydrated ? { dayDates: getWeekDays(), todayIdx: getDayIndex() } : null),
    [isHydrated]
  )
}
