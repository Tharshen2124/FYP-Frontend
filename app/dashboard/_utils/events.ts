import type { LegendCategory } from "@/components/calendar-legend"
import { getColor } from "@/lib/role-colors"
import { SHARPEN_THE_SAW_DIMENSIONS } from "@/lib/sharpen-the-saw-dimensions"
import { FIXED_COLOR, WEEKLY_PRIORITY_COLOR } from "../_constants/calendar"
import { strToMins } from "./time"
import type { ApiTask, CalEvent, DetailRow, TaskDetail } from "../_types"

/** A scheduled task with no goal and no activity behind it. The planning UI never creates one, but
 *  the schema permits it, so it is named rather than left as an untinted block. */
const UNLINKED_COLOR = "#94a3b8"

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

/**
 * What a task belongs to: the colour it is drawn in and the name the legend gives that colour.
 *
 * The role's own colour rather than one flat purple for every task, matching the calendars that
 * plan the week and the one that reads it back. It is the answer to the question a week at a
 * glance is actually asked — which roles is this week going to, and which are getting nothing —
 * and the whole reason /roles offers a palette at all.
 *
 * Deliberately *not* the reserved yellow, even for a weekly priority. That override is applied at
 * paint time by {@link EventCard}, so the legend can keep naming the role: a yellow card is still
 * a card belonging to a role, and folding the two here would rename the role to "yellow".
 */
function category(task: ApiTask): LegendCategory {
  if (task.is_fixed_appointment) {
    return { kind: "fixed", label: "Fixed appointments", color: FIXED_COLOR }
  }

  if (task.link_kind === "goal") {
    return { kind: "goal", label: task.role_name ?? "Goal", color: getColor(task.role_color_id ?? "") }
  }

  if (task.link_kind === "activity") {
    const dimension = dimensionMeta(task.dimension)
    return {
      kind: "activity",
      label: dimension?.label ?? task.dimension ?? "Sharpen the Saw",
      color: dimension?.color ?? UNLINKED_COLOR,
    }
  }

  return { kind: "none", label: "Unlinked", color: UNLINKED_COLOR }
}

/**
 * What a card actually paints, which is the category's colour unless the reserved yellow overrides
 * it. Yellow is what a weekly-priority goal earns: scanning the week, the goals the user said
 * matter most are the ones that stand out, and which role they belong to is the caption's job.
 *
 * A fixed appointment is exempt and stays blue. It belongs to no goal, so it can never really be a
 * weekly priority — the guard is there so a server that ever said otherwise could not repaint the
 * one block on the grid whose colour means "this is not yours to move".
 */
export function paintedColor(event: Pick<CalEvent, "color" | "isWeeklyPriority" | "isFixed">): string {
  return event.isWeeklyPriority && !event.isFixed ? WEEKLY_PRIORITY_COLOR : event.color
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

  return {
    kind: kindFor(task),
    // The dot matches the grid, so it takes the override the card takes.
    color: paintedColor({
      color: category(task).color,
      isWeeklyPriority: task.is_weekly_priority,
      isFixed: task.is_fixed_appointment,
    }),
    rows,
  }
}

/** Turns the week's tasks into the shape the timetable draws. */
export function toCalEvents(tasks: ApiTask[]): CalEvent[] {
  return tasks.map(task => {
    const { kind, label, color } = category(task)
    return {
    id: String(task.task_id),
    title: task.title,
    dayIndex: task.day_of_week,
    startMins: strToMins(task.start_time),
    endMins: strToMins(task.end_time),
    color,
    categoryKind: kind,
    categoryLabel: label,
    isFixed: task.is_fixed_appointment,
    isDailyPriority: task.is_daily_priority,
    isWeeklyPriority: task.is_weekly_priority,
    isCompleted: task.is_completed,
    linkLabel: linkLabel(task),
    }
  })
}

/** The week's categories, one entry per drawn block — the legend folds them into its rows. */
export function eventCategories(events: CalEvent[]): LegendCategory[] {
  return events.map(e => ({ kind: e.categoryKind, label: e.categoryLabel, color: e.color }))
}
