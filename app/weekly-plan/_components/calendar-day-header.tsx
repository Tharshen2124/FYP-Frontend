import { DAYS_SHORT } from "../_constants/calendar"
import { isPastDayIndex } from "@/lib/date"
import type { PastDayPolicy } from "../_types/calendar"
import type { PlanWeekDays } from "../_utils/use-plan-week"

interface Props {
  week: PlanWeekDays | null
  /**
   * Whether the days already gone are drawn as closed. Dimming states the calendar's own rule, so
   * `/weekly-plan/edit` — where every column is live — leaves them at full strength rather than
   * greying out days it will happily accept a drop on. Today's pill is drawn either way: which day
   * it is remains worth saying even when nothing hangs on it.
   */
  pastDays?: PastDayPolicy
}

/**
 * The Mon–Sun row above both calendars, showing the real dates of the week being planned.
 *
 * `todayIdx` is -1 for any week other than the current one, which is what stops a future week
 * being drawn with days already dimmed as past.
 */
export function CalendarDayHeader({ week, pastDays = "block" }: Props) {
  return (
    <div className="grid border-b border-border" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
      <div />
      {DAYS_SHORT.map((d, i) => {
        const isToday = week != null && week.todayIdx === i
        const isPast = pastDays === "block" && isPastDayIndex(week?.todayIdx, i)
        return (
          <div key={d} className={["py-3 text-center border-l border-border", isPast ? "opacity-40" : ""].join(" ")}>
            {/* Kept to one line: the calendar body is positioned from the top of this row, and a
                taller header shifts every slot down. The date appears once the week resolves. */}
            <span
              className={[
                "inline-block text-sm font-bold px-2 rounded-full",
                isToday ? "bg-primary text-primary-foreground" : "text-foreground",
              ].join(" ")}
            >
              {week ? `${d} ${week.dayDates[i].getDate()}` : d}
            </span>
          </div>
        )
      })}
    </div>
  )
}
