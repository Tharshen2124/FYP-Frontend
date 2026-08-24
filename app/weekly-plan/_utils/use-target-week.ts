"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import { formatWeekRange, isWeekStart, localWeekStartParam, shiftWeekStart } from "@/lib/date"

export interface TargetWeek {
  /** The Monday being planned, `YYYY-MM-DD`. Empty string until it resolves. */
  weekStart: string
  /** Whether that Monday is the current week's. */
  isCurrentWeek: boolean
  /** Whether the current week already has a plan — `null` until that has been checked. */
  currentWeekIsPlanned: boolean | null
  /** "Mon 24 – Sun 30 Aug", or "" before the week resolves. */
  label: string
  /** True while the default is being worked out. Steps should hold their loading state. */
  isResolving: boolean
  /**
   * Both this week and the next already have a plan, so there is nothing left for this flow to
   * write and `weekStart` stays empty. `null` until checked, and always `null` for a step reached
   * with an explicit `?week_start=` — that week was settled before the user got there.
   */
  isFullyPlanned: boolean | null
  /** The two weeks the check looked at, for the notice that explains the refusal. */
  plannedLabels: { thisWeek: string; nextWeek: string } | null
}

/**
 * Which week this flow is planning.
 *
 * The answer lives in the URL (`?week_start=`), so a refresh, a Back, or a shared link all land on
 * the same week, and the three steps inherit it from each other without any shared store.
 *
 * With no param it has to be worked out, and the rule is: **the current week if it has no plan,
 * otherwise the next one.** Someone opening this on Wednesday of a week they already planned means
 * next week; someone coming back after a gap to a week that was never planned means this one. That
 * second case is the whole reason the flow takes a week at all — always planning next week would
 * leave a returning user unable to fill in the week they are actually standing in.
 *
 * Asking `GET /weekly-plans` is what decides it, and that endpoint deliberately does not create the
 * plan it looks for — otherwise the act of asking would make the answer "planned" every time.
 *
 * The rule is the whole decision: there is deliberately **no control to override it**. Re-planning
 * a week already planned is not what this flow is for — `/weekly-plan/edit` moves the current
 * week's appointments and tasks, `/roles` adds a goal to it and `/sharpen-the-saw` an activity.
 * A toggle here only offered a second, worse route to those, and made "which week am I editing?"
 * a question the user had to keep answering.
 *
 * It also **stops at one week ahead**. With this week and the next both planned there is no third
 * week to offer: planning further out is planning a week whose shape is not known yet, and the
 * week after next becomes reachable on its own once next week starts. `isFullyPlanned` says so and
 * the step renders a notice instead of the wizard, rather than filing a plan nobody asked for.
 */
export function useTargetWeek(): TargetWeek {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const param = searchParams.get("week_start")

  const [resolved, setResolved] = useState<string | null>(null)
  const [currentWeekIsPlanned, setCurrentWeekIsPlanned] = useState<boolean | null>(null)
  const [isFullyPlanned, setIsFullyPlanned] = useState<boolean | null>(null)

  const fromUrl = isWeekStart(param) ? param : null

  // Only the first step ever has to work the week out. Steps 2 and 3 are always reached with the
  // param already in the URL, so they skip the request entirely rather than re-asking a question
  // that was settled before the user got there.
  const arrivedWithAWeek = useRef(fromUrl !== null)

  useEffect(() => {
    if (arrivedWithAWeek.current) return

    let cancelled = false
    const thisWeek = localWeekStartParam()
    const nextWeek = shiftWeekStart(thisWeek, 1)

    // Both weeks in one round trip. The second answer is only needed when the first comes back
    // planned, but asking in series would show the user a spinner for two requests to decide one
    // thing, and `GET /weekly-plans` deliberately creates nothing, so the extra look costs nothing.
    Promise.all([ api.fetchWeeklyPlan(thisWeek), api.fetchWeeklyPlan(nextWeek) ])
      .then(([ current, ahead ]) => {
        if (cancelled) return
        const thisWeekPlanned = current.weekly_plan !== null
        const nextWeekPlanned = ahead.weekly_plan !== null

        setCurrentWeekIsPlanned(thisWeekPlanned)

        if (!thisWeekPlanned) return setResolved(thisWeek)
        if (!nextWeekPlanned) return setResolved(nextWeek)

        // Planned through next week: nothing to write, so nothing is resolved and no week is
        // stamped into the URL. Leaving it bare is what makes a reload re-run this check rather
        // than walk back into the wizard on a week that needs no planning.
        setIsFullyPlanned(true)
      })
      .catch(() => {
        // Offering the current week is the safer guess: at worst it is already planned and the
        // user finds the surfaces that edit it, whereas guessing "next week" would quietly refuse
        // to plan the week they are standing in, and refusing outright would strand them.
        if (!cancelled) setResolved(thisWeek)
      })

    return () => { cancelled = true }
  }, [])

  // Stamping the resolved week into the URL is what lets the later steps read it back, and what
  // keeps a refresh on step 3 planning the same week it was planning a moment ago.
  useEffect(() => {
    if (fromUrl || !resolved) return
    router.replace(`${pathname}?week_start=${resolved}`)
  }, [fromUrl, resolved, pathname, router])

  const weekStart = fromUrl ?? resolved ?? ""
  const thisWeek = localWeekStartParam()
  const isCurrentWeek = weekStart === thisWeek

  return {
    weekStart,
    isCurrentWeek,
    currentWeekIsPlanned,
    label: weekStart ? formatWeekRange(weekStart) : "",
    // Being fully planned is an answer, not a pending one, so it ends the loading state even
    // though no week was resolved.
    isResolving: weekStart === "" && !isFullyPlanned,
    isFullyPlanned,
    plannedLabels: isFullyPlanned
      ? { thisWeek: formatWeekRange(thisWeek), nextWeek: formatWeekRange(shiftWeekStart(thisWeek, 1)) }
      : null,
  }
}
