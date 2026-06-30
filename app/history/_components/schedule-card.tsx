"use client"

import { useMemo } from "react"
import { CalendarDays, Lock } from "lucide-react"
import { type HistoryWeek } from "../_constants/mock-data"
import { fmtTime, groupBy } from "../_utils"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function ScheduleCard({ week }: { week: HistoryWeek }) {
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
              <div className="text-xs font-semibold text-muted-foreground text-center mb-2 pb-1.5 border-b border-border">
                {day}
              </div>
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
