"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"

export function useRequireAuth() {
  const router = useRouter()
  const token = useAuthStore((state) => state.token)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)

  useEffect(() => {
    if (hasHydrated && !token) router.push("/login")
  }, [hasHydrated, token, router])

  return { isReady: hasHydrated && Boolean(token) }
}
