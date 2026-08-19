"use client"

import { CAL_START, DAYS_FULL, DAYS_SHORT, HR_PX, TOTAL_HRS } from "../_constants/calendar"
import { useCurrentWeek } from "@/hooks/use-current-week"
import { FixedAppointmentCard } from "./fixed-appointment-card"
import { TaskCard } from "./task-card"
import type { CalItem, FixedAppt, Task } from "../_types"

interface Props {
  fixedAppts: FixedAppt[]
  tasks: Task[]
  allCalItems: CalItem[]
  colRefs: React.RefObject<(HTMLDivElement | null)[]>
  onSlotClick: (e: React.MouseEvent<HTMLDivElement>, dayIndex: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, dayIndex: number) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (id: string) => void
  onDragStart: (e: React.DragEvent, task: Task) => void
}

export function WeekCalendar({
  fixedAppts,
  tasks,
  allCalItems,
  colRefs,
  onSlotClick,
  onDragOver,
  onDrop,
  onEditTask,
  onDeleteTask,
  onDragStart,
}: Props) {
  const week = useCurrentWeek()
  const calH = TOTAL_HRS * HR_PX

  return (
    <div className="bg-card border-2 border-border rounded-md overflow-hidden">
      <div className="grid border-b border-border" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
        <div />
        {DAYS_SHORT.map((d, i) => {
          const isToday = week?.todayIdx === i
          const isPast  = week != null && i < week.todayIdx
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
          {DAYS_FULL.map((day, di) => (
            <div
              key={day}
              ref={el => { colRefs.current[di] = el }}
              data-day-column={di}
              aria-label={day}
              className={[
                "relative border-l border-border cursor-pointer select-none",
                week != null && di < week.todayIdx ? "bg-foreground/[0.06]" : "",
              ].join(" ")}
              style={{ height: calH }}
              onClick={e => onSlotClick(e, di)}
              onDragOver={onDragOver}
              onDrop={e => onDrop(e, di)}
            >
              {Array.from({ length: TOTAL_HRS }, (_, i) => (
                <div key={i} className="absolute w-full border-t border-border/50" style={{ top: i * HR_PX }} />
              ))}
              {Array.from({ length: TOTAL_HRS }, (_, i) => (
                <div key={`h${i}`} className="absolute w-full border-t border-border/20" style={{ top: i * HR_PX + HR_PX / 2 }} />
              ))}

              {fixedAppts.filter(f => f.dayIndex === di).map(appt => (
                <FixedAppointmentCard key={appt.id} appt={appt} allCalItems={allCalItems} />
              ))}

              {tasks.filter(t => t.dayIndex === di).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  allCalItems={allCalItems}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onDragStart={onDragStart}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
