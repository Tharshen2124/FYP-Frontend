"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { INITIAL_DIMENSIONS } from "./_constants"
import { type Dimension, type Activity } from "./_types"
import { DimensionCard } from "./_components/dimension-card"
import { DeleteActivityModal } from "./_components/delete-activity-modal"

export default function SharpenTheSawPage() {
  const [dimensions, setDimensions] = useState<Dimension[]>(INITIAL_DIMENSIONS)
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [editingActivity, setEditingActivity] = useState<{ dimId: string; actId: string; text: string } | null>(null)
  const [activityToDelete, setActivityToDelete] = useState<{ dimId: string; activity: Activity } | null>(null)

  const addActivity = (dimId: string) => {
    const text = (inputs[dimId] || "").trim()
    if (!text) return
    setDimensions(prev =>
      prev.map(d =>
        d.id === dimId
          ? { ...d, activities: [...d.activities, { id: Date.now().toString(), text }] }
          : d
      )
    )
    setInputs(prev => ({ ...prev, [dimId]: "" }))
  }

  const togglePriority = (dimId: string, actId: string) => {
    setDimensions(prev =>
      prev.map(d =>
        d.id === dimId
          ? { ...d, activities: d.activities.map(a => a.id === actId ? { ...a, isWeeklyPriority: !a.isWeeklyPriority } : a) }
          : d
      )
    )
  }

  const handleConfirmDelete = () => {
    if (activityToDelete) {
      setDimensions(prev =>
        prev.map(d =>
          d.id === activityToDelete.dimId
            ? { ...d, activities: d.activities.filter(a => a.id !== activityToDelete.activity.id) }
            : d
        )
      )
      setActivityToDelete(null)
    }
  }

  const handleEditSave = () => {
    if (!editingActivity || !editingActivity.text.trim()) {
      setEditingActivity(null)
      return
    }
    setDimensions(prev =>
      prev.map(d =>
        d.id === editingActivity.dimId
          ? { ...d, activities: d.activities.map(a => a.id === editingActivity.actId ? { ...a, text: editingActivity.text.trim() } : a) }
          : d
      )
    )
    setEditingActivity(null)
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
            Manage your renewal activities across the four dimensions of life.
          </p>
        </div>

        <div className="grid gap-6">
          {dimensions.map(dim => (
            <DimensionCard
              key={dim.id}
              dim={dim}
              input={inputs[dim.id] || ""}
              editingActivity={editingActivity}
              onInputChange={(dimId, value) => setInputs(prev => ({ ...prev, [dimId]: value }))}
              onAdd={addActivity}
              onTogglePriority={togglePriority}
              onDeleteRequest={(dimId, activity) => setActivityToDelete({ dimId, activity })}
              onEditStart={(dimId, actId, text) => setEditingActivity({ dimId, actId, text })}
              onEditChange={text => setEditingActivity(prev => prev ? { ...prev, text } : null)}
              onEditSave={handleEditSave}
              onEditCancel={() => setEditingActivity(null)}
            />
          ))}
        </div>
      </main>

      <DeleteActivityModal
        target={activityToDelete}
        onCancel={() => setActivityToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
