"use client"

import { useMemo } from "react"
import { CalendarDays, Check, Circle, Star } from "lucide-react"
import { WEEKLY_PRIORITY_COLOR } from "@/lib/role-colors"
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
function CompletionMark({ event, color }: { event: HistoryEvent; color: string }) {
  if (event.isCompleted) {
    return <Check className="w-2.5 h-2.5 shrink-0" style={{ color }} aria-label="Completed" />
  }

  if (event.isFixed) return null

  return <Circle className="w-2.5 h-2.5 shrink-0 text-muted-foreground/50" aria-label="Not completed" />
}

function EventChip({ event }: { event: HistoryEvent }) {
  const Icon = event.icon
  /* The reserved yellow overrides the role's colour, exactly as the live calendars draw it — a
     week reads back the way it was planned. `event.color` stays the category's own, because that
     is what the footer legend names. */
  const color = event.isWeeklyPriority ? WEEKLY_PRIORITY_COLOR : event.color

  return (
    <div
      className="rounded-lg px-2 py-1.5 border"
      style={{ backgroundColor: color + "22", borderColor: color + "55" }}
      title={`${event.categoryLabel} — ${event.title}, ${fmtTime(event.startMins)}–${fmtTime(event.endMins)}${
        event.isWeeklyPriority ? " (weekly priority)" : ""
      }`}
    >
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className="w-2.5 h-2.5 shrink-0" style={{ color }} />
        <span className="text-[10px] font-bold leading-tight truncate" style={{ color }}>
          {fmtTime(event.startMins)}
        </span>
        <span className="ml-auto flex items-center gap-0.5 shrink-0">
          {/* Always the reserved yellow, never the chip's own colour: a daily priority has to read
              the same on a role-coloured chip and a yellow one. */}
          {event.isDailyPriority && (
            <Star
              className="w-2.5 h-2.5 shrink-0 fill-current"
              style={{ color: WEEKLY_PRIORITY_COLOR }}
              aria-label="Daily priority"
            />
          )}
          <CompletionMark event={event} color={color} />
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
          the same answer, but only the caption survives being read one chip at a time — and on a
          yellow chip the caption is the only thing left naming the role. */}
      <p className="text-[10px] leading-tight mt-0.5 truncate opacity-80" style={{ color }}>
        {event.categoryLabel}
      </p>
    </div>
  )
}

/** A legend row: what kind of thing these entries are, then the entries. The title is a fixed
 *  column so the rows line up and can be read down as well as across. */
function LegendRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground/70 w-28 shrink-0">
        {title}
      </span>
      {children}
    </div>
  )
}

export function ScheduleCard({ week }: Props) {
  const byDay = useMemo(() => groupBy(week.events, e => String(e.dayIndex)), [week.events])
  const legend = useMemo(() => weekLegend(week.events), [week.events])
  /* Only the marks this week actually used, the same rule the category rows follow: explaining a
     yellow chip on a week that has none invites exactly the question the legend exists to answer. */
  const hasWeeklyPriority = week.events.some(e => e.isWeeklyPriority)
  const hasDailyPriority = week.events.some(e => e.isDailyPriority)

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
          and dimensions in play, that pair told you nothing the chips did not already say. One row
          per kind, because a role name and a dimension label are indistinguishable on a flat line. */}
      {legend.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border space-y-2">
          {legend.map(group => (
            <LegendRow key={group.key} title={group.title}>
              {group.entries.map(entry => {
                const Icon = entry.icon
                return (
                  <span key={entry.key} className="flex items-center gap-1.5 text-xs text-muted-foreground font-serif">
                    <Icon className="w-3 h-3 shrink-0" style={{ color: entry.color }} />
                    {entry.label}
                  </span>
                )
              })}
            </LegendRow>
          ))}

          {/* The reserved yellow and the star, behind their own rule. They cut across the rows
              above rather than sitting in them: either can land on a task of any category. */}
          {(hasWeeklyPriority || hasDailyPriority) && (
            <div className="pt-2 border-t border-border">
              <LegendRow title="Priority">
                {hasWeeklyPriority && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-serif">
                    {/* The chip's own fill is too faint to read at 12px, so this borrows the
                        calendar legends' treatment instead: a solid edge carries the colour. */}
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{
                        backgroundColor: `${WEEKLY_PRIORITY_COLOR}40`,
                        borderLeft: `3px solid ${WEEKLY_PRIORITY_COLOR}`,
                      }}
                    />
                    Weekly priority goal
                  </span>
                )}
                {hasDailyPriority && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-serif">
                    <Star className="w-3 h-3 shrink-0 fill-current" style={{ color: WEEKLY_PRIORITY_COLOR }} />
                    Daily priority
                  </span>
                )}
              </LegendRow>
            </div>
          )}

          {/* The two marks, in neutral ink and behind their own rule. Tinting them would put them
              in the same visual vocabulary as the categories above and read as two more of them. */}
          <div className="pt-2 border-t border-border">
            <LegendRow title="Task status">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-serif">
                <Check className="w-3 h-3 shrink-0" />
                Done
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-serif">
                <Circle className="w-3 h-3 shrink-0" />
                Not done
              </span>
            </LegendRow>
          </div>
        </div>
      )}
    </div>
  )
}
