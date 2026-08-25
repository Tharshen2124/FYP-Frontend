import { SHARPEN_THE_SAW_DIMENSIONS } from "@/lib/sharpen-the-saw-dimensions"
import type { ApiRole } from "@/lib/api"
import type { CategoryItem } from "../_types"

export const FIXED_ID = "fixed-appointments"
export const STS_PARENT_ID = "sharpen-the-saw"
export const ROLES_PARENT_ID = "role-tasks"

/** Top level in the order the card renders them; children hang off the two parents. */
export const TOP_LEVEL_ORDER = [FIXED_ID, STS_PARENT_ID, ROLES_PARENT_ID]

export const dimensionCategoryId = (dimensionId: string) => `saw-${dimensionId}`

/**
 * Keyed on `role_id`, never on the name. A slug built from the name breaks the moment a role is
 * renamed — which is precisely the thing this feature has to survive, since the saved preference
 * outlives any particular spelling of a role.
 */
export const roleCategoryId = (roleId: number) => `role-${roleId}`

/**
 * The tree, built from the user's real roles rather than a constant.
 *
 * This was hard-coded — four invented role names — and could not be, once the selection had to
 * mean something to the server. Dimensions come from the same list the rest of the app renders
 * from, so a child's id is now the canonical `saw-social` rather than a slug of the display label.
 */
export function buildCategories(roles: ApiRole[]): CategoryItem[] {
  return [
    { id: FIXED_ID, label: "Fixed Appointments" },
    { id: STS_PARENT_ID, label: "Sharpen the Saw Activities" },
    ...SHARPEN_THE_SAW_DIMENSIONS.map(d => ({
      id: dimensionCategoryId(d.id),
      label: d.label,
      parentId: STS_PARENT_ID,
      dimensionId: d.id,
    })),
    { id: ROLES_PARENT_ID, label: "Role Tasks" },
    ...roles.map(role => ({
      id: roleCategoryId(role.role_id),
      label: `${role.name} Tasks`,
      parentId: ROLES_PARENT_ID,
      roleId: role.role_id,
    })),
  ]
}
