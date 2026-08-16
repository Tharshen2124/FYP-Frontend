import type { ElementType } from "react"
import { Users } from "lucide-react"
import { ROLE_COLORS, ROLE_ICONS } from "../_constants/roles"
import type { Role } from "../_types"

/**
 * Icon lookup built once at module load — components must not be produced by a
 * function call during render (react-hooks/static-components).
 */
export const ROLE_ICON_BY_ID: Record<string, ElementType> = Object.fromEntries(
  ROLE_ICONS.map(i => [i.id, i.icon])
)

export const FALLBACK_ROLE_ICON: ElementType = Users

export function getColor(colorId: string): string {
  return ROLE_COLORS.find(c => c.id === colorId)?.value ?? "#B13BFF"
}

export function countGoals(roles: Role[]): number {
  return roles.reduce((sum, role) => sum + role.goals.length, 0)
}
