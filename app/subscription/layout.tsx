"use client"

import { Suspense } from "react"
import { useRequireAuth } from "@/hooks/use-require-auth"

/**
 * Gated like the rest of the dashboard area. The Suspense boundary is for the `?checkout=` and
 * `?session_id=` params Stripe sends the browser back with: `useSearchParams()` suspends during
 * prerender unless something above it is prepared to wait.
 */
export default function SubscriptionLayout({ children }: { children: React.ReactNode }) {
  const { isReady } = useRequireAuth()
  if (!isReady) return null

  return <Suspense fallback={null}>{children}</Suspense>
}
