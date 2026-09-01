import type { ElementType } from "react"
import { Users } from "lucide-react"
import { getColor } from "@/lib/role-colors"
import { ROLE_ICONS } from "../_constants/roles"
import type { Role } from "../_types"

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

/** Shapes local role/goal state into the snake_case payload the backend expects. */
export function toRolesPayload(roles: Role[]) {
  return {
    roles: roles.map(role => ({
      name: role.name,
      icon_id: role.iconId,
      color_id: role.colorId,
      goals: role.goals.map(goal => ({
        text: goal.text,
        is_weekly_priority: !!goal.isWeeklyPriority,
      })),
    })),
  }
}
