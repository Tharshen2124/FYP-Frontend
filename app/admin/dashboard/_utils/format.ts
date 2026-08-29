import { formatPrice } from "@/lib/plans"
import { SUBSCRIPTION_TONES } from "../_constants/admin"
import type { StatusTone } from "../_types"

/**
 * Money, or an em dash when there is none.
 *
 * Delegates to `lib/plans.ts`, which is where `/subscription` gets the figure it prints beside the
 * card form — the same amount must not be formatted two ways in one app. A null currency is not a
 * missing figure to fill with "RM 0.00": it means nothing has ever been paid, and a zero with a
 * currency on it claims a currency this deployment has never charged in.
 */
export function money(cents: number, currency: string | null): string {
  if (!currency) return "—"
  return formatPrice(cents, currency)
}

/** A date as an admin scans it: "29 Aug 2026". Never a time — no column here is that precise. */
export function shortDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/**
 * A `YYYY-MM` bucket as an axis tick: "Aug".
 *
 * Parsed as `-01T00:00` local rather than handed to `new Date("2026-08")`, which is treated as UTC
 * and lands in July for anyone west of Greenwich.
 */
export function monthLabel(month: string): string {
  const [year, monthIndex] = month.split("-").map(Number)
  return new Date(year, monthIndex - 1, 1).toLocaleDateString("en-GB", { month: "short" })
}

/**
 * The same tick, carrying a two-digit year where the axis crosses into a new one.
 *
 * Thirteen months is a span with two Augusts on it — one at each end — and a row of bare month
 * names gives a reader no way to tell which is which. The year is added at the first tick and at
 * every January, the two places it actually changes; repeating it on all thirteen would be twelve
 * restatements of something the reader already knows.
 */
export function monthTick(month: string, index: number): string {
  const label = monthLabel(month)
  const isJanuary = month.endsWith("-01")
  if (index !== 0 && !isJanuary) return label

  return `${label} ${month.slice(2, 4)}`
}

/** The same bucket in full, for a tooltip that has room: "August 2026". */
export function monthFull(month: string): string {
  const [year, monthIndex] = month.split("-").map(Number)
  return new Date(year, monthIndex - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  })
}

/**
 * A share, rounded, guarding the empty denominator. A brand-new deployment has no users, and
 * "NaN%" on the first card anyone ever sees is a worse answer than "0%".
 */
export function share(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0
}

/**
 * The same share as a label, distinguishing none from nearly none.
 *
 * Six premium accounts out of three thousand rounds to 0%, and "6 · 0% of accounts" reads as a
 * contradiction — the reader checks the figure beside it rather than believing the percentage.
 * "<1%" says the same thing without denying the six. The mirror case matters as much: a single
 * unconverted account among hundreds must not round up to a clean "100%".
 */
export function percentLabel(part: number, whole: number): string {
  if (whole <= 0 || part <= 0) return "0%"

  const exact = (part / whole) * 100
  if (exact < 1) return "<1%"
  if (exact > 99 && part < whole) return ">99%"
  return `${Math.round(exact)}%`
}

/**
 * The **plan** an account is on, which is what a column headed "Plan" is asking. `premium?` is the
 * server's own answer, so this cannot disagree with what the app actually unlocks.
 *
 * Not the raw Stripe status: "Active" is the state of a subscription, not the name of a plan, and
 * on a row whose next column is a money figure it reads as though the *account* is active — which
 * every account in the table is.
 */
export function planLabel(premium: boolean): string {
  return premium ? "Premium" : "Free"
}

/**
 * The qualifier under the plan, when Stripe's status says something the plan word does not.
 *
 * "Premium" already implies `active` and "Free" already implies no subscription at all, so those
 * two get nothing. Everything else is exactly what an admin opened this table for: a premium
 * account that is `trialing` has not paid yet, and a free one reading `past_due` or `canceled` was
 * paying until recently — neither of which the plan word can say on its own.
 */
export function planNote(premium: boolean, status: string | null): string | null {
  if (premium && status === "active") return null
  if (!premium && status === null) return null
  return humanStatus(status)
}

/** Which of the three tones a Stripe subscription status reads as. */
export function subscriptionTone(status: string | null): StatusTone {
  if (!status) return "neutral"
  return SUBSCRIPTION_TONES[status] ?? "neutral"
}

/** Stripe's snake_case as a person reads it: `past_due` → "Past due". */
export function humanStatus(status: string | null): string {
  if (!status) return "None"
  const spaced = status.replace(/_/g, " ")
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/**
 * The pager's own sentence: "1–25 of 340". Computed from the page rather than from the row count,
 * so it stays correct while the next page is still in flight and the previous rows are on screen.
 */
export function rangeLabel(page: number, perPage: number, total: number): string {
  if (total === 0) return "No results"
  const first = (page - 1) * perPage + 1
  return `${first}–${Math.min(page * perPage, total)} of ${total}`
}
