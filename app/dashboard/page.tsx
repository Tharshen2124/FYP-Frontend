"use client"

import { useState, useEffect, useMemo } from "react"
import { CalendarDays, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/sidebar"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useCurrentWeek } from "@/hooks/use-current-week"
import { api } from "@/lib/api"
import { WeeklyTimetable } from "./_components/weekly-timetable"
import { EndOfDayModal } from "./_components/end-of-day-modal"
import { TaskDetailModal } from "./_components/task-detail-modal"
import { NoPlanCard } from "./_components/no-plan-card"
import { TimetableLegend } from "./_components/timetable-legend"
import { toCalEvents } from "./_utils/events"
import { fmtShortDate } from "./_utils/time"
import type { ApiWeeklyPlan } from "./_types"

type LoadState = "loading" | "ready" | "error"

export default function DashboardPage() {
  const { isReady } = useRequireAuth()
  const week = useCurrentWeek()
  const [showEodModal, setShowEodModal] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [plan, setPlan] = useState<ApiWeeklyPlan | null>(null)
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!isReady) return
    let cancelled = false

    api
      .fetchWeeklyPlan()
      .then(({ weekly_plan }) => {
        if (cancelled) return
        setPlan(weekly_plan)
        setLoadState("ready")
      })
      .catch(() => {
        if (!cancelled) setLoadState("error")
      })

    return () => { cancelled = true }
  }, [isReady, reloadKey])

  useEffect(() => {
    const today = new Date().toDateString()
    const lastShown = localStorage.getItem("eod_shown_date")
    if (lastShown === today) return

    const savedTime = localStorage.getItem("eod_time") ?? "21:00"
    const [h, m] = savedTime.split(":").map(Number)
    const now = new Date()
    const trigger = new Date()
    trigger.setHours(h, m, 0, 0)

    if (now >= trigger) {
      setShowEodModal(true)
    }
  }, [])

  const events = useMemo(() => (plan ? toCalEvents(plan.tasks) : []), [plan])

  /* Derived from the held plan rather than copied into state, so ticking a task off patches the
     plan and the open dialog re-reads it — the button flips with nothing else to keep in step. */
  const selectedTask =
    plan?.tasks.find(task => String(task.task_id) === selectedTaskId) ?? null

  const handleEodClose = () => {
    localStorage.setItem("eod_shown_date", new Date().toDateString())
    setShowEodModal(false)
  }

  /* The modal has already written these; patching the held plan is what makes the timetable behind
     it agree without a second round trip — the house rule for every API-backed route here. */
  const handleCompletionChange = (changed: { id: string; isCompleted: boolean }[]) => {
    const byId = new Map(changed.map(c => [c.id, c.isCompleted]))
    setPlan(prev =>
      prev === null
        ? prev
        : {
            ...prev,
            tasks: prev.tasks.map(task =>
              byId.has(String(task.task_id))
                ? { ...task, is_completed: byId.get(String(task.task_id))! }
                : task
            ),
          }
    )
  }

  if (!isReady) return null

  const dateRange = plan
    ? `${fmtShortDate(new Date(`${plan.start_date}T00:00:00`))} – ${fmtShortDate(new Date(`${plan.end_date}T00:00:00`))}`
    : null

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <Sidebar />

      <main className="relative z-10 flex-1 overflow-y-auto px-8 py-8">
        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">
              Schedule for <span className="text-primary">this Week</span>
            </h1>
            <p className="text-muted-foreground font-serif">
              {dateRange
                ? `${dateRange} — fixed appointments and scheduled tasks.`
                : "Your full week at a glance — fixed appointments and scheduled tasks."}
            </p>
          </div>
          {/* Nothing to edit until a plan exists for this week.

              TODO: this needs its own page — one that loads the *current* week and lets the user
              adjust its tasks and fixed appointments directly, rather than re-entering the
              three-step planning flow. Deliberately left without a destination until that page
              exists, so nobody wires it back to /weekly-plan/schedule by accident: that route is
              step 3 of a wizard whose Next means "finish planning", not "save my edit". */}
          {plan && (
            <Button
              disabled
              className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Edit Weekly Plan
            </Button>
          )}
        </div>

        {loadState === "loading" && (
          <div className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-serif">Loading your week…</span>
          </div>
        )}

        {loadState === "error" && (
          <div className="bg-card border-2 border-border rounded-2xl px-6 py-20 text-center">
            <p className="text-foreground font-bold mb-2">We couldn&apos;t load your week</p>
            <p className="text-muted-foreground font-serif mb-5">
              Check your connection and try again.
            </p>
            <Button variant="outline" onClick={() => { setLoadState("loading"); setReloadKey(k => k + 1) }}>
              Try Again
            </Button>
          </div>
        )}

        {loadState === "ready" && plan && (
          <>
            <TimetableLegend />
            <WeeklyTimetable events={events} onSelectEvent={setSelectedTaskId} />
          </>
        )}

        {loadState === "ready" && !plan && <NoPlanCard />}
      </main>

      <TaskDetailModal
        task={selectedTask}
        date={week && selectedTask ? week.dayDates[selectedTask.day_of_week] : null}
        onClose={() => setSelectedTaskId(null)}
        onCompletionChange={handleCompletionChange}
      />

      <EndOfDayModal
        open={showEodModal}
        onClose={handleEodClose}
        events={events}
        onCompletionChange={handleCompletionChange}
      />
    </div>
  )
}
