import { CalendarLegend as SharedCalendarLegend } from "@/components/calendar-legend"
import { hasWeeklyPriority, taskCategories } from "../_utils/tasks"
import type { Appt, Task } from "../_types/calendar"
import type { PlanDimension, PlanRole } from "../_types"

interface Props {
  tasks: Task[]
  appts: Appt[]
  roles: PlanRole[]
  dimensions: PlanDimension[]
}

/**
 * What the colours on this week's calendar mean, for the week actually on screen.
 *
 * It named a single purple "Your Tasks" until now, which was true while every task was drawn
 * alike. It stopped being true once a card took the colour of the role or Sharpen the Saw
 * dimension behind it, and the legend was then the one claim on the page a reader could check
 * against the grid in front of them and find wrong.
 */
export function CalendarLegend({ tasks, appts, roles, dimensions }: Props) {
  return (
    <SharedCalendarLegend
      categories={taskCategories(tasks, appts, roles, dimensions)}
      hasWeeklyPriority={hasWeeklyPriority(tasks)}
      hasDailyPriority={tasks.some(t => t.isDailyPriority)}
    />
  )
}
