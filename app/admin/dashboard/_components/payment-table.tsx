"use client"

import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { money, shortDate } from "../_utils/format"
import { Pager } from "./pager"
import { StatusBadge } from "./status-badge"
import type { AdminPaymentRow, PagedList } from "../_types"
import type { PaymentFilter } from "../_utils/use-admin"

const FILTERS: { value: PaymentFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
]

interface Props {
  list: PagedList<AdminPaymentRow>
  filter: PaymentFilter
  onFilterChange: (filter: PaymentFilter) => void
  /** Failures across the whole table, from the overview — the reason to reach for the filter. */
  failedCount: number
}

/**
 * Every invoice Stripe has told this app about.
 *
 * Filtering to failures is the one thing this table gets asked beyond "what came in": a failed
 * charge is the earliest signal of a subscription about to lapse, which is why the payments table
 * records one at all rather than only recording money that arrived.
 *
 * The invoice id is shown because it is the only thing here that can be pasted into Stripe's own
 * dashboard — every other column is a copy of what Stripe already holds, and this one is the way
 * back to the original.
 */
export function PaymentTable({ list, filter, onFilterChange, failedCount }: Props) {
  const { rows, pagination, isLoading, page, setPage } = list

  return (
    <section
      aria-label="Payments"
      className="p-6 rounded-2xl bg-card border-2 border-border"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Payments</h2>
          <p className="text-xs text-muted-foreground font-serif mt-0.5">
            Invoices as Stripe reported them
            {failedCount > 0 && ` · ${failedCount} failed`}
          </p>
        </div>

        <div className="flex items-center gap-1" role="group" aria-label="Filter payments by status">
          {FILTERS.map(({ value, label }) => (
            <Button
              key={value}
              size="sm"
              variant={filter === value ? "default" : "outline"}
              className={filter === value ? "" : "border-border text-muted-foreground"}
              aria-pressed={filter === value}
              onClick={() => onFilterChange(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[42rem]">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-muted-foreground">
              <th className="text-left pb-3 font-medium">Account</th>
              <th className="text-left pb-3 font-medium">Invoice</th>
              <th className="text-left pb-3 font-medium">Status</th>
              <th className="text-left pb-3 font-medium">Paid</th>
              <th className="text-right pb-3 font-medium pl-4">Amount</th>
            </tr>
          </thead>
          <tbody className={isLoading ? "opacity-50 transition-opacity" : "transition-opacity"}>
            {rows.map(payment => (
              <tr key={payment.payment_id} className="border-t border-border align-middle">
                <td className="py-3 pr-4">
                  {/* A payment whose account was deleted keeps its row — the amount is still real
                      revenue, and dropping it would quietly change the totals above. */}
                  <span className="text-foreground font-medium">
                    {payment.user?.username ?? "Deleted account"}
                  </span>
                  {payment.user && (
                    <p className="text-xs text-muted-foreground">{payment.user.email}</p>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <code className="text-xs text-muted-foreground font-mono">
                    {payment.stripe_invoice_id}
                  </code>
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge
                    tone={payment.status === "paid" ? "good" : "critical"}
                    label={payment.status === "paid" ? "Paid" : "Failed"}
                  />
                </td>
                <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                  {/* Falls back to when the row was written, so a failure — which has no paid_at —
                      still says when it happened rather than showing a dash. */}
                  {shortDate(payment.paid_at ?? payment.created_at)}
                </td>
                <td className="py-3 pl-4 text-right text-foreground tabular-nums whitespace-nowrap">
                  {money(payment.amount_cents, payment.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="flex items-center justify-center gap-2 h-32 text-muted-foreground text-sm font-serif">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading payments…
            </>
          ) : filter === "all" ? (
            <>No payments recorded yet.</>
          ) : (
            <>No {filter} payments.</>
          )}
        </div>
      )}

      <Pager pagination={pagination} page={page} isLoading={isLoading} onPageChange={setPage} />
    </section>
  )
}
