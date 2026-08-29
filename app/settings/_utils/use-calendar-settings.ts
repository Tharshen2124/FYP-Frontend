"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { api, type ApiCalendarResponse, type ApiRole } from "@/lib/api"
import { buildCategories } from "../_constants/categories"
import { fromApiPreference, settingsEqual, toApiPreference, toggleCategoryIds } from "../_utils/categories"
import type { CalSettings, CategoryItem } from "../_types"

/**
 * What the callback redirect can say when it lands back on /settings. The happy path is a
 * fragment rather than a query string for the same reason /login's is: a fragment never reaches a
 * server, so it is never logged and never leaks through a Referer.
 */
const CONNECT_ERRORS: Record<string, string> = {
  access_denied: "You cancelled the Google sign-in, so nothing was connected.",
  invalid_state: "That connection link had expired. Please try connecting again.",
  token_exchange_failed: "Google wouldn't complete the connection. Please try again.",
  calendar_scope_declined:
    "HabitFlow needs permission to manage calendars. Please connect again and leave that box ticked.",
  no_refresh_token: "Google didn't send a lasting permission. Please try connecting again.",
  calendar_create_failed: "Couldn't create the HabitFlow calendar in your Google account.",
}

// A function, not a shared constant: two useState calls seeded from one object would alias the
// same Set, so `saved` and `current` would be the same thing until the first load landed.
const empty = (): CalSettings => ({ allowSync: true, exportIds: new Set() })

export function useCalendarSettings() {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [connected, setConnected] = useState(false)
  const [syncedAt, setSyncedAt] = useState<string | null>(null)
  const [saved, setSaved] = useState<CalSettings>(empty)
  const [current, setCurrent] = useState<CalSettings>(empty)
  const [isLoading, setIsLoading] = useState(true)
  /* Starts locked and unlocks when the server says so. The whole card waits on `isLoading`, so the
     switch is never drawn live and then disabled — it simply arrives in the state it belongs in. */
  const [isPremium, setIsPremium] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  // Set only by the connect redirect, so the offer to push is made once, on the visit that
  // connected. A reload has already cleared the fragment and will not ask again.
  const [justConnected, setJustConnected] = useState(false)

  /* Takes the whole response rather than its `calendar` half, because `premium` travels beside it
     on every calendar endpoint: a write that came back saying the tier had changed would otherwise
     be dropped on the floor, leaving the switch reading from the load that preceded it. */
  const applyCalendar = useCallback(({ calendar, premium }: ApiCalendarResponse, cats: CategoryItem[]) => {
    const ids = fromApiPreference(cats, calendar.export_preference)
    setSaved({ allowSync: calendar.sync_enabled, exportIds: ids })
    setCurrent({ allowSync: calendar.sync_enabled, exportIds: new Set(ids) })
    setConnected(calendar.connected)
    setSyncedAt(calendar.synced_at)
    setIsPremium(premium)
  }, [])

  useEffect(() => {
    let cancelled = false

    // The connect flow comes back as a redirect from Google, so its outcome arrives in the URL
    // rather than in a response. Read and clear it before the load, so a refresh does not re-toast.
    const hash = window.location.hash.replace(/^#/, "")
    if (hash) {
      const params = new URLSearchParams(hash)
      if (params.get("calendar") === "connected") {
        toast.success("Google Calendar connected")
        setJustConnected(true)
      }
      const error = params.get("calendar_error")
      if (error) toast.error(CONNECT_ERRORS[error] ?? "Couldn't connect Google Calendar. Please try again.")
      if (params.has("calendar") || params.has("calendar_error")) {
        window.history.replaceState(null, "", window.location.pathname)
      }
    }

    // The roles are what the export tree is built from, so both have to land before it can render.
    Promise.all([api.fetchCalendarSettings(), api.fetchStandingRoles()])
      .then(([calendarResponse, { roles }]: [ApiCalendarResponse, { roles: ApiRole[] }]) => {
        if (cancelled) return
        const cats = buildCategories(roles)
        setCategories(cats)
        applyCalendar(calendarResponse, cats)
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't load your Google Calendar settings — please refresh.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [applyCalendar])

  const isDirty = !settingsEqual(saved, current)

  const toggleCategory = (id: string) => {
    setCurrent(prev => ({ ...prev, exportIds: toggleCategoryIds(categories, prev.exportIds, id) }))
  }

  /**
   * The switch saves itself, rather than waiting for the Save bar.
   *
   * It used to sit behind that bar with the export tree, and it read as broken: a switch that
   * flips and then does nothing is indistinguishable from one that does not work, and the bar it
   * was really waiting on is further down the page, beside a different control. Switches are
   * immediate everywhere else; this one is now too.
   *
   * It deliberately sends the *saved* export preference rather than the edited one. Flipping a
   * switch must not quietly commit category edits the user has not pressed Save on.
   */
  const setAllowSync = async (allowSync: boolean) => {
    const previous = saved.allowSync
    setSaved(prev => ({ ...prev, allowSync }))
    setCurrent(prev => ({ ...prev, allowSync }))
    setIsBusy(true)

    try {
      const { calendar, premium } = await api.updateCalendarSettings({
        sync_enabled: allowSync,
        export_preference: toApiPreference(categories, saved.exportIds),
      })
      setSaved(prev => ({ ...prev, allowSync: calendar.sync_enabled }))
      setCurrent(prev => ({ ...prev, allowSync: calendar.sync_enabled }))
      setSyncedAt(calendar.synced_at)
      setIsPremium(premium)
      toast.success(
        calendar.sync_enabled
          ? "Automatic sync on — changes to your plan will reach Google Calendar"
          : "Automatic sync off — use Sync now to push changes"
      )
    } catch {
      setSaved(prev => ({ ...prev, allowSync: previous }))
      setCurrent(prev => ({ ...prev, allowSync: previous }))
      toast.error("Couldn't change automatic sync — please try again.")
    } finally {
      setIsBusy(false)
    }
  }

  const discard = () => setCurrent({ allowSync: saved.allowSync, exportIds: new Set(saved.exportIds) })

  const connect = async () => {
    setIsBusy(true)
    try {
      // A URL rather than a redirect: the browser cannot send the bearer token that says which
      // account is connecting, so the token stays on this call and the browser follows the result.
      const { url } = await api.fetchCalendarConnectUrl()
      window.location.href = url
    } catch {
      toast.error("Couldn't start the Google connection — please try again.")
      setIsBusy(false)
    }
  }

  const disconnect = async () => {
    setIsBusy(true)
    try {
      applyCalendar(await api.disconnectCalendar(), categories)
      toast.success("Google Calendar disconnected")
    } catch {
      toast.error("Couldn't disconnect Google Calendar — please try again.")
    } finally {
      setIsBusy(false)
    }
  }

  const save = async () => {
    setIsBusy(true)
    try {
      const response = await api.updateCalendarSettings({
        sync_enabled: current.allowSync,
        export_preference: toApiPreference(categories, current.exportIds),
      })
      applyCalendar(response, categories)
      toast.success("Google Calendar settings saved")
    } catch {
      toast.error("Couldn't save your Google Calendar settings — please try again.")
    } finally {
      setIsBusy(false)
    }
  }

  const syncNow = async () => {
    setIsBusy(true)
    try {
      const { written, deleted, ...calendarResponse } = await api.syncCalendar()
      applyCalendar(calendarResponse, categories)
      // Nothing to do is a real answer, and the honest one: the reconcile writes only what changed.
      toast.success(
        written + deleted === 0
          ? "Google Calendar is already up to date"
          : `Synced ${written} event${written === 1 ? "" : "s"}${deleted ? `, removed ${deleted}` : ""}`
      )
    } catch (error) {
      // The server's own sentence: it distinguishes being throttled from being unreachable from a
      // grant the user has revoked, and only the last of those is worth acting on.
      toast.error(error instanceof Error ? error.message : "Couldn't sync — please try again.")
    } finally {
      setIsBusy(false)
    }
  }

  const dismissJustConnected = () => setJustConnected(false)

  return {
    categories,
    connected,
    syncedAt,
    justConnected,
    dismissJustConnected,
    current,
    isDirty,
    isLoading,
    isPremium,
    isBusy,
    toggleCategory,
    setAllowSync,
    discard,
    connect,
    disconnect,
    save,
    syncNow,
  }
}
