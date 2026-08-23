import type { ApiPlanAppointment, ApiPlanTask } from "@/lib/api"
import { FIXED_COLOR, WEEKLY_PRIORITY_COLOR } from "../_constants/calendar"
import { minsToStr, strToMins } from "./time"
import type { Appt, ModalState, Task } from "../_types/calendar"
import type { PlanDimension, PlanGoal, PlanRole } from "../_types"

type LinkSelection = Pick<
  ModalState,
  "linkType" | "selectedRoleId" | "selectedGoalId" | "selectedDimensionId" | "selectedActivityId"
>

export interface LinkMeta {
  id: string
  label: string
  color: string
}

/**
 * What a task serving this goal is drawn in.
 *
 * A weekly priority overrides the role's own colour. That is the whole force of reserving yellow:
 * scanning the week, the goals the user said matter most this week are the ones that stand out,
 * and which role they belong to is the caption's job rather than the tint's.
 */
function goalColor(goal: PlanGoal, role: PlanRole): string {
  return goal.isWeeklyPriority ? WEEKLY_PRIORITY_COLOR : role.color
}

/**
 * Resolves what the modal has selected into the id, label and colour a task carries.
 *
 * Returning `null` is what keeps Save disabled: a task must serve either a goal or a Sharpen the
 * Saw activity, so a half-made selection is not a saveable task.
 */
export function getLinkMeta(
  modal: LinkSelection,
  roles: PlanRole[],
  dimensions: PlanDimension[]
): LinkMeta | null {
  if (modal.linkType === "role-goal") {
    const role = roles.find(r => r.id === modal.selectedRoleId)
    const goal = role?.goals.find(g => g.id === modal.selectedGoalId)
    if (!role || !goal) return null
    return { id: goal.id, label: `${role.name} — ${goal.text}`, color: goalColor(goal, role) }
  }

  const dim = dimensions.find(d => d.id === modal.selectedDimensionId)
  const activity = dim?.activities.find(a => a.id === modal.selectedActivityId)
  if (!dim || !activity) return null
  return { id: activity.id, label: `${dim.label} — ${activity.text}`, color: dim.color }
}

/** Where a loaded task's link sits, so the edit modal can preselect it. */
export function findLinkSelection(
  task: Task,
  roles: PlanRole[],
  dimensions: PlanDimension[]
): Pick<ModalState, "selectedRoleId" | "selectedGoalId" | "selectedDimensionId" | "selectedActivityId"> {
  const empty = { selectedRoleId: "", selectedGoalId: "", selectedDimensionId: "", selectedActivityId: "" }

  if (task.linkType === "role-goal") {
    const role = roles.find(r => r.goals.some(g => g.id === task.linkId))
    return role ? { ...empty, selectedRoleId: role.id, selectedGoalId: task.linkId } : empty
  }

  const dim = dimensions.find(d => d.activities.some(a => a.id === task.linkId))
  return dim ? { ...empty, selectedDimensionId: dim.id, selectedActivityId: task.linkId } : empty
}

/**
 * A task the server already holds, in the shape the calendar draws.
 *
 * The link may no longer resolve — its goal can have been dropped from the week since, or its
 * activity uncommitted — so the label falls back rather than throwing the task away. Dropping it
 * client-side would delete it on the next save, which is the one thing this flow must not do.
 */
export function fromApiTask(
  apiTask: ApiPlanTask,
  roles: PlanRole[],
  dimensions: PlanDimension[]
): Task {
  const isGoal = apiTask.goal_id !== null
  const linkId = String(isGoal ? apiTask.goal_id : apiTask.sharpen_the_saw_activity_id ?? "")

  const role = isGoal ? roles.find(r => r.goals.some(g => g.id === linkId)) : undefined
  const goal = role?.goals.find(g => g.id === linkId)
  const dim = isGoal ? undefined : dimensions.find(d => d.activities.some(a => a.id === linkId))
  const activity = dim?.activities.find(a => a.id === linkId)

  const label = goal && role ? `${role.name} — ${goal.text}`
    : activity && dim ? `${dim.label} — ${activity.text}`
    : "No longer available"

  return {
    id: String(apiTask.task_id),
    taskId: apiTask.task_id,
    title: apiTask.title,
    dayIndex: apiTask.day_of_week,
    startMins: strToMins(apiTask.start_time),
    endMins: strToMins(apiTask.end_time),
    color: goal && role ? goalColor(goal, role) : dim?.color ?? FIXED_COLOR,
    linkType: isGoal ? "role-goal" : "sharpen-the-saw",
    linkId,
    linkLabel: label,
    isDailyPriority: apiTask.is_daily_priority,
    isCompleted: apiTask.is_completed,
  }
}

export function fromApiAppointment(apiAppt: ApiPlanAppointment): Appt {
  return {
    id: String(apiAppt.task_id),
    taskId: apiAppt.task_id,
    title: apiAppt.title,
    description: apiAppt.description ?? "",
    dayIndex: apiAppt.day_of_week,
    startMins: strToMins(apiAppt.start_time),
    endMins: strToMins(apiAppt.end_time),
    isCompleted: apiAppt.is_completed,
  }
}

export function toAppointmentsPayload(appts: Appt[]) {
  return appts.map(a => ({
    ...(a.taskId === undefined ? {} : { task_id: a.taskId }),
    title: a.title,
    description: a.description,
    day_of_week: a.dayIndex,
    start_time: minsToStr(a.startMins),
    end_time: minsToStr(a.endMins),
  }))
}

export function toTasksPayload(tasks: Task[]) {
  return tasks.map(t => ({
    ...(t.taskId === undefined ? {} : { task_id: t.taskId }),
    title: t.title,
    day_of_week: t.dayIndex,
    start_time: minsToStr(t.startMins),
    end_time: minsToStr(t.endMins),
    goal_id: t.linkType === "role-goal" ? t.linkId : null,
    sharpen_the_saw_activity_id: t.linkType === "sharpen-the-saw" ? t.linkId : null,
    is_daily_priority: t.isDailyPriority,
  }))
}

/**
 * Whether the calendar on screen differs from the week as the server last confirmed it.
 *
 * Compared through the save payloads rather than through the state itself, because those are
 * exactly the fields a save sends: anything the two agree on is a save that would write nothing.
 * It also keeps the two fields that are not the calendar's to own out of the comparison — the
 * client-only `id`, regenerated on every add, and `isCompleted`, which /dashboard writes.
 */
export function isScheduleDirty(
  current: { appts: Appt[]; tasks: Task[] },
  saved: { appts: Appt[]; tasks: Task[] }
): boolean {
  const payload = (s: { appts: Appt[]; tasks: Task[] }) =>
    JSON.stringify([toAppointmentsPayload(s.appts), toTasksPayload(s.tasks)])

  return payload(current) !== payload(saved)
}
