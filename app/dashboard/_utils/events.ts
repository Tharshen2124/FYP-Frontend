import { SHARPEN_THE_SAW_DIMENSIONS } from "@/lib/sharpen-the-saw-dimensions"
import { DAILY_PRIORITY_COLOR, FIXED_COLOR, TASK_COLOR } from "../_constants/calendar"
import { strToMins } from "./time"
import type { ApiTask, CalEvent } from "../_types"

/**
 * What a task is working towards, as one line.
 *
 * The backend sends the parts rather than a finished sentence, because the display names for the
 * four renewal dimensions ("Social / Emotional", not "social") live here in the frontend.
 */
export function linkLabel(task: ApiTask): string | undefined {
  if (task.link_kind === "goal") {
    return task.role_name ? `${task.role_name} — ${task.link_text}` : (task.link_text ?? undefined)
  }

  if (task.link_kind === "activity") {
    const dimension = SHARPEN_THE_SAW_DIMENSIONS.find(d => d.id === task.dimension)
    return dimension ? `${dimension.label} — ${task.link_text}` : (task.link_text ?? undefined)
  }

  return undefined
}

function colorFor(task: ApiTask): string {
  if (task.is_fixed_appointment) return FIXED_COLOR
  if (task.is_daily_priority) return DAILY_PRIORITY_COLOR
  return TASK_COLOR
}

/** Turns the week's tasks into the shape the timetable draws. */
export function toCalEvents(tasks: ApiTask[]): CalEvent[] {
  return tasks.map(task => ({
    id: String(task.task_id),
    title: task.title,
    dayIndex: task.day_of_week,
    startMins: strToMins(task.start_time),
    endMins: strToMins(task.end_time),
    color: colorFor(task),
    isFixed: task.is_fixed_appointment,
    isDailyPriority: task.is_daily_priority,
    isCompleted: task.is_completed,
    linkLabel: linkLabel(task),
  }))
}
