"use client"

import { Suspense } from "react"
import { useRequireAuth } from "@/hooks/use-require-auth"

/**
 * Past weeks are real, private, per-user rows now, so the route is gated the way the rest of the
 * dashboard area is. The Suspense boundary is for the `?week_start=` param: `useSearchParams()`
 * suspends during prerender unless something above it is prepared to wait.
 */
export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  const { isReady } = useRequireAuth()
  if (!isReady) return null

  return <Suspense fallback={null}>{children}</Suspense>
}
