"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AppNav } from "@/components/app-nav"
import { api } from "@/lib/api"
import { countCommitted, countStaged, groupCandidatesByRole, toWeekRole } from "./_utils/goals"
import { AlreadyPlannedNotice } from "./_components/already-planned-notice"
import { RoleGoalsCard } from "./_components/role-goals-card"
import { WeekTargetBanner } from "../_components/week-target-banner"
import { useTargetWeek } from "../_utils/use-target-week"
import type { Candidate, StagedGoal, WeekRole } from "./_types"

export default function WeeklyPlanGoalsPage() {
  const router = useRouter()
  const week = useTargetWeek()
  const [roles, setRoles] = useState<WeekRole[]>([])
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [staged, setStaged] = useState<Record<string, StagedGoal[]>>({})
  const [goalInputs, setGoalInputs] = useState<Record<string, string>>({})

  // Staged goals only need an id stable enough for React's list keys, and a counter keeps that
  // out of render — Date.now() would be an impure call.
  const nextStagedId = useRef(0)

  // Reruns when the week changes: toggling to the other week has to re-ask, because the committed
  // goals belong to that week and the carry-forward candidates are read relative to it. Anything
  // staged for the old week is dropped with it — it was never for this one.
  const loadWeek = useCallback(async (weekStart: string) => {
    setIsLoading(true)
    setSelectedIds(new Set())
    setStaged({})

    try {
      const [{ roles }, { candidates }] = await Promise.all([
        api.fetchStandingRoles(weekStart),
        api.fetchCarryForwardCandidates(weekStart),
      ])
      setRoles(roles.map(toWeekRole))
      setCandidates(groupCandidatesByRole(candidates))
    } catch {
      toast.error("Couldn't load your roles — please refresh.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (week.weekStart) loadWeek(week.weekStart)
  }, [week.weekStart, loadWeek])

  // Planned through next week: the flow has nothing to write, so it explains instead of opening an
  // empty wizard over a week that needs no planning. Checked before the loading state, because
  // there is no week to load and `isResolving` has already settled to false. Held as the labels
  // themselves rather than a boolean, so the notice below narrows without an assertion.
  const plannedLabels = week.isFullyPlanned ? week.plannedLabels : null

  const toggleCandidate = (goalId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(goalId)) next.delete(goalId)
      else next.add(goalId)
      return next
    })
  }

  const addStagedGoal = (roleId: string) => {
    const text = (goalInputs[roleId] || "").trim()
    if (!text) return
    nextStagedId.current += 1
    const goal: StagedGoal = { id: `staged-${nextStagedId.current}`, text, isPriority: false }
    setStaged(prev => ({ ...prev, [roleId]: [...(prev[roleId] ?? []), goal] }))
    setGoalInputs(prev => ({ ...prev, [roleId]: "" }))
  }

  const removeStagedGoal = (roleId: string, goalId: string) => {
    setStaged(prev => ({ ...prev, [roleId]: (prev[roleId] ?? []).filter(g => g.id !== goalId) }))
  }

  const toggleStagedPriority = (roleId: string, goalId: string) => {
    setStaged(prev => ({
      ...prev,
      [roleId]: (prev[roleId] ?? []).map(g => (g.id === goalId ? { ...g, isPriority: !g.isPriority } : g)),
    }))
  }

  /**
   * Carrying forward is one bulk call so the server can write each goal and its link to the goal
   * it continues in a single transaction; brand-new goals are plain creates.
   */
  const handleNext = async () => {
    setIsSaving(true)
    try {
      if (selectedIds.size > 0) {
        await api.carryForwardGoals([...selectedIds].map(Number), week.weekStart)
      }
      for (const [roleId, goals] of Object.entries(staged)) {
        for (const goal of goals) {
          await api.createGoal({
            role_id: Number(roleId),
            description: goal.text,
            is_weekly_priority: goal.isPriority,
          }, week.weekStart)
        }
      }
      router.push(`/weekly-plan/sharpen-the-saw?week_start=${week.weekStart}`)
    } catch {
      toast.error("Couldn't save this week's goals — please try again.")
      setIsSaving(false)
    }
  }

  const plannedCount = selectedIds.size + countStaged(staged) + countCommitted(roles)

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <AppNav
        action="next"
        nextEnabled={plannedLabels === null && plannedCount > 0 && !isSaving && !isLoading}
        onNext={handleNext}
      />

      <main className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Goals for the <span className="text-primary">Week</span>
            </h1>
            <p className="text-muted-foreground font-serif text-lg">
              {plannedLabels
                ? "Nothing to plan right now — here's where to change what's already there."
                : "Carry forward what you didn't finish last time, or set new goals for this week."}
            </p>
          </div>

          {plannedLabels ? (
            <AlreadyPlannedNotice
              thisWeek={plannedLabels.thisWeek}
              nextWeek={plannedLabels.nextWeek}
            />
          ) : (
          <>
          <WeekTargetBanner week={week} />

          {isLoading ? (
            <p className="text-muted-foreground font-serif">Loading your roles&hellip;</p>
          ) : roles.length === 0 ? (
            <p className="text-muted-foreground font-serif">
              You have no active roles yet. Add one on the Roles &amp; Goals page to start planning.
            </p>
          ) : (
            <div className="grid gap-6">
              {roles.map(role => (
                <RoleGoalsCard
                  key={role.id}
                  role={role}
                  candidates={candidates[role.id] ?? []}
                  stagedGoals={staged[role.id] ?? []}
                  goalInput={goalInputs[role.id] || ""}
                  selectedIds={selectedIds}
                  onGoalInputChange={value => setGoalInputs(prev => ({ ...prev, [role.id]: value }))}
                  onAddStagedGoal={() => addStagedGoal(role.id)}
                  onRemoveStagedGoal={goalId => removeStagedGoal(role.id, goalId)}
                  onToggleCandidate={toggleCandidate}
                  onToggleStagedPriority={goalId => toggleStagedPriority(role.id, goalId)}
                />
              ))}
            </div>
          )}

          {!isLoading && roles.length > 0 && plannedCount === 0 && (
            <p className="text-center text-muted-foreground font-serif mt-8">
              Carry a goal forward or add a new one to continue.
            </p>
          )}
          </>
          )}
        </div>
      </main>
    </div>
  )
}
