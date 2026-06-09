"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, X, Check, ArrowUpRight } from "lucide-react"
import { AppNav } from "@/components/app-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MOCK_ROLES } from "@/app/weekly-plan/schedule/_constants/mock-data"

interface WeeklyGoal {
  id: string
  text: string
}

export default function WeeklyPlanGoalsPage() {
  const [selectedGoalIds, setSelectedGoalIds] = useState<Set<string>>(new Set())
  const [weeklyGoals, setWeeklyGoals] = useState<Record<string, WeeklyGoal[]>>({})
  const [goalInputs, setGoalInputs] = useState<Record<string, string>>({})

  const toggleGoal = (goalId: string) => {
    setSelectedGoalIds(prev => {
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
            {MOCK_ROLES.map(role => {
              const roleWeeklyGoals = weeklyGoals[role.id] || []
              return (
                <div
                  key={role.id}
                  className="p-6 rounded-2xl bg-card border-2 border-border"
                >
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
                      return (
                        <button
                          key={goal.id}
                          onClick={() => toggleGoal(goal.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                            isSelected
                              ? "bg-primary/10 border-primary"
                              : "bg-muted border-border hover:border-primary/30"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                          <span className="font-serif text-foreground text-sm">{goal.text}</span>
                        </button>
                      )
                    })}

                    {/* Weekly-only goals */}
                    {roleWeeklyGoals.map(wg => (
                      <div
                        key={wg.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-accent/10 border-2 border-accent/30"
                      >
                        <div className="w-5 h-5 rounded-full bg-accent border-accent border-2 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-background" />
                        </div>
                        <span className="font-serif text-foreground text-sm flex-1">{wg.text}</span>
                        <span className="text-xs font-medium bg-accent/20 text-accent rounded-full px-2 py-0.5 whitespace-nowrap">
                          This week
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWeeklyGoal(role.id, wg.id)}
                          className="text-muted-foreground hover:text-destructive p-1 h-auto"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Add weekly goal */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a one-off goal just for this week..."
                      value={goalInputs[role.id] || ""}
                      onChange={e => setGoalInputs(prev => ({ ...prev, [role.id]: e.target.value }))}
                      onKeyDown={e => {
                        if (e.key === "Enter") addWeeklyGoal(role.id)
                      }}
                      className="bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm"
                    />
                    <Button
                      onClick={() => addWeeklyGoal(role.id)}
                      className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
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
