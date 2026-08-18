import type { ApiActivity, ApiRole, LinkType, ModalState, Task } from "../_types"
import { DIMENSION_META } from "../_constants/dimensions"
import { minsToStr, strToMins } from "./time"

type ActivitiesByDimension = Record<string, ApiActivity[]>

export function getLinkMeta(
  modal: Pick<ModalState, "linkType" | "selectedRoleId" | "selectedGoalId" | "selectedDimensionId" | "selectedActivityId">,
  roles: ApiRole[],
  activitiesByDimension: ActivitiesByDimension
): { id: string; label: string } | null {
  if (modal.linkType === "role-goal") {
    const role = roles.find(r => r.id === modal.selectedRoleId)
    const goal = role?.goals.find(g => g.id === modal.selectedGoalId)
    if (!role || !goal) return null
    return { id: goal.id, label: `${role.name} — ${goal.text}` }
  }

  const dim = DIMENSION_META.find(d => d.id === modal.selectedDimensionId)
  const act = (activitiesByDimension[modal.selectedDimensionId] ?? []).find(a => a.id === modal.selectedActivityId)
  if (!dim || !act) return null
  return { id: act.id, label: `${dim.label} — ${act.text}` }
}

function resolveLinkLabel(linkType: LinkType, linkId: string, roles: ApiRole[], activitiesByDimension: ActivitiesByDimension): string {
  if (linkType === "role-goal") {
    for (const role of roles) {
      const goal = role.goals.find(g => g.id === linkId)
      if (goal) return `${role.name} — ${goal.text}`
    }
    return "Unknown goal"
  }

  for (const dim of DIMENSION_META) {
    const act = (activitiesByDimension[dim.id] ?? []).find(a => a.id === linkId)
    if (act) return `${dim.label} — ${act.text}`
  }
  return "Unknown activity"
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

  return {
    id: String(apiTask.task_id),
    title: apiTask.title,
    dayIndex: apiTask.day_of_week,
    startMins: strToMins(apiTask.start_time),
    endMins: strToMins(apiTask.end_time),
    linkType,
    linkId,
    linkLabel: resolveLinkLabel(linkType, linkId, roles, activitiesByDimension),
    isDailyPriority: apiTask.is_daily_priority,
  }
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
