"use client"

import { useMemo } from "react"
import { Check, Minus, Star, Target, X } from "lucide-react"
import { groupBy } from "../_utils/group"
import type { GoalOutcome, HistoryGoal } from "../_types"

interface Props {
  goals: HistoryGoal[]
}

/**
 * How the goal resolved, in one glyph.
 *
 * Dropped is deliberately neither a tick nor a cross. A goal the user pruned mid-week is not a
 * failure — and counting it as one would also mean pruning could quietly raise the percentage on
 * the tile above, which is why the stats row leaves it out of both halves of the ratio.
 */
const OUTCOME = {
  achieved: { icon: Check, label: "Achieved", className: "text-primary" },
  missed: { icon: X, label: "Missed", className: "text-muted-foreground/60" },
  dropped: { icon: Minus, label: "Dropped", className: "text-muted-foreground/60" },
  open: { icon: Minus, label: "Still open", className: "text-muted-foreground/60" },
} as const satisfies Record<GoalOutcome, { icon: React.ElementType; label: string; className: string }>

/** Dropped goals sink to the bottom of their role, so the week reads as what it met and missed
 *  first, and what left it afterwards. */
function byOutcome(a: HistoryGoal, b: HistoryGoal) {
  return Number(a.outcome === "dropped") - Number(b.outcome === "dropped")
}

export function GoalsCard({ goals }: Props) {
  const byRole = useMemo(() => groupBy(goals, g => String(g.roleId)), [goals])
  const roleIds = Object.keys(byRole)

  return (
    <div className="p-5 rounded-2xl bg-card border-2 border-border h-full">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-primary shrink-0" />
        <h3 className="font-bold text-foreground">Role Goals</h3>
        <span className="ml-auto text-xs text-muted-foreground font-serif">
          {goals.length} goal{goals.length !== 1 ? "s" : ""}
        </span>
      </div>
      {roleIds.length === 0 ? (
        <p className="text-sm text-muted-foreground font-serif italic">No goals recorded.</p>
      ) : (
        <div className="space-y-4">
          {roleIds.map(roleId => {
            const roleGoals = [...byRole[roleId]].sort(byOutcome)
            const { roleName, roleColor, roleArchived } = roleGoals[0]
            return (
              <div key={roleId}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: roleColor }} />
                  <span className="text-sm font-semibold text-foreground">{roleName}</span>
                  {/* The role is gone from planning, but this week still happened under it. */}
                  {roleArchived && (
                    <span className="text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                      Archived
                    </span>
                  )}
                </div>
                <ul className="space-y-1.5 ml-[18px]">
                  {roleGoals.map(goal => {
                    const outcome = OUTCOME[goal.outcome]
                    const Icon = outcome.icon
                    return (
                      <li key={goal.goalId} className="flex items-start gap-2 text-sm font-serif">
                        <Icon
                          className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${outcome.className}`}
                          aria-label={outcome.label}
                        />
                        <span
                          className={
                            goal.outcome === "achieved"
                              ? "text-foreground"
                              : goal.outcome === "dropped"
                                ? "text-muted-foreground line-through"
                                : "text-muted-foreground"
                          }
                        >
                          {goal.text}
                        </span>
                        {goal.isWeeklyPriority && (
                          <Star
                            className="w-3 h-3 mt-0.5 shrink-0 fill-current"
                            style={{ color: roleColor }}
                            aria-label="Weekly priority"
                          />
                        )}
                        {goal.outcome === "dropped" && (
                          <span className="text-[10px] text-muted-foreground/70 mt-0.5 shrink-0">dropped</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
