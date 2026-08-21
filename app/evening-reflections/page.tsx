"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, Lock, Moon } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { formatWeekRange, getWeekDays, parseLocalDate } from "@/lib/date"
import { DAYS } from "./_constants/reflections"
import { useReflections } from "./_utils/use-reflections"
import { WeekList } from "./_components/week-list"
import { WeeklySummaryCard } from "./_components/weekly-summary-card"
import { DayReflectionCard } from "./_components/day-reflection-card"
import { ReflectionDialog } from "./_components/reflection-dialog"

export default function EveningReflectionsPage() {
  const week = useReflections()
  const [editingDay, setEditingDay] = useState<number | null>(null)
  const [draftText, setDraftText] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const weekDates = getWeekDays(parseLocalDate(week.weekStart))

  const openDay = (dayIndex: number) => {
    setDraftText(week.slots[dayIndex]?.text ?? "")
    setEditingDay(dayIndex)
  }

  const closeDay = () => {
    setEditingDay(null)
    setDraftText("")
  }

  const saveReflection = async () => {
    if (editingDay === null) return
    setIsSaving(true)
    const saved = await week.saveReflection(editingDay, draftText.trim())
    setIsSaving(false)
    if (saved) closeDay()
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <Sidebar />

      <div className="relative z-10 flex flex-1 overflow-hidden">
        <WeekList
          weeks={week.weeks}
          selectedWeekStart={week.weekStart}
          onSelectWeek={week.selectWeek}
          onJumpToDate={week.jumpToDate}
          onLoadOlder={week.loadOlderWeeks}
          maxDate={week.thisWeek}
        />

        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-5xl mx-auto">
            {/* The heading renders before any data arrives: app-navigation.spec.ts asserts an
                h1 is visible on every route, and the week strip is useful while the panel loads. */}
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
                {formatWeekRange(week.weekStart)}
              </p>
            </div>

            {!week.isEditable && (
              <div className="flex items-center gap-2 mb-6 px-4 py-3 rounded-xl bg-muted border border-border">
                <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground font-serif">
                  This week has ended — you can read these reflections, but not change them.
                </p>
              </div>
            )}

            {week.isLoading ? (
              <p className="flex items-center gap-2 text-muted-foreground font-serif mt-8">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading this week&apos;s reflections…
              </p>
            ) : !week.planned ? (
              /* A reflection belongs to a weekly plan, so there is nowhere to put one until the
                 week has been planned. Saying so beats a write that fails at the server. */
              <div className="p-6 rounded-2xl bg-card border-2 border-border">
                <p className="text-muted-foreground font-serif mb-4">
                  You haven&apos;t planned this week yet, so there&apos;s nothing to reflect against.
                </p>
                <Link
                  href={`/weekly-plan/goals?week_start=${week.weekStart}`}
                  className="text-primary font-bold hover:underline"
                >
                  Plan this week →
                </Link>
              </div>
            ) : (
              <>
                <WeeklySummaryCard
                  summary={week.summary}
                  reflectionCount={week.reflectionCount}
                  canGenerate={week.canGenerate}
                  generating={week.isGenerating}
                  error={week.summaryError}
                  onGenerate={week.generateSummary}
                />

                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Daily Reflections
                  </h2>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {DAYS.map((_, dayIndex) => (
                    <DayReflectionCard
                      key={dayIndex}
                      dayIndex={dayIndex}
                      date={weekDates[dayIndex]}
                      reflection={week.slots[dayIndex]}
                      isEditable={week.isEditable}
                      onOpen={() => openDay(dayIndex)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      <ReflectionDialog
        dayIndex={editingDay}
        dateLabel={
          editingDay === null
            ? ""
            : weekDates[editingDay].toLocaleDateString("en-GB", { day: "numeric", month: "short" })
        }
        draftText={draftText}
        readOnly={!week.isEditable}
        isSaving={isSaving}
        onDraftChange={setDraftText}
        onOpenChange={open => {
          if (!open) closeDay()
        }}
        onCancel={closeDay}
        onSave={saveReflection}
      />
    </div>
  )
}
