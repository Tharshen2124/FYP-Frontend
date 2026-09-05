"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { ApiError, api } from "@/lib/api"
import { PER_PAGE, SEARCH_DEBOUNCE_MS } from "../_constants/admin"
import { usePagedList } from "./use-paged-list"
import type { AdminOverview, AdminPaymentRow, AdminUserRow } from "../_types"

/** What the server answers an account that is authenticated and simply not allowed here. */
const FORBIDDEN = 403

function isForbidden(error: unknown): boolean {
  return error instanceof ApiError && error.status === FORBIDDEN
}

export type PaymentFilter = "all" | "paid" | "failed"

/** Which side of the ban column the user list shows. */
export type UserFilter = "all" | "active" | "banned"

/**
 * Everything `/admin/dashboard` reads.
 *
 * Three requests, fired **in parallel** rather than gating the two lists on the overview landing
 * first. A non-admin who reaches this page earns three 403s instead of one, which costs nothing
 * and is the trade for the page arriving in one round trip rather than two — and any one of the
 * three refusing is enough to know, since the guard is on the whole controller.
 *
 * The lists page on the **server**, unlike `/analytics`, which fetches its whole window once and
 * slices it in the browser. The difference is a ceiling: a year of weekly counts has one, and
 * "every account that ever signed up" does not.
 */
export function useAdminDashboard(isReady: boolean) {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [denied, setDenied] = useState(false)
  const [isLoadingOverview, setIsLoadingOverview] = useState(true)

  /* What is typed, and what has been searched for. They are separate so the table is not refetched
     on every keystroke while the input still updates on every one — a debounced input that lags
     behind the cursor is worse than the requests it saves. */
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [userFilter, setUserFilter] = useState<UserFilter>("all")
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all")

  const onError = useCallback((error: unknown, what: string) => {
    // No toast for a refusal: nothing went wrong, and a red banner over an explanation of why the
    // page is empty would say that something did.
    if (isForbidden(error)) return setDenied(true)
    toast.error(`Couldn't load ${what} — please try again.`)
  }, [])

  useEffect(() => {
    if (!isReady) return

    let cancelled = false
    api
      .fetchAdminOverview()
      .then(result => {
        if (cancelled) return
        setOverview(result)
        setIsLoadingOverview(false)
      })
      .catch(error => {
        if (cancelled) return
        setIsLoadingOverview(false)
        onError(error, "the admin overview")
      })

    return () => {
      cancelled = true
    }
  }, [isReady, onError])

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  const users = usePagedList<AdminUserRow>({
    enabled: isReady,
    /* Both of the things that change *which accounts exist* in this list, as the one string the
       hook resets page 1 on — a filter change with the search term left in place is still a
       different list, and staying on page 4 of it would show an empty table. */
    filterKey: `${userFilter}:${search}`,
    fetchPage: useCallback(
      (page: number) =>
        api
          .fetchAdminUsers({
            page,
            perPage: PER_PAGE,
            query: search,
            access: userFilter === "all" ? undefined : userFilter,
          })
          .then(({ users: rows, pagination }) => ({ rows, pagination })),
      [search, userFilter]
    ),
    onError: useCallback((error: unknown) => onError(error, "the user list"), [onError]),
  })

  const payments = usePagedList<AdminPaymentRow>({
    enabled: isReady,
    filterKey: paymentFilter,
    fetchPage: useCallback(
      (page: number) =>
        api
          .fetchAdminPayments({
            page,
            perPage: PER_PAGE,
            status: paymentFilter === "all" ? undefined : paymentFilter,
          })
          .then(({ payments: rows, pagination }) => ({ rows, pagination })),
      [paymentFilter]
    ),
    onError: useCallback((error: unknown) => onError(error, "the payment list"), [onError]),
  })

  /**
   * The one write on this page. The row is corrected in place rather than the page refetched: the
   * write changed one boolean, and a refetch would dim the whole table to show it.
   *
   * Not wrapped in `useCallback` — unlike the two `fetchPage` closures above, nothing puts this in
   * a dependency array, and memoising it on `users` would defeat itself since that object is new
   * every render anyway.
   */
  const setUserBanned = async (user: AdminUserRow, banned: boolean) => {
    try {
      await api.setAdminUserBan(user.user_id, banned)
      users.setRows(rows =>
        rows
          .map(row => (row.user_id === user.user_id ? { ...row, is_banned: banned } : row))
          /* Under a filter the row has just stopped matching, it leaves rather than sitting in a
             list of banned accounts saying it is not one. The count in the pager goes stale by one
             until the next page turn, which is the cheaper wrong than a refetch that dims the
             table to move a single row. */
          .filter(row => userFilter === "all" || (row.is_banned === (userFilter === "banned")))
      )
      toast.success(
        banned
          ? `${user.username} is banned and has been signed out.`
          : `${user.username} can sign in again.`
      )
    } catch (error) {
      if (isForbidden(error)) return setDenied(true)
      // A write, so this says what did not happen rather than what would not load.
      toast.error(error instanceof Error ? error.message : "Couldn't change that account.")
    }
  }

  return {
    isLoading: isLoadingOverview,
    denied,
    overview,
    users,
    payments,
    setUserBanned,
    userFilter,
    setUserFilter,
    search: searchInput,
    setSearch: setSearchInput,
    paymentFilter,
    setPaymentFilter,
  }
}
