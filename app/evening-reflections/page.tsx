"use client"

import { useState } from "react"
import { Moon } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { DAYS, INITIAL_WEEKS, SUMMARY_PLACEHOLDER } from "./_constants"
import { type Week } from "./_types"
import { WeekList } from "./_components/week-list"
import { WeeklySummaryCard } from "./_components/weekly-summary-card"
import { DayCard } from "./_components/day-card"
import { ReflectionDialog } from "./_components/reflection-dialog"

export default function EveningReflectionsPage() {
  const [weeks, setWeeks] = useState<Week[]>(INITIAL_WEEKS)
  const [selectedWeekId, setSelectedWeekId] = useState(INITIAL_WEEKS[0].id)
  const [editingDay, setEditingDay] = useState<string | null>(null)
  const [draftText, setDraftText] = useState("")
  const [generatingSummary, setGeneratingSummary] = useState(false)

  const selectedWeek = weeks.find(w => w.id === selectedWeekId)!

  const openEdit = (day: string) => {
    setDraftText(selectedWeek.reflections[day]?.text ?? "")
    setEditingDay(day)
  }

  const saveReflection = () => {
    setWeeks(prev =>
      prev.map(w =>
        w.id === selectedWeekId
          ? { ...w, reflections: { ...w.reflections, [editingDay!]: { text: draftText.trim() } } }
          : w
      )
    )
    setEditingDay(null)
    setDraftText("")
  }

  const closeDialog = () => {
    setEditingDay(null)
    setDraftText("")
  }

  const generateSummary = () => {
    setGeneratingSummary(true)
    setTimeout(() => {
      setWeeks(prev =>
        prev.map(w => w.id === selectedWeekId ? { ...w, summary: SUMMARY_PLACEHOLDER } : w)
      )
      setGeneratingSummary(false)
    }, 1800)
  }

  const hasAnyReflection = Object.keys(selectedWeek.reflections).some(
    k => selectedWeek.reflections[k]?.text
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <Sidebar />

      <div className="relative z-10 flex flex-1 overflow-hidden">
        <WeekList
          weeks={weeks}
          selectedWeekId={selectedWeekId}
          onSelect={setSelectedWeekId}
        />

        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Evening <span className="text-primary">Reflections</span>
                </h1>
              </div>
              <p className="text-muted-foreground font-serif text-lg mt-1 ml-[52px]">
                {selectedWeek.label}
              </p>
            </div>

            <WeeklySummaryCard
              week={selectedWeek}
              hasAnyReflection={hasAnyReflection}
              generatingSummary={generatingSummary}
              onGenerate={generateSummary}
            />

            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Daily Reflections
              </h2>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {DAYS.map(day => (
                <DayCard
                  key={day}
                  day={day}
                  reflection={selectedWeek.reflections[day]}
                  onEdit={openEdit}
                />
              ))}
            </div>
          </div>
        </main>
      </div>

      <ReflectionDialog
        editingDay={editingDay}
        selectedWeek={selectedWeek}
        draftText={draftText}
        onDraftChange={setDraftText}
        onSave={saveReflection}
        onClose={closeDialog}
      />
    </div>
  )
}
