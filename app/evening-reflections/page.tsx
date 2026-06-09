"use client"

import { useState } from "react"
import {
  Moon,
  Pencil,
  Plus,
  Wand2,
  CalendarDays,
  Loader2,
} from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

interface DayReflection {
  text: string
}

interface Week {
  id: string
  label: string
  reflections: Record<string, DayReflection>
  summary: string
}

function generateWeeks(): Week[] {
  const weeks: Week[] = []
  const today = new Date(2026, 4, 24) // May 24, 2026
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))

  const fmt = (d: Date) => {
    const day = d.getDate()
    const month = d.toLocaleString("default", { month: "short" })
    return `${day} ${month}`
  }

  for (let i = 0; i < 8; i++) {
    const start = new Date(monday)
    start.setDate(monday.getDate() - i * 7)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)

    weeks.push({
      id: `week-${i}`,
      label: `${fmt(start)} – ${fmt(end)}`,
      reflections: {},
      summary: "",
    })
  }
  return weeks
}

const INITIAL_WEEKS = generateWeeks()

const SUMMARY_PLACEHOLDER =
  "This week showed meaningful progress across your daily reflections. You maintained consistency through mid-week, with particular depth on Wednesday and Thursday. Your reflections reveal a recurring theme of gratitude and focus on personal growth. Consider carrying forward your Wednesday insights into next week's planning."

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
          ? {
              ...w,
              reflections: {
                ...w.reflections,
                [editingDay!]: { text: draftText.trim() },
              },
            }
          : w
      )
    )
    setEditingDay(null)
    setDraftText("")
  }

  const generateSummary = () => {
    setGeneratingSummary(true)
    setTimeout(() => {
      setWeeks(prev =>
        prev.map(w =>
          w.id === selectedWeekId ? { ...w, summary: SUMMARY_PLACEHOLDER } : w
        )
      )
      setGeneratingSummary(false)
    }, 1800)
  }

  const hasAnyReflection = Object.keys(selectedWeek.reflections).some(
    k => selectedWeek.reflections[k]?.text
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <Sidebar />

      {/* Body: week list + main */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-border flex flex-col overflow-y-auto">
          <div className="px-4 py-5 border-b border-border">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-wide">Weeks</span>
            </div>
          </div>
          <ul className="flex-1 py-2">
            {weeks.map(week => {
              const hasEntries = Object.keys(week.reflections).some(
                k => week.reflections[k]?.text
              )
              return (
                <li key={week.id}>
                  <button
                    onClick={() => setSelectedWeekId(week.id)}
                    className={`w-full text-left px-4 py-3 transition-colors flex items-center justify-between gap-2 group ${
                      week.id === selectedWeekId
                        ? "bg-primary/15 border-r-2 border-primary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/20 hover:text-foreground"
                    }`}
                  >
                    <span className="text-sm font-serif">{week.label}</span>
                    {hasEntries && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
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

            {/* Weekly Summary */}
            <div className="p-6 rounded-2xl bg-card border-2 border-border mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold text-foreground">Weekly Summary</h2>
                {!selectedWeek.summary && (
                  <Button
                    onClick={generateSummary}
                    disabled={generatingSummary || !hasAnyReflection}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground disabled:opacity-50"
                  >
                    {generatingSummary ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Summary
                      </>
                    )}
                  </Button>
                )}
                {selectedWeek.summary && (
                  <Button
                    variant="outline"
                    onClick={generateSummary}
                    disabled={generatingSummary}
                    className="border-border text-foreground hover:bg-secondary/20"
                  >
                    {generatingSummary ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4 mr-2" />
                    )}
                    Regenerate
                  </Button>
                )}
              </div>
              {selectedWeek.summary ? (
                <p className="text-muted-foreground font-serif leading-relaxed">
                  {selectedWeek.summary}
                </p>
              ) : (
                <p className="text-muted-foreground font-serif text-sm italic">
                  {hasAnyReflection
                    ? "Click 'Generate Summary' to get an AI-powered overview of your week's reflections."
                    : "Add at least one daily reflection before generating a summary."}
                </p>
              )}
            </div>

            {/* Days label */}
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Daily Reflections
              </h2>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {DAYS.map(day => {
                const reflection = selectedWeek.reflections[day]
                const hasText = !!reflection?.text
                return (
                  <div
                    key={day}
                    className="p-4 rounded-2xl bg-card border-2 border-border hover:border-primary/30 transition-colors flex flex-col gap-3"
                  >
                    {/* Day header */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground">{day}</span>
                      {hasText && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>

                    {/* Reflection text */}
                    <div className="flex-1 min-h-[80px]">
                      {hasText ? (
                        <p className="text-xs text-muted-foreground font-serif leading-relaxed line-clamp-5">
                          {reflection.text}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground/50 font-serif italic">
                          No reflection yet…
                        </p>
                      )}
                    </div>

                    {/* Action button */}
                    <Button
                      onClick={() => openEdit(day)}
                      size="sm"
                      className={
                        hasText
                          ? "bg-secondary hover:bg-secondary/80 text-secondary-foreground w-full"
                          : "bg-primary hover:bg-primary/90 text-primary-foreground w-full"
                      }
                    >
                      {hasText ? (
                        <>
                          <Pencil className="w-3 h-3 mr-1.5" />
                          Edit
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3 mr-1.5" />
                          Create
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      </div>

      {/* Edit / Create Dialog */}
      <Dialog
        open={editingDay !== null}
        onOpenChange={open => {
          if (!open) {
            setEditingDay(null)
            setDraftText("")
          }
        }}
      >
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingDay} — {selectedWeek.label}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-serif">
              Write your reflection for this evening. What went well? What could be better?
            </DialogDescription>
          </DialogHeader>
          <Textarea
            autoFocus
            value={draftText}
            onChange={e => setDraftText(e.target.value)}
            placeholder="Today I reflected on…"
            rows={8}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none font-serif"
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="outline"
              className="border-border text-foreground hover:bg-secondary/20"
              onClick={() => {
                setEditingDay(null)
                setDraftText("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={saveReflection}
              disabled={!draftText.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
            >
              Save Reflection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
