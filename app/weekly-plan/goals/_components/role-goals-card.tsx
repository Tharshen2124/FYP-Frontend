"use client"

import Link from "next/link"
import { Plus, X, Check, ArrowUpRight, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { MockRole } from "../../_types"
import type { WeeklyGoal } from "../_types"

interface Props {
  role: MockRole
  weeklyGoals: WeeklyGoal[]
  goalInput: string
  selectedGoalIds: Set<string>
  priorityGoalIds: Set<string>
  onGoalInputChange: (value: string) => void
  onAddWeeklyGoal: () => void
  onRemoveWeeklyGoal: (goalId: string) => void
  onToggleGoal: (goalId: string) => void
  onTogglePriority: (goalId: string) => void
}

export function RoleGoalsCard({
  role,
  weeklyGoals,
  goalInput,
  selectedGoalIds,
  priorityGoalIds,
  onGoalInputChange,
  onAddWeeklyGoal,
  onRemoveWeeklyGoal,
  onToggleGoal,
  onTogglePriority,
}: Props) {
  return (
    <div className="p-6 rounded-2xl bg-card border-2 border-border">
      {/* Role header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${role.color}20` }}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
          </div>
          <h2 className="text-xl font-bold text-foreground">{role.name}</h2>
        </div>
        <Link
          href="/roles"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          Manage goals
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Standing goals — checkboxes */}
      <div className="space-y-2 mb-4">
        {role.goals.map(goal => {
          const isSelected = selectedGoalIds.has(goal.id)
          const isPriority = priorityGoalIds.has(goal.id)
          return (
            <div
              key={goal.id}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                isPriority
                  ? "bg-accent/10 border-accent"
                  : isSelected
                  ? "bg-primary/10 border-primary"
                  : "bg-muted border-border"
              }`}
            >
              <button
                onClick={() => onToggleGoal(goal.id)}
                className="flex items-center gap-3 flex-1 text-left"
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <span className="font-serif text-foreground text-sm">{goal.text}</span>
                {isPriority && (
                  <span className="text-xs font-medium bg-accent/20 text-accent rounded-full px-2 py-0.5 whitespace-nowrap">Priority</span>
                )}
              </button>
              {isSelected && (
                <button
                  onClick={() => onTogglePriority(goal.id)}
                  className={`flex-shrink-0 p-1 rounded-lg transition-colors ${isPriority ? "text-accent" : "text-muted-foreground hover:text-accent"}`}
                  title={isPriority ? "Remove priority" : "Mark as weekly priority"}
                >
                  <Star className={`w-4 h-4 ${isPriority ? "fill-accent" : ""}`} />
                </button>
              )}
            </div>
          )
        })}

        {/* Weekly-only goals */}
        {weeklyGoals.map(wg => {
          const isPriority = priorityGoalIds.has(wg.id)
          return (
            <div
              key={wg.id}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${isPriority ? "bg-accent/10 border-accent" : "bg-accent/5 border-accent/30"}`}
            >
              <div className="w-5 h-5 rounded-full bg-accent border-accent border-2 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-background" />
              </div>
              <span className="font-serif text-foreground text-sm flex-1">{wg.text}</span>
              <span className="text-xs font-medium bg-accent/20 text-accent rounded-full px-2 py-0.5 whitespace-nowrap">
                This week
              </span>
              <button
                onClick={() => onTogglePriority(wg.id)}
                className={`flex-shrink-0 p-1 rounded-lg transition-colors ${isPriority ? "text-accent" : "text-muted-foreground hover:text-accent"}`}
                title={isPriority ? "Remove priority" : "Mark as weekly priority"}
              >
                <Star className={`w-4 h-4 ${isPriority ? "fill-accent" : ""}`} />
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveWeeklyGoal(wg.id)}
                className="text-muted-foreground hover:text-destructive p-1 h-auto"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )
        })}
      </div>

      {/* Add weekly goal */}
      <div className="flex gap-2">
        <Input
          placeholder="Add a one-off goal just for this week..."
          value={goalInput}
          onChange={e => onGoalInputChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") onAddWeeklyGoal()
          }}
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm"
        />
        <Button
          onClick={onAddWeeklyGoal}
          className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
