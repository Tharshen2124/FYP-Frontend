"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { api, isPaymentRequired } from "@/lib/api"
import { latestPastWeekStart, parseLocalDate, shiftWeekStart } from "@/lib/date"
import { DEFAULT_RANGE_WEEKS, WEEKS_FETCHED } from "../_constants/analytics"
import {
  availableYears,
  getDailyPriority,
  getRangeLabel,
  getRoleStats,
  getSharpenData,
  getWeekLabel,
  getWeeksInRange,
  getWeeklyCompletions,
  toAnalyticsWeek,
  toSelection,
} from "./analytics"
import type { AnalyticsWeek, DateSelection } from "../_types"

/** The Sunday that closes the week `weekStart` opens, as a selection. */
function weekEndSelection(weekStart: string): DateSelection {
  const end = parseLocalDate(weekStart)
  end.setDate(end.getDate() + 6)
  return { day: end.getDate(), month: end.getMonth(), year: end.getFullYear() }
}

/**
 * Everything /analytics reads. It lives in a hook rather than page.tsx for the reason /roles and
 * /history do: the page is a slim orchestrator, and the 250-line cap is enforced by
 * tests/unit/file-structure.test.ts.
 *
 * The whole window is fetched **once** and every card filters it in the browser. Three independent
 * per-card ranges would otherwise be three requests that mostly overlap, and a week is only counts
 * — a year of them is smaller than one week of /history.
 *
 * The filters stay in `useState` rather than the URL, which is where /history and /weekly-plan keep
 * theirs. Those routes have one selection that *identifies* the page; three per-card filters would
 * make a URL nobody would share, and none of them names what the page is about.
 *
 * `isReady` is the auth gate: the request carries a JWT, so firing it before the store has hydrated
 * would only earn a 401. Until it is true the page reads as loading, which it is.
 */
export function useAnalytics(isReady: boolean) {
  // Finished weeks only, the same line /history draws: the week in progress belongs to /dashboard,
  // and a week still running would read low and climb all week as its goals were ticked off.
  const newest = latestPastWeekStart()

  /* The weeks held *and which fetch they are for*, rather than a separate loading flag. Keeping the
     two together is what lets "still loading" be derived below, the same reason use-history.ts
     does it: a flag set inside the effect only flips after the first paint. */
  const [loaded, setLoaded] = useState<{ newest: string; weeks: AnalyticsWeek[] } | null>(null)
  /* The whole page is paid for, so unlike the other three gated surfaces there is no flag to ride
     in on a payload — the only request this page makes is the one being refused. A 402 *is* the
     answer, which is why lib/api.ts carries the status: it lands in the same place a real failure
     would, and the two must not read alike. */
  const [isLocked, setIsLocked] = useState(false)

  const [sharpenFrom, setSharpenFrom] = useState<DateSelection>(() =>
    toSelection(shiftWeekStart(newest, -(DEFAULT_RANGE_WEEKS - 1)))
  )
  const [sharpenTo, setSharpenTo] = useState<DateSelection>(() => weekEndSelection(newest))
  const [roleFrom, setRoleFrom] = useState<DateSelection>(() =>
    toSelection(shiftWeekStart(newest, -(DEFAULT_RANGE_WEEKS - 1)))
  )
  const [roleTo, setRoleTo] = useState<DateSelection>(() => weekEndSelection(newest))
  const [priorityDate, setPriorityDate] = useState<DateSelection>(() => toSelection(newest))

  useEffect(() => {
    if (!isReady) return

    let cancelled = false
    const oldest = shiftWeekStart(newest, -(WEEKS_FETCHED - 1))

    api
      .fetchAnalytics(oldest, newest)
      .then(({ weeks }) => {
        if (cancelled) return
        setLoaded({ newest, weeks: weeks.map(toAnalyticsWeek) })
      })
      .catch(error => {
        if (cancelled) return
        // Recorded as loaded-with-nothing rather than left pending, or a failed request would spin
        // forever instead of saying so.
        setLoaded({ newest, weeks: [] })
        // No toast for a locked page: nothing went wrong, and a red banner over an upgrade offer
        // would say something did.
        if (isPaymentRequired(error)) return setIsLocked(true)
        toast.error("Couldn't load your analytics — please refresh.")
      })

    return () => {
      cancelled = true
    }
  }, [newest, isReady])

  const isLoading = loaded?.newest !== newest
  const weeks = useMemo(() => (isLoading ? [] : loaded.weeks), [isLoading, loaded])

  const years = useMemo(() => availableYears(weeks), [weeks])

  return {
    isLoading,
    isLocked,
    hasWeeks: weeks.length > 0,
    years,
    sharpen: {
      data: getSharpenData(weeks, sharpenFrom, sharpenTo),
      matchedWeeks: getWeeksInRange(weeks, sharpenFrom, sharpenTo).length,
      spanLabel: getRangeLabel(sharpenFrom, sharpenTo),
      from: sharpenFrom,
      to: sharpenTo,
      onFromChange: setSharpenFrom,
      onToChange: setSharpenTo,
    },
    roles: {
      stats: getRoleStats(weeks, roleFrom, roleTo),
      matchedWeeks: getWeeksInRange(weeks, roleFrom, roleTo).length,
      spanLabel: getRangeLabel(roleFrom, roleTo),
      from: roleFrom,
      to: roleTo,
      onFromChange: setRoleFrom,
      onToChange: setRoleTo,
    },
    priority: {
      days: getDailyPriority(weeks, priorityDate),
      label: getWeekLabel(weeks, priorityDate),
      value: priorityDate,
      onChange: setPriorityDate,
    },
    completions: getWeeklyCompletions(weeks),
  }
}
