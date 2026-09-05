"use client"

import { useState } from "react"
import { Ban, Loader2, Search, ShieldCheck, Undo2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { money, planLabel, planNote, shortDate, subscriptionTone } from "../_utils/format"
import { Pager } from "./pager"
import { StatusBadge } from "./status-badge"
import type { AdminUserRow, PagedList } from "../_types"
import type { UserFilter } from "../_utils/use-admin"

const FILTERS: { value: UserFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "banned", label: "Banned" },
]

interface Props {
  list: PagedList<AdminUserRow>
  search: string
  onSearchChange: (value: string) => void
  filter: UserFilter
  onFilterChange: (filter: UserFilter) => void
  /** Banned accounts across the whole table, from the overview — the reason to reach for the filter. */
  bannedCount: number
  onBanChange: (user: AdminUserRow, banned: boolean) => void
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
export function UserTable({
  list,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  bannedCount,
  onBanChange,
}: Props) {
  const { rows, pagination, isLoading, page, setPage } = list
  /* Only a ban is confirmed. An unban gives an account something back and is undone by the button
     that is still there, so a second click for it would be friction bought for nothing. */
  const [confirming, setConfirming] = useState<AdminUserRow | null>(null)

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
            {bannedCount > 0 && ` · ${bannedCount} banned`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Filter users by access">
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
              <th className="text-right pb-3 font-medium pl-4">Access</th>
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
                    {/* On the row as well as on the button: the button says what clicking it would
                        do, which is the opposite of the state, so it cannot also be the state. */}
                    {user.is_banned && (
                      <span className="text-[10px] uppercase tracking-wider text-destructive border border-destructive/40 rounded-full px-1.5 py-0.5">
                        Banned
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
                <td className="py-3 pl-4 text-right whitespace-nowrap">
                  {/* An admin is not offered the button at all: the server refuses a self-ban, and
                      admins are granted in the console, so the console is the way back from one. */}
                  {user.is_admin ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : user.is_banned ? (
                    <Button variant="outline" size="xs" onClick={() => onBanChange(user, false)}>
                      <Undo2 aria-hidden />
                      Unban
                    </Button>
                  ) : (
                    <Button variant="ghost" size="xs" onClick={() => setConfirming(user)}>
                      <Ban aria-hidden />
                      Ban
                    </Button>
                  )}
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
            <>No {filter === "all" ? "" : `${filter} `}account matches “{search}”.</>
          ) : filter === "banned" ? (
            <>No account is banned.</>
          ) : (
            <>No accounts yet.</>
          )}
        </div>
      )}

      <Pager pagination={pagination} page={page} isLoading={isLoading} onPageChange={setPage} />

      <AlertDialog
        open={confirming !== null}
        onOpenChange={open => !open && setConfirming(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban {confirming?.username}?</AlertDialogTitle>
            <AlertDialogDescription className="font-serif">
              {confirming?.email} will be signed out and refused at login. Their weeks, goals and
              payments are kept, and unbanning them here puts the account straight back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (confirming) onBanChange(confirming, true)
                setConfirming(null)
              }}
            >
              Ban account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
