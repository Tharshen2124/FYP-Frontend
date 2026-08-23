"use client"

import { useMemo } from "react"
import { ArrowRight, Check, Minus, Star, Target, X } from "lucide-react"
import { WEEKLY_PRIORITY_COLOR } from "@/lib/role-colors"
import { groupBy } from "../_utils/group"
import { ordinal, outcomeLegend } from "../_utils/history"
import type { GoalOutcome, HistoryGoal } from "../_types"

interface Props {
  goals: HistoryGoal[]
}

/**
 * How the goal resolved, in one glyph.
 *
 * The `dropped` outcome is shown as "Removed", which is what actually happened to it: the user
 * deleted the goal. "Dropped" is the model's word (`Goal#dropped?`, `scope :dropped`) and reads to
 * a user as giving up rather than as an edit, so the wording stops at the type boundary.
 *
 * It is deliberately neither a tick nor a cross. A goal the user removed is not a failure — and
 * counting it as one would also mean pruning could move the percentage on the tile above, which is
 * why the stats row leaves it out of both halves of the ratio.
 *
 * `carried` is the other thing a cross used to overstate: the goal was unfinished when the week
 * closed, but it went on into the next week rather than stopping. An arrow, because that is what
 * happened to it.
 */
const OUTCOME = {
  achieved: { icon: Check, label: "Achieved", className: "text-primary" },
  carried: { icon: ArrowRight, label: "Carried on", className: "text-muted-foreground/60" },
  missed: { icon: X, label: "Missed", className: "text-muted-foreground/60" },
  dropped: { icon: Minus, label: "Removed", className: "text-muted-foreground/60" },
  open: { icon: Minus, label: "Still open", className: "text-muted-foreground/60" },
} as const satisfies Record<GoalOutcome, { icon: React.ElementType; label: string; className: string }>

/** Removed goals sink to the bottom of their role, so the week reads as what it met and missed
 *  first, and what left it afterwards. */
function byOutcome(a: HistoryGoal, b: HistoryGoal) {
  return Number(a.outcome === "dropped") - Number(b.outcome === "dropped")
}

export function GoalsCard({ goals }: Props) {
  const byRole = useMemo(() => groupBy(goals, g => String(g.roleId)), [goals])
  const roleIds = Object.keys(byRole)
  const legend = useMemo(() => outcomeLegend(goals), [goals])

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
                        {/* Named, not just starred, and in the one colour the schedule reserves
                            for it — so the yellow cards on the week below and this label are
                            legible as the same claim rather than two unrelated marks. The star
                            was tinted with the role's colour, which said the opposite. */}
                        {goal.isWeeklyPriority && (
                          <span
                            className="text-[10px] uppercase tracking-wide font-semibold mt-0.5 shrink-0 px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                            style={{ backgroundColor: `${WEEKLY_PRIORITY_COLOR}22`, color: WEEKLY_PRIORITY_COLOR }}
                          >
                            <Star className="w-2.5 h-2.5 shrink-0 fill-current" />
                            Weekly priority
                          </span>
                        )}
                        {/* How long this one has been running. A goal on its fifth week is the
                            page's most useful signal and nothing else on it says so. */}
                        {goal.weekIndex > 1 && (
                          <span
                            className="text-[10px] mt-0.5 shrink-0 px-1.5 py-0.5 rounded bg-muted text-muted-foreground/80 tabular-nums"
                            title={`Carried forward — this is week ${goal.weekIndex} of this goal`}
                          >
                            {ordinal(goal.weekIndex)} week
                          </span>
                        )}
                        {goal.outcome === "dropped" && (
                          <span className="text-[10px] text-muted-foreground/70 mt-0.5 shrink-0">removed</span>
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

      {/* The glyphs above carry the whole outcome vocabulary and nothing on the card said what they
          meant. Only the outcomes this week actually used: explaining "Removed" on a week where
          nothing was removed invites exactly the question the legend exists to answer. */}
      {legend.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-3 border-t border-border">
          {legend.map(outcome => {
            const { icon: Icon, label, className } = OUTCOME[outcome]
            return (
              <div key={outcome} className="flex items-center gap-1.5 text-xs text-muted-foreground font-serif">
                <Icon className={`w-3 h-3 shrink-0 ${className}`} />
                {label}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
