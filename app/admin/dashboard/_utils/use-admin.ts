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
    filterKey: search,
    fetchPage: useCallback(
      (page: number) =>
        api
          .fetchAdminUsers({ page, perPage: PER_PAGE, query: search })
          .then(({ users: rows, pagination }) => ({ rows, pagination })),
      [search]
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

  return {
    isLoading: isLoadingOverview,
    denied,
    overview,
    users,
    payments,
    search: searchInput,
    setSearch: setSearchInput,
    paymentFilter,
    setPaymentFilter,
  }
}
