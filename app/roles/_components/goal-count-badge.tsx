"use client"

import { AlertTriangle, Target } from "lucide-react"
import { MAX_RECOMMENDED_GOALS } from "../_constants/roles"

interface Props {
  totalGoals: number
  className?: string
}

export function GoalCountBadge({ totalGoals, className = "" }: Props) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border ${className}`}>
      <Target className="w-4 h-4 text-primary" />
      <span className="text-sm font-medium text-foreground">
        {totalGoals} {totalGoals === 1 ? "Goal" : "Goals"}
      </span>
      {totalGoals > MAX_RECOMMENDED_GOALS && <AlertTriangle className="w-4 h-4 text-accent" />}
    </div>
  )
}
