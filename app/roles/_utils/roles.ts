import type { ElementType } from "react"
import { Users } from "lucide-react"
import type { ApiArchivedRole, ApiArchivePreview, ApiRole } from "@/lib/api"
import { getColor } from "@/lib/role-colors"
import { DEFAULT_COLOR_ID, DEFAULT_ICON_ID, ROLE_ICONS } from "../_constants/roles"
import type { ArchivedRole, ArchivePreview, Role } from "../_types"

/**
 * Icon lookup built once at module load — components must not be produced by a
 * function call during render (react-hooks/static-components).
 */
export const ROLE_ICON_BY_ID: Record<string, ElementType> = Object.fromEntries(
  ROLE_ICONS.map(i => [i.id, i.icon])
)

export const FALLBACK_ROLE_ICON: ElementType = Users

export { getColor }

export function countGoals(roles: Role[]): number {
  return roles.reduce((sum, role) => sum + role.goals.length, 0)
}

/**
 * The API speaks snake_case and numeric ids; the page speaks camelCase and strings. Icon and
 * colour are nullable server-side (roles predate both), so they fall back to the defaults.
 */
export function fromApiRole(role: ApiRole): Role {
  return {
    id: String(role.role_id),
    name: role.name,
    iconId: role.icon_id ?? DEFAULT_ICON_ID,
    colorId: role.color_id ?? DEFAULT_COLOR_ID,
    goals: role.goals.map(g => ({
      id: String(g.goal_id),
      text: g.text,
      isWeeklyPriority: g.is_weekly_priority,
      isCompleted: g.is_completed,
    })),
  }
}

export function fromApiArchivedRole(role: ApiArchivedRole): ArchivedRole {
  return {
    id: String(role.role_id),
    name: role.name,
    iconId: role.icon_id ?? DEFAULT_ICON_ID,
    colorId: role.color_id ?? DEFAULT_COLOR_ID,
    deletedAt: role.deleted_at,
  }
}

export function fromApiPreview(preview: ApiArchivePreview): ArchivePreview {
  return {
    goals: preview.goals,
    incompleteTasks: preview.incomplete_tasks,
    completedTasks: preview.completed_tasks,
  }
}

export function plural(count: number, word: string): string {
  return count === 1 ? word : `${word}s`
}
