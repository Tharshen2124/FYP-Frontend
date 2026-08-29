"use client"

import { useRouter } from "next/navigation"
import { LogOut, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/auth-store"

/**
 * The admin page's own chrome, in place of the app `<Sidebar>`.
 *
 * An admin account does not run a week — it has no roles, goals or weekly plan — so the sidebar's
 * nine links all lead somewhere it has no business being, and `middleware.ts` turns each of them
 * back. A nav of links that all redirect is worse than no nav, so this is a header with the two
 * things that are actually true here: which surface you are on, and the way out.
 */
export function AdminHeader() {
  const router = useRouter()

  const handleSignOut = () => {
    useAuthStore.getState().logout()
    router.push("/login")
  }

  return (
    <header className="relative z-10 border-b border-border bg-card">
      <div className="flex items-center justify-between gap-4 px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary-foreground" aria-hidden />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground leading-tight">HabitFlow</p>
            <p className="text-xs text-muted-foreground leading-tight">Administration</p>
          </div>
        </div>

        <Button
          variant="outline"
          className="border-border text-muted-foreground hover:bg-secondary/20 hover:text-foreground gap-2"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </header>
  )
}
