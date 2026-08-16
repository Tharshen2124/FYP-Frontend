"use client"

import { useRequireAuth } from "@/hooks/use-require-auth"

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isReady } = useRequireAuth()
  if (!isReady) return null
  return <>{children}</>
}
