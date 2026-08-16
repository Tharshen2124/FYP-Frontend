"use client"

import { useState } from "react"
import { AppNav } from "@/components/app-nav"
import { MOCK_ROLES } from "../_constants/mock-data"
import { RoleGoalsCard } from "./_components/role-goals-card"
import type { WeeklyGoal } from "./_types"

export default function WeeklyPlanGoalsPage() {
  const [selectedGoalIds, setSelectedGoalIds] = useState<Set<string>>(new Set())
  const [priorityGoalIds, setPriorityGoalIds] = useState<Set<string>>(new Set())
  const [weeklyGoals, setWeeklyGoals] = useState<Record<string, WeeklyGoal[]>>({})
  const [goalInputs, setGoalInputs] = useState<Record<string, string>>({})

  const toggleGoal = (goalId: string) => {
    setSelectedGoalIds(prev => {
      const next = new Set(prev)
      if (next.has(goalId)) {
        next.delete(goalId)
        setPriorityGoalIds(p => { const pn = new Set(p); pn.delete(goalId); return pn })
      } else {
        next.add(goalId)
      }
      return next
    })
  }

  const togglePriority = (goalId: string) => {
    setPriorityGoalIds(prev => {
      const next = new Set(prev)
      if (next.has(goalId)) next.delete(goalId)
      else next.add(goalId)
      return next
    })
  }

  const addWeeklyGoal = (roleId: string) => {
    const text = (goalInputs[roleId] || "").trim()
    if (!text) return
    const newGoal: WeeklyGoal = { id: `wg-${Date.now()}`, text }
    setWeeklyGoals(prev => ({ ...prev, [roleId]: [...(prev[roleId] || []), newGoal] }))
    setGoalInputs(prev => ({ ...prev, [roleId]: "" }))
  }

  const removeWeeklyGoal = (roleId: string, goalId: string) => {
    setWeeklyGoals(prev => ({
      ...prev,
      [roleId]: (prev[roleId] || []).filter(g => g.id !== goalId),
    }))
  }

  const totalWeeklyGoals = Object.values(weeklyGoals).reduce((sum, gs) => sum + gs.length, 0)
  const canProceed = selectedGoalIds.size + totalWeeklyGoals > 0

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <AppNav action="next" nextHref="/weekly-plan/sharpen-the-saw" nextEnabled={canProceed} />

      <main className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              This Week&apos;s <span className="text-primary">Goals</span>
            </h1>
            <p className="text-muted-foreground font-serif text-lg">
              Select which goals to carry into this week, or add new ones that are just for now.
            </p>
          </div>

          <div className="grid gap-6">
            {MOCK_ROLES.map(role => (
              <RoleGoalsCard
                key={role.id}
                role={role}
                weeklyGoals={weeklyGoals[role.id] || []}
                goalInput={goalInputs[role.id] || ""}
                selectedGoalIds={selectedGoalIds}
                priorityGoalIds={priorityGoalIds}
                onGoalInputChange={value => setGoalInputs(prev => ({ ...prev, [role.id]: value }))}
                onAddWeeklyGoal={() => addWeeklyGoal(role.id)}
                onRemoveWeeklyGoal={goalId => removeWeeklyGoal(role.id, goalId)}
                onToggleGoal={toggleGoal}
                onTogglePriority={togglePriority}
              />
            ))}
          </div>

          {!canProceed && (
            <p className="text-center text-muted-foreground font-serif mt-8">
              Select at least one goal or add a new one to continue.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
