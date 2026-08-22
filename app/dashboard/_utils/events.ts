import { SHARPEN_THE_SAW_DIMENSIONS } from "@/lib/sharpen-the-saw-dimensions"
import { DAILY_PRIORITY_COLOR, FIXED_COLOR, TASK_COLOR } from "../_constants/calendar"
import { strToMins } from "./time"
import type { ApiTask, CalEvent, DetailRow, TaskDetail } from "../_types"

/**
 * The dimension a task renews, or undefined for an id the frontend does not know. The two callers
 * want different things when it is missing, so the fallback is deliberately left to them.
 */
function dimensionMeta(dimension: string | null) {
  return SHARPEN_THE_SAW_DIMENSIONS.find(d => d.id === dimension)
}

/**
 * What a task is working towards, as one line.
 *
 * The backend sends the parts rather than a finished sentence, because the display names for the
 * four Sharpen the Saw dimensions ("Social / Emotional", not "social") live here in the frontend.
 */
export function linkLabel(task: ApiTask): string | undefined {
  if (task.link_kind === "goal") {
    return task.role_name ? `${task.role_name} — ${task.link_text}` : (task.link_text ?? undefined)
  }

  if (task.link_kind === "activity") {
    const dimension = dimensionMeta(task.dimension)
    return dimension ? `${dimension.label} — ${task.link_text}` : (task.link_text ?? undefined)
  }

  return undefined
}

function colorFor(task: ApiTask): string {
  if (task.is_fixed_appointment) return FIXED_COLOR
  if (task.is_daily_priority) return DAILY_PRIORITY_COLOR
  return TASK_COLOR
}

function kindFor(task: ApiTask): string {
  if (task.is_fixed_appointment) return "Fixed appointment"
  if (task.link_kind === "goal") return "Role goal"
  if (task.link_kind === "activity") return "Sharpen the Saw"
  return "Task"
}

/**
 * The same task, broken out for the detail dialog rather than for the grid.
 *
 * `toCalEvents` throws most of this away on purpose — a card has room for a title and a time — so
 * the dialog reads the `ApiTask` itself instead of a widened `CalEvent`. Each row is dropped when
 * its source is null rather than shown empty: a fixed appointment has no goal to name, and saying
 * "Goal: —" would only invite the reader to wonder which one went missing.
 */
export function taskDetail(task: ApiTask): TaskDetail {
  const rows: DetailRow[] = []

  if (task.link_kind === "goal") {
    if (task.link_text) rows.push({ label: "Goal", value: task.link_text })
    if (task.role_name) rows.push({ label: "Role", value: task.role_name })
  }

  if (task.link_kind === "activity") {
    if (task.link_text) rows.push({ label: "Activity", value: task.link_text })
    /* An unrecognised id is shown as it came. Under a "Dimension" label the raw word still tells
       the reader something, which is not true of the one-line `linkLabel` above. */
    const value = dimensionMeta(task.dimension)?.label ?? task.dimension
    if (value) rows.push({ label: "Dimension", value })
  }

  /* In practice only a fixed appointment carries one: `create_scheduled_tasks` does not permit the
     field, while `create_fixed_appointments` does. */
  if (task.description?.trim()) rows.push({ label: "Notes", value: task.description.trim() })

  return { kind: kindFor(task), color: colorFor(task), rows }
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
