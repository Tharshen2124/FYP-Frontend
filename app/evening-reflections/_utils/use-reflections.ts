"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { api, type ApiEveningReflection, type ApiWeeklySummary } from "@/lib/api"
import { getWeekStart, isWeekStart, localDateParam, localWeekStartParam, shiftWeekStart } from "@/lib/date"
import { WEEKS_PER_PAGE } from "../_constants/reflections"
import { canGenerateSummary, countWritten, isEditableWeek, toDaySlots, weekStartsBack } from "./weeks"
import type { DayReflection, WeekMeta, WeekSummary } from "../_types"

const fromApiReflection = (r: ApiEveningReflection): DayReflection => ({
  dayIndex: r.day_of_week,
  text: r.content,
  updatedAt: r.updated_at,
})

const fromApiSummary = (s: ApiWeeklySummary): WeekSummary => ({
  text: s.content,
  generatedAt: s.generated_at,
})

/**
 * Everything this route reads and writes. It lives in a hook rather than in page.tsx for the
 * reason /roles does: the page is a slim orchestrator, and the 250-line cap is enforced by
 * tests/unit/file-structure.test.ts.
 *
 * The week being viewed lives in the URL as `?week_start=`, matching /weekly-plan — a reload, a
 * Back, or a shared link all land on the same week. Unlike `useTargetWeek` there is nothing to
 * resolve: this page always opens on the week the user is standing in, so the default is written
 * straight into the URL without asking the server anything.
 */
export function useReflections() {
  const router = useRouter()
  const pathname = usePathname()
  const param = useSearchParams().get("week_start")

  const thisWeek = localWeekStartParam()
  const weekStart = isWeekStart(param) ? param : thisWeek

  const [weekCount, setWeekCount] = useState(WEEKS_PER_PAGE)
  const [weekMeta, setWeekMeta] = useState<Record<string, WeekMeta>>({})
  const [slots, setSlots] = useState<(DayReflection | undefined)[]>(toDaySlots([]))
  const [summary, setSummary] = useState<WeekSummary | null>(null)
  const [planned, setPlanned] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  // Stamp the resolved week into the URL so the sidebar, a reload and a Back all agree on it.
  useEffect(() => {
    if (isWeekStart(param)) return
    router.replace(`${pathname}?week_start=${thisWeek}`)
  }, [param, pathname, thisWeek, router])

  // The strip is the Mondays back from the current week, whether or not each has a plan; the
  // server fills in counts for the ones that do. Widening it refetches the whole (small) range
  // rather than tracking which slice is already held.
  useEffect(() => {
    let cancelled = false
    const oldest = shiftWeekStart(thisWeek, -(weekCount - 1))

    api
      .fetchReflectionWeeks(oldest, thisWeek)
      .then(({ weeks }) => {
        if (cancelled) return
        setWeekMeta(
          Object.fromEntries(
            weeks.map(w => [
              w.week_start,
              { weekStart: w.week_start, reflectionCount: w.reflection_count, hasSummary: w.has_summary },
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
  }, [thisWeek, weekCount])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setSummaryError(null)

    api
      .fetchEveningReflections(weekStart)
      .then(({ planned, reflections, summary }) => {
        if (cancelled) return
        setPlanned(planned)
        setSlots(toDaySlots(reflections.map(fromApiReflection)))
        setSummary(summary && fromApiSummary(summary))
      })
      .catch(() => {
        if (cancelled) return
        setSlots(toDaySlots([]))
        toast.error("Couldn't load that week's reflections — please refresh.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [weekStart])

  const weeks: WeekMeta[] = useMemo(
    () =>
      weekStartsBack(thisWeek, weekCount).map(
        ws => weekMeta[ws] ?? { weekStart: ws, reflectionCount: 0, hasSummary: false }
      ),
    [thisWeek, weekCount, weekMeta]
  )

  const isEditable = isEditableWeek(weekStart)
  const reflectionCount = countWritten(slots)

  const selectWeek = useCallback(
    (next: string) => router.replace(`${pathname}?week_start=${next}`),
    [pathname, router]
  )

  /**
   * Any date jumps to the week containing it. "Which week does this date fall in" is `getWeekStart`
   * — the same function every other week-scoped route uses — so no search endpoint is needed.
   * Clamped to the current week: there is nothing to reflect on in a week that has not happened.
   */
  const jumpToDate = useCallback(
    (value: string) => {
      if (!value) return
      const monday = localDateParam(getWeekStart(new Date(`${value}T00:00:00`)))
      selectWeek(monday > thisWeek ? thisWeek : monday)
    },
    [selectWeek, thisWeek]
  )

  // Sent first, local state patched from the response — the house rule for every API-backed route
  // here. The sidebar count is patched too, so the week's badge moves without refetching the strip.
  const saveReflection = async (dayIndex: number, text: string) => {
    try {
      const { reflection } = await api.saveEveningReflection(dayIndex, text, weekStart)
      const saved = fromApiReflection(reflection)

      setSlots(prev => {
        const next = [...prev]
        next[dayIndex] = saved
        setWeekMeta(meta => ({
          ...meta,
          [weekStart]: {
            weekStart,
            hasSummary: meta[weekStart]?.hasSummary ?? false,
            reflectionCount: countWritten(next),
          },
        }))
        return next
      })
      return true
    } catch {
      toast.error("Couldn't save that reflection — please try again.")
      return false
    }
  }

  /**
   * Once only, forever. On success there is no path back into this function for this week; on
   * failure nothing was stored, so pressing again is a first attempt rather than a regenerate.
   *
   * The server's own sentence is shown rather than a generic message: "write all 7 reflections",
   * "already summarised" and "busy, try again in a minute" are three different things to do next.
   */
  const generateSummary = async () => {
    setIsGenerating(true)
    setSummaryError(null)
    try {
      const { summary } = await api.generateWeeklySummary(weekStart)
      setSummary(fromApiSummary(summary))
      setWeekMeta(meta => ({
        ...meta,
        [weekStart]: {
          weekStart,
          reflectionCount: meta[weekStart]?.reflectionCount ?? reflectionCount,
          hasSummary: true,
        },
      }))
    } catch (e) {
      setSummaryError(e instanceof Error ? e.message : "Couldn't generate your summary — please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    weekStart,
    weeks,
    hasOlderWeeks: true,
    loadOlderWeeks: () => setWeekCount(n => n + WEEKS_PER_PAGE),
    selectWeek,
    jumpToDate,
    thisWeek,
    isEditable,
    planned,
    slots,
    reflectionCount,
    isLoading,
    saveReflection,
    summary,
    canGenerate: canGenerateSummary({ planned, reflectionCount, summary }),
    isGenerating,
    summaryError,
    generateSummary,
  }
}
