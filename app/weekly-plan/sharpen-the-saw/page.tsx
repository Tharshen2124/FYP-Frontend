"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AppNav } from "@/components/app-nav"
import { api } from "@/lib/api"
import { DimensionSelectCard } from "./_components/dimension-select-card"
import { dimensionsMissingSelection, formatDimensionList } from "./_utils/dimensions"
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
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [addingDimensionIds, setAddingDimensionIds] = useState<Set<string>>(new Set())

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
      toast.error("Couldn't load your Sharpen the Saw activities — please refresh.")
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

  /**
   * Writes the new activity to the standing library, then commits it to this week.
   *
   * Those stay two rows and two acts — the week holds a link to an activity, never the activity —
   * but a user who types one while choosing the week's set has already said what it is for, and
   * leaving it unticked would ask them to say it twice. `/weekly-plan/edit` reads the same
   * intent the same way: scheduling an activity there commits it.
   *
   * The library write lands immediately rather than being staged for Next, because it is not this
   * week's to stage: the activity outlives the week, and abandoning the wizard afterwards should
   * still leave it on `/sharpen-the-saw`.
   */
  const addActivity = async (dimId: string) => {
    const text = (inputs[dimId] || "").trim()
    if (!text) return

    setInputs(prev => ({ ...prev, [dimId]: "" }))
    setAddingDimensionIds(prev => new Set(prev).add(dimId))

    try {
      const { activity } = await api.createSharpenTheSawActivity({
        dimension: dimId,
        activity_description: text,
      })
      const activityId = String(activity.sharpen_the_saw_activity_id)

      setDimensions(prev =>
        prev.map(d =>
          d.id === dimId
            ? { ...d, activities: [...d.activities, { id: activityId, text: activity.activity_description }] }
            : d
        )
      )
      setSelectedActivityIds(prev => new Set(prev).add(activityId))
    } catch {
      toast.error("Couldn't add that activity — please try again.")
      // Handed back rather than dropped: what the user typed is the one thing a retry cannot
      // recover for them. Anything typed since takes precedence — they have moved on.
      setInputs(prev => ({ ...prev, [dimId]: prev[dimId] || text }))
    } finally {
      setAddingDimensionIds(prev => {
        const next = new Set(prev)
        next.delete(dimId)
        return next
      })
    }
  }

  const handleNext = async () => {
    setIsSaving(true)
    try {
      await api.saveWeekActivities([...selectedActivityIds].map(Number), week.weekStart)
      router.push(`/weekly-plan/schedule?week_start=${week.weekStart}`)
    } catch {
      toast.error("Couldn't save this week's Sharpen the Saw activities — please try again.")
      setIsSaving(false)
    }
  }

  const missingDimensions = dimensionsMissingSelection(dimensions, selectedActivityIds)
  // An activity still being created is a selection the user has already made, so Next waits for it
  // rather than saving a week that is about to gain one.
  const canProceed =
    dimensions.length > 0 && missingDimensions.length === 0 && addingDimensionIds.size === 0

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
              This Week&apos;s Sharpen the <span className="text-primary">Saw</span>
            </h1>
            <p className="text-muted-foreground font-serif text-lg">
              Choose at least one activity in each of the four dimensions to commit to this week,
              or add a new one where you need it.
            </p>
          </div>

          {isLoading ? (
            <p className="text-center text-muted-foreground font-serif mt-8">Loading your Sharpen the Saw activities…</p>
          ) : (
            <>
              <div className="grid gap-6">
                {dimensions.map(dim => (
                  <DimensionSelectCard
                    key={dim.id}
                    dimension={dim}
                    selectedActivityIds={selectedActivityIds}
                    input={inputs[dim.id] || ""}
                    isAdding={addingDimensionIds.has(dim.id)}
                    onToggleActivity={toggleActivity}
                    onInputChange={value => setInputs(prev => ({ ...prev, [dim.id]: value }))}
                    onAddActivity={() => addActivity(dim.id)}
                  />
                ))}
              </div>

              {missingDimensions.length > 0 && (
                <p className="text-center text-muted-foreground font-serif mt-8">
                  Choose or add an activity for {formatDimensionList(missingDimensions)} to continue.
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
