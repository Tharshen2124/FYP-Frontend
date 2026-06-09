"use client"

import { useState, useMemo } from "react"
import { CalendarDays, Clock, Lock, Target, Zap } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { HISTORY_WEEKS, type HistoryWeek, type HistoryGoal, type HistoryActivity } from "./_constants/mock-data"

// ─── helpers ──────────────────────────────────────────────────────────────────

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function fmtTime(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  const ampm = h < 12 ? "am" : "pm"
  const hh = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${hh}${ampm}` : `${hh}:${m.toString().padStart(2, "0")}${ampm}`
}

function groupBy<T, K extends string>(items: T[], key: (item: T) => K): Record<K, T[]> {
  return items.reduce((acc, item) => {
    const k = key(item)
    ;(acc[k] ??= []).push(item)
    return acc
  }, {} as Record<K, T[]>)
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StatBadge({ value, label, icon }: { value: number; label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border">
      <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground font-serif mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function GoalsCard({ goals }: { goals: HistoryGoal[] }) {
  const byRole = useMemo(() => groupBy(goals, g => g.roleName), [goals])
  const roles = Object.keys(byRole)

  return (
    <div className="p-5 rounded-2xl bg-card border-2 border-border h-full">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-primary shrink-0" />
        <h3 className="font-bold text-foreground">Role Goals</h3>
        <span className="ml-auto text-xs text-muted-foreground font-serif">{goals.length} goal{goals.length !== 1 ? "s" : ""}</span>
      </div>
      {roles.length === 0 ? (
        <p className="text-sm text-muted-foreground font-serif italic">No goals recorded.</p>
      ) : (
        <div className="space-y-4">
          {roles.map(roleName => {
            const roleGoals = byRole[roleName]
            const color = roleGoals[0].roleColor
            return (
              <div key={roleName}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-sm font-semibold text-foreground">{roleName}</span>
                </div>
                <ul className="space-y-1.5 ml-[18px]">
                  {roleGoals.map((g, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      {g.goalText}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ActivitiesCard({ activities }: { activities: HistoryActivity[] }) {
  const byDimension = useMemo(() => groupBy(activities, a => a.dimensionLabel), [activities])
  const dims = Object.keys(byDimension)

  return (
    <div className="p-5 rounded-2xl bg-card border-2 border-border h-full">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-primary shrink-0" />
        <h3 className="font-bold text-foreground">Sharpen the Saw</h3>
        <span className="ml-auto text-xs text-muted-foreground font-serif">{activities.length} activit{activities.length !== 1 ? "ies" : "y"}</span>
      </div>
      {dims.length === 0 ? (
        <p className="text-sm text-muted-foreground font-serif italic">No activities recorded.</p>
      ) : (
        <div className="space-y-4">
          {dims.map(dim => {
            const dimActivities = byDimension[dim]
            const color = dimActivities[0].dimensionColor
            return (
              <div key={dim}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-sm font-semibold text-foreground">{dim}</span>
                </div>
                <ul className="space-y-1.5 ml-[18px]">
                  {dimActivities.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      {a.activityText}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ScheduleCard({ week }: { week: HistoryWeek }) {
  const byDay = useMemo(
    () => groupBy(week.events, e => String(e.dayIndex)),
    [week.events]
  )

  return (
    <div className="p-5 rounded-2xl bg-card border-2 border-border">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="w-4 h-4 text-primary shrink-0" />
        <h3 className="font-bold text-foreground">Weekly Schedule</h3>
        <span className="ml-auto text-xs text-muted-foreground font-serif">
          {week.events.length} event{week.events.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day, idx) => {
          const dayEvents = (byDay[String(idx)] ?? []).sort(
            (a, b) => a.startMins - b.startMins
          )
          return (
            <div key={day} className="min-w-0">
              {/* Day header */}
              <div className="text-xs font-semibold text-muted-foreground text-center mb-2 pb-1.5 border-b border-border">
                {day}
              </div>
              {/* Events */}
              <div className="space-y-1.5">
                {dayEvents.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground/40 font-serif text-center py-2 italic">—</p>
                ) : (
                  dayEvents.map(ev => (
                    <div
                      key={ev.id}
                      className="rounded-lg px-2 py-1.5 border border-border/60"
                      style={{ backgroundColor: ev.color + "22", borderColor: ev.color + "55" }}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        {ev.isFixed && <Lock className="w-2.5 h-2.5 shrink-0" style={{ color: ev.color }} />}
                        <span
                          className="text-[10px] font-bold leading-tight truncate"
                          style={{ color: ev.color }}
                        >
                          {fmtTime(ev.startMins)}
                        </span>
                      </div>
                      <p className="text-[11px] font-serif leading-tight line-clamp-2 text-foreground">
                        {ev.title}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-serif">
          <Lock className="w-3 h-3 text-[#3b82f6]" />
          Fixed appointment
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-serif">
          <div className="w-2.5 h-2.5 rounded-sm bg-primary/30 border border-primary/50" />
          Scheduled task
        </div>
      </div>
    </div>
  )
}

function WeekDetail({ week }: { week: HistoryWeek }) {
  const fixedCount = week.events.filter(e => e.isFixed).length
  const taskCount = week.events.filter(e => !e.isFixed).length
  const dimCount = new Set(week.activities.map(a => a.dimensionId)).size

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Week of <span className="text-primary">{week.label}</span>
        </h2>
        <p className="text-muted-foreground font-serif text-sm mt-0.5">
          A snapshot of your goals, activities, and schedule for this week.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBadge value={week.goals.length}   label="Goals active"       icon={<Target className="w-4 h-4" />} />
        <StatBadge value={dimCount}             label="Dimensions covered" icon={<Zap    className="w-4 h-4" />} />
        <StatBadge value={fixedCount}           label="Fixed appointments" icon={<Lock   className="w-4 h-4" />} />
        <StatBadge value={taskCount}            label="Scheduled tasks"    icon={<Clock  className="w-4 h-4" />} />
      </div>

      {/* Goals + Activities side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GoalsCard goals={week.goals} />
        <ActivitiesCard activities={week.activities} />
      </div>

      {/* Full-width schedule */}
      <ScheduleCard week={week} />
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [selectedId, setSelectedId] = useState(HISTORY_WEEKS[0].id)
  const selectedWeek = HISTORY_WEEKS.find(w => w.id === selectedId)!

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <Sidebar />

      {/* Inner two-panel layout */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Week list */}
        <aside className="w-56 shrink-0 border-r border-border flex flex-col overflow-y-auto bg-card/40">
          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Past Weeks</span>
            </div>
          </div>
          <ul className="flex-1 py-2">
            {HISTORY_WEEKS.map(week => (
              <li key={week.id}>
                <button
                  onClick={() => setSelectedId(week.id)}
                  className={[
                    "w-full text-left px-4 py-3 transition-colors",
                    week.id === selectedId
                      ? "bg-primary/15 border-r-2 border-primary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/20 hover:text-foreground",
                  ].join(" ")}
                >
                  <p className="text-xs font-serif leading-snug">{week.label}</p>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Week detail */}
        <main className="flex-1 overflow-y-auto px-8 py-8">
          <WeekDetail key={selectedId} week={selectedWeek} />
        </main>
      </div>
    </div>
  )
}
