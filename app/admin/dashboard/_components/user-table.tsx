"use client"

import { Loader2, Search, ShieldCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { money, planLabel, planNote, shortDate, subscriptionTone } from "../_utils/format"
import { Pager } from "./pager"
import { StatusBadge } from "./status-badge"
import type { AdminUserRow, PagedList } from "../_types"

interface Props {
  list: PagedList<AdminUserRow>
  search: string
  onSearchChange: (value: string) => void
}

/**
 * Every account, newest first, one page at a time.
 *
 * The columns are chosen to answer "is this account real, and is it worth anything": when it
 * signed up, whether it finished onboarding, how many weeks it has actually planned, what it pays
 * and what it has paid. Nothing here is a credential — the server shapes this payload by hand
 * precisely so the token and digest columns on `users` cannot ride along.
 *
 * Rows stay on screen while the next page loads and the table dims instead of emptying, so a page
 * turn does not collapse the card and bring it back.
 */
export function UserTable({ list, search, onSearchChange }: Props) {
  const { rows, pagination, isLoading, page, setPage } = list

  return (
    <section
      aria-label="Users"
      className="p-6 rounded-2xl bg-card border-2 border-border"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Users</h2>
          <p className="text-xs text-muted-foreground font-serif mt-0.5">
            Every account, newest first
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={event => onSearchChange(event.target.value)}
            placeholder="Search email or username"
            aria-label="Search users by email or username"
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[46rem]">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-muted-foreground">
              <th className="text-left pb-3 font-medium">Account</th>
              <th className="text-left pb-3 font-medium">Joined</th>
              <th className="text-left pb-3 font-medium">Plan</th>
              <th className="text-right pb-3 font-medium">Weeks</th>
              <th className="text-left pb-3 font-medium pl-4">Last planned</th>
              <th className="text-right pb-3 font-medium pl-4">Paid</th>
            </tr>
          </thead>
          <tbody className={isLoading ? "opacity-50 transition-opacity" : "transition-opacity"}>
            {rows.map(user => (
              <tr key={user.user_id} className="border-t border-border align-middle">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-medium">{user.username}</span>
                    {user.is_admin && (
                      <ShieldCheck
                        className="w-3.5 h-3.5 text-primary shrink-0"
                        aria-label="Administrator"
                      />
                    )}
                    {/* Not onboarded is worth seeing at a glance: it is the difference between an
                        account that signed up and one that ever used the app. */}
                    {!user.is_onboarded && (
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded-full px-1.5 py-0.5">
                        Onboarding
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </td>
                <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                  {shortDate(user.created_at)}
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge
                    /* The tone follows the plan, not the raw status: a lapsed account is on Free
                       and reads as Free, with the status underneath saying how it got there. */
                    tone={user.premium ? "good" : subscriptionTone(user.subscription_status)}
                    label={planLabel(user.premium)}
                  />
                  {planNote(user.premium, user.subscription_status) && (
                    <p className="text-xs text-muted-foreground">
                      {planNote(user.premium, user.subscription_status)}
                    </p>
                  )}
                </td>
                <td className="py-3 text-right text-muted-foreground tabular-nums">
                  {user.weekly_plans}
                </td>
                <td className="py-3 pl-4 text-muted-foreground whitespace-nowrap">
                  {shortDate(user.last_plan_week)}
                </td>
                <td className="py-3 pl-4 text-right text-foreground tabular-nums whitespace-nowrap">
                  {user.paid_cents > 0 ? money(user.paid_cents, user.currency) : "—"}
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
              Loading accounts…
            </>
          ) : search ? (
            <>No account matches “{search}”.</>
          ) : (
            <>No accounts yet.</>
          )}
        </div>
      )}

      <Pager pagination={pagination} page={page} isLoading={isLoading} onPageChange={setPage} />
    </section>
  )
}
