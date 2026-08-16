import type { StateStorage } from "zustand/middleware"

const MAX_AGE_SECONDS = 7 * 24 * 60 * 60 // 7 days — matches the backend JWT's default TTL

export const cookieStorage: StateStorage = {
  getItem: (name) => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
    return match ? decodeURIComponent(match[1]) : null
  },
  setItem: (name, value) => {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`
  },
  removeItem: (name) => {
    document.cookie = `${name}=; path=/; max-age=0`
  },
}
