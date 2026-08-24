"use client"

import { CalendarRange } from "lucide-react"
import type { TargetWeek } from "../_utils/use-target-week"

/**
 * Names the week this flow is writing to, and says why it is that one.
 *
 * **The first step only.** Which week is being planned is settled before the user arrives, so
 * repeating this on the later steps would be noise — and worse than noise on the schedule step,
 * where it would compete with the calendar's own date headers.
 *
 * It earns its place here because "Goals for the Week" is otherwise a lie half the time: on
 * Wednesday of an already-planned week the flow is filling in *next* week, and nothing else on the
 * page says so.
 *
 * There is no control to change the week. The rule decides it — current week if unplanned,
 * otherwise the one ahead — and re-planning a week already planned belongs to the surfaces built
 * for it: `/weekly-plan/edit` for appointments and tasks, `/roles` for a goal, `/sharpen-the-saw`
 * for an activity. This banner reports the decision; it does not ask.
 */
export function WeekTargetBanner({ week }: { week: TargetWeek }) {
  if (week.isResolving) {
    return <div className="h-[74px] mb-6" aria-hidden />
  }

  // Only claims what has actually been established. A week reached by a hand-written URL, or one
  // shown before the check comes back, gets the week's dates and no explanation, rather than a
  // confident wrong one. The two branches below are the only two the rule can produce.
  const reason =
    week.currentWeekIsPlanned === null ? null
    : week.currentWeekIsPlanned ? "This week is already planned, so this is the week ahead."
    : "You haven't planned this week yet."

  return (
    <div className="mb-6 flex items-center gap-3 bg-card border-2 border-border rounded-xl px-5 py-4">
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
  )
}
