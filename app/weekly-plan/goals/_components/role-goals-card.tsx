"use client"

import Link from "next/link"
import { Plus, X, Check, ArrowUpRight, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { WEEKLY_PRIORITY_COLOR } from "@/lib/role-colors"
import type { Candidate, StagedGoal, WeekRole } from "../_types"

interface Props {
  role: WeekRole
  candidates: Candidate[]
  stagedGoals: StagedGoal[]
  goalInput: string
  selectedIds: Set<string>
  onGoalInputChange: (value: string) => void
  onAddStagedGoal: () => void
  onRemoveStagedGoal: (goalId: string) => void
  onToggleCandidate: (goalId: string) => void
  onToggleStagedPriority: (goalId: string) => void
}

export function RoleGoalsCard({
  role,
  candidates,
  stagedGoals,
  goalInput,
  selectedIds,
  onGoalInputChange,
  onAddStagedGoal,
  onRemoveStagedGoal,
  onToggleCandidate,
  onToggleStagedPriority,
}: Props) {
  return (
    <div className="p-6 rounded-2xl bg-card border-2 border-border">
      {/* Role header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${role.color}20` }}>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
          </div>
          <h2 className="text-xl font-bold text-foreground">{role.name}</h2>
        </div>
        <Link href="/roles" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
          Manage goals
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Already committed to this week — edited on /roles, shown here for context. Drawn in the
          role's own colour rather than one flat magenta, so a card reads as one thing: the header
          above it and the rows under it belong to the same role, and that is what the colour of a
          task on the calendar will say too. */}
      {role.goals.length > 0 && (
        <div className="space-y-2 mb-4">
          {role.goals.map(goal => (
            <div
              key={goal.id}
              className="flex items-center gap-3 p-3 rounded-xl border-2"
              style={{ backgroundColor: `${role.color}1a`, borderColor: role.color }}
            >
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: role.color, borderColor: role.color }}
              >
                <Check className="w-3 h-3 text-background" />
              </div>
              <span className="font-serif text-foreground text-sm flex-1">{goal.text}</span>
              <span
                className="text-xs font-medium rounded-full px-2 py-0.5 whitespace-nowrap"
                style={{ backgroundColor: `${role.color}33`, color: role.color }}
              >
                Added
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Unfinished goals from the last week the user actually planned, which after a gap may be
          several weeks back. Picking one creates a fresh goal linked back to it. */}
      {candidates.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Carry forward</p>
          <div className="space-y-2">
            {candidates.map(candidate => {
              const isSelected = selectedIds.has(candidate.id)
              return (
                <button
                  key={candidate.id}
                  onClick={() => onToggleCandidate(candidate.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    isSelected ? "" : "bg-muted border-border"
                  }`}
                  style={isSelected ? { backgroundColor: `${role.color}1a`, borderColor: role.color } : undefined}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected ? "" : "border-muted-foreground"
                    }`}
                    style={isSelected ? { backgroundColor: role.color, borderColor: role.color } : undefined}
                  >
                    {isSelected && <Check className="w-3 h-3 text-background" />}
                  </div>
                  <span className="font-serif text-foreground text-sm">{candidate.text}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Typed in but not yet sent — the page commits everything on Next.
          The role's colour like the rows above, but dashed: the difference between a staged goal
          and a committed one is whether it has been sent, not which role it belongs to. It used to
          be drawn in `accent`, which is the reserved weekly-priority yellow — so an ordinary new
          goal was painted the one colour that is supposed to mean "priority", beside a star that
          actually meant it. */}
      {stagedGoals.length > 0 && (
        <div className="space-y-2 mb-4">
          {stagedGoals.map(goal => (
            <div
              key={goal.id}
              className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed transition-colors"
              style={{ backgroundColor: `${role.color}0d`, borderColor: `${role.color}80` }}
            >
              <div
                className="w-5 h-5 rounded-full border-2 border-dashed flex items-center justify-center flex-shrink-0"
                style={{ borderColor: role.color }}
              >
                <Check className="w-3 h-3" style={{ color: role.color }} />
              </div>
              <span className="font-serif text-foreground text-sm flex-1">{goal.text}</span>
              <span
                className="text-xs font-medium rounded-full px-2 py-0.5 whitespace-nowrap"
                style={{ backgroundColor: `${role.color}26`, color: role.color }}
              >
                New
              </span>
              {/* The star keeps the reserved yellow whatever colour the row is, exactly as it does
                  on every calendar: a weekly priority is one claim with one colour. */}
              <button
                onClick={() => onToggleStagedPriority(goal.id)}
                aria-label={goal.isPriority ? `Remove priority from ${goal.text}` : `Mark ${goal.text} as weekly priority`}
                className="flex-shrink-0 p-1 rounded-lg transition-colors text-muted-foreground hover:opacity-80"
                style={goal.isPriority ? { color: WEEKLY_PRIORITY_COLOR } : undefined}
              >
                <Star className={`w-4 h-4 ${goal.isPriority ? "fill-current" : ""}`} />
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveStagedGoal(goal.id)}
                aria-label={`Remove ${goal.text}`}
                className="text-muted-foreground hover:text-destructive p-1 h-auto"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Add a new goal for this week..."
          value={goalInput}
          onChange={e => onGoalInputChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") onAddStagedGoal() }}
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm"
        />
        <Button onClick={onAddStagedGoal} aria-label={`Add goal to ${role.name}`} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
