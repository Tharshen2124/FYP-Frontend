"use client"

import { Crown, ExternalLink, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Subscription } from "../_types"

interface Props {
  subscription: Subscription
  isBusy: boolean
  onManage: () => void
}

/** How Stripe's own status strings read to someone who has never seen them. */
const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Payment overdue",
  unpaid: "Unpaid",
  canceled: "Cancelled",
  incomplete: "Awaiting payment",
  incomplete_expired: "Expired",
}

export function CurrentPlanCard({ subscription, isBusy, onManage }: Props) {
  const { premium, status, period_end, manageable } = subscription
  const renewal = period_end ? new Date(period_end) : null

  return (
    <div className="p-6 rounded-2xl bg-card border-2 border-border">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={[
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
              premium ? "bg-primary/20" : "bg-muted",
            ].join(" ")}
          >
            {premium ? (
              <Crown className="w-6 h-6 text-primary" />
            ) : (
              <Sparkles className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">
              You&apos;re on {premium ? "Premium" : "Free"}
            </p>
            <p className="text-sm text-muted-foreground font-serif">
              {premium && renewal
                ? /* "Renews" would be a guess: a subscription cancelled but still inside its period
                     reads active right up to this date and then stops. What is certain either way
                     is that Premium runs until then. */
                  `Premium until ${renewal.toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}`
                : premium
                  ? "Your subscription is active."
                  : "Upgrade any time — your plans, roles and history stay exactly as they are."}
              {status && STATUS_LABELS[status] && status !== "active" && (
                <span className="ml-1 text-foreground font-medium">({STATUS_LABELS[status]})</span>
              )}
            </p>
          </div>
        </div>

        {/* Only offered once there is a Stripe customer for the portal to show. */}
        {manageable && (
          <Button
            variant="outline"
            onClick={onManage}
            disabled={isBusy}
            className="border-border text-foreground hover:bg-secondary/20 gap-2"
          >
            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
            Manage subscription
          </Button>
        )}
      </div>

      {manageable && (
        <p className="text-xs text-muted-foreground font-serif mt-4">
          Cancelling, resuming, changing your card and downloading invoices all happen on Stripe&apos;s
          secure billing page.
        </p>
      )}
    </div>
  )
}
