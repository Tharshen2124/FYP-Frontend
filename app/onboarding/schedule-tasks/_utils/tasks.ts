import type { LegendCategory } from "@/components/calendar-legend"
import type { ActivitiesByDimension, ApiRole, FixedAppt, LinkType, ModalState, Task } from "../_types"
import { DIMENSION_META } from "../_constants/dimensions"
import { FIXED_COLOR, TASK_COLOR } from "../_constants/calendar"
import { minsToStr, strToMins } from "./time"

export interface LinkMeta {
  id: string
  label: string
  /** The role's or the dimension's own colour. Like `isWeeklyPriority` it rides on the link, since
   *  that is where the fact lives — a task's colour is never its own. */
  color: string
  /** True only for a goal the user named a weekly priority — a Sharpen the Saw activity is never
   *  one. It rides on the link because that is where the fact lives: the task inherits it. */
  isWeeklyPriority: boolean
}

export function getLinkMeta(
  modal: Pick<ModalState, "linkType" | "selectedRoleId" | "selectedGoalId" | "selectedDimensionId" | "selectedActivityId">,
  roles: ApiRole[],
  activitiesByDimension: ActivitiesByDimension
): LinkMeta | null {
  if (modal.linkType === "role-goal") {
    const role = roles.find(r => r.id === modal.selectedRoleId)
    const goal = role?.goals.find(g => g.id === modal.selectedGoalId)
    if (!role || !goal) return null
    return {
      id: goal.id,
      label: `${role.name} — ${goal.text}`,
      color: role.color,
      isWeeklyPriority: goal.isWeeklyPriority,
    }
  }

  const dim = DIMENSION_META.find(d => d.id === modal.selectedDimensionId)
  const act = (activitiesByDimension[modal.selectedDimensionId] ?? []).find(a => a.id === modal.selectedActivityId)
  if (!dim || !act) return null
  return { id: act.id, label: `${dim.label} — ${act.text}`, color: dim.color, isWeeklyPriority: false }
}

/**
 * The inverse of {@link getLinkMeta}: a saved task carries only the id it links to, but the edit
 * modal drives two dependent pickers, so it needs the owning role or dimension as well. A link
 * whose owner has since gone leaves the pair blank rather than half-selected — the modal then
 * asks for it again, which is the only honest thing it can do.
 */
export function toEditModalState(
  task: Task,
  roles: ApiRole[],
  activitiesByDimension: ActivitiesByDimension
): ModalState {
  let selectedRoleId = ""
  let selectedGoalId = ""
  let selectedDimensionId = ""
  let selectedActivityId = ""

  if (task.linkType === "role-goal") {
    const role = roles.find(r => r.goals.some(g => g.id === task.linkId))
    if (role) { selectedRoleId = role.id; selectedGoalId = task.linkId }
  } else {
    const dimId = Object.keys(activitiesByDimension).find(dim =>
      activitiesByDimension[dim].some(a => a.id === task.linkId)
    )
    if (dimId) { selectedDimensionId = dimId; selectedActivityId = task.linkId }
  }

  return {
    open: true, mode: "edit", editId: task.id,
    dayIndex:        task.dayIndex,
    startTime:       minsToStr(task.startMins),
    endTime:         minsToStr(task.endMins),
    title:           task.title,
    linkType:        task.linkType,
    selectedRoleId,
    selectedGoalId,
    selectedDimensionId,
    selectedActivityId,
    isDailyPriority: task.isDailyPriority,
  }
}

/** The label, the colour and the priority together, because all three are read off the same
 *  lookup: a saved task carries only the id it links to, and its colour is the linked goal's
 *  business, not its own. */
function resolveLink(
  linkType: LinkType,
  linkId: string,
  roles: ApiRole[],
  activitiesByDimension: ActivitiesByDimension
): { label: string; color: string; isWeeklyPriority: boolean } {
  if (linkType === "role-goal") {
    for (const role of roles) {
      const goal = role.goals.find(g => g.id === linkId)
      if (goal) {
        return { label: `${role.name} — ${goal.text}`, color: role.color, isWeeklyPriority: goal.isWeeklyPriority }
      }
    }
    return { label: "Unknown goal", color: TASK_COLOR, isWeeklyPriority: false }
  }

  for (const dim of DIMENSION_META) {
    const act = (activitiesByDimension[dim.id] ?? []).find(a => a.id === linkId)
    if (act) return { label: `${dim.label} — ${act.text}`, color: dim.color, isWeeklyPriority: false }
  }
  return { label: "Unknown activity", color: TASK_COLOR, isWeeklyPriority: false }
}

export interface ApiTask {
  task_id: number
  title: string
  day_of_week: number
  start_time: string
  end_time: string
  goal_id: number | null
  sharpen_the_saw_activity_id: number | null
  is_daily_priority: boolean
}

export function fromApiTask(apiTask: ApiTask, roles: ApiRole[], activitiesByDimension: ActivitiesByDimension): Task {
  const linkType: LinkType = apiTask.goal_id != null ? "role-goal" : "sharpen-the-saw"
  const linkId = String(apiTask.goal_id ?? apiTask.sharpen_the_saw_activity_id)
  const link = resolveLink(linkType, linkId, roles, activitiesByDimension)

  return {
    id: String(apiTask.task_id),
    title: apiTask.title,
    dayIndex: apiTask.day_of_week,
    startMins: strToMins(apiTask.start_time),
    endMins: strToMins(apiTask.end_time),
    linkType,
    linkId,
    linkLabel: link.label,
    color: link.color,
    isWeeklyPriority: link.isWeeklyPriority,
    isDailyPriority: apiTask.is_daily_priority,
  }
}

/**
 * What each block on the calendar belongs to, for the legend to fold into its rows.
 *
 * `Task.color` is already the category's own rather than the painted one, so a weekly-priority
 * task appears in the legend under its role instead of renaming that role to yellow. The yellow
 * has a row of its own.
 */
export function taskCategories(
  tasks: Task[],
  fixedAppts: FixedAppt[],
  roles: ApiRole[],
  activitiesByDimension: ActivitiesByDimension
): LegendCategory[] {
  const categories: LegendCategory[] = tasks.map(task => {
    if (task.linkType === "role-goal") {
      const role = roles.find(r => r.goals.some(g => g.id === task.linkId))
      return role
        ? { kind: "goal", label: role.name, color: role.color }
        : { kind: "none", label: "Unknown goal", color: TASK_COLOR }
    }

    const dim = DIMENSION_META.find(d =>
      (activitiesByDimension[d.id] ?? []).some(a => a.id === task.linkId)
    )
    return dim
      ? { kind: "activity", label: dim.label, color: dim.color }
      : { kind: "none", label: "Unknown activity", color: TASK_COLOR }
  })

  if (fixedAppts.length > 0) {
    categories.push({ kind: "fixed", label: "Fixed appointments", color: FIXED_COLOR })
  }

  return categories
}

/** Shapes local task state into the snake_case payload the backend expects. */
export function toScheduleTasksPayload(tasks: Task[]) {
  return {
    tasks: tasks.map(t => ({
      title: t.title,
      day_of_week: t.dayIndex,
      start_time: minsToStr(t.startMins),
      end_time: minsToStr(t.endMins),
      goal_id: t.linkType === "role-goal" ? t.linkId : null,
      sharpen_the_saw_activity_id: t.linkType === "sharpen-the-saw" ? t.linkId : null,
      is_daily_priority: t.isDailyPriority,
    })),
  }
}
