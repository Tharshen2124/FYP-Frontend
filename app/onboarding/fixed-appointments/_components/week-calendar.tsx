"use client"

import { CAL_START, DAYS_FULL, DAYS_SHORT, HR_PX, TOTAL_HRS } from "../_constants/calendar"
import { useCurrentWeek } from "@/hooks/use-current-week"
import { isPastDayIndex } from "@/lib/date"
import { AppointmentCard } from "./appointment-card"
import type { Appt } from "../_types"

interface Props {
  appts: Appt[]
  colRefs: React.RefObject<(HTMLDivElement | null)[]>
  onSlotClick: (e: React.MouseEvent<HTMLDivElement>, dayIndex: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, dayIndex: number) => void
  onEditAppt: (appt: Appt) => void
  onDeleteAppt: (id: string) => void
  onDragStart: (e: React.DragEvent, appt: Appt) => void
}

export function WeekCalendar({
  appts,
  colRefs,
  onSlotClick,
  onDragOver,
  onDrop,
  onEditAppt,
  onDeleteAppt,
  onDragStart,
}: Props) {
  const week = useCurrentWeek()
  const calH = TOTAL_HRS * HR_PX

  return (
    <div className="bg-card border-2 border-border rounded-md overflow-hidden">
      {/* day header row */}
      <div className="grid border-b border-border" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
        <div />
        {DAYS_SHORT.map((d, i) => {
          const isToday = week?.todayIdx === i
          const isPast  = isPastDayIndex(week?.todayIdx, i)
          return (
            <div key={d} className={["py-3 text-center border-l border-border", isPast ? "opacity-40" : ""].join(" ")}>
              {/* Kept to one line: the calendar body is positioned from the top of this row, and a
                  taller header shifts every slot down. The date appears once the week resolves. */}
              <span className={[
                "inline-block text-sm font-bold px-2 rounded-full",
                isToday ? "bg-primary text-primary-foreground" : "text-foreground",
              ].join(" ")}>
                {week ? `${d} ${week.dayDates[i].getDate()}` : d}
              </span>
            </div>
          )
        })}
      </div>

      {/* scrollable body */}
      <div className="overflow-y-auto" style={{ maxHeight: 560 }}>
        <div className="grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)", height: calH }}>

          {/* time gutter */}
          <div className="relative select-none">
            {Array.from({ length: TOTAL_HRS }, (_, i) => {
              const hour  = i + CAL_START
              const label = hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`
              return (
                <div
                  key={hour}
                  className="absolute right-2 text-[11px] text-muted-foreground leading-none"
                  style={{ top: i * HR_PX - 7 }}
                >
                  {label}
                </div>
              )
            })}
          </div>

          {/* day columns */}
          {DAYS_FULL.map((day, di) => {
            // A day that has gone takes nothing new. Withholding the handlers is the whole block:
            // with no `onDragOver` the column never becomes a drop target, so the browser shows
            // the no-drop cursor and `onDrop` is never reached.
            const isPast = isPastDayIndex(week?.todayIdx, di)
            return (
            <div
              key={day}
              ref={el => { colRefs.current[di] = el }}
              data-day-column={di}
              aria-label={day}
              aria-disabled={isPast || undefined}
              title={isPast ? "This day has passed — nothing new can be scheduled on it" : undefined}
              className={[
                "relative border-l border-border select-none",
                isPast ? "bg-foreground/[0.06] cursor-not-allowed" : "cursor-pointer",
              ].join(" ")}
              style={{ height: calH }}
              onClick={isPast ? undefined : e => onSlotClick(e, di)}
              onDragOver={isPast ? undefined : onDragOver}
              onDrop={isPast ? undefined : e => onDrop(e, di)}
            >
              {/* hour lines */}
              {Array.from({ length: TOTAL_HRS }, (_, i) => (
                <div key={i} className="absolute w-full border-t border-border/50" style={{ top: i * HR_PX }} />
              ))}
              {/* half-hour lines */}
              {Array.from({ length: TOTAL_HRS }, (_, i) => (
                <div key={`h${i}`} className="absolute w-full border-t border-border/20" style={{ top: i * HR_PX + HR_PX / 2 }} />
              ))}

              {/* appointments */}
              {appts.filter(a => a.dayIndex === di).map(appt => (
                <AppointmentCard
                  key={appt.id}
                  appt={appt}
                  allAppts={appts}
                  onEdit={onEditAppt}
                  onDelete={onDeleteAppt}
                  onDragStart={onDragStart}
                />
              ))}
            </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
