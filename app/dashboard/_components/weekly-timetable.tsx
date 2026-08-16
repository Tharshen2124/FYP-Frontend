"use client"

import { useMemo } from "react"
import { DAYS_SHORT, CAL_START, CAL_END, TOTAL_HRS, HR_PX } from "../_constants/calendar"
import { MOCK_EVENTS } from "../_constants/mock-data"
import { fmtShortDate } from "../_utils/time"
import { getWeekStart } from "@/lib/date"
import { EventCard } from "./event-card"
import type { CalItem } from "../_types"

export function WeeklyTimetable() {
  const today     = new Date()
  const weekStart = getWeekStart(today)
  const todayIdx  = ((today.getDay() + 6) % 7) // 0=Mon … 6=Sun

  const dayDates = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    }),
  [weekStart])

  const calItems: CalItem[] = MOCK_EVENTS.map(e => ({
    id: e.id,
    dayIndex: e.dayIndex,
    startMins: e.startMins,
    endMins: e.endMins,
  }))

  const calH = TOTAL_HRS * HR_PX

  return (
    <div className="bg-card border-2 border-border rounded-2xl overflow-hidden">
      {/* Day headers */}
      <div className="grid border-b border-border" style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}>
        <div />
        {DAYS_SHORT.map((d, i) => {
          const isToday = i === todayIdx
          return (
            <div key={d} className="py-3 px-1 text-center border-l border-border">
              <p className="text-xs font-medium text-muted-foreground">{d}</p>
              <p className={[
                "text-sm font-bold mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full",
                isToday ? "bg-primary text-primary-foreground" : "text-foreground",
              ].join(" ")}>
                {dayDates[i].getDate()}
              </p>
            </div>
          )
        })}
      </div>

      {/* Scrollable grid */}
      <div className="overflow-y-auto" style={{ maxHeight: 520 }}>
        <div className="grid" style={{ gridTemplateColumns: "52px repeat(7, 1fr)", height: calH }}>
          {/* Time gutter */}
          <div className="relative select-none">
            {Array.from({ length: TOTAL_HRS }, (_, i) => {
              const hour  = i + CAL_START
              const label = hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`
              return (
                <div
                  key={hour}
                  className="absolute right-2 text-[10px] text-muted-foreground leading-none"
                  style={{ top: i * HR_PX - 6 }}
                >
                  {label}
                </div>
              )
            })}
          </div>

          {/* Day columns */}
          {Array.from({ length: 7 }, (_, di) => {
            const isToday = di === todayIdx
            return (
              <div
                key={di}
                className={["relative border-l border-border select-none", isToday ? "bg-primary/5" : ""].join(" ")}
                style={{ height: calH }}
              >
                {/* Hour + half-hour lines */}
                {Array.from({ length: TOTAL_HRS }, (_, i) => (
                  <div key={i} className="absolute w-full border-t border-border/50" style={{ top: i * HR_PX }} />
                ))}
                {Array.from({ length: TOTAL_HRS }, (_, i) => (
                  <div key={`h${i}`} className="absolute w-full border-t border-border/20" style={{ top: i * HR_PX + HR_PX / 2 }} />
                ))}

                {/* Events */}
                {MOCK_EVENTS.filter(e => e.dayIndex === di).map(event => (
                  <EventCard key={event.id} event={event} allItems={calItems} />
                ))}

                {/* "Now" indicator on today */}
                {isToday && (() => {
                  const nowMins = today.getHours() * 60 + today.getMinutes()
                  if (nowMins < CAL_START * 60 || nowMins > CAL_END * 60) return null
                  const top = (nowMins - CAL_START * 60) / 60 * HR_PX
                  return (
                    <div className="absolute w-full flex items-center pointer-events-none z-10" style={{ top }}>
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 -ml-1" />
                      <div className="flex-1 border-t-2 border-primary" />
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
