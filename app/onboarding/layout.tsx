"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useAuthStore } from "@/stores/auth-store"

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isReady } = useRequireAuth()
  const isOnboarded = useAuthStore(state => state.isOnboarded)

  /**
   * Whether the user was *already* onboarded when they arrived here, latched on the first render
   * with a hydrated store. `null` until then.
   *
   * It has to be the arrival value rather than the live flag: step 5 calls `markOnboarded()` just
   * before it navigates to the dashboard, so a guard watching the live flag would fire on the user
   * who has this second legitimately finished the flow and tell them they were never allowed in.
   *
   * Latched during render rather than in an effect because it decides whether the flow renders at
   * all. Setting state while rendering is the supported way to do that: React drops this pass's
   * output and immediately re-runs with the value, so a blocked user never sees a frame of step 1.
   */
  const [arrivedOnboarded, setArrivedOnboarded] = useState<boolean | null>(null)
  if (isReady && arrivedOnboarded === null) setArrivedOnboarded(isOnboarded)

  // React runs effects twice in development; the toast should still only appear once.
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (!arrivedOnboarded || hasRedirected.current) return
    hasRedirected.current = true

    toast.info("You've already completed onboarding, so it's no longer available.")

    /*
     * The dashboard rather than `router.back()`, which is the obvious reading of "send them back"
     * but does not survive contact with this flow: every step of it is behind this same guard, so
     * backing out of one lands on another, which backs out again. A user pressing Back after
     * finishing would be walked all the way out of the app one onboarding step at a time.
     *
     * `replace` rather than `push` so the blocked URL leaves no history entry to bounce off.
     */
    router.replace("/dashboard")
  }, [arrivedOnboarded, router])

  // Rendered only once we know this user is one the flow is actually for.
  if (!isReady || arrivedOnboarded !== false) return null

  return <>{children}</>
}
