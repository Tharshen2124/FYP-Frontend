"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Sidebar } from "@/components/sidebar"
import { api } from "@/lib/api"
import { INITIAL_DIMENSIONS } from "./_constants/dimensions"
import { groupActivitiesByDimension } from "./_utils/dimensions"
import { DimensionCard } from "./_components/dimension-card"
import { DeleteActivityDialog } from "./_components/delete-activity-dialog"
import type { Activity, Dimension, EditingActivity } from "./_types"

export default function SharpenTheSawPage() {
  const [dimensions, setDimensions] = useState<Dimension[]>(INITIAL_DIMENSIONS)
  const [isLoading, setIsLoading] = useState(true)
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [editingActivity, setEditingActivity] = useState<EditingActivity | null>(null)
  const [activityToDelete, setActivityToDelete] = useState<{ dimId: string; activity: Activity } | null>(null)

  useEffect(() => {
    let cancelled = false
    api.fetchSharpenTheSawActivities()
      .then(({ activities }) => {
        if (!cancelled) setDimensions(groupActivitiesByDimension(activities))
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't load your Sharpen the Saw activities — please refresh.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const addActivity = async (dimId: string) => {
    const text = (inputs[dimId] || "").trim()
    if (!text) return
    setInputs(prev => ({ ...prev, [dimId]: "" }))
    try {
      const { activity } = await api.createSharpenTheSawActivity({ dimension: dimId, activity_description: text })
      setDimensions(prev =>
        prev.map(d =>
          d.id === dimId
            ? { ...d, activities: [...d.activities, { id: String(activity.sharpen_the_saw_activity_id), text: activity.activity_description }] }
            : d
        )
      )
    } catch {
      toast.error("Couldn't add that activity — please try again.")
      setInputs(prev => ({ ...prev, [dimId]: text }))
    }
  }

  const handleDeleteActivity = (dimId: string, actId: string) => {
    const activity = dimensions.find(d => d.id === dimId)?.activities.find(a => a.id === actId)
    if (activity) setActivityToDelete({ dimId, activity })
  }

  const handleConfirmDeleteActivity = async () => {
    if (!activityToDelete) return
    const { dimId, activity } = activityToDelete
    setActivityToDelete(null)
    try {
      await api.deleteSharpenTheSawActivity(Number(activity.id))
      setDimensions(prev =>
        prev.map(d =>
          d.id === dimId
            ? { ...d, activities: d.activities.filter(a => a.id !== activity.id) }
            : d
        )
      )
    } catch {
      toast.error("Couldn't delete that activity — please try again.")
    }
  }

  const handleSaveActivityEdit = async () => {
    if (!editingActivity || !editingActivity.text.trim()) {
      setEditingActivity(null)
      return
    }
    const { dimId, actId, text } = editingActivity
    const trimmed = text.trim()
    setEditingActivity(null)
    try {
      await api.updateSharpenTheSawActivity(Number(actId), { activity_description: trimmed })
      setDimensions(prev =>
        prev.map(d =>
          d.id === dimId
            ? { ...d, activities: d.activities.map(a => a.id === actId ? { ...a, text: trimmed } : a) }
            : d
        )
      )
    } catch {
      toast.error("Couldn't save that change — please try again.")
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <Sidebar />

      <main className="relative z-10 flex-1 overflow-y-auto px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">
            Sharpen the <span className="text-primary">Saw</span>
          </h1>
          <p className="text-muted-foreground font-serif">
            Manage your activities across the four dimensions of life.
          </p>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground font-serif">Loading your Sharpen the Saw activities…</p>
        ) : (
          <div className="grid gap-6">
            {dimensions.map(dim => (
              <DimensionCard
                key={dim.id}
                dimension={dim}
                input={inputs[dim.id] || ""}
                editingActivity={editingActivity}
                onInputChange={value => setInputs(prev => ({ ...prev, [dim.id]: value }))}
                onAddActivity={() => addActivity(dim.id)}
                onStartEdit={setEditingActivity}
                onChangeEdit={setEditingActivity}
                onSaveEdit={handleSaveActivityEdit}
                onCancelEdit={() => setEditingActivity(null)}
                onDeleteActivity={actId => handleDeleteActivity(dim.id, actId)}
              />
            ))}
          </div>
        )}
      </main>

      <DeleteActivityDialog
        open={!!activityToDelete}
        activityText={activityToDelete?.activity.text}
        onOpenChange={open => { if (!open) setActivityToDelete(null) }}
        onCancel={() => setActivityToDelete(null)}
        onConfirm={handleConfirmDeleteActivity}
      />
    </div>
  )
}
