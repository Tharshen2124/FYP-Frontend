import { CalendarLegend } from "@/components/calendar-legend"
import { eventCategories } from "../_utils/events"
import type { CalEvent } from "../_types"

interface Props {
  events: CalEvent[]
}

/**
 * The same legend the planning calendars draw, so a swatch means the same thing in the place a
 * task is created and the place it is read back. The "Now" rule is dashboard-only — the planning
 * calendars draw no time indicator.
 *
 * It reads the week's own events rather than naming a fixed set, because the timetable tints a
 * card by the role or dimension behind it. The old static row said every task was one purple,
 * which was the one claim on the page a reader could check and find wrong.
 */
export function TimetableLegend({ events }: Props) {
  return (
    <CalendarLegend
      categories={eventCategories(events)}
      hasWeeklyPriority={events.some(e => e.isWeeklyPriority && !e.isFixed)}
      hasDailyPriority={events.some(e => e.isDailyPriority)}
      showNow
    />
  )
}
