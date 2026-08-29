"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { api, isPaymentRequired } from "@/lib/api"
import {
  getWeekStart,
  isWeekStart,
  latestPastWeekStart,
  localDateParam,
  shiftWeekStart,
  weekStartsBack,
} from "@/lib/date"
import { FREE_TIER_LIMITS } from "@/lib/plans"
import { WEEKS_PER_PAGE } from "../_constants/history"
import { freeHistoryFloor, toHistoryWeek } from "./history"
import type { HistoryWeek, HistoryWeekMeta } from "../_types"

/**
 * Everything this route reads. It lives in a hook rather than in page.tsx for the reason /roles and
 * /evening-reflections do: the page is a slim orchestrator, and the 250-line cap is enforced by
 * tests/unit/file-structure.test.ts.
 *
 * The week being viewed lives in the URL as `?week_start=`, matching /weekly-plan and
 * /evening-reflections — a reload, a Back, or a shared link all land on the same week.
 */
export function useHistory() {
  const router = useRouter()
  const pathname = usePathname()
  const param = useSearchParams().get("week_start")

  const newest = latestPastWeekStart()

  /* null until the strip's own response says which tier this is. Unknown counts as free for what
     is *shown* but not for what is *clamped*: showing three weeks and then adding more only ever
     gives, whereas rewriting the URL on a guess would throw away a paid account's deep link to a
     week it is perfectly entitled to. */
  const [premium, setPremium] = useState<boolean | null>(null)
  const oldest = premium === false ? freeHistoryFloor(newest) : null

  // A hand-edited URL naming the current week — or a future one — is clamped rather than refused:
  // there is nothing to look back on there, and the nearest week that does exist is the answer.
  // A week behind the free tier's window is clamped the same way, and for the same reason.
  const inRange = useCallback(
    (value: string) => value <= newest && (oldest === null || value >= oldest),
    [newest, oldest]
  )
  const weekStart = isWeekStart(param) && inRange(param) ? param : newest

  const [weekCount, setWeekCount] = useState(WEEKS_PER_PAGE)
  /* The strip is fetched at full width whatever the tier — the server clamps a free range itself,
     so asking narrowly would save nothing and cost a second request the moment `premium` landed. */
  const visibleCount = premium === true ? weekCount : FREE_TIER_LIMITS.historyWeeks
  const [weekMeta, setWeekMeta] = useState<Record<string, HistoryWeekMeta>>({})
  /* The week held *and which week it is*, rather than the week plus a separate loading flag.
     Keeping the two together is what lets "still loading" be derived below: a flag set inside the
     effect only flips after the first paint, so for one frame the previous week's goals and
     schedule would sit under the new week's heading. */
  const [loaded, setLoaded] = useState<{ weekStart: string; week: HistoryWeek | null } | null>(null)

  // Stamp the resolved week into the URL so the sidebar, a reload and a Back all agree on it.
  useEffect(() => {
    if (isWeekStart(param) && inRange(param)) return
    router.replace(`${pathname}?week_start=${newest}`)
  }, [param, pathname, newest, inRange, router])

  // The strip is the Mondays back from the newest past week, whether or not each has a plan; the
  // server fills in counts for the ones that do. Widening it refetches the whole (small) range
  // rather than tracking which slice is already held.
  useEffect(() => {
    let cancelled = false
    const oldest = shiftWeekStart(newest, -(weekCount - 1))

    api
      .fetchHistoryWeeks(oldest, newest)
      .then(({ weeks, premium: isPremium }) => {
        if (cancelled) return
        setPremium(isPremium)
        setWeekMeta(
          Object.fromEntries(
            weeks.map(w => [
              w.week_start,
              {
                weekStart: w.week_start,
                planned: true,
                taskCount: w.task_count,
                tasksCompleted: w.tasks_completed,
              },
            ])
          )
        )
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't load your weeks — please refresh.")
      })

    return () => {
      cancelled = true
    }
  }, [newest, weekCount])

  useEffect(() => {
    let cancelled = false

    api
      .fetchHistoryWeek(weekStart)
      .then(({ week }) => {
        if (cancelled) return
        // Every week this route offers has ended, so the goal outcomes it derives can only be
        // achieved, missed or dropped — never `open`. Passing the fact rather than assuming it
        // keeps the mapper honest if the route is ever pointed at a live week.
        setLoaded({ weekStart, week: week && toHistoryWeek(week, true) })
      })
      .catch(error => {
        if (cancelled) return
        // Recorded as loaded-with-nothing rather than left pending, or a failed request would
        // spin forever instead of saying so.
        setLoaded({ weekStart, week: null })
        // A week behind the free window is refused with 402. Nothing has gone wrong — the clamp
        // above moves the URL back into range as soon as `premium` lands — so no error toast.
        if (isPaymentRequired(error)) return
        toast.error("Couldn't load that week — please refresh.")
      })

    return () => {
      cancelled = true
    }
  }, [weekStart])

  // Loading is "what I hold is not what was asked for", which covers the first load and every
  // switch between weeks without a flag to keep in step.
  const isLoading = loaded?.weekStart !== weekStart
  const week = isLoading ? null : loaded.week

  const weeks: HistoryWeekMeta[] = useMemo(
    () =>
      weekStartsBack(newest, visibleCount).map(
        ws => weekMeta[ws] ?? { weekStart: ws, planned: false, taskCount: 0, tasksCompleted: 0 }
      ),
    [newest, visibleCount, weekMeta]
  )

  const selectWeek = useCallback(
    (next: string) => router.replace(`${pathname}?week_start=${next}`),
    [pathname, router]
  )

  /**
   * Any date jumps to the week containing it. "Which week does this date fall in" is `getWeekStart`
   * — the same function every other week-scoped route uses — so no search endpoint is needed.
   * Clamped to the newest past week, which is also the date input's `max`.
   */
  const jumpToDate = useCallback(
    (value: string) => {
      if (!value) return
      const monday = localDateParam(getWeekStart(new Date(`${value}T00:00:00`)))
      if (monday > newest) return selectWeek(newest)
      selectWeek(oldest !== null && monday < oldest ? oldest : monday)
    },
    [selectWeek, newest, oldest]
  )

  return {
    weekStart,
    weeks,
    newest,
    // The date picker's `min`, alongside the `max` it already had. null for a paid account, which
    // has no floor beyond the range cap.
    oldest,
    isPremium: premium === true,
    week,
    isLoading,
    selectWeek,
    jumpToDate,
    loadOlderWeeks: () => setWeekCount(n => n + WEEKS_PER_PAGE),
  }
}
