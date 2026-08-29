"use client"

import { Check, Crown, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FREE_PLAN, FREE_TIER_LIMITS, PREMIUM_PLAN, formatPrice, type Plan } from "@/lib/plans"
import type { ApiPlan } from "@/lib/api"

interface Props {
  /** Which tier the account is on. Decides which column is marked "Current plan". */
  currentPlan: "free" | "premium"
  /** What Premium costs, straight from Stripe. Null while loading, or if Stripe was unreachable. */
  plan: ApiPlan | null
  /** Starts checkout. Omitted where there is nothing to buy — an already-premium account. */
  onUpgrade?: () => void
  isBusy?: boolean
}

/**
 * The Free vs Premium comparison, rendered both on `/subscription` and at the end of onboarding.
 *
 * App-wide rather than route-private because two routes in different flows use it, and a route may
 * not import another's `_*` folder — the alternative would be the two near-duplicate copies that
 * `goal-count-badge.tsx` had to become.
 *
 * The Premium column is emphasised with `--primary`, not `--accent`: yellow means one thing on a
 * calendar and this is deliberately not a second claim on it. `bg-accent` is used for the upgrade
 * button alone, which is the CTA role the design guidelines reserve it for.
 */
export function PlanComparison({ currentPlan, plan, onUpgrade, isBusy = false }: Props) {
  const price = plan ? formatPrice(plan.amount_cents, plan.currency) : null

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <PlanCard plan={FREE_PLAN} isCurrent={currentPlan === "free"} price="Free" />

      <PlanCard
        plan={PREMIUM_PLAN}
        isCurrent={currentPlan === "premium"}
        price={price}
        interval={plan?.interval ?? null}
        highlighted
      >
        {currentPlan === "free" && onUpgrade && (
          <Button
            onClick={onUpgrade}
            disabled={isBusy}
            className="w-full mt-6 bg-accent hover:bg-accent/90 text-accent-foreground font-bold gap-2"
          >
            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
            Upgrade to Premium
          </Button>
        )}
      </PlanCard>
    </div>
  )
}

interface CardProps {
  plan: Plan
  isCurrent: boolean
  /** Already formatted, or null while the price is still on its way from Stripe. */
  price: string | null
  interval?: string | null
  highlighted?: boolean
  children?: React.ReactNode
}

function PlanCard({ plan, isCurrent, price, interval, highlighted = false, children }: CardProps) {
  return (
    <div
      className={[
        "p-6 rounded-2xl bg-card border-2 flex flex-col transition-colors",
        highlighted ? "border-primary/50" : "border-border",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          {highlighted && <Crown className="w-5 h-5 text-primary" />}
          <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
        </div>
        {isCurrent && (
          <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">
            Current plan
          </span>
        )}
      </div>

      <p className="text-3xl font-bold text-foreground mb-1 tabular-nums">
        {price ?? <span className="text-muted-foreground text-xl">Loading…</span>}
        {price && interval && <span className="text-base font-medium text-muted-foreground"> / {interval}</span>}
      </p>
      <p className="text-muted-foreground font-serif text-sm mb-5">{plan.tagline}</p>

      <ul className="space-y-2.5 flex-1">
        {plan.features.map(feature => (
          <li key={feature.label} className="flex items-start gap-2.5">
            {feature.included ? (
              <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" aria-hidden />
            ) : (
              <X className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground/60" aria-hidden />
            )}
            <span
              className={[
                "text-sm font-serif leading-snug",
                feature.included ? "text-foreground" : "text-muted-foreground/70 line-through",
              ].join(" ")}
            >
              {feature.label}
              {/* A struck-through "Unlimited history" cannot say what you get instead. */}
              {!feature.included && feature.label.includes("history") && (
                <span className="ml-1 no-underline">(last {FREE_TIER_LIMITS.historyWeeks} weeks only)</span>
              )}
            </span>
            <span className="sr-only">{feature.included ? "included" : "not included"}</span>
          </li>
        ))}
      </ul>

      {children}
    </div>
  )
}
