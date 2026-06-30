"use client"

import { useMemo } from "react"
import { Target } from "lucide-react"
import { type HistoryGoal } from "../_constants/mock-data"
import { groupBy } from "../_utils"

export function GoalsCard({ goals }: { goals: HistoryGoal[] }) {
  const byRole = useMemo(() => groupBy(goals, g => g.roleName), [goals])
  const roles = Object.keys(byRole)

  return (
    <div className="p-5 rounded-2xl bg-card border-2 border-border h-full">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-primary shrink-0" />
        <h3 className="font-bold text-foreground">Role Goals</h3>
        <span className="ml-auto text-xs text-muted-foreground font-serif">{goals.length} goal{goals.length !== 1 ? "s" : ""}</span>
      </div>
      {roles.length === 0 ? (
        <p className="text-sm text-muted-foreground font-serif italic">No goals recorded.</p>
      ) : (
        <div className="space-y-4">
          {roles.map(roleName => {
            const roleGoals = byRole[roleName]
            const color = roleGoals[0].roleColor
            return (
              <div key={roleName}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-sm font-semibold text-foreground">{roleName}</span>
                </div>
                <ul className="space-y-1.5 ml-[18px]">
                  {roleGoals.map((g, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      {g.goalText}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
