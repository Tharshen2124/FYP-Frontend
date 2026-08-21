"use client"

import { ArrowLeftRight, CalendarRange } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { TargetWeek } from "../_utils/use-target-week"

/**
 * Names the week this flow is writing to, and offers the other one.
 *
 * **The first step only.** Choosing the week is one decision taken at the start of one flow, so
 * repeating the control on the later steps would be noise — and worse than noise on the schedule
 * step, where switching week mid-edit would swap the calendar out from under unsaved changes.
 * Those steps say which week they are on by other means: the calendar prints the week's real
 * dates across the top.
 *
 * Here it earns its place, because "This Week's Goals" is otherwise a lie half the time — on
 * Wednesday of an already-planned week the flow is filling in *next* week.
 */
export function WeekTargetBanner({ week }: { week: TargetWeek }) {
  if (week.isResolving) {
    return <div className="h-[74px] mb-6" aria-hidden />
  }

  // Only claims what has actually been established. A week reached by a hand-written URL, or one
  // shown before the check comes back, gets no explanation rather than a confident wrong one.
  const reason =
    week.currentWeekIsPlanned === null ? null
    : week.isCurrentWeek ? (week.currentWeekIsPlanned
        ? "You're re-planning the week you're in."
        : "You haven't planned this week yet.")
    : week.currentWeekIsPlanned ? "This week is already planned, so this is the week ahead."
    : "You haven't planned this week yet — the toggle comes back to it."

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-card border-2 border-border rounded-xl px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <CalendarRange className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-foreground font-bold leading-tight">
            Planning <span className="text-primary">{week.label}</span>
          </p>
          {reason && (
            <p className="text-sm text-muted-foreground font-serif leading-tight">{reason}</p>
          )}
        </div>
      </div>

      <Button
        variant="outline"
        onClick={week.toggleWeek}
        className="border-border text-foreground hover:bg-secondary/20"
      >
        <ArrowLeftRight className="w-4 h-4 mr-2" />
        {week.isCurrentWeek ? "Plan next week instead" : "Plan this week instead"}
      </Button>
    </div>
  )
}
