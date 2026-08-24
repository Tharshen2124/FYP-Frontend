"use client"

import Link from "next/link"
import { ArrowUpRight, CalendarCheck, CalendarRange, Sparkles, Target } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Shown in place of the wizard when this week and the next are both planned.
 *
 * The flow plans one week at a time and stops one week ahead, so at this point there is genuinely
 * nothing for it to write. Rather than open an empty wizard over a week that needs no planning —
 * which would invite staging goals into a week the user has already finished thinking about — it
 * says so and points at the three surfaces that *do* change a planned week.
 *
 * Deliberately a page and not a toast on the dashboard: reaching this by clicking "Weekly Plan" in
 * the sidebar is an ordinary thing to do, and being bounced somewhere else with a message that
 * fades reads as the app malfunctioning rather than answering.
 */
const ROUTES = [
  {
    href: "/weekly-plan/edit",
    icon: CalendarCheck,
    title: "Edit Weekly Plan",
    detail: "Move this week's appointments and tasks, including onto days that have passed.",
  },
  {
    href: "/roles",
    icon: Target,
    title: "Roles & Goals",
    detail: "Add a goal to this week, or retire one you are no longer chasing.",
  },
  {
    href: "/sharpen-the-saw",
    icon: Sparkles,
    title: "Sharpen the Saw",
    detail: "Add or remove one of this week's renewal activities.",
  },
]

export function AlreadyPlannedNotice({ thisWeek, nextWeek }: { thisWeek: string; nextWeek: string }) {
  return (
    <div className="max-w-2xl">
      <div className="p-6 rounded-2xl bg-card border-2 border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <CalendarRange className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-foreground font-bold leading-tight">You&apos;re planned through next week</p>
            <p className="text-sm text-muted-foreground font-serif leading-tight">
              {thisWeek} and {nextWeek} both have plans.
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground font-serif mb-5">
          This flow plans one week ahead at a time. Come back once next week starts and it will
          offer you the week after — planning further out means planning a week you don&apos;t know
          the shape of yet.
        </p>

        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
          To change a week you&apos;ve already planned
        </p>
        <div className="space-y-2 mb-5">
          {ROUTES.map(({ href, icon: Icon, title, detail }) => (
            <Link
              key={href}
              href={href}
              className="flex items-start gap-3 p-3 rounded-xl bg-muted border-2 border-border hover:border-primary transition-colors group"
            >
              <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span className="flex-1">
                <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                  {title}
                  <ArrowUpRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                </span>
                <span className="block text-xs text-muted-foreground font-serif leading-snug">{detail}</span>
              </span>
            </Link>
          ))}
        </div>

        <Button asChild className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
