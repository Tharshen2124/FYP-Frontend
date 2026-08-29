"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { api } from "@/lib/api"
import type { Plan, Subscription, SubscriptionState } from "../_types"

/**
 * The one fetch behind `/subscription`, plus the two ways out to Stripe and the way back in.
 *
 * Modelled on `app/settings/_utils/use-calendar-settings.ts`, which is the closest thing in this
 * app to a third-party round trip: leave for a page someone else hosts, come back with the outcome
 * on the URL, read it once and clear it so a refresh is not a second telling.
 *
 * It differs in one place, and the reason is Stripe's. `/settings` reads `#calendar=connected`
 * because a fragment never reaches a server. Stripe substitutes the session id into the
 * `success_url` it is *given*, and only into the query string — and the page has to hand that id
 * back to the API — so the outcome arrives as `?checkout=…&session_id=…` instead.
 */
export function useSubscription(): SubscriptionState {
  const searchParams = useSearchParams()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBusy, setIsBusy] = useState(false)

  /* React runs effects twice in development, and confirming twice would be two round trips to
     Stripe for one payment. What makes the return a single event is this promise, not a boolean:
     a boolean would let the second run *skip* work the first run's teardown then discards, which
     is how a paid account used to render as Free until the page was refreshed. Holding the request
     itself means both runs await the same POST and neither can proceed before it has landed. */
  const returnHandled = useRef<Promise<void> | null>(null)

  useEffect(() => {
    let cancelled = false

    const outcome = searchParams.get("checkout")
    const sessionId = searchParams.get("session_id")

    /* Read the outcome and clear it before the load, so a refresh does not re-toast a payment that
       happened once. `replaceState` rather than a router push: this is tidying the URL, not a
       navigation, and it must not add a history entry to bounce back off. */
    const clearReturnParams = () => {
      window.history.replaceState(null, "", window.location.pathname)
    }

    /* Runs at most once per mount, and its toasts are deliberately not guarded by `cancelled`:
       a toast belongs to the Toaster rather than to this page, so it survives the teardown that
       discards the run which fired it. Only state-setting has to care which run is still alive. */
    async function handleReturn() {
      if (outcome === "success" && sessionId) {
        clearReturnParams()
        try {
          /* The webhook is what this app believes, but it can land after the browser is already
             back, and someone who has just paid should not be looking at a page that says Free.
             Confirming writes the same state through the same server code, so the two cannot
             disagree. The response is discarded: awaiting it is the point, because it is what
             orders the write before the read below. */
          await api.confirmCheckout(sessionId)
          toast.success("You're on Premium — thank you!")
        } catch {
          /* The payment itself is fine; only our reading of it failed. The webhook will still write
             it, so this says to wait rather than implying the money went nowhere. */
          toast.info("Payment received — your account is being updated.")
        }
      } else if (outcome === "cancelled") {
        clearReturnParams()
        toast.info("Checkout cancelled — you're still on the Free plan.")
      }
    }

    async function load() {
      // Never concurrent with the confirm: this read is what the page renders, and running it
      // against a write still in flight is reading the account as it was a moment before payment.
      await (returnHandled.current ??= handleReturn())

      try {
        const data = await api.fetchSubscription()
        if (cancelled) return
        setSubscription(data.subscription)
        setPlan(data.plan)
      } catch {
        if (!cancelled) toast.error("Couldn't load your subscription — please refresh.")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
    // Deliberately once on mount. The return params are consumed on the first pass and cleared off
    // the URL, so re-running when they change would be re-running on the clearing itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Both of these navigate away rather than fetching: Checkout and the Billing Portal are pages
     Stripe hosts. isBusy is never cleared on success — the tab is leaving, and re-enabling the
     button would only invite a second click against a session already being paid for. */
  const goToStripe = useCallback(async (getUrl: () => Promise<{ url: string }>, failure: string) => {
    setIsBusy(true)
    try {
      const { url } = await getUrl()
      window.location.assign(url)
    } catch {
      toast.error(failure)
      setIsBusy(false)
    }
  }, [])

  const upgrade = useCallback(
    () => goToStripe(api.createCheckoutSession, "Couldn't start checkout — please try again."),
    [goToStripe]
  )

  const manage = useCallback(
    () => goToStripe(api.createPortalSession, "Couldn't open the billing portal — please try again."),
    [goToStripe]
  )

  return { subscription, plan, isLoading, isBusy, upgrade, manage }
}
