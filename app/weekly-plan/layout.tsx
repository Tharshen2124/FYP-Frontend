"use client"

import { Suspense } from "react"
import { useRequireAuth } from "@/hooks/use-require-auth"

/**
 * Every step of this flow reads and writes a real weekly plan, so the whole flow is gated the same
 * way onboarding is.
 *
 * The Suspense boundary is for `useTargetWeek`: the week being planned lives in the URL, and
 * `useSearchParams()` suspends during prerender unless something above it is prepared to wait.
 */
export default function WeeklyPlanLayout({ children }: { children: React.ReactNode }) {
  const { isReady } = useRequireAuth()
  if (!isReady) return null

  return <Suspense fallback={null}>{children}</Suspense>
}
