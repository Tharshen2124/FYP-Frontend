"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { cookieStorage } from "@/lib/cookie-storage"

interface JwtPayload {
  user_id: string
  email: string
  username: string
  is_onboarded: boolean
}

function decodeJwtPayload(token: string): JwtPayload {
  const payload = token.split(".")[1]
  return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))
}

interface AuthState {
  token: string | null
  userId: string | null
  email: string | null
  username: string | null
  isOnboarded: boolean
  hasHydrated: boolean
  setAuthFromToken: (token: string) => void
  markOnboarded: () => void
  logout: () => void
  setHasHydrated: (value: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      email: null,
      username: null,
      isOnboarded: false,
      hasHydrated: false,
      setAuthFromToken: (token) => {
        const payload = decodeJwtPayload(token)
        set({
          token,
          userId: payload.user_id,
          email: payload.email,
          username: payload.username,
          isOnboarded: payload.is_onboarded,
        })
      },
      markOnboarded: () => set({ isOnboarded: true }),
      logout: () =>
        set({
          token: null,
          userId: null,
          email: null,
          username: null,
          isOnboarded: false,
        }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "habitflow-auth",
      storage: createJSONStorage(() => cookieStorage),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
)
