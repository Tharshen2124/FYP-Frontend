"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AppNav } from "@/components/app-nav"
import { api } from "@/lib/api"
import { DimensionSelectCard } from "./_components/dimension-select-card"
import { useTargetWeek } from "../_utils/use-target-week"
import { toPlanDimensions } from "../_utils/dimensions"
import type { PlanDimension } from "../_types"

export default function WeeklyPlanSharpenTheSawPage() {
  const router = useRouter()
  const week = useTargetWeek()
  const [dimensions, setDimensions] = useState<PlanDimension[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedActivityIds, setSelectedActivityIds] = useState<Set<string>>(new Set())

  // The library is standing and belongs to the user; the committed set belongs to the week, so
  // coming back to this step shows what was already chosen rather than a blank slate.
  const loadWeek = useCallback(async (weekStart: string) => {
    setIsLoading(true)
    try {
      const [{ activities }, { activity_ids }] = await Promise.all([
        api.fetchSharpenTheSawActivities(),
        api.fetchWeekActivities(weekStart),
      ])
      setDimensions(toPlanDimensions(activities))
      setSelectedActivityIds(new Set(activity_ids.map(String)))
    } catch {
      setDimensions(toPlanDimensions([]))
      toast.error("Couldn't load your renewal activities — please refresh.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (week.weekStart) loadWeek(week.weekStart)
  }, [week.weekStart, loadWeek])

  const toggleActivity = (actId: string) => {
    setSelectedActivityIds(prev => {
      const next = new Set(prev)
      if (next.has(actId)) next.delete(actId)
      else next.add(actId)
      return next
    })
  }

  const handleNext = async () => {
    setIsSaving(true)
    try {
      await api.saveWeekActivities([...selectedActivityIds].map(Number), week.weekStart)
      router.push(`/weekly-plan/schedule?week_start=${week.weekStart}`)
    } catch {
      toast.error("Couldn't save this week's renewal activities — please try again.")
      setIsSaving(false)
    }
  }

  const canProceed = selectedActivityIds.size > 0

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <AppNav action="next" onNext={handleNext} nextEnabled={canProceed && !isSaving && !isLoading} />

      <main className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              This Week&apos;s <span className="text-primary">Renewal</span>
            </h1>
            <p className="text-muted-foreground font-serif text-lg">
              Choose which renewal activities you&apos;re committing to this week across all four dimensions.
            </p>
          </div>

          {isLoading ? (
            <p className="text-center text-muted-foreground font-serif mt-8">Loading your renewal activities…</p>
          ) : (
            <>
              <div className="grid gap-6">
                {dimensions.map(dim => (
                  <DimensionSelectCard
                    key={dim.id}
                    dimension={dim}
                    selectedActivityIds={selectedActivityIds}
                    onToggleActivity={toggleActivity}
                  />
                ))}
              </div>

              {!canProceed && (
                <p className="text-center text-muted-foreground font-serif mt-8">
                  Select at least one activity or add a new one to continue.
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
