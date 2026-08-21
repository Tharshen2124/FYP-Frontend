"use client"

import { useMemo } from "react"
import { CalendarDays, Check, Circle, Star } from "lucide-react"
import { DAYS } from "../_constants/history"
import { groupBy } from "../_utils/group"
import { weekLegend } from "../_utils/history"
import { fmtTime } from "../_utils/time"
import type { HistoryEvent, HistoryWeek } from "../_types"

interface Props {
  week: HistoryWeek
}

/**
 * Whether this task was done.
 *
 * A completed chip always gets its tick. An unfinished one gets a hollow circle only when it was a
 * scheduled task: those are the ones the week was measured on, and leaving the slot blank would
 * make "not done" indistinguishable from "nothing rendered here". A fixed appointment is a
 * commitment rather than an intention, so an unticked one is left unmarked.
 */
function CompletionMark({ event }: { event: HistoryEvent }) {
  if (event.isCompleted) {
    return <Check className="w-2.5 h-2.5 shrink-0" style={{ color: event.color }} aria-label="Completed" />
  }

  if (event.isFixed) return null

  return <Circle className="w-2.5 h-2.5 shrink-0 text-muted-foreground/50" aria-label="Not completed" />
}

function EventChip({ event }: { event: HistoryEvent }) {
  const Icon = event.icon

  return (
    <div
      className="rounded-lg px-2 py-1.5 border"
      style={{ backgroundColor: event.color + "22", borderColor: event.color + "55" }}
      title={`${event.categoryLabel} — ${event.title}, ${fmtTime(event.startMins)}–${fmtTime(event.endMins)}`}
    >
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className="w-2.5 h-2.5 shrink-0" style={{ color: event.color }} />
        <span className="text-[10px] font-bold leading-tight truncate" style={{ color: event.color }}>
          {fmtTime(event.startMins)}
        </span>
        <span className="ml-auto flex items-center gap-0.5 shrink-0">
          {event.isDailyPriority && (
            <Star className="w-2.5 h-2.5 shrink-0 fill-current" style={{ color: event.color }} aria-label="Daily priority" />
          )}
          <CompletionMark event={event} />
        </span>
      </div>

      <p
        className={`text-[11px] font-serif leading-tight line-clamp-2 text-foreground ${
          event.isCompleted ? "line-through opacity-60" : ""
        }`}
      >
        {event.title}
      </p>

      {/* The line the old table was missing: what this task was actually for. The colour carries
          the same answer, but only the caption survives being read one chip at a time. */}
      <p className="text-[10px] leading-tight mt-0.5 truncate opacity-80" style={{ color: event.color }}>
        {event.categoryLabel}
      </p>
    </div>
  )
}

export function ScheduleCard({ week }: Props) {
  const byDay = useMemo(() => groupBy(week.events, e => String(e.dayIndex)), [week.events])
  const legend = useMemo(() => weekLegend(week.events), [week.events])

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
          const dayEvents = (byDay[String(idx)] ?? []).sort((a, b) => a.startMins - b.startMins)
          return (
            <div key={day} className="min-w-0">
              <div className="text-xs font-semibold text-muted-foreground text-center mb-2 pb-1.5 border-b border-border">
                {day}
              </div>
              <div className="space-y-1.5">
                {dayEvents.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground/40 font-serif text-center py-2 italic">—</p>
                ) : (
                  dayEvents.map(event => <EventChip key={event.id} event={event} />)
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* The week's real categories rather than a static "fixed / task" pair — with several roles
          and dimensions in play, that pair told you nothing the chips did not already say. */}
      {legend.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-3 border-t border-border">
          {legend.map(entry => {
            const Icon = entry.icon
            return (
              <div key={entry.key} className="flex items-center gap-1.5 text-xs text-muted-foreground font-serif">
                <Icon className="w-3 h-3 shrink-0" style={{ color: entry.color }} />
                {entry.label}
              </div>
            )
          })}
          {/* The two marks, in neutral ink. Tinting them would put them in the same visual
              vocabulary as the categories above and read as two more of them. */}
          <span className="w-px h-3.5 bg-border shrink-0" aria-hidden />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-serif">
            <Check className="w-3 h-3 shrink-0" />
            Done
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-serif">
            <Circle className="w-3 h-3 shrink-0" />
            Not done
          </div>
        </div>
      )}
    </div>
  )
}
