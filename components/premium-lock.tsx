"use client"

import Link from "next/link"
import { Crown, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  /** What is locked, named as the user would name it: "Analytics", "The AI weekly summary". */
  title: string
  /**
   * What they get by paying, in one sentence. Written as the feature's own description rather
   * than as a sales line — the page it sits on has already made the case for wanting it.
   */
  description: string
  /**
   * `card` replaces a whole surface (`/analytics`); `inline` sits inside one that still works
   * around it (the summary card, the sync switch, the history strip's footer).
   */
  variant?: "card" | "inline"
}

/**
 * The one way this app says "you have not paid for this".
 *
 * App-wide rather than route-private because four routes in three different flows need it, and a
 * route may not import another's `_*` folder — the same reason `plan-comparison.tsx` lives here.
 *
 * **Upgrading is a link to `/subscription`, never a checkout call.** That page owns the Stripe
 * handoff, reads the real price off Stripe on load, and is where a lapsed card is fixed; four
 * copies of `createCheckoutSession` would be four places for the price on screen to disagree with
 * the price on the card form.
 */
export function PremiumLock({ title, description, variant = "card" }: Props) {
  if (variant === "inline") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted border border-border">
        <Lock className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
        <p className="text-sm text-muted-foreground font-serif flex-1 leading-snug">
          {description}
        </p>
        <Link
          href="/subscription"
          className="text-sm font-bold text-primary hover:underline shrink-0"
        >
          Upgrade
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 rounded-2xl bg-card border-2 border-border max-w-xl">
      <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
        <Crown className="w-7 h-7 text-primary" aria-hidden />
      </div>
      <h2 className="text-lg font-bold text-foreground mb-2">{title} is a Premium feature</h2>
      <p className="text-muted-foreground font-serif text-sm mb-5">{description}</p>
      {/* bg-accent is the CTA role the design guidelines reserve yellow for, and the same class
          plan-comparison.tsx gives its own upgrade button — deliberately not a second claim on
          the yellow that means "weekly priority" on every calendar in this app. */}
      <Button
        asChild
        className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold gap-2"
      >
        <Link href="/subscription">
          <Crown className="w-4 h-4" />
          Upgrade to Premium
        </Link>
      </Button>
    </div>
  )
}
