"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { cookieStorage } from "@/lib/cookie-storage"

interface JwtPayload {
  user_id: string
  email: string
  username: string
  is_onboarded: boolean
  /**
   * Which page this session belongs on — and nothing else. `/login` sends an admin to
   * `/admin/dashboard`, and `proxy.ts` reads the same claim off the cookie to keep them there.
   *
   * The backend keeps `premium?` out of the token deliberately, because the client reads that one
   * to decide whether a control is *unlocked*, and a seven-day cookie claim cannot be revoked when
   * a plan lapses in minutes. This claim is safe there because it routes rather than authorises:
   * every `/admin/*` endpoint re-checks `users.is_admin` on the row the token resolved to, so a
   * stale or forged claim buys a page that answers 403 — and clearing it buys the app pages, which
   * an admin account has nothing in.
   */
  is_admin: boolean
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
  isAdmin: boolean
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
      isAdmin: false,
      hasHydrated: false,
      setAuthFromToken: (token) => {
        const payload = decodeJwtPayload(token)
        set({
          token,
          userId: payload.user_id,
          email: payload.email,
          username: payload.username,
          isOnboarded: payload.is_onboarded,
          // `?? false` rather than a bare read: a token minted before this claim existed is still
          // valid for seven days, and `undefined` in the store would render as "not an admin"
          // anyway — this just makes that the stated behaviour rather than a coincidence.
          isAdmin: payload.is_admin ?? false,
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
          isAdmin: false,
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
