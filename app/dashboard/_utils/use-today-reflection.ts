"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"

/**
 * Today's evening reflection, as the server already holds it.
 *
 * The check-in writes through `PUT /weekly-plans/evening-reflections`, an upsert keyed by
 * (week, day) — so opening on a blank textarea would quietly replace anything written earlier that
 * day on `/evening-reflections`. Seeding from the stored entry is the same move the modal already
 * makes for task completions, for the same reason.
 *
 * A failed read is reported rather than swallowed: writing over a row we could not read is exactly
 * the overwrite this hook exists to prevent.
 *
 * It loads once per mount, which is once per opening of the check-in — the dialog's contents are
 * mounted only while it is open — so a reflection written since the last look is picked up without
 * any resetting on close.
 */
export function useTodayReflection(dayIndex: number | null) {
  const [text, setText] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (dayIndex === null) return
    let cancelled = false

    /* No week argument: the endpoint defaults to the local Monday, which is the week the dashboard
       is showing and the only week the check-in can be about. */
    api
      .fetchEveningReflections()
      .then(({ reflections }) => {
        if (cancelled) return
        setText(reflections.find(r => r.day_of_week === dayIndex)?.content ?? "")
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [dayIndex, reloadKey])

  const reload = () => {
    setIsLoading(true)
    setLoadFailed(false)
    setReloadKey(k => k + 1)
  }

  return { text, setText, isLoading, loadFailed, reload }
}
