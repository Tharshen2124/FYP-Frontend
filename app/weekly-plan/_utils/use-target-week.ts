"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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
  /** Switch between the current week and the next one, rewriting the URL. */
  toggleWeek: () => void
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
 */
export function useTargetWeek(): TargetWeek {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const param = searchParams.get("week_start")

  const [resolved, setResolved] = useState<string | null>(null)
  const [currentWeekIsPlanned, setCurrentWeekIsPlanned] = useState<boolean | null>(null)

  const fromUrl = isWeekStart(param) ? param : null

  // Only the first step ever has to work the week out. Steps 2 and 3 are always reached with the
  // param already in the URL, so they skip the request entirely rather than re-asking a question
  // that was settled before the user got there.
  const arrivedWithAWeek = useRef(fromUrl !== null)

  useEffect(() => {
    if (arrivedWithAWeek.current) return

    let cancelled = false
    const thisWeek = localWeekStartParam()

    api
      .fetchWeeklyPlan(thisWeek)
      .then(({ weekly_plan }) => {
        if (cancelled) return
        const planned = weekly_plan !== null
        setCurrentWeekIsPlanned(planned)
        setResolved(planned ? shiftWeekStart(thisWeek, 1) : thisWeek)
      })
      .catch(() => {
        // Offering the current week is the safer guess: at worst the user toggles forward, whereas
        // guessing "next week" would quietly refuse to plan the week they are standing in.
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

  const toggleWeek = useCallback(() => {
    const next = isCurrentWeek ? shiftWeekStart(thisWeek, 1) : thisWeek
    router.replace(`${pathname}?week_start=${next}`)
  }, [isCurrentWeek, thisWeek, pathname, router])

  return {
    weekStart,
    isCurrentWeek,
    currentWeekIsPlanned,
    label: weekStart ? formatWeekRange(weekStart) : "",
    isResolving: weekStart === "",
    toggleWeek,
  }
}
