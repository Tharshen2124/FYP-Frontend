"use client"

import { useState } from "react"
import { AppNav } from "@/components/app-nav"
import { OnboardingStepper } from "@/components/onboarding-stepper"
import { INITIAL_DIMENSIONS } from "./_constants/dimensions"
import { allDimensionsFilled, countActivities } from "./_utils/dimensions"
import { DimensionCard } from "./_components/dimension-card"
import type { Dimension, EditingActivityId } from "./_types"

export default function OnboardingSharpenTheSawPage() {
  const [dimensions, setDimensions] = useState<Dimension[]>(INITIAL_DIMENSIONS)
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<EditingActivityId | null>(null)
  const [editText, setEditText] = useState("")

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

  const deleteActivity = (dimId: string, actId: string) => {
    setDimensions(prev =>
      prev.map(d =>
        d.id === dimId
          ? { ...d, activities: d.activities.filter(a => a.id !== actId) }
          : d
      )
    )
  }

  const startEdit = (dimId: string, actId: string, text: string) => {
    setEditingId({ dimId, actId })
    setEditText(text)
  }

  const commitEdit = () => {
    if (!editingId || !editText.trim()) { setEditingId(null); return }
    setDimensions(prev =>
      prev.map(d =>
        d.id === editingId.dimId
          ? { ...d, activities: d.activities.map(a => a.id === editingId.actId ? { ...a, text: editText.trim() } : a) }
          : d
      )
    )
    setEditingId(null)
    setEditText("")
  }

  const totalActivities = countActivities(dimensions)

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <AppNav
        action="next"
        nextHref="/onboarding/fixed-appointments"
        nextEnabled={allDimensionsFilled(dimensions)}
      />

      <main className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <OnboardingStepper currentStep={2} />

          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Sharpen the <span className="text-primary">Saw</span>
            </h1>
            <p className="text-muted-foreground font-serif text-lg">
              Habit 7 — Add renewal activities across the four dimensions of your life to sustain
              long-term effectiveness.
            </p>
          </div>

          <div className="grid gap-6">
            {dimensions.map(dim => (
              <DimensionCard
                key={dim.id}
                dimension={dim}
                input={inputs[dim.id] || ""}
                editingId={editingId}
                editText={editText}
                onInputChange={value => setInputs(prev => ({ ...prev, [dim.id]: value }))}
                onAddActivity={() => addActivity(dim.id)}
                onStartEdit={(actId, text) => startEdit(dim.id, actId, text)}
                onEditTextChange={setEditText}
                onCommitEdit={commitEdit}
                onCancelEdit={() => setEditingId(null)}
                onTogglePriority={actId => togglePriority(dim.id, actId)}
                onDeleteActivity={actId => deleteActivity(dim.id, actId)}
              />
            ))}
          </div>

          {totalActivities === 0 && (
            <p className="text-center text-muted-foreground font-serif mt-8">
              Add at least one renewal activity to each dimension to get started.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
