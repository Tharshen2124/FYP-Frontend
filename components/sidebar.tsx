"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sparkles,
  Target,
  Zap,
  CalendarDays,
  Settings,
  Moon,
  Clock,
  BarChart2,
  LogOut,
  LayoutDashboard,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const NAV_ITEMS = [
  { label: "Dashboard",                      href: "/dashboard",            icon: LayoutDashboard },
  { label: "Roles and Goals",                href: "/roles",                icon: Target },
  { label: "Sharpen the Saw",                href: "/sharpen-the-saw",      icon: Zap },
  { label: "Schedule Upcoming Weekly Plan",  href: "/weekly-plan/goals",    icon: CalendarDays },
  { label: "Settings",                        href: "/settings",             icon: Settings },
  { label: "Evening Reflections",            href: "/evening-reflections",  icon: Moon },
  { label: "History",                        href: "/history",              icon: Clock },
  { label: "Analytics",                      href: "/analytics",            icon: BarChart2 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col w-64 shrink-0 h-screen bg-card border-r border-border">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">HabitFlow</span>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:bg-secondary/20 hover:text-foreground",
              ].join(" ")}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="leading-snug">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-border">
        <Button
          variant="outline"
          className="w-full border-border text-muted-foreground hover:bg-secondary/20 hover:text-foreground justify-start gap-3"
          asChild
        >
          <Link href="/login">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Link>
        </Button>
      </div>
    </aside>
  )
}
