"use client"

import { AlertTriangle } from "lucide-react"
import { MAX_RECOMMENDED_GOALS } from "../_constants/roles"

interface Props {
  totalGoals: number
}

/** The standing warning above the list, distinct from `GoalLimitDialog`: that one interrupts the
 *  goal that crosses the line, this one keeps saying so for as long as the week is over it. */
export function GoalLimitBanner({ totalGoals }: Props) {
  if (totalGoals <= MAX_RECOMMENDED_GOALS) return null

  return (
    <div className="mb-6 p-4 rounded-2xl bg-accent/10 border-2 border-accent/30 flex items-start gap-3">
      <AlertTriangle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-bold text-foreground">You have {totalGoals} goals this week</p>
        <p className="text-sm text-muted-foreground font-serif">
          Consider focusing on fewer goals to increase your chances of success.
          Research shows that limiting yourself to 7-10 weekly goals leads to better outcomes.
        </p>
      </div>
    </div>
  )
}
