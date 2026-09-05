"use client"

import { useEffect, useState } from "react"
import type { ApiPagination } from "@/lib/api"
import type { PagedList } from "../_types"

const EMPTY: ApiPagination = { page: 1, per_page: 0, total: 0, total_pages: 1 }

/** A page that has arrived, and which request it answered. */
interface Loaded<T> {
  page: number
  filterKey: string
  rows: T[]
  pagination: ApiPagination
}

interface Options<T> {
  /** False until the auth store has hydrated — the request carries a JWT and would only earn a 401. */
  enabled: boolean
  /**
   * Everything that changes *which rows exist*, as one string: the search term, the status filter.
   * When it changes the list is a different list, so it goes back to page 1 — staying on page 4 of
   * a search that now matches two rows shows an empty table that looks like a failure.
   */
  filterKey: string
  /**
   * **Must be memoised, and must change exactly when `filterKey` does.** It closes over the search
   * term, so an un-memoised one is a new function every render and this hook refetches forever.
   * Both callers wrap it in `useCallback` keyed on the value they also pass as `filterKey`.
   */
  fetchPage: (page: number) => Promise<{ rows: T[]; pagination: ApiPagination }>
  /** Also memoised, for the same reason. */
  onError: (error: unknown) => void
}

/**
 * One page of a server-paginated list.
 *
 * Written once and used by both tables here, which is the whole reason it is a hook rather than
 * two copies of the same five pieces of state — the page turn, the filter reset and the race guard
 * are identical for users and for payments, and a second copy is a second chance to get the race
 * guard wrong.
 *
 * **Loading is derived, not a flag.** What is held is the page that arrived *and which request it
 * answered*, so "still loading" is the two disagreeing — the same shape `/analytics`'
 * `use-analytics.ts` uses, and for the same reason: a boolean set inside the effect only flips
 * after the first paint, so the table renders once as loaded-and-empty before it renders as
 * loading.
 *
 * It also falls out of that shape that **rows survive a page turn**: the previous page stays in
 * `loaded` while the next is in flight, so the table dims rather than emptying. Blanking it
 * collapses the card to nothing and back, which reads as a failure rather than as a page turn.
 */
export function usePagedList<T>({ enabled, filterKey, fetchPage, onError }: Options<T>): PagedList<T> {
  const [request, setRequest] = useState({ page: 1, filterKey })
  const [loaded, setLoaded] = useState<Loaded<T> | null>(null)

  /* The filter changed, so this render is already about a different list. Resetting here rather
     than in an effect is what keeps it to one fetch: an effect would let this render through with
     the stale page, fire for it, and then fire again for page 1. */
  if (request.filterKey !== filterKey) setRequest({ page: 1, filterKey })

  const { page: requestedPage, filterKey: requestedFilter } = request

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    const answering = { page: requestedPage, filterKey: requestedFilter }

    fetchPage(requestedPage)
      .then(({ rows, pagination }) => {
        if (!cancelled) setLoaded({ ...answering, rows, pagination })
      })
      .catch(error => {
        if (cancelled) return
        // Recorded as answered-with-nothing rather than left pending: a failed request that never
        // updates `loaded` leaves the table saying "loading" forever instead of saying it failed.
        setLoaded({ ...answering, rows: [], pagination: EMPTY })
        onError(error)
      })

    return () => {
      cancelled = true
    }
    /* `fetchPage` is in the deps rather than behind a ref: it is memoised on the same value as
       `filterKey`, so the two change together and this fires once per page turn or filter change. */
  }, [enabled, requestedPage, requestedFilter, fetchPage, onError])

  const isLoading =
    loaded === null || loaded.page !== requestedPage || loaded.filterKey !== requestedFilter
  const pagination = loaded?.pagination ?? EMPTY

  return {
    rows: loaded?.rows ?? [],
    pagination,
    isLoading,
    /* While a page is in flight, the page being asked for — so the arrows respond to the click that
       started it. Once it lands, the page the *server* says it returned: it clamps a page beyond
       the end, so page 40 of 3 comes back, and reads, as page 3. */
    page: isLoading ? requestedPage : pagination.page,
    setPage: (page: number) => setRequest(current => ({ ...current, page })),
    /* Corrects the page already on screen after a write, rather than refetching it. A refetch would
       re-order nothing and re-count nothing — the write changed one boolean on one row — but it
       would dim the table and turn a toggle into a visible round trip. */
    setRows: (update: (rows: T[]) => T[]) =>
      setLoaded(current => (current ? { ...current, rows: update(current.rows) } : current)),
  }
}
