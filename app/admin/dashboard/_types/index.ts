import type { ApiAdminOverview, ApiAdminPayment, ApiAdminUser, ApiPagination } from "@/lib/api"

/**
 * One page of a server-paginated list, and the three states it can be in at once: `rows` may be
 * last page's while `isLoading` is true, which is deliberate — blanking the table on every page
 * turn makes the layout jump and re-reads as a failure. The rows stay, dimmed, until the next
 * page lands.
 */
export interface PagedList<T> {
  rows: T[]
  pagination: ApiPagination
  isLoading: boolean
  page: number
  setPage: (page: number) => void
}

export type AdminUserRow = ApiAdminUser
export type AdminPaymentRow = ApiAdminPayment
export type AdminOverview = ApiAdminOverview

/**
 * What a status *means*, rather than what it is called. Stripe names about eight subscription
 * states and this app cares about three distinctions: paying, about to stop paying, and not
 * paying. Every tone is rendered with its label beside it — a colour never carries the meaning on
 * its own, which is also what lets the same three tones serve payments and subscriptions alike.
 */
export type StatusTone = "good" | "warning" | "critical" | "neutral"
