/**
 * What each tier is, as the pricing surfaces state it. Shared by `/subscription` and
 * `/onboarding/complete`, so it sits in `lib/` rather than in either route's private folder.
 *
 * The **price is deliberately not here.** It lives in Stripe and arrives on the `plan` half of
 * `GET /subscription`, so the figure quoted on the page can never disagree with the figure on the
 * card form — a constant here would be a second source of truth for the one number that must not
 * be wrong.
 */

export type PlanId = "free" | "premium"

export interface PlanFeature {
  /** The line as the user reads it. */
  label: string
  /**
   * Whether this tier actually has it. A Free row is rendered struck-through and dimmed rather than
   * omitted, because the point of the comparison is what you are missing, not what you have.
   */
  included: boolean
}

export interface Plan {
  id: PlanId
  name: string
  tagline: string
  features: PlanFeature[]
}

/**
 * Both tiers list the same lines in the same order, so the two columns read across as a comparison
 * rather than as two unrelated lists. Every row present on one is present on the other.
 */
export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Everything you need to plan and run your week.",
    features: [
      { label: "Schedule your weekly plans", included: true },
      { label: "Adjust your goals, roles and tasks as often as you like", included: true },
      { label: "Push your schedule to Google Calendar", included: true },
      { label: "Daily check-ins to record what you completed", included: true },
      { label: "Sync calendar edits automatically", included: false },
      { label: "Unlimited history", included: false },
      { label: "Analytics dashboard", included: false },
      { label: "AI weekly summary", included: false },
    ],
  },
  premium: {
    id: "premium",
    name: "Premium",
    tagline: "The whole picture — your patterns over time, not just this week.",
    features: [
      { label: "Schedule your weekly plans", included: true },
      { label: "Adjust your goals, roles and tasks as often as you like", included: true },
      { label: "Push your schedule to Google Calendar", included: true },
      { label: "Daily check-ins to record what you completed", included: true },
      { label: "Sync calendar edits automatically", included: true },
      { label: "Unlimited history", included: true },
      { label: "Analytics dashboard", included: true },
      { label: "AI weekly summary", included: true },
    ],
  },
}

/** The two lines Free is limited to, spelled out where a struck-through row cannot say the number. */
export const FREE_TIER_LIMITS = {
  historyWeeks: 3,
} as const

export const FREE_PLAN = PLANS.free
export const PREMIUM_PLAN = PLANS.premium

/**
 * Stripe reports money in minor units and names its own currency, so both come from the API rather
 * than being assumed here. `Intl` knows how many decimal places each currency takes, which is the
 * part that would be wrong if this divided by 100 itself.
 */
export function formatPrice(amountCents: number, currency: string): string {
  const formatter = new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: currency.toUpperCase(),
  })
  const minorUnits = 10 ** (formatter.resolvedOptions().maximumFractionDigits ?? 2)
  return formatter.format(amountCents / minorUnits)
}
