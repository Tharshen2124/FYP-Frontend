import { CalendarLegend as SharedCalendarLegend } from "@/components/calendar-legend"
import { taskCategories } from "../_utils/tasks"
import type { ActivitiesByDimension, ApiRole, FixedAppt, Task } from "../_types"

interface Props {
  tasks: Task[]
  fixedAppts: FixedAppt[]
  roles: ApiRole[]
  activitiesByDimension: ActivitiesByDimension
}

/**
 * What the colours on this week's calendar mean, for the week actually on screen.
 *
 * The same legend the rest of the app draws, and for the same reason: this calendar tints a card
 * by the role or Sharpen the Saw dimension behind it, so naming one purple "Your Tasks" would be
 * the one claim on the page a reader could check against the grid and find wrong.
 */
export function CalendarLegend({ tasks, fixedAppts, roles, activitiesByDimension }: Props) {
  return (
    <SharedCalendarLegend
      categories={taskCategories(tasks, fixedAppts, roles, activitiesByDimension)}
      hasWeeklyPriority={tasks.some(t => t.isWeeklyPriority)}
      hasDailyPriority={tasks.some(t => t.isDailyPriority)}
    />
  )
}
